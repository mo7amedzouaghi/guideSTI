/* Accueil : recherche dans l'annexe (fiches), les techniques hors annexe et les séquences du guide. */
(function () {
  "use strict";
  var M = window.MoteurSTI, F = window.FicheSTI;
  var NOTIONS = window.NOTIONS_STI || [];
  var form = document.getElementById("g-form"), champ = document.getElementById("g-q");
  var zone = document.getElementById("g-resultats"), accueil = document.getElementById("g-accueil");
  var niveau = 0;
  try { niveau = Number(localStorage.getItem("sti-niveau")) || 0; } catch (e) { niveau = 0; }

  NOTIONS.forEach(function (x) { x._t = M.norm(x.t); x._k = M.norm(x.k || ""); });

  function notions(q) {
    var mots = M.norm(q).split(/[\s,;?!:.'’]+/).filter(function (m) { return m.length >= 3; });
    if (!mots.length) return [];
    return NOTIONS.map(function (x) {
      var s = 0;
      mots.forEach(function (m) {
        var r = m.length > 4 ? m.replace(/(es|s|x)$/, "") : m;
        if (x._t.indexOf(r) !== -1) s += 6;
        else if ((" " + x._k + " ").indexOf(" " + r) !== -1) s += 3;
      });
      if (niveau && /^\d/.test(x.n) && Number(x.n[0]) > niveau) s = s * 0.5;
      return { x: x, s: s };
    }).filter(function (r) { return r.s >= 3; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 6);
  }

  function rendre(q) {
    q = q.trim();
    if (!q) { zone.innerHTML = ""; accueil.hidden = false; return; }
    accueil.hidden = true;
    var r = M.rechercher(q, niveau);
    var h = '<div class="res-entete"><h2>Résultats pour « ' + F.esc(q) + ' »</h2><button type="button" class="btn-sec" id="g-retour">Retour à l\'accueil</button></div>';
    if (r.hors.length) h += r.hors.slice(0, 2).map(F.hors).join("");
    var fiches = r.res.length ? r.res.filter(function (x) { return x.s >= r.res[0].s * 0.25; }).slice(0, 6) : [];
    if (fiches.length) {
      h += '<h3 class="res-titre">Dans l\'annexe</h3><div class="res-fiches">' + fiches.map(function (x, i) {
        var it = x.it;
        return '<details class="res-fiche"' + (i === 0 && !r.hors.length ? " open" : "") + ' data-i="' + it.i + '"><summary><code>' + F.esc(it.e) +
          '</code><span class="res-cat">' + F.esc(it.l) + " · " + F.esc(it.c) + '</span><span class="nb n' + it.n + '">' + it.n + 'ème</span></summary><div class="res-corps"></div></details>';
      }).join("") + "</div>";
    }
    var ns = notions(q);
    if (ns.length) {
      h += '<h3 class="res-titre">Dans les séquences et les ressources</h3><ul class="res-notions">' + ns.map(function (x) {
        return '<li><a href="' + x.x.u + '"><span class="nb-txt">' + F.esc(x.x.n) + "</span>" + F.esc(x.x.t) + "</a></li>";
      }).join("") + "</ul>";
    }
    if (!r.hors.length && !fiches.length && !ns.length) {
      h += '<p class="res-vide">Aucun résultat. Essayez le nom exact (<code>substring</code>, <code>float</code>, <code>HAVING</code>) ou un besoin (« arrondir », « liste déroulante »). ' +
        "Si une technique n'apparaît pas, elle n'est pas dans l'annexe : elle ne s'enseigne pas.</p>";
    }
    zone.innerHTML = h;
    zone.querySelectorAll("details.res-fiche").forEach(function (d) {
      var remplir = function () {
        var c = d.querySelector(".res-corps");
        if (!c.innerHTML) { c.innerHTML = F.html(M.data[Number(d.dataset.i)], niveau); F.brancher(c); }
      };
      if (d.open) remplir();
      d.addEventListener("toggle", function () { if (d.open) remplir(); });
    });
    F.brancher(zone);
    document.getElementById("g-retour").addEventListener("click", function () { champ.value = ""; history.replaceState(null, "", location.pathname); rendre(""); champ.focus(); });
    zone.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    history.replaceState(null, "", "?q=" + encodeURIComponent(champ.value.trim()));
    rendre(champ.value);
  });

  var boutons = document.querySelectorAll(".niveau-filtre button");
  function maj() { boutons.forEach(function (b) { b.setAttribute("aria-pressed", Number(b.dataset.n) === niveau ? "true" : "false"); }); }
  boutons.forEach(function (b) {
    b.addEventListener("click", function () {
      niveau = Number(b.dataset.n);
      try { localStorage.setItem("sti-niveau", String(niveau)); } catch (e) { /* stockage indisponible */ }
      maj();
      if (champ.value.trim()) rendre(champ.value);
    });
  });
  maj();

  var q = new URLSearchParams(location.search).get("q");
  if (q) { champ.value = q; rendre(q); }
})();
