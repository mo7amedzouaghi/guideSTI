/* En-tête commun des modules : <header class="m-barre" data-titre="…" data-sous="…" data-espace="eleve|prof" data-actif="tp"></header>
   Les liens sont relatifs à la racine de l'application (sti://app/). */
(function () {
  "use strict";
  var h = document.querySelector("header.m-barre");
  if (!h) return;
  var espace = h.dataset.espace || "eleve", actif = h.dataset.actif || "";
  var liens = espace === "prof"
    ? [["accueil", "/accueil/index.html", "⌂ Accueil"], ["guide", "/contenu/prof/index.html", "Espace Prof"], ["tp", "/prof-modules/tp.html", "TP & notes"],
       ["correcteur", "/prof-modules/correcteur.html", "Correcteur"], ["ramassage", "/prof-modules/ramassage.html", "Ramassage"], ["suivi", "/contenu/prof/suivi.html", "Suivi"], ["dossier", "/modules/verifier-dossier.html?espace=prof", "Vérifier un dossier"]]
    : [["accueil", "/accueil/index.html", "⌂ Accueil"], ["guide", "/contenu/eleves/index.html", "Espace Élèves"], ["tp", "/modules/tp-eleve.html", "TP & examens"],
       ["bac", "/contenu/eleves/bac.html", "Bac à sable"], ["dossier", "/modules/verifier-dossier.html", "Vérifier mon dossier"]];
  h.innerHTML = '<div class="m-barre-in"><a class="m-logo" href="/accueil/index.html" title="Accueil">STI</a><div class="m-titre"><b>' + (h.dataset.titre || "") +
    "</b><small>" + (h.dataset.sous || (espace === "prof" ? "STI · Espace Prof" : "STI · Espace Élèves")) + '</small></div><nav class="m-nav">' +
    liens.map(function (l) { return '<a href="' + l[1] + '"' + (l[0] === actif ? ' class="actif"' : "") + ">" + l[2] + "</a>"; }).join("") + "</nav></div>";
})();
