/* Construit les installateurs Windows.
   node scripts/construire.js complet   → STI Guide (Espace Élève + Espace Prof protégé par code)
   node scripts/construire.js eleve     → STI Élève (aucune page prof, aucun corrigé : pour les postes du labo)
   Chaque variante produit un installateur (.exe NSIS) et une version portable (.exe, clé USB). */
"use strict";
const fs = require("fs");
const path = require("path");
const builder = require("electron-builder");

const variante = process.argv[2] === "eleve" ? "eleve" : "complet";
const racine = path.join(__dirname, "..");
const pkg = require(path.join(racine, "package.json"));
fs.writeFileSync(path.join(racine, "app", "variante.json"), JSON.stringify({ variante }) + "\n");

const complet = variante === "complet";
const nom = complet ? "STI Guide" : "STI Eleve";
const fichiers = ["main.js", "preload.js", "package.json", "build/icon.png", "lib/**/*", "app/**/*"];
if (!complet) fichiers.push("!app/contenu/prof/**", "!app/prof-modules/**");

builder.build({
  publish: "never",
  targets: builder.Platform.WINDOWS.createTarget(["nsis", "portable"], builder.Arch.x64),
  config: {
    appId: complet ? "tn.sti.guide" : "tn.sti.eleve",
    productName: nom,
    copyright: "© Zouaghi Mohamed — Lycée Oued Ellil",
    directories: { output: path.join("dist", variante), buildResources: "build" },
    files: fichiers,
    asar: true,
    // fichiers de mise à jour (latest.yml / eleve.yml + .blockmap) ; la publication est faite par GitHub Actions
    publish: [{ provider: "generic", url: "https://github.com/mo7amedzouaghi/guideSTI/releases/download/bureau-derniere", channel: complet ? "latest" : "eleve" }],
    extraMetadata: { name: complet ? "sti-guide" : "sti-eleve", productName: nom },
    win: { icon: "build/icon.ico", signAndEditExecutable: true, signExecutable: false, legalTrademarks: "Zouaghi Mohamed" },
    nsis: {
      oneClick: false, perMachine: true, allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true, createStartMenuShortcut: true, shortcutName: nom,
      installerLanguages: ["fr_FR"], language: "1036", include: "build/installer.nsh",
      artifactName: (complet ? "STI-Guide" : "STI-Eleve") + "-Installation-${version}.${ext}"
    },
    portable: { artifactName: (complet ? "STI-Guide" : "STI-Eleve") + "-Portable-${version}.${ext}" }
  }
}).then((r) => {
  console.log(variante + " :\n  " + r.filter((f) => f.endsWith(".exe")).join("\n  "));
}).catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => fs.writeFileSync(path.join(racine, "app", "variante.json"), JSON.stringify({ variante: "complet" }) + "\n"));
