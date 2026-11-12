/* Notation d'une requête SQL comme l'enseignant :
   - résultat identique à la requête attendue → tous les points ;
   - sinon, comparaison clause par clause : −pénalité par TYPE d'erreur (colonnes, tables, jointure,
     condition de sélection, regroupement, tri…), fautes d'orthographe tolérées ;
   - commande principale différente (SELECT au lieu de UPDATE, ALTER au lieu de CREATE…) → 0.
   - requêtes de mise à jour (INSERT, UPDATE, DELETE) : on compare l'état de la base après exécution,
     pas le résultat (vide) de la requête. */
"use strict";
const TOL = require("./tolerance.js");

/* ---------------------------------------------------------------- normalisation */
function masquer(sql) {
  // chaînes remplacées par des « _ » (même longueur) pour repérer les mots-clés sans toucher aux valeurs
  return sql.replace(/'(?:[^'\\]|\\.|'')*'|"(?:[^"\\]|\\.)*"/g, (m) => m.replace(/./g, "_"));
}
function profondeurs(m) {
  // masque aussi le contenu des parenthèses (sous-requêtes, fonctions) : seuls les mots du niveau 0 comptent
  let d = 0, r = "";
  for (const c of m) { if (c === "(") { d++; r += c; } else if (c === ")") { d = Math.max(0, d - 1); r += c; } else r += d ? "_" : c; }
  return r;
}
function propre(sql) {
  return String(sql || "").replace(/--[^\n]*|#[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/`/g, "").replace(/;\s*$/, "").replace(/\s+/g, " ").trim();
}
function commande(sql) {
  const s = propre(sql).toLowerCase();
  const m = /^(select|with|insert|update|delete|create|alter|drop|truncate|rename)\b\s*(table|database|view|index)?/.exec(s);
  if (!m) return "";
  return m[1] === "with" ? "select" : m[1] + (m[2] ? " " + m[2] : "");
}
// coupe au niveau 0 sur un séparateur (virgule, AND)
function couper(txt, re) {
  const m = profondeurs(masquer(txt)), out = []; let dernier = 0, x;
  re.lastIndex = 0;
  while ((x = re.exec(m))) { out.push(txt.slice(dernier, x.index)); dernier = x.index + x[0].length; }
  out.push(txt.slice(dernier));
  return out.map((s) => s.trim()).filter(Boolean);
}
function normItem(s) {
  return String(s).toLowerCase()
    .replace(/"/g, "'")
    .replace(/\b[a-z_]\w*\.(?=[a-z_*])/g, "")          // préfixe de table : Livre.titre → titre
    .replace(/\s+as\s+['\w]+$/i, "")                    // alias de colonne
    .replace(/\s+/g, "")
    .replace(/(\d+)\.0+\b/g, "$1");
}
function normCondition(c) {
  let s = normItem(c).replace(/^\((.*)\)$/, "$1");
  const m = /^(.+?)(<>|!=|>=|<=|=|<|>)(.+)$/.exec(s);
  if (m) {
    const op = m[2] === "!=" ? "<>" : m[2];
    // a = b et b = a sont la même condition
    if (op === "=" || op === "<>") s = [m[1], m[3]].sort().join(op);
    else s = m[1] + op + m[3];
  }
  return s;
}
const estJointure = (c) => /^[a-z_]\w*(=)[a-z_]\w*$/.test(c) && !/^\d/.test(c.split("=")[1]);

/* ---------------------------------------------------------------- clauses d'un SELECT */
const MOTS = ["select", "from", "where", "group by", "having", "order by", "limit"];
function clausesSelect(sql) {
  const s = propre(sql), m = profondeurs(masquer(s)).toLowerCase(), pos = [];
  for (const k of MOTS) {
    const re = new RegExp("\\b" + k.replace(" ", "\\s+") + "\\b", "g"); let x;
    while ((x = re.exec(m))) { pos.push({ k, i: x.index, f: x.index + x[0].length }); break; }
  }
  pos.sort((a, b) => a.i - b.i);
  const c = {};
  pos.forEach((p, j) => { c[p.k] = s.slice(p.f, j + 1 < pos.length ? pos[j + 1].i : s.length).trim(); });
  // jointures écrites avec JOIN … ON : tables dans FROM, conditions ajoutées à WHERE
  const tables = [], conds = [];
  if (c.from) {
    const morceaux = c.from.split(/\b(?:inner\s+|left\s+(?:outer\s+)?|right\s+(?:outer\s+)?|natural\s+|cross\s+)?join\b/i);
    morceaux.forEach((mo) => {
      const on = /\bon\b/i.exec(mo);
      const t = on ? mo.slice(0, on.index) : mo;
      if (on) conds.push(...couper(mo.slice(on.index + 2), /\band\b/gi));
      couper(t, /,/g).forEach((x) => tables.push(x.trim().split(/\s+/)[0].toLowerCase()));
    });
  }
  if (c.where) conds.push(...couper(c.where, /\band\b/gi));
  const sel = c.select || "";
  return {
    distinct: /^distinct\b/i.test(sel),
    colonnes: couper(sel.replace(/^distinct\s+/i, ""), /,/g).map(normItem),
    tables: tables.filter(Boolean),
    jointures: conds.map(normCondition).filter(estJointure),
    conditions: conds.map(normCondition).filter((x) => !estJointure(x)),
    groupe: c["group by"] ? couper(c["group by"], /,/g).map(normItem) : [],
    having: c.having ? couper(c.having, /\band\b/gi).map(normCondition) : [],
    tri: c["order by"] ? couper(c["order by"], /,/g).map((x) => normItem(x).replace(/asc$/, "")) : []
  };
}

/* ---------------------------------------------------------------- comparaison souple d'ensembles */
function egalSouple(a, b) { return a === b || (a.length >= 5 && b.length >= 5 && TOL.proche(a, b)); }
function memesElements(a, b) {
  if (a.length !== b.length) return false;
  const reste = b.slice();
  for (const x of a) { const i = reste.findIndex((y) => egalSouple(x, y)); if (i < 0) return false; reste.splice(i, 1); }
  return true;
}
function memeListe(a, b) { return a.length === b.length && a.every((x, i) => egalSouple(x, b[i])); }

/* types d'erreurs d'un SELECT par rapport au SELECT attendu */
function erreursSelect(att, obt) {
  const A = clausesSelect(att), B = clausesSelect(obt), e = [];
  // éléments demandés par la requête attendue (pour juger une requête « largement fausse »)
  e.attendus = 2 + ["distinct", "jointures", "conditions", "groupe", "having", "tri"].filter((k) => (Array.isArray(A[k]) ? A[k].length : A[k])).length;
  if (!memesElements(A.colonnes, B.colonnes)) e.push("colonnes affichées");
  else if (!memeListe(A.colonnes, B.colonnes) && A.colonnes.length > 1) e.push("ordre des colonnes");
  if (A.distinct !== B.distinct) e.push("DISTINCT");
  if (!memesElements(A.tables, B.tables)) e.push("tables (FROM)");
  if (!memesElements(A.jointures, B.jointures)) e.push("condition de jointure");
  if (!memesElements(A.conditions, B.conditions)) e.push("condition de sélection");
  if (!memesElements(A.groupe, B.groupe)) e.push("GROUP BY");
  if (!memesElements(A.having, B.having)) e.push("HAVING");
  if (!memeListe(A.tri, B.tri)) e.push("ORDER BY");
  return e;
}

/* types d'erreurs d'une requête de mise à jour / de définition */
function elementsModif(sql) {
  const s = propre(sql), cmd = commande(s), bas = s.toLowerCase();
  const o = { cmd };
  if (cmd === "update") {
    const m = /^update\s+(\S+)\s+set\s+([\s\S]*?)(?:\s+where\s+([\s\S]*))?$/i.exec(s);
    if (m) { o.table = m[1].toLowerCase(); o.set = couper(m[2], /,/g).map(normCondition); o.where = m[3] ? couper(m[3], /\band\b/gi).map(normCondition) : []; }
  } else if (cmd === "delete") {
    const m = /^delete\s+from\s+(\S+)(?:\s+where\s+([\s\S]*))?$/i.exec(s);
    if (m) { o.table = m[1].toLowerCase(); o.where = m[2] ? couper(m[2], /\band\b/gi).map(normCondition) : []; }
  } else if (cmd === "insert") {
    const m = /^insert\s+into\s+(\w+)\s*(\([^)]*\))?\s*values\s*([\s\S]*)$/i.exec(s);
    if (m) { o.table = m[1].toLowerCase(); o.colonnes = m[2] ? couper(m[2].slice(1, -1), /,/g).map(normItem) : []; o.valeurs = normItem(m[3]); }
  } else if (/^(create|alter|drop)/.test(cmd)) {
    const m = /^\w+\s+\w+\s+(?:if\s+(?:not\s+)?exists\s+)?(\w+)\s*([\s\S]*)$/i.exec(s);
    if (m) {
      o.table = m[1].toLowerCase();
      const corps = m[2].replace(/^\(([\s\S]*)\)[^)]*$/, "$1");
      const el = couper(corps, /,/g).map((x) => normItem(x).replace(/\b(not)?null/g, (y) => y));
      o.cles = el.filter((x) => /primarykey|foreignkey|references|constraint/.test(x));
      o.colonnes = el.filter((x) => !/primarykey|foreignkey|references|constraint/.test(x)).map((x) => x.replace(/\(\d+(,\d+)?\)/g, ""));
    }
  }
  o.brut = normItem(bas);
  return o;
}
function erreursModif(att, obt) {
  const A = elementsModif(att), B = elementsModif(obt), e = [];
  e.attendus = 1 + (A.set ? 1 : 0) + (A.where && A.where.length ? 1 : 0) + (A.cmd === "insert" ? 2 : 0) + (/^(create|alter)/.test(A.cmd) ? 2 : 0);
  if (A.table !== undefined && !egalSouple(A.table || "", B.table || "")) e.push("table visée");
  if (A.set && !memesElements(A.set, B.set || [])) e.push("SET");
  if (A.where && !memesElements(A.where, B.where || [])) e.push("condition WHERE");
  if (A.cmd === "insert") {
    if (A.colonnes.length && !memeListe(A.colonnes, B.colonnes || [])) e.push("liste des colonnes");
    if (A.valeurs !== B.valeurs) e.push("valeurs insérées");
  }
  if (/^(create|alter)/.test(A.cmd)) {
    if (!memesElements(A.colonnes || [], B.colonnes || [])) e.push(A.cmd.startsWith("alter") ? "modification demandée" : "colonnes / types");
    if (!memesElements(A.cles || [], B.cles || [])) e.push("clés (PRIMARY / FOREIGN KEY)");
  }
  if (!e.length && A.brut !== B.brut) e.push("écriture de la requête");
  return e;
}

/* ---------------------------------------------------------------- état d'une base (tables et lignes) */
function etatBase(db) {
  const t = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const res = {};
  if (!t.length) return res;
  for (const [nom] of t[0].values) {
    const cols = db.exec("PRAGMA table_info(" + nom + ")");
    const lignes = db.exec("SELECT * FROM " + nom);
    res[String(nom).toLowerCase()] = {
      colonnes: cols.length ? cols[0].values.map((c) => String(c[1]).toLowerCase() + ":" + String(c[2]).toLowerCase().replace(/\s*collate\s+nocase/, "")).join(",") : "",
      lignes: lignes.length ? lignes[0].values.map((l) => l.map((v) => v === null ? "∅" : String(v).toLowerCase()).join("␟")).sort().join("\n") : ""
    };
  }
  return res;
}
function memeEtat(a, b) {
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  if (ka.join() !== kb.join()) return false;
  return ka.every((k) => a[k].colonnes === b[k].colonnes && a[k].lignes === b[k].lignes);
}

/* ---------------------------------------------------------------- notation
   o : { M (sqlmoteur), SQL (sql.js), refSql, attendu, candidats [{sql, etiquette}], pts, penalite }
   → { points | null, egal, erreurs[], choisie, raison } */
function noter(o) {
  const cmdA = commande(o.attendu);
  const estSelect = cmdA === "select";
  const essayer = (sql) => {
    const b = o.M.creerBase(o.SQL, o.refSql);
    try {
      const r = o.M.executer(b.db, sql)[0] || { erreur: "requête vide", colonnes: [], lignes: [] };
      return { r, etat: estSelect ? null : etatBase(b.db) };
    } finally { b.db.close(); }
  };
  const ref = essayer(o.attendu);
  const refExecutable = !ref.r.erreur;
  if (!refExecutable && estSelect) return { points: null, raison: "Requête attendue non exécutable sur la base de référence : " + ref.r.erreur + " — à noter à la main" };
  const ordonne = /\border\s+by\b/i.test(o.attendu);
  // 1) une requête de l'élève donne exactement le résultat attendu
  const essais = [];
  for (const c of o.candidats) {
    if (commande(c.sql) !== cmdA && !(cmdA.startsWith("create") && commande(c.sql).startsWith("create"))) { essais.push({ c, cmd: commande(c.sql) }); continue; }
    if (!refExecutable) { essais.push({ c, cmd: commande(c.sql) }); continue; }
    const e = essayer(c.sql);
    let egal = false, raison = "";
    if (e.r.erreur) raison = "Erreur SQL : " + e.r.erreur;
    else if (estSelect) { const cmp = o.M.comparer(ref.r, e.r, ordonne); egal = cmp.egal; raison = cmp.raison; }
    else { egal = memeEtat(ref.etat, e.etat); raison = egal ? "Même effet sur la base" : "Effet différent sur la base"; }
    if (egal) return { points: o.pts, egal: true, erreurs: [], choisie: c, raison };
    essais.push({ c, cmd: commande(c.sql), raison, erreurSql: !!e.r.erreur });
  }
  // 2) sinon : la requête la plus proche (même commande), notée clause par clause
  const memeCmd = essais.filter((x) => x.cmd === cmdA || (cmdA.startsWith("create") && x.cmd.startsWith("create")));
  if (!memeCmd.length) {
    const vue = essais[0];
    return { points: 0, egal: false, erreurs: ["commande principale"], choisie: vue && vue.c, raison: vue ? "Commande « " + (vue.cmd || "?").toUpperCase() + " » au lieu de « " + cmdA.toUpperCase() + " » : requête fausse" : "Aucune requête" };
  }
  let meilleur = null;
  for (const x of memeCmd) {
    const err = estSelect ? erreursSelect(o.attendu, x.c.sql) : erreursModif(o.attendu, x.c.sql);
    if (x.erreurSql && !err.includes("syntaxe")) err.push("syntaxe");
    if (!err.length) err.push(refExecutable ? "résultat différent" : "à vérifier");
    // sans étiquette : à égalité, la requête placée au rang de la question (3e requête pour Q3)
    const rang = o.rang && o.candidats.indexOf(x.c) === o.rang - 1 ? -0.5 : 0;
    if (!meilleur || err.length + rang < meilleur.score) meilleur = { x, err, score: err.length + rang };
  }
  const n = meilleur.err.length, attendus = Math.max(meilleur.err.attendus || 0, n);
  // quelques erreurs : −pénalité par type ; requête largement fausse (3 types ou plus) : points des éléments justes seulement
  const p = n <= 2 ? Math.max(0, o.pts - n * o.penalite) : Math.max(0, Math.floor(o.pts * (attendus - n) / attendus * 4) / 4);
  return { points: p, egal: false, erreurs: meilleur.err, choisie: meilleur.x.c, raison: (meilleur.x.raison ? meilleur.x.raison + " — " : "") + n + " type(s) d'erreur : " + meilleur.err.join(", ") + (n > 2 ? " (requête largement fausse : seuls les éléments justes sont comptés)" : "") };
}

module.exports = { noter, commande, clausesSelect, erreursSelect, erreursModif, etatBase };
