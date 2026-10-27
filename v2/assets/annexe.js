/* Annexe complète : filtres et fiches dépliables. */
(function () {
  "use strict";
  var F = window.FicheSTI, DATA = F.data;
  var champ = document.getElementById("ref-q"), liste = document.getElementById("ref-liste"), compte = document.getElementById("ref-compte");
  var etat = { l: "", n: "" };
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  DATA.forEach(function (it, i) { it._i = i; it._txt = norm(it.e + " " + it.d + " " + it.c + " " + (it.k || "")); });

  var p = new URLSearchParams(location.search);
  if (p.get("q")) champ.value = p.get("q");

  function rendre() {
    var q = norm(champ.value.trim());
    var res = DATA.filter(function (it) {
      return (!etat.l || it.l === etat.l) && (!etat.n || String(it.n) === etat.n) && (!q || it._txt.indexOf(q) !== -1);
    });
    compte.textContent = res.length + " élément" + (res.length > 1 ? "s" : "");
    if (!res.length) {
      liste.innerHTML = '<p class="res-vide">Aucun élément ne correspond. S\'il n\'apparaît pas ici, il n\'est pas dans l\'annexe : il ne s\'enseigne pas.</p>';
      return;
    }
    var groupes = [], par = {};
    res.forEach(function (it) { var k = it.l + " — " + it.c; if (!par[k]) { par[k] = []; groupes.push(k); } par[k].push(it); });
    liste.innerHTML = groupes.map(function (k) {
      return '<section class="ref-cat"><h3>' + F.esc(k) + '</h3><div class="res-fiches">' + par[k].map(function (it) {
        return '<details class="res-fiche" data-i="' + it._i + '"><summary><code>' + F.esc(it.e) + '</code><span class="res-cat">' + F.esc(it.d) +
          '</span><span class="nb n' + it.n + '">' + it.n + 'ème</span></summary><div class="res-corps"></div></details>';
      }).join("") + "</div></section>";
    }).join("");
    liste.querySelectorAll("details.res-fiche").forEach(function (d) {
      d.addEventListener("toggle", function () {
        var c = d.querySelector(".res-corps");
        if (d.open && !c.innerHTML) { c.innerHTML = F.html(DATA[Number(d.dataset.i)], etat.n ? Number(etat.n) : 0); F.brancher(c); }
      });
    });
    if (res.length <= 3) liste.querySelectorAll("details.res-fiche").forEach(function (d) { d.open = true; });
  }
  function puces(id, cle) {
    var b = document.getElementById(id);
    b.addEventListener("click", function (e) {
      var x = e.target.closest("button");
      if (!x) return;
      etat[cle] = x.dataset.v;
      b.querySelectorAll("button").forEach(function (y) { y.setAttribute("aria-pressed", y === x ? "true" : "false"); });
      rendre();
    });
  }
  puces("ref-langue", "l");
  puces("ref-niveau", "n");
  champ.addEventListener("input", rendre);
  rendre();
})();
