/* Gestion des comptes (enseignants) : modifier, désactiver, réinitialiser le mot de passe, supprimer, actions groupées. */
(function () {
  "use strict";
  var zone = document.getElementById("g-zone");
  var C = window.CompteSTI;
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }

  if (!C || !C.enLigne) {
    zone.innerHTML = '<div class="s-info"><h2>Gestion disponible avec les comptes en ligne</h2><p>En mode local, chaque compte reste dans le navigateur de l\'appareil où il a été créé : il ne peut pas être géré d\'ici.</p></div>';
    return;
  }

  var moi = C.session() || {};
  var TOUS = [], sel = {}, edition = null;
  var F = { role: lire("sti-g-role") || "eleve", n: lire("sti-g-n") || "", classe: "", statut: "", q: "" };

  function info(msg, ko) {
    var p = document.getElementById("g-msg");
    if (!p) return;
    p.textContent = msg; p.className = "g-msg" + (ko ? " ko" : ""); p.hidden = !msg;
    clearTimeout(info.t); if (msg && !ko) info.t = setTimeout(function () { p.hidden = true; }, 5000);
  }
  function echec(e) { info(e && e.code === "permission-denied" ? "Action refusée par la base : republiez les règles Firestore (connexion/firestore.rules)." : "L'action n'a pas abouti. Vérifiez la connexion Internet et réessayez.", true); }

  function charger(msg) {
    C.comptes().then(function (l) { TOUS = l; sel = {}; edition = null; rendre(); if (msg) info(msg); })
      .catch(function (e) {
        zone.innerHTML = '<div class="s-info ko"><h2>Comptes inaccessibles</h2><p>' + (e && e.code === "permission-denied"
          ? "La base refuse l'accès : vérifiez que les règles Firestore sont publiées et que votre compte est un compte enseignant actif."
          : "Vérifiez la connexion Internet puis rechargez la page.") + "</p></div>";
      });
  }

  function liste() {
    return TOUS.filter(function (c) {
      if (c.role !== F.role) return false;
      if (F.role === "eleve" && F.n && String(c.niveau) !== F.n) return false;
      if (F.role === "eleve" && F.classe && (c.classe || "") !== F.classe) return false;
      if (F.statut === "actif" && !c.actif) return false;
      if (F.statut === "inactif" && c.actif) return false;
      if (F.q && (c.prenom + " " + c.nom + " " + c.identifiant).toLowerCase().indexOf(F.q.toLowerCase()) < 0) return false;
      return true;
    }).sort(function (a, b) {
      return (a.niveau || 0) - (b.niveau || 0) || (a.classe || "").localeCompare(b.classe || "") || a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr");
    });
  }
  function date(d) { return d ? d.toLocaleDateString("fr-FR") : "–"; }
  function choixNiveau(v, id) {
    return '<select id="' + id + '">' + ["2", "3", "4"].map(function (n) { return '<option value="' + n + '"' + (String(v) === n ? " selected" : "") + ">" + n + "ème</option>"; }).join("") + "</select>";
  }

  function rendre() {
    var L = liste(), eleves = F.role === "eleve";
    var nbE = TOUS.filter(function (c) { return c.role === "eleve"; }).length, nbP = TOUS.length - nbE;
    var classes = Array.from(new Set(TOUS.filter(function (c) { return c.role === "eleve" && (!F.n || String(c.niveau) === F.n); }).map(function (c) { return c.classe || ""; }))).filter(Boolean).sort();
    if (F.classe && classes.indexOf(F.classe) < 0) F.classe = "";
    var nbSel = Object.keys(sel).length;

    var h = '<div class="puces g-roles"><button type="button" data-r="eleve" aria-pressed="' + eleves + '">Élèves (' + nbE + ')</button><button type="button" data-r="prof" aria-pressed="' + !eleves + '">Enseignants (' + nbP + ")</button></div>" +
      '<div class="filtres s-filtres">' +
      (eleves ? '<label>Niveau <select id="g-n"><option value="">Tous</option>' + ["2", "3", "4"].map(function (n) { return '<option value="' + n + '"' + (n === F.n ? " selected" : "") + ">" + n + "ème année</option>"; }).join("") + "</select></label>" +
        '<label>Classe <select id="g-classe"><option value="">Toutes</option>' + classes.map(function (c) { return "<option" + (c === F.classe ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select></label>" : "") +
      '<label>Statut <select id="g-statut"><option value="">Tous</option><option value="actif"' + (F.statut === "actif" ? " selected" : "") + '>Actifs</option><option value="inactif"' + (F.statut === "inactif" ? " selected" : "") + ">Désactivés</option></select></label>" +
      '<input type="search" id="g-q" placeholder="Rechercher" value="' + esc(F.q) + '" aria-label="Rechercher un compte">' +
      '<button type="button" class="btn-sec" id="g-csv">Exporter (Excel)</button></div>' +
      '<p class="g-msg" id="g-msg" role="status" hidden></p>';

    if (eleves && nbSel) {
      h += '<div class="g-lot" role="region" aria-label="Actions sur la sélection"><b>' + nbSel + " élève" + (nbSel > 1 ? "s" : "") + " sélectionné" + (nbSel > 1 ? "s" : "") + "</b>" +
        '<span class="g-lot-champs"><label>Niveau <select id="l-n"><option value="">Inchangé</option><option value="2">2ème</option><option value="3">3ème</option><option value="4">4ème</option></select></label>' +
        '<label>Classe <input type="text" id="l-classe" placeholder="Inchangée" size="8"></label><button type="button" class="btn-sec" id="l-appliquer">Appliquer</button></span>' +
        '<button type="button" class="btn-sec" id="l-off">Désactiver</button><button type="button" class="btn-sec" id="l-on">Réactiver</button>' +
        '<button type="button" class="btn-sec g-danger" id="l-suppr">Supprimer</button><button type="button" class="btn-lien" id="l-aucun">Tout désélectionner</button></div>';
    }

    if (!L.length) {
      h += '<div class="s-info"><p>Aucun compte ne correspond à ces filtres.</p>' + (eleves && !nbE ? '<p>Adresse d\'inscription à donner aux élèves :</p><p class="s-lien"><code>' + esc(new URL("../connexion/inscription.html", location.href).href) + "</code></p>" : "") + "</div>";
    } else {
      h += '<div class="tableau-wrap s-wrap"><table class="s-table g-table"><thead><tr>' +
        (eleves ? '<th scope="col"><input type="checkbox" id="g-tous" aria-label="Tout sélectionner"' + (L.every(function (c) { return sel[c.uid]; }) ? " checked" : "") + "></th>" : "") +
        '<th scope="col">Nom et prénom</th>' + (eleves ? '<th scope="col">Niveau</th><th scope="col">Classe</th>' : "") +
        '<th scope="col">Inscrit le</th><th scope="col">Statut</th><th scope="col">Actions</th></tr></thead><tbody>' +
        L.map(function (c) {
          var vous = c.uid === moi.uid;
          if (edition === c.uid) {
            return '<tr class="g-edit"><td></td><td><input type="text" id="e-nom" value="' + esc(c.nom) + '" aria-label="Nom" size="12"> <input type="text" id="e-prenom" value="' + esc(c.prenom) + '" aria-label="Prénom" size="12"><small>' + esc(c.identifiant) + "</small></td>" +
              "<td>" + choixNiveau(c.niveau, "e-n") + '</td><td><input type="text" id="e-classe" value="' + esc(c.classe) + '" aria-label="Classe" size="7"></td><td>' + date(c.creeLe) + "</td><td></td>" +
              '<td><div class="g-actions"><button type="button" class="btn-mini prim" data-a="enregistrer" data-uid="' + c.uid + '">Enregistrer</button><button type="button" class="btn-mini" data-a="annuler">Annuler</button></div></td></tr>';
          }
          return '<tr class="' + (c.actif ? "" : "g-off") + '">' +
            (eleves ? '<td><input type="checkbox" class="g-sel" data-uid="' + c.uid + '"' + (sel[c.uid] ? " checked" : "") + ' aria-label="Sélectionner ' + esc(c.prenom + " " + c.nom) + '"></td>' : "") +
            '<th scope="row">' + esc(c.nom) + " " + esc(c.prenom) + "<small>" + esc(c.identifiant) + "</small></th>" +
            (eleves ? "<td>" + (c.niveau ? c.niveau + "ème" : "–") + "</td><td>" + esc(c.classe || "–") + "</td>" : "") +
            "<td>" + date(c.creeLe) + "</td>" +
            '<td><span class="g-statut ' + (c.actif ? "on" : "off") + '">' + (c.actif ? "Actif" : "Désactivé") + "</span></td>" +
            '<td><div class="g-actions">' + (vous ? '<a class="btn-mini" href="../connexion/mon-compte.html">Mon compte</a>' :
              (eleves ? '<button type="button" class="btn-mini" data-a="modifier" data-uid="' + c.uid + '">Modifier</button>' : "") +
              '<button type="button" class="btn-mini" data-a="' + (c.actif ? "off" : "on") + '" data-uid="' + c.uid + '">' + (c.actif ? "Désactiver" : "Réactiver") + "</button>" +
              (eleves ? '<button type="button" class="btn-mini" data-a="mdp" data-uid="' + c.uid + '" title="Mot de passe oublié">Mot de passe</button>' +
                '<button type="button" class="btn-mini g-danger" data-a="suppr" data-uid="' + c.uid + '">Supprimer</button>' : "")) +
            "</div></td></tr>";
        }).join("") + "</tbody></table></div>";
    }
    h += '<details class="g-aide"><summary>Comment ça marche ?</summary><ul>' +
      "<li><b>Désactiver</b> : l'élève ne peut plus se connecter ; son compte et ses scores restent. <b>Réactiver</b> le rétablit.</li>" +
      "<li><b>Mot de passe</b> (oubli) : le compte est libéré, les scores sont gardés. L'élève refait l'inscription avec <b>le même identifiant</b> et un nouveau mot de passe : il retrouve sa progression.</li>" +
      "<li><b>Supprimer</b> : efface le profil et tous les scores. L'identifiant redevient libre.</li>" +
      "<li><b>Rentrée</b> : sélectionnez une classe entière, choisissez le nouveau niveau et la nouvelle classe, puis « Appliquer ».</li>" +
      "<li>Chacun peut changer son propre mot de passe depuis « Mon compte » (clic sur son prénom en haut de page).</li></ul></details>";
    zone.innerHTML = h;
    brancher(L);
  }

  function par(uid) { return TOUS.filter(function (c) { return c.uid === uid; })[0]; }
  function nomDe(c) { return c.prenom + " " + c.nom; }

  function brancher(L) {
    zone.querySelectorAll(".g-roles button").forEach(function (b) { b.addEventListener("click", function () { F.role = b.dataset.r; ecrire("sti-g-role", F.role); sel = {}; edition = null; rendre(); }); });
    var on = function (id, ev, f) { var el = document.getElementById(id); if (el) el.addEventListener(ev, f); };
    on("g-n", "change", function () { F.n = this.value; ecrire("sti-g-n", F.n); rendre(); });
    on("g-classe", "change", function () { F.classe = this.value; rendre(); });
    on("g-statut", "change", function () { F.statut = this.value; rendre(); });
    on("g-q", "input", function () { F.q = this.value; var p = this.selectionStart; rendre(); var q = document.getElementById("g-q"); q.focus(); q.setSelectionRange(p, p); });
    on("g-csv", "click", function () { exporter(L); });
    on("g-tous", "change", function () { var v = this.checked; L.forEach(function (c) { if (v) sel[c.uid] = true; else delete sel[c.uid]; }); rendre(); });
    zone.querySelectorAll(".g-sel").forEach(function (x) { x.addEventListener("change", function () { if (x.checked) sel[x.dataset.uid] = true; else delete sel[x.dataset.uid]; rendre(); }); });

    // actions groupées
    var choisis = function () { return Object.keys(sel).map(par).filter(Boolean); };
    on("l-aucun", "click", function () { sel = {}; rendre(); });
    on("l-appliquer", "click", function () {
      var n = document.getElementById("l-n").value, cl = document.getElementById("l-classe").value.trim().toUpperCase();
      if (!n && !cl) { info("Choisissez un niveau ou saisissez une classe.", true); return; }
      var champs = {}; if (n) champs.niveau = Number(n); if (cl) champs.classe = cl.slice(0, 20);
      groupe(choisis(), champs, "Modification enregistrée.");
    });
    on("l-off", "click", function () { groupe(choisis(), { actif: false }, "Comptes désactivés."); });
    on("l-on", "click", function () { groupe(choisis(), { actif: true }, "Comptes réactivés."); });
    on("l-suppr", "click", function () {
      var l = choisis();
      if (!confirm("Supprimer définitivement " + l.length + " compte(s) et tous leurs scores ?")) return;
      C.supprimer(l).then(function () { charger(l.length + " compte(s) supprimé(s)."); }).catch(echec);
    });

    // actions par ligne
    zone.querySelectorAll("[data-a]").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = par(b.dataset.uid), a = b.dataset.a;
        if (a === "annuler") { edition = null; rendre(); return; }
        if (a === "modifier") { edition = c.uid; rendre(); var e = document.getElementById("e-nom"); if (e) e.focus(); return; }
        b.disabled = true;
        if (a === "enregistrer") {
          var champs = { nom: document.getElementById("e-nom").value.trim().slice(0, 40), prenom: document.getElementById("e-prenom").value.trim().slice(0, 40),
                         niveau: Number(document.getElementById("e-n").value), classe: document.getElementById("e-classe").value.trim().toUpperCase().slice(0, 20) };
          if (champs.nom.length < 2 || champs.prenom.length < 2) { info("Le nom et le prénom doivent contenir au moins 2 caractères.", true); b.disabled = false; return; }
          groupe([c], champs, "Compte de " + champs.prenom + " " + champs.nom + " modifié.");
        } else if (a === "off" || a === "on") {
          groupe([c], { actif: a === "on" }, nomDe(c) + (a === "on" ? " peut de nouveau se connecter." : " ne peut plus se connecter."));
        } else if (a === "mdp") {
          if (!confirm("Mot de passe oublié de " + nomDe(c) + " ?\n\nLe compte est libéré (ses scores sont gardés). " + c.prenom + " refait l'inscription avec le même identifiant « " + c.identifiant + " » et un nouveau mot de passe.")) { b.disabled = false; return; }
          C.reinitialiser([c]).then(function () { charger(nomDe(c) + " peut se réinscrire avec l'identifiant « " + c.identifiant + " »."); }).catch(function (e) { b.disabled = false; echec(e); });
        } else if (a === "suppr") {
          if (!confirm("Supprimer définitivement le compte de " + nomDe(c) + " et tous ses scores ?")) { b.disabled = false; return; }
          C.supprimer([c]).then(function () { charger("Compte de " + nomDe(c) + " supprimé."); }).catch(function (e) { b.disabled = false; echec(e); });
        }
      });
    });
  }

  function groupe(comptes, champs, msg) {
    if (!comptes.length) return;
    // « actif » toujours fourni (exigé par les règles, y compris pour les comptes créés avant cette version)
    var lots = {};
    comptes.forEach(function (c) {
      var ch = Object.assign({}, champs);
      if (!("actif" in ch)) ch.actif = c.actif;
      var k = JSON.stringify(ch);
      (lots[k] = lots[k] || { ch: ch, uids: [] }).uids.push(c.uid);
    });
    Promise.all(Object.keys(lots).map(function (k) { return C.modifierComptes(lots[k].uids, lots[k].ch); }))
      .then(function () { charger(msg); }).catch(function (e) { charger(); setTimeout(function () { echec(e); }, 300); });
  }

  function exporter(L) {
    var cel = function (v) { v = String(v == null ? "" : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var t = [["Nom", "Prénom", "Identifiant", "Rôle", "Niveau", "Classe", "Inscrit le", "Statut"]];
    L.forEach(function (c) { t.push([c.nom, c.prenom, c.identifiant, c.role === "prof" ? "Enseignant" : "Élève", c.niveau || "", c.classe || "", date(c.creeLe), c.actif ? "Actif" : "Désactivé"]); });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + t.map(function (r) { return r.map(cel).join(";"); }).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.download = "comptes-" + (F.role === "prof" ? "enseignants" : "eleves" + (F.n ? "-" + F.n + "eme" : "") + (F.classe ? "-" + F.classe : "")) + ".csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  zone.innerHTML = '<p class="s-chargement">Chargement des comptes…</p>';
  C.pret.then(function (s) { moi = s || moi; charger(); });
})();
