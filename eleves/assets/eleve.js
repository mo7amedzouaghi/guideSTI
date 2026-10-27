/* cleSTI : clé de stockage propre au compte connecté (défini dans connexion/compte.js) */
window.cleSTI = window.cleSTI || function (k) { return k; };
/* Espace élèves : progression, bouton « Essayer » sur les exemples, impression de la fiche. */
(function () {
  "use strict";
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
  var PLAN = window.PLAN_STI || {};

  function remplir(el, pc, txtSiVide) {
    var barre = el.querySelector(".prog-barre span"), txt = el.querySelector(".prog-txt");
    if (!barre) return;
    if (pc === null) { barre.style.width = "0"; if (txt) txt.textContent = txtSiVide; return; }
    barre.style.width = pc + "%";
    barre.className = pc >= 80 ? "ok" : pc >= 50 ? "moyen" : "ko";
    if (txt) txt.textContent = txtSiVide === null ? pc + " %" : "Score : " + pc + " %" + (pc >= 80 ? " — maîtrisé ✓" : "");
  }

  /* progression par chapitre (pages de niveau) */
  document.querySelectorAll("[data-score]").forEach(function (a) {
    var v = lire(cleSTI("sti-score-" + a.dataset.score));
    remplir(a, v === null ? null : Number(v), "Pas encore commencé");
  });
  /* progression par niveau (accueil) */
  document.querySelectorAll("[data-niveau-total]").forEach(function (a) {
    var n = a.dataset.niveauTotal, chaps = PLAN[n] || [];
    var faits = 0, total = 0;
    chaps.forEach(function (c) { var v = lire(cleSTI("sti-score-" + n + "-" + c.k)); if (v !== null) { faits++; total += Number(v); } });
    var txt = a.querySelector(".prog-txt");
    if (!faits) { remplir(a, null, chaps.length + " chapitres"); return; }
    var maitrises = chaps.filter(function (c) { var v = lire(cleSTI("sti-score-" + n + "-" + c.k)); return v !== null && Number(v) >= 80; }).length;
    remplir(a, Math.round(total / chaps.length), null);
    if (txt) txt.textContent = maitrises + " / " + chaps.length + " chapitres maîtrisés";
  });

  /* niveau de l'élève mémorisé (bac à sable, aide-mémoire) */
  var chap = document.querySelector("[data-niveau]");
  var m = location.pathname.match(/n([234])(-c\d+)?\.html$/);
  if (chap) ecrire(cleSTI("sti-niveau-eleve"), chap.dataset.niveau); else if (m) ecrire(cleSTI("sti-niveau-eleve"), m[1]);

  /* bouton « Essayer » sous chaque exemple HTML, CSS ou JS */
  document.querySelectorAll("#comprendre .code").forEach(function (c) {
    var lang = (c.querySelector(".code-tete .lang") || {}).textContent;
    var cible = { HTML: "html", CSS: "css", JS: "js" }[lang];
    if (!cible) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "essayer";
    b.textContent = "▶ Essayer dans le bac à sable";
    b.addEventListener("click", function () {
      ecrire(cleSTI("sti-bac-import"), JSON.stringify({ p: cible, code: c.querySelector("code").innerText }));
      location.href = "bac.html?import=1";
    });
    c.insertAdjacentElement("afterend", b);
  });

  /* impression de la fiche « À retenir » */
  document.querySelectorAll("[data-imprimer]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.body.classList.add("imp-retenir");
      setTimeout(function () { window.print(); }, 60);
    });
  });
  window.addEventListener("afterprint", function () { document.body.classList.remove("imp-retenir"); });

  /* étape active dans la navigation du chapitre */
  var liens = document.querySelectorAll(".etapes-chap a");
  if (liens.length && "IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) liens.forEach(function (a) { a.classList.toggle("actif", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-140px 0px -60% 0px" });
    document.querySelectorAll(".etape").forEach(function (s) { obs.observe(s); });
  }
})();
