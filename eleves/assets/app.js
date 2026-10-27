/* Guide du Programme STI — comportements communs */
(function () {
  "use strict";

  /* Menu mobile */
  var burger = document.querySelector(".burger");
  var menu = document.querySelector(".menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var ouvert = menu.classList.toggle("ouvert");
      burger.setAttribute("aria-expanded", ouvert ? "true" : "false");
    });
  }

  /* Bouton « Copier » sur chaque bloc de code */
  document.querySelectorAll(".copier").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var code = btn.closest(".code").querySelector("code").innerText;
      var fini = function () {
        btn.textContent = "Copié ✓";
        setTimeout(function () { btn.textContent = "Copier"; }, 1600);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(fini, fini);
      } else {
        var t = document.createElement("textarea");
        t.value = code; document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(t); fini();
      }
    });
  });

  /* Aperçus : hauteur ajustée au contenu */
  document.querySelectorAll(".navigateur iframe").forEach(function (fr) {
    fr.addEventListener("load", function () {
      try {
        var h = fr.contentDocument.documentElement.scrollHeight;
        if (h > 40) fr.style.height = Math.min(h + 4, 520) + "px";
      } catch (e) { /* aperçu isolé : on garde la hauteur prévue */ }
    });
  });

  /* Sommaire : section active */
  var liens = document.querySelectorAll(".sommaire a[href^='#']");
  if (liens.length && "IntersectionObserver" in window) {
    var parId = {};
    liens.forEach(function (a) { parId[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting && parId[e.target.id]) {
          liens.forEach(function (a) { a.classList.remove("actif"); });
          parId[e.target.id].classList.add("actif");
        }
      });
    }, { rootMargin: "-90px 0px -70% 0px" });
    Object.keys(parId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  /* Recherche globale (index généré : window.INDEX_STI) */
  var champ = document.getElementById("recherche");
  var boite = document.getElementById("resultats");
  if (champ && boite && window.INDEX_STI) {
    var couleurs = { "2ème": "var(--n2)", "3ème": "var(--n3)", "4ème": "var(--n4)", "Guide": "var(--marine)" };
    var norm = function (s) {
      return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    };
    var sel = -1;
    var afficher = function () {
      var q = norm(champ.value.trim());
      sel = -1;
      if (q.length < 2) { boite.classList.remove("ouvert"); boite.innerHTML = ""; return; }
      var mots = q.split(/\s+/);
      var res = window.INDEX_STI.filter(function (r) {
        var cible = norm(r.t + " " + r.k);
        return mots.every(function (m) { return cible.indexOf(m) !== -1; });
      }).slice(0, 12);
      if (!res.length) {
        boite.innerHTML = '<div class="vide">Aucun résultat. Essayez un nom de balise, de propriété ou de fonction (ex. « float », « substring », « GROUP BY »).</div>';
      } else {
        boite.innerHTML = res.map(function (r) {
          return '<a href="' + r.u + '"><span class="niv" style="background:' + (couleurs[r.n] || "var(--marine)") + '">' + r.n + "</span><span>" + r.t + "</span></a>";
        }).join("");
      }
      boite.classList.add("ouvert");
    };
    champ.addEventListener("input", afficher);
    champ.addEventListener("keydown", function (e) {
      var items = boite.querySelectorAll("a");
      if (!items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        sel = e.key === "ArrowDown" ? Math.min(sel + 1, items.length - 1) : Math.max(sel - 1, 0);
        items.forEach(function (a, i) { a.classList.toggle("sel", i === sel); });
      } else if (e.key === "Enter") {
        e.preventDefault();
        (items[sel] || items[0]).click();
      } else if (e.key === "Escape") {
        boite.classList.remove("ouvert");
      }
    });
    document.addEventListener("click", function (e) {
      if (!boite.contains(e.target) && e.target !== champ) boite.classList.remove("ouvert");
    });
  }
})();
