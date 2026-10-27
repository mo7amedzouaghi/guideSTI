/* Page de séquence : impression de la séquence ou de la seule fiche « À retenir ». */
(function () {
  "use strict";
  document.querySelectorAll("[data-imprimer]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.imprimer === "retenir") document.body.classList.add("imp-retenir");
      window.print();
    });
  });
  window.addEventListener("afterprint", function () { document.body.classList.remove("imp-retenir"); });
})();
