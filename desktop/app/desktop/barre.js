/* Ajouts de la version bureau dans les pages du guide (Espace Prof et Espace Élèves). */
(function () {
  "use strict";
  var D = window.stiDesktop, S = window.STI;
  if (!D || !S) return;
  var chemin = location.pathname;
  var prof = chemin.indexOf("/contenu/prof/") >= 0;
  var page = chemin.split("/").pop() || "index.html";
  var RACINE = "../../";

  // liens sans objet hors ligne (version 1 du site, pages de compte)
  document.querySelectorAll('a[href="../"], a[href="../index.html"], a[href^="../connexion"]').forEach(function (a) { a.remove(); });

  // entrées de menu supplémentaires
  var menu = document.querySelector(".menu");
  function lien(href, texte, cls) {
    if (!menu) return;
    var a = document.createElement("a");
    a.href = RACINE + href; a.textContent = texte; a.className = "sti-lien-bureau " + (cls || "");
    menu.appendChild(a);
  }
  if (prof) {
    lien("prof-modules/tp.html", "TP & examens");
    lien("prof-modules/correcteur.html", "Correcteur");
    lien("prof-modules/ramassage.html", "Ramassage");
  } else {
    lien("modules/tp-eleve.html", "TP & examens");
    lien("modules/verifier-dossier.html", "Vérifier mon dossier");
  }

  // dock : accueil, identité, progression
  var dock = document.createElement("div");
  dock.className = "sti-dock";
  dock.innerHTML = '<a class="sti-dock-btn" href="' + RACINE + 'accueil/index.html" title="Accueil de l\'application">⌂ Accueil</a>' +
    (prof
      ? '<button type="button" class="sti-dock-btn" data-a="verrou" title="Verrouiller l\'Espace Prof">🔒 Verrouiller</button>'
      : '<button type="button" class="sti-dock-btn" data-a="id"></button>' +
        '<button type="button" class="sti-dock-btn" data-a="envoyer" title="Envoyer ma progression au poste prof">⇪ Envoyer ma progression</button>' +
        '<button type="button" class="sti-dock-btn" data-a="exporter" title="Enregistrer ma progression dans un fichier .sti">💾 .sti</button>');
  document.body.appendChild(dock);
  function majId() {
    var b = dock.querySelector('[data-a="id"]'); if (!b) return;
    var i = S.identite();
    b.textContent = i && i.nom ? "👤 " + i.prenom + " " + i.nom + " · " + i.classe + " · P" + i.poste : "👤 Me présenter";
  }
  majId();
  dock.addEventListener("click", async function (e) {
    var b = e.target.closest("[data-a]"); if (!b) return;
    var a = b.dataset.a;
    if (a === "verrou") { await D.pin.verrouiller(); location.href = RACINE + "accueil/index.html"; }
    if (a === "id") { await S.demanderIdentite(false); majId(); }
    if (a === "envoyer") S.envoyerProgression();
    if (a === "exporter") S.exporterProgression();
  });

  /* ---------- Bac à sable : enregistrer / ouvrir un projet (module A) */
  if (!prof && page === "bac.html") {
    var barre = document.querySelector(".bac-barre");
    var Z = { html: document.getElementById("b-html"), css: document.getElementById("b-css"), js: document.getElementById("b-js") };
    if (barre && Z.html) {
      var bo = document.createElement("button"), be = document.createElement("button"), info = document.createElement("span");
      bo.type = be.type = "button"; bo.className = be.className = "btn-sec";
      bo.textContent = "📂 Ouvrir un projet"; be.textContent = "💾 Enregistrer le projet";
      info.className = "sti-projet-info";
      barre.appendChild(bo); barre.appendChild(be); barre.appendChild(info);
      var dossier = S.lire("sti-bac-dossier");
      function majInfo() { info.textContent = dossier ? "Projet : " + dossier : ""; info.title = dossier || ""; }
      majInfo();
      be.addEventListener("click", async function () {
        var d = await D.projet.enregistrer({ html: Z.html.value, css: Z.css.value, js: Z.js.value });
        if (d) { dossier = d; S.ecrire("sti-bac-dossier", d); majInfo(); S.toast("Projet enregistré : index.html, style.css, script.js", "ok"); }
      });
      bo.addEventListener("click", async function () {
        var p = await D.projet.ouvrir();
        if (!p) return;
        if (!p.html && !p.css && !p.js) { S.toast("Aucun fichier HTML, CSS ou JS dans ce dossier.", "ko"); return; }
        ["html", "css", "js"].forEach(function (k) { Z[k].value = p[k]; Z[k].dispatchEvent(new Event("input")); });
        dossier = p.dossier; S.ecrire("sti-bac-dossier", dossier); majInfo();
        S.toast("Projet ouvert", "ok");
      });
    }
  }

  /* ---------- Suivi des élèves : progressions locales (module D) */
  if (prof && page === "suivi.html") {
    var zone = document.getElementById("s-zone");
    var outils = document.createElement("div");
    outils.className = "sti-outils";
    outils.innerHTML = '<button type="button" class="btn-principal" data-a="imp">Importer des fichiers .sti</button>' +
      '<a class="btn-sec" href="' + RACINE + 'prof-modules/ramassage.html">Ramassage réseau</a>' +
      '<button type="button" class="btn-sec" data-a="dos">Ouvrir le dossier de ramassage</button>' +
      "<span>Les progressions envoyées par les élèves pendant le ramassage apparaissent ici automatiquement.</span>";
    zone.parentNode.insertBefore(outils, zone);
    outils.addEventListener("click", async function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "dos") D.ramassage.ouvrirDossier();
      if (b.dataset.a === "imp") {
        var n = await D.suivi.importer();
        if (n) { S.toast(n + " progression(s) importée(s)", "ok"); var m = document.getElementById("s-maj"); if (m) m.click(); }
      }
    });
    D.ramassage.surEvenement(function (x) { if (x.type === "progression") { var m = document.getElementById("s-maj"); if (m) m.click(); } });
  }

  /* ---------- Vérifier un code : accès à la vérification d'un dossier entier (module B) */
  if (page === "verifier.html") {
    var ref = document.getElementById("v-resultat");
    if (ref) {
      var p = document.createElement("p");
      p.className = "sti-outils";
      p.innerHTML = '<a class="btn-sec" href="' + RACINE + 'modules/verifier-dossier.html">📁 Vérifier un dossier entier (TP d\'élève, projet)</a>';
      ref.parentNode.insertBefore(p, ref);
    }
  }
})();
