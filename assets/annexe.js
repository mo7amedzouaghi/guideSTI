/* Référentiel de l'annexe : filtres par langage, niveau et recherche */
(function () {
  "use strict";
  var data = window.ANNEXE || [];
  var champ = document.getElementById("ref-q");
  var liste = document.getElementById("ref-liste");
  var compte = document.getElementById("ref-compte");
  var etat = { l: "", n: "" };

  var esc = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var norm = function (s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  };

  var params = new URLSearchParams(location.search);
  if (params.get("q")) champ.value = params.get("q");

  function rendre() {
    var q = norm(champ.value.trim());
    var res = data.filter(function (it) {
      if (etat.l && it.l !== etat.l) return false;
      if (etat.n && String(it.n) !== etat.n) return false;
      if (q && norm(it.e + " " + it.d + " " + it.c + " " + it.x.join(" ")).indexOf(q) === -1) return false;
      return true;
    });
    compte.textContent = res.length + " élément" + (res.length > 1 ? "s" : "");
    if (!res.length) {
      liste.innerHTML = '<p class="enc info"><b class="ico">i</b><span>Aucun élément ne correspond. S\'il n\'apparaît pas ici, il n\'est pas dans l\'annexe : ne l\'enseignez pas.</span></p>';
      return;
    }
    var groupes = [], parCle = {};
    res.forEach(function (it) {
      var k = it.l + " — " + it.c;
      if (!parCle[k]) { parCle[k] = []; groupes.push(k); }
      parCle[k].push(it);
    });
    liste.innerHTML = groupes.map(function (k) {
      var lignes = parCle[k].map(function (it) {
        var extra = it.x.map(function (x) { return '<div class="ref-ex">' + esc(x) + "</div>"; }).join("");
        var rq = it.r ? '<div class="enc att" style="margin:6px 0 0;padding:6px 10px;font-size:13.5px"><b class="ico">!</b><span>' + esc(it.r) + "</span></div>" : "";
        return '<tr><td><a href="https://mo7amedzouaghi.github.io/annexe4STITN/?q=' + encodeURIComponent(it.e) + '" target="_blank" rel="noopener" title="Fiche détaillée : paramètres, exemple, remarques"><code>' + esc(it.e) + "</code></a></td><td>" + esc(it.d) + extra + rq +
          '</td><td><span class="nb n' + it.n + '">' + it.n + "ème</span></td></tr>";
      }).join("");
      return '<section class="ref-cat"><h3>' + esc(k) + '</h3><div class="tableau-wrap"><table class="t"><thead><tr><th>Élément</th><th>Définition</th><th>Niveau</th></tr></thead><tbody>' + lignes + "</tbody></table></div></section>";
    }).join("");
  }

  function puces(id, cle) {
    var boite = document.getElementById(id);
    boite.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      etat[cle] = b.getAttribute("data-v");
      boite.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      rendre();
    });
  }
  puces("ref-langue", "l");
  puces("ref-niveau", "n");
  champ.addEventListener("input", rendre);
  rendre();
})();
