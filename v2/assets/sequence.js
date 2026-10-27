/* Page de chapitre : impression (chapitre ou fiche « À retenir ») et téléchargement des exemples. */
(function () {
  "use strict";
  document.querySelectorAll("[data-imprimer]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.body.classList.toggle("imp-retenir", b.dataset.imprimer === "retenir");
      // laisser le navigateur appliquer la classe avant d'ouvrir l'impression
      setTimeout(function () { window.print(); }, 60);
    });
  });
  window.addEventListener("afterprint", function () { document.body.classList.remove("imp-retenir"); });

  document.querySelectorAll("[data-telecharger]").forEach(function (b) {
    b.addEventListener("click", function () {
      var titre = document.querySelector("h1").innerText;
      var txt = "Exemples du chapitre : " + titre + "\n" + location.href.split("#")[0] + "\n";
      document.querySelectorAll(".notion").forEach(function (n) {
        var codes = n.querySelectorAll(".code");
        if (!codes.length) return;
        txt += "\n\n==================== " + n.querySelector("h3").innerText + " ====================\n";
        codes.forEach(function (c) {
          var tete = c.querySelector(".code-tete span");
          txt += "\n--- " + (tete ? tete.innerText.replace(/\s+/g, " ").trim() : "Code") + " ---\n" + c.querySelector("code").innerText + "\n";
        });
      });
      var url = URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8" }));
      var a = document.createElement("a");
      a.href = url;
      a.download = b.dataset.telecharger + "-exemples.txt";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
    });
  });
})();
