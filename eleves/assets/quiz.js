/* cleSTI : clé de stockage propre au compte connecté (défini dans connexion/compte.js) */
window.cleSTI = window.cleSTI || function (k) { return k; };
/* Exercices auto-corrigés : QCM, vrai/faux, code à compléter, trouver l'erreur. */
(function () {
  "use strict";
  var EXOS = window.EXOS || [];
  var zone = document.getElementById("quiz");
  var chap = document.querySelector("[data-chap]");
  if (!zone || !chap) return;
  var cle = cleSTI("sti-score-" + chap.dataset.niveau + "-" + chap.dataset.chap);
  var TYPES = { qcm: "Choix multiple", vf: "Vrai ou faux", code: "Complète le code", erreur: "Trouve l'erreur" };
  var reponses = {};

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function normaliser(s, sensible) {
    s = String(s).trim().replace(/;$/, "").replace(/^["']|["']$/g, "").trim();
    return sensible ? s : s.toLowerCase();
  }

  function rendre() {
    reponses = {};
    var meilleur = null;
    try { meilleur = localStorage.getItem(cle); } catch (e) { meilleur = null; }
    var h = '<div class="quiz-entete"><span id="q-avance">0 / ' + EXOS.length + ' répondues</span>' +
      (meilleur !== null ? '<span class="q-record">Meilleur score : ' + meilleur + " %</span>" : "") + "</div>";
    EXOS.forEach(function (x, i) {
      h += '<article class="q" data-i="' + i + '"><div class="q-tete"><b>' + (i + 1) + '</b><span class="q-type">' + TYPES[x.type] + "</span></div>" +
        '<p class="q-enonce">' + esc(x.q) + "</p>";
      if (x.type === "qcm") {
        h += '<div class="q-choix">' + x.choix.map(function (c, j) {
          return '<button type="button" class="q-opt" data-v="' + j + '"><span class="q-lettre">' + "ABCD"[j] + "</span><code>" + esc(c) + "</code></button>";
        }).join("") + "</div>";
      } else if (x.type === "vf") {
        h += '<div class="q-choix vf"><button type="button" class="q-opt" data-v="1">Vrai</button><button type="button" class="q-opt" data-v="0">Faux</button></div>';
      } else if (x.type === "code") {
        var parts = esc(x.code).split("___");
        h += '<pre class="q-code">' + parts[0] + '<input type="text" class="q-trou" aria-label="Réponse" autocomplete="off" autocapitalize="off" spellcheck="false">' +
          parts.slice(1).join("___") + '</pre><button type="button" class="q-valider">Valider</button>';
      } else if (x.type === "erreur") {
        h += '<div class="q-lignes">' + x.lignes.map(function (l, j) {
          return '<button type="button" class="q-opt q-ligne" data-v="' + j + '"><span>' + (j + 1) + "</span><code>" + esc(l) + "</code></button>";
        }).join("") + "</div>";
      }
      h += '<div class="q-retour" hidden></div></article>';
    });
    h += '<div class="quiz-fin" id="q-fin" hidden></div>';
    zone.innerHTML = h;

    zone.querySelectorAll(".q").forEach(function (q) {
      var i = Number(q.dataset.i), x = EXOS[i];
      q.querySelectorAll(".q-opt").forEach(function (b) {
        b.addEventListener("click", function () {
          if (q.classList.contains("fait")) return;
          var v = Number(b.dataset.v);
          var bon = x.type === "vf" ? (v === 1) === x.rep : v === x.bonne;
          b.classList.add(bon ? "juste" : "faux");
          if (!bon) {
            var bonneV = x.type === "vf" ? (x.rep ? 1 : 0) : x.bonne;
            var bb = q.querySelector('.q-opt[data-v="' + bonneV + '"]');
            if (bb) bb.classList.add("juste");
          }
          corriger(q, i, bon);
        });
      });
      var trou = q.querySelector(".q-trou");
      if (trou) {
        var valider = function () {
          if (q.classList.contains("fait") || !trou.value.trim()) { trou.focus(); return; }
          var bon = x.attendu.some(function (a) {
            var sensible = /[A-Z]/.test(a);
            return normaliser(trou.value, sensible) === normaliser(a, sensible);
          });
          trou.classList.add(bon ? "juste" : "faux");
          trou.readOnly = true;
          if (!bon) trou.insertAdjacentHTML("afterend", ' <span class="q-attendu">→ ' + esc(x.attendu[0]) + "</span>");
          corriger(q, i, bon);
        };
        q.querySelector(".q-valider").addEventListener("click", valider);
        trou.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); valider(); } });
      }
    });
  }

  function corriger(q, i, bon) {
    q.classList.add("fait", bon ? "ok" : "ko");
    reponses[i] = bon;
    var r = q.querySelector(".q-retour");
    r.hidden = false;
    r.innerHTML = "<strong>" + (bon ? "✔ Bonne réponse." : "✗ Ce n'est pas ça.") + "</strong> " + esc(EXOS[i].expl);
    var nb = Object.keys(reponses).length;
    document.getElementById("q-avance").textContent = nb + " / " + EXOS.length + " répondues";
    if (nb === EXOS.length) terminer();
  }

  function terminer() {
    var justes = Object.keys(reponses).filter(function (k) { return reponses[k]; }).length;
    var pc = Math.round(100 * justes / EXOS.length);
    var ancien = null;
    try { var brut = localStorage.getItem(cle); ancien = brut === null ? null : Number(brut); } catch (e) { ancien = null; }
    var record = ancien === null || isNaN(ancien) || pc > ancien;
    try { if (record) localStorage.setItem(cle, String(pc)); } catch (e) { /* stockage indisponible */ }
    var msg = pc >= 80 ? "Chapitre maîtrisé ! Passe à la fiche « À retenir » puis au chapitre suivant."
      : pc >= 50 ? "Pas mal. Relis les notions où tu t'es trompé, puis recommence."
      : "Reprends la partie « Je comprends » et refais l'entraînement.";
    var fin = document.getElementById("q-fin");
    fin.hidden = false;
    fin.className = "quiz-fin " + (pc >= 80 ? "ok" : pc >= 50 ? "moyen" : "ko");
    fin.innerHTML = '<div class="score"><b>' + pc + ' %</b><span>' + justes + " / " + EXOS.length + "</span></div><div><h3>" +
      (record && ancien !== null && !isNaN(ancien) && ancien > 0 ? "Nouveau record !" : "Résultat") + "</h3><p>" + msg + '</p>' +
      '<button type="button" class="btn-principal" id="q-recommencer">Recommencer</button> <a class="btn-sec" href="#retenir">Voir la fiche « À retenir »</a></div>';
    document.getElementById("q-recommencer").addEventListener("click", function () { rendre(); zone.scrollIntoView({ behavior: "smooth" }); });
    fin.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  rendre();
})();
