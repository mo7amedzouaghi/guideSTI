/* STI Guide — application bureau hors ligne (Espace Élève + Espace Prof, sans inscription).
   M. Zouaghi Mohamed — Lycée Oued Ellil */
"use strict";
const { app, BrowserWindow, protocol, net, ipcMain, dialog, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const http = require("http");
const dgram = require("dgram");
const crypto = require("crypto");
const { pathToFileURL } = require("url");
const { unzipSync } = require("fflate");
const { adapterDossier, verifierDossier } = require("./lib/contenu");

const APP_DIR = path.join(__dirname, "app");
// essais (application non empaquetée) : variante et dossier de données remplaçables
const ESSAI = !app.isPackaged;
if (ESSAI && process.env.STI_DONNEES) app.setPath("userData", process.env.STI_DONNEES);
const VARIANTE = ESSAI && process.env.STI_VARIANTE ? process.env.STI_VARIANTE : (() => { try { return JSON.parse(fs.readFileSync(path.join(APP_DIR, "variante.json"), "utf8")).variante; } catch (e) { return "complet"; } })();
const COMPLET = VARIANTE !== "eleve";
const PORT = 47470, PORT_BALISE = 47471;
// Module E : dépôt GitHub du guide (adresses remplaçables pour les essais)
const DEPOT = "mo7amedzouaghi/guideSTI";
const URL_API = process.env.STI_MAJ_API || "https://api.github.com/repos/" + DEPOT + "/commits/main";
const URL_ZIP = process.env.STI_MAJ_ZIP || "https://codeload.github.com/" + DEPOT + "/zip/";

protocol.registerSchemesAsPrivileged([{ scheme: "sti", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

let fenetre = null;
let profOuvert = false;

/* ---------------------------------------------------------------- chemins */
const docs = () => path.join(app.getPath("documents"), "STI");
const dossierRamassage = () => path.join(docs(), "Ramassage");
const dossierProgression = () => path.join(dossierRamassage(), "progression");
const dossierTravaux = () => path.join(docs(), "TP");
const bibliUtilisateur = () => path.join(app.getPath("userData"), "bibliotheque");
const corrigesUtilisateur = () => path.join(app.getPath("userData"), "corriges");
const dossierMaj = () => path.join(app.getPath("userData"), "contenu");
const zipMaj = () => path.join(app.getPath("userData"), "maj", "guideSTI.zip");
const fichierConfig = () => path.join(app.getPath("userData"), "config.json");
function lireConfig() { try { return JSON.parse(fs.readFileSync(fichierConfig(), "utf8")); } catch (e) { return {}; } }
function ecrireConfig(c) { fs.mkdirSync(path.dirname(fichierConfig()), { recursive: true }); fs.writeFileSync(fichierConfig(), JSON.stringify(c, null, 2)); }
function propre(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "x"; }
function nomEleve(id) { return propre(id.nom) + "_" + propre(id.prenom) + "_P" + propre(id.poste); }

/* ------------------------------------------------- protocole sti://app/... */
function estProtege(rel) { return rel.startsWith("contenu/prof/") || rel.startsWith("prof-modules/"); }
function pageHtml(corps, statut) {
  return new Response("<!DOCTYPE html><meta charset=utf-8><body style=\"font-family:Segoe UI,sans-serif;padding:40px;color:#0D2B6B\">" + corps + "</body>",
    { status: statut || 200, headers: { "content-type": "text/html; charset=utf-8" } });
}
function servir(req) {
  const u = new URL(req.url);
  let rel = decodeURIComponent(u.pathname).replace(/^\/+/, "");
  if (!rel) rel = "accueil/index.html";
  let abs = path.normalize(path.join(APP_DIR, rel));
  if (!abs.startsWith(APP_DIR)) return new Response("Interdit", { status: 403 });
  try { if (fs.statSync(abs).isDirectory()) { abs = path.join(abs, "index.html"); rel = path.relative(APP_DIR, abs).split(path.sep).join("/"); } } catch (e) { /* absent */ }
  if (estProtege(rel)) {
    if (!COMPLET) return pageHtml("<h2>Espace Prof absent de cette installation</h2><p><a href=\"sti://app/accueil/index.html\">Retour à l'accueil</a></p>");
    if (!profOuvert) return pageHtml("<script>location.replace('sti://app/accueil/index.html#prof')</script>");
  }
  // module E : le contenu mis à jour (Données de l'application) remplace le contenu intégré
  if (rel.startsWith("contenu/") && majActive()) {
    const m = path.normalize(path.join(dossierMaj(), rel.slice("contenu/".length)));
    if (m.startsWith(dossierMaj()) && fs.existsSync(m) && fs.statSync(m).isFile()) abs = m;
  }
  if (!fs.existsSync(abs)) return pageHtml("<h2>Page introuvable</h2><p>" + rel.replace(/</g, "&lt;") + "</p><p><a href=\"javascript:history.back()\">Retour</a></p>", 404);
  return net.fetch(pathToFileURL(abs).toString());
}

let majCache = null;
function majActive() {
  if (majCache === null) majCache = fs.existsSync(path.join(dossierMaj(), "version.json")) && fs.existsSync(path.join(dossierMaj(), "eleves", "index.html"));
  return majCache;
}

/* ---------------------------------------------------------------- fenêtre */
function creerFenetre() {
  fenetre = new BrowserWindow({
    width: 1360, height: 860, minWidth: 900, minHeight: 600, show: false,
    title: COMPLET ? "STI Guide" : "STI Élève", backgroundColor: "#F3F6FA",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false, devTools: COMPLET || !app.isPackaged }
  });
  fenetre.once("ready-to-show", () => { fenetre.maximize(); fenetre.show(); });
  const ext = (url) => /^(https?|mailto):/i.test(url);
  fenetre.webContents.setWindowOpenHandler(({ url }) => { if (ext(url)) shell.openExternal(url); return { action: "deny" }; });
  fenetre.webContents.on("will-navigate", (e, url) => { if (ext(url)) { e.preventDefault(); shell.openExternal(url); } });
  fenetre.loadURL("sti://app/accueil/index.html");
}

function menu() {
  const aller = (url) => () => fenetre && fenetre.loadURL(url);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "STI", submenu: [
      { label: "Accueil", accelerator: "CmdOrCtrl+H", click: aller("sti://app/accueil/index.html") },
      { type: "separator" },
      { label: "Mettre à jour le guide…", click: aller("sti://app/modules/mise-a-jour.html") },
      { label: "Ouvrir le dossier STI (Documents)", click: () => { fs.mkdirSync(docs(), { recursive: true }); shell.openPath(docs()); } },
      { type: "separator" },
      { role: "quit", label: "Quitter" }
    ] },
    { label: "Navigation", submenu: [
      { label: "Page précédente", accelerator: "Alt+Left", click: () => fenetre && fenetre.webContents.navigationHistory.goBack() },
      { label: "Page suivante", accelerator: "Alt+Right", click: () => fenetre && fenetre.webContents.navigationHistory.goForward() },
      { role: "reload", label: "Actualiser" }
    ] },
    { label: "Affichage", submenu: [
      { role: "zoomIn", label: "Agrandir" }, { role: "zoomOut", label: "Réduire" }, { role: "resetZoom", label: "Taille normale" },
      { type: "separator" }, { role: "togglefullscreen", label: "Plein écran" }
    ] },
    { label: "Édition", submenu: [
      { role: "undo", label: "Annuler" }, { role: "redo", label: "Rétablir" }, { type: "separator" },
      { role: "cut", label: "Couper" }, { role: "copy", label: "Copier" }, { role: "paste", label: "Coller" }, { role: "selectAll", label: "Tout sélectionner" }
    ] }
  ]));
}

/* ---------------------------------------------------------------- PIN prof */
function hacher(pin, sel) { return crypto.createHash("sha256").update(sel + ":" + pin).digest("hex"); }
function exigerProf() { if (!COMPLET || !profOuvert) throw new Error("Espace Prof verrouillé."); }

ipcMain.handle("info", () => ({ variante: VARIANTE, version: app.getVersion(), profOuvert, pinDefini: !!lireConfig().pin, documents: docs() }));
ipcMain.handle("pin:definir", (e, pin) => {
  if (!COMPLET) return false;
  const c = lireConfig();
  if (c.pin) return false;
  if (!/^\d{4,8}$/.test(String(pin))) throw new Error("Le code doit contenir 4 à 8 chiffres.");
  const sel = crypto.randomBytes(8).toString("hex");
  c.pin = { sel, h: hacher(String(pin), sel) };
  ecrireConfig(c);
  profOuvert = true;
  return true;
});
ipcMain.handle("pin:verifier", (e, pin) => {
  const c = lireConfig();
  profOuvert = !!(COMPLET && c.pin && hacher(String(pin), c.pin.sel) === c.pin.h);
  return profOuvert;
});
ipcMain.handle("pin:changer", (e, ancien, nouveau) => {
  const c = lireConfig();
  if (!c.pin || hacher(String(ancien), c.pin.sel) !== c.pin.h) throw new Error("Code actuel incorrect.");
  if (!/^\d{4,8}$/.test(String(nouveau))) throw new Error("Le nouveau code doit contenir 4 à 8 chiffres.");
  c.pin = { sel: c.pin.sel, h: hacher(String(nouveau), c.pin.sel) };
  ecrireConfig(c);
  return true;
});
ipcMain.handle("pin:verrouiller", () => { profOuvert = false; arreterRamassage(); return true; });

/* ---------------------------------------------------------------- fichiers */
const EXT_CODE = { ".html": "html", ".htm": "html", ".css": "css", ".js": "js", ".php": "php", ".sql": "sql" };
function lireCodeDossier(racine) {
  const res = [];
  (function parcourir(d, prof) {
    if (prof > 6 || res.length >= 300) return;
    let entrees = [];
    try { entrees = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const en of entrees) {
      if (en.name.startsWith(".") || en.name === "node_modules") continue;
      const p = path.join(d, en.name);
      if (en.isDirectory()) parcourir(p, prof + 1);
      else if (EXT_CODE[path.extname(en.name).toLowerCase()]) {
        try { if (fs.statSync(p).size <= 1024 * 1024) res.push({ rel: path.relative(racine, p).split(path.sep).join("/"), langue: EXT_CODE[path.extname(en.name).toLowerCase()], contenu: fs.readFileSync(p, "utf8") }); } catch (e) { /* ignoré */ }
      }
    }
  })(racine, 0);
  return res.sort((a, b) => a.rel.localeCompare(b.rel));
}
ipcMain.handle("dossier:choisir", async (e, titre) => {
  const r = await dialog.showOpenDialog(fenetre, { title: titre || "Choisir un dossier", properties: ["openDirectory", "createDirectory"] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle("dossier:lireCode", (e, d) => {
  if (!d || !fs.existsSync(d)) throw new Error("Dossier introuvable.");
  if (fs.statSync(d).isFile()) { const ext = EXT_CODE[path.extname(d).toLowerCase()]; return ext ? [{ rel: path.basename(d), langue: ext, contenu: fs.readFileSync(d, "utf8") }] : []; }
  return lireCodeDossier(d);
});
ipcMain.handle("dossier:ouvrir", (e, d) => { if (d && fs.existsSync(d)) shell.openPath(d); });

// Bac à sable : projet = dossier contenant index.html, style.css, script.js
ipcMain.handle("projet:enregistrer", async (e, p) => {
  const r = await dialog.showOpenDialog(fenetre, { title: "Enregistrer le projet dans le dossier…", buttonLabel: "Enregistrer ici", properties: ["openDirectory", "createDirectory"] });
  if (r.canceled) return null;
  const d = r.filePaths[0];
  let html = String(p.html || "");
  if (p.css && p.css.trim() && !/href=["']style\.css["']/i.test(html)) html = html.replace(/<\/head>/i, '  <link rel="stylesheet" href="style.css">\n</head>');
  if (p.js && p.js.trim() && !/src=["']script\.js["']/i.test(html)) html = html.replace(/<\/head>/i, '  <script src="script.js"></script>\n</head>');
  fs.writeFileSync(path.join(d, "index.html"), html);
  if (p.css && p.css.trim()) fs.writeFileSync(path.join(d, "style.css"), p.css);
  if (p.js && p.js.trim()) fs.writeFileSync(path.join(d, "script.js"), p.js);
  return d;
});
ipcMain.handle("projet:ouvrir", async () => {
  const r = await dialog.showOpenDialog(fenetre, { title: "Ouvrir un projet (dossier)", properties: ["openDirectory"] });
  if (r.canceled) return null;
  const d = r.filePaths[0], noms = fs.readdirSync(d);
  const prendre = (prefere, ext) => { const f = noms.includes(prefere) ? prefere : noms.find((n) => n.toLowerCase().endsWith(ext)); return f ? fs.readFileSync(path.join(d, f), "utf8") : ""; };
  let html = prendre("index.html", ".html");
  // les liens vers style.css / script.js sont inutiles dans l'aperçu (CSS et JS sont injectés)
  html = html.replace(/\s*<link rel="stylesheet" href="style\.css">/i, "").replace(/\s*<script src="script\.js"><\/script>/i, "");
  return { dossier: d, html, css: prendre("style.css", ".css"), js: prendre("script.js", ".js") };
});
ipcMain.handle("fichier:enregistrerTexte", async (e, o) => {
  const r = await dialog.showSaveDialog(fenetre, { defaultPath: path.join(docs(), o.nom || "fichier.txt"), filters: o.filtres });
  if (r.canceled) return null;
  fs.mkdirSync(path.dirname(r.filePath), { recursive: true });
  fs.writeFileSync(r.filePath, o.bom ? "﻿" + o.contenu : o.contenu);
  return r.filePath;
});
ipcMain.handle("fichier:ouvrirTexte", async (e, o) => {
  const r = await dialog.showOpenDialog(fenetre, { title: o && o.titre, filters: o && o.filtres, properties: ["openFile"].concat(o && o.multi ? ["multiSelections"] : []) });
  if (r.canceled) return [];
  return r.filePaths.map((f) => ({ nom: path.basename(f), chemin: f, contenu: fs.readFileSync(f, "utf8") }));
});
ipcMain.handle("pdf:imprimer", async (e, nom) => {
  const r = await dialog.showSaveDialog(fenetre, { defaultPath: path.join(docs(), nom || "document.pdf"), filters: [{ name: "PDF", extensions: ["pdf"] }] });
  if (r.canceled) return null;
  const pdf = await e.sender.printToPDF({ pageSize: "A4", printBackground: true, margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 } });
  fs.mkdirSync(path.dirname(r.filePath), { recursive: true });
  fs.writeFileSync(r.filePath, pdf);
  return r.filePath;
});
ipcMain.handle("pleinEcran", (e, oui) => { if (fenetre) fenetre.setFullScreen(!!oui); return true; });

/* ---------------------------------------------------------------- bibliothèque de TP */
function dossiersTP() {
  const l = [];
  const ajouter = (base, source) => { try { for (const id of fs.readdirSync(base)) { const f = path.join(base, id, "tp.json"); if (fs.existsSync(f)) l.push({ id, dir: path.join(base, id), source }); } } catch (e) { /* absent */ } };
  ajouter(path.join(APP_DIR, "modules", "tp", "bibliotheque"), "integre");
  ajouter(bibliUtilisateur(), "importe");
  const vus = {};
  return l.filter((x) => (vus[x.id] ? false : (vus[x.id] = true)));
}
// chemin relatif sûr à l'intérieur d'un dossier (img/photo.svg accepté, ../ refusé)
function cheminSur(base, rel) {
  const p = path.normalize(path.join(base, String(rel || "").replace(/\\/g, "/")));
  if (!p.startsWith(path.normalize(base) + path.sep)) throw new Error("Chemin refusé : " + rel);
  return p;
}
function chargerTP(id) {
  const t = dossiersTP().find((x) => x.id === id);
  if (!t) throw new Error("TP introuvable : " + id);
  const tp = JSON.parse(fs.readFileSync(path.join(t.dir, "tp.json"), "utf8"));
  tp.id = id; tp.source = t.source; tp.fichiers = {};
  for (const f of tp.depart || []) { try { tp.fichiers[f] = fs.readFileSync(cheminSur(path.join(t.dir, "depart"), f), "utf8"); } catch (e) { tp.fichiers[f] = ""; } }
  if (tp.base) { try { tp.baseSql = fs.readFileSync(cheminSur(t.dir, tp.base), "utf8"); } catch (e) { tp.baseSql = ""; } }
  return tp;
}
function listeTP() {
  return dossiersTP().map((t) => { try { const x = chargerTP(t.id); return { id: x.id, titre: x.titre, niveau: x.niveau, duree: x.duree, resume: x.resume, source: x.source }; } catch (e) { return null; } }).filter(Boolean);
}
function corrigeTP(id) {
  for (const f of [path.join(APP_DIR, "prof-modules", "tp", id, "corrige.json"), path.join(corrigesUtilisateur(), id + ".json")]) {
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  }
  return null;
}
function installerTP(tp) {
  const id = propre(tp.id);
  const d = path.join(bibliUtilisateur(), id);
  fs.rmSync(d, { recursive: true, force: true });
  fs.mkdirSync(path.join(d, "depart"), { recursive: true });
  const meta = Object.assign({}, tp); delete meta.fichiers; delete meta.source; delete meta.id; delete meta.baseSql;
  meta.depart = Object.keys(tp.fichiers || {});
  for (const f of meta.depart) { const c = cheminSur(path.join(d, "depart"), f); fs.mkdirSync(path.dirname(c), { recursive: true }); fs.writeFileSync(c, tp.fichiers[f]); }
  if (tp.base && tp.baseSql) fs.writeFileSync(cheminSur(d, tp.base), tp.baseSql);
  fs.writeFileSync(path.join(d, "tp.json"), JSON.stringify(meta, null, 2));
  return id;
}
ipcMain.handle("tp:liste", () => listeTP());
ipcMain.handle("tp:charger", (e, id) => chargerTP(id));
ipcMain.handle("tp:corrige", (e, id) => { exigerProf(); return corrigeTP(id); });
ipcMain.handle("tp:codeDeblocage", (e, id) => { exigerProf(); return codeDeblocage(id); });
ipcMain.handle("tp:importer", async () => {
  exigerProf();
  const r = await dialog.showOpenDialog(fenetre, { title: "Dossier du TP (contenant tp.json et depart/)", properties: ["openDirectory"] });
  if (r.canceled) return null;
  const d = r.filePaths[0];
  if (!fs.existsSync(path.join(d, "tp.json"))) throw new Error("Ce dossier ne contient pas de fichier tp.json.");
  const id = propre(path.basename(d));
  const cible = path.join(bibliUtilisateur(), id);
  fs.rmSync(cible, { recursive: true, force: true });
  fs.mkdirSync(cible, { recursive: true });
  // tout le dossier (tp.json, depart/, base .sql…) sauf le corrigé, rangé à part
  fs.cpSync(d, cible, { recursive: true, filter: (src) => path.basename(src) !== "corrige.json" });
  if (fs.existsSync(path.join(d, "corrige.json"))) { fs.mkdirSync(corrigesUtilisateur(), { recursive: true }); fs.copyFileSync(path.join(d, "corrige.json"), path.join(corrigesUtilisateur(), id + ".json")); }
  return id;
});
// Code de déblocage de la fiche surprise : change chaque jour, identique sur le poste prof et les postes élèves
function codeDeblocage(id) {
  const j = new Date(); const jour = j.getFullYear() + "-" + (j.getMonth() + 1) + "-" + j.getDate();
  const h = crypto.createHash("sha256").update("sti-fiche|" + id + "|" + jour).digest();
  return String(h.readUInt32BE(0) % 10000).padStart(4, "0");
}
ipcMain.handle("tp:verifierDeblocage", (e, id, code) => String(code).trim() === codeDeblocage(id));

// Travail de l'élève : sauvegarde automatique dans Documents/STI/TP
function ecrireTravail(base, t) {
  const d = path.join(base, propre(t.tpId), nomEleve(t.identite));
  fs.mkdirSync(d, { recursive: true });
  for (const [f, c] of Object.entries(t.fichiers || {})) { const p = cheminSur(d, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); }
  fs.writeFileSync(path.join(d, "reponses.json"), JSON.stringify({ identite: t.identite, tpId: t.tpId, reponses: t.reponses, debut: t.debut, remis: t.remis || null, enregistre: new Date().toISOString() }, null, 2));
  return d;
}
ipcMain.handle("travail:sauver", (e, t) => ecrireTravail(dossierTravaux(), t));
ipcMain.handle("travail:copierVers", async (e, t) => {
  const r = await dialog.showOpenDialog(fenetre, { title: "Copier mon travail vers… (clé USB, dossier partagé)", properties: ["openDirectory", "createDirectory"] });
  if (r.canceled) return null;
  return ecrireTravail(r.filePaths[0], t);
});

/* ---------------------------------------------------------------- module E : mise à jour du guide */
function lireJson(f) { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } }
function versionIntegree() { return lireJson(path.join(APP_DIR, "contenu", "version.json")) || { sha: "", date: "", message: "", source: "integre" }; }
function versionActive() { return (majActive() && lireJson(path.join(dossierMaj(), "version.json"))) || versionIntegree(); }
function signalerMaj(etape, x) { if (fenetre && !fenetre.isDestroyed()) fenetre.webContents.send("maj:progression", Object.assign({ etape }, x || {})); }

// le commentaire d'une archive GitHub (git archive) contient l'identifiant du commit
function commentaireZip(buf) {
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { const n = buf.readUInt16LE(i + 20); return buf.slice(i + 22, i + 22 + n).toString("utf8").trim(); }
  }
  return "";
}

async function telecharger(url, entetes) {
  const r = await net.fetch(url, { headers: Object.assign({ "User-Agent": "STI-Guide-Desktop" }, entetes || {}), cache: "no-store" });
  if (!r.ok) throw new Error(r.status === 403 ? "GitHub refuse temporairement la demande (limite atteinte) : réessayez dans une heure." : "Téléchargement impossible (HTTP " + r.status + ").");
  const total = Number(r.headers.get("content-length")) || 0, morceaux = [];
  let recu = 0;
  const lecteur = r.body.getReader();
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    morceaux.push(Buffer.from(value)); recu += value.length;
    signalerMaj("telechargement", { recu, total });
  }
  return Buffer.concat(morceaux);
}

// dernier commit qui modifie le contenu du guide (prof/ ou eleves/) : les commits de l'application (desktop/) sont ignorés
async function derniereVersionGithub() {
  const urls = process.env.STI_MAJ_API ? [URL_API] : ["prof", "eleves"].map((d) => "https://api.github.com/repos/" + DEPOT + "/commits?sha=main&per_page=1&path=" + d);
  let meilleur = null;
  for (const url of urls) {
    let r;
    try { r = await net.fetch(url, { headers: { "User-Agent": "STI-Guide-Desktop", "Accept": "application/vnd.github+json" }, cache: "no-store" }); }
    catch (e) { throw new Error("Pas de connexion à Internet (ou GitHub inaccessible depuis ce réseau)."); }
    if (!r.ok) throw new Error(r.status === 403 ? "GitHub limite le nombre de vérifications : réessayez dans une heure." : "GitHub ne répond pas correctement (HTTP " + r.status + ").");
    let j = await r.json();
    if (Array.isArray(j)) j = j[0];
    if (!j) continue;
    const v = { sha: j.sha, date: (j.commit && j.commit.committer && j.commit.committer.date) || "", message: ((j.commit && j.commit.message) || "").split("\n")[0] };
    if (!meilleur || v.date > meilleur.date) meilleur = v;
  }
  if (!meilleur) throw new Error("GitHub ne répond pas correctement.");
  return meilleur;
}

// installe une archive du dépôt guideSTI (zip GitHub, fichier ou poste prof)
function installerArchive(buf, version) {
  signalerMaj("installation");
  let fichiers;
  try { fichiers = unzipSync(new Uint8Array(buf), { filter: (f) => /(^|\/)(prof|eleves)\//.test(f.name) && !f.name.endsWith("/") }); }
  catch (e) { throw new Error("Archive illisible : ce n'est pas un fichier .zip du guide."); }
  const repere = Object.keys(fichiers).find((n) => /(^|\/)eleves\/index\.html$/.test(n));
  if (!repere) throw new Error("Cette archive ne contient pas le Guide STI (dossier eleves/ introuvable).");
  const prefixe = repere.slice(0, repere.length - "eleves/index.html".length);
  const tmp = dossierMaj() + ".tmp";
  fs.rmSync(tmp, { recursive: true, force: true });
  let n = 0;
  for (const [nom, contenu] of Object.entries(fichiers)) {
    if (!nom.startsWith(prefixe)) continue;
    const rel = nom.slice(prefixe.length);
    if (!/^(prof|eleves)\//.test(rel) || (!COMPLET && rel.startsWith("prof/"))) continue;
    const dest = path.normalize(path.join(tmp, rel));
    if (!dest.startsWith(tmp + path.sep)) continue;   // protection contre les chemins « ../ »
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, contenu);
    n++;
  }
  adapterDossier(tmp);
  verifierDossier(tmp, COMPLET);
  version = Object.assign({ sha: commentaireZip(buf), date: "", message: "" }, version || {});
  version.installe = new Date().toISOString();
  fs.writeFileSync(path.join(tmp, "version.json"), JSON.stringify(version, null, 2));
  fs.rmSync(dossierMaj(), { recursive: true, force: true });
  fs.renameSync(tmp, dossierMaj());
  majCache = null;
  // l'archive est gardée pour la partager avec les postes élèves (réseau du labo)
  fs.mkdirSync(path.dirname(zipMaj()), { recursive: true });
  fs.writeFileSync(zipMaj(), buf);
  signalerMaj("termine", { fichiers: n });
  return versionActive();
}

ipcMain.handle("maj:etat", () => {
  const c = lireConfig();
  return { active: versionActive(), integree: versionIntegree(), misAJour: majActive(), derniereVerif: c.majVerif || null, disponible: c.majDispo || null, depot: DEPOT, partageable: fs.existsSync(zipMaj()) };
});
ipcMain.handle("maj:verifier", async () => {
  const d = await derniereVersionGithub(), a = versionActive();
  const c = lireConfig();
  c.majVerif = new Date().toISOString();
  c.majDispo = d.sha && d.sha !== a.sha ? d : null;
  ecrireConfig(c);
  return { derniere: d, active: a, nouvelle: !!c.majDispo };
});
ipcMain.handle("maj:installerGithub", async () => {
  const d = await derniereVersionGithub();
  signalerMaj("telechargement", { recu: 0, total: 0 });
  const buf = await telecharger(URL_ZIP + d.sha);
  const v = installerArchive(buf, Object.assign({ source: "github" }, d));
  const c = lireConfig(); c.majDispo = null; c.majVerif = new Date().toISOString(); ecrireConfig(c);
  return v;
});
ipcMain.handle("maj:installerFichier", async () => {
  const r = await dialog.showOpenDialog(fenetre, { title: "Archive du guide (guideSTI-main.zip téléchargé depuis GitHub)", filters: [{ name: "Archive zip", extensions: ["zip"] }], properties: ["openFile"] });
  if (r.canceled) return null;
  return installerArchive(fs.readFileSync(r.filePaths[0]), { source: "fichier", fichier: path.basename(r.filePaths[0]) });
});
ipcMain.handle("maj:revenir", () => {
  fs.rmSync(dossierMaj(), { recursive: true, force: true });
  fs.rmSync(zipMaj(), { force: true });
  majCache = null;
  const c = lireConfig(); c.majDispo = null; ecrireConfig(c);
  return versionActive();
});
ipcMain.handle("maj:depuisProf", async (e, ip) => {
  const v = await requete(ip, "GET", "/guide/version");
  if (!v.partage) throw new Error("Le poste prof n'a pas de mise à jour du guide à partager.");
  if (v.version.sha && v.version.sha === versionActive().sha) return { dejaAJour: true, version: versionActive() };
  signalerMaj("telechargement", { recu: 0, total: 0 });
  const buf = await new Promise((ok, ko) => {
    const req = http.get({ host: ip, port: PORT, path: "/guide.zip", timeout: 60000 }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return ko(new Error("Le poste prof refuse l'envoi (HTTP " + res.statusCode + ").")); }
      const total = Number(res.headers["content-length"]) || 0, m = []; let recu = 0;
      res.on("data", (c) => { m.push(c); recu += c.length; signalerMaj("telechargement", { recu, total }); });
      res.on("end", () => ok(Buffer.concat(m)));
      res.on("error", ko);
    });
    req.on("timeout", () => req.destroy(new Error("Le poste prof ne répond plus.")));
    req.on("error", ko);
  });
  return { version: installerArchive(buf, Object.assign({}, v.version, { source: "reseau", depuis: ip })) };
});

/* ---------------------------------------------------------------- mise à jour de l'application elle-même */
// Publiée par GitHub Actions (dépôt guideSTI, dossier desktop/) dans la release « bureau-derniere » :
// latest.yml (STI Guide) et eleve.yml (STI Élève), installateurs et .blockmap (téléchargement différentiel).
const URL_MAJ_APP = process.env.STI_MAJ_APP || "https://github.com/" + DEPOT + "/releases/download/bureau-derniere";
const CANAL = COMPLET ? "latest" : "eleve";
const PORTABLE = !!process.env.PORTABLE_EXECUTABLE_DIR;
const dossierMajApp = () => path.join(app.getPath("userData"), "maj-app");
let updater = null, majAppEtat = { etape: "repos" };
function majApp(etape, x) { majAppEtat = Object.assign({ etape }, x || {}); if (fenetre && !fenetre.isDestroyed()) fenetre.webContents.send("app:maj", majAppEtat); }
function chargerUpdater() {
  if (updater) return updater;
  updater = require("electron-updater").autoUpdater;
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = true;
  updater.allowDowngrade = false;
  updater.logger = null;
  updater.on("download-progress", (p) => majApp("telechargement", { pourcent: Math.round(p.percent || 0), recu: p.transferred, total: p.total }));
  updater.on("update-downloaded", (i) => majApp("pret", { version: i.version }));
  updater.on("error", (e) => majApp("erreur", { message: String(e && e.message || e).split("\n")[0] }));
  return updater;
}
function sourceMaj(ip) {
  const u = chargerUpdater();
  u.setFeedURL({ provider: "generic", url: ip ? "http://" + ip + ":" + PORT + "/maj-app" : URL_MAJ_APP, channel: CANAL });
  u.channel = CANAL;
  if (!app.isPackaged) u.forceDevUpdateConfig = true;
}
function plusRecente(a, b) {
  const x = String(a).split(/[.-]/).map(Number), y = String(b).split(/[.-]/).map(Number);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) > (y[i] || 0)) return true; if ((x[i] || 0) < (y[i] || 0)) return false; }
  return false;
}
ipcMain.handle("app:etat", () => {
  const c = lireConfig();
  return { version: app.getVersion(), portable: PORTABLE, installee: app.isPackaged && !PORTABLE, etat: majAppEtat, derniereVerif: c.majAppVerif || null, disponible: c.majAppDispo || null,
    partage: COMPLET ? fs.existsSync(path.join(dossierMajApp(), "eleve.yml")) : false, page: "https://github.com/" + DEPOT + "/releases/tag/bureau-derniere" };
});
ipcMain.handle("app:verifier", async (e, ip) => {
  sourceMaj(ip);
  majApp("verification");
  let r;
  try { r = await chargerUpdater().checkForUpdates(); }
  catch (err) { majApp("repos"); throw new Error(ip ? "Le poste prof n'a pas de mise à jour à partager (préparez-la dans sa page Mise à jour)." : "Pas de connexion à Internet, ou aucune version publiée pour l'instant."); }
  const info = r && r.updateInfo, nouvelle = !!info && plusRecente(info.version, app.getVersion());
  const c = lireConfig(); c.majAppVerif = new Date().toISOString(); c.majAppDispo = nouvelle ? { version: info.version, date: info.releaseDate || "" } : null; ecrireConfig(c);
  majApp(nouvelle ? "disponible" : "a-jour", { version: info ? info.version : app.getVersion() });
  return { nouvelle, version: info ? info.version : null, actuelle: app.getVersion(), notes: info && typeof info.releaseNotes === "string" ? info.releaseNotes : "" };
});
ipcMain.handle("app:telecharger", async () => {
  if (PORTABLE || !app.isPackaged) throw new Error("La version portable ne se met pas à jour seule : téléchargez la nouvelle version portable.");
  majApp("telechargement", { pourcent: 0 });
  await chargerUpdater().downloadUpdate();
  return true;
});
ipcMain.handle("app:installer", () => { setImmediate(() => chargerUpdater().quitAndInstall(false, true)); return true; });
ipcMain.handle("app:installerFichier", async () => {
  const r = await dialog.showOpenDialog(fenetre, { title: "Installateur de la nouvelle version (STI-Guide-Installation-x.y.z.exe)", filters: [{ name: "Installateur", extensions: ["exe"] }], properties: ["openFile"] });
  if (r.canceled) return null;
  await shell.openPath(r.filePaths[0]);
  setTimeout(() => app.quit(), 1500);
  return true;
});
// poste prof : télécharge la mise à jour des postes élèves pour la partager sur le réseau du labo
ipcMain.handle("app:preparerLabo", async () => {
  exigerProf();
  const yaml = require("js-yaml");
  fs.mkdirSync(dossierMajApp(), { recursive: true });
  const prendre = async (nom) => {
    const r = await net.fetch(URL_MAJ_APP + "/" + encodeURIComponent(nom), { cache: "no-store" });
    if (!r.ok) throw new Error("Téléchargement impossible : " + nom + " (HTTP " + r.status + ")");
    const total = Number(r.headers.get("content-length")) || 0, m = []; let recu = 0;
    const lecteur = r.body.getReader();
    for (;;) { const { done, value } = await lecteur.read(); if (done) break; m.push(Buffer.from(value)); recu += value.length; majApp("labo", { fichier: nom, pourcent: total ? Math.round(100 * recu / total) : 0 }); }
    const b = Buffer.concat(m); fs.writeFileSync(path.join(dossierMajApp(), nom), b); return b;
  };
  let yml;
  try { yml = (await prendre("eleve.yml")).toString("utf8"); } catch (e) { throw new Error("Aucune mise à jour publiée pour STI Élève, ou pas d'Internet."); }
  const info = yaml.load(yml), fichier = info.path || (info.files && info.files[0] && info.files[0].url);
  for (const f of fs.readdirSync(dossierMajApp())) if (f !== "eleve.yml" && f !== fichier && f !== fichier + ".blockmap") fs.rmSync(path.join(dossierMajApp(), f), { force: true });
  if (!fs.existsSync(path.join(dossierMajApp(), fichier))) await prendre(fichier);
  try { await prendre(fichier + ".blockmap"); } catch (e) { /* facultatif */ }
  majApp("repos");
  return { version: info.version };
});

/* ---------------------------------------------------------------- ramassage réseau (poste prof) */
let serveur = null, balise = null, minuterieBalise = null, etatRamassage = null;
const debloques = {};

function adressesIPv4() {
  const l = [];
  for (const [nom, liste] of Object.entries(os.networkInterfaces())) {
    for (const a of liste || []) {
      if (a.family === "IPv4" && !a.internal) {
        const ip = a.address.split(".").map(Number), m = a.netmask.split(".").map(Number);
        l.push({ interface: nom, ip: a.address, diffusion: ip.map((o, i) => (o & m[i]) | (~m[i] & 255)).join(".") });
      }
    }
  }
  return l;
}
function json(res, code, obj) { res.writeHead(code, { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" }); res.end(JSON.stringify(obj)); }
function lireCorps(req, max) {
  return new Promise((ok, ko) => {
    let n = 0; const morceaux = [];
    req.on("data", (c) => { n += c.length; if (n > max) { ko(new Error("Envoi trop volumineux")); req.destroy(); } else morceaux.push(c); });
    req.on("end", () => { try { ok(JSON.parse(Buffer.concat(morceaux).toString("utf8"))); } catch (e) { ko(e); } });
    req.on("error", ko);
  });
}
function signaler(type, donnees) { if (fenetre && !fenetre.isDestroyed()) fenetre.webContents.send("ramassage:evenement", { type, donnees }); }

function demarrerRamassage(o) {
  if (serveur) return etatRamassage;
  etatRamassage = { port: PORT, adresses: adressesIPv4(), nom: (o && o.nom) || "Poste prof", classe: (o && o.classe) || "", recus: 0, depuis: new Date().toISOString() };
  serveur = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, "http://x");
      const ip = (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
      if (req.method === "GET" && u.pathname === "/ping") return json(res, 200, { sti: "prof", nom: etatRamassage.nom, classe: etatRamassage.classe });
      if (req.method === "GET" && u.pathname === "/tp") return json(res, 200, listeTP());
      const mm = /^\/maj-app\/([\w.\-]+)$/.exec(u.pathname);
      if (req.method === "GET" && mm) {
        const f = path.join(dossierMajApp(), mm[1]);
        if (!fs.existsSync(f)) return json(res, 404, { ok: false });
        res.writeHead(200, { "content-type": /\.yml$/.test(f) ? "text/yaml" : "application/octet-stream", "content-length": fs.statSync(f).size });
        fs.createReadStream(f).pipe(res);
        if (/\.exe$/.test(f)) signaler("app", { ip });
        return;
      }
      if (req.method === "GET" && u.pathname === "/guide/version") return json(res, 200, { version: versionActive(), partage: fs.existsSync(zipMaj()) });
      if (req.method === "GET" && u.pathname === "/guide.zip") {
        if (!fs.existsSync(zipMaj())) return json(res, 404, { ok: false });
        res.writeHead(200, { "content-type": "application/zip", "content-length": fs.statSync(zipMaj()).size });
        fs.createReadStream(zipMaj()).pipe(res);
        signaler("guide", { ip });
        return;
      }
      if (req.method === "GET" && u.pathname.startsWith("/tp/")) return json(res, 200, chargerTP(decodeURIComponent(u.pathname.slice(4))));
      if (req.method === "GET" && u.pathname === "/etat") return json(res, 200, { debloque: !!debloques[u.searchParams.get("tp")] });
      if (req.method === "POST" && u.pathname === "/remise") {
        const t = await lireCorps(req, 5 * 1024 * 1024);
        if (!t.identite || !t.identite.nom || !t.tpId) return json(res, 400, { ok: false, erreur: "Identité ou TP manquant" });
        t.remis = new Date().toISOString();
        const jour = new Date().toISOString().slice(0, 10);
        const d = ecrireTravail(path.join(dossierRamassage(), jour), t);
        fs.writeFileSync(path.join(d, "source.txt"), "Reçu de " + ip + " le " + new Date().toLocaleString("fr-FR"));
        etatRamassage.recus++;
        signaler("remise", { identite: t.identite, tpId: t.tpId, dossier: d, ip });
        return json(res, 200, { ok: true });
      }
      if (req.method === "POST" && u.pathname === "/progression") {
        const p = await lireCorps(req, 512 * 1024);
        if (!p.identite || !p.identite.nom) return json(res, 400, { ok: false });
        fs.mkdirSync(dossierProgression(), { recursive: true });
        fs.writeFileSync(path.join(dossierProgression(), propre(p.identite.nom) + "_" + propre(p.identite.prenom) + "_" + propre(p.identite.classe) + ".sti"), JSON.stringify(p, null, 2));
        signaler("progression", { identite: p.identite, ip });
        return json(res, 200, { ok: true });
      }
      json(res, 404, { ok: false });
    } catch (e) { json(res, 500, { ok: false, erreur: String(e.message || e) }); }
  });
  serveur.on("error", (e) => { signaler("erreur", { message: e.code === "EADDRINUSE" ? "Le port " + PORT + " est déjà utilisé sur ce poste." : String(e.message) }); arreterRamassage(); });
  serveur.listen(PORT, "0.0.0.0");
  // balise UDP : les postes élèves trouvent le poste prof sans saisir d'adresse
  balise = dgram.createSocket({ type: "udp4", reuseAddr: true });
  balise.on("error", () => { /* la recherche automatique reste facultative */ });
  balise.bind(() => {
    try { balise.setBroadcast(true); } catch (e) { /* ignoré */ }
    const emettre = () => {
      for (const a of adressesIPv4()) {
        const msg = Buffer.from(JSON.stringify({ sti: "prof", nom: etatRamassage.nom, classe: etatRamassage.classe, ip: a.ip, port: PORT }));
        for (const dest of [a.diffusion, "255.255.255.255"]) balise.send(msg, PORT_BALISE, dest, () => {});
      }
    };
    emettre();
    minuterieBalise = setInterval(emettre, 2000);
  });
  return etatRamassage;
}
function arreterRamassage() {
  if (minuterieBalise) clearInterval(minuterieBalise);
  minuterieBalise = null;
  if (balise) { try { balise.close(); } catch (e) { /* ignoré */ } balise = null; }
  if (serveur) { try { serveur.close(); } catch (e) { /* ignoré */ } serveur = null; }
  etatRamassage = null;
  return true;
}
ipcMain.handle("ramassage:demarrer", (e, o) => { exigerProf(); return demarrerRamassage(o); });
ipcMain.handle("ramassage:arreter", () => arreterRamassage());
ipcMain.handle("ramassage:etat", () => etatRamassage);
ipcMain.handle("ramassage:debloquer", (e, id, oui) => { exigerProf(); debloques[id] = !!oui; return debloques[id]; });
ipcMain.handle("ramassage:liste", () => {
  exigerProf();
  const l = [];
  try {
    for (const jour of fs.readdirSync(dossierRamassage())) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) continue;
      for (const tp of fs.readdirSync(path.join(dossierRamassage(), jour))) {
        for (const el of fs.readdirSync(path.join(dossierRamassage(), jour, tp))) {
          const d = path.join(dossierRamassage(), jour, tp, el), f = path.join(d, "reponses.json");
          if (!fs.existsSync(f)) continue;
          try {
            const r = JSON.parse(fs.readFileSync(f, "utf8"));
            let note = null; try { note = JSON.parse(fs.readFileSync(path.join(d, "note.json"), "utf8")); } catch (e) { /* pas encore noté */ }
            l.push({ jour, tpId: r.tpId, identite: r.identite, remis: r.remis, dossier: d, note });
          } catch (e) { /* ignoré */ }
        }
      }
    }
  } catch (e) { /* aucun ramassage */ }
  return l.sort((a, b) => String(b.remis).localeCompare(String(a.remis)));
});
ipcMain.handle("remise:lire", (e, d) => {
  exigerProf();
  const r = JSON.parse(fs.readFileSync(path.join(d, "reponses.json"), "utf8"));
  r.fichiers = {};
  for (const f of fs.readdirSync(d)) if (EXT_CODE[path.extname(f).toLowerCase()]) r.fichiers[f] = fs.readFileSync(path.join(d, f), "utf8");
  r.dossier = d;
  try { r.note = JSON.parse(fs.readFileSync(path.join(d, "note.json"), "utf8")); } catch (e) { r.note = null; }
  return r;
});
ipcMain.handle("remise:noter", (e, d, note) => {
  exigerProf();
  if (!fs.existsSync(path.join(d, "reponses.json"))) throw new Error("Dossier élève introuvable.");
  note.date = new Date().toISOString();
  fs.writeFileSync(path.join(d, "note.json"), JSON.stringify(note, null, 2));
  return true;
});
ipcMain.handle("remise:importerDossier", async () => {
  exigerProf();
  const r = await dialog.showOpenDialog(fenetre, { title: "Dossier d'un travail élève (contenant reponses.json)", properties: ["openDirectory"] });
  if (r.canceled) return null;
  if (!fs.existsSync(path.join(r.filePaths[0], "reponses.json"))) throw new Error("Ce dossier ne contient pas reponses.json.");
  return r.filePaths[0];
});
ipcMain.handle("ramassage:dossier", () => { fs.mkdirSync(dossierRamassage(), { recursive: true }); shell.openPath(dossierRamassage()); });

/* ---------------------------------------------------------------- suivi local */
function lireProgressions() {
  const l = [];
  try { for (const f of fs.readdirSync(dossierProgression())) if (f.endsWith(".sti")) { try { l.push(JSON.parse(fs.readFileSync(path.join(dossierProgression(), f), "utf8"))); } catch (e) { /* ignoré */ } } } catch (e) { /* aucun */ }
  return l;
}
ipcMain.handle("suivi:local", () => {
  exigerProf();
  const eleves = [], scores = [];
  for (const p of lireProgressions()) {
    const i = p.identite || {};
    const id = (propre(i.nom) + "." + propre(i.prenom) + "." + propre(i.classe)).toLowerCase();
    eleves.push({ identifiant: id, nom: i.nom || "", prenom: i.prenom || "", classe: String(i.classe || "").toUpperCase(), niveau: Number(i.niveau) || 3, role: "eleve", actif: true });
    for (const s of p.scores || []) scores.push({ identifiant: id, n: Number(s.n), c: Number(s.c), meilleur: Number(s.meilleur), essais: Number(s.essais) || 0 });
  }
  return { eleves, scores };
});
ipcMain.handle("suivi:importer", async () => {
  exigerProf();
  const r = await dialog.showOpenDialog(fenetre, { title: "Importer des progressions élèves", filters: [{ name: "Progression STI", extensions: ["sti"] }], properties: ["openFile", "multiSelections"] });
  if (r.canceled) return 0;
  fs.mkdirSync(dossierProgression(), { recursive: true });
  let n = 0;
  for (const f of r.filePaths) {
    try { const p = JSON.parse(fs.readFileSync(f, "utf8")); if (p.type === "sti-progression" && p.identite) { fs.copyFileSync(f, path.join(dossierProgression(), path.basename(f))); n++; } } catch (e) { /* fichier ignoré */ }
  }
  return n;
});

/* ---------------------------------------------------------------- côté élève : joindre le poste prof */
function requete(ip, methode, chemin, corps, delai) {
  return new Promise((ok, ko) => {
    const donnees = corps ? Buffer.from(JSON.stringify(corps)) : null;
    const req = http.request({ host: ip, port: PORT, path: chemin, method: methode, timeout: delai || 4000,
      headers: donnees ? { "content-type": "application/json", "content-length": donnees.length } : {} }, (res) => {
      const m = []; res.on("data", (c) => m.push(c));
      res.on("end", () => { try { const r = JSON.parse(Buffer.concat(m).toString("utf8")); res.statusCode < 400 ? ok(r) : ko(new Error(r.erreur || "Refusé par le poste prof")); } catch (e) { ko(e); } });
    });
    req.on("timeout", () => req.destroy(new Error("Le poste prof ne répond pas.")));
    req.on("error", (e) => ko(new Error(e.code === "ECONNREFUSED" ? "Le ramassage n'est pas démarré sur le poste prof." : e.message)));
    if (donnees) req.write(donnees);
    req.end();
  });
}
ipcMain.handle("reseau:chercher", () => new Promise((ok) => {
  const trouves = {};
  const s = dgram.createSocket({ type: "udp4", reuseAddr: true });
  s.on("message", (m, rinfo) => { try { const x = JSON.parse(m.toString()); if (x.sti === "prof") trouves[rinfo.address] = { ip: rinfo.address, nom: x.nom, classe: x.classe }; } catch (e) { /* ignoré */ } });
  s.on("error", () => { try { s.close(); } catch (e) { /* ignoré */ } ok([]); });
  s.bind(PORT_BALISE, () => setTimeout(() => { try { s.close(); } catch (e) { /* ignoré */ } ok(Object.values(trouves)); }, 3500));
}));
ipcMain.handle("reseau:tester", (e, ip) => requete(ip, "GET", "/ping"));
ipcMain.handle("reseau:remettre", (e, ip, t) => requete(ip, "POST", "/remise", t, 15000));
ipcMain.handle("reseau:progression", (e, ip, p) => requete(ip, "POST", "/progression", p, 8000));
ipcMain.handle("reseau:etat", (e, ip, id) => requete(ip, "GET", "/etat?tp=" + encodeURIComponent(id), null, 3000));
ipcMain.handle("reseau:tpListe", (e, ip) => requete(ip, "GET", "/tp"));
ipcMain.handle("reseau:tpRecuperer", async (e, ip, id) => installerTP(await requete(ip, "GET", "/tp/" + encodeURIComponent(id), null, 10000)));

/* ---------------------------------------------------------------- correcteur de devoirs (prof) */
const COR = require("./lib/correcteur");
const dossierDevoirs = () => path.join(docs(), "Devoirs");
const dossierDevoir = (id) => cheminSur(dossierDevoirs(), propre(id));
function lireDevoir(id) {
  const d = dossierDevoir(id);
  const devoir = lireJson(path.join(d, "devoir.json"));
  if (!devoir) throw new Error("Devoir introuvable.");
  devoir.id = id;
  devoir.resultats = lireJson(path.join(d, "resultats.json")) || {};
  return devoir;
}
function ecrireDevoir(id, devoir) {
  const d = dossierDevoir(id);
  fs.mkdirSync(d, { recursive: true });
  const copie = Object.assign({}, devoir); const res = copie.resultats; delete copie.resultats; delete copie.id;
  copie.modifie = new Date().toISOString();
  fs.writeFileSync(path.join(d, "devoir.json"), JSON.stringify(copie, null, 2));
  if (res) fs.writeFileSync(path.join(d, "resultats.json"), JSON.stringify(res, null, 2));
}
function dossierContenuActif() { return majActive() ? dossierMaj() : path.join(APP_DIR, "contenu"); }

// test d'une page d'élève dans une fenêtre cachée, isolée et sans réseau
let sessionCorrecteur = null;
function etapesScenario(texte) {
  return String(texte || "").split(/\s*;\s*|\n/).map((x) => x.trim()).filter(Boolean).map((x) => {
    let m;
    if ((m = /^saisir\s+(.+?)\s*=\s*(.*)$/i.exec(x))) return { t: "saisir", sel: m[1], v: m[2] };
    if ((m = /^choisir\s+(.+?)\s*=\s*(.*)$/i.exec(x))) return { t: "choisir", sel: m[1], v: m[2] };
    if ((m = /^cocher\s+(.+)$/i.exec(x))) return { t: "cocher", sel: m[1] };
    if ((m = /^cliquer\s+(.+)$/i.exec(x))) return { t: "cliquer", sel: m[1] };
    if ((m = /^attendre\s+(\d+)/i.exec(x))) return { t: "attendre", ms: Math.min(5000, Number(m[1])) };
    if ((m = /^alerte\s+contient\s+(.+)$/i.exec(x))) return { t: "alerte", v: m[1], c: true };
    if (/^aucune\s+alerte/i.test(x)) return { t: "sansalerte", c: true };
    if ((m = /^texte\s+(.+?)\s+contient\s+(.+)$/i.exec(x))) return { t: "texte", sel: m[1], v: m[2], c: true };
    if ((m = /^valeur\s+(.+?)\s*=\s*(.*)$/i.exec(x))) return { t: "valeur", sel: m[1], v: m[2], c: true };
    if ((m = /^existe\s+(.+)$/i.exec(x))) return { t: "existe", sel: m[1], c: true };
    if ((m = /^style\s+(.+?)\s+([a-z-]+)\s*=\s*(.+)$/i.exec(x))) return { t: "style", sel: m[1], prop: m[2], v: m[3], c: true };
    return { t: "inconnue", texte: x, c: true };
  });
}
function actionPage(a) {
  /* exécutée dans la page de l'élève */
  var S = window.__sti || { alertes: [], erreurs: [] };
  function dist(x, y) {
    x = x.toLowerCase(); y = y.toLowerCase(); var d = [], i, j;
    for (i = 0; i <= x.length; i++) { d[i] = [i]; for (j = 1; j <= y.length; j++) d[i][j] = i ? Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)) : j; }
    return d[x.length][y.length];
  }
  function el(sel) {
    var e = document.querySelector(sel);
    // D3 : identifiant mal orthographié dans la page de l'élève (resulat au lieu de resultat)
    if (!e && a.idsTol && /^#[\w-]+$/.test(sel)) {
      var cherche = sel.slice(1), ids = Array.prototype.map.call(document.querySelectorAll("[id]"), function (x) { return x.id; });
      var bon = ids.filter(function (x) { var n = Math.min(x.length, cherche.length); return x.toLowerCase() === cherche.toLowerCase() || (n >= 4 && dist(x, cherche) <= (n >= 9 ? 2 : 1)); })[0];
      if (bon) { e = document.getElementById(bon); S.subs = S.subs || []; if (!S.subs.some(function (s) { return s.de === cherche; })) S.subs.push({ de: cherche, vers: bon }); }
    }
    if (!e) throw new Error("élément introuvable : " + sel);
    return e;
  }
  function txt(e) { return /^(INPUT|TEXTAREA|SELECT|OUTPUT)$/.test(e.tagName) ? String(e.value) : String(e.innerText || e.textContent || ""); }
  function rempl(v) { return String(v == null ? "" : v).replace(/\{([^}]+)\}/g, function (m, s) { var e = document.querySelector(s); return e ? txt(e).trim() : ""; }); }
  function ev(e, n) { e.dispatchEvent(new Event(n, { bubbles: true })); }
  try {
    switch (a.t) {
      case "saisir": { S.marque = S.alertes.length; var e = el(a.sel); e.value = rempl(a.v); ev(e, "input"); ev(e, "change"); return { ok: true }; }
      case "choisir": {
        S.marque = S.alertes.length; var s = el(a.sel), v = rempl(a.v);
        if (/^\d+$/.test(v) && s.options && Number(v) < s.options.length) s.selectedIndex = Number(v);
        else { var o = Array.prototype.find.call(s.options || [], function (x) { return x.text.trim().toLowerCase() === v.toLowerCase() || x.value === v; }); if (!o) throw new Error("option introuvable : " + v); o.selected = true; }
        ev(s, "input"); ev(s, "change"); return { ok: true };
      }
      case "cocher": { S.marque = S.alertes.length; var c = el(a.sel); if (!c.checked) c.click(); return { ok: true }; }
      case "cliquer": { S.marque = S.alertes.length; el(a.sel).click(); return { ok: true }; }
      case "alerte": {
        // une alerte (au moins) affichée depuis la dernière action contient le texte
        var n = S.alertes.slice(S.marque || 0), cherche = rempl(a.v).toLowerCase();
        var ok = n.some(function (x) { return x.toLowerCase().indexOf(cherche) >= 0; });
        return { ok: ok, detail: n.length ? "alerte(s) « " + n.join(" » « ").slice(0, 120) + " »" : "aucune alerte" };
      }
      case "sansalerte": { var n2 = S.alertes.slice(S.marque || 0); return { ok: !n2.length, detail: n2.length ? "alerte « " + n2[n2.length - 1] + " »" : "" }; }
      case "texte": { var t = txt(el(a.sel)); return { ok: t.toLowerCase().indexOf(rempl(a.v).toLowerCase()) >= 0, detail: "« " + t.trim().slice(0, 60) + " »" }; }
      case "valeur": { var t2 = txt(el(a.sel)).trim(); return { ok: t2 === rempl(a.v).trim(), detail: "« " + t2.slice(0, 60) + " »" }; }
      case "existe": return { ok: !!document.querySelector(a.sel), detail: "" };
      case "style": { var cs = getComputedStyle(el(a.sel))[a.prop.replace(/-([a-z])/g, function (m, l) { return l.toUpperCase(); })]; return { ok: String(cs).replace(/\s+/g, "").toLowerCase().indexOf(rempl(a.v).replace(/\s+/g, "").toLowerCase()) >= 0, detail: a.prop + " = " + cs }; }
      default: return { ok: false, detail: "étape inconnue : " + (a.texte || a.t) };
    }
  } catch (e) { return { ok: false, detail: e.message, erreur: true }; }
}
async function testerPage(fichierHtml, scenario, opts) {
  opts = opts || {};
  if (!sessionCorrecteur) {
    sessionCorrecteur = require("electron").session.fromPartition("sti-correcteur");
    sessionCorrecteur.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !/^(file|data|blob|about|devtools):/i.test(d.url) }));
  }
  const w = new BrowserWindow({ show: false, width: 1280, height: 900, webPreferences: { session: sessionCorrecteur, preload: path.join(__dirname, "lib", "sonde.js"), contextIsolation: false, sandbox: true, nodeIntegration: false, devTools: false } });
  w.webContents.on("will-navigate", (e) => e.preventDefault());
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  const res = { chargee: false, total: 0, reussis: 0, echecs: [], erreursJs: [] };
  const delai = (ms) => new Promise((ok) => setTimeout(ok, ms));
  try {
    await Promise.race([w.loadFile(fichierHtml), delai(8000).then(() => { throw new Error("La page met trop de temps à se charger."); })]);
    res.chargee = true;
    await delai(150);
    for (const a of etapesScenario(scenario)) {
      if (a.t === "attendre") { await delai(a.ms); continue; }
      if (opts.idsTolerants) a.idsTol = true;
      const r = await Promise.race([w.webContents.executeJavaScript("(" + actionPage.toString() + ")(" + JSON.stringify(a) + ")", true), delai(4000).then(() => ({ ok: false, detail: "délai dépassé (boucle infinie ?)" }))]);
      if (a.c) { res.total++; if (r.ok) res.reussis++; else res.echecs.push(r.detail || a.t); }
      else if (!r.ok) res.echecs.push(r.detail);
      await delai(60);
    }
    try { res.erreursJs = await w.webContents.executeJavaScript("(window.__sti && window.__sti.erreurs) || []", true); } catch (e) { /* ignoré */ }
    try { res.substitutions = await w.webContents.executeJavaScript("(window.__sti && window.__sti.subs) || []", true); } catch (e) { res.substitutions = []; }
  } catch (e) { res.erreur = e.message; }
  finally { if (!w.isDestroyed()) w.destroy(); }
  return res;
}

let moteurSql = null;
async function chargerSql() { if (!moteurSql) moteurSql = await require("sql.js")(); return moteurSql; }

ipcMain.handle("cor:liste", () => {
  exigerProf();
  const l = [];
  try {
    for (const id of fs.readdirSync(dossierDevoirs())) {
      const d = lireJson(path.join(dossierDevoirs(), id, "devoir.json"));
      if (d) l.push({ id, titre: d.titre, classe: d.classe, niveau: d.niveau, eleves: (d.eleves || []).length, criteres: (d.grille || []).length, modifie: d.modifie });
    }
  } catch (e) { /* aucun devoir */ }
  return l.sort((a, b) => String(b.modifie).localeCompare(String(a.modifie)));
});
ipcMain.handle("cor:creer", (e, o) => {
  exigerProf();
  const j = new Date(), id = propre((o.titre || "Devoir") + "_" + (o.classe || "") + "_" + j.toISOString().slice(0, 10)) + "_" + j.getTime().toString(36).slice(-4);
  ecrireDevoir(id, { titre: o.titre || "Devoir", classe: (o.classe || "").toUpperCase(), niveau: Number(o.niveau) || 4, cree: j.toISOString(), grille: [], eleves: [], resultats: {} });
  return id;
});
ipcMain.handle("cor:charger", (e, id) => { exigerProf(); return lireDevoir(id); });
ipcMain.handle("cor:enregistrer", (e, id, devoir) => { exigerProf(); const ancien = lireDevoir(id); ecrireDevoir(id, Object.assign(ancien, devoir)); return lireDevoir(id); });
ipcMain.handle("cor:supprimer", (e, id) => { exigerProf(); fs.rmSync(dossierDevoir(id), { recursive: true, force: true }); return true; });
ipcMain.handle("cor:ouvrirDossier", (e, id) => { exigerProf(); shell.openPath(dossierDevoir(id)); });
ipcMain.handle("cor:importerTravaux", async (e, id, mode) => {
  exigerProf();
  const r = await dialog.showOpenDialog(fenetre, mode === "dossier"
    ? { title: "Dossier contenant un sous-dossier par élève", properties: ["openDirectory"] }
    : { title: "Travaux des élèves (archive RAR ou ZIP)", filters: [{ name: "Archives", extensions: ["rar", "zip"] }], properties: ["openFile", "multiSelections"] });
  if (r.canceled) return null;
  const devoir = lireDevoir(id);
  const res = await COR.importerTravaux(r.filePaths, path.join(dossierDevoir(id), "travaux"));
  res.eleves.forEach((x) => { x.dossier = path.join("travaux", x.dossier); x.fichiers = COR.fichiersEleve(path.join(dossierDevoir(id), x.dossier), x.isoles).length; });
  devoir.eleves = res.eleves; devoir.source = r.filePaths.map((f) => path.basename(f)).join(", "); devoir.resultats = {};
  ecrireDevoir(id, devoir);
  return { devoir: lireDevoir(id), journal: res.journal };
});
ipcMain.handle("cor:importerGrille", async (e, id) => {
  exigerProf();
  const r = await dialog.showOpenDialog(fenetre, { title: "Grille d'évaluation (Excel ou CSV)", filters: [{ name: "Grille", extensions: ["xlsx", "csv"] }], properties: ["openFile"] });
  if (r.canceled) return null;
  const devoir = lireDevoir(id);
  devoir.grille = await COR.lireGrille(r.filePaths[0]);
  devoir.grilleSource = path.basename(r.filePaths[0]);
  fs.copyFileSync(r.filePaths[0], path.join(dossierDevoir(id), "grille" + path.extname(r.filePaths[0]).toLowerCase()));
  ecrireDevoir(id, devoir);
  return lireDevoir(id);
});
ipcMain.handle("cor:modeleGrille", async (e, id) => {
  exigerProf();
  const g = id ? (lireDevoir(id).grille || []) : [];
  const r = await dialog.showSaveDialog(fenetre, { defaultPath: path.join(docs(), g.length ? "Grille_" + propre(lireDevoir(id).titre) + ".xlsx" : "Modele_grille_STI.xlsx"), filters: [{ name: "Excel", extensions: ["xlsx"] }] });
  if (r.canceled) return null;
  fs.mkdirSync(path.dirname(r.filePath), { recursive: true });
  return COR.modeleGrille(r.filePath, g.length ? g : null);
});
ipcMain.handle("cor:joindre", async (e, id, type) => {
  exigerProf();
  const r = await dialog.showOpenDialog(fenetre, type === "base"
    ? { title: "Base de référence (script .sql : CREATE TABLE + INSERT)", filters: [{ name: "Script SQL", extensions: ["sql"] }], properties: ["openFile"] }
    : { title: "Énoncé du devoir", filters: [{ name: "Énoncé", extensions: ["pdf", "docx", "doc", "odt", "html", "txt"] }], properties: ["openFile"] });
  if (r.canceled) return null;
  const devoir = lireDevoir(id), f = r.filePaths[0], nom = (type === "base" ? "base" : "enonce") + path.extname(f).toLowerCase();
  fs.copyFileSync(f, path.join(dossierDevoir(id), nom));
  devoir[type === "base" ? "base" : "enonce"] = { fichier: nom, original: path.basename(f) };
  if (type === "base") {
    const SQL = await chargerSql(), b = STISQL_creer(SQL, fs.readFileSync(f, "utf8"));
    devoir.base.tables = b.tables; devoir.base.erreurs = b.erreurs.length;
  }
  ecrireDevoir(id, devoir);
  return lireDevoir(id);
});
function STISQL_creer(SQL, script) {
  const M = require("./app/modules/sqlmoteur.js"), b = M.creerBase(SQL, script);
  const t = M.schema(b.db).map((x) => x.table + " (" + x.lignes + ")"); b.db.close();
  return { tables: t, erreurs: b.erreurs };
}
ipcMain.handle("cor:ouvrirEnonce", (e, id) => { exigerProf(); const d = lireDevoir(id); if (d.enonce) shell.openPath(path.join(dossierDevoir(id), d.enonce.fichier)); });
ipcMain.handle("cor:corriger", async (e, id, o) => {
  exigerProf();
  o = o || {};
  const devoir = lireDevoir(id), dd = dossierDevoir(id);
  if (!devoir.grille.length) throw new Error("Importez d'abord la grille d'évaluation.");
  if (!devoir.eleves.length) throw new Error("Importez d'abord les travaux des élèves.");
  let verif = null;
  try { verif = COR.chargerVerificateur(dossierContenuActif()); } catch (err) { verif = null; }
  const refSql = devoir.base ? fs.readFileSync(path.join(dd, devoir.base.fichier), "utf8") : "";
  const SQL = devoir.grille.some((c) => c.verif === "sql") ? await chargerSql() : null;
  const liste = devoir.eleves.filter((x) => !o.eleves || o.eleves.includes(x.id));
  // ancien format (pénalité unique) ou réglages absents : règles validées par défaut
  const tolerance = Object.assign({}, COR.TOLERANCE, devoir.tolerance && devoir.tolerance.regles ? devoir.tolerance : { active: devoir.tolerance ? devoir.tolerance.active !== false : true });
  if (devoir.tolerance && devoir.tolerance.regles && true) for (const k of ["B1", "B2"]) if (!(devoir.tolerance.connues || []).includes(k) && !(k in tolerance.regles)) tolerance.regles = Object.assign({ [k]: COR.TOLERANCE.regles[k] }, tolerance.regles);
  let fait = 0;
  for (const el of liste) {
    const base = path.join(dd, el.dossier), fichiers = COR.fichiersEleve(base, el.isoles);
    const res = devoir.resultats[el.id] = devoir.resultats[el.id] || {};
    // copie réparée du travail (créée seulement si un test de page échoue)
    let repare = null;
    const penalisees = new Set();   // une erreur de forme n'est pénalisée qu'une fois par élève
    const reparer = () => repare || (repare = { dossier: path.join(os.tmpdir(), "sti-repare", propre(id), el.id), rep: null }, repare.rep = require("./lib/tolerance").reparerProjet(base, repare.dossier, tolerance.regles || {}), repare);
    for (const c of devoir.grille) {
      if (res[c.id] && res[c.id].modifie && !o.ecraser) continue;            // note saisie par l'enseignant conservée
      try { res[c.id] = await COR.verifier(c, { base, fichiers, niveau: devoir.niveau, verificateur: verif, SQL, refSql, testerPage, tolerance, reparer, penalisees }); }
      catch (err) { res[c.id] = { points: 0, justif: "Erreur de vérification : " + err.message, auto: true }; }
    }
    fait++;
    if (fenetre && !fenetre.isDestroyed()) fenetre.webContents.send("cor:progression", { fait, total: liste.length, eleve: el.nom });
  }
  devoir.corrige = new Date().toISOString();
  ecrireDevoir(id, devoir);
  return lireDevoir(id);
});
ipcMain.handle("cor:fichiers", (e, id, eleveId) => {
  exigerProf();
  const devoir = lireDevoir(id), el = devoir.eleves.find((x) => x.id === eleveId);
  if (!el) throw new Error("Élève introuvable.");
  const base = path.join(dossierDevoir(id), el.dossier), l = COR.fichiersEleve(base, el.isoles), fichiers = {};
  for (const f of l) {
    const p = path.join(base, f);
    if (/\.(html?|css|js|php|sql|txt|svg)$/i.test(f) && fs.statSync(p).size < 512 * 1024) fichiers[f] = fs.readFileSync(p, "utf8");
  }
  return { fichiers, liste: l, dossier: base, base: devoir.base ? fs.readFileSync(path.join(dossierDevoir(id), devoir.base.fichier), "utf8") : "" };
});
ipcMain.handle("cor:ouvrirTravail", (e, id, eleveId) => { exigerProf(); const d = lireDevoir(id), el = d.eleves.find((x) => x.id === eleveId); if (el) shell.openPath(path.join(dossierDevoir(id), el.dossier)); });
ipcMain.handle("cor:exporter", async (e, id) => {
  exigerProf();
  const devoir = lireDevoir(id);
  const r = await dialog.showSaveDialog(fenetre, { defaultPath: path.join(dossierDevoir(id), "Notes_" + propre(devoir.titre + (devoir.classe ? "_" + devoir.classe : "")) + ".xlsx"), filters: [{ name: "Excel", extensions: ["xlsx"] }] });
  if (r.canceled) return null;
  devoir.auteur = "M. Zouaghi Mohamed — Lycée Oued Ellil";
  await COR.exporterExcel(r.filePath, devoir, devoir.grille, devoir.eleves, devoir.resultats);
  return r.filePath;
});
ipcMain.handle("cor:ouvrirFichier", (e, f) => { exigerProf(); if (f && fs.existsSync(f)) shell.openPath(f); });

/* ---------------------------------------------------------------- démarrage */
app.setName(COMPLET ? "STI Guide" : "STI Eleve");
if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => { if (fenetre) { if (fenetre.isMinimized()) fenetre.restore(); fenetre.focus(); } });
app.whenReady().then(() => {
  protocol.handle("sti", servir);
  menu();
  creerFenetre();
});
app.on("window-all-closed", () => { arreterRamassage(); app.quit(); });
