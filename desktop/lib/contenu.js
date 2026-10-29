/* Adaptation du Guide STI (dossiers prof/ et eleves/ du dépôt guideSTI) à la version bureau :
   connexion Firebase retirée, pages de comptes supprimées, ajouts de l'application injectés.
   Utilisé par scripts/preparer-contenu.js (construction) et par le module E (mise à jour depuis GitHub). */
"use strict";
const fs = require("fs");
const path = require("path");

const ESPACES = ["prof", "eleves"];
const RETIRES = ["prof/comptes.html", "prof/assets/comptes.js"];

function adapterHtml(h, espace, fichier) {
  h = h
    .replace(/\s*<script src="\.\.\/connexion\/config\.js[^"]*"><\/script>/g, "")
    .replace(/<script src="\.\.\/connexion\/compte\.js[^"]*"[^>]*><\/script>/g, '<script src="../../desktop/compte-local.js"></script>')
    .replace(/\s*<link rel="manifest"[^>]*>/g, "")
    .replace(/\s*<link rel="apple-touch-icon"[^>]*>/g, "")
    .replace(/<a href="comptes\.html"[^>]*>[^<]*<\/a>/g, "")
    .replace("</head>", '<link rel="stylesheet" href="../../desktop/barre.css">\n</head>')
    .replace(/<\/body>(?![\s\S]*<\/body>)/, '<script src="../../desktop/commun.js"></script>\n<script src="../../desktop/barre.js"></script>\n</body>');
  if (espace === "prof" && fichier === "suivi.html") {
    h = h.replace(/Le meilleur score de chaque élève[^<]*/, "Le meilleur score de chaque élève à l'entraînement de chaque chapitre, d'après les progressions envoyées par le réseau ou importées (fichiers .sti). Filtrez par niveau et par classe, exportez vers Excel.");
  }
  return h;
}

function adapterSuivi(s) {
  return s
    .replace(/h \+= '<div class="s-info"><p>Aucun élève inscrit en '[\s\S]*?<\/code><\/p><\/div>";/,
      "h += '<div class=\"s-info\"><p>Aucune progression reçue en ' + F.n + \"ème année\" + (F.classe ? \" dans la classe \" + esc(F.classe) : \"\") + \". Les élèves envoient leur progression depuis l'Espace Élèves (bouton « Envoyer ma progression »), par le réseau du labo ou par fichier .sti à importer ci-dessus.</p></div>\";")
    .replace(/" inscrit" \+ \(L\.length > 1 \? "s" : ""\) \+ "/, "\"");
}

/* Adapte en place un dossier contenant prof/ et/ou eleves/. Renvoie le nombre de pages adaptées. */
function adapterDossier(cible) {
  for (const f of RETIRES) fs.rmSync(path.join(cible, f), { force: true });
  let pages = 0;
  for (const espace of ESPACES) {
    const d = path.join(cible, espace);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith(".html")) continue;
      const p = path.join(d, f);
      fs.writeFileSync(p, adapterHtml(fs.readFileSync(p, "utf8"), espace, f));
      pages++;
    }
  }
  const suivi = path.join(cible, "prof", "assets", "suivi.js");
  if (fs.existsSync(suivi)) fs.writeFileSync(suivi, adapterSuivi(fs.readFileSync(suivi, "utf8")));
  return pages;
}

/* Vérifie qu'un dossier adapté est complet pour la variante donnée. */
function verifierDossier(cible, avecProf) {
  const requis = ["eleves/index.html", "eleves/assets/data.js", "eleves/assets/verificateur.js"];
  if (avecProf) requis.push("prof/index.html", "prof/assets/data.js");
  const manque = requis.filter((f) => !fs.existsSync(path.join(cible, f)));
  if (manque.length) throw new Error("Contenu incomplet : " + manque.join(", "));
}

module.exports = { ESPACES, adapterHtml, adapterSuivi, adapterDossier, verifierDossier };
