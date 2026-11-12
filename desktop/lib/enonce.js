/* Analyse de l'énoncé d'un devoir → grille d'évaluation proposée (modifiable par l'enseignant).
   1. texte de l'énoncé : PDF, Word (.docx, numérotation automatique comprise), .odt, HTML, texte ;
   2. structure : parties (Exercice 1, Partie A, Activité 2…), questions (1), 2.…), sous-questions (a), b)…) ;
   3. barème : points écrits à côté des questions « (1,5 pt) », tableau « Grille d'évaluation / Barème »,
      points des parties « Exercice 2 (8 points) » ; sinon répartition sur 20 selon le travail demandé ;
   4. pour chaque question, les vérifications automatiques possibles (fichier, balises, propriétés CSS,
      fonctions JavaScript, PHP/MySQL, requête SQL) ; les questions de cours restent « manuel ». */
"use strict";
const fs = require("fs");
const path = require("path");

/* ================================================================ texte de l'énoncé */
function entites(t) {
  return t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16))).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
function dezipper(buf) { const { unzipSync } = require("fflate"); return unzipSync(new Uint8Array(buf)); }
const xmlTexte = (u8) => (u8 ? Buffer.from(u8).toString("utf8") : "");

/* Word : paragraphes, tableaux (cellules séparées par des tabulations) et numérotation automatique (1), a)…) */
function texteDocx(buf) {
  const z = dezipper(buf);
  let doc = xmlTexte(z["word/document.xml"]);
  if (!doc) throw new Error("Fichier Word illisible (document.xml absent).");
  doc = doc.replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, "");
  // numérotation : numId → abstractNum → format de chaque niveau
  const num = xmlTexte(z["word/numbering.xml"]), abstraits = {}, nums = {};
  for (const m of num.matchAll(/<w:abstractNum\b[^>]*w:abstractNumId="(\d+)"[^>]*>([\s\S]*?)<\/w:abstractNum>/g)) {
    const niveaux = {};
    for (const l of m[2].matchAll(/<w:lvl\b[^>]*w:ilvl="(\d+)"[^>]*>([\s\S]*?)<\/w:lvl>/g)) {
      niveaux[l[1]] = { debut: +((/<w:start w:val="(\d+)"/.exec(l[2]) || [])[1] || 1), format: (/<w:numFmt w:val="(\w+)"/.exec(l[2]) || [])[1] || "decimal", texte: entites((/<w:lvlText w:val="([^"]*)"/.exec(l[2]) || [])[1] || "") };
    }
    abstraits[m[1]] = niveaux;
  }
  for (const m of num.matchAll(/<w:num\b[^>]*w:numId="(\d+)"[^>]*>[\s\S]*?<w:abstractNumId w:val="(\d+)"/g)) nums[m[1]] = m[2];
  // numérotation portée par le style du paragraphe (« Liste numérotée »…)
  const styles = xmlTexte(z["word/styles.xml"]), numStyle = {};
  for (const m of styles.matchAll(/<w:style\b[^>]*w:styleId="([^"]+)"[^>]*>([\s\S]*?)<\/w:style>/g)) {
    const n = /<w:numId w:val="(\d+)"\/>/.exec(m[2]);
    if (n) numStyle[m[1]] = { numId: n[1], ilvl: (/<w:ilvl w:val="(\d+)"\/>/.exec(m[2]) || [])[1] || "0" };
  }
  const compteurs = {};
  const romain = (n) => { const v = [[10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]]; let r = ""; for (const [k, s] of v) while (n >= k) { r += s; n -= k; } return r; };
  const formater = (n, f) => f === "lowerLetter" ? String.fromCharCode(96 + ((n - 1) % 26) + 1) : f === "upperLetter" ? String.fromCharCode(64 + ((n - 1) % 26) + 1)
    : f === "lowerRoman" ? romain(n) : f === "upperRoman" ? romain(n).toUpperCase() : String(n);
  function prefixe(numId, ilvl) {
    const ab = abstraits[nums[numId]];
    if (!ab || !ab[ilvl]) return "";
    const c = compteurs[numId] = compteurs[numId] || {};
    c[ilvl] = c[ilvl] === undefined ? ab[ilvl].debut : c[ilvl] + 1;
    for (const k of Object.keys(c)) if (+k > +ilvl) delete c[k];
    if (ab[ilvl].format === "bullet" || ab[ilvl].format === "none") return "- ";
    return ab[ilvl].texte.replace(/%(\d)/g, (m, d) => { const lv = String(+d - 1); const v = c[lv] !== undefined ? c[lv] : (ab[lv] ? ab[lv].debut : 1); return formater(v, (ab[lv] || ab[ilvl]).format); }) + " ";
  }
  const paragraphe = (p) => {
    const n = /<w:numPr>[\s\S]*?<w:ilvl w:val="(\d+)"\/>[\s\S]*?<w:numId w:val="(\d+)"\/>/.exec(p) || /<w:numPr>[\s\S]*?<w:numId w:val="(\d+)"\/>/.exec(p);
    let pre = "";
    const st = numStyle[(/<w:pStyle w:val="([^"]+)"/.exec(p) || [])[1]];
    if (n) pre = n.length === 3 ? prefixe(n[2], n[1]) : prefixe(n[1], st ? st.ilvl : "0");
    else if (st && st.numId !== "0") pre = prefixe(st.numId, st.ilvl);
    if (/<w:numId w:val="0"\/>/.test(p)) pre = "";
    const t = p.replace(/<w:tab\/>/g, "\t").replace(/<w:br\/>/g, "\n").replace(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g, "\u0001$1\u0002").replace(/<[^>]+>/g, "")
      .replace(/\u0002[^\u0001]*?\u0001/g, "").replace(/^[^\u0001]*\u0001|\u0002[^\u0001]*$/g, "").replace(/[\u0001\u0002]/g, "");
    return pre + entites(t);
  };
  let out = "", dansCellule = 0, cellule = [];
  const re = /<w:tbl>|<\/w:tbl>|<w:tr\b[^>]*>|<\/w:tr>|<w:tc>|<w:tc\b[^>]*>|<\/w:tc>|<w:p\b[^>]*\/>|<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
  let m;
  while ((m = re.exec(doc))) {
    const x = m[0];
    if (/^<w:tc\b/.test(x)) { dansCellule++; cellule = []; }
    else if (x === "</w:tc>") { dansCellule = Math.max(0, dansCellule - 1); out += cellule.join(" ").trim() + "\t"; }
    else if (x === "</w:tr>") out = out.replace(/\t$/, "") + "\n";
    else if (/^<w:p\b/.test(x)) { const t = /\/>$/.test(x) ? "" : paragraphe(x); if (dansCellule) cellule.push(t); else out += t + "\n"; }
  }
  return out;
}
function texteOdt(buf) {
  const c = xmlTexte(dezipper(buf)["content.xml"]);
  return entites(c.replace(/<text:tab\/>/g, "\t").replace(/<\/table:table-cell>/g, "\t").replace(/<\/table:table-row>/g, "\n").replace(/<\/text:(p|h)>/g, "\n").replace(/<[^>]+>/g, ""));
}
function texteHtml(h) {
  return entites(String(h).replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "").replace(/<\/(td|th)>/gi, "\t").replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|section|article|header|footer)>/gi, "\n").replace(/<[^>]+>/g, ""));
}
async function textePdf(buf) {
  const pdf = require("pdf-parse/lib/pdf-parse.js");
  // rendu qui garde les espaces entre les cellules d'un tableau (le rendu par défaut les colle)
  const rendre = (page) => page.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false }).then((tc) => {
    let texte = "", y0 = null, x1 = null;
    for (const it of tc.items) {
      const x = it.transform[4], y = it.transform[5];
      if (y0 === null) texte += it.str;
      else if (Math.abs(y - y0) > 2) texte += "\n" + it.str;
      else { const ecart = x - x1; texte += (ecart > 12 ? "\t" : ecart > 1.5 ? " " : "") + it.str; }
      y0 = y; x1 = x + (it.width || 0);
    }
    return texte;
  });
  const r = await pdf(buf, { pagerender: rendre });
  return r.text || "";
}
async function texteEnonce(fichier) {
  const ext = path.extname(fichier).toLowerCase(), buf = fs.readFileSync(fichier);
  if (ext === ".pdf") return textePdf(buf);
  if (ext === ".docx") return texteDocx(buf);
  if (ext === ".odt") return texteOdt(buf);
  if (ext === ".html" || ext === ".htm") return texteHtml(buf.toString("utf8"));
  if (ext === ".txt") return buf.toString("utf8").replace(/^\uFEFF/, "");
  if (ext === ".doc") {
    // ancien format Word : texte brut récupéré au mieux
    const t = buf.toString("latin1").replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]+/g, "\n");
    return t.split("\n").filter((l) => l.trim().length > 2 && /[a-z]{3}/i.test(l)).join("\n");
  }
  throw new Error("Format d'énoncé non pris en charge : " + ext);
}

/* ================================================================ structure */
const NB = "(\\d{1,2}(?:[.,]\\d{1,2})?)";
const RX_POINTS = new RegExp("(?:^|[\\s(\\[:/\\-–…=])\\s*" + NB + "\\s*(?:points?|pts?|pt)\\b\\s*\\.?\\s*[)\\]]?", "gi");
const RX_SUR = new RegExp("\\/\\s*" + NB + "\\s*\\)?\\s*$");
function pointsLigne(l) {
  let m, d = null;
  RX_POINTS.lastIndex = 0;
  while ((m = RX_POINTS.exec(l))) d = m;
  const v = d ? parseFloat(d[1].replace(",", ".")) : (RX_SUR.exec(l) ? parseFloat(RX_SUR.exec(l)[1].replace(",", ".")) : null);
  return v !== null && v > 0 && v <= 40 ? v : null;
}
const sansPoints = (l) => l.replace(RX_POINTS, " ").replace(RX_SUR, "").replace(/\s*(\(\s*\)|\[\s*\])\s*\.?\s*$/, "").replace(/[\s.…:\-–]+$/, "").trim();

const RX_PARTIE = /^\s*(exercice|partie|activit[ée]|[ée]tape|probl[èe]me|situation|dossier|t[âa]che|application)\s*(?:n\s*[°ºo]\s*|no\.?\s*|#\s*)?(\d{1,2}|[IVX]{1,4}\b|[A-H]\b|pratique|th[ée]orique)?\s*(.*)$/i;
const RX_QUESTION = /^\s*(?:question\s*|q\s*)?(\d{1,2})\s*(?:[).\-–:°\/]|\s-)\s*(?=[^\d\s.,])(.+)$/i;
const RX_QSOUS = /^\s*(?:q\s*)?(\d{1,2})\s*[.\-]?\s*([a-h])\s*[).\-–\/]\s*(.+)$/i;
const RX_SOUS = /^\s*([a-h])\s*[).\-–\/]\s+(.+)$/;
const RX_BAREME = /^\s*(grille\s+d.?\s*[ée]valuation|bar[èe]me(\s+de\s+notation)?|r[ée]partition\s+des\s+points)\b/i;
const RX_FIN = /^\s*(bon\s+travail|bonne\s+(chance|r[ée]ussite)|annexe\s*(:|$)|fin\s+du\s+sujet)/i;

function nouvelleFeuille(o) { return Object.assign({ enfants: [], pts: null, texte: "", titre: "" }, o); }

function structure(texte) {
  const lignes = String(texte || "").replace(/\r/g, "").split("\n").map((l) => l.replace(/\u00a0/g, " ").replace(/[ \t]+$/, ""));
  const racine = nouvelleFeuille({ niveau: 0 }), bareme = [];
  let partie = null, q = null, sq = null, dansBareme = false, consignes = "";
  const courant = () => sq || q || partie;
  const assurerPartie = () => { if (!partie) { partie = nouvelleFeuille({ niveau: 1, nom: "", num: "", implicite: true }); racine.enfants.push(partie); } return partie; };
  for (let i = 0; i < lignes.length; i++) {
    const brut = lignes[i], l = brut.replace(/\t+/g, "  ").trim();
    if (!l) continue;
    if (RX_FIN.test(l)) { dansBareme = false; if (/^\s*annexe/i.test(l)) break; continue; }
    if (!dansBareme && RX_BAREME.test(l) && l.length < 90) { dansBareme = true; const reste = l.replace(RX_BAREME, "").replace(/^[\s:.\-–]+/, ""); if (reste) bareme.push(reste); continue; }
    // dans le tableau du barème : une ligne de plusieurs cellules (« Exercice 1   Exercice 2 ») ou de nombres en fait partie
    if (dansBareme && (brut.split(/\t|\s{2,}|\s*\|\s*/).filter((x) => x.trim()).length >= 2 || /^[\d.,\s]+$/.test(l) || RX_BAREME.test(l))) { bareme.push(brut); continue; }
    let m;
    const estPartie = (m = RX_PARTIE.exec(l)) && l.length < 150 && (m[2] || pointsLigne(l) !== null) && !/^\s*(partie|section)\s+\d+\s+(du|de la|des)\b/i.test(l);
    if (dansBareme && !estPartie) { bareme.push(brut); continue; }
    if (estPartie) {
      dansBareme = false;
      const titre = sansPoints(m[3] || "").replace(/^[\s:.\-–)]+/, "");
      const num = (m[2] || "").replace(/^(pratique|th[ée]orique)$/i, (x) => x.toLowerCase());
      partie = nouvelleFeuille({ niveau: 1, mot: m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(), num, titre, pts: pointsLigne(l) });
      partie.nom = partie.mot + (num ? " " + (/^\d+$|^[IVXA-H]+$/i.test(num) ? num.toUpperCase() : num) : "") + (titre && titre.length <= 45 ? " : " + titre : "");
      racine.enfants.push(partie); q = null; sq = null;
      continue;
    }
    if ((m = RX_QSOUS.exec(l)) && (!q || String(q.num) === m[1] || !q.enfants.length)) {
      // « 1.a) … » : question 1, sous-question a
      assurerPartie();
      if (!q || String(q.num) !== m[1]) { q = nouvelleFeuille({ niveau: 2, num: m[1], titre: "" }); partie.enfants.push(q); }
      sq = nouvelleFeuille({ niveau: 3, lettre: m[2].toLowerCase(), titre: sansPoints(m[3]), texte: m[3], pts: pointsLigne(l) });
      q.enfants.push(sq);
      continue;
    }
    if ((m = RX_QUESTION.exec(l)) && !(q && +m[1] > +q.num + 3) && !/^\d{1,2}[.,]\d/.test(l)) {
      assurerPartie();
      q = nouvelleFeuille({ niveau: 2, num: m[1], titre: sansPoints(m[2]), texte: m[2], pts: pointsLigne(l) });
      partie.enfants.push(q); sq = null;
      continue;
    }
    if ((m = RX_SOUS.exec(l)) && (q || partie)) {
      const parent = q || partie;
      sq = nouvelleFeuille({ niveau: q ? 3 : 2, lettre: m[1].toLowerCase(), num: q ? undefined : m[1].toLowerCase(), titre: sansPoints(m[2]), texte: m[2], pts: pointsLigne(l) });
      parent.enfants.push(sq);
      if (!q) { q = null; }
      continue;
    }
    const c = courant();
    if (c) { c.texte += "\n" + l; if (c.pts === null && c !== partie && pointsLigne(l) !== null && l.length < 40) c.pts = pointsLigne(l); else if (c === partie) partie.consignes = (partie.consignes || "") + "\n" + l; }
    else consignes += "\n" + l;
  }
  // une partie sans question numérotée est elle-même une question
  return { racine, bareme, consignes };
}

/* ================================================================ vérifications détectées dans une question */
const MOTS_VIDES = new Set("qui que de du des la le les permettant permet javascript js nommee nommée appelee appelée intitulee intitulée suivante ci pour en a à une un script cette et d l son sa ses".split(" "));
const BALISES = [
  [/\btableau\b(?!\s+(de bord|suivant|ci))/i, "<table", "tableau"],
  [/liste\s+(?:à|a)\s+puces|liste\s+non\s+(?:ordonn|num[ée]rot)/i, "<ul", "liste à puces"],
  [/liste\s+(?:ordonn[ée]e|num[ée]rot[ée]e)/i, "<ol", "liste numérotée"],
  [/\bformulaire\b/i, "<form", "formulaire"],
  [/liste\s+d[ée]roulante/i, "<select", "liste déroulante"],
  [/zone\s+de\s+(?:texte|saisie)\s+multi|multi-?lignes?|\btextarea\b/i, "<textarea", "zone multiligne"],
  [/mot\s+de\s+passe/i, "/type\\s*=\\s*[\"']?password/", "champ mot de passe"],
  [/boutons?\s+radio|boutons?\s+d.options?/i, "/type\\s*=\\s*[\"']?radio/", "boutons radio"],
  [/cases?\s+(?:à|a)\s+cocher/i, "/type\\s*=\\s*[\"']?checkbox/", "cases à cocher"],
  [/\b(?:e-?mail|courriel|adresse\s+[ée]lectronique)\b/i, "/type\\s*=\\s*[\"']?email/", "champ e-mail"],
  [/\bcurseur\b|\btype\s+range\b/i, "/type\\s*=\\s*[\"']?range/", "curseur (range)"],
  [/\bdatalist\b|liste\s+de\s+(?:suggestions|propositions)/i, "<datalist", "datalist"],
  [/\boutput\b/i, "<output", "output"],
  [/\bimage\b(?!\s+(?:ci|suivante))|\blogo\b|\bphoto\b(?!\s+(?:ci|suivante))/i, "<img", "image"],
  [/\bhyper-?liens?\b|\bliens?\s+(?:vers|hypertexte)/i, "/<a\\s[^>]*href/", "lien"],
  [/\biframe\b|\bcadre\s+(?:en\s+ligne|flottant)/i, "<iframe", "iframe"],
  [/\bvid[ée]o\b/i, "<video", "vidéo"],
  [/\baudio\b|fichier\s+son(?:ore)?\b|\bmusique\b/i, "<audio", "audio"],
  [/en-?t[êe]te|\bheader\b/i, "<header", "en-tête (header)"],
  [/pied\s+de\s+(?:la\s+)?page|\bfooter\b/i, "<footer", "pied de page (footer)"],
  [/barre\s+de\s+navigation|\bmenu\b|\bnav\b/i, "<nav", "menu (nav)"],
  [/\bsection\b/i, "<section", "section"],
  [/\barticle\b/i, "<article", "article"],
  [/\baside\b|barre\s+lat[ée]rale/i, "<aside", "aside"],
  [/\bfigure\b/i, "<figure", "figure"],
  [/\bfigcaption\b|l[ée]gende\s+de\s+(?:la\s+|l.)?(?:figure|image)/i, "<figcaption", "légende (figcaption)"],
  [/\bfieldset\b|cadre\s+de\s+regroupement|\bregroup/i, "<fieldset", "fieldset"],
  [/\blegend\b|l[ée]gende\s+du\s+(?:cadre|groupe|fieldset)/i, "<legend", "legend"],
  [/\b[ée]tiquettes?\b|\blabel\b/i, "<label", "label"],
  [/zone\s+de\s+(?:texte|saisie)(?!\s+multi)|champs?\s+(?:de\s+)?(?:texte|saisie)/i, "<input", "zone de texte"],
  [/\bparagraphe\b/i, "/<p[\\s>]/", "paragraphe"],
  [/\bdivision\b|\bdiv\b/i, "<div", "div"]
];
const PROPS = ["background-color", "background-image", "background", "font-family", "font-size", "font-weight", "font-style", "text-align", "text-decoration", "text-transform",
  "text-indent", "line-height", "letter-spacing", "border-radius", "border-collapse", "border", "margin", "padding", "min-width", "max-width", "width", "height", "float", "clear",
  "position", "display", "list-style-type", "list-style-image", "list-style", "box-shadow", "text-shadow", "opacity", "cursor", "transition", "transform", "animation", "z-index",
  "overflow", "vertical-align", "visibility", "color"];
const CSS_MOTS = [
  [/police\s+d[eu]\s+caract|\bpolice\b(?!\s+(?:de\s+)?taille)/i, "/font(-family)?\\s*:/", "police"],
  [/taille\s+(?:de\s+(?:la\s+)?)?(?:police|caract|texte|écriture)/i, "/font(-size)?\\s*:/", "taille du texte"],
  [/majuscules?|minuscules?|capitali/i, "/text-transform\\s*:/", "casse (text-transform)"],
  [/arri[èe]re-?plan|couleur\s+de\s+fond|\bfond\b/i, "/background(-color|-image)?\\s*:/", "arrière-plan"],
  [/couleur(?!\s+(?:de|du)\s+(?:fond|l.arri))|en\s+(?:rouge|bleu|vert|blanc|noir|jaune|orange|gris)\b/i, "/(^|[^-])color\\s*:/", "couleur du texte"],
  [/marges?\s+int[ée]rieures?|\bespacement\s+int/i, "/padding(-\\w+)?\\s*:/", "marge intérieure"],
  [/marges?\s+ext[ée]rieures?|\bmarges?\b(?!\s+int)/i, "/margin(-\\w+)?\\s*:/", "marge extérieure"],
  [/\bbordures?\b|\bencadr/i, "/border(-\\w+)?\\s*:/", "bordure"],
  [/coins?\s+arrondis|arrondi/i, "/border-radius\\s*:/", "coins arrondis"],
  [/\bombre/i, "/(box|text)-shadow\\s*:/", "ombre"],
  [/\bgras\b/i, "/font(-weight)?\\s*:/", "gras"],
  [/\bitalique/i, "/font(-style)?\\s*:/", "italique"],
  [/soulign|barr[ée]/i, "/text-decoration(-line)?\\s*:/", "soulignement"],
  [/\bpuces?\b/i, "/list-style(-type|-image)?\\s*:/", "style de puce"],
  [/align|\bcentr/i, "/(text-align|margin(-left|-right)?)\\s*:/", "alignement"],
  [/\blargeur\b/i, "/width\\s*:/", "largeur"],
  [/\bhauteur\b/i, "/height\\s*:/", "hauteur"],
  [/\bflottant|\bà\s+(?:droite|gauche)\s+de|m[êe]me\s+ligne|c[ôo]te\s+[àa]\s+c[ôo]te/i, "/(float|display|position)\\s*:/", "disposition"],
  [/\bsurvol|\bhover\b|passage\s+de\s+la\s+souris/i, ":hover", "survol (:hover)"],
  [/\btransition/i, "/transition(-\\w+)?\\s*:/", "transition"],
  [/\banimation|\bkeyframes/i, "@keyframes", "animation (@keyframes)"],
  [/\btransform|rotation|pivot|agrandi/i, "/transform\\s*:/", "transformation"],
  [/\bopacit|transparen/i, "/opacity\\s*:/", "opacité"],
  [/\bcurseur\s+(?:de\s+la\s+)?souris|\bmain\b/i, "/cursor\\s*:/", "curseur"]
];
const API_JS = ["getElementById", "innerHTML", "indexOf", "lastIndexOf", "substring", "substr", "toUpperCase", "toLowerCase", "parseInt", "parseFloat", "isNaN", "Math.round",
  "Math.random", "Math.trunc", "Math.sqrt", "selectedIndex", "checked", "getFullYear", "getMonth", "getDate", "getDay", "focus", "String.fromCharCode", "charCodeAt", "toFixed", "push", "length"];
const PHP = [
  [/connexion|se\s+connect|connecter/i, "mysqli_connect", "connexion (mysqli_connect)"],
  [/ex[ée]cut|requ[eê]te/i, "mysqli_query", "exécution (mysqli_query)"],
  [/r[ée]cup[ée]r|donn[ée]es\s+(?:saisies|du\s+formulaire)|envoy[ée]es/i, "/\\$_(POST|GET|REQUEST)\\s*\\[/", "récupération ($_POST)"],
  [/ins[ée]r|ajout|enregistr/i, "/insert\\s+into/", "INSERT INTO"],
  [/supprim/i, "/delete\\s+from/", "DELETE FROM"],
  [/modifi|mettre\s+[àa]\s+jour/i, "/update\\s+\\w+\\s+set/", "UPDATE … SET"],
  [/affich(?:er|age)\s+(?:la\s+)?liste|parcour|tableau\s+des|tous\s+les/i, "/mysqli_fetch_(array|assoc|row)/", "parcours (mysqli_fetch_…)"],
  [/existe|d[ée]j[àa]\s+inscrit|v[ée]rifi/i, "mysqli_num_rows", "test d'existence (mysqli_num_rows)"]
];
const RX_COURS = /^\s*(d[ée]fini[rs]?|citer|cite[zr]?|expliquer|donner\s+(?:la\s+d[ée]finition|le\s+r[ôo]le|l.int[ée]r[êe]t|deux|trois|un\s+exemple|la\s+diff)|justifier|comparer|d[ée]crire|quel(?:le)?s?\b|pourquoi|indiquer|pr[ée]ciser|identifier|nommer|r[ée]pondre|cocher|vrai\s+ou\s+faux|relier|choisir\s+la\s+bonne|compl[ée]ter\s+le\s+tableau|recopier|lister|qu.est-ce)/i;
const RX_CODE = /\b(code|html|css|javascript|script|fonction|requ[eê]te|sql|php|balise|propri[ée]t[ée]|fichier|page|programme|instruction)\b|\.(html?|css|js|php|sql)\b/i;

function echapperRe(s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&"); }
function verifsQuestion(texte, contexte) {
  const t = String(texte || ""), tout = (contexte ? contexte + "\n" : "") + t, v = [];
  const ajout = (verif, fichier, motif, libelle) => { if (!v.some((x) => x.verif === verif && x.fichier === fichier && x.motif === motif)) v.push({ verif, fichier, motif, libelle }); };
  const premiere = t.split("\n")[0];
  const cours = RX_COURS.test(premiere) && !/(?:code|requ[eê]te|script|programme)\s+(html|css|javascript|js|sql|php|permettant)/i.test(t) && !/^\s*(donner|[ée]crire|proposer)\s+(le|la|une|un)\s+(code|requ[eê]te|script|fonction|r[èe]gle)/i.test(premiere);
  if (cours) return { nature: "cours", verifs: [] };
  const fichiers = Array.from(new Set((t.match(/[\w\-]+\.(?:html?|css|js|php|sql)\b/gi) || []).map((x) => x)));
  const fCtx = Array.from(new Set((tout.match(/[\w\-]+\.(?:html?|css|js|php|sql)\b/gi) || [])));
  const fHtml = fichiers.find((x) => /\.html?$/i.test(x)) || "", fPhp = fichiers.find((x) => /\.php$/i.test(x)) || fCtx.find((x) => /\.php$/i.test(x)) || "*.php";
  const estSql = /\brequ[eê]tes?\b|\ben\s+sql\b|langage\s+sql|\bselect\b|cr[ée]er\s+la\s+table|ajouter\s+(?:la|une)\s+(?:colonne|contrainte|cl[ée])|alter\s+table/i.test(t) && !/\bphp\b|\.php\b|mysqli/i.test(t);
  const estPhp = /\bphp\b|\.php\b|mysqli|serveur|base\s+de\s+donn[ée]es.*(?:formulaire|page)/i.test(t) && /\bphp\b|\.php\b|mysqli/i.test(tout);
  const estJs = /javascript|\bjs\b|\.js\b|\bfonction\b|\bscript\b|contr[ôo]le\s+de\s+saisie|au\s+clic|\bonclick\b|\bvalider\b.*\bbouton|\bbouton\b.*\bclic/i.test(t);
  const estCss = /\bcss\b|feuille\s+de\s+style|\.css\b|\bstyle\b|mise\s+en\s+forme|mettre\s+en\s+forme|couleur|police|bordure|marge|arri[èe]re-?plan|align|centr|gras|italique|soulign|taille|largeur|hauteur|ombre|transition|animation|transform|flottant|\bfloat\b|position|survol|hover|opacit/i.test(t);
  const cssVise = estCss && (/\.css\b|feuille\s+de\s+style|r[èe]gles?\s+css/i.test(tout)) && !/<\s*[a-z]|\b(?:ins[ée]rer|ajouter)\s+(?:un|une|des)\s+(?:formulaire|tableau|image|lien|liste|section|div)/i.test(t.replace(/bordure|ombre|marge|couleur/gi, ""));
  const estHtml = !cssVise && /\bhtml\b|balise|\b(?:cr[ée]er|ajouter|ins[ée]rer|placer|int[ée]grer|r[ée]aliser|compl[ée]ter|d[ée]finir|construire)\b/i.test(t) && !estSql && !estPhp;
  // fichiers à créer
  // fichiers à créer : nommés après « créer / enregistrer… » et pas comme lieu (« dans la page x », « à la page x »)
  for (const m of t.matchAll(/(?:cr[ée]er|enregistrer|sauvegarder|nommer?|r[ée]aliser)\b([^.\n]{0,90}?)([\w\-]+\.(?:html?|css|js|php|sql))\b/gi)) {
    if (/\b(?:dans|[àa]|vers|de|depuis)\s+(?:la\s+page|le\s+fichier|la\s+feuille)\s*["«“']?\s*$/i.test(m[1])) continue;
    ajout("fichier", m[2], "", "fichier " + m[2]);
  }
  if (estSql) return { nature: "sql", verifs: [{ verif: "sql", fichier: fichiers.find((x) => /\.sql$/i.test(x)) || "*.sql", motif: "", libelle: "requête" }] };
  // liaisons
  if (/\b(lier|relier|li[ée]e?|associer|attacher|int[ée]grer|appeler|inclure)\b/i.test(t)) {
    for (const f of fichiers.filter((x) => /\.css$/i.test(x))) ajout("contient", fHtml || "*.html", "/<link[^>]+" + echapperRe(f) + "/", "liaison " + f);
    for (const f of fichiers.filter((x) => /\.js$/i.test(x))) ajout("contient", fHtml || "*.html", "/<script[^>]+" + echapperRe(f) + "/", "liaison " + f);
  }
  for (const m of t.matchAll(/(?:lien|liens|pointant|renvoy\w*)\s+(?:vers\s+)?(?:la\s+page\s+)?["«“']?([\w\-]+\.(?:html?|php))/gi)) ajout("contient", fHtml || "*.html", "/<a\\s[^>]*href\\s*=\\s*[\"']?[^\"'>]*" + echapperRe(m[1]) + "/", "lien vers " + m[1]);
  // HTML : balises citées (<nav>) ou décrites (« un tableau », « une liste déroulante »)
  if (estHtml && !estJs) {
    const cible = fHtml || "";
    for (const m of t.matchAll(/<\s*([a-z][a-z0-9]*)\b[^>]*>/gi)) ajout("contient", cible, "<" + m[1].toLowerCase(), "<" + m[1].toLowerCase() + ">");
    for (const m of t.matchAll(/\bbalises?\s+["«“<]*\s*([a-z][a-z0-9]{0,9})\b/gi)) if (!/^(de|du|des|la|le|les|html|qui|pour|et|nomm)/i.test(m[1])) ajout("contient", cible, "<" + m[1].toLowerCase(), "<" + m[1].toLowerCase() + ">");
    for (const [re, motif, lib] of BALISES) if (re.test(t)) ajout("contient", cible, motif, lib);
    const h = /titre\s+(?:de\s+niveau\s+|h)([1-6])/i.exec(t); if (h) ajout("contient", cible, "<h" + h[1], "titre <h" + h[1] + ">");
    for (const m of t.matchAll(/identifiant\s+(?:est\s+|égal\s+à\s+)?["«“']?\s*([A-Za-z][\w\-]*)/gi)) if (!MOTS_VIDES.has(m[1].toLowerCase())) ajout("contient", cible, "id=\"" + m[1] + "\"", "id « " + m[1] + " »");
    for (const m of t.matchAll(/([\w\-]+\.(?:jpe?g|png|gif|webp|svg|mp4|webm|mp3|ogg|wav))\b/gi)) ajout("contient", cible, m[1], m[1]);
    if (/obligatoire|required/i.test(t)) ajout("contient", cible, "required", "champ obligatoire (required)");
    if (/\bbouton\b/i.test(t) && /\bbouton\b/i.test(premiere)) ajout("contient", cible, "/type\\s*=\\s*[\"']?(button|submit|reset)/", "bouton");
  }
  // CSS : propriétés citées ou décrites
  if (estCss && !estSql) {
    const cible = fichiers.find((x) => /\.css$/i.test(x)) || "";
    const vues = new Set();
    for (const p of PROPS) if (new RegExp("(^|[^\\w-])" + p.replace(/-/g, "\\-") + "(?![\\w-])", "i").test(t) && !Array.from(vues).some((x) => x.startsWith(p + "-") || x === p)) { vues.add(p); ajout("contient", cible, "/(^|[^\\w-])" + p.replace(/-/g, "\\-") + "\\s*:/", p); }
    if (!vues.size) for (const [re, motif, lib] of CSS_MOTS) if (re.test(t)) ajout("contient", cible, motif, lib);
    for (const c of new Set(t.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) || [])) ajout("contient", cible, c.toLowerCase(), "couleur " + c);
    if (/:hover|survol/i.test(t)) ajout("contient", cible, ":hover", ":hover");
  }
  // JavaScript : fonctions nommées, méthodes citées, évènement
  if (estJs) {
    for (const m of t.matchAll(/(?:fonction|module|proc[ée]dure)\s+(?:javascript\s+|js\s+)?(?:nomm[ée]e\s+|appel[ée]e\s+|intitul[ée]e\s+)?["«“']?\s*([A-Za-z_$][\w$]*)\s*(\([^)]*\))?/gi)) {
      if (MOTS_VIDES.has(m[1].toLowerCase()) || (!m[2] && !/[A-Z_]|\d/.test(m[1].slice(1)) && m[1].length < 5)) continue;
      ajout("contient", "", "function " + m[1] + "(", "fonction " + m[1] + "()");
    }
    for (const a of API_JS) if (new RegExp("(^|[^\\w.])" + a.replace(".", "\\.") + "\\b").test(t)) ajout("contient", "", a.includes(".") ? a : (/^[A-Z]|^(parseInt|parseFloat|isNaN)$/.test(a) ? a + "(" : "." + a), a);
    if (/au\s+clic|\bclique|\bonclick\b/i.test(t)) ajout("contient", fHtml || "", "onclick", "évènement onclick");
    if (/onchange|au\s+changement/i.test(t)) ajout("contient", fHtml || "", "onchange", "évènement onchange");
    if (/oninput|au\s+cours\s+de\s+la\s+saisie/i.test(t)) ajout("contient", fHtml || "", "oninput", "évènement oninput");
  }
  // PHP / MySQL
  if (estPhp) for (const [re, motif, lib] of PHP) if (re.test(t)) ajout("contient", fPhp, motif, lib);
  const nature = estPhp ? "php" : estJs ? "js" : estCss && !v.some((x) => /^<|^\/</.test(x.motif)) ? "css" : estHtml ? "html" : RX_CODE.test(t) ? "code" : "autre";
  return { nature, verifs: v };
}

/* ================================================================ barème */
// étiquette d'un tableau de barème → { partie, q, sous }
function lireEtiquette(e) {
  const s = String(e).trim().replace(/\s+/g, "");
  let m;
  if ((m = /^(?:ex(?:ercice)?|exo|e|partie|p|activit[ée]|act|a)\.?(?:n°)?(\d+|[IVX]+|[A-H])(?:[.\-_/]?(?:q)?(\d+))?(?:[.\-_/]?([a-h]))?$/i.exec(s))) return { partie: m[1].toUpperCase(), q: m[2], sous: m[3] && m[3].toLowerCase() };
  if ((m = /^(?:q(?:uestion)?)?(\d{1,2})(?:[.\-_/)]?([a-h]))?\)?$/i.exec(s))) return { q: m[1], sous: m[2] && m[2].toLowerCase() };
  if ((m = /^([IVX]+|[A-H])(?:[.\-_/]?(\d{1,2})(?:[.\-_/]?([a-h]))?)?$/.exec(s))) return { partie: m[1].toUpperCase(), q: m[2], sous: m[3] && m[3].toLowerCase() };
  return null;
}
function lireTableauBareme(lignes) {
  const nombre = (x) => { const v = parseFloat(String(x).replace(",", ".")); return isFinite(v) ? v : null; };
  const cellules = (l) => l.split(/\t|\s{2,}|\s*\|\s*/).map((x) => x.trim()).filter(Boolean);
  // a) deux rangées : « Questions | 1 | 2 | 3 » puis « Barème | 2 | 3 | 1,5 » (éventuellement une cellule par ligne)
  const jetons = [];
  for (const l of lignes) cellules(l).forEach((c) => jetons.push(c));
  const iL = jetons.findIndex((x) => /^(questions?|exercices?|parties?|q|n°|num[ée]ros?|activit[ée]s?)$/i.test(x));
  const iP = jetons.findIndex((x, k) => k > iL && /^(bar[èe]me|points?|pts|notes?|nombre\s+de\s+points)$/i.test(x));
  if (iL >= 0 && iP > iL) {
    const etiq = jetons.slice(iL + 1, iP).filter((x) => !/^total$/i.test(x));
    const pts = jetons.slice(iP + 1).map(nombre).filter((x) => x !== null).slice(0, etiq.length);
    if (etiq.length && pts.length === etiq.length) return etiq.map((e, k) => ({ etiquette: e, cle: lireEtiquette(e), points: pts[k] }));
  }
  // b) deux lignes voisines : étiquettes (« Exercice 1   Exercice 2 ») puis nombres (« 8   12 »)
  for (let i = 0; i + 1 < lignes.length; i++) {
    const e = cellules(lignes[i]).filter((x) => !/^total$/i.test(x)), n = cellules(lignes[i + 1]).map(nombre);
    if (e.length >= 2 && e.every((x) => lireEtiquette(x)) && n.length >= e.length && n.slice(0, e.length).every((x) => x !== null)) return e.map((x, k) => ({ etiquette: x, cle: lireEtiquette(x), points: n[k] }));
  }
  // c) une ligne par question : « Q1 : 2 pts », « Exercice 2 ....... 6 points »
  const paires = [];
  for (const l of lignes) {
    const c = cellules(l);
    const m = /^(.{1,20}?)\s*[:=\t.…\-–]*\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:points?|pts?)?\s*$/i.exec(c.length === 2 ? c.join("\t") : l.trim());
    if (m && lireEtiquette(m[1].replace(/[\s:.…\-–]+$/, ""))) paires.push({ etiquette: m[1], cle: lireEtiquette(m[1].replace(/[\s:.…\-–]+$/, "")), points: nombre(m[2]) });
  }
  return paires.length >= 2 ? paires : null;
}
const somme = (l) => Math.round(l.reduce((a, b) => a + (Number(b) || 0), 0) * 100) / 100;
const quart = (x) => Math.round(x * 4) / 4;
function repartir(noeuds, total) {
  // répartition au quart de point selon le travail demandé (nombre de vérifications), le dernier reçoit le reste
  const poids = noeuds.map((n) => Math.max(1, n.poids || 1)), tp = somme(poids);
  let reste = total;
  noeuds.forEach((n, i) => {
    n.pts = i === noeuds.length - 1 ? Math.max(0, Math.round(reste * 100) / 100) : Math.min(reste, Math.max(0.25, quart(total * poids[i] / tp)));
    reste = Math.round((reste - n.pts) * 100) / 100;
    n.estime = true;
  });
}
function poidsDe(n) { if (!n.enfants.length) return n.poids || 1; n.poids = somme(n.enfants.map(poidsDe)); return n.poids; }
function bas(n) { if (!n.enfants.length) return n.pts; const v = n.enfants.map(bas); if (n.pts === null && v.every((x) => x !== null)) n.pts = somme(v); return n.pts; }
function haut(n, remarques) {
  if (!n.enfants.length || n.pts === null) { n.enfants.forEach((e) => haut(e, remarques)); return; }
  const connus = n.enfants.filter((e) => e.pts !== null), inconnus = n.enfants.filter((e) => e.pts === null);
  const s = somme(connus.map((e) => e.pts));
  if (inconnus.length) repartir(inconnus, Math.max(0, Math.round((n.pts - s) * 100) / 100));
  else if (Math.abs(s - n.pts) > 0.01 && n.niveau > 0) remarques.push((n.nom || ("Question " + n.num)) + " : " + n.pts + " pt(s) annoncé(s), " + s + " pt(s) pour ses questions (barème des questions retenu).");
  n.enfants.forEach((e) => haut(e, remarques));
}

/* ================================================================ proposition */
function feuilles(racine) {
  const l = [];
  for (const p of racine.enfants) {
    if (!p.enfants.length) { l.push({ p, q: null, s: null, n: p }); continue; }
    for (const q of p.enfants) {
      if (!q.enfants.length) l.push({ p, q, s: null, n: q });
      else for (const s of q.enfants) l.push({ p, q, s, n: s });
    }
  }
  return l;
}
function libelleCourt(t) {
  const s = String(t || "").split("\n")[0].replace(/\s+/g, " ").trim()
    .replace(/\s+(tout en|permettant de|qui permet|afin d|situ[ée]e? |conform[ée]ment|en lui attribuant|selon le format|comme le montre).*$/i, "");
  return s.length > 90 ? s.slice(0, 88) + "…" : s;
}
function etiquetteQuestion(f, avecParties) {
  const p = avecParties && !f.p.implicite ? f.p.mot + (f.p.num ? " " + (/^\d+$/.test(f.p.num) ? f.p.num : f.p.num.toUpperCase ? f.p.num.toUpperCase() : f.p.num) : "") : "";
  const q = f.q ? "Q" + f.q.num : f.s && f.s.num ? f.s.num + ")" : "";
  const s = f.s && f.q ? " " + f.s.lettre : "";
  return [p, q + s].filter(Boolean).join(" – ") || (f.p.nom || "Partie");
}

/* texte → { criteres, total, source, remarques } */
function analyser(texte, opts) {
  opts = opts || {};
  const { racine, bareme } = structure(texte);
  // pas de partie ni de question repérée : une seule ligne à noter
  racine.enfants = racine.enfants.filter((p) => p.enfants.length || p.pts !== null || (p.texte || "").trim().length > 20 || !p.implicite);
  if (!racine.enfants.length) throw new Error("Aucune question repérée dans l'énoncé (parties « Exercice 1 », questions « 1) », « a) »… attendues). Créez la grille à la main.");
  const lf = feuilles(racine), remarques = [];
  for (const f of lf) {
    const contexte = [f.p.consignes || "", f.q && f.s ? f.q.titre + "\n" + f.q.texte : ""].join("\n");
    const r = verifsQuestion((f.n.titre ? f.n.titre + "\n" : "") + f.n.texte, contexte);
    f.nature = r.nature; f.verifs = r.verifs;
    f.n.poids = Math.max(1, Math.min(4, r.verifs.length));
  }
  // barème : tableau imprimé dans l'énoncé
  let source = "";
  lf.forEach((f) => [f.p, f.q, f.s].forEach((x) => { if (x && x.ptsTexte === undefined) x.ptsTexte = x.pts; }));
  const tab = bareme.length ? lireTableauBareme(bareme) : null;
  if (tab) {
    const avecPartie = racine.enfants.length > 1;
    let ok = 0;
    for (const t of tab) {
      if (!t.cle) continue;
      const parties = t.cle.partie ? racine.enfants.filter((p) => String(p.num).toUpperCase() === t.cle.partie) : (avecPartie && !t.cle.q ? [] : racine.enfants);
      let cibles = [];
      for (const p of parties) {
        if (!t.cle.q && !t.cle.sous) { cibles.push(p); continue; }
        if (!t.cle.q) {
          // « Ex2-a » : question a) de l'exercice 2, ou sa 1re question si elles sont numérotées
          const q = p.enfants.find((x) => String(x.num).toLowerCase() === t.cle.sous) || p.enfants[t.cle.sous.charCodeAt(0) - 97];
          if (q) cibles.push(q);
          continue;
        }
        const q = p.enfants.find((x) => String(x.num) === String(t.cle.q));
        if (!q) continue;
        if (!t.cle.sous) cibles.push(q); else { const s = q.enfants.find((x) => x.lettre === t.cle.sous); if (s) cibles.push(s); }
      }
      // numérotation des questions qui recommence dans chaque partie : étiquette ambiguë
      if (cibles.length === 1 && !cibles[0].tableau) { cibles[0].pts = t.points; cibles[0].tableau = true; ok++; }
    }
    if (ok === tab.length) source = "tableau du barème de l'énoncé (" + tab.map((t) => t.etiquette + " : " + String(t.points).replace(".", ",")).join(" ; ") + ")";
    else {
      // association par position : chaque partie est prise en bloc ou détaillée par question
      lf.forEach((f) => { [f.p, f.q, f.s].forEach((x) => { if (x && x.tableau) { delete x.tableau; x.pts = x.ptsTexte === undefined ? null : x.ptsTexte; } }); });
      const P = racine.enfants;
      let trouve = false;
      for (let masque = (1 << Math.min(P.length, 10)) - 1; masque >= 0 && !trouve; masque--) {
        const groupes = [];
        P.forEach((p, k) => { if (masque & (1 << k) && p.enfants.length) p.enfants.forEach((q) => groupes.push(q)); else groupes.push(p); });
        if (groupes.length === tab.length) { groupes.forEach((g, k) => { g.pts = tab[k].points; }); trouve = true; }
      }
      if (trouve) source = "tableau du barème de l'énoncé, associé dans l'ordre (" + tab.map((t) => String(t.points).replace(".", ",")).join(" / ") + ")";
      else remarques.push("Tableau de barème trouvé mais non associé aux questions : " + tab.map((t) => t.etiquette + "=" + t.points).join(", ") + ".");
    }
  }
  const explicites = lf.filter((f) => [f.n, f.q, f.p].some((x) => x && x.pts !== null)).length;
  poidsDe(racine);
  bas(racine);
  if (racine.pts === null) {
    const connus = racine.enfants.filter((p) => p.pts !== null);
    const s = somme(connus.map((p) => p.pts));
    racine.pts = s >= 20 || (connus.length === racine.enfants.length && s > 0) ? s : 20;
    if (!explicites) remarques.push("Aucun barème trouvé dans l'énoncé : 20 points répartis selon le travail demandé dans chaque question (à vérifier).");
  }
  haut(racine, remarques);
  if (!source) source = explicites ? "points écrits dans l'énoncé" + (lf.some((f) => f.n.estime) ? " (complétés par répartition pour les questions sans points)" : "") : "répartition automatique sur 20 (aucun barème trouvé)";
  // critères
  const avecParties = racine.enfants.filter((p) => !p.implicite).length > 0;
  const criteres = [];
  let k = 0;
  for (const f of lf) {
    const P = Number(f.n.pts) || 0, question = etiquetteQuestion(f, avecParties), titre = libelleCourt(f.n.titre || f.n.texte || f.p.titre || "");
    const base = { question, etape: avecParties && !f.p.implicite ? f.p.nom : "", q: f.q ? f.q.num : (f.s && f.s.num) || "", sous: f.q && f.s ? f.s.lettre : "" };
    const crit = (o) => criteres.push(Object.assign({ id: "p" + (++k) }, base, o, { points: Math.round(o.points * 100) / 100 }));
    if (f.nature === "sql") { crit({ critere: titre || "Requête", points: P, verif: "sql", fichier: f.verifs[0].fichier, param: "", note: "requête attendue à saisir dans Paramètre" }); continue; }
    if (!f.verifs.length) { crit({ critere: titre || "À noter", points: P, verif: "manuel", fichier: "", param: "" }); continue; }
    // regroupement : un critère « fichier » par fichier à créer, un critère « contient » par fichier visé
    const groupes = [];
    for (const v of f.verifs) {
      let g = groupes.find((x) => x.verif === v.verif && v.verif === "contient" && x.fichier === v.fichier);
      if (!g) groupes.push(g = { verif: v.verif, fichier: v.fichier, motifs: [], libelles: [] });
      if (v.motif) g.motifs.push(v.motif); g.libelles.push(v.libelle);
    }
    // trop peu de points pour plusieurs critères : un seul critère « contient »
    let gs = groupes;
    if (P < 0.5 * gs.length) {
      const c = gs.filter((g) => g.verif === "contient");
      gs = c.length ? [{ verif: "contient", fichier: c.length === 1 ? c[0].fichier : "", motifs: [].concat(...c.map((g) => g.motifs)), libelles: [].concat(...gs.map((g) => g.libelles)) }] : [gs[0]];
    }
    gs.forEach((g) => { g.poids = g.verif === "fichier" ? 1 : Math.min(3, g.motifs.length); });
    if (gs.length === 1) gs[0].pts = P; else repartir(gs, P);
    gs.forEach((g) => crit({ critere: (gs.length > 1 || !titre ? (g.verif === "fichier" ? "Fichier " + g.fichier : g.libelles.slice(0, 4).join(", ")) : titre) + (gs.length > 1 && titre ? " — " + libelleCourt(titre).slice(0, 48).replace(/\s+\S*$/, "") + "…" : ""),
      points: g.pts, verif: g.verif, fichier: g.verif === "fichier" ? g.fichier : g.fichier, param: g.verif === "fichier" ? "" : g.motifs.join(" | ") }));
  }
  const total = somme(criteres.map((c) => c.points));
  const auto = criteres.filter((c) => c.verif !== "manuel").length;
  remarques.unshift("Grille proposée à partir de l'énoncé : " + criteres.length + " critère(s), " + String(total).replace(".", ",") + " points, " + auto + " critère(s) vérifié(s) automatiquement. Barème : " + source + ".");
  if (criteres.some((c) => c.verif === "sql")) remarques.push("Questions SQL : collez la requête attendue dans la colonne « Paramètre » (et joignez la base de référence .sql) pour la correction automatique ; sinon notez-les à la main.");
  if (opts.total && Math.abs(opts.total - total) > 0.01) remarques.push("Total de la grille : " + total + " (note ramenée sur 20 à l'export).");
  return { criteres, total, source, remarques };
}

/* grille officielle importée (barème conservé) + proposition : vérifications reprises question par question */
function fusionner(grille, proposition) {
  const cle = (c) => [String(c.etape || "").match(/\d+|\b[IVXA-H]\b/i) ? String(c.etape).match(/\d+|\b[IVXA-H]\b/i)[0].toUpperCase() : "", String(c.q || ""), String(c.sous || "").toLowerCase()].join("|");
  const parCle = {};
  proposition.criteres.forEach((c) => (parCle[cle(c)] = parCle[cle(c)] || []).push(c));
  const vus = {};
  let n = 0;
  for (const c of grille) {
    const k = cle(c), l = parCle[k] || parCle[["", c.q, c.sous].join("|")] || [];
    const i = vus[k] = (vus[k] || 0);
    const p = l.length ? (l[i] || null) : null;
    vus[k]++;
    if (!p || c.verif !== "manuel") continue;
    c.critere = p.critere; c.verif = p.verif; c.fichier = p.fichier; c.param = p.param; n++;
  }
  return n;
}

module.exports = { texteEnonce, texteDocx, structure, verifsQuestion, lireTableauBareme, analyser, fusionner };
