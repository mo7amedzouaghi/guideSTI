/* cleSTI : clé de stockage propre au compte connecté (défini dans connexion/compte.js) */
window.cleSTI = window.cleSTI || function (k) { return k; };
/* Aide-mémoire : éléments de l'annexe jusqu'au niveau de l'élève, fiches dépliables. */
(function () {
  "use strict";
  var F = window.FicheSTI, DATA = F.data;
  var champ = document.getElementById("ref-q"), liste = document.getElementById("ref-liste"), compte = document.getElementById("ref-compte");
  var niveau = 3;
  try { niveau = Number(localStorage.getItem(cleSTI("sti-niveau-eleve"))) || 3; } catch (e) { niveau = 3; }
  var etat = { l: "" };
  function norm(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  DATA.forEach(function (it, i) { it._i = i; it._txt = norm(it.e + " " + it.d + " " + it.c + " " + (it.k || "")); });

  function rendre() {
    var q = norm(champ.value.trim());
    var res = DATA.filter(function (it) {
      return it.n <= niveau && (!etat.l || it.l === etat.l) && (!q || it._txt.indexOf(q) !== -1) && !/^(&&|\|\||!|==|!=|>|<|>=|<=|\+|-|\*|\/|%|=|\.)$/.test(it.e);
    });
    compte.textContent = res.length + " élément" + (res.length > 1 ? "s" : "") + " jusqu'en " + niveau + "ème";
    if (!res.length) {
      liste.innerHTML = '<p class="res-vide">Rien trouvé à ton niveau. Si ce que tu cherches n\'apparaît pas, ce n\'est pas au programme de ' + niveau + "ème.</p>";
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
        if (d.open && !c.innerHTML) { c.innerHTML = F.html(DATA[Number(d.dataset.i)], niveau); F.brancher(c); }
      });
    });
    if (res.length <= 3) liste.querySelectorAll("details.res-fiche").forEach(function (d) { d.open = true; });
  }

  document.getElementById("ref-langue").addEventListener("click", function (e) {
    var x = e.target.closest("button"); if (!x) return;
    etat.l = x.dataset.v;
    this.querySelectorAll("button").forEach(function (y) { y.setAttribute("aria-pressed", y === x ? "true" : "false"); });
    rendre();
  });
  var bn = document.getElementById("ref-niveau");
  function majN() { bn.querySelectorAll("button").forEach(function (y) { y.setAttribute("aria-pressed", Number(y.dataset.v) === niveau ? "true" : "false"); }); }
  bn.addEventListener("click", function (e) {
    var x = e.target.closest("button"); if (!x) return;
    niveau = Number(x.dataset.v);
    try { localStorage.setItem(cleSTI("sti-niveau-eleve"), String(niveau)); } catch (er) { /* ignoré */ }
    majN(); rendre();
  });
  champ.addEventListener("input", rendre);
  majN(); rendre();
})();
