/* Correcteur de devoirs (processus principal) :
   - extraction des travaux (RAR, ZIP, dossiers, archives imbriquées) et repérage des élèves ;
   - lecture / modèle de la grille d'évaluation (Excel) ;
   - vérifications automatiques : fichier, contient, absent, conforme, page, sql ;
   - export Excel détaillé (notes par question, grille détaillée, justifications, statistiques). */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { unzipSync } = require("fflate");
const ExcelJS = require("exceljs");
const STISQL = require("../app/modules/sqlmoteur.js");
const TOL = require("./tolerance.js");
// réglages par défaut de la correction tolérante (modifiables pour chaque devoir)
// règles validées par l'enseignant : code → points retirés (0 = toléré sans pénalité) ; une règle absente n'est pas appliquée.
// Une erreur n'est pénalisée qu'une fois par élève, même si elle touche plusieurs critères.
const SQLN = require("./sqlnote.js");
const TOLERANCE = { active: true, max: 5, regles: { A1: 0.25, A2: 0.25, A4: 0.25, A5: 0.25, A6: 0.25, A7: 0.25, A8: 0.25, A9: 0, A10: 0.25, A11: 0.25, B1: 0, B2: 0, C1: 0.25, C2: 0, C3: 0.25, D3: 0.25, D4: 0 } };
/* Réglages de notation (personnalisables pour chaque devoir) :
   pas : arrondi de chaque critère (0,25 comme l'enseignant ; 0 = sans arrondi) ; arrondi : proche | superieur | inferieur ;
   parType : une erreur de forme est pénalisée une fois par TYPE sur toute la copie (sinon une fois par occurrence) ;
   plafond : pénalités de forme au plus sur la copie (0 = sans plafond) ;
   ecartAnnexe : points retirés par type d'écart à l'annexe (vérification « conforme ») ;
   erreurSql : points retirés par type d'erreur dans une requête (commande principale fausse = 0). */
const REGLAGES = { pas: 0.25, arrondi: "proche", parType: true, plafond: 0, ecartAnnexe: 0.25, erreurSql: 0.25, noteFinale: 0.25 };
// note sur 20, arrondie au pas choisi (0,25 par défaut : 14,67 n'existe pas sur une copie)
function noteSur20(total, max, R) {
  const n = max ? total * 20 / max : 0, p = Number((R || REGLAGES).noteFinale);
  return Math.round((p ? Math.round(n / p + 1e-9) * p : n) * 100) / 100;
}
// élève en difficulté : erreurs de forme ignorées, pénalités plafonnées à 1 point
const DIFFICULTE = { plafond: 1 };
function reglages(ctx) { return Object.assign({}, REGLAGES, ctx.reglages || {}); }
const regleActive = (ctx, code) => { const t = ctx.tolerance || {}; return t.active && t.regles && Object.prototype.hasOwnProperty.call(t.regles, code) && t.regles[code] !== null && t.regles[code] !== false; };
/* pénalités de forme : une fois par type d'erreur (ou par occurrence) et par élève, plafonnées sur la copie */
function deduire(ctx, corrections, pts) {
  const R = reglages(ctx), deja = ctx.penalisees || new Set(), ici = new Set();
  const cumul = ctx.cumul || (ctx.cumul = { v: 0 });
  const plafond = ctx.difficulte ? Math.min(Number(R.plafond) || DIFFICULTE.plafond, DIFFICULTE.plafond) : Number(R.plafond) || 0;
  let retrait = 0, nouvelles = 0, dejaComptees = 0;
  for (const c of corrections) {
    const k = R.parType ? (c.type || c.code) : (c.cle || c.code + "|" + c.texte);
    if (ici.has(k)) continue;            // la même faute vue deux fois dans ce critère
    ici.add(k);
    if (deja.has(k)) { dejaComptees++; continue; }
    deja.add(k); nouvelles++;
    let m = c.montant !== undefined ? Number(c.montant) : Number(((ctx.tolerance || {}).regles || {})[c.code]) || 0;
    if (ctx.difficulte && c.code !== "E" && c.code !== "S") m = 0;   // erreurs de forme ignorées
    if (plafond) m = Math.max(0, Math.min(m, plafond - cumul.v));
    cumul.v += m; retrait += m;
  }
  return { retrait: Math.min(pts, retrait), nouvelles, dejaComptees };
}
function texteRetrait(d) {
  return d.retrait ? " (−" + String(Math.round(d.retrait * 100) / 100).replace(".", ",") + " pt" + (d.retrait > 1 ? "s" : "") + (d.dejaComptees ? ", " + d.dejaComptees + " erreur(s) déjà pénalisée(s) ailleurs" : "") + ")"
    : d.dejaComptees ? " (erreur déjà pénalisée dans un autre critère)" : "";
}
/* arrondi au pas choisi (0,25 par défaut), comme une correction à la main */
function arrondiPas(x, R) {
  const p = Number(R.pas) || 0;
  if (!p) return Math.round(x * 100) / 100;
  const k = x / p, f = R.arrondi === "superieur" ? Math.ceil(k - 1e-6) : R.arrondi === "inferieur" ? Math.floor(k + 1e-6) : Math.round(k + 1e-9);
  return Math.round(f * p * 100) / 100;
}
/* code sans les commentaires (le code commenté n'est pas évalué) */
function sansCommentaires(t, f) {
  const e = ((/\.(\w+)$/.exec(f || "") || [])[1] || "").toLowerCase();
  let s = String(t || "");
  const ligne = (x) => x.replace(/(^|[^:\\"'])\/\/[^\n]*/g, "$1");
  if (/^(html?|php)$/.test(e)) s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/\/\*[\s\S]*?\*\//g, " ");
  if (e === "js") s = ligne(s);
  // HTML / PHP : « // » n'est un commentaire que dans un script ou un bloc PHP (pas dans le texte de la page)
  else if (/^(html?|php)$/.test(e)) s = s.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (t, a, c, b) => a + ligne(c) + b).replace(/(<\?(?:php)?)([\s\S]*?)(\?>|$)/gi, (t, a, c, b) => a + ligne(c) + b);
  if (e === "sql") s = s.replace(/(^|\s)(--|#)[^\n]*/g, "$1");
  return s;
}

const EXT_CODE = /\.(html?|css|js|php|sql|txt)$/i;
const VERIFS = ["manuel", "fichier", "contient", "absent", "conforme", "page", "sql"];

/* ================================================================ archives */
function ecrireSur(base, rel, contenu) {
  const p = path.normalize(path.join(base, rel.replace(/\\/g, "/")));
  if (!p.startsWith(path.normalize(base) + path.sep)) return null;      // « ../ » refusé
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, contenu);
  return p;
}
function ignorer(nom) { return /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db|desktop\.ini)(\/|$)/i.test(nom); }

async function extraireArchive(fichier, dest) {
  const buf = fs.readFileSync(fichier);
  fs.mkdirSync(dest, { recursive: true });
  const sig = buf.slice(0, 8).toString("binary");
  let n = 0;
  if (sig.startsWith("PK")) {
    const f = unzipSync(new Uint8Array(buf));
    for (const [nom, contenu] of Object.entries(f)) {
      if (nom.endsWith("/") || ignorer(nom)) continue;
      if (ecrireSur(dest, nom, Buffer.from(contenu))) n++;
    }
  } else if (sig.startsWith("Rar!")) {
    const { createExtractorFromData } = require("node-unrar-js");
    const wasmBinary = fs.readFileSync(require.resolve("node-unrar-js/dist/js/unrar.wasm"));
    const ex = await createExtractorFromData({ wasmBinary, data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) });
    const r = ex.extract();
    for (const f of r.files) {
      if (f.fileHeader.flags.directory || !f.extraction || ignorer(f.fileHeader.name)) continue;
      if (ecrireSur(dest, f.fileHeader.name, Buffer.from(f.extraction))) n++;
    }
  } else {
    throw new Error(path.basename(fichier) + " : format d'archive non reconnu (RAR ou ZIP attendu).");
  }
  return n;
}
function estArchive(f) { return /\.(zip|rar)$/i.test(f); }

/* Extrait les archives de dossier (récursivement, profondeur limitée), en les remplaçant par un dossier du même nom */
async function deplierArchives(dossier, profondeur, journal) {
  if (profondeur > 3) return;
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) await deplierArchives(p, profondeur + 1, journal);
    else if (estArchive(e.name)) {
      const d = path.join(dossier, e.name.replace(/\.(zip|rar)$/i, ""));
      try { await extraireArchive(p, d); fs.rmSync(p); await deplierArchives(d, profondeur + 1, journal); }
      catch (err) { journal.push(e.name + " : " + err.message); }
    }
  }
}

/* Repère les élèves : un dossier (ou une archive dépliée) par élève */
function reperesEleves(racine) {
  let d = racine;
  for (;;) {
    const l = fs.readdirSync(d, { withFileTypes: true }).filter((e) => !ignorer(e.name));
    if (l.length === 1 && l[0].isDirectory()) d = path.join(d, l[0].name); else break;
  }
  const l = fs.readdirSync(d, { withFileTypes: true }).filter((e) => !ignorer(e.name));
  const dossiers = l.filter((e) => e.isDirectory());
  const fichiers = l.filter((e) => e.isFile());
  if (!dossiers.length) return [{ nom: path.basename(d), dossier: d }];   // un seul élève
  const res = dossiers.map((e) => ({ nom: e.name, dossier: path.join(d, e.name) }));
  if (fichiers.some((f) => EXT_CODE.test(f.name))) res.push({ nom: "(fichiers isolés)", dossier: d, isoles: true });
  return res.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
function nomLisible(n) { return String(n).replace(/\.(zip|rar)$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim(); }

/* Importe les travaux (archives et/ou dossiers) dans dest/ : renvoie la liste des élèves */
async function importerTravaux(sources, dest) {
  const journal = [];
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  const brut = path.join(dest, "_brut");
  for (const s of sources) {
    const st = fs.statSync(s);
    if (st.isDirectory()) fs.cpSync(s, path.join(brut, path.basename(s)), { recursive: true });
    else if (estArchive(s)) await extraireArchive(s, sources.length > 1 ? path.join(brut, path.basename(s).replace(/\.(zip|rar)$/i, "")) : brut);
    else throw new Error(path.basename(s) + " : choisissez une archive RAR/ZIP ou un dossier.");
  }
  await deplierArchives(brut, 0, journal);
  const eleves = reperesEleves(brut).map((e, i) => ({ id: "e" + String(i + 1).padStart(3, "0"), nom: nomLisible(e.nom), dossier: path.relative(dest, e.dossier), isoles: !!e.isoles }));
  return { eleves, journal };
}

/* Fichiers d'un élève (récursif, chemins relatifs) */
function fichiersEleve(dossier, isoles) {
  const res = [];
  (function parcourir(d, prof) {
    if (prof > 6) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (ignorer(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!isoles) parcourir(p, prof + 1); }
      else res.push(path.relative(dossier, p).split(path.sep).join("/"));
    }
  })(dossier, 0);
  return res.sort();
}
function motifFichier(motif) {
  const m = String(motif || "").trim().toLowerCase();
  if (!m) return null;
  const re = new RegExp("(^|/)" + m.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, ".") + "$", "i");
  return (f) => re.test(f.toLowerCase());
}
function trouver(fichiers, motif, defaut) {
  const t = motifFichier(motif);
  if (t) return fichiers.filter(t);
  return defaut ? fichiers.filter(defaut) : [];
}

/* ================================================================ grille */
function normVerif(v) {
  const s = String(v || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (!s) return "manuel";
  if (/^manu/.test(s)) return "manuel";
  if (/^fich|^exist/.test(s)) return "fichier";
  if (/^cont|^prese/.test(s)) return "contient";
  if (/^abs|^interdit/.test(s)) return "absent";
  if (/^conf|^annexe/.test(s)) return "conforme";
  if (/^page|^scen|^test/.test(s)) return "page";
  if (/^sql|^requ/.test(s)) return "sql";
  return "manuel";
}
function nombre(v) {
  if (v && typeof v === "object" && "result" in v) v = v.result;
  const n = Number(String(v == null ? "" : v).replace(",", ".").replace(/[^\d.\-]/g, ""));
  return isFinite(n) ? n : 0;
}
function texteCellule(v) {
  if (v == null) return "";
  if (typeof v === "object") { if (v.richText) return v.richText.map((x) => x.text).join(""); if ("result" in v) return String(v.result); if (v.text) return String(v.text); }
  return String(v);
}

/* Lit une grille Excel (.xlsx) ou CSV : colonnes Question | Critère | Points | Vérification | Fichier | Paramètre */
async function lireGrille(fichier) {
  let lignes = [];
  if (/\.csv$/i.test(fichier)) {
    const t = fs.readFileSync(fichier, "utf8").replace(/^﻿/, "");
    const sep = (t.split("\n")[0].match(/;/g) || []).length >= (t.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
    lignes = t.split(/\r?\n/).filter((l) => l.trim()).map((l) => {
      const c = []; let cur = "", q = false;
      for (let i = 0; i < l.length; i++) {
        const ch = l[i];
        if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
        else if (ch === '"') q = true; else if (ch === sep) { c.push(cur); cur = ""; } else cur += ch;
      }
      c.push(cur); return c;
    });
  } else {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(fichier);
    // grille officielle STI (format correcteurAuto) : une colonne par critère, barème sur la ligne « Détail »
    for (const w of wb.worksheets) { const o = lireGrilleOfficielle(w); if (o) return o; }
    const ws = wb.worksheets.find((w) => /grille|bar[eè]me/i.test(w.name)) || wb.worksheets[0];
    ws.eachRow({ includeEmpty: false }, (row) => { const v = []; for (let i = 1; i <= 8; i++) v.push(texteCellule(row.getCell(i).value)); lignes.push(v); });
  }
  // ligne d'en-tête : celle qui contient « Points »
  const iEnt = lignes.findIndex((l) => l.some((c) => /^\s*(points?|bar[eè]me|note)\s*$/i.test(c)));
  const ent = (iEnt >= 0 ? lignes[iEnt] : ["Question", "Critère", "Points", "Vérification", "Fichier", "Paramètre"]).map((c) => String(c).toLowerCase());
  const col = (re, def) => { const i = ent.findIndex((c) => re.test(c)); return i >= 0 ? i : def; };
  const cQ = col(/question|exercice|partie/, 0), cC = col(/crit|description|libell|intitul/, 1), cP = col(/^\s*(points?|bar[eè]me|note)/, 2),
    cV = col(/v[ée]rif|type|mode/, -1), cF = col(/fichier/, -1), cPa = col(/param|attendu|motif|requ[eê]te|sc[ée]nario/, -1);
  const criteres = [];
  let qCourante = "";
  lignes.slice(iEnt + 1).forEach((l, k) => {
    const q = String(l[cQ] || "").trim(), c = String(l[cC] || "").trim(), pts = nombre(l[cP]);
    if (q) qCourante = q;
    if (!c && !pts) return;
    if (/^total/i.test(q) || /^total/i.test(c)) return;
    criteres.push({ id: "c" + (k + 1), question: qCourante || "Q" + (criteres.length + 1), critere: c || q, points: pts,
      verif: cV >= 0 ? normVerif(l[cV]) : "manuel", fichier: cF >= 0 ? String(l[cF] || "").trim() : "", param: cPa >= 0 ? String(l[cPa] || "").trim() : "" });
  });
  if (!criteres.length) throw new Error("Aucun critère trouvé : la grille doit contenir au moins les colonnes Question, Critère et Points.");
  return criteres;
}

/* Grille officielle : lignes Partie / Question / sous-question au-dessus de la ligne « Détail » (points),
   colonnes « Total /x » et « Note /20 » à droite. Renvoie null si la feuille n'a pas de ligne « Détail ». */
function lireGrilleOfficielle(ws) {
  let lD = 0, cL = 0;
  ws.eachRow((row, r) => row.eachCell((c, col) => { if (!lD && /^\s*d[ée]tail/i.test(texteCellule(c.value))) { lD = r; cL = col; } }));
  if (!lD) return null;
  const val = (r, col) => { const c = ws.getCell(r, col); return texteCellule(c.isMerged && c.master ? c.master.value : c.value).replace(/\s+/g, " ").trim(); };
  const adr = (r, col) => { const c = ws.getCell(r, col); return c.isMerged && c.master ? c.master.address : c.address; };
  let fin = ws.columnCount;
  for (let r = 1; r <= lD; r++) for (let col = cL + 1; col <= ws.columnCount; col++) if (/^(total|note)\b/i.test(val(r, col)) && col - 1 < fin) fin = col - 1;
  const criteres = [], compte = {};
  for (let col = cL + 1; col <= fin; col++) {
    const pts = nombre(ws.getCell(lD, col).value);
    if (!pts) continue;
    const e = [3, 2, 1].map((k) => (lD - k > 0 ? val(lD - k, col) : ""));
    const a = [3, 2, 1].map((k) => (lD - k > 0 ? adr(lD - k, col) : ""));
    const etape = e[0].replace(/\s*\(.*\)\s*$/, ""), question = e[1], sous = a[2] === a[1] ? "" : e[2].replace(/\s*\(.*\)\s*$/, "");
    const cle = [etape, question, sous].join("|"); compte[cle] = (compte[cle] || 0) + 1;
    const lettreCol = ws.getColumn(col).letter;
    criteres.push({ id: "c" + lettreCol, colonne: lettreCol, etape, q: String(question).replace(/^q(uestion)?\s*/i, ""), sous,
      question: (etape ? etape + " – " : "") + (question ? "Q" + String(question).replace(/^q(uestion)?\s*/i, "") : "") + (sous ? " " + sous : ""),
      critere: "critère " + compte[cle], points: pts, verif: "manuel", fichier: "", param: "" });
  }
  if (!criteres.length) return null;
  criteres.officielle = true;
  return criteres;
}

const ENTETES = ["Question", "Critère", "Points", "Vérification", "Fichier", "Paramètre"];
const AIDE = [
  ["manuel", "Aucune vérification automatique : l'enseignant saisit les points.", "", ""],
  ["fichier", "Le fichier existe dans le travail de l'élève.", "style.css", ""],
  ["contient", "Le code contient chaque motif (séparés par |). Points proportionnels aux motifs trouvés. /regex/ accepté.", "index.html", "<nav | <footer | <figure"],
  ["absent", "Le code ne contient aucun des motifs (éléments interdits). Tous les points ou 0.", "*.js", "charAt | Math.floor | console.log"],
  ["conforme", "Aucun élément hors annexe ni au-dessus du niveau (vérificateur du guide). −0,25 par type d'écart (réglable).", "*.html", ""],
  ["page", "Ouvre la page dans un navigateur caché et joue un scénario (étapes séparées par ;). Points proportionnels aux contrôles réussis.", "index.html",
    "saisir #nom = Ben Salah ; choisir #spec = 1 ; cocher #n3 ; saisir #cap = {#code} ; cliquer input[type=button] ; texte #resultat contient Inscription"],
  ["sql", "Exécute la requête de l'élève (repérée par -- Q3, « 3) » ou retrouvée dans son fichier) sur la base de référence et compare au résultat attendu. Sinon −0,25 par type d'erreur ; commande principale fausse : 0 ; fautes d'orthographe tolérées.", "requetes.sql",
    "SELECT titre FROM Livre, Emprunt WHERE Livre.codeLivre = Emprunt.codeLivre AND numEl = 3"]
];
const ETAPES = [
  ["saisir SEL = valeur", "Écrit la valeur dans un champ (déclenche oninput / onchange)."],
  ["choisir SEL = 2", "Liste déroulante : choisit l'option d'indice 2 (ou le texte indiqué)."],
  ["cocher SEL", "Coche une case ou un bouton radio."],
  ["cliquer SEL", "Clique sur un bouton ou un lien (onclick)."],
  ["attendre 500", "Attend 500 ms (animations, minuteurs)."],
  ["alerte contient texte", "Contrôle : la dernière action a affiché au moins une alerte contenant ce texte."],
  ["aucune alerte", "Contrôle : la dernière action n'a affiché aucune alerte."],
  ["texte SEL contient texte", "Contrôle : le texte (ou la valeur) de l'élément contient ce texte."],
  ["valeur SEL = texte", "Contrôle : le texte (ou la valeur) de l'élément est exactement ce texte."],
  ["existe SEL", "Contrôle : un élément correspond au sélecteur."],
  ["style SEL propriété = valeur", "Contrôle : style calculé (ex. style h1 color = rgb(13, 43, 107))."],
  ["{#code}", "Dans une valeur : remplacé par le texte de l'élément #code au moment de l'étape (code de vérification)."]
];

function stylerEntete(row, fond) {
  row.eachCell((c) => { c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fond || "FF0D2B6B" } }; c.alignment = { vertical: "middle", horizontal: "center", wrapText: true }; });
  row.height = 30;
}
async function modeleGrille(fichier, criteres) {
  const wb = new ExcelJS.Workbook(); wb.creator = "STI Guide";
  const ws = wb.addWorksheet("Grille", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [{ width: 11 }, { width: 46 }, { width: 9 }, { width: 13 }, { width: 16 }, { width: 70 }];
  stylerEntete(ws.addRow(ENTETES));
  const ex = criteres || [
    { question: "Q1", critere: "Page index.html présente", points: 1, verif: "fichier", fichier: "index.html", param: "" },
    { question: "Q1", critere: "Structure : nav, section, footer", points: 2, verif: "contient", fichier: "index.html", param: "<nav | <section | <footer" },
    { question: "Q1", critere: "Aucune balise de mise en forme ni sélecteur hors annexe", points: 2, verif: "conforme", fichier: "*.html", param: "" },
    { question: "Q2", critere: "Fonction verifier() : nom vide refusé", points: 2, verif: "page", fichier: "index.html", param: "saisir #nom = ; cliquer input[type=button] ; alerte contient nom" },
    { question: "Q2", critere: "Inscription valide : message de confirmation", points: 3, verif: "page", fichier: "index.html", param: "saisir #nom = Ben Salah ; cliquer input[type=button] ; aucune alerte ; texte #resultat contient Ben Salah" },
    { question: "Q2", critere: "Pas de charAt ni de Math.floor", points: 1, verif: "absent", fichier: "*.js", param: "charAt | Math.floor" },
    { question: "Q3", critere: "Q3 : titres des livres empruntés par l'élève n° 3", points: 2, verif: "sql", fichier: "*.sql", param: "SELECT titre FROM Livre, Emprunt WHERE Livre.codeLivre = Emprunt.codeLivre AND numEl = 3" },
    { question: "Q4", critere: "Présentation et commentaires", points: 2, verif: "manuel", fichier: "", param: "" }
  ];
  ex.forEach((c) => ws.addRow([c.question, c.critere, c.points, c.verif, c.fichier, c.param]));
  ws.addRow([]);
  const tot = ws.addRow(["TOTAL", "", { formula: "SUM(C2:C" + (ex.length + 1) + ")" }]); tot.font = { bold: true };
  for (let r = 2; r <= ex.length + 1; r++) ws.getCell("D" + r).dataValidation = { type: "list", allowBlank: true, formulae: ['"' + VERIFS.join(",") + '"'] };
  ws.eachRow((row, i) => { if (i > 1) row.alignment = { vertical: "top", wrapText: true }; });
  const a = wb.addWorksheet("Aide");
  a.columns = [{ width: 14 }, { width: 70 }, { width: 16 }, { width: 70 }];
  stylerEntete(a.addRow(["Vérification", "Ce que fait l'application", "Fichier (exemple)", "Paramètre (exemple)"]));
  AIDE.forEach((l) => a.addRow(l));
  a.addRow([]);
  stylerEntete(a.addRow(["Étape (page)", "Rôle", "", ""]), "FF0F7C80");
  ETAPES.forEach((l) => a.addRow(l));
  a.addRow([]);
  a.addRow(["Fichier", "Nom exact (index.html), motif (*.css) ou vide (tous les fichiers de code). La recherche se fait dans tous les sous-dossiers du travail de l'élève."]);
  a.addRow(["SEL", "Sélecteur CSS de l'élément : #id, .classe, input[type=button]…"]);
  a.addRow(["SQL", "Dans son fichier, l'élève fait précéder chaque requête d'un commentaire : -- Q3. Le paramètre peut commencer par « Q3b :: » pour viser une autre étiquette que la colonne Question."]);
  a.eachRow((row, i) => { row.alignment = { vertical: "top", wrapText: true }; });
  await wb.xlsx.writeFile(fichier);
  return fichier;
}

/* ================================================================ vérifications */
let verificateur = null;
function chargerVerificateur(dossierContenu) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of ["data.js", "verificateur.js"]) vm.runInContext(fs.readFileSync(path.join(dossierContenu, "eleves", "assets", f), "utf8"), ctx, { filename: f });
  verificateur = ctx.window.Verificateur;
  return verificateur;
}
function langueDe(f) { const e = (/\.(\w+)$/.exec(f) || [])[1] || ""; return e === "htm" ? "html" : e.toLowerCase(); }

/* motifs séparés par « | » (avec ou sans espaces) ; /expression/ acceptée ; « || » reste un motif littéral */
function decouperMotifs(param) {
  const s = String(param || ""), out = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /[\s|]/.test(s[i]) && !(s[i] === "|" && s[i + 1] === "|")) i++;
    if (i >= s.length) break;
    if (s[i] === "/") {
      // expression régulière : jusqu'au « / » non échappé suivi des options puis d'un séparateur ou de la fin
      let j = i + 1;
      for (; j < s.length; j++) if (s[j] === "/" && s[j - 1] !== "\\" && /^[a-z]*\s*(\||\n|$)/.test(s.slice(j + 1)) && s.slice(j + 1, j + 3) !== "||") break;
      if (j < s.length) { const fl = /^[a-z]*/.exec(s.slice(j + 1))[0]; out.push(s.slice(i, j + 1 + fl.length)); i = j + 1 + fl.length; continue; }
    }
    let j = i;
    while (j < s.length && s[j] !== "\n" && !(s[j] === "|" && s[j + 1] !== "|" && s[j - 1] !== "|")) j++;
    out.push(s.slice(i, j).trim()); i = j;
  }
  return out.filter(Boolean);
}
function motifs(param) {
  return decouperMotifs(param).map((m) => {
    const r = /^\/(.+)\/([a-z]*)$/.exec(m);
    if (r) { try { const re = new RegExp(r[1], r[2].includes("i") ? r[2] : r[2] + "i"); return { m, test: (t) => re.test(t) }; } catch (e) { /* motif littéral */ } }
    const bas = m.toLowerCase();
    return { m, test: (t) => t.toLowerCase().includes(bas) };
  });
}
const arrondi = (x) => Math.round(x * 100) / 100;
/* ressources fournies aux élèves : { dossier, fichiers (chemins relatifs) } */
// fichier rendu identique à une ressource fournie (même nom, même contenu)
function identiqueRessource(ctx, f) {
  const R = ctx.ressources;
  if (!R) return false;
  const nom = f.split("/").pop().toLowerCase();
  const cand = R.fichiers.filter((x) => x.toLowerCase() === f.toLowerCase() || x.split("/").pop().toLowerCase() === nom);
  if (!cand.length) return false;
  let a; try { a = fs.readFileSync(path.join(ctx.base, f)); } catch (e) { return false; }
  const norm = (b) => b.toString("utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n").trim();
  return cand.some((x) => { try { const b = fs.readFileSync(path.join(R.dossier, x)); return a.equals(b) || (/\.(html?|css|js|sql|php|txt)$/i.test(f) && norm(a) === norm(b)); } catch (e) { return false; } });
}
// dossier du projet de l'élève (préfixe de chemin) sur lequel on superpose les ressources
function racineProjet(ctx, p, fournie) {
  if (fournie) {
    // page fournie : le projet est le dossier qui contient le plus de fichiers de code de l'élève
    const dirs = ctx.fichiers.filter((f) => /\.(css|js|html?)$/i.test(f)).map((f) => f.slice(0, f.lastIndexOf("/") + 1));
    dirs.sort((a, b) => a.split("/").length - b.split("/").length);
    return dirs[0] || "";
  }
  const dir = p.slice(0, p.lastIndexOf("/") + 1);
  if (!ctx.ressources) return dir;
  // le préfixe qui aligne le mieux l'arborescence des ressources sur celle de l'élève
  const cands = [""]; dir.split("/").filter(Boolean).reduce((acc, s) => { acc += s + "/"; cands.push(acc); return acc; }, "");
  const set = new Set(ctx.fichiers.map((f) => f.toLowerCase()));
  let meilleur = dir, score = -1;
  for (const c of cands) {
    const s = ctx.ressources.fichiers.filter((x) => set.has((c + x).toLowerCase())).length + (c === dir ? 0.5 : 0);
    if (s > score) { score = s; meilleur = c; }
  }
  return meilleur;
}
// fichier texte d'un élève : UTF-8, sinon ANSI (Windows-1252, Bloc-notes) ou UTF-16 — les accents restent lisibles
function lireTexte(p) {
  const b = fs.readFileSync(p);
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) return b.slice(2).toString("utf16le");
  const t = b.toString("utf8");
  if (!t.includes("\uFFFD")) return t.replace(/^\uFEFF/, "");
  try { return new TextDecoder("windows-1252").decode(b); } catch (e) { return b.toString("latin1"); }
}
function lireTextes(base, l) { return l.map((f) => { try { return { f, t: lireTexte(path.join(base, f)) }; } catch (e) { return { f, t: "" }; } }); }
// type d'un écart à l'annexe (sans numéro de ligne) : « la propriété margin-top… », « la balise <b>… »
function typeEcart(message) { return String(message || "").split(/\.\s/)[0].replace(/\s+/g, " ").trim().toLowerCase(); }

/* ================================================================ SQL : requêtes de l'élève et affectation aux questions */
// étiquette et requête attendue d'un critère : « Q3b :: SELECT … » ou numéro tiré de la colonne Question
function infoSql(c) {
  let param = String(c.param || ""), etiq = "";
  const m = /^\s*(Q?\s*\d+\s*[a-z]?)\s*::\s*/i.exec(param);
  if (m) { etiq = "Q" + m[1].replace(/[^0-9a-z]/gi, "").replace(/^q/i, "").toUpperCase(); param = param.slice(m[0].length); }
  else {
    const txt = String(c.question || ""), q = /(?:Q|question)\s*(\d+)\s*[.\-)]?\s*([a-h])?\s*$/i.exec(txt) || /(\d+)\s*[.\-)]?\s*([a-h])?\s*\)?\s*$/i.exec(txt);
    if (q) etiq = "Q" + q[1] + (q[2] ? q[2].toUpperCase() : "");
  }
  return { etiq, param };
}
const RX_MOT_SQL = "(?:select|insert|update|delete|create|alter|drop)\\b";
// requêtes d'un fichier d'élève ; numérotation tolérée : « -- Q3 », « -- 3) », « 3) SELECT … », « R3 : SELECT … »
function requetesFichier(texte) {
  return STISQL.decouper(texte).map((r) => {
    const num = new RegExp("^\\s*(?:(?:q|r|question|requ[eê]te|req)\\s*[°n.:]*\\s*)?(\\d{1,2})\\s*[.\\-]?\\s*([a-h])?\\s*[).:\\-–/]*\\s*(?=" + RX_MOT_SQL + ")", "i").exec(r.sql);
    if (num && (/^\s*\D/.test(r.sql) || /^\s*\d{1,2}\s*[.\-]?\s*[a-h]?\s*[).:\-–/]/i.test(r.sql))) { r.sql = r.sql.slice(num[0].length); if (!r.etiquette) r.etiquette = "Q" + num[1] + (num[2] || "").toUpperCase(); }
    if (!r.etiquette) { const m = /^\s*(?:n\s*[°o]\s*)?(\d{1,2})\s*[.\-]?\s*([a-h])?\s*(?:[).:\-–]|$)/i.exec(r.commentaire || ""); if (m) r.etiquette = "Q" + m[1] + (m[2] || "").toUpperCase(); }
    return r;
  }).filter((r) => new RegExp("^\\s*\\(?\\s*" + RX_MOT_SQL, "i").test(r.sql) || /^\s*with\b/i.test(r.sql));
}
/* Une requête de l'élève par question SQL de la grille :
   1. requête étiquetée (-- Q3) ; 2. sans étiquette (règle C2) : la requête qui donne le résultat attendu ;
   3. sinon la requête restante la plus proche (même commande). Une requête ne sert qu'à une seule question. */
function affecterSql(ctx) {
  const memo = ctx.memo || (ctx.memo = {});
  if (memo.sql) return memo.sql;
  const R = reglages(ctx), parFichier = {}, aff = (memo.sql = {}), prises = new Set();
  const requetes = (motif) => {
    if (parFichier[motif]) return parFichier[motif];
    const l = trouver(ctx.fichiers, motif, (f) => /\.sql$/i.test(f));
    const lt = l.length ? l : trouver(ctx.fichiers, "", (f) => /\.(sql|txt)$/i.test(f));
    const toutes = []; lireTextes(ctx.base, lt).forEach((x) => requetesFichier(x.t).forEach((r) => toutes.push(r)));
    return (parFichier[motif] = { fichiers: lt, toutes });
  };
  const crit = (ctx.grille && ctx.grille.length ? ctx.grille : []).filter((c) => c.verif === "sql" && infoSql(c).param.trim());
  const infos = crit.map((c) => { const i = infoSql(c), q = requetes(c.fichier || ""); return { c, etiq: i.etiq, q, o: { M: STISQL, SQL: ctx.SQL, refSql: ctx.refSql, attendu: i.param, pts: Number(c.points) || 0, penalite: Number(R.erreurSql) || 0 } }; });
  const sansLettre = (e) => e.replace(/[A-Z]$/, "");
  for (const x of infos) {
    if (!x.q.fichiers.length) { aff[x.c.id] = { vide: "Aucun fichier .sql" }; continue; }
    if (!x.q.toutes.length) { aff[x.c.id] = { vide: "Fichier SQL vide" }; continue; }
    const ref = SQLN.reference(x.o);
    if (!ref.executable && ref.estSelect) { aff[x.c.id] = { manuel: "requête attendue non exécutable sur la base de référence (" + ref.r.erreur + ") — à noter à la main" }; continue; }
    const cible = x.etiq && (x.q.toutes.find((r) => r.etiquette === x.etiq && !prises.has(r)) || x.q.toutes.find((r) => r.etiquette && /\d$/.test(r.etiquette) && r.etiquette === sansLettre(x.etiq) && !prises.has(r)));
    if (cible) { prises.add(cible); aff[x.c.id] = { cible, etiquetee: true, ev: SQLN.evaluer(x.o, cible) }; }
  }
  const reste = infos.filter((x) => !aff[x.c.id]);
  if (!regleActive(ctx, "C2")) { reste.forEach((x) => { aff[x.c.id] = { vide: "Requête « " + x.etiq + " » introuvable (commentaire -- " + x.etiq + " attendu)" }; }); return aff; }
  const libres = (x) => x.q.toutes.filter((r) => !r.etiquette && !prises.has(r));
  // la requête qui donne exactement le résultat attendu
  for (const x of reste) {
    for (const r of libres(x)) { const ev = SQLN.evaluer(x.o, r); if (ev.egal) { prises.add(r); aff[x.c.id] = { cible: r, etiquetee: false, ev }; break; } }
  }
  // sinon la requête libre la plus proche, de même commande (à égalité : la première dans le fichier)
  for (const x of reste.filter((y) => !aff[y.c.id])) {
    let m = null;
    for (const r of libres(x)) { const ev = SQLN.evaluer(x.o, r); if (ev.memeCommande && (!m || ev.erreurs.length < m.ev.erreurs.length)) m = { cible: r, etiquetee: false, ev }; }
    if (m) { prises.add(m.cible); aff[x.c.id] = m; }
    else aff[x.c.id] = { vide: "Requête « " + x.etiq + " » introuvable : question non traitée" };
  }
  return aff;
}

/* contexte : { base (dossier de l'élève), fichiers, niveau, SQL, refSql (base de référence), testerPage, tolerance, reglages, difficulte } */
async function verifier(c, ctx) {
  const pts = Number(c.points) || 0, R = reglages(ctx);
  if (!ctx.grille) { ctx.grille = [c]; ctx.memo = {}; }      // appel isolé (tests) : pas d'affectation d'ensemble
  const res = (obtenu, justif) => ({ points: arrondi(Math.max(0, Math.min(pts, arrondiPas(obtenu, R)))), justif, auto: true });
  const code = (f) => EXT_CODE.test(f);
  switch (c.verif) {
    case "fichier": {
      const tous = trouver(ctx.fichiers, c.fichier), l = tous.filter((f) => !identiqueRessource(ctx, f));
      if (!l.length && tous.length) return res(0, "Fichier fourni rendu sans modification : " + tous.slice(0, 3).join(", "));
      return l.length ? res(pts, "Trouvé : " + l.slice(0, 4).join(", ")) : res(0, "Fichier « " + (c.fichier || "?") + " » absent");
    }
    case "contient": case "absent": {
      const l = trouver(ctx.fichiers, c.fichier, code), mo = motifs(c.param);
      if (!l.length) return res(0, "Aucun fichier « " + (c.fichier || "de code") + " »");
      if (!mo.length) return { points: null, justif: "Paramètre vide dans la grille : à compléter (ou noter à la main)", auto: false };
      // le code commenté n'est pas évalué
      const tout = lireTextes(ctx.base, l).map((x) => sansCommentaires(x.t, x.f)).join("\n");
      const tol = ctx.tolerance || {};
      if (!tol.active) {
        const trouves = mo.filter((m) => m.test(tout)), manquants = mo.filter((m) => !m.test(tout));
        if (c.verif === "contient") return res(pts * trouves.length / mo.length, trouves.length === mo.length ? "Tout est présent" : "Manque : " + manquants.map((m) => m.m).join(", "));
        return trouves.length ? res(0, "Interdit trouvé : " + trouves.map((m) => m.m).join(", ")) : res(pts, "Aucun élément interdit");
      }
      // tolérant : espaces, guillemets et casse ignorés ; nom mal orthographié = crédit avec pénalité
      const r = mo.map((m) => Object.assign({ m: m.m }, TOL.chercherMotif(m.m, tout, c.verif === "contient" && regleActive(ctx, "C1") ? 0.5 : 0)));
      if (c.verif === "contient") {
        const part = pts / r.length, exacts = r.filter((x) => x.score === 1).length, approx = r.filter((x) => x.score > 0 && x.score < 1), manque = r.filter((x) => !x.score).map((x) => x.m);
        const d = approx.length ? deduire(ctx, approx.map((x) => ({ code: "C1", texte: x.detail })), part * approx.length) : { retrait: 0 };
        const o = res(part * (exacts + approx.length) - d.retrait, (manque.length ? "Manque : " + manque.join(", ") : "Tout est présent") + (approx.length ? " — orthographe approchée : " + approx.map((x) => x.detail).join(" ; ") + texteRetrait(d) : ""));
        if (approx.length) o.revoir = true;
        return o;
      }
      const interdits = r.filter((x) => x.score === 1).map((x) => x.m);
      return interdits.length ? res(0, "Interdit trouvé : " + interdits.join(", ")) : res(pts, "Aucun élément interdit");
    }
    case "conforme": {
      if (!ctx.verificateur) return { points: null, justif: "Vérificateur de l'annexe indisponible : à noter à la main", auto: false };
      const l = trouver(ctx.fichiers, c.fichier, (f) => /\.(html?|css|js|php|sql)$/i.test(f)).filter((f) => !identiqueRessource(ctx, f));
      if (!l.length) return res(0, "Aucun fichier à vérifier (fichiers fournis non modifiés exclus)");
      const ecarts = new Map(), toleres = [];
      // un fichier vide (ou presque) n'est pas « conforme » : il n'y a rien à évaluer
      const textes = lireTextes(ctx.base, l).filter((x) => sansCommentaires(x.t, x.f).replace(/<!doctype[^>]*>|<\/?(html|head|body|meta|title)\b[^>]*>|\s+/gi, "").length >= 30);
      if (!textes.length) return res(0, "Fichier(s) vide(s) ou presque : rien à évaluer");
      for (const x of textes) {
        for (const p of ctx.verificateur.analyser(x.t, ctx.niveau, langueDe(x.f)).problemes) {
          if (p.type === "convention") continue;
          // tolérance : une faute de frappe sur une méthode du programme n'est pas un élément hors annexe
          const nom = (/(?:méthode|fonction|propriété)\s+([\w.$]+)/i.exec(p.message) || [])[1];
          if ((regleActive(ctx, "A4") || regleActive(ctx, "A5")) && nom && TOL.estFauteDeFrappe(nom.split(".").pop())) continue;
          // B1 : margin-top, padding-left, border-top… (forme détaillée de margin / padding / border) tolérées
          const det = /propriété\s+((?:margin|padding|border)-(?:top|right|bottom|left)(?:-(?:width|style|color))?)(?![\w-])/i.exec(p.message);
          if (det && regleActive(ctx, "B1")) { toleres.push({ code: "B1", type: "B1|" + det[1].toLowerCase(), cle: "B1|" + det[1].toLowerCase(), texte: det[1].toLowerCase() }); continue; }
          // B2 : sélecteur descendant (div a, #menu li) — les combinateurs > + ~ restent hors annexe
          const comb = /sélecteur combiné « ([^»]+) »/.exec(p.message);
          if (comb && !/[>+~]/.test(comb[1]) && regleActive(ctx, "B2")) { const sel = comb[1].trim().replace(/\s+/g, " "); toleres.push({ code: "B2", type: "B2|" + sel, cle: "B2|" + sel, texte: "« " + sel + " »" }); continue; }
          const t = typeEcart(p.message);
          if (!ecarts.has(t)) ecarts.set(t, { f: x.f, ligne: p.ligne, texte: p.message.split(/\.\s/)[0] });
        }
      }
      // −ecartAnnexe par TYPE d'écart (une balise interdite répétée 10 fois = une seule erreur), au lieu de « moitié ou 0 »
      const liste = Array.from(ecarts.entries()).map(([t, e]) => ({ code: "E", type: "E|" + t, cle: "E|" + t, montant: Number(R.ecartAnnexe) || 0, texte: e.f + " L" + e.ligne + " : " + e.texte }));
      const d = deduire(ctx, toleres.concat(liste), pts);
      const noms = Array.from(new Set(toleres.map((t) => t.texte)));
      const note = (noms.length ? " — toléré : " + noms.join(", ") : "") + texteRetrait(d);
      if (!liste.length) { const o = res(pts - d.retrait, "Conforme à l'annexe (" + ctx.niveau + "ème)" + note); if (d.retrait) o.revoir = true; return o; }
      const o = res(pts - d.retrait, liste.length + " type(s) d'écart : " + liste.slice(0, 3).map((x) => x.texte).join(" ; ") + (liste.length > 3 ? " ; …" : "") + note);
      o.revoir = true;
      return o;
    }
    case "page": {
      const estHtml = (f) => /\.html?$/i.test(f), choisir = (l) => l.find((f) => /(^|\/)index\.html?$/i.test(f)) || l[0];
      let p = choisir(trouver(ctx.fichiers, c.fichier, estHtml)), fournie = false;
      // page HTML fournie (prête à l'emploi) et non rendue par l'élève : prise dans les ressources
      if (!p && ctx.ressources) { p = choisir(trouver(ctx.ressources.fichiers, c.fichier, estHtml)); fournie = !!p; }
      if (!p) return res(0, "Page HTML introuvable");
      if (!ctx.testerPage) return { points: null, justif: "Test de page indisponible : à noter à la main", auto: false };
      if (!String(c.param || "").trim()) return { points: null, justif: "Scénario vide dans la grille : à compléter (ou noter à la main)", auto: false };
      const idsTol = regleActive(ctx, "D3"), reformule = regleActive(ctx, "D4");
      const projet = racineProjet(ctx, p, fournie), rel = fournie ? p : p.slice(projet.length);
      const tester = (dossier) => ctx.testerPage(path.join(dossier, projet, rel), c.param || "", { idsTolerants: idsTol, reformule, racine: path.join(dossier, projet), page: rel });
      const r = await tester(ctx.base);
      if (fournie) r.fournie = p;
      const resultat = (rr, apres) => rr.erreur ? res(0, rr.erreur)
        : !rr.total ? res(rr.chargee ? pts : 0, rr.chargee ? "Page chargée (aucun contrôle dans le scénario)" : "Page non chargée")
        : res(pts * rr.reussis / rr.total, rr.reussis + "/" + rr.total + " contrôle(s) réussi(s)" + (apres || "") + (rr.echecs.length ? " — " + rr.echecs.slice(0, 2).join(" ; ") : "") + (rr.erreursJs.length ? " — erreur JS : " + rr.erreursJs[0] : ""));
      const brut = resultat(r);
      if (fournie) brut.justif += " (page « " + p + " » fournie, non rendue)";
      if (r.complets && r.complets.length) brut.justif += " — fichier(s) fourni(s) utilisé(s) : " + r.complets.slice(0, 4).join(", ");
      // D3 (id approché) et D4 (message reformulé) : pénalités comptées une fois par type
      const formes = (rr) => (rr.substitutions || []).map((x) => ({ code: "D3", cle: "D3|" + [x.de, x.vers].sort().join("|"), texte: p + " : id « " + x.de + " » trouvé sous « " + x.vers + " »" }))
        .concat((rr.reformules || []).map((x) => ({ code: "D4", cle: "D4|" + x, texte: "message reformulé accepté : « " + x + " »" })));
      const finir = (o, rr) => {
        const sc = formes(rr);
        if (sc.length && !rr.erreur && rr.total && o.points > 0) {
          const d = deduire(ctx, sc, o.points);
          o.points = arrondi(Math.max(0, arrondiPas(o.points - d.retrait, R))); o.justif += " — " + sc.map((x) => x.texte).join(" ; ") + texteRetrait(d); o.revoir = true;
        }
        return o;
      };
      const tol = ctx.tolerance || {};
      if (!tol.active || !ctx.reparer || brut.points >= pts) return finir(brut, r);
      // le code ne fonctionne pas : on rejoue le test sur une copie réparée, avec une pénalité par type d'erreur réparée
      const rp = ctx.reparer();
      const corr = TOL.correctionsDePage(rp.rep, rp.dossier, p);
      if (!corr.length) return finir(brut, r);
      if (corr.length > (tol.max || 5)) { brut.justif += " — " + corr.length + " erreurs de forme (au-delà de la tolérance : " + (tol.max || 5) + ") : à revoir"; brut.revoir = true; return finir(brut, r); }
      const r2 = await tester(rp.dossier);
      if (r2.erreur || !r2.total) return finir(brut, r);
      const avant = pts * r2.reussis / r2.total;
      if (avant <= brut.points) return finir(brut, r);
      const toutes = corr.concat(formes(r2));
      const d = deduire(ctx, toutes, avant);
      const o = res(avant - d.retrait, r2.reussis + "/" + r2.total + " contrôle(s) réussi(s) après correction de " + toutes.length + " erreur(s) de forme" + texteRetrait(d) + " : " + toutes.map((x) => x.texte + " [" + x.code + "]").join(" ; "));
      o.revoir = true; o.corrections = corr;
      return o;
    }
    case "sql": {
      const info = infoSql(c);
      if (!info.param.trim()) return { points: null, justif: "Requête attendue à renseigner dans la grille (colonne Paramètre) : à noter à la main en attendant", auto: false };
      if (!ctx.SQL || !ctx.refSql) return { points: null, justif: "Aucune base de référence (.sql) jointe : à noter à la main", auto: false };
      const a = affecterSql(ctx)[c.id] || { vide: "Aucune requête" }, etiq = info.etiq;
      if (a.manuel) return { points: null, justif: etiq + " : " + a.manuel, auto: false };
      if (a.vide) return res(0, a.vide);
      const n = a.ev, penalites = [];
      if (!a.etiquetee) penalites.push({ code: "C2", texte: "requête « " + etiq + " » non étiquetée", dit: "étiquette -- " + etiq + " absente : requête retrouvée dans le fichier" });
      // C3 : seules les colonnes sont dans un autre ordre (même résultat) → règle de tolérance C3
      if (!n.egal && n.erreurs.length === 1 && n.erreurs[0] === "ordre des colonnes" && regleActive(ctx, "C3")) {
        n.egal = true; n.raison = "Résultat identique, colonnes dans un autre ordre";
        penalites.push({ code: "C3", texte: "colonnes " + etiq, dit: "colonnes dans un autre ordre" });
      }
      const ou = !a.etiquetee ? " [requête l." + a.cible.ligne + "]" : "";
      if (!n.egal) { const o = res(n.points, etiq + ou + " : " + n.raison + (penalites.length ? " — " + penalites[0].dit : "")); o.revoir = n.points > 0; return o; }
      const d = penalites.length ? deduire(ctx, penalites, pts) : { retrait: 0 };
      const o = res(pts - d.retrait, etiq + ou + " : " + n.raison + (penalites.length ? " — " + penalites.map((x) => x.dit).join(" ; ") + texteRetrait(d) : ""));
      if (d.retrait || n.suspect || (n.orthographe && n.orthographe.length)) o.revoir = true;
      return o;
    }
    default:
      return { points: null, justif: "À noter par l'enseignant", auto: false };
  }
}

/* ================================================================ export Excel */
function couleurNote(n) { return n >= 14 ? "FFE7F5EC" : n >= 10 ? "FFFFF6D6" : "FFFDECEC"; }
function lettre(i) { let s = ""; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }

async function exporterExcel(fichier, devoir, criteres, eleves, resultats) {
  const RG = Object.assign({}, REGLAGES, devoir.reglages || {}), pasNote = Number(RG.noteFinale) || 0;
  const formuleNote = (cellule, max) => pasNote ? "ROUND(" + cellule + "*20/" + (max || 1) + "/" + pasNote + ",0)*" + pasNote : "ROUND(" + cellule + "*20/" + (max || 1) + ",2)";
  const wb = new ExcelJS.Workbook(); wb.creator = "STI Guide — " + (devoir.auteur || "Correcteur de devoirs"); wb.created = new Date();
  wb.calcProperties.fullCalcOnLoad = true;   // Excel recalcule les totaux à l'ouverture
  const questions = [];
  criteres.forEach((c) => { let q = questions.find((x) => x.nom === c.question); if (!q) questions.push(q = { nom: c.question, criteres: [], max: 0 }); q.criteres.push(c); q.max += Number(c.points) || 0; });
  const maxTotal = arrondi(questions.reduce((a, q) => a + q.max, 0));
  const pt = (e, c) => { const r = (resultats[e.id] || {})[c.id]; return r && r.points !== null && r.points !== undefined ? Number(r.points) : null; };
  const titre = (devoir.titre || "Devoir") + (devoir.classe ? " — " + devoir.classe : "");
  const bordure = { top: { style: "thin", color: { argb: "FFDBE3EE" } }, bottom: { style: "thin", color: { argb: "FFDBE3EE" } }, left: { style: "thin", color: { argb: "FFDBE3EE" } }, right: { style: "thin", color: { argb: "FFDBE3EE" } } };

  /* --- Notes : une ligne par élève, une colonne par question */
  const ws = wb.addWorksheet("Notes", { views: [{ state: "frozen", xSplit: 2, ySplit: 4 }], pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 } });
  const nbCol = 2 + questions.length + 3;
  ws.mergeCells(1, 1, 1, nbCol); ws.getCell(1, 1).value = titre;
  ws.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FF0D2B6B" } };
  ws.mergeCells(2, 1, 2, nbCol);
  ws.getCell(2, 1).value = "Niveau : " + (devoir.niveau || "") + "ème · Barème sur " + maxTotal + " · Corrigé le " + new Date().toLocaleDateString("fr-FR") + (devoir.auteur ? " · " + devoir.auteur : "");
  ws.getCell(2, 1).font = { italic: true, color: { argb: "FF4A5568" } };
  const avecRef = eleves.some((e) => { const v = (resultats[e.id] || {})._reference; return v !== undefined && v !== null && v !== ""; });
  const q0 = (e) => criteres.filter((c) => pt(e, c) === null).length;
  const ent = ["N°", "Élève"].concat(questions.map((q) => q.nom + "\n(/" + arrondi(q.max) + ")"), ["Total\n(/" + maxTotal + ")", "Note\n/20", "Observation"], avecRef ? ["Note de\nréférence", "Écart"] : []);
  ws.getRow(4).values = ent; stylerEntete(ws.getRow(4)); ws.getRow(4).height = 36;
  ws.columns = [{ width: 5 }, { width: 30 }].concat(questions.map(() => ({ width: 10 })), [{ width: 10 }, { width: 9 }, { width: 40 }], avecRef ? [{ width: 11 }, { width: 9 }] : []);
  const colTot = 3 + questions.length, colNote = colTot + 1;
  eleves.forEach((e, i) => {
    const r = 5 + i, row = ws.getRow(r);
    row.getCell(1).value = i + 1; row.getCell(2).value = e.nom;
    let total = 0;
    questions.forEach((q, j) => {
      const v = arrondi(q.criteres.reduce((a, c) => a + (pt(e, c) || 0), 0)); total += v;
      row.getCell(3 + j).value = v;
    });
    total = arrondi(total);
    const note = noteSur20(total, maxTotal, RG);
    row.getCell(colTot).value = { formula: "SUM(" + lettre(2) + r + ":" + lettre(1 + questions.length) + r + ")", result: total };
    row.getCell(colNote).value = { formula: formuleNote(lettre(colTot - 1) + r, maxTotal), result: note };
    row.getCell(colNote).font = { bold: true };
    row.getCell(colNote).fill = { type: "pattern", pattern: "solid", fgColor: { argb: couleurNote(note) } };
    const manquants = q0(e);
    row.getCell(colNote + 1).value = [((resultats[e.id] || {})._observation) || "", manquants ? "Note provisoire : " + manquants + " critère(s) à noter à la main" : "", e.difficulte ? "Correction adaptée (élève en difficulté)" : ""].filter(Boolean).join(" — ");
    if (avecRef) {
      const ref = (resultats[e.id] || {})._reference;
      if (ref !== undefined && ref !== null && ref !== "") { row.getCell(colNote + 2).value = Number(ref); row.getCell(colNote + 3).value = { formula: lettre(colNote - 1) + r + "-" + lettre(colNote + 1) + r, result: arrondi(note - Number(ref)) }; }
    }
    row.eachCell({ includeEmpty: true }, (c, k) => { c.border = bordure; if (k > 2 && k <= colNote) { c.alignment = { horizontal: "center" }; c.numFmt = "0.##"; } });
  });
  const rMoy = 5 + eleves.length;
  if (eleves.length) {
    const row = ws.getRow(rMoy); row.getCell(2).value = "Moyenne de la classe";
    for (let k = 3; k <= colNote; k++) row.getCell(k).value = { formula: "ROUND(AVERAGE(" + lettre(k - 1) + "5:" + lettre(k - 1) + (rMoy - 1) + "),2)" };
    row.font = { bold: true }; row.eachCell((c, k) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9EEF8" } }; if (k > 2) { c.alignment = { horizontal: "center" }; c.numFmt = "0.00"; } });
  }

  /* --- Grille détaillée : une colonne par critère, groupées par question */
  const wd = wb.addWorksheet("Grille détaillée", { views: [{ state: "frozen", xSplit: 2, ySplit: 3 }], pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 } });
  wd.getCell(1, 1).value = titre + " — points obtenus par critère"; wd.getCell(1, 1).font = { bold: true, size: 14, color: { argb: "FF0D2B6B" } };
  let col = 3;
  const couleurs = ["FF1E7B3C", "FF1D4ED8", "FFD35400", "FF5B2C9F", "FF0F7C80", "FFC62828"];
  wd.getCell(3, 1).value = "N°"; wd.getCell(3, 2).value = "Élève";
  questions.forEach((q, j) => {
    const debut = col;
    q.criteres.forEach((c) => { wd.getCell(3, col).value = c.critere + " (/" + c.points + ")"; col++; });
    wd.getCell(3, col).value = "Total " + q.nom + " (/" + arrondi(q.max) + ")"; col++;
    if (col - 1 > debut) wd.mergeCells(2, debut, 2, col - 1);
    wd.getCell(2, debut).value = q.nom;
    for (let k = debut; k < col; k++) { [2, 3].forEach((r) => { const cell = wd.getCell(r, k); cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: couleurs[j % couleurs.length] } }; cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; }); }
  });
  wd.getCell(3, col).value = "Total (/" + maxTotal + ")"; wd.getCell(3, col + 1).value = "Note /20";
  [1, 2, col, col + 1].forEach((k) => { const cell = wd.getCell(3, k); cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2B6B" } }; cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; });
  wd.getRow(3).height = 60;
  wd.getColumn(1).width = 5; wd.getColumn(2).width = 28;
  for (let k = 3; k <= col + 1; k++) wd.getColumn(k).width = 13;
  eleves.forEach((e, i) => {
    const r = 4 + i; let k = 3, total = 0;
    wd.getCell(r, 1).value = i + 1; wd.getCell(r, 2).value = e.nom;
    questions.forEach((q) => {
      const debut = k;
      q.criteres.forEach((c) => {
        const cell = wd.getCell(r, k), v = pt(e, c), res = (resultats[e.id] || {})[c.id] || {};
        cell.value = v === null ? null : v;
        if (res.justif) cell.note = (res.auto && !res.modifie ? "[auto] " : "[enseignant] ") + res.justif;
        if (v === null) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDF0E6" } };
        else if (res.revoir && !res.modifie) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEDFF" } };
        else if (v >= c.points) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7F5EC" } };
        else if (v === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDECEC" } };
        total += v || 0; k++;
      });
      const qt = wd.getCell(r, k);
      qt.value = { formula: "SUM(" + lettre(debut - 1) + r + ":" + lettre(k - 2) + r + ")", result: arrondi(q.criteres.reduce((a, c) => a + (pt(e, c) || 0), 0)) };
      qt.font = { bold: true }; k++;
    });
    total = arrondi(total);
    const sommes = [];
    let kk = 3; questions.forEach((q) => { kk += q.criteres.length; sommes.push(lettre(kk - 1) + r); kk++; });
    wd.getCell(r, k).value = { formula: sommes.join("+"), result: total }; wd.getCell(r, k).font = { bold: true };
    const note = noteSur20(total, maxTotal, RG);
    wd.getCell(r, k + 1).value = { formula: formuleNote(lettre(k - 1) + r, maxTotal), result: note };
    wd.getCell(r, k + 1).font = { bold: true }; wd.getCell(r, k + 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: couleurNote(note) } };
    wd.getRow(r).eachCell({ includeEmpty: true }, (c, j) => { c.border = bordure; if (j > 2) { c.alignment = { horizontal: "center" }; c.numFmt = "0.##"; } });
  });

  /* --- Justifications : une ligne par élève et par critère */
  const wj = wb.addWorksheet("Justifications", { views: [{ state: "frozen", ySplit: 1 }] });
  wj.columns = [{ header: "Élève", width: 26 }, { header: "Question", width: 10 }, { header: "Critère", width: 42 }, { header: "Obtenu", width: 9 }, { header: "Max", width: 7 }, { header: "Mode", width: 12 }, { header: "Justification", width: 80 }];
  stylerEntete(wj.getRow(1));
  eleves.forEach((e) => criteres.forEach((c) => {
    const r = (resultats[e.id] || {})[c.id] || {};
    const row = wj.addRow([e.nom, c.question, c.critere, r.points === null || r.points === undefined ? null : r.points, c.points, r.modifie ? "enseignant" : r.auto ? (r.revoir ? "automatique (tolérance)" : "automatique") : "enseignant", r.justif || ""]);
    row.alignment = { vertical: "top", wrapText: true };
  }));
  wj.autoFilter = { from: "A1", to: "G1" };

  /* --- Statistiques par critère */
  const wsx = wb.addWorksheet("Statistiques");
  wsx.columns = [{ header: "Question", width: 10 }, { header: "Critère", width: 46 }, { header: "Max", width: 7 }, { header: "Moyenne", width: 10 }, { header: "Réussite totale", width: 15 }, { header: "Échec (0)", width: 10 }, { header: "Non noté", width: 10 }];
  stylerEntete(wsx.getRow(1));
  criteres.forEach((c) => {
    const v = eleves.map((e) => pt(e, c)), n = v.filter((x) => x !== null);
    wsx.addRow([c.question, c.critere, c.points, n.length ? arrondi(n.reduce((a, b) => a + b, 0) / n.length) : null,
      n.length ? Math.round(100 * n.filter((x) => x >= c.points).length / n.length) + " %" : "", n.filter((x) => x === 0).length, v.length - n.length]).alignment = { vertical: "top", wrapText: true };
  });

  /* --- Grille officielle (format correcteurAuto) : une colonne par critère, ligne « Détail » = barème */
  const wo = wb.addWorksheet("Grille officielle", { views: [{ state: "frozen", xSplit: 2, ySplit: 5 }], pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 } });
  wo.getCell(1, 1).value = titre; wo.getCell(1, 1).font = { bold: true, size: 14, color: { argb: "FF0D2B6B" } };
  wo.getCell(5, 1).value = "N° candidat"; wo.getCell(5, 2).value = "Détail";
  wo.getCell(2, 2).value = "Partie"; wo.getCell(3, 2).value = "Question"; wo.getCell(4, 2).value = "Critère";
  const decoupe = (c) => {
    const m = /^(.*?)\s*[–-]\s*Q\s*(\d+)\s*([a-h])?\s*$/i.exec(c.question || "") || /^()Q?\s*(\d+)\s*([a-h])?$/i.exec(c.question || "");
    if (m) return [m[1], "Q" + m[2], m[3] || c.sous || ""];
    if (c.etape !== undefined || c.q !== undefined) return [c.etape || "", c.q ? "Q" + String(c.q).replace(/^q/i, "") : "", c.sous || ""];
    return ["", c.question || "", ""];
  };
  criteres.forEach((c, j) => {
    const col = 3 + j, d = decoupe(c);
    wo.getCell(2, col).value = d[0]; wo.getCell(3, col).value = d[1]; wo.getCell(4, col).value = d[2]; wo.getCell(5, col).value = Number(c.points) || 0;
  });
  const cT = 3 + criteres.length;
  wo.getCell(4, cT).value = "Total /" + maxTotal; wo.getCell(4, cT + 1).value = "Note /20";
  // fusion des parties et questions identiques et voisines
  [2, 3].forEach((r) => { let deb = 3; for (let col = 4; col <= cT; col++) { const prec = String(wo.getCell(r, col - 1).value || ""), cur = col < cT ? String(wo.getCell(r, col).value || "") : "\u0000"; if (cur !== prec || (r === 3 && String(wo.getCell(2, col).value || "") !== String(wo.getCell(2, col - 1).value || ""))) { if (col - 1 > deb && prec) wo.mergeCells(r, deb, r, col - 1); deb = col; } } });
  for (let r = 2; r <= 5; r++) for (let col = 1; col <= cT + 1; col++) { const cell = wo.getCell(r, col); cell.font = { bold: true, color: { argb: r === 5 ? "FF0D2B6B" : "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: r === 5 ? "FFE9EEF8" : "FF0D2B6B" } }; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; cell.border = bordure; }
  wo.getColumn(1).width = 12; wo.getColumn(2).width = 28; for (let col = 3; col <= cT + 1; col++) wo.getColumn(col).width = 11;
  eleves.forEach((e, i) => {
    const r = 6 + i;
    wo.getCell(r, 1).value = i + 1; wo.getCell(r, 2).value = e.nom;
    criteres.forEach((c, j) => { const v = pt(e, c); wo.getCell(r, 3 + j).value = v === null ? null : v; });
    const tot = arrondi(criteres.reduce((a, c) => a + (pt(e, c) || 0), 0));
    wo.getCell(r, cT).value = { formula: "SUM(C" + r + ":" + lettre(cT - 2) + r + ")", result: tot };
    wo.getCell(r, cT + 1).value = { formula: formuleNote(lettre(cT - 1) + r, maxTotal), result: noteSur20(tot, maxTotal, RG) };
    wo.getRow(r).eachCell({ includeEmpty: true }, (cell, k) => { cell.border = bordure; if (k > 2) { cell.alignment = { horizontal: "center" }; cell.numFmt = "0.##"; } });
  });

  /* --- Barème */
  const wg = wb.addWorksheet("Barème");
  wg.columns = [{ header: "Question", width: 10 }, { header: "Critère", width: 46 }, { header: "Points", width: 8 }, { header: "Vérification", width: 13 }, { header: "Fichier", width: 16 }, { header: "Paramètre", width: 70 }];
  stylerEntete(wg.getRow(1));
  criteres.forEach((c) => wg.addRow([c.question, c.critere, c.points, c.verif, c.fichier, c.param]).alignment = { vertical: "top", wrapText: true });
  wg.addRow(["TOTAL", "", maxTotal]).font = { bold: true };

  await wb.xlsx.writeFile(fichier);
  return fichier;
}

module.exports = { TOLERANCE, REGLAGES, VERIFS, lireTexte, infoSql, requetesFichier, noteSur20, importerTravaux, fichiersEleve, lireGrille, modeleGrille, chargerVerificateur, verifier, exporterExcel, extraireArchive };
