/* Module B : vérification de conformité de tout un dossier (TP d'élève, projet). */
(function () {
  "use strict";
  var D = window.stiDesktop, S = window.STI, V = window.Verificateur;
  var selN = document.getElementById("niveau"), sortie = document.getElementById("resultat");
  var bRel = document.getElementById("relancer"), bPdf = document.getElementById("pdf"), chemin = document.getElementById("chemin");
  var sources = [], fichiers = [];
  var TYPES = { hors: ["Hors annexe", "t-hors"], niveau: ["Niveau supérieur", "t-niveau"], convention: ["Convention", "t-conv"] };
  var esc = S.esc;

  var i = S.identite();
  if (i && i.niveau && !/espace=prof/.test(location.search)) selN.value = i.niveau;
  selN.value = S.lire("sti-dossier-niveau") || selN.value;
  selN.addEventListener("change", function () { S.ecrire("sti-dossier-niveau", selN.value); if (fichiers.length) analyser(); });

  async function charger(chemins) {
    sortie.innerHTML = '<p class="vide">Lecture des fichiers…</p>';
    var tout = [];
    for (var k = 0; k < chemins.length; k++) {
      try {
        var l = await D.dossier.lireCode(chemins[k]);
        var base = chemins.length > 1 ? chemins[k].split(/[\\/]/).pop() + "/" : "";
        l.forEach(function (f) { if (chemins.length > 1 && f.rel === chemins[k].split(/[\\/]/).pop()) f.rel = f.rel; else f.rel = base + f.rel; tout.push(f); });
      } catch (e) { S.toast(S.msg(e), "ko"); }
    }
    sources = chemins; fichiers = tout;
    chemin.textContent = chemins.length === 1 ? chemins[0] : chemins.length + " éléments déposés";
    bRel.disabled = bPdf.disabled = !fichiers.length;
    analyser();
  }

  function analyser() {
    var n = Number(selN.value);
    if (!fichiers.length) { sortie.innerHTML = '<div class="m-carte"><p class="vide">Aucun fichier HTML, CSS, JS, PHP ou SQL trouvé.</p></div>'; return; }
    var total = { hors: 0, niveau: 0, convention: 0 }, conformes = 0;
    var rapports = fichiers.map(function (f) {
      var r = V.analyser(f.contenu, n, f.langue);
      r.problemes.sort(function (a, b) { return a.ligne - b.ligne; });
      r.problemes.forEach(function (p) { total[p.type]++; });
      if (!r.problemes.length) conformes++;
      return { f: f, r: r };
    });
    var nbP = total.hors + total.niveau + total.convention;
    var h = '<div class="cartes-bilan">' +
      '<div class="bilan-c"><b>' + fichiers.length + "</b><span>fichier(s) analysé(s) · " + n + "ème année</span></div>" +
      '<div class="bilan-c" style="--c:var(--n2)"><b>' + conformes + "</b><span>fichier(s) conforme(s)</span></div>" +
      '<div class="bilan-c" style="--c:var(--rouge)"><b>' + total.hors + "</b><span>hors annexe</span></div>" +
      '<div class="bilan-c" style="--c:var(--orange)"><b>' + total.niveau + "</b><span>au-dessus du niveau</span></div>" +
      '<div class="bilan-c" style="--c:var(--n3)"><b>' + total.convention + "</b><span>convention(s)</span></div></div>";
    if (!nbP) h += '<div class="m-carte" style="--c:var(--n2)"><h2>✔ Dossier conforme au programme de ' + n + "ème année</h2><p class=\"m-aide\">Aucun élément hors annexe ni au-dessus du niveau n'a été détecté.</p></div>";
    h += rapports.map(function (x, k) {
      var p = x.r.problemes, marquees = {};
      p.forEach(function (q) { marquees[q.ligne] = q.type === "convention" && marquees[q.ligne] !== "ko" ? "conv" : "ko"; });
      return '<details class="fichier"' + (p.length && k < 6 ? " open" : "") + "><summary>" + esc(x.f.rel) + ' <span class="lg">' + esc(x.f.langue) + "</span>" +
        (p.length ? '<span class="badge t-hors">' + p.length + " point" + (p.length > 1 ? "s" : "") + " à corriger</span>" : '<span class="badge ok-badge">✔ conforme</span>') + '</summary><div class="corps">' +
        (p.length ? '<table class="t"><thead><tr><th style="width:70px">Ligne</th><th>Problème</th><th style="width:34%">Correction conforme</th></tr></thead><tbody>' + p.map(function (q) {
          return "<tr><td><b>L" + q.ligne + '</b></td><td><span class="badge ' + TYPES[q.type][1] + '">' + TYPES[q.type][0] + "</span> " + esc(q.message) +
            '<br><code>' + esc(q.extrait) + "</code></td><td>" + (q.alternative ? '<pre style="margin:0;white-space:pre-wrap;font-size:12.5px">' + esc(q.alternative) + "</pre>" : "—") + "</td></tr>";
        }).join("") + "</tbody></table>" : "") +
        '<details style="margin-top:10px"><summary style="cursor:pointer;color:var(--texte-2);font-size:13px">Voir le code (' + x.f.contenu.split("\n").length + ' lignes)</summary><div class="code-num" style="margin-top:8px">' +
        x.f.contenu.split("\n").map(function (l, j) { var m = marquees[j + 1]; return '<div class="ln' + (m ? " " + m : "") + '"><span>' + (j + 1) + "</span>" + (esc(l) || " ") + "</div>"; }).join("") +
        "</div></details></div></details>";
    }).join("");
    sortie.innerHTML = h;
  }

  document.getElementById("choisir").addEventListener("click", async function () {
    var d = await D.dossier.choisir("Dossier à vérifier");
    if (d) charger([d]);
  });
  bRel.addEventListener("click", function () { if (sources.length) charger(sources); });
  bPdf.addEventListener("click", async function () {
    document.querySelectorAll("details").forEach(function (d) { d.open = true; });
    var nom = "conformite_" + (sources[0] || "dossier").split(/[\\/]/).pop() + "_" + selN.value + "eme.pdf";
    var f = await D.pdf(nom);
    if (f) S.toast("Rapport enregistré : " + f, "ok");
  });

  var depot = document.getElementById("depot");
  ["dragenter", "dragover"].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); depot.classList.add("survol"); }); });
  ["dragleave", "drop"].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); if (t === "drop" || e.target === depot) depot.classList.remove("survol"); }); });
  document.addEventListener("drop", function (e) {
    var l = Array.from(e.dataTransfer.files || []).map(function (f) { return D.fichier.chemin(f); }).filter(Boolean);
    if (l.length) charger(l);
  });
})();
