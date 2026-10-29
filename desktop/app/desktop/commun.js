/* Outils communs à toutes les pages de la version bureau : identité de l'élève (sans compte),
   fenêtres de dialogue, poste prof sur le réseau, progression. */
(function () {
  "use strict";
  var D = window.stiDesktop;
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  // message lisible d'une erreur renvoyée par le processus principal
  function msg(e) { return String((e && e.message) || e || "Erreur").replace(/^Error invoking remote method '[^']+': (Error: )?/, ""); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  /* ---------- notifications */
  function toast(msg, type) {
    var t = document.createElement("div");
    t.className = "sti-toast " + (type || "");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("vu"); }, 10);
    setTimeout(function () { t.classList.remove("vu"); setTimeout(function () { t.remove(); }, 300); }, 3800);
  }

  /* ---------- fenêtre de dialogue : champs [{id, label, type, valeur, options, requis}] */
  function dialogue(o) {
    return new Promise(function (ok) {
      var fond = document.createElement("div");
      fond.className = "sti-modal-fond";
      fond.innerHTML = '<form class="sti-modal" role="dialog" aria-modal="true"><h2>' + esc(o.titre) + "</h2>" +
        (o.texte ? '<p class="sti-modal-texte">' + o.texte + "</p>" : "") +
        (o.champs || []).map(function (c) {
          var champ = c.type === "select"
            ? '<select id="sm-' + c.id + '">' + c.options.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(c.valeur) ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join("") + "</select>"
            : '<input id="sm-' + c.id + '" type="' + (c.type || "text") + '" value="' + esc(c.valeur || "") + '"' + (c.placeholder ? ' placeholder="' + esc(c.placeholder) + '"' : "") +
              (c.type === "password" ? ' inputmode="numeric" autocomplete="off"' : "") + ">";
          return '<label class="sti-champ"><span>' + esc(c.label) + "</span>" + champ + "</label>";
        }).join("") +
        '<p class="sti-modal-erreur" hidden></p><div class="sti-modal-actions">' +
        (o.annuler === false ? "" : '<button type="button" class="sti-btn sec" data-a="non">' + esc(o.annuler || "Annuler") + "</button>") +
        '<button type="submit" class="sti-btn">' + esc(o.valider || "Valider") + "</button></div></form>";
      document.body.appendChild(fond);
      var form = fond.querySelector("form"), err = fond.querySelector(".sti-modal-erreur");
      var premier = form.querySelector("input,select");
      if (premier) setTimeout(function () { premier.focus(); }, 30);
      function fermer(v) { fond.remove(); ok(v); }
      var b = form.querySelector('[data-a="non"]');
      if (b) b.addEventListener("click", function () { fermer(null); });
      fond.addEventListener("keydown", function (e) { if (e.key === "Escape" && o.annuler !== false) fermer(null); });
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        var v = {};
        (o.champs || []).forEach(function (c) { v[c.id] = form.querySelector("#sm-" + c.id).value.trim(); });
        var manque = (o.champs || []).filter(function (c) { return c.requis && !v[c.id]; });
        if (manque.length) { err.hidden = false; err.textContent = "Champ obligatoire : " + manque[0].label; return; }
        if (o.verifier) {
          try { var r = await o.verifier(v); if (r !== true) { err.hidden = false; err.textContent = r || "Valeur incorrecte."; return; } }
          catch (x) { err.hidden = false; err.textContent = msg(x); return; }
        }
        fermer(v);
      });
    });
  }

  /* ---------- identité de l'élève (aucun compte : nom, prénom, classe, poste) */
  function identite() { try { return JSON.parse(lire("sti-identite") || "null"); } catch (e) { return null; } }
  async function demanderIdentite(obligatoire) {
    var i = identite() || {};
    var v = await dialogue({
      titre: "Qui travaille sur ce poste ?", texte: "Aucune inscription : ces informations servent seulement à nommer ton travail et ta progression.",
      annuler: obligatoire ? false : "Annuler", valider: "Enregistrer",
      champs: [
        { id: "nom", label: "Nom", valeur: i.nom, requis: true },
        { id: "prenom", label: "Prénom", valeur: i.prenom, requis: true },
        { id: "niveau", label: "Niveau", type: "select", valeur: i.niveau || "3", options: [["2", "2ème année"], ["3", "3ème année"], ["4", "4ème année (Bac)"]] },
        { id: "classe", label: "Classe", valeur: i.classe, placeholder: "ex. 4SI1", requis: true },
        { id: "poste", label: "N° du poste", type: "number", valeur: i.poste, requis: true }
      ]
    });
    if (!v) return i.nom ? i : null;
    v.classe = v.classe.toUpperCase();
    ecrire("sti-identite", JSON.stringify(v));
    ecrire("sti-niveau-eleve", v.niveau);
    return v;
  }
  async function exigerIdentite() { var i = identite(); return i && i.nom ? i : demanderIdentite(true); }

  /* ---------- poste prof (ramassage réseau) */
  function posteProf() { return lire("sti-poste-prof") || ""; }
  async function choisirPosteProf() {
    toast("Recherche du poste prof sur le réseau…");
    var trouves = [];
    try { trouves = await D.reseau.chercher(); } catch (e) { trouves = []; }
    var v = await dialogue({
      titre: "Relier ce poste au poste prof",
      texte: trouves.length ? "Poste(s) prof trouvé(s) sur le réseau du labo." : "Aucun poste prof trouvé automatiquement. Vérifie que le ramassage est démarré, ou saisis l'adresse IP affichée sur l'écran du prof.",
      valider: "Relier",
      champs: trouves.length
        ? [{ id: "ip", label: "Poste prof", type: "select", valeur: trouves[0].ip, options: trouves.map(function (t) { return [t.ip, t.nom + (t.classe ? " · " + t.classe : "") + " (" + t.ip + ")"]; }).concat([["", "Autre adresse…"]]) }, { id: "autre", label: "Autre adresse IP (facultatif)", valeur: "", placeholder: "192.168.1.10" }]
        : [{ id: "autre", label: "Adresse IP du poste prof", valeur: posteProf(), placeholder: "192.168.1.10", requis: true }],
      verifier: async function (x) {
        var ip = x.autre || x.ip;
        if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return "Adresse IP invalide.";
        await D.reseau.tester(ip);
        return true;
      }
    });
    if (!v) return null;
    var ip = v.autre || v.ip;
    ecrire("sti-poste-prof", ip);
    toast("Poste relié au prof (" + ip + ")", "ok");
    return ip;
  }
  async function exigerPosteProf() {
    var ip = posteProf();
    if (ip) { try { await D.reseau.tester(ip); return ip; } catch (e) { /* on recherche à nouveau */ } }
    return choisirPosteProf();
  }

  /* ---------- progression de l'Espace Élèves */
  function progression(id) {
    var scores = [];
    try {
      Object.keys(localStorage).forEach(function (k) {
        var m = /^sti-score-(\d)-(\d+)$/.exec(k);
        if (m) scores.push({ n: Number(m[1]), c: Number(m[2]), meilleur: Number(localStorage.getItem(k)), essais: Number(localStorage.getItem("sti-essais-" + m[1] + "-" + m[2])) || 1 });
      });
    } catch (e) { /* ignoré */ }
    return { type: "sti-progression", version: 1, identite: id, scores: scores, date: new Date().toISOString() };
  }
  async function envoyerProgression() {
    var id = await exigerIdentite(); if (!id) return;
    var ip = await exigerPosteProf(); if (!ip) return;
    try { await D.reseau.progression(ip, progression(id)); toast("Progression envoyée au prof ✔", "ok"); }
    catch (e) { toast(msg(e), "ko"); }
  }
  async function exporterProgression() {
    var id = await exigerIdentite(); if (!id) return;
    var f = await D.fichier.enregistrerTexte({ nom: "progression_" + id.nom + "_" + id.prenom + "_" + id.classe + ".sti", contenu: JSON.stringify(progression(id), null, 2), filtres: [{ name: "Progression STI", extensions: ["sti"] }] });
    if (f) toast("Progression enregistrée : " + f, "ok");
  }

  window.STI = { msg: msg, esc: esc, lire: lire, ecrire: ecrire, toast: toast, dialogue: dialogue, identite: identite, demanderIdentite: demanderIdentite, exigerIdentite: exigerIdentite,
    posteProf: posteProf, choisirPosteProf: choisirPosteProf, exigerPosteProf: exigerPosteProf, progression: progression, envoyerProgression: envoyerProgression, exporterProgression: exporterProgression };
})();
