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
  A11: "Propriété oubliée (.value, .checked, .innerHTML)",
  B1: "Conformité : margin-* / padding-* / border-* détaillées",
  B2: "Conformité : sélecteur descendant (div a)",
  C1: "Nom approché cherché par « contient »",
  C2: "SQL : étiquettes -- Qn oubliées",
  C3: "SQL : colonnes dans un autre ordre",
  D3: "Faute de frappe dans un identifiant (id)",
  A12: "Addition devenue concaténation (Number / parseInt oublié)",
  A13: "Mauvaise propriété d'affichage (.value / .innerHTML inversées)",
  A14: "Majuscule ou faute dans un nom de variable",
  A15: "Parenthèses oubliées dans l'appel (onclick=\"verifier\")",
  A16: "Guillemets mal fermés ou mélangés",
  A17: "return false oublié dans onsubmit",
  A18: "Condition inversée",
  A19: "Opérateur de comparaison voisin (< / <=, > / >=)",
  A20: "&& au lieu de || (ou l'inverse)",
  A21: "Méthode voisine du programme (substr / substring…)",
  A22: "Indice décalé de 1 (charAt, <= length, getMonth)",
  A23: "Fonction jamais appelée (bouton sans onclick)",
  A24: "Code placé hors de la fonction",
  A25: "Variable non initialisée (somme, compteur)",
  B3: "Balise non fermée",
  B4: "Valeur CSS équivalente (red / #ff0000, bold / 700)",
  B5: "Chemin d'image ou de fichier mal écrit",
  B6: "Sélecteur équivalent (.titre au lieu de #titre)",
  B7: "Propriété CSS voisine (color / background-color…)",
  B8: "Unité oubliée (width: 200)",
  C4: "SQL : opérateur proche (= / LIKE, guillemets doubles)",
  C5: "SQL : table en trop ou jointure inversée",
  C6: "SQL : COUNT(*) / COUNT(colonne), alias",
  D4: "Message d'alerte reformulé",
  D5: "Résultat comparé souplement (casse, accents, ponctuation)",
  D6: "Contrôles de saisie dans un autre ordre",
  D7: "Résultat affiché ailleurs (alert / zone de la page)",
  D8: "Nombre écrit autrement (12,5 / 12.50)"
};
const actif = (regles, code) => !!regles && Object.prototype.hasOwnProperty.call(regles, code) && regles[code] !== null && regles[code] !== false;
const corr = (code, texte) => ({ code, texte });

function reparerJS(code, declares, regles, ids, champs) {
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
  // A11 : propriété oubliée — lecture du code, pas de l'exécution (−0,25 au lieu de 0)
  //   N = document.getElementById("n"); alert(N)   →  N = document.getElementById("n").value
  //   if (document.getElementById("c")) (case)      →  .checked
  //   document.getElementById("r") = "Bravo"        →  document.getElementById("r").innerHTML = "Bravo"
  //   r = document.getElementById("r"); r = "Bravo" →  r.innerHTML = "Bravo"
  if (actif(regles, "A11") && champs && champs.length) {
    const genre = (id) => { const x = champs.find((c) => c.id.toLowerCase() === id.toLowerCase()); return x ? x.k : null; };
    const prop = (id) => { const k = genre(id); return k === "checked" ? ".checked" : k === "html" ? ".innerHTML" : ".value"; };
    const echap = (x) => x.replace(/[$]/g, "\\$");
    const affect = /(^|[^\w$.])((?:var|let|const)\s+)?([A-Za-z_$][\w$]*)\s*=\s*document\s*\.\s*getElementById\s*\(\s*(["'])([^"']+)\4\s*\)(?!\s*[.\[])/gi;
    const aCorriger = [];
    const masque0 = masquer(code), horsChaine = (i) => masque0[i] === code[i];
    const usagesDe = (v, depuis) => Array.from(masque0.slice(depuis).matchAll(new RegExp("(^|[^\\w$.])" + echap(v) + "(?![\\w$])(\\s*(?:===?|!==?|[.\\[]|=))?", "g")));
    let m;
    // 1. variable qui reçoit l'élément puis n'est jamais utilisée avec un point
    while ((m = affect.exec(code))) {
      const debut = m.index + m[1].length;
      if (!horsChaine(debut)) continue;
      const v = m[3], id = m[5], k = genre(id);
      if (!k) continue;
      const fin = m.index + m[0].length, usages = usagesDe(v, fin);
      if (!usages.length || usages.some((u) => u[2] && /^\s*[.\[]/.test(u[2]))) continue;   // N.value, N.focus()… ailleurs : pas d'oubli
      const ecrit = usages.filter((u) => u[2] && /^\s*=$/.test(u[2])), lu = usages.length - ecrit.length;
      if (k === "html") {
        // zone d'affichage : r = "texte" au lieu de r.innerHTML = "texte"
        if (lu || !ecrit.length) continue;
        for (const u of ecrit) aCorriger.push({ pos: fin + u.index + u[1].length + v.length, ajout: ".innerHTML", txt: v + " = … → " + v + ".innerHTML = …", id });
      } else if (lu) aCorriger.push({ pos: fin, ajout: prop(id), txt: v + " = getElementById(\"" + id + "\") puis " + v + " utilisée comme valeur → " + prop(id) + " ajoutée", id });
    }
    // 2. élément utilisé directement comme une valeur, ou affecté directement
    const direct = /document\s*\.\s*getElementById\s*\(\s*(["'])([^"'\n]+)\1\s*\)(?!\s*[.\[])/gi;
    while ((m = direct.exec(code))) {
      const k = genre(m[2]);
      if (!horsChaine(m.index) || !k) continue;
      const fin = m.index + m[0].length;
      if (aCorriger.some((x) => x.pos === fin)) continue;
      const avant = masque0.slice(0, m.index).replace(/\s+$/, ""), apres = masque0.slice(fin);
      if (/^\s*=(?!=)/.test(apres)) { aCorriger.push({ pos: fin, ajout: k === "html" ? ".innerHTML" : prop(m[2]), txt: "getElementById(\"" + m[2] + "\") = … → " + (k === "html" ? ".innerHTML" : prop(m[2])) + " ajoutée", id: m[2] }); continue; }
      if (k === "html" || /(^|[^=!<>])=$/.test(avant) || /\breturn$/.test(avant)) continue;
      aCorriger.push({ pos: fin, ajout: prop(m[2]), txt: "getElementById(\"" + m[2] + "\") utilisé comme valeur → " + prop(m[2]) + " ajoutée", id: m[2] });
    }
    for (const x of aCorriger.sort((a, b) => b.pos - a.pos)) {
      const l = ligneDe(code, x.pos);
      code = code.slice(0, x.pos) + x.ajout + code.slice(x.pos);
      corrections.push(Object.assign(corr("A11", "L" + l + " : " + x.txt), { cle: "A11|" + x.id.toLowerCase() + x.ajout, type: "A11|" + x.id.toLowerCase() + x.ajout }));
    }
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
  for (let essai = 0; essai < 4; essai++) {
    const err = analyse(code);
    if (!err) break;
    const p = err.pos, candidats = [];
    const ajout = (c, k, dit, nouveau) => { if (actif(regles, k)) candidats.push({ code: nouveau, k, dit }); };
    // A16 : chaîne ouverte avec " et fermée avec ' (ou l'inverse), ou guillemet fermant oublié
    if (/Unterminated string/i.test(err.message)) {
      let q = p; while (q > 0 && code[q] !== '"' && code[q] !== "'") q--;
      const ouvre = code[q], finLigne = code.indexOf("\n", q) < 0 ? code.length : code.indexOf("\n", q);
      const autre = code.slice(q + 1, finLigne).search(ouvre === '"' ? /'/ : /"/);
      if (autre >= 0) ajout("", "A16", "guillemets mélangés corrigés", code.slice(0, q + 1 + autre) + ouvre + code.slice(q + 2 + autre));
      const fp = code.slice(q + 1, finLigne).search(/\)\s*;?\s*$/);
      ajout("", "A16", "guillemet fermant ajouté", fp >= 0 ? code.slice(0, q + 1 + fp) + ouvre + code.slice(q + 1 + fp) : code.slice(0, finLigne) + ouvre + code.slice(finLigne));
    }
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
  code = reparerJSSuite(code, regles, champs, corrections);
  return { code, corrections, valide: !analyse(code) };
}


/* ---------------------------------------------------------------- réparations JS (suite) : A13, A14, A24, A25 */
const MOTS_JS = new Set(("break case catch class const continue default delete do else false finally for function if in instanceof let new null " +
  "return switch this throw true try typeof undefined var void while with of NaN Infinity arguments").split(" "));
const NAVIGATEUR = new Set(["alert", "prompt", "confirm", "parseInt", "parseFloat", "Number", "String", "Boolean", "Array", "Object", "isNaN", "Math",
  "Date", "document", "window", "console", "setTimeout", "setInterval", "clearInterval", "clearTimeout", "event", "location", "navigator", "JSON", "RegExp", "Audio", "Image"]);
function reparerJSSuite(code, regles, champs, corrections) {
  const genre = (id) => { const x = (champs || []).find((c) => c.id.toLowerCase() === String(id).toLowerCase()); return x ? x.k : null; };
  // A13 : getElementById("resultat").value = … sur une zone d'affichage (→ innerHTML), .innerHTML = … sur un champ (→ value)
  if (actif(regles, "A13") && champs && champs.length) {
    const vars = {};
    for (const m of code.matchAll(/\b([A-Za-z_$][\w$]*)\s*=\s*document\s*\.\s*getElementById\s*\(\s*["']([^"']+)["']\s*\)\s*[;\n]/g)) vars[m[1]] = m[2];
    code = code.replace(/(document\s*\.\s*getElementById\s*\(\s*["']([^"']+)["']\s*\)|\b([A-Za-z_$][\w$]*))\s*\.\s*(value|innerHTML)(\s*=(?!=))/g, (tout, cible, id, v, prop, eg, pos) => {
      const k = genre(id || vars[v]);
      if (!k || k === "checked") return tout;
      const bon = k === "html" ? "innerHTML" : "value";
      if (bon === prop) return tout;
      corrections.push(Object.assign(corr("A13", "L" + ligneDe(code, pos) + " : ." + prop + " → ." + bon + " (" + (id || vars[v]) + ")"), { cle: "A13|" + (id || vars[v]).toLowerCase(), type: "A13|" + (id || vars[v]).toLowerCase() }));
      return cible + "." + bon + eg;
    });
  }
  let ast = null;
  try { ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: "script", locations: true }); } catch (e) { return code; }
  // noms déclarés (variables, paramètres, fonctions)
  const declares = new Set();
  for (const m of masquer(code).matchAll(/\b(?:var|let|const)\s+([^;]+)/g)) for (const d of m[1].split(",")) { const n = /^\s*([A-Za-z_$][\w$]*)/.exec(d); if (n) declares.add(n[1]); }
  for (const m of masquer(code).matchAll(/function\s*([A-Za-z_$][\w$]*)?\s*\(([^)]*)\)/g)) { if (m[1]) declares.add(m[1]); m[2].split(",").map((x) => x.trim()).filter(Boolean).forEach((x) => declares.add(x)); }
  for (const m of masquer(code).matchAll(/\bfor\s*\(\s*([A-Za-z_$][\w$]*)\s*=/g)) declares.add(m[1]);
  // A14 : variable utilisée avec une autre casse (ou une faute) que sa déclaration : Nom / nom
  if (actif(regles, "A14") && declares.size) {
    const liste = Array.from(declares), dejaVu = {};
    code = remplacerHorsChaines(code, /(^|[^.\w$])([A-Za-z_$][\w$]*)(?![\w$])/g, (m) => {
      const nom = m[2];
      if (declares.has(nom) || MOTS_JS.has(nom) || NAVIGATEUR.has(nom)) return null;
      if (/^\s*:/.test(code.slice(m.index + m[0].length, m.index + m[0].length + 3)) && /[{,]\s*$/.test(code.slice(0, m.index + m[1].length))) return null;
      const bons = liste.filter((x) => x.toLowerCase() === nom.toLowerCase());
      const bon = bons.length === 1 ? bons[0] : (nom.length >= 5 ? (liste.filter((x) => proche(x, nom)).length === 1 ? liste.find((x) => proche(x, nom)) : null) : null);
      if (!bon) return null;
      if (!dejaVu[nom]) { dejaVu[nom] = 1; corrections.push(Object.assign(corr("A14", "L" + ligneDe(code, m.index) + " : variable « " + nom + " » → « " + bon + " »"), { cle: "A14|" + nom, type: "A14|" + bon.toLowerCase() })); }
      return m[1] + bon;
    });
    try { ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: "script" }); } catch (e) { return code; }
  }
  // A25 : var s; puis s = s + … ou s += … → var s = 0 (ou "" si on y ajoute du texte)
  if (actif(regles, "A25")) {
    const masque = masquer(code);
    for (const m of Array.from(masque.matchAll(/\b(var|let)\s+([A-Za-z_$][\w$]*)\s*(?=;|\n)/g)).reverse()) {
      const v = m[2], apres = code.slice(m.index + m[0].length), e = v.replace(/\$/g, "\\$");
      const cumul = new RegExp("\\b" + e + "\\s*(\\+|-|\\*)=|\\b" + e + "\\s*=\\s*" + e + "\\s*[-+*]").exec(apres);
      if (!cumul) continue;
      // déjà initialisée avant la première accumulation ?
      if (new RegExp("\\b" + e + "\\s*=(?!=)\\s*(?!" + e + "\\b)").test(apres.slice(0, cumul.index))) continue;
      const texte = new RegExp("\\b" + e + "\\s*\\+=\\s*[\"'`]|\\b" + e + "\\s*=\\s*" + e + "\\s*\\+\\s*[\"'`]").test(apres);
      const fin = m.index + m[0].length;
      code = code.slice(0, fin) + (texte ? ' = ""' : " = 0") + code.slice(fin);
      corrections.push(Object.assign(corr("A25", "L" + ligneDe(code, fin) + " : " + v + " initialisée à " + (texte ? '""' : "0")), { cle: "A25|" + v, type: "A25|" + v }));
    }
    try { ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: "script" }); } catch (e) { return code; }
  }
  // A24 : instructions écrites après la } de la fonction alors qu'elles utilisent ses variables locales
  if (actif(regles, "A24") && ast) {
    const corps = ast.body;
    for (let i = corps.length - 1; i > 0; i--) {
      const st = corps[i];
      if (st.type === "FunctionDeclaration") continue;
      let f = null; for (let j = i - 1; j >= 0; j--) { if (corps[j].type === "FunctionDeclaration") { f = corps[j]; break; } if (!/Statement$/.test(corps[j].type)) break; }
      if (!f) continue;
      const locales = new Set(f.params.map((x) => x.name));
      for (const m of masquer(code.slice(f.body.start, f.body.end)).matchAll(/\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)/g)) locales.add(m[1]);
      const globales = new Set(); for (const g of corps) if (g.type === "VariableDeclaration") g.declarations.forEach((d) => d.id && globales.add(d.id.name));
      const utilise = identifiants(masquer(code.slice(st.start, st.end))).filter((x) => locales.has(x) && !globales.has(x));
      if (!utilise.length) continue;
      // on déplace le bloc d'instructions (de f.end à st.end) dans la fonction
      const bloc = code.slice(f.end, st.end), avantAcc = f.body.end - 1;
      code = code.slice(0, avantAcc) + bloc.replace(/^\s*/, "\n  ") + "\n}" + code.slice(st.end);
      corrections.push(Object.assign(corr("A24", "L" + ligneDe(code, f.end) + " : instructions remises dans " + (f.id ? f.id.name + "()" : "la fonction")), { cle: "A24|" + (f.id ? f.id.name : i), type: "A24|" + (f.id ? f.id.name : i) }));
      break;
    }
  }
  return code;
}

/* ---------------------------------------------------------------- variantes de logique (A12, A18 à A22, B7)
   Une seule petite modification à la fois : le correcteur la garde seulement si le résultat devient juste. */
function conditions(code) {
  // positions (début, fin) du contenu des parenthèses de if / while / for
  const masque = masquer(code), l = [];
  for (const m of masque.matchAll(/\b(if|while|for)\s*\(/g)) {
    let i = m.index + m[0].length, n = 1; const d = i;
    while (i < masque.length && n) { if (masque[i] === "(") n++; else if (masque[i] === ")") n--; i++; }
    if (!n) l.push({ mot: m[1], d, f: i - 1 });
  }
  return l;
}
function variantesJS(code) {
  const v = [], masque = masquer(code);
  const rempl = (d, f, t) => code.slice(0, d) + t + code.slice(f);
  // A12 : lecture de .value sans conversion, utilisée dans une addition
  if (/\.value\b/.test(masque) && /\+/.test(masque) && !/\b(Number|parseInt|parseFloat)\s*\(/.test(masque.replace(/\b(Number|parseInt|parseFloat)\s*\(\s*\)/g, ""))) {
    const c2 = code.replace(/(document\s*\.\s*getElementById\s*\(\s*["'][^"']+["']\s*\)\s*\.\s*value)(?!\s*=(?!=))(?!\s*\.\s*length)/g, "Number($1)");
    if (c2 !== code) v.push({ code: c2, regle: "A12", texte: "Number() ajouté à la lecture des champs" });
  } else if (/\.value\b/.test(masque)) {
    const c2 = code.replace(/(document\s*\.\s*getElementById\s*\(\s*["'][^"']+["']\s*\)\s*\.\s*value)(?!\s*=(?!=))(?!\s*\.\s*length)/g, (t, a, pos) => /(Number|parseInt|parseFloat)\s*\(\s*$/.test(code.slice(0, pos)) ? t : "Number(" + a + ")");
    if (c2 !== code && /[-+*\/]\s*$|^\s*[-+*\/]/m.test(masque)) v.push({ code: c2, regle: "A12", texte: "Number() ajouté à la lecture des champs" });
  }
  const conds = conditions(code);
  // A22 : getMonth() sans +1, i <= x.length, charAt(i+1)
  for (const m of masque.matchAll(/\.getMonth\s*\(\s*\)(?!\s*\+\s*1)/g)) { v.push({ code: rempl(m.index, m.index + m[0].length, ".getMonth() + 1"), regle: "A22", texte: "L" + ligneDe(code, m.index) + " : getMonth() + 1" }); break; }
  for (const m of masque.matchAll(/<=(\s*[A-Za-z_$][\w$.]*\.length)\b/g)) v.push({ code: rempl(m.index, m.index + 2, "<"), regle: "A22", texte: "L" + ligneDe(code, m.index) + " : <= length → < length" });
  for (const m of masque.matchAll(/\b(charAt|substring)\s*\(\s*([A-Za-z_$][\w$]*)\s*([+-])\s*1\s*\)/g)) v.push({ code: rempl(m.index, m.index + m[0].length, m[1] + "(" + m[2] + ")"), regle: "A22", texte: "L" + ligneDe(code, m.index) + " : " + m[1] + "(" + m[2] + m[3] + "1) → " + m[1] + "(" + m[2] + ")" });
  for (const m of masque.matchAll(/\bfor\s*\(\s*(?:var|let)?\s*([A-Za-z_$][\w$]*)\s*=\s*1\s*;/g)) { const i = m.index + m[0].lastIndexOf("1"); v.push({ code: rempl(i, i + 1, "0"), regle: "A22", texte: "L" + ligneDe(code, m.index) + " : boucle commencée à 0" }); }
  // A19 : opérateur voisin
  const voisin = { "<": "<=", "<=": "<", ">": ">=", ">=": ">" };
  for (const c of conds) for (const m of masque.slice(c.d, c.f).matchAll(/(<=|>=|<|>)(?!=)/g)) {
    const i = c.d + m.index; v.push({ code: rempl(i, i + m[1].length, voisin[m[1]]), regle: "A19", texte: "L" + ligneDe(code, i) + " : " + m[1] + " → " + voisin[m[1]] });
  }
  // A18 : condition inversée (if seulement)
  for (const c of conds.filter((x) => x.mot === "if")) v.push({ code: rempl(c.d, c.f, "!(" + code.slice(c.d, c.f) + ")"), regle: "A18", texte: "L" + ligneDe(code, c.d) + " : condition inversée" });
  // A20 : && ↔ ||
  for (const c of conds) for (const m of masque.slice(c.d, c.f).matchAll(/&&|\|\|/g)) {
    const i = c.d + m.index, autre = m[0] === "&&" ? "||" : "&&"; v.push({ code: rempl(i, i + 2, autre), regle: "A20", texte: "L" + ligneDe(code, i) + " : " + m[0] + " → " + autre });
  }
  // A21 : méthode voisine
  const meth = { substr: "substring", substring: "substr", indexOf: "lastIndexOf", lastIndexOf: "indexOf", round: "trunc", trunc: "round", floor: "trunc", toUpperCase: "toLowerCase", toLowerCase: "toUpperCase", getDay: "getDate", getDate: "getDay" };
  for (const m of masque.matchAll(/\.(substr|substring|indexOf|lastIndexOf|round|trunc|floor|toUpperCase|toLowerCase|getDay|getDate)\s*\(/g)) {
    const i = m.index + 1; v.push({ code: rempl(i, i + m[1].length, meth[m[1]]), regle: "A21", texte: "L" + ligneDe(code, i) + " : " + m[1] + " → " + meth[m[1]] });
  }
  return v;
}
function variantesCSS(css) {
  const v = [], paires = { "color": "background-color", "background-color": "color", "font-weight": "font-style", "font-style": "font-weight", "margin": "padding", "padding": "margin", "width": "height", "height": "width" };
  for (const m of css.matchAll(/(^|[;{\s])(color|background-color|font-weight|font-style|margin|padding|width|height)\s*:/g)) {
    const i = m.index + m[1].length; v.push({ code: css.slice(0, i) + paires[m[2]] + css.slice(i + m[2].length), regle: "B7", texte: m[2] + " → " + paires[m[2]] });
  }
  return v;
}
/* copies du projet réparé, chacune avec une seule variante ; au plus `max` */
function variantesProjet(src, pageRel, max) {
  const lus = [], html = (() => { try { return fs.readFileSync(path.join(src, pageRel), "utf8"); } catch (e) { return ""; } })();
  const dir = path.posix.dirname(pageRel.split(path.sep).join("/"));
  for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) lus.push({ rel: path.posix.normalize(path.posix.join(dir === "." ? "" : dir, m[1])), type: "js" });
  for (const m of html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+\.css)["']/gi)) lus.push({ rel: path.posix.normalize(path.posix.join(dir === "." ? "" : dir, m[1])), type: "css" });
  const toutes = [];
  for (const f of lus) {
    let t; try { t = fs.readFileSync(path.join(src, f.rel), "utf8"); } catch (e) { continue; }
    for (const x of (f.type === "js" ? variantesJS(t) : variantesCSS(t))) toutes.push(Object.assign({ rel: f.rel }, x));
  }
  // scripts dans la page
  const blocs = Array.from(html.matchAll(/(<script(?![^>]*\bsrc=)[^>]*>)([\s\S]*?)(<\/script>)/gi));
  for (const b of blocs) for (const x of variantesJS(b[2])) toutes.push({ rel: pageRel, code: html.slice(0, b.index + b[1].length) + x.code + html.slice(b.index + b[1].length + b[2].length), regle: x.regle, texte: "script : " + x.texte });
  for (const b of html.matchAll(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi)) for (const x of variantesCSS(b[2])) toutes.push({ rel: pageRel, code: html.slice(0, b.index + b[1].length) + x.code + html.slice(b.index + b[1].length + b[2].length), regle: x.regle, texte: "style : " + x.texte });
  const ordre = ["A12", "A22", "A19", "A18", "A20", "A21", "B7"];
  toutes.sort((a, b) => ordre.indexOf(a.regle) - ordre.indexOf(b.regle));
  return toutes.slice(0, max || 10);
}
function appliquerVariante(src, dest, x) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  fs.writeFileSync(path.join(dest, x.rel), x.code);
  return dest;
}

/* ---------------------------------------------------------------- HTML : balises non fermées (B3), chemins (B5), appels (A15, A17, A23) */
function balisesNonFermees(html) {
  const h = String(html || "").replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  const l = [];
  for (const t of ["html", "head", "body", "header", "nav", "main", "section", "article", "aside", "footer", "div", "p", "ul", "ol", "li", "table", "tr", "td", "th", "form", "fieldset", "select", "option", "textarea", "a", "span", "h1", "h2", "h3", "h4", "h5", "h6", "figure", "figcaption", "label", "button", "title", "legend", "caption", "thead", "tbody", "datalist", "video", "audio", "iframe", "strong", "em"]) {
    const o = (h.match(new RegExp("<" + t + "(?=[\\s>/])", "gi")) || []).length, f = (h.match(new RegExp("</" + t + "\\s*>", "gi")) || []).length;
    if (o > f) l.push(t);
  }
  return l;
}
function trouverFichierProche(racine, dirRel, cible, tous) {
  const nom = cible.split("/").pop().toLowerCase(), base = nom.replace(/\.[^.]+$/, ""), ext = (/\.([^.]+)$/.exec(nom) || [])[1] || "";
  const memeType = (e) => (/^(jpe?g|png|gif|svg|webp|bmp)$/i.test(ext) && /^(jpe?g|png|gif|svg|webp|bmp)$/i.test(e)) || (/^(mp4|webm|ogg|ogv)$/i.test(ext) && /^(mp4|webm|ogg|ogv)$/i.test(e)) || (/^(mp3|wav|ogg)$/i.test(ext) && /^(mp3|wav|ogg)$/i.test(e)) || e.toLowerCase() === ext.toLowerCase();
  const cand = tous.map((p) => path.relative(racine, p).split(path.sep).join("/"));
  const f = cand.find((x) => x.split("/").pop().toLowerCase() === nom)
    || cand.find((x) => { const n = x.split("/").pop(), b = n.replace(/\.[^.]+$/, "").toLowerCase(), e = (/\.([^.]+)$/.exec(n) || [])[1] || ""; return b === base && memeType(e); })
    || cand.find((x) => { const n = x.split("/").pop(), b = n.replace(/\.[^.]+$/, ""), e = (/\.([^.]+)$/.exec(n) || [])[1] || ""; return memeType(e) && base.length >= 4 && proche(b, base); });
  if (!f) return null;
  return path.posix.relative(dirRel === "." ? "" : dirRel, f) || f;
}

/* ---------------------------------------------------------------- réparation du CSS */
function reparerCSS(css, regles, page) {
  const corrections = [];
  // B8 : unité oubliée (width: 200 → 200px)
  if (actif(regles, "B8")) {
    css = css.replace(/(^|[;{\s])((?:min-|max-)?(?:width|height)|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|font-size|top|left|right|bottom|border-width|border-radius|letter-spacing|text-indent|word-spacing|gap)\s*:\s*([^;{}]*?)(?=\s*[;}]|\s*$)/gim, (tout, a, prop, val, pos) => {
      const nv = val.replace(/(^|\s)(-?\d+(?:\.\d+)?)(?=\s|$)/g, (t, sp, n) => Number(n) === 0 ? t : sp + n + "px");
      if (nv === val) return tout;
      corrections.push(Object.assign(corr("B8", prop + ": " + val.trim() + " → " + nv.trim()), { cle: "B8|" + prop, type: "B8" }));
      return a + prop + ": " + nv;
    });
  }
  // B6 : .titre alors que la page a id="titre" (ou #titre alors qu'elle a class="titre")
  if (actif(regles, "B6") && page) {
    css = css.replace(/(^|[},]\s*|\s)([.#])([A-Za-z_][\w-]*)(?=[^{}]*\{)/g, (tout, a, sig, nom) => {
      const aId = page.ids.some((x) => x === nom), aCl = page.classes.some((x) => x === nom);
      if (sig === "." && !aCl && aId) { corrections.push(Object.assign(corr("B6", "." + nom + " → #" + nom), { cle: "B6|" + nom, type: "B6|" + nom })); return a + "#" + nom; }
      if (sig === "#" && !aId && aCl) { corrections.push(Object.assign(corr("B6", "#" + nom + " → ." + nom), { cle: "B6|" + nom, type: "B6|" + nom })); return a + "." + nom; }
      return tout;
    });
  }
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
  // fichiers ANSI (Windows-1252) : lus correctement, réécrits en UTF-8 avec BOM pour que le navigateur garde les accents
  const ansi = new Set();
  const lire = (p) => {
    try {
      const buf = fs.readFileSync(p), t = buf.toString("utf8");
      if (!t.includes("\uFFFD")) return t;
      ansi.add(p);
      try { return new TextDecoder("windows-1252").decode(buf); } catch (e) { return buf.toString("latin1"); }
    } catch (e) { return ""; }
  };
  const ecrire = (p, t) => fs.writeFileSync(p, (ansi.has(p) && t.charCodeAt(0) !== 0xfeff ? "\uFEFF" : "") + t);
  const js = tous.filter((p) => /\.js$/i.test(p)), css = tous.filter((p) => /\.css$/i.test(p)), html = tous.filter((p) => /\.html?$/i.test(p));
  const parFichier = {};
  const rel = (p) => path.relative(dest, p).split(path.sep).join("/");
  const noter = (p, l) => { if (l.length) parFichier[rel(p)] = (parFichier[rel(p)] || []).concat(l); };
  const ids = Array.from(new Set([].concat(...html.map((p) => Array.from(lire(p).matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)).map((m) => m[1])))));
  // éléments de la page : propriété attendue (value pour un champ, checked pour une case, innerHTML pour une zone d'affichage)
  const champs = [];
  for (const p of html) for (const m of lire(p).matchAll(/<([a-z][a-z0-9]*)\b([^>]*?)\bid\s*=\s*["']([^"']+)["']([^>]*)>/gi)) {
    const tag = m[1].toLowerCase(), attrs = m[2] + " " + m[4], type = ((/\btype\s*=\s*["']?([a-z-]+)/i.exec(attrs) || [])[1] || "").toLowerCase();
    if (/^(script|style|link|meta|img|iframe|video|audio|source|form|table|ul|ol|br|hr)$/.test(tag)) continue;
    const k = /^(select|textarea|output)$/.test(tag) ? "value" : tag === "input" ? (/^(checkbox|radio)$/.test(type) ? "checked" : /^(button|submit|reset|image)$/.test(type) ? null : "value") : "html";
    if (k && !champs.some((c) => c.id === m[3])) champs.push({ id: m[3], k });
  }
  const declares = fonctionsDeclarees(js.map(lire).concat(...html.map((p) => scriptsInline(lire(p)))));
  for (const p of js) { const r = reparerJS(lire(p), declares, regles, ids, champs); if (r.corrections.length) { ecrire(p, r.code); noter(p, r.corrections); } }
  const page = { ids, classes: Array.from(new Set([].concat(...html.map((p) => [].concat(...Array.from(lire(p).matchAll(/\bclass\s*=\s*["']([^"']+)["']/gi)).map((m) => m[1].split(/\s+/))))))) };
  for (const p of css) { const r = reparerCSS(lire(p), regles, page); if (r.corrections.length) { ecrire(p, r.code); noter(p, r.corrections); } }
  const fonctions = fonctionsDeclarees(js.map(lire).concat(...html.map((p) => scriptsInline(lire(p)))));
  for (const p of html) {
    let h = lire(p); const c = [];
    h = h.replace(/(<script(?![^>]*\bsrc=)[^>]*>)([\s\S]*?)(<\/script>)/gi, (tout, a, code, b) => {
      const r = reparerJS(code, declares, regles, ids, champs); c.push(...r.corrections.map((x) => corr(x.code, "script : " + x.texte))); return a + r.code + b;
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
    h = h.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (tout, a, st, b) => { const r = reparerCSS(st, regles, page); c.push(...r.corrections.map((x) => Object.assign({}, x, { texte: "style : " + x.texte }))); return a + r.code + b; });
    // A15 : onclick="verifier" → onclick="verifier()"
    if (actif(regles, "A15")) h = h.replace(/(\bon[a-z]+\s*=\s*["']\s*)([A-Za-z_$][\w$]*)(\s*;?\s*["'])/gi, (tout, a, nom, b) => {
      const bon = fonctions.find((f) => f === nom) || fonctions.find((f) => f.toLowerCase() === nom.toLowerCase());
      if (!bon) return tout;
      c.push(Object.assign(corr("A15", "appel « " + nom + " » → « " + bon + "() »"), { cle: "A15|" + nom, type: "A15" }));
      return a + bon + "()" + b;
    });
    // A17 : <form onsubmit="verifier()"> sans return : la page se rechargerait
    if (actif(regles, "A17")) h = h.replace(/(<form\b[^>]*\bonsubmit\s*=\s*["'])(?!\s*return\b)([^"']+?)(\s*;?\s*)(["'])/gi, (tout, a, appel, sep, b) => {
      if (/return\s+false/.test(appel)) return tout;
      c.push(Object.assign(corr("A17", "onsubmit : return ajouté"), { cle: "A17", type: "A17" }));
      return a + "return " + appel.trim() + b;
    });
    // A23 : une seule fonction jamais appelée et un seul bouton sans gestionnaire → le bouton appelle la fonction
    if (actif(regles, "A23")) {
      const appelees = new Set(Array.from(h.matchAll(/\bon[a-z]+\s*=\s*["'][^"']*?([A-Za-z_$][\w$]*)\s*\(/gi)).map((m) => m[1]));
      const tousCodes = js.map(lire).concat(scriptsInline(h)).join("\n");
      const libres = fonctions.filter((f) => !appelees.has(f) && !new RegExp("(^|[^\\w$.])" + f.replace(/\$/g, "\\$") + "\\s*\\(").test(tousCodes.replace(new RegExp("function\\s+" + f.replace(/\$/g, "\\$") + "\\b", "g"), "")) && !new RegExp("addEventListener\\s*\\([^)]*\\b" + f + "\\b").test(tousCodes));
      const boutons = Array.from(h.matchAll(/<(button\b[^>]*|input\b[^>]*\btype\s*=\s*["']?(?:button|submit)["']?[^>]*)>/gi)).filter((m) => !/\bon[a-z]+\s*=/i.test(m[1]));
      if (libres.length === 1 && boutons.length === 1) {
        const b = boutons[0], ins = b.index + 1 + b[1].length - (b[1].endsWith("/") ? 1 : 0);
        h = h.slice(0, ins) + ' onclick="' + libres[0] + '()"' + h.slice(ins);
        c.push(Object.assign(corr("A23", "bouton relié à " + libres[0] + "()"), { cle: "A23", type: "A23" }));
      }
    }
    // B5 : image, feuille de style, script ou lien introuvable → fichier au nom proche
    if (actif(regles, "B5")) {
      const dirRel = path.posix.dirname(rel(p));
      h = h.replace(/(\b(?:src|href)\s*=\s*["'])([^"'#?:]+)(["'])/gi, (tout, a, cible, b) => {
        if (/^(https?:|mailto:|tel:|data:|\/\/)/i.test(cible) || !/\.[a-z0-9]{2,4}$/i.test(cible)) return tout;
        if (fs.existsSync(path.join(path.dirname(p), cible))) return tout;
        const bon = trouverFichierProche(dest, dirRel, cible.replace(/\\/g, "/"), tous);
        if (!bon || bon === cible) return tout;
        c.push(Object.assign(corr("B5", "« " + cible + " » → « " + bon + " »"), { cle: "B5|" + cible.toLowerCase(), type: "B5" }));
        return a + bon + b;
      });
    }
    if (c.length) { ecrire(p, h); noter(p, c); }
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
  for (const [f, c] of Object.entries(rep.parFichier)) if (lies.has(f.toLowerCase())) l.push(...c.map((x) => ({ code: x.code, cle: x.cle, type: x.type, texte: f + " " + x.texte })));
  return l;
}

/* nom mal orthographié d'une méthode ou fonction du programme (getElementByID, Alert…) : faute de forme, pas élément hors annexe */
function estFauteDeFrappe(nom) {
  const n = String(nom || "").replace(/\(\)$/, "");
  if (!n || API.includes(n) || GLOBAUX.includes(n)) return false;
  return API.concat(GLOBAUX).some((a) => a.toLowerCase() === n.toLowerCase() || proche(a, n));
}


/* ---------------------------------------------------------------- logique partiellement juste (lecture du code)
   Quand le résultat est faux, on cherche dans le code les éléments de la démarche attendue par le scénario :
   fonction appelée écrite, champs lus, zone d'affichage écrite, alert et message, condition. */
function sansComm(t) { return String(t || "").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:\\"'])\/\/[^\n]*/g, "$1").replace(/<!--[\s\S]*?-->/g, " "); }
function sansAccents(t) { return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function logiqueStatique(racines, pageRel, scenario) {
  const lireDe = (rel) => { for (const r of racines) { try { return fs.readFileSync(path.join(r, rel), "utf8"); } catch (e) { /* suivant */ } } return ""; };
  const html = lireDe(pageRel);
  if (!html) return { total: 0, presents: 0, manquants: [], trouves: [] };
  const dir = path.posix.dirname(pageRel.split(path.sep).join("/"));
  let code = scriptsInline(html).join("\n");
  for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) if (!/^(https?:)?\/\//i.test(m[1])) code += "\n" + lireDe(path.posix.normalize(path.posix.join(dir === "." ? "" : dir, m[1])));
  code = sansComm(code);
  const gestionnaires = Array.from(html.matchAll(/\bon[a-z]+\s*=\s*["']\s*(?:return\s+)?([A-Za-z_$][\w$]*)\s*\(/gi)).map((m) => m[1]);
  const declarees = Array.from(code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{([\s\S]*?)\}/g)).filter((m) => m[2].replace(/\s+/g, "").length > 0).map((m) => m[1]);
  const lit = (id) => new RegExp("(getElementById|querySelector)\\s*\\(\\s*[\"']#?" + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\"']", "i").test(code)
    || identifiants(code.match(/getElementById\s*\(\s*["'][^"']+["']/gi) ? code.match(/getElementById\s*\(\s*["']([^"']+)["']/gi).map((x) => x.replace(/^[^"']*["']/, "")).join(" ") : "").some((x) => proche(x, id));
  const elements = [], ajout = (label, ok) => { if (!elements.some((e) => e.label === label)) elements.push({ label, ok: !!ok }); };
  const etapes = String(scenario || "").split(/\s*;\s*|\n/).map((x) => x.trim()).filter(Boolean);
  let alertes = 0, conditions = 0;
  for (const x of etapes) {
    let m;
    if ((m = /^(?:saisir|choisir)\s+#([\w-]+)/i.exec(x)) || (m = /^cocher\s+#([\w-]+)/i.exec(x))) ajout("lecture de #" + m[1], lit(m[1]));
    else if (/^cliquer\b/i.test(x)) ajout("fonction appelée écrite", gestionnaires.some((g) => declarees.some((d) => d === g || proche(d, g))) || (!gestionnaires.length && declarees.length));
    else if ((m = /^(?:texte|valeur)\s+#([\w-]+)/i.exec(x))) { ajout("affichage dans #" + m[1], lit(m[1]) && /\.(innerHTML|value|textContent|innerText)\s*=(?!=)/i.test(code)); conditions++; }
    else if ((m = /^alerte\s+contient\s+(.+)$/i.exec(x))) {
      alertes++; ajout("alert()", /\balert\s*\(/i.test(code));
      const mots = sansAccents(m[1]).match(/[a-z0-9]{3,}/g) || [], c2 = sansAccents(code);
      if (mots.length) ajout("message « " + m[1].trim() + " »", mots.filter((w) => c2.includes(w)).length / mots.length >= 0.6);
    } else if (/^aucune\s+alerte/i.test(x)) alertes++;
  }
  if (alertes || conditions > 1) ajout("condition (if)", /\bif\s*\(/.test(code));
  const presents = elements.filter((e) => e.ok).length;
  return { total: elements.length, presents, manquants: elements.filter((e) => !e.ok).map((e) => e.label), trouves: elements.filter((e) => e.ok).map((e) => e.label), code: code.replace(/\s+/g, "").length };
}

/* B4 : formes équivalentes d'un motif CSS (red / #ff0000 / rgb(255,0,0), bold / 700, 0px / 0) */
const COULEURS = { red: "#ff0000", blue: "#0000ff", green: "#008000", black: "#000000", white: "#ffffff", yellow: "#ffff00", gray: "#808080", grey: "#808080", orange: "#ffa500", purple: "#800080", pink: "#ffc0cb", navy: "#000080", silver: "#c0c0c0", maroon: "#800000", lime: "#00ff00", aqua: "#00ffff", cyan: "#00ffff", fuchsia: "#ff00ff", olive: "#808000", teal: "#008080", brown: "#a52a2a", gold: "#ffd700" };
function valeursEquivalentes(motif) {
  const m = String(motif).toLowerCase(), l = new Set();
  const hex = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((x) => x + x).join(""); return "#" + h; };
  const rgb = (h) => { h = hex(h).slice(1); return "rgb(" + [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(",") + ")"; };
  for (const [nom, h] of Object.entries(COULEURS)) {
    if (new RegExp("\\b" + nom + "\\b").test(m)) { l.add(m.replace(new RegExp("\\b" + nom + "\\b"), h)); l.add(m.replace(new RegExp("\\b" + nom + "\\b"), rgb(h))); }
    if (m.includes(h)) { l.add(m.replace(h, nom)); l.add(m.replace(h, rgb(h))); }
  }
  const h3 = /#([0-9a-f]{3})\b(?![0-9a-f])/.exec(m); if (h3) l.add(m.replace(h3[0], hex(h3[0])));
  const h6 = /#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/.exec(m); if (h6) l.add(m.replace(h6[0], "#" + h6[1] + h6[2] + h6[3]));
  const r = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(m); if (r) { const h = "#" + [r[1], r[2], r[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join(""); l.add(m.replace(r[0], h)); const nom = Object.keys(COULEURS).find((k) => COULEURS[k] === h); if (nom) l.add(m.replace(r[0], nom)); }
  const eq = [["bold", "700"], ["normal", "400"], ["0px", "0"]];
  for (const [a, b] of eq) { if (new RegExp("\\b" + a + "\\b").test(m)) l.add(m.replace(new RegExp("\\b" + a + "\\b"), b)); if (new RegExp("(^|[^\\w.])" + b + "(?![\\w.%])").test(m)) l.add(m.replace(new RegExp("(^|[^\\w.])" + b + "(?![\\w.%])"), "$1" + a)); }
  l.delete(m);
  return Array.from(l);
}

/* motif de la grille qui désigne un attribut HTML ou une propriété JS (type="email", required, .value) */
const ATTRS = ["required", "checked", "selected", "disabled", "readonly", "multiple", "autofocus", "placeholder", "min", "max", "step", "pattern", "maxlength", "minlength", "size", "alt", "title", "value", "name", "id", "class", "href", "src", "type", "action", "method", "for", "colspan", "rowspan", "width", "height", "controls", "autoplay", "loop", "muted", "target", "list", "rows", "cols", "onclick", "onchange", "oninput", "onsubmit", "onload", "onmouseover", "onmouseout"];
function estAttribut(m) {
  const t = String(m || "").trim();
  if (/^\/.+\/[a-z]*$/.test(t)) return false;
  return /^\.[A-Za-z_$][\w$]*(\(\))?$/.test(t) || /^[a-z][\w-]*\s*=/i.test(t) || ATTRS.includes(t.toLowerCase());
}

module.exports = { REGLES, logiqueStatique, estAttribut, variantesProjet, appliquerVariante, balisesNonFermees, valeursEquivalentes, estFauteDeFrappe, distance, proche, normaliser, chercherMotif, reparerJS, reparerCSS, reparerProjet, correctionsDePage };
