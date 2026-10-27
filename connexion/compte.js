/* Comptes STI (élèves et enseignants).
   Deux modes :
   - EN LIGNE (Firebase) si connexion/config.js contient la configuration du projet Firebase :
     comptes valables sur tous les appareils, scores remontés à l'enseignant (page Suivi des élèves).
   - LOCAL sinon : comptes enregistrés dans le navigateur de l'appareil.
   Inclus dans le <head> des pages protégées, après config.js :
     <script src="../connexion/config.js"></script>
     <script src="../connexion/compte.js" data-acces="prof"></script>   (Espace Prof : enseignants)
     <script src="../connexion/compte.js" data-acces="eleve"></script>  (Espace Élèves : élèves et enseignants) */
(function () {
  "use strict";

  // Empreinte SHA-256 du code enseignant (vérification rapide côté page).
  // En mode en ligne, le vrai contrôle est fait par les règles Firestore (connexion/firestore.rules).
  var CODE_ENSEIGNANT_SHA256 = "a84e0b684be9b3ae2d49f112445f50388678a3e593c292620f60074b003b94e6";

  var script = document.currentScript;
  var BASE = script ? script.src.replace(/compte\.js(\?.*)?$/, "") : "../connexion/";
  var acces = script ? script.getAttribute("data-acces") : null;
  var CFG = window.STI_FIREBASE || {};
  var EN_LIGNE = !!(CFG.apiKey && CFG.projectId);

  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function effacer(k) { try { localStorage.removeItem(k); } catch (e) { /* ignoré */ } }

  function comptesLocaux() { try { return JSON.parse(lire("sti-comptes") || "{}"); } catch (e) { return {}; } }
  function sessionCache() { try { return JSON.parse(lire("sti-session") || "null"); } catch (e) { return null; } }
  function session() {
    var s = sessionCache();
    if (!s || !s.id) return null;
    if (!EN_LIGNE && !comptesLocaux()[s.id]) return null;
    if (EN_LIGNE && !s.uid) return null;
    return s;
  }
  function memoriser(s) { ecrire("sti-session", JSON.stringify(s)); return s; }

  async function empreinte(texte) {
    var h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
    return Array.from(new Uint8Array(h)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  function accueilDe(s) {
    var racine = BASE.replace(/connexion\/$/, "");
    if (!s) return BASE;
    return s.role === "prof" ? racine + "prof/index.html" : racine + "eleves/" + (s.niveau ? "n" + s.niveau + ".html" : "index.html");
  }
  function normId(x) { return String(x || "").trim().toLowerCase(); }
  function verifierChamps(d) {
    var id = normId(d.identifiant);
    if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(id)) throw new Error("L'identifiant doit contenir 3 à 30 caractères : lettres sans accent, chiffres, point, tiret (commencer par une lettre ou un chiffre).");
    if (String(d.mdp || "").length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
    return id;
  }
  async function verifierCode(d) {
    if (d.role === "prof" && (await empreinte(String(d.code || "").trim())) !== CODE_ENSEIGNANT_SHA256) throw new Error("Code enseignant incorrect.");
  }
  function cleScore(s, n, c) { return "sti-score-" + n + "-" + c + "@" + s.id; }

  /* ================================================== mode en ligne (Firebase) */
  var fb = null;          // { auth, db, FieldValue }
  var pret;               // promesse : session vérifiée (ou null)

  function chargerSDK() {
    return new Promise(function (ok, ko) {
      var fichiers = ["firebase-app-compat.js", "firebase-auth-compat.js", "firebase-firestore-compat.js"], reste = fichiers.length;
      fichiers.forEach(function (f) {
        var el = document.createElement("script");
        el.src = BASE + "vendor/" + f;
        el.async = false;
        el.onload = function () { if (--reste === 0) ok(); };
        el.onerror = function () { ko(new Error("Chargement de Firebase impossible.")); };
        document.head.appendChild(el);
      });
    });
  }

  function messageFirebase(e, role) {
    var c = (e && e.code) || "";
    if (c === "auth/email-already-in-use") return "Cet identifiant est déjà utilisé. Choisissez-en un autre ou connectez-vous.";
    if (/auth\/(invalid-credential|invalid-login-credentials|wrong-password|user-not-found|invalid-email)/.test(c)) return "Identifiant ou mot de passe incorrect.";
    if (c === "auth/too-many-requests") return "Trop d'essais. Patientez quelques minutes avant de réessayer.";
    if (c === "auth/network-request-failed" || c === "unavailable") return "Pas de connexion Internet. Vérifiez le réseau et réessayez.";
    if (c === "auth/weak-password") return "Le mot de passe doit contenir au moins 6 caractères.";
    if (c === "auth/operation-not-allowed") return "La connexion par mot de passe n'est pas activée dans Firebase (Authentication → Sign-in method).";
    if (c === "permission-denied") return role === "prof" ? "Code enseignant incorrect." : "Accès refusé par la base de données (règles Firestore à publier).";
    return (e && e.message) || "Erreur inattendue.";
  }

  async function profilDepuisBase(u) {
    var doc = await fb.db.collection("comptes").doc(u.uid).get();
    if (!doc.exists) return null;
    var p = doc.data();
    return { id: p.identifiant, uid: u.uid, prenom: p.prenom, nom: p.nom, role: p.role, niveau: p.niveau || null, classe: p.classe || "" };
  }

  // scores du compte : base → appareil (progression retrouvée sur chaque appareil)
  async function rapatrierScores(s) {
    if (s.role !== "eleve") return;
    try {
      var r = await fb.db.collection("scores").where("uid", "==", s.uid).get();
      r.forEach(function (d) {
        var x = d.data(), k = cleScore(s, x.n, x.c), local = Number(lire(k));
        if (lire(k) === null || isNaN(local) || x.meilleur > local) ecrire(k, String(x.meilleur));
      });
    } catch (e) { /* hors ligne : on garde l'appareil */ }
  }

  if (EN_LIGNE) {
    pret = chargerSDK().then(function () {
      var app = firebase.apps.length ? firebase.app() : firebase.initializeApp(CFG);
      fb = { auth: app.auth(), db: app.firestore(), FieldValue: firebase.firestore.FieldValue };
      return new Promise(function (ok) {
        var fini = false;
        fb.auth.onAuthStateChanged(async function (u) {
          if (fini) return;
          fini = true;
          if (!u) { effacer("sti-session"); ok(null); return; }
          var s = session();
          if (s && s.uid === u.uid) { ok(s); return; }
          try {
            var p = await profilDepuisBase(u);
            if (!p) { await fb.auth.signOut(); effacer("sti-session"); ok(null); return; }
            memoriser(p);
            await rapatrierScores(p);
            ok(p);
          } catch (e) { ok(s); }
        });
      });
    }).catch(function () { return session(); });
  } else {
    pret = Promise.resolve(session());
  }

  /* ================================================== API */
  window.CompteSTI = {
    enLigne: EN_LIGNE,
    pret: pret,
    session: session,
    accueilDe: accueilDe,

    async inscrire(d) {
      var id = verifierChamps(d);
      await verifierCode(d);
      var role = d.role === "prof" ? "prof" : "eleve";
      if (!EN_LIGNE) {
        var c = comptesLocaux();
        if (c[id]) throw new Error("Cet identifiant est déjà utilisé sur cet appareil. Choisissez-en un autre ou connectez-vous.");
        c[id] = { prenom: d.prenom, nom: d.nom, role: role, niveau: role === "prof" ? null : d.niveau,
                  classe: d.classe || "", h: await empreinte(id + ":" + d.mdp), cree: new Date().toISOString().slice(0, 10) };
        if (!ecrire("sti-comptes", JSON.stringify(c))) throw new Error("Impossible d'enregistrer le compte : le stockage du navigateur est désactivé.");
        return this.connecter(id, d.mdp);
      }
      await pret;
      var cred;
      try { cred = await fb.auth.createUserWithEmailAndPassword(id + "@" + CFG.authDomain, d.mdp); }
      catch (e) { throw new Error(messageFirebase(e, role)); }
      var profil = { identifiant: id, prenom: d.prenom, nom: d.nom, role: role, niveau: role === "prof" ? null : Number(d.niveau),
                     classe: (d.classe || "").toUpperCase(), cree: fb.FieldValue.serverTimestamp() };
      if (role === "prof") profil.code = String(d.code || "").trim();
      try { await fb.db.collection("comptes").doc(cred.user.uid).set(profil); }
      catch (e) {
        try { await cred.user.delete(); } catch (e2) { await fb.auth.signOut(); }
        throw new Error(messageFirebase(e, role));
      }
      return memoriser({ id: id, uid: cred.user.uid, prenom: profil.prenom, nom: profil.nom, role: role, niveau: profil.niveau, classe: profil.classe });
    },

    async connecter(identifiant, mdp) {
      var id = normId(identifiant);
      if (!EN_LIGNE) {
        var c = comptesLocaux()[id];
        if (!c || c.h !== (await empreinte(id + ":" + mdp))) throw new Error("Identifiant ou mot de passe incorrect.");
        return memoriser({ id: id, prenom: c.prenom, nom: c.nom, role: c.role, niveau: c.niveau, classe: c.classe });
      }
      await pret;
      var cred;
      try { cred = await fb.auth.signInWithEmailAndPassword(id + "@" + CFG.authDomain, mdp); }
      catch (e) { throw new Error(messageFirebase(e)); }
      var p;
      try { p = await profilDepuisBase(cred.user); } catch (e) { throw new Error(messageFirebase(e)); }
      if (!p) { await fb.auth.signOut(); throw new Error("Compte incomplet : refaites l'inscription avec un autre identifiant."); }
      memoriser(p);
      await rapatrierScores(p);
      return p;
    },

    async deconnecter() {
      effacer("sti-session");
      if (EN_LIGNE) { try { await pret; await fb.auth.signOut(); } catch (e) { /* ignoré */ } }
      location.href = BASE;
    },

    // appelé par les exercices à la fin d'un entraînement
    async enregistrerScore(n, c, pc, meilleur) {
      var s = session();
      if (!EN_LIGNE || !s || s.role !== "eleve") return;
      try {
        await pret;
        await fb.db.collection("scores").doc(s.uid + "_" + n + "_" + c).set({
          uid: s.uid, identifiant: s.id, prenom: s.prenom, nom: s.nom, classe: s.classe || "", niveauEleve: s.niveau || null,
          n: Number(n), c: Number(c), dernier: pc, meilleur: Math.max(pc, meilleur || 0),
          essais: fb.FieldValue.increment(1), date: fb.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (e) { /* hors ligne : le score reste sur l'appareil */ }
    },

    // suivi des élèves (enseignants, mode en ligne)
    async suivi() {
      if (!EN_LIGNE) throw new Error("hors-ligne");
      await pret;
      var res = await Promise.all([fb.db.collection("comptes").where("role", "==", "eleve").get(), fb.db.collection("scores").get()]);
      var eleves = [], scores = [];
      res[0].forEach(function (d) { var x = d.data(); x.uid = d.id; eleves.push(x); });
      res[1].forEach(function (d) { scores.push(d.data()); });
      return { eleves: eleves, scores: scores };
    },
    async retirerEleve(uid) {
      await pret;
      var r = await fb.db.collection("scores").where("uid", "==", uid).get();
      var lot = fb.db.batch();
      r.forEach(function (d) { lot.delete(d.ref); });
      lot.delete(fb.db.collection("comptes").doc(uid));
      await lot.commit();
    }
  };
  // clé de stockage propre au compte (progression, bac à sable…)
  window.cleSTI = function (k) { var s = session(); return s ? k + "@" + s.id : k; };

  /* ================================================== garde d'accès */
  if (acces) {
    var s = session();
    var suite = "?suite=" + encodeURIComponent(location.pathname + location.search + location.hash);
    if (!s) { location.replace(BASE + suite); return; }
    if (acces === "prof" && s.role !== "prof") { location.replace(accueilDe(s)); return; }
    // en mode en ligne : confirmation par Firebase (compte supprimé, session expirée…)
    pret.then(function (v) {
      if (!v) location.replace(BASE + suite);
      else if (acces === "prof" && v.role !== "prof") location.replace(accueilDe(v));
    });
    document.addEventListener("DOMContentLoaded", function () {
      var barre = document.querySelector(".barre-in");
      if (!barre) return;
      var bloc = document.createElement("div");
      bloc.className = "compte-bloc";
      bloc.innerHTML = '<span class="compte-nom"></span><button type="button" class="compte-sortir">Déconnexion</button>';
      bloc.querySelector(".compte-nom").textContent = s.prenom + (s.role === "prof" ? " · Enseignant" : s.classe ? " · " + s.classe : s.niveau ? " · " + s.niveau + "ème" : "");
      bloc.querySelector(".compte-sortir").addEventListener("click", function () { window.CompteSTI.deconnecter(); });
      barre.appendChild(bloc);
    });
  }
})();
