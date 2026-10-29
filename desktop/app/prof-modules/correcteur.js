/* Correcteur de devoirs : énoncé + grille Excel + travaux RAR/ZIP → notes détaillées en Excel. */
(async function () {
  "use strict";
  var D = window.stiDesktop, S = window.STI, E = window.STIEditeur, esc = S.esc, C = D.cor;
  var $ = function (id) { return document.getElementById(id); };
  var vue = $("vue"), dev = null, onglet = S.lire("sti-cor-onglet") || "fichiers", detail = null;
  var VERIFS = [["manuel", "Manuel"], ["fichier", "Fichier présent"], ["contient", "Contient"], ["absent", "Absent (interdit)"], ["conforme", "Conforme à l'annexe"], ["page", "Test de page"], ["sql", "Requête SQL"]];
  var AIDE = {
    manuel: "Aucune vérification : vous saisissez les points.",
    fichier: "Fichier : nom exact ou motif (*.css).",
    contient: "Paramètre : motifs séparés par « | » ; points proportionnels aux motifs trouvés.",
    absent: "Paramètre : motifs interdits séparés par « | ».",
    conforme: "Fichier : motif (*.html, *.css…) ; niveau du devoir.",
    page: "Paramètre : scénario (saisir #id = … ; cliquer … ; texte #id contient …).",
    sql: "Paramètre : requête attendue ; l'élève étiquette sa requête « -- Q3 »."
  };
  function n2(x) { return x === null || x === undefined || x === "" ? "" : String(Math.round(Number(x) * 100) / 100).replace(".", ","); }
  function num(v) { var x = Number(String(v).replace(",", ".")); return isFinite(x) ? x : 0; }
  function maxTotal() { return Math.round(dev.grille.reduce(function (a, c) { return a + (Number(c.points) || 0); }, 0) * 100) / 100; }
  function questions() {
    var l = [];
    dev.grille.forEach(function (c) { var q = l.find(function (x) { return x.nom === c.question; }); if (!q) l.push(q = { nom: c.question, criteres: [], max: 0 }); q.criteres.push(c); q.max += Number(c.points) || 0; });
    return l;
  }
  function pts(e, c) { var r = (dev.resultats[e.id] || {})[c.id]; return r && r.points !== null && r.points !== undefined ? Number(r.points) : null; }
  function totalEleve(e) { return Math.round(dev.grille.reduce(function (a, c) { return a + (pts(e, c) || 0); }, 0) * 100) / 100; }
  function sur20(t) { var m = maxTotal(); return m ? Math.round(t * 2000 / m) / 100 : 0; }
  function teinte(n) { return n >= 14 ? "ok" : n >= 10 ? "moyen" : "ko"; }

  /* ================================================== liste */
  async function liste(choix) {
    var l = await C.liste();
    $("liste").innerHTML = l.map(function (d) {
      return '<button type="button" class="item" data-id="' + esc(d.id) + '"' + (dev && d.id === dev.id ? ' aria-current="true"' : "") + ">" + esc(d.titre) + "<small>" +
        esc((d.classe ? d.classe + " · " : "") + d.niveau + "ème · " + d.eleves + " élève(s) · " + d.criteres + " critère(s)") + "</small></button>";
    }).join("") || '<p class="m-aide">Aucun devoir.</p>';
    if (choix) await ouvrir(choix);
  }
  $("liste").addEventListener("click", function (e) { var b = e.target.closest("[data-id]"); if (b) ouvrir(b.dataset.id); });
  async function nouveau() {
    var v = await S.dialogue({ titre: "Nouveau devoir", valider: "Créer", champs: [
      { id: "titre", label: "Titre", valeur: "Devoir de contrôle n° 1", requis: true },
      { id: "classe", label: "Classe", placeholder: "ex. 4SI1" },
      { id: "niveau", label: "Niveau (annexe utilisée pour la conformité)", type: "select", valeur: "4", options: [["2", "2ème année"], ["3", "3ème année"], ["4", "4ème année (Bac)"]] }] });
    if (!v) return;
    var id = await C.creer(v);
    onglet = "fichiers";
    await liste(id);
  }
  $("nouveau").addEventListener("click", nouveau);
  $("nouveau2").addEventListener("click", nouveau);
  $("modele").addEventListener("click", async function () { var f = await C.modeleGrille(null); if (f) { S.toast("Modèle enregistré : " + f, "ok"); C.ouvrirFichier(f); } });

  async function ouvrir(id) { dev = await C.charger(id); S.ecrire("sti-cor-dernier", id); detail = null; rendre(); document.querySelectorAll("#liste .item").forEach(function (b) { b.setAttribute("aria-current", b.dataset.id === id ? "true" : "false"); }); }
  async function sauver(partiel) { dev = await C.enregistrer(dev.id, partiel || { grille: dev.grille, resultats: dev.resultats, titre: dev.titre, classe: dev.classe, niveau: dev.niveau }); }

  /* ================================================== rendu */
  function rendre() {
    if (!dev) return;
    var nbManuel = dev.grille.filter(function (c) { return c.verif === "manuel"; }).length;
    vue.innerHTML = '<div class="m-carte cr-tete" style="--c:var(--n4)"><div class="cr-titre"><b>' + esc(dev.titre) + "</b><span>" + esc((dev.classe ? dev.classe + " · " : "") + dev.niveau + "ème année") +
      '</span><button type="button" class="lien" id="modifier">modifier</button></div><div class="cr-chiffres">' +
      '<span><b>' + dev.eleves.length + "</b> élève(s)</span><span><b>" + dev.grille.length + "</b> critère(s)</span><span><b>" + n2(maxTotal()) + "</b> points</span>" +
      (dev.corrige ? "<span>corrigé le <b>" + new Date(dev.corrige).toLocaleDateString("fr-FR") + "</b></span>" : "") + '</div><div class="rangee no-print"><button type="button" class="btn sec" id="dossier">📁 Dossier</button><button type="button" class="btn sec" id="suppr">Supprimer</button></div></div>' +
      '<div class="onglets no-print" id="onglets">' + [["fichiers", "1. Fichiers"], ["grille", "2. Grille d'évaluation"], ["notes", "3. Correction et notes"]].map(function (o) {
        return '<button type="button" data-o="' + o[0] + '" aria-selected="' + (o[0] === onglet) + '">' + o[1] + "</button>";
      }).join("") + "</div><div id=\"corps\"></div>";
    $("modifier").addEventListener("click", async function () {
      var v = await S.dialogue({ titre: "Devoir", valider: "Enregistrer", champs: [{ id: "titre", label: "Titre", valeur: dev.titre, requis: true }, { id: "classe", label: "Classe", valeur: dev.classe },
        { id: "niveau", label: "Niveau", type: "select", valeur: String(dev.niveau), options: [["2", "2ème année"], ["3", "3ème année"], ["4", "4ème année (Bac)"]] }] });
      if (v) { await sauver({ titre: v.titre, classe: v.classe.toUpperCase(), niveau: Number(v.niveau) }); rendre(); liste(); }
    });
    $("dossier").addEventListener("click", function () { C.ouvrirDossier(dev.id); });
    $("suppr").addEventListener("click", async function () {
      var ok = await S.dialogue({ titre: "Supprimer ce devoir ?", valider: "Supprimer", texte: "Les travaux extraits, la grille et les notes de « " + esc(dev.titre) + " » seront supprimés de ce poste (les fichiers Excel déjà exportés sont conservés)." });
      if (ok) { await C.supprimer(dev.id); dev = null; vue.innerHTML = ""; liste(); }
    });
    $("onglets").addEventListener("click", function (e) { var b = e.target.closest("[data-o]"); if (!b) return; onglet = b.dataset.o; S.ecrire("sti-cor-onglet", onglet); detail = null; rendre(); });
    ({ fichiers: vueFichiers, grille: vueGrille, notes: vueNotes })[onglet]();
  }

  /* ---------- 1. fichiers */
  function vueFichiers() {
    var sqlUtile = dev.grille.some(function (c) { return c.verif === "sql"; });
    var carte = function (ico, titre, etat, ok, boutons, texte) {
      return '<div class="cr-source' + (ok ? " ok" : "") + '"><div class="cr-ico">' + ico + "</div><div class=\"cr-src-corps\"><h3>" + titre + "</h3><p>" + etat + "</p>" + (texte ? '<p class="m-aide">' + texte + "</p>" : "") + '<div class="rangee">' + boutons + "</div></div></div>";
    };
    var h = '<div class="cr-sources">' +
      carte("📄", "Énoncé", dev.enonce ? "✔ " + esc(dev.enonce.original) : "Aucun énoncé joint (facultatif).", !!dev.enonce,
        '<button type="button" class="btn sec" data-a="enonce">Joindre l\'énoncé</button>' + (dev.enonce ? '<button type="button" class="btn sec" data-a="voirEnonce">Ouvrir</button>' : ""), "PDF, Word ou page HTML : gardé avec le devoir pour la correction.") +
      carte("📋", "Grille d'évaluation", dev.grille.length ? "✔ " + dev.grille.length + " critère(s), " + n2(maxTotal()) + " points" + (dev.grilleSource ? " — " + esc(dev.grilleSource) : "") : "Aucune grille.", !!dev.grille.length,
        '<button type="button" class="btn" data-a="grille">Importer la grille (Excel)</button><button type="button" class="btn sec" data-a="modele">Modèle de grille</button>', "Colonnes : Question · Critère · Points · Vérification · Fichier · Paramètre. Une grille sans les trois dernières colonnes est acceptée : tous les critères sont alors notés à la main.") +
      carte("🗄️", "Base de référence SQL", dev.base ? "✔ " + esc(dev.base.original) + " — " + esc((dev.base.tables || []).join(", ")) + (dev.base.erreurs ? " · " + dev.base.erreurs + " instruction(s) ignorée(s)" : "") : (sqlUtile ? "⚠ Nécessaire : la grille contient des vérifications SQL." : "Facultative (devoirs de bases de données)."), !!dev.base,
        '<button type="button" class="btn sec" data-a="base">Joindre le script .sql</button>', "Export phpMyAdmin ou script CREATE TABLE + INSERT INTO : les requêtes des élèves sont exécutées sur cette base.") +
      carte("🗂️", "Travaux des élèves", dev.eleves.length ? "✔ " + dev.eleves.length + " élève(s) — " + esc(dev.source || "") : "Aucun travail importé.", !!dev.eleves.length,
        '<button type="button" class="btn" data-a="rar">Importer l\'archive RAR / ZIP</button><button type="button" class="btn sec" data-a="dossierTravaux">…ou un dossier</button>', "Une archive contenant un dossier (ou une archive) par élève, nommé avec son nom. Les archives imbriquées sont extraites automatiquement.") +
      "</div><div id=\"journal\"></div>";
    if (dev.eleves.length) {
      h += '<div class="m-carte" style="--c:var(--sarcelle)"><h2>Élèves repérés<span class="pts">' + dev.eleves.length + '</span></h2><p class="m-aide">Vérifiez les noms : ils sont tirés des dossiers (ou archives) de l\'archive. Cliquez sur un nom pour le corriger.</p><div class="cr-eleves">' +
        dev.eleves.map(function (e) { return '<button type="button" class="cr-eleve" data-e="' + e.id + '"><b>' + esc(e.nom) + "</b><small>" + e.fichiers + " fichier(s)</small></button>"; }).join("") + "</div></div>";
    }
    if (dev.grille.length && dev.eleves.length) h += '<p><button type="button" class="btn or" data-a="aller" style="font-size:16px;padding:13px 20px">▶ Passer à la correction</button></p>';
    $("corps").innerHTML = h;
    $("corps").addEventListener("click", async function (e) {
      var b = e.target.closest("[data-a]"), el = e.target.closest("[data-e]");
      if (el) {
        var x = dev.eleves.find(function (y) { return y.id === el.dataset.e; });
        var v = await S.dialogue({ titre: "Nom de l'élève", valider: "Enregistrer", champs: [{ id: "nom", label: "Nom et prénom", valeur: x.nom, requis: true }] });
        if (v) { x.nom = v.nom; await sauver({ eleves: dev.eleves }); rendre(); }
        return;
      }
      if (!b) return;
      var a = b.dataset.a;
      try {
        if (a === "enonce" || a === "base") { var r = await C.joindre(dev.id, a); if (r) { dev = r; rendre(); } }
        if (a === "voirEnonce") C.ouvrirEnonce(dev.id);
        if (a === "grille") { var g = await C.importerGrille(dev.id); if (g) { dev = g; S.toast(dev.grille.length + " critère(s) importé(s)", "ok"); rendre(); liste(); } }
        if (a === "modele") { var f = await C.modeleGrille(dev.grille.length ? dev.id : null); if (f) { S.toast("Grille enregistrée : " + f, "ok"); C.ouvrirFichier(f); } }
        if (a === "rar" || a === "dossierTravaux") {
          $("journal").innerHTML = '<div class="m-carte"><p class="m-aide">Extraction des travaux…</p><div class="barre-prog indet"><i></i></div></div>';
          var t = await C.importerTravaux(dev.id, a === "rar" ? "archive" : "dossier");
          if (t) { dev = t.devoir; rendre(); liste(); if (t.journal.length) $("journal").innerHTML = '<div class="m-carte" style="--c:var(--orange)"><h2>Avertissements</h2><ul>' + t.journal.map(function (j) { return "<li>" + esc(j) + "</li>"; }).join("") + "</ul></div>"; S.toast(dev.eleves.length + " élève(s) importé(s)", "ok"); }
          else $("journal").innerHTML = "";
        }
        if (a === "aller") { onglet = "notes"; rendre(); }
      } catch (err) { $("journal").innerHTML = ""; S.toast(S.msg(err), "ko"); }
    });
  }

  /* ---------- 2. grille */
  function vueGrille() {
    var h = '<div class="m-carte" style="--c:var(--n3)"><h2>Grille d\'évaluation<span class="pts" id="g-total"></span></h2>' +
      '<p class="m-aide">Une ligne par critère. Les critères d\'une même question sont additionnés dans l\'export Excel. Le paramètre dépend de la vérification choisie (survolez la liste).</p>' +
      '<div style="overflow:auto"><table class="t cr-grille"><thead><tr><th style="width:80px">Question</th><th>Critère</th><th style="width:70px">Points</th><th style="width:150px">Vérification</th><th style="width:120px">Fichier</th><th>Paramètre</th><th style="width:40px"></th></tr></thead><tbody id="g-corps"></tbody></table></div>' +
      '<div class="rangee" style="margin-top:12px"><button type="button" class="btn sec" id="g-ajout">＋ Ajouter un critère</button><button type="button" class="btn" id="g-sauver">✔ Enregistrer la grille</button>' +
      '<button type="button" class="btn sec" id="g-xlsx">⇩ Exporter la grille (Excel)</button><button type="button" class="btn sec" id="g-import">⇧ Importer une grille</button></div></div>' +
      carteTolerance();
    $("corps").innerHTML = h;
    brancherTolerance();
    function ligne(c) {
      return '<tr data-id="' + esc(c.id) + '"><td><input type="text" data-k="question" value="' + esc(c.question) + '"></td><td><textarea rows="2" data-k="critere">' + esc(c.critere) + '</textarea></td>' +
        '<td><input type="text" data-k="points" value="' + n2(c.points) + '"></td><td><select data-k="verif" title="' + esc(AIDE[c.verif] || "") + '">' + VERIFS.map(function (v) { return '<option value="' + v[0] + '"' + (v[0] === c.verif ? " selected" : "") + ">" + v[1] + "</option>"; }).join("") + "</select></td>" +
        '<td><input type="text" data-k="fichier" value="' + esc(c.fichier || "") + '" placeholder="' + (c.verif === "manuel" ? "" : "index.html, *.css…") + '"></td><td><textarea rows="2" data-k="param" class="mono" placeholder="' + esc(AIDE[c.verif] || "") + '">' + esc(c.param || "") + '</textarea></td>' +
        '<td><button type="button" class="btn sec" data-suppr style="padding:4px 9px" title="Supprimer">✕</button></td></tr>';
    }
    function dessiner() { $("g-corps").innerHTML = dev.grille.map(ligne).join(""); total(); }
    function total() { $("g-total").textContent = n2(maxTotal()) + " points"; }
    dessiner();
    $("g-corps").addEventListener("input", function (e) {
      var tr = e.target.closest("tr"), c = dev.grille.find(function (x) { return x.id === tr.dataset.id; }), k = e.target.dataset.k;
      c[k] = k === "points" ? num(e.target.value) : e.target.value;
      if (k === "verif") { e.target.title = AIDE[c.verif]; tr.querySelector('[data-k="param"]').placeholder = AIDE[c.verif]; }
      total();
    });
    $("g-corps").addEventListener("click", function (e) {
      if (!e.target.closest("[data-suppr]")) return;
      var id = e.target.closest("tr").dataset.id; dev.grille = dev.grille.filter(function (x) { return x.id !== id; }); dessiner();
    });
    $("g-ajout").addEventListener("click", function () {
      var der = dev.grille[dev.grille.length - 1];
      dev.grille.push({ id: "c" + Date.now().toString(36), question: der ? der.question : "Q1", critere: "", points: 1, verif: "manuel", fichier: "", param: "" });
      dessiner();
      var t = $("g-corps").querySelectorAll('[data-k="critere"]'); t[t.length - 1].focus();
    });
    $("g-sauver").addEventListener("click", async function () { await sauver({ grille: dev.grille }); S.toast("Grille enregistrée", "ok"); liste(); });
    $("g-xlsx").addEventListener("click", async function () { await sauver({ grille: dev.grille }); var f = await C.modeleGrille(dev.id); if (f) { S.toast("Grille exportée", "ok"); C.ouvrirFichier(f); } });
    $("g-import").addEventListener("click", async function () { try { var g = await C.importerGrille(dev.id); if (g) { dev = g; dessiner(); S.toast(dev.grille.length + " critère(s) importé(s)", "ok"); } } catch (err) { S.toast(S.msg(err), "ko"); } });
  }

  /* ---------- tolérance aux petites erreurs (règles validées par l'enseignant) */
  var REGLES = [
    ["A1", "Parenthèse oubliée ou en trop (JS)", "if (n == \"\" {"],
    ["A2", "Accolade oubliée ou en trop (JS)", "fonction sans } final"],
    ["A4", "Majuscule dans une méthode ou fonction", "getElementByID, .Value, Alert"],
    ["A5", "Faute de frappe dans une méthode (1 lettre, ou 2 inversées)", ".valeu, innerHtml"],
    ["A6", "Parenthèses () oubliées après une méthode", "d.getFullYear"],
    ["A7", "= au lieu de == dans une condition", "if (n = 4)"],
    ["A8", "Nom de fonction différent entre HTML et JS", "onclick=\"verif()\" / function verife()"],
    ["A9", "Point-virgule oublié (CSS)", "color: red⏎text-align: center;"],
    ["A10", "Accolade oubliée (CSS)", "règle non fermée"],
    ["B1", "Conformité : margin-* / padding-* détaillées", "margin-top, padding-left (au lieu de margin / padding)"],
    ["B2", "Conformité : sélecteur descendant", "div a, #menu li (pas >, +, ~)"],
    ["C1", "Nom approché cherché par « contient »", "afficherDat au lieu de afficherDate"],
    ["C2", "SQL : étiquettes -- Qn oubliées", "requêtes sans commentaire"],
    ["C3", "SQL : colonnes dans un autre ordre", "SELECT prenom, nom"],
    ["D3", "Faute de frappe dans un identifiant (id)", "id=\"resulat\" / getElementById(\"resultat\")"]
  ];
  var DEFAUT = { active: true, max: 3, regles: { A1: 0.25, A2: 0.25, A4: 0.25, A5: 0.25, A7: 0.25, A9: 0, A10: 0.25, B1: 0, B2: 0, C1: 0.25, D3: 0.25 } };
  function tol() {
    var t = dev.tolerance;
    if (t && t.regles) ["B1", "B2"].forEach(function (k) { if ((t.connues || []).indexOf(k) < 0 && !(k in t.regles)) { t = JSON.parse(JSON.stringify(t)); t.regles[k] = DEFAUT.regles[k]; } });
    return t && t.regles ? t : { active: !t || t.active !== false, max: DEFAUT.max, regles: Object.assign({}, DEFAUT.regles) }; }
  function carteTolerance() {
    var t = tol(), montants = [[0, "toléré (0 pt)"], [0.25, "−0,25 pt"], [0.5, "−0,5 pt"], [1, "−1 pt"]];
    return '<div class="m-carte" style="--c:var(--n4)"><h2>Tolérance aux petites erreurs</h2>' +
      '<p class="m-aide">Pour chaque règle cochée, l\'application répare une copie du travail, rejoue le test et retire le montant choisi, une seule fois par élève même si l\'erreur touche plusieurs critères. Les critères concernés sont marqués « à revoir ». Une erreur de logique n\'est jamais réparée.</p>' +
      '<div class="rangee" style="margin-bottom:10px"><label><input type="checkbox" id="t-active"' + (t.active ? " checked" : "") + '> Correction tolérante activée</label>' +
      '<label>Erreurs réparées au plus par page <select id="t-max">' + [1, 2, 3, 5].map(function (n) { return '<option' + (n === Number(t.max) ? " selected" : "") + ">" + n + "</option>"; }).join("") + "</select></label>" +
      '<button type="button" class="btn sec" id="t-defaut">Revenir aux règles validées</button></div>' +
      '<table class="t" style="--c:var(--n4)"><thead><tr><th style="width:60px">Règle</th><th>Erreur de l\'élève</th><th>Exemple</th><th style="width:70px">Appliquer</th><th style="width:150px">Pénalité</th></tr></thead><tbody>' +
      REGLES.map(function (r) {
        var on = Object.prototype.hasOwnProperty.call(t.regles, r[0]), v = on ? Number(t.regles[r[0]]) : 0.25;
        return '<tr data-r="' + r[0] + '"><td><b>' + r[0] + "</b></td><td>" + esc(r[1]) + "</td><td><code>" + esc(r[2]) + '</code></td><td style="text-align:center"><input type="checkbox" class="t-on"' + (on ? " checked" : "") + '></td><td><select class="t-val"' + (on ? "" : " disabled") + ">" +
          montants.map(function (m) { return '<option value="' + m[0] + '"' + (m[0] === v ? " selected" : "") + ">" + m[1] + "</option>"; }).join("") + "</select></td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function brancherTolerance() {
    async function enregistrer() {
      var regles = {};
      document.querySelectorAll("tr[data-r]").forEach(function (tr) {
        var on = tr.querySelector(".t-on").checked; tr.querySelector(".t-val").disabled = !on;
        if (on) regles[tr.dataset.r] = Number(tr.querySelector(".t-val").value);
      });
      dev.tolerance = { active: $("t-active").checked, max: Number($("t-max").value), regles: regles, connues: REGLES.map(function (r) { return r[0]; }) };
      await sauver({ tolerance: dev.tolerance });
      S.toast("Règles enregistrées — relancez la correction pour les appliquer", "ok");
    }
    $("t-active").addEventListener("change", enregistrer);
    $("t-max").addEventListener("change", enregistrer);
    document.querySelectorAll("tr[data-r] .t-on, tr[data-r] .t-val").forEach(function (x) { x.addEventListener("change", enregistrer); });
    $("t-defaut").addEventListener("click", async function () {
      dev.tolerance = JSON.parse(JSON.stringify(DEFAUT)); await sauver({ tolerance: dev.tolerance }); vueGrille(); S.toast("Règles validées rétablies", "ok");
    });
  }

  /* ---------- 3. correction et notes */
  function vueNotes() {
    if (!dev.grille.length || !dev.eleves.length) { $("corps").innerHTML = '<div class="m-carte"><p class="vide">Importez d\'abord la grille et les travaux (onglet « Fichiers »).</p></div>'; return; }
    var qs = questions(), corrige = Object.keys(dev.resultats).length > 0;
    var h = '<div class="m-carte no-print" style="--c:var(--n2)"><div class="rangee"><button type="button" class="btn vert" id="lancer" style="font-size:15px;padding:12px 18px">▶ ' + (corrige ? "Relancer" : "Lancer") + ' la correction automatique</button>' +
      '<label><input type="checkbox" id="ecraser"> remplacer aussi les notes modifiées à la main</label><span class="m-aide" style="margin:0" id="prog-txt"></span>' +
      '<button type="button" class="btn or" id="excel" style="margin-left:auto"' + (corrige ? "" : " disabled") + '>⇩ Exporter les notes (Excel)</button></div><div class="barre-prog" id="prog" hidden><i></i></div></div>';
    if (corrige) {
      var moy = dev.eleves.length ? Math.round(dev.eleves.reduce(function (a, e) { return a + sur20(totalEleve(e)); }, 0) * 100 / dev.eleves.length) / 100 : 0;
      var aSaisir = 0, aRevoir = 0; dev.eleves.forEach(function (e) { dev.grille.forEach(function (c) { var r = (dev.resultats[e.id] || {})[c.id] || {}; if (pts(e, c) === null) aSaisir++; if (r.revoir && !r.modifie) aRevoir++; }); });
      h += '<div class="cartes-bilan"><div class="bilan-c"><b>' + n2(moy) + '</b><span>moyenne /20</span></div><div class="bilan-c" style="--c:var(--n2)"><b>' + dev.eleves.filter(function (e) { return sur20(totalEleve(e)) >= 10; }).length + "/" + dev.eleves.length +
        '</b><span>élèves ≥ 10</span></div><div class="bilan-c" style="--c:var(--orange)"><b>' + aSaisir + "</b><span>note(s) à saisir (critères manuels)</span></div>" +
        '<div class="bilan-c" style="--c:var(--n4)"><b>' + aRevoir + "</b><span>critère(s) à revoir (tolérance appliquée)</span></div></div>";
      h += '<div class="m-carte" style="--c:var(--n4)"><h2>Grille détaillée<span class="pts">cliquez sur un nom pour voir le travail</span></h2><div class="cr-mat-wrap"><table class="t cr-mat"><thead><tr><th rowspan="2" class="cr-nom">Élève</th>' +
        qs.map(function (q, i) { return '<th colspan="' + (q.criteres.length + 1) + '" class="q' + (i % 6) + '">' + esc(q.nom) + "</th>"; }).join("") + '<th rowspan="2">Total<br>/' + n2(maxTotal()) + '</th><th rowspan="2">Note<br>/20</th></tr><tr>' +
        qs.map(function (q, i) { return q.criteres.map(function (c) { return '<th class="crit q' + (i % 6) + '" title="' + esc(c.critere + " — " + (AIDE[c.verif] || "")) + '">' + esc(c.critere.length > 26 ? c.critere.slice(0, 24) + "…" : c.critere) + "<br><small>/" + n2(c.points) + (c.verif === "manuel" ? " ✎" : "") + "</small></th>"; }).join("") + '<th class="crit q' + (i % 6) + ' tq">Σ</th>'; }).join("") + "</tr></thead><tbody>" +
        dev.eleves.map(function (e) {
          var t = totalEleve(e), n = sur20(t);
          return '<tr data-e="' + e.id + '"><th class="cr-nom"><button type="button" class="lien" data-voir="' + e.id + '">' + esc(e.nom) + "</button></th>" +
            qs.map(function (q) {
              return q.criteres.map(function (c) {
                var v = pts(e, c), r = (dev.resultats[e.id] || {})[c.id] || {};
                var cl = v === null ? "vide" : v >= c.points ? "plein" : v === 0 ? "zero" : "part";
                return '<td class="' + cl + (r.modifie ? " modif" : "") + (r.revoir && !r.modifie ? " revoir" : "") + '" title="' + esc(r.justif || "") + '"><input type="text" data-c="' + c.id + '" value="' + n2(v) + '"></td>';
              }).join("") + '<td class="tq"><b>' + n2(q.criteres.reduce(function (a, c) { return a + (pts(e, c) || 0); }, 0)) + "</b></td>";
            }).join("") + '<td class="tq"><b>' + n2(t) + '</b></td><td class="note ' + teinte(n) + '"><b>' + n2(n) + "</b></td></tr>";
        }).join("") + "</tbody></table></div>" +
        '<p class="cr-legende"><span class="plein">points complets</span><span class="part">partiels</span><span class="zero">0</span><span class="vide">à saisir</span><span class="modif">modifié à la main</span><span class="revoir">à revoir (tolérance)</span> · Survolez une case pour la justification automatique.</p></div>';
    }
    h += '<div id="detail"></div>';
    $("corps").innerHTML = h;

    var off = D.cor.surProgression(function (p) {
      var b = $("prog"); if (!b) return; b.hidden = false; b.classList.remove("indet");
      b.firstChild.style.width = Math.round(100 * p.fait / p.total) + "%";
      $("prog-txt").textContent = p.fait + " / " + p.total + " — " + p.eleve;
    });
    $("lancer").addEventListener("click", async function () {
      this.disabled = true; $("prog").hidden = false; $("prog").classList.add("indet"); $("prog-txt").textContent = "Correction en cours…";
      try { dev = await C.corriger(dev.id, { ecraser: $("ecraser").checked }); S.toast("Correction terminée", "ok"); off(); rendre(); }
      catch (err) { off(); S.toast(S.msg(err), "ko"); this.disabled = false; $("prog").hidden = true; $("prog-txt").textContent = ""; }
    });
    $("excel").addEventListener("click", async function () { try { var f = await C.exporter(dev.id); if (f) { S.toast("Notes exportées : " + f, "ok"); C.ouvrirFichier(f); } } catch (err) { S.toast(S.msg(err), "ko"); } });

    var tab = vue.querySelector(".cr-mat");
    if (tab) {
      tab.addEventListener("change", async function (e) {
        var inp = e.target; if (!inp.dataset.c) return;
        var eid = inp.closest("tr").dataset.e, c = dev.grille.find(function (x) { return x.id === inp.dataset.c; });
        var v = inp.value.trim() === "" ? null : Math.max(0, Math.min(Number(c.points), num(inp.value)));
        var ancien = (dev.resultats[eid] = dev.resultats[eid] || {})[c.id] || {};
        var base = ancien.justifAuto !== undefined ? ancien.justifAuto : (ancien.justif || "");
        dev.resultats[eid][c.id] = Object.assign({}, ancien, { points: v, modifie: true, justifAuto: base, justif: (base ? base + " — " : "") + "note fixée par l'enseignant" });
        await sauver({ resultats: dev.resultats });
        rendre();
      });
      tab.addEventListener("click", function (e) { var b = e.target.closest("[data-voir]"); if (b) voirEleve(b.dataset.voir); });
    }
    if (detail) voirEleve(detail);
  }

  /* ---------- détail d'un élève : travail, aperçu, critères */
  async function voirEleve(eid) {
    detail = eid;
    var e = dev.eleves.find(function (x) { return x.id === eid; }), res = dev.resultats[eid] || {};
    var f = await C.fichiers(dev.id, eid);
    var principal = Object.keys(f.fichiers).find(function (x) { return /(^|\/)index\.html?$/i.test(x); }) || Object.keys(f.fichiers).find(function (x) { return /\.html?$/i.test(x); });
    var estSql = !principal && Object.keys(f.fichiers).some(function (x) { return /\.sql$/i.test(x); });
    var z = $("detail");
    z.innerHTML = '<div class="m-carte" style="--c:var(--sarcelle)"><div class="copie-tete"><b>' + esc(e.nom) + "</b><span>" + f.liste.length + ' fichier(s)</span><span class="note-total" style="margin-left:auto">' + n2(sur20(totalEleve(e))) + ' / 20</span><button type="button" class="btn sec no-print" id="d-dos">📁 Ouvrir</button><button type="button" class="btn sec no-print" id="d-fermer">✕</button></div>' +
      (Object.keys(f.fichiers).length ? '<div class="tp-plan" style="height:440px;margin-top:12px"><div class="ed" id="d-ed"></div><div class="apercu" id="d-ap"><div class="apercu-tete"><span class="points"><i></i><i></i><i></i></span><span class="url">' + esc(principal || "") + '</span><button type="button" class="btn sec" id="d-act" style="padding:4px 10px">↻ Tester</button></div><iframe id="d-cadre"></iframe></div></div>'
        : '<p class="m-aide">Aucun fichier de code lisible dans ce travail : ' + esc(f.liste.join(", ") || "dossier vide") + "</p>") +
      '<table class="t" style="margin-top:14px"><thead><tr><th style="width:80px">Question</th><th>Critère</th><th style="width:90px">Points</th><th>Justification</th></tr></thead><tbody>' +
      dev.grille.map(function (c) {
        var r = res[c.id] || {};
        return "<tr><td>" + esc(c.question) + "</td><td>" + esc(c.critere) + ' <span class="badge t-conv">' + esc(c.verif) + '</span></td><td style="white-space:nowrap;width:110px"><input type="text" data-c="' + c.id + '" value="' + n2(r.points) + '" style="width:60px"> / ' + n2(c.points) + "</td><td>" +
          '<input type="text" data-j="' + c.id + '" value="' + esc(r.justif || "") + '" style="width:100%">' + "</td></tr>";
      }).join("") + '</tbody></table><label class="sti-champ"><span>Observation (reprise dans l\'export)</span><textarea id="d-obs" rows="2" style="width:100%">' + esc(res._observation || "") + '</textarea></label>' +
      '<div class="rangee no-print"><button type="button" class="btn vert" id="d-ok">✔ Enregistrer</button><button type="button" class="btn sec" id="d-rel">↻ Recorriger cet élève</button></div></div>';
    z.scrollIntoView({ behavior: "smooth", block: "start" });
    $("d-fermer").addEventListener("click", function () { detail = null; z.innerHTML = ""; });
    $("d-dos").addEventListener("click", function () { C.ouvrirTravail(dev.id, eid); });
    if (Object.keys(f.fichiers).length) {
      var ed = E.creer($("d-ed"), f.fichiers, { lectureSeule: true });
      if (estSql) {
        var ap = $("d-ap"); ap.innerHTML = "";
        window.STIConsole.creer(ap, f.base, "de référence").then(function (cs) { var go = function () { cs.executer(f.fichiers[ed.actif()] || ""); }; cs.surExecution(go); go(); });
      } else if (principal) {
        var test = function () { $("d-cadre").srcdoc = E.documentApercu(f.fichiers, principal); };
        test(); $("d-act").addEventListener("click", test);
      }
    }
    $("d-ok").addEventListener("click", async function () {
      var r = dev.resultats[eid] = dev.resultats[eid] || {};
      z.querySelectorAll("[data-c]").forEach(function (inp) {
        var c = dev.grille.find(function (x) { return x.id === inp.dataset.c; }), ancien = r[c.id] || {};
        var v = inp.value.trim() === "" ? null : Math.max(0, Math.min(Number(c.points), num(inp.value)));
        var j = z.querySelector('[data-j="' + c.id + '"]').value;
        if (v !== (ancien.points === undefined ? null : ancien.points) || j !== (ancien.justif || "")) r[c.id] = Object.assign({}, ancien, { points: v, justif: j, modifie: true });
      });
      r._observation = $("d-obs").value;
      await sauver({ resultats: dev.resultats });
      S.toast("Enregistré", "ok"); rendre();
    });
    $("d-rel").addEventListener("click", async function () {
      try { dev = await C.corriger(dev.id, { eleves: [eid], ecraser: true }); S.toast("Élève recorrigé", "ok"); rendre(); } catch (err) { S.toast(S.msg(err), "ko"); }
    });
  }

  try { await liste(S.lire("sti-cor-dernier") || null); } catch (e) { S.ecrire("sti-cor-dernier", ""); dev = null; await liste(); }
})();
