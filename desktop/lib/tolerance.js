/* Correction tolérante : les petites erreurs de forme (« ; » ou « ) » oublié, faute de frappe dans un nom de
   fonction ou de méthode, majuscule mal placée, = au lieu de ==…) ne doivent pas coûter toute la note.
   - normaliser / chercherMotif : comparaison de code insensible aux espaces, guillemets et à la casse,
     avec reconnaissance approchée des noms mal orthographiés ;
   - reparerProjet : copie le travail de l'élève, répare ce qui empêche le code de fonctionner et liste
     chaque réparation (le correcteur rejoue alors le test et applique une pénalité par réparation). */
"use strict";
const fs = require("fs");
const path = require("path");
const acorn = require("acorn");

/* ---------------------------------------------------------------- distance d'édition */
function distance(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  // Damerau-Levenshtein : deux lettres inversées (valeu / value) comptent pour une seule faute
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i].concat(new Array(b.length).fill(0)));
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
// tolérance selon la longueur du mot : 1 faute dès 5 lettres, 2 dès 9
function proche(a, b) { const n = Math.min(a.length, b.length); if (n < 5) return a.toLowerCase() === b.toLowerCase(); return distance(a, b) <= (n >= 9 ? 2 : 1); }

/* ---------------------------------------------------------------- comparaison de textes */
function normaliser(t) {
  return String(t || "").toLowerCase()
    .replace(/[‘’'`]/g, "\"")
    .replace(/\s+/g, " ")
    .replace(/\s*([:;,(){}\[\]=<>+*\/!&|])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}
function identifiants(t) { return Array.from(new Set(String(t).match(/[A-Za-z_$][\w$-]*/g) || [])); }

/* Cherche un motif (texte ou /expression/) dans le code : { trouve: 1 | approx: 0..1 | 0, detail } */
function chercherMotif(motif, texte, credit) {
  const m = String(motif).trim();
  const r = /^\/(.+)\/([a-z]*)$/.exec(m);
  if (r) {
    try { const re = new RegExp(r[1], r[2].includes("i") ? r[2] : r[2] + "i"); return re.test(texte) ? { score: 1 } : { score: 0 }; } catch (e) { /* motif littéral */ }
  }
  if (texte.toLowerCase().includes(m.toLowerCase())) return { score: 1 };
  if (normaliser(texte).includes(normaliser(m))) return { score: 1, detail: "« " + m + " » trouvé (espaces ou guillemets différents)" };
  // un seul mot (nom de fonction, de méthode, de propriété) : orthographe approchée
  if (credit > 0 && /^[A-Za-z_$][\w$-]{4,}$/.test(m)) {
    const proches = identifiants(texte).filter((x) => x.toLowerCase() !== m.toLowerCase() && proche(x, m));
    if (proches.length) return { score: credit, detail: "« " + proches[0] + " » au lieu de « " + m + " »" };
  }
  return { score: 0 };
}

/* ---------------------------------------------------------------- réparation du JavaScript */
const API = ["getElementById", "getElementsByName", "getElementsByTagName", "querySelector", "innerHTML", "value", "length", "checked",
  "selectedIndex", "options", "substring", "indexOf", "lastIndexOf", "toUpperCase", "toLowerCase", "trim", "replace", "charAt", "fromCharCode",
  "getFullYear", "getMonth", "getDate", "getDay", "getHours", "getMinutes", "getSeconds", "toString", "style", "focus", "submit", "reset",
  "push", "trunc", "round", "random", "sqrt", "abs", "write", "play", "pause", "src", "disabled", "readOnly"];
const GLOBAUX = ["alert", "prompt", "confirm", "parseInt", "parseFloat", "Number", "String", "isNaN", "Math", "Date", "document", "window"];
const SANS_ARG = ["getFullYear", "getMonth", "getDate", "getDay", "getHours", "getMinutes", "getSeconds", "toUpperCase", "toLowerCase", "trim", "toString", "focus", "play", "pause"];

function ligneDe(code, pos) { return code.slice(0, pos).split("\n").length; }
function analyse(code) {
  try { acorn.parse(code, { ecmaVersion: 2022, sourceType: "script", allowReturnOutsideFunction: false }); return null; }
  catch (e) { return { pos: typeof e.pos === "number" ? e.pos : code.length, message: e.message }; }
}
// masque chaînes et commentaires (même longueur) pour que les remplacements ne touchent que le code
function masquer(code) {
  return code.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, (m) => m.replace(/[^\n]/g, " "));
}
function remplacerHorsChaines(code, re, fn) {
  const masque = masquer(code); let res = "", dernier = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(masque))) {
    const rempl = fn(m, code.slice(m.index, m.index + m[0].length));
    if (rempl !== null) { res += code.slice(dernier, m.index) + rempl; dernier = m.index + m[0].length; }
    if (!re.global) break;
  }
  return res + code.slice(dernier);
}

/* Règles de tolérance : code → libellé. La configuration d'un devoir donne, pour chaque code activé,
   les points retirés (0 = toléré sans pénalité). Un code absent de la configuration n'est pas appliqué. */
const REGLES = {
  A1: "Parenthèse oubliée ou en trop (JS)",
  A2: "Accolade oubliée ou en trop (JS)",
  A4: "Majuscule dans une méthode ou fonction",
  A5: "Faute de frappe dans une méthode ou fonction",
  A6: "Parenthèses () oubliées après une méthode",
  A7: "= au lieu de == dans une condition",
  A8: "Nom de fonction différent entre HTML et JS",
  A9: "Point-virgule oublié (CSS)",
  A10: "Accolade oubliée (CSS)",
  C1: "Nom approché cherché par « contient »",
  C2: "SQL : étiquettes -- Qn oubliées",
  C3: "SQL : colonnes dans un autre ordre",
  D3: "Faute de frappe dans un identifiant (id)"
};
const actif = (regles, code) => !!regles && Object.prototype.hasOwnProperty.call(regles, code) && regles[code] !== null && regles[code] !== false;
const corr = (code, texte) => ({ code, texte });

function reparerJS(code, declares, regles, ids) {
  const corrections = [];
  const noms = new Set((declares || []).concat(identifiants(masquer(code)).filter((x) => new RegExp("\\b(var|let|const|function)\\s+" + x.replace(/\$/g, "\\$") + "\\b").test(code))));
  const nomCorrige = (nom, liste) => {
    const casse = liste.find((a) => a.toLowerCase() === nom.toLowerCase());
    if (casse && actif(regles, "A4")) return { bon: casse, code: "A4" };
    if (!casse && actif(regles, "A5")) { const f = liste.find((a) => proche(a, nom)); if (f) return { bon: f, code: "A5" }; }
    return null;
  };
  // A4 / A5 : méthodes et propriétés du programme (après un point)
  code = remplacerHorsChaines(code, /\.([A-Za-z_$][\w$]*)/g, (m) => {
    const nom = m[1];
    if (API.includes(nom) || noms.has(nom)) return null;
    const r = nomCorrige(nom, API);
    if (!r) return null;
    corrections.push(corr(r.code, "L" + ligneDe(code, m.index) + " : ." + nom + " → ." + r.bon));
    return "." + r.bon;
  });
  // A4 / A5 : fonctions globales (Alert, parseint, documnet…)
  code = remplacerHorsChaines(code, /(^|[^.\w$])([A-Za-z_$][\w$]*)(?=\s*[.(])/g, (m) => {
    const nom = m[2];
    if (GLOBAUX.includes(nom) || noms.has(nom) || /^(if|for|while|switch|return|function|typeof|new|var|let|const|else|do|catch)$/.test(nom)) return null;
    const r = nomCorrige(nom, GLOBAUX);
    if (!r) return null;
    corrections.push(corr(r.code, "L" + ligneDe(code, m.index) + " : " + nom + " → " + r.bon));
    return m[1] + r.bon;
  });
  // D3 : getElementById("resulat") alors que la page a id="resultat"
  if (actif(regles, "D3") && ids && ids.length) {
    code = code.replace(/(getElementById\s*\(\s*["'])([^"']+)(["']\s*\))/g, (tout, a, id, b, pos) => {
      if (ids.includes(id)) return tout;
      const bon = ids.find((x) => x.toLowerCase() === id.toLowerCase()) || ids.find((x) => proche(x, id));
      if (!bon) return tout;
      corrections.push(Object.assign(corr("D3", "L" + ligneDe(code, pos) + " : identifiant « " + id + " » → « " + bon + " »"), { cle: "D3|" + [id, bon].sort().join("|") }));
      return a + bon + b;
    });
  }
  // A6 : d.getFullYear → d.getFullYear()
  if (actif(regles, "A6")) {
    code = remplacerHorsChaines(code, new RegExp("\\.(" + SANS_ARG.join("|") + ")\\b(?!\\s*\\()", "g"), (m) => {
      corrections.push(corr("A6", "L" + ligneDe(code, m.index) + " : () ajoutées après ." + m[1]));
      return "." + m[1] + "()";
    });
  }
  // A7 : = au lieu de == dans une condition
  if (actif(regles, "A7")) {
    code = remplacerHorsChaines(code, /\b(if|while)\s*\(([^()\n]*?[^=!<>+\-*\/%&|])=(?!=)([^()\n]*)\)/g, (m) => {
      corrections.push(corr("A7", "L" + ligneDe(code, m.index) + " : = remplacé par == dans la condition"));
      return m[1] + " (" + m[2] + "==" + m[3] + ")";
    });
  }
  // A1 / A2 : erreurs de syntaxe (parenthèses, accolades) — 3 réparations au plus
  for (let essai = 0; essai < 3; essai++) {
    const err = analyse(code);
    if (!err) break;
    const p = err.pos, candidats = [];
    const ajout = (c, k, dit, nouveau) => { if (actif(regles, k)) candidats.push({ code: nouveau, k, dit }); };
    ajout(")", "A1", "« ) » ajoutée", code.slice(0, p) + ")" + code.slice(p));
    ajout("(", "A1", "« ( » ajoutée", code.slice(0, p) + "(" + code.slice(p));
    ajout("}", "A2", "« } » ajoutée", code.slice(0, p) + "}" + code.slice(p));
    if (code[p] === ")" || code[p] === "(") ajout("", "A1", "« " + code[p] + " » en trop retirée", code.slice(0, p) + code.slice(p + 1));
    if (code[p] === "}" || code[p] === "{") ajout("", "A2", "« " + code[p] + " » en trop retirée", code.slice(0, p) + code.slice(p + 1));
    const avant = code.lastIndexOf("{", p);
    if (avant > 0) ajout(")", "A1", "« ) » ajoutée avant « { »", code.slice(0, avant).replace(/\s*$/, ") ") + code.slice(avant));
    let meilleur = null;
    for (const c of candidats) {
      const e2 = analyse(c.code);
      const progres = e2 ? e2.pos - p : Infinity;
      if (progres > 0 && (!meilleur || progres > meilleur.progres)) meilleur = Object.assign({ progres }, c);
    }
    if (!meilleur) break;
    corrections.push(corr(meilleur.k, "L" + ligneDe(code, p) + " : " + meilleur.dit));
    code = meilleur.code;
  }
  return { code, corrections, valide: !analyse(code) };
}

/* ---------------------------------------------------------------- réparation du CSS */
function reparerCSS(css, regles) {
  const corrections = [];
  if (actif(regles, "A9")) {
    const lignes = css.split("\n");
    for (let i = 0; i < lignes.length - 1; i++) {
      if (/^\s*[a-z-]+\s*:\s*[^;{}]+[^;{}\s,]\s*$/i.test(lignes[i]) && /^\s*[a-z-]+\s*:/i.test(lignes[i + 1])) {
        lignes[i] = lignes[i].replace(/\s*$/, ";");
        corrections.push(corr("A9", "L" + (i + 1) + " : « ; » ajouté"));
      }
    }
    css = lignes.join("\n");
  }
  if (actif(regles, "A10")) {
    // accolade fermante oubliée : ajoutée avant la règle suivante (ou en fin de fichier)
    const lignes = css.split("\n"); let ouvert = false;
    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i];
      if (ouvert && /\{\s*$/.test(l) && !/^\s*@/.test(l)) { lignes[i - 1] = lignes[i - 1] + "\n}"; corrections.push(corr("A10", "L" + i + " : « } » ajoutée")); }
      if (/\{/.test(l)) ouvert = !/\}/.test(l.slice(l.lastIndexOf("{")));
      else if (/\}/.test(l)) ouvert = false;
    }
    css = lignes.join("\n");
    const ouv = (css.match(/{/g) || []).length, fer = (css.match(/}/g) || []).length;
    if (ouv > fer) { css += "\n}".repeat(ouv - fer); corrections.push(corr("A10", "« } » ajoutée en fin de fichier")); }
  }
  return { code: css, corrections };
}

/* ---------------------------------------------------------------- réparation d'un projet */
function fonctionsDeclarees(textes) {
  const s = new Set();
  for (const t of textes) for (const m of t.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) s.add(m[1]);
  return Array.from(s);
}
function scriptsInline(html) { return Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)).map((m) => m[1]); }

/* copie le dossier de l'élève dans dest et y applique les règles activées ; renvoie { parFichier: {rel: [{code, texte}]} } */
function reparerProjet(src, dest, regles) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  const tous = [];
  (function lister(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) lister(p); else tous.push(p); } })(dest);
  const lire = (p) => { try { return fs.readFileSync(p, "utf8"); } catch (e) { return ""; } };
  const js = tous.filter((p) => /\.js$/i.test(p)), css = tous.filter((p) => /\.css$/i.test(p)), html = tous.filter((p) => /\.html?$/i.test(p));
  const parFichier = {};
  const rel = (p) => path.relative(dest, p).split(path.sep).join("/");
  const noter = (p, l) => { if (l.length) parFichier[rel(p)] = (parFichier[rel(p)] || []).concat(l); };
  const ids = Array.from(new Set([].concat(...html.map((p) => Array.from(lire(p).matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)).map((m) => m[1])))));
  const declares = fonctionsDeclarees(js.map(lire).concat(...html.map((p) => scriptsInline(lire(p)))));
  for (const p of js) { const r = reparerJS(lire(p), declares, regles, ids); if (r.corrections.length) { fs.writeFileSync(p, r.code); noter(p, r.corrections); } }
  for (const p of css) { const r = reparerCSS(lire(p), regles); if (r.corrections.length) { fs.writeFileSync(p, r.code); noter(p, r.corrections); } }
  const fonctions = fonctionsDeclarees(js.map(lire).concat(...html.map((p) => scriptsInline(lire(p)))));
  for (const p of html) {
    let h = lire(p); const c = [];
    h = h.replace(/(<script(?![^>]*\bsrc=)[^>]*>)([\s\S]*?)(<\/script>)/gi, (tout, a, code, b) => {
      const r = reparerJS(code, declares, regles, ids); c.push(...r.corrections.map((x) => corr(x.code, "script : " + x.texte))); return a + r.code + b;
    });
    if (actif(regles, "A8")) {
      h = h.replace(/(\bon[a-z]+\s*=\s*["'][^"']*?)\b([A-Za-z_$][\w$]*)(\s*\()/gi, (tout, a, nom, b) => {
        if (fonctions.includes(nom) || /^(return|alert|if|this|document|window|parseInt|Number)$/.test(nom)) return tout;
        const bon = fonctions.find((f) => f.toLowerCase() === nom.toLowerCase()) || fonctions.find((f) => proche(f, nom) || distance(f, nom) <= 2);
        if (!bon) return tout;
        c.push(corr("A8", "appel " + nom + "() → " + bon + "()"));
        return a + bon + b;
      });
    }
    if (c.length) { fs.writeFileSync(p, h); noter(p, c); }
  }
  return { parFichier };
}

/* corrections qui concernent une page : la page elle-même et les fichiers qu'elle charge */
function correctionsDePage(rep, dossier, pageRel) {
  let html = "";
  try { html = fs.readFileSync(path.join(dossier, pageRel), "utf8"); } catch (e) { /* ignoré */ }
  const base = path.posix.dirname(pageRel);
  const lies = new Set([pageRel.toLowerCase()]);
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"'#?]+)["']/gi)) lies.add(path.posix.normalize(path.posix.join(base === "." ? "" : base, m[1])).toLowerCase());
  const l = [];
  for (const [f, c] of Object.entries(rep.parFichier)) if (lies.has(f.toLowerCase())) l.push(...c.map((x) => ({ code: x.code, cle: x.cle, texte: f + " " + x.texte })));
  return l;
}

/* nom mal orthographié d'une méthode ou fonction du programme (getElementByID, Alert…) : faute de forme, pas élément hors annexe */
function estFauteDeFrappe(nom) {
  const n = String(nom || "").replace(/\(\)$/, "");
  if (!n || API.includes(n) || GLOBAUX.includes(n)) return false;
  return API.concat(GLOBAUX).some((a) => a.toLowerCase() === n.toLowerCase() || proche(a, n));
}

module.exports = { REGLES, estFauteDeFrappe, distance, proche, normaliser, chercherMotif, reparerJS, reparerCSS, reparerProjet, correctionsDePage };
