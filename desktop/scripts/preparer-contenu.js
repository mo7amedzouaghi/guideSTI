/* Copie l'Espace Prof et l'Espace Élèves du dépôt guideSTI dans app/contenu,
   en retirant la connexion Firebase (version bureau sans inscription).
   Usage : node scripts/preparer-contenu.js [chemin du dépôt guideSTI] */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { ESPACES, adapterDossier, verifierDossier } = require("../lib/contenu");

const depot = path.resolve(process.argv[2] || path.join(__dirname, "..", "..", "guidesti"));
const cible = path.join(__dirname, "..", "app", "contenu");
if (!ESPACES.every((e) => fs.existsSync(path.join(depot, e)))) {
  console.error("Dépôt guideSTI introuvable : " + depot);
  process.exit(1);
}

fs.rmSync(cible, { recursive: true, force: true });
for (const espace of ESPACES) fs.cpSync(path.join(depot, espace), path.join(cible, espace), { recursive: true });
const pages = adapterDossier(cible);
verifierDossier(cible, true);

// version du contenu intégré (comparée à GitHub par le module E)
let version = { sha: "", date: "", message: "" };
try {
  const [sha, date, ...msg] = execFileSync("git", ["-C", depot, "log", "-1", "--format=%H%n%cI%n%s", "--", ...ESPACES], { encoding: "utf8" }).trim().split("\n");
  version = { sha, date, message: msg.join(" ") };
} catch (e) { console.warn("Version git inconnue (dépôt sans historique)."); }
fs.writeFileSync(path.join(cible, "version.json"), JSON.stringify(Object.assign(version, { source: "integre" }), null, 2) + "\n");

console.log(pages + " pages préparées depuis " + depot + (version.sha ? " (" + version.sha.slice(0, 7) + " du " + version.date.slice(0, 10) + ")" : ""));
