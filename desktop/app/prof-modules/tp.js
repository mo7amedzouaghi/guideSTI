/* Module C — côté prof : séance, corrigé, fiches, copies et notation. */
(async function () {
  "use strict";
  var D = window.stiDesktop, S = window.STI, E = window.STIEditeur, V = window.Verificateur, esc = S.esc;
  var $ = function (id) { return document.getElementById(id); };
  var vue = $("vue");
  var liste = [], tp = null, corr = null, onglet = S.lire("sti-prof-onglet") || "seance", copie = null;

  async function chargerListe(choix) {
    liste = await D.tp.liste();
    var id = choix || S.lire("sti-prof-tp") || (liste[0] && liste[0].id);
    $("liste").innerHTML = liste.map(function (t) {
      return '<button type="button" class="item" data-id="' + esc(t.id) + '"' + (t.id === id ? ' aria-current="true"' : "") + ">" + esc(t.titre) + "<small>" + t.niveau + "ème · " + t.duree + " min" + (t.source === "importe" ? " · importé" : "") + "</small></button>";
    }).join("") || '<p class="m-aide">Aucun TP.</p>';
    if (id) await choisir(id);
  }
  $("liste").addEventListener("click", function (e) { var b = e.target.closest("[data-id]"); if (b) { S.ecrire("sti-prof-tp", b.dataset.id); chargerListe(b.dataset.id); } });
  $("importer").addEventListener("click", async function () {
    try { var id = await D.tp.importer(); if (id) { S.toast("TP importé : " + id, "ok"); chargerListe(id); } } catch (e) { S.toast(S.msg(e), "ko"); }
  });
  $("onglets").addEventListener("click", function (e) { var b = e.target.closest("[data-o]"); if (!b) return; onglet = b.dataset.o; S.ecrire("sti-prof-onglet", onglet); copie = null; rendre(); });

  async function choisir(id) { tp = await D.tp.charger(id); corr = await D.tp.corrige(id); copie = null; rendre(); }

  function rendre() {
    document.querySelectorAll("#onglets button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.o === onglet ? "true" : "false"); });
    if (!tp) { vue.innerHTML = ""; return; }
    ({ seance: seance, corrige: corrige, fiches: fichesVue, copies: copies })[onglet]();
  }
  function sansCorrige() { return '<div class="m-carte" style="--c:var(--orange)"><h2>Pas de corrigé pour ce TP</h2><p class="m-aide">Ajoutez un fichier corrige.json dans le dossier du TP puis importez-le de nouveau.</p></div>'; }

  /* ---------- séance */
  async function seance() {
    var code = await D.tp.codeDeblocage(tp.id), etat = await D.ramassage.etat();
    var fiches = tp.fiches || [];
    vue.innerHTML = '<div class="m-carte" style="--c:var(--n4)"><h2>' + esc(tp.titre) + '<span class="pts">' + tp.niveau + "ème · " + tp.duree + " min</span></h2><p>" + esc(tp.resume || "") + "</p>" +
      '<p class="m-aide"><b>Conditions :</b> ' + esc(tp.conditions || "") + "</p></div>" +
      '<div class="m-carte" style="--c:var(--orange)"><h2>Consigne surprise</h2>' +
      (fiches.length ? '<p>Elle se débloque seule à la <b>' + ((tp.parties || []).find(function (p) { return p.type === "surprise"; }) || {}).deblocage + "e minute</b> sur chaque poste. Pour la débloquer plus tôt :</p>" +
        '<div class="rangee" style="gap:28px;align-items:flex-start"><div><p class="m-aide" style="margin-bottom:6px">Code du jour à donner aux élèves</p><span class="code-deblocage">' + code + "</span></div>" +
        '<div><p class="m-aide" style="margin-bottom:6px">Ou débloquer tous les postes reliés au réseau</p>' +
        (etat ? '<button type="button" class="btn or" id="tous">🔓 Débloquer maintenant</button>' : '<a class="btn sec" href="ramassage.html">Démarrer d\'abord le ramassage</a>') + "</div></div>" +
        '<p class="m-aide" style="margin-top:14px">Attribution : poste n → fiche ((n − 1) mod ' + fiches.length + ") + 1. " + fiches.map(function (f) { return "Fiche " + f.num + " : postes " + [0, 1, 2, 3].map(function (k) { return f.num + k * fiches.length; }).join(", ") + "…"; }).join(" · ") + "</p>"
        : "<p>Ce TP n'a pas de fiche surprise.</p>") + "</div>" +
      '<div class="m-carte" style="--c:var(--sarcelle)"><h2>Fichiers de départ</h2><div class="ed" id="ed-depart" style="height:420px"></div></div>';
    E.creer($("ed-depart"), JSON.parse(JSON.stringify(tp.fichiers)), { lectureSeule: true });
    var t = $("tous");
    if (t) t.addEventListener("click", async function () { await D.ramassage.debloquer(tp.id, true); S.toast("Fiche débloquée pour les postes reliés (sous 15 s)", "ok"); t.disabled = true; t.textContent = "✔ Débloquée"; });
  }

  /* ---------- corrigé */
  function corrige() {
    if (!corr) { vue.innerHTML = sansCorrige(); return; }
    var h = "";
    if (corr.principe) h += '<div class="m-carte"><h2>Principe</h2><ul>' + corr.principe.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>";
    if (corr.erreurs) {
      h += '<div class="m-carte" style="--c:var(--n2)"><h2><span class="num">1</span>Erreurs à trouver</h2><table class="t"><thead><tr><th>N°</th><th>Ligne</th><th>✗ Erronée</th><th>✔ Corrigée</th><th>Effet / règle</th></tr></thead><tbody>' +
        corr.erreurs.map(function (x, k) { return "<tr><td><b>" + (k + 1) + "</b></td><td>" + esc(x.ligne) + '</td><td class="ko-code">' + esc(x.errone) + '</td><td class="ok-code">' + esc(x.corrige) + "</td><td>" + esc(x.effet) + "</td></tr>"; }).join("") +
        "</tbody></table>" + (corr.baremeP1 ? '<p class="m-aide" style="margin-top:10px"><b>Barème :</b> ' + esc(corr.baremeP1) + "</p>" : "") + "</div>";
    }
    if (corr.variantes) {
      h += '<div class="m-carte" style="--c:var(--orange)"><h2><span class="num">2</span>Consignes surprises — solutions testées</h2>' + corr.variantes.map(function (v) {
        var f = (tp.fiches || []).find(function (x) { return x.num === v.num; }) || {};
        return "<h3>Fiche " + v.num + " — " + esc(f.titre || "") + '</h3><pre class="bloc">' + esc(v.code) + "</pre>";
      }).join("") + (corr.baremeP2 ? '<p class="m-aide"><b>Barème :</b> ' + esc(corr.baremeP2) + "</p>" : "") + "</div>";
    }
    if (corr.fichiersCorriges) h += '<div class="m-carte" style="--c:var(--sarcelle)"><h2>Code corrigé complet</h2><div class="ed" id="ed-corr" style="height:460px"></div></div>';
    vue.innerHTML = h + '<p class="no-print"><button type="button" class="btn sec" id="pdf">⇩ Corrigé en PDF</button></p>';
    if (corr.fichiersCorriges) E.creer($("ed-corr"), JSON.parse(JSON.stringify(corr.fichiersCorriges)), { lectureSeule: true });
    $("pdf").addEventListener("click", async function () { var f = await D.pdf("Corrige_" + tp.id + ".pdf"); if (f) S.toast("PDF enregistré", "ok"); });
  }

  /* ---------- fiches et cartes d'entretien */
  function fichesVue() {
    var h = '<div class="m-carte" style="--c:var(--orange)"><h2>Fiches surprises à découper</h2>' + (tp.fiches || []).map(function (f) {
      return '<div class="tp-fiche f' + f.num + '" style="margin-bottom:14px"><div class="tp-fiche-tete">✂ FICHE ' + f.num + "</div><h3>" + esc(f.titre) + "</h3><ul>" + f.consignes.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" +
        '<p style="margin:6px 14px 14px;font-style:italic">' + esc(tp.questionFiche || "") + "</p></div>";
    }).join("") + "</div>";
    if (corr && corr.cartes) {
      h += '<div class="m-carte" style="--c:var(--sarcelle)"><h2>Cartes d\'entretien</h2><table class="t"><thead><tr><th>Question</th><th>Réponse attendue</th><th>Remarque</th></tr></thead><tbody>' +
        corr.cartes.map(function (c, k) { return "<tr><td><b>" + (k + 1) + ".</b> " + esc(c.q) + "</td><td>" + esc(c.r) + "</td><td>" + esc(c.rem || "") + "</td></tr>"; }).join("") + "</tbody></table></div>";
    }
    if (corr && corr.grille) {
      h += '<div class="m-carte" style="--c:var(--rouge)"><h2>Grille de correction</h2><table class="t"><thead><tr><th>Critère</th><th style="width:90px">Points</th></tr></thead><tbody>' +
        corr.grille.map(function (g) { return "<tr><td>" + esc(g.critere) + "</td><td><b>" + g.max + "</b></td></tr>"; }).join("") +
        "<tr><td><b>TOTAL</b></td><td><b>" + corr.grille.reduce(function (a, g) { return a + g.max; }, 0) + "</b></td></tr></tbody></table></div>";
    }
    vue.innerHTML = h + '<p class="no-print"><button type="button" class="btn sec" id="pdf">⇩ Fiches, cartes et grille en PDF</button></p>';
    $("pdf").addEventListener("click", async function () { var f = await D.pdf("Fiches_" + tp.id + ".pdf"); if (f) S.toast("PDF enregistré", "ok"); });
  }

  /* ---------- copies reçues et notation */
  function totalNote(n) { return n && n.details ? Object.keys(n.details).reduce(function (a, k) { return a + (Number(n.details[k]) || 0); }, 0) : null; }
  async function copies() {
    if (copie) return afficherCopie();
    var l = (await D.ramassage.liste()).filter(function (x) { return x.tpId === tp.id; });
    var max = corr && corr.grille ? corr.grille.reduce(function (a, g) { return a + g.max; }, 0) : 20;
    vue.innerHTML = '<div class="m-carte" style="--c:var(--n4)"><h2>Copies reçues<span class="pts">' + l.length + "</span></h2>" +
      '<div class="rangee no-print" style="margin-bottom:12px"><button type="button" class="btn sec" id="ouvrir">📁 Ouvrir un dossier élève (clé USB)</button><button type="button" class="btn sec" id="csv">⇩ Notes (Excel)</button><a class="btn sec" href="ramassage.html">📡 Ramassage</a></div>' +
      (l.length ? '<table class="t"><thead><tr><th>Élève</th><th>Classe</th><th>Poste</th><th>Remis le</th><th>Note</th><th></th></tr></thead><tbody>' + l.map(function (x, k) {
        var t = totalNote(x.note);
        return "<tr><td><b>" + esc(x.identite.nom + " " + x.identite.prenom) + "</b></td><td>" + esc(x.identite.classe) + "</td><td>" + esc(x.identite.poste) + "</td><td>" + (x.remis ? new Date(x.remis).toLocaleString("fr-FR") : "—") +
          "</td><td>" + (t == null ? '<span class="statut">à corriger</span>' : '<span class="statut note">' + t + " / " + max + "</span>") + '</td><td><button type="button" class="btn" data-k="' + k + '">Corriger</button></td></tr>';
      }).join("") + "</tbody></table>" : '<p class="vide">Aucune copie reçue pour ce TP. Démarrez le ramassage : les élèves cliquent sur « Remettre au prof ».</p>') + "</div>";
    vue.querySelectorAll("[data-k]").forEach(function (b) { b.addEventListener("click", function () { ouvrirCopie(l[b.dataset.k].dossier); }); });
    $("ouvrir").addEventListener("click", async function () { try { var d = await D.ramassage.importerDossier(); if (d) ouvrirCopie(d); } catch (e) { S.toast(S.msg(e), "ko"); } });
    $("csv").addEventListener("click", async function () {
      var g = corr && corr.grille ? corr.grille : [];
      var cel = function (v) { v = String(v == null ? "" : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var t = [["Nom", "Prénom", "Classe", "Poste", "Remis le"].concat(g.map(function (x) { return x.critere + " (/" + x.max + ")"; }), ["Total /" + max, "Observation"])];
      l.forEach(function (x) {
        var n = x.note || {};
        t.push([x.identite.nom, x.identite.prenom, x.identite.classe, x.identite.poste, x.remis ? new Date(x.remis).toLocaleString("fr-FR") : ""].concat(g.map(function (c) { return n.details ? String(n.details[c.id] == null ? "" : n.details[c.id]).replace(".", ",") : ""; }), [totalNote(n) == null ? "" : String(totalNote(n)).replace(".", ","), n.observation || ""]));
      });
      var f = await D.fichier.enregistrerTexte({ nom: "Notes_" + tp.id + ".csv", contenu: t.map(function (r) { return r.map(cel).join(";"); }).join("\r\n"), bom: true, filtres: [{ name: "Excel (CSV)", extensions: ["csv"] }] });
      if (f) S.toast("Notes exportées : " + f, "ok");
    });
  }
  async function ouvrirCopie(d) { try { copie = await D.ramassage.lire(d); afficherCopie(); } catch (e) { S.toast(S.msg(e), "ko"); } }

  function correspondance(ligne) {
    if (!corr || !corr.erreurs) return null;
    var n = parseInt(String(ligne || "").replace(/\D+/g, " ").trim(), 10);
    return isNaN(n) ? null : corr.erreurs.find(function (x) { return String(x.ligne).split("-").map(Number).indexOf(n) >= 0; }) || null;
  }
  function afficherCopie() {
    var c = copie, id = c.identite || {}, r = c.reponses || {};
    var h = '<div class="m-carte" style="--c:var(--n4)"><div class="copie-tete"><button type="button" class="btn sec no-print" id="retour">← Copies</button><b>' + esc(id.nom + " " + id.prenom) + "</b><span>" + esc(id.classe) + " · poste " + esc(id.poste) + "</span>" +
      '<span class="m-aide" style="margin:0 0 0 auto">' + (c.remis ? "Remis le " + new Date(c.remis).toLocaleString("fr-FR") : "") + (c.debut ? " · commencé le " + new Date(c.debut).toLocaleString("fr-FR") : "") + "</span></div></div>";
    (tp.parties || []).forEach(function (p, k) {
      if (p.type === "tableau") {
        var rep = (r[p.id] || []).filter(Boolean);
        h += '<div class="m-carte" style="--c:var(--n2)"><h2><span class="num">' + (k + 1) + "</span>" + esc(p.titre) + '<span class="pts">' + rep.filter(function (x) { return x.join("").trim(); }).length + " / " + p.lignes + " ligne(s) remplie(s)</span></h2>" +
          '<table class="t"><thead><tr>' + p.colonnes.map(function (x) { return "<th>" + esc(x) + "</th>"; }).join("") + "<th>Corrigé correspondant</th></tr></thead><tbody>" +
          rep.map(function (row) {
            var m = correspondance(row[0]);
            return "<tr>" + p.colonnes.map(function (x, j) { return "<td" + (j === 1 || j === 2 ? ' style="font-family:var(--mono);font-size:12.5px"' : "") + ">" + esc(row[j] || "") + "</td>"; }).join("") +
              "<td>" + (m ? '<span class="ok-code">' + esc(m.corrige) + "</span><br><small>" + esc(m.effet) + "</small>" : '<span class="statut">aucune erreur à cette ligne</span>') + "</td></tr>";
          }).join("") + "</tbody></table></div>";
      }
      if (p.type === "surprise") {
        var f = r.fiche || {}, v = corr && corr.variantes ? corr.variantes.find(function (x) { return x.num === f.num; }) : null;
        h += '<div class="m-carte" style="--c:var(--orange)"><h2><span class="num">' + (k + 1) + "</span>" + esc(p.titre) + (f.num ? '<span class="pts">fiche ' + f.num + "</span>" : "") + "</h2>" +
          (f.num ? "<p><b>Réponse écrite :</b> " + (f.texte ? esc(f.texte) : "<em>vide</em>") + "</p>" + (v ? '<details><summary style="cursor:pointer">Solution attendue</summary><pre class="bloc">' + esc(v.code) + "</pre></details>" : "") : "<p><em>Fiche non débloquée ou non traitée.</em></p>") + "</div>";
      }
    });
    // code de l'élève + conformité + aperçu
    var nbProb = 0, n = tp.niveau;
    Object.keys(c.fichiers || {}).forEach(function (f) { var lg = (/\.(\w+)$/.exec(f) || [])[1]; if (V && lg) nbProb += V.analyser(c.fichiers[f], n, lg === "htm" ? "html" : lg).problemes.length; });
    h += '<div class="m-carte" style="--c:var(--sarcelle)"><h2>Code de l\'élève<span class="pts">' + (nbProb ? nbProb + " point(s) hors annexe / niveau" : "✔ conforme à l'annexe") + "</span></h2>" +
      '<div class="tp-plan" style="height:480px"><div class="ed" id="ed-copie"></div><div class="apercu"><div class="apercu-tete"><span class="points"><i></i><i></i><i></i></span><span class="url">' + esc(tp.principal) + '</span><button type="button" class="btn sec" id="act" style="padding:4px 10px">↻ Tester</button></div><iframe id="cadre"></iframe><div class="apercu-err" id="err" hidden></div></div></div>' +
      '<p class="no-print"><button type="button" class="btn sec" id="dos">📁 Ouvrir le dossier</button> <a class="btn sec" href="../modules/verifier-dossier.html?espace=prof">Rapport de conformité détaillé</a></p></div>';
    // grille
    var g = corr && corr.grille ? corr.grille : [{ id: "total", critere: "Note globale", max: 20 }];
    var n0 = c.note || {}, det = n0.details || {};
    h += '<div class="m-carte grille-note" style="--c:var(--rouge)"><h2>Notation<span class="note-total" id="total" style="margin-left:auto"></span></h2><table class="t"><thead><tr><th>Critère</th><th style="width:120px">Points</th><th style="width:60px">Max</th></tr></thead><tbody>' +
      g.map(function (x) { return "<tr><td>" + esc(x.critere) + '</td><td><input type="number" step="0.25" min="0" max="' + x.max + '" data-g="' + x.id + '" value="' + (det[x.id] == null ? "" : det[x.id]) + '"></td><td>/ ' + x.max + "</td></tr>"; }).join("") +
      '</tbody></table><label class="sti-champ"><span>Observation</span><textarea id="obs" rows="2" style="width:100%">' + esc(n0.observation || "") + "</textarea></label>" +
      '<div class="rangee no-print"><button type="button" class="btn vert" id="noter">✔ Enregistrer la note</button><button type="button" class="btn sec" id="pdfc">⇩ Fiche de notation PDF</button></div></div>';
    vue.innerHTML = h;
    window.scrollTo(0, 0);
    // fichiers de l'élève + images du TP (non renvoyées par l'élève) pour l'aperçu
    var fichiers = JSON.parse(JSON.stringify(c.fichiers || {}));
    Object.keys(tp.fichiers || {}).forEach(function (f) { if (fichiers[f] === undefined && !/\.(html?|css|js|sql|php)$/i.test(f)) fichiers[f] = tp.fichiers[f]; });
    var edc = Object.keys(fichiers).length ? E.creer($("ed-copie"), fichiers, { surChangement: function () {} }) : null;
    var tester;
    if (tp.console === "sql") {
      var zone = vue.querySelector(".tp-plan .apercu"); zone.innerHTML = "";
      tester = function () {};
      window.STIConsole.creer(zone, tp.baseSql, tp.nomBase || (tp.base || "").replace(/\.sql$/i, "")).then(function (cs) {
        var lancer = function () { cs.executer(fichiers[edc ? edc.actif() : tp.principal] || ""); };
        cs.surExecution(lancer); lancer();
      });
    } else {
      tester = function () { $("err").hidden = true; $("cadre").srcdoc = E.documentApercu(fichiers, tp.principal); };
      tester();
      $("act").addEventListener("click", tester);
    }
    $("retour").addEventListener("click", function () { copie = null; copies(); });
    $("dos").addEventListener("click", function () { D.dossier.ouvrir(c.dossier); });
    var maxT = g.reduce(function (a, x) { return a + x.max; }, 0);
    function majTotal() {
      var t = 0; vue.querySelectorAll("[data-g]").forEach(function (i) { var v = Number(i.value) || 0; if (v > Number(i.max)) { i.value = i.max; v = Number(i.max); } t += v; });
      $("total").textContent = (Math.round(t * 100) / 100) + " / " + maxT;
    }
    vue.querySelectorAll("[data-g]").forEach(function (i) { i.addEventListener("input", majTotal); });
    majTotal();
    $("noter").addEventListener("click", async function () {
      var d = {}; vue.querySelectorAll("[data-g]").forEach(function (i) { if (i.value !== "") d[i.dataset.g] = Number(i.value); });
      try { await D.ramassage.noter(c.dossier, { details: d, observation: $("obs").value, max: maxT }); c.note = { details: d, observation: $("obs").value }; S.toast("Note enregistrée", "ok"); }
      catch (e) { S.toast(S.msg(e), "ko"); }
    });
    $("pdfc").addEventListener("click", async function () { var f = await D.pdf("Notation_" + tp.id + "_" + id.nom + "_" + id.prenom + ".pdf"); if (f) S.toast("PDF enregistré", "ok"); });
  }
  window.addEventListener("message", function (e) { var z = $("err"); if (z && e.data && e.data.stiErreur) { z.hidden = false; z.textContent = "Erreur JavaScript : " + e.data.stiErreur; } });

  await chargerListe();
})();
