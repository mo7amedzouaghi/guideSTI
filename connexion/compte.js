/* Comptes STI (élèves et enseignants), enregistrés dans le navigateur de cet appareil.
   Inclus dans le <head> des pages protégées :
     <script src="../connexion/compte.js" data-acces="prof"></script>   (Espace Prof : enseignants)
     <script src="../connexion/compte.js" data-acces="eleve"></script>  (Espace Élèves : élèves et enseignants)
   Sans session valide, la page redirige vers la connexion. */
(function () {
  "use strict";

  // Empreinte SHA-256 du code enseignant demandé à l'inscription d'un professeur.
  // Pour changer le code : remplacer cette valeur par l'empreinte SHA-256 du nouveau code.
  var CODE_ENSEIGNANT_SHA256 = "a84e0b684be9b3ae2d49f112445f50388678a3e593c292620f60074b003b94e6";

  var script = document.currentScript;
  var BASE = script ? script.src.replace(/compte\.js(\?.*)?$/, "") : "../connexion/";
  var acces = script ? script.getAttribute("data-acces") : null;

  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function effacer(k) { try { localStorage.removeItem(k); } catch (e) { /* ignoré */ } }

  function comptes() { try { return JSON.parse(lire("sti-comptes") || "{}"); } catch (e) { return {}; } }
  function session() {
    var s = null;
    try { s = JSON.parse(lire("sti-session") || "null"); } catch (e) { s = null; }
    if (!s || !comptes()[s.id]) return null;
    return s;
  }

  async function empreinte(texte) {
    var octets = new TextEncoder().encode(texte);
    var h = await crypto.subtle.digest("SHA-256", octets);
    return Array.from(new Uint8Array(h)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  function accueilDe(s) {
    var racine = BASE.replace(/connexion\/$/, "");
    if (!s) return BASE;
    return s.role === "prof" ? racine + "prof/index.html" : racine + "eleves/" + (s.niveau ? "n" + s.niveau + ".html" : "index.html");
  }

  /* ------------------------------------------------ API */
  window.CompteSTI = {
    session: session,
    accueilDe: accueilDe,
    async inscrire(d) {
      var c = comptes();
      var id = String(d.identifiant || "").trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,30}$/.test(id)) throw new Error("L'identifiant doit contenir 3 à 30 caractères : lettres sans accent, chiffres, point, tiret.");
      if (c[id]) throw new Error("Cet identifiant est déjà utilisé sur cet appareil. Choisissez-en un autre ou connectez-vous.");
      if (String(d.mdp || "").length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
      if (d.role === "prof") {
        if ((await empreinte(String(d.code || "").trim())) !== CODE_ENSEIGNANT_SHA256) throw new Error("Code enseignant incorrect.");
      }
      c[id] = { prenom: d.prenom, nom: d.nom, role: d.role === "prof" ? "prof" : "eleve", niveau: d.role === "prof" ? null : d.niveau,
                classe: d.classe || "", h: await empreinte(id + ":" + d.mdp), cree: new Date().toISOString().slice(0, 10) };
      if (!ecrire("sti-comptes", JSON.stringify(c))) throw new Error("Impossible d'enregistrer le compte : le stockage du navigateur est désactivé.");
      return this.connecter(id, d.mdp);
    },
    async connecter(identifiant, mdp) {
      var id = String(identifiant || "").trim().toLowerCase(), c = comptes()[id];
      if (!c || c.h !== (await empreinte(id + ":" + mdp))) throw new Error("Identifiant ou mot de passe incorrect.");
      var s = { id: id, prenom: c.prenom, nom: c.nom, role: c.role, niveau: c.niveau, classe: c.classe };
      ecrire("sti-session", JSON.stringify(s));
      return s;
    },
    deconnecter() { effacer("sti-session"); location.href = BASE; },
  };
  // clé de stockage propre au compte (progression, bac à sable…)
  window.cleSTI = function (k) { var s = session(); return s ? k + "@" + s.id : k; };

  /* ------------------------------------------------ garde d'accès */
  if (acces) {
    var s = session();
    var suite = "?suite=" + encodeURIComponent(location.pathname + location.search + location.hash);
    if (!s) { location.replace(BASE + suite); return; }
    if (acces === "prof" && s.role !== "prof") { location.replace(accueilDe(s)); return; }
    // en-tête : prénom, rôle, déconnexion
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
