/* Moteur SQL hors ligne (SQLite via sql.js) qui se comporte comme MySQL pour les requêtes du programme STI.
   Utilisé dans les TP (console SQL) et par le correcteur de devoirs (processus principal).
   - convertirDump(sql)          : script MySQL / phpMyAdmin → script exécutable par SQLite
   - creerBase(SQL, script)      : base en mémoire + fonctions MySQL (YEAR, MONTH, DAY, NOW, DATEDIFF, ADDDATE, CONCAT…)
   - decouper(texte)             : requêtes d'un fichier .sql avec leur étiquette (-- Q1, -- Question 2…)
   - executer(db, texte)         : exécute toutes les requêtes d'un fichier et renvoie les résultats
   - comparer(a, b, ordonne)     : compare deux résultats (mêmes lignes, ordre pris en compte si ORDER BY) */
(function (racine, fabrique) {
  if (typeof module === "object" && module.exports) module.exports = fabrique();
  else racine.STISQL = fabrique();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function convertirDump(sql) {
    var s = String(sql || "").replace(/\r\n?/g, "\n");
    s = s.replace(/\/\*![\s\S]*?\*\/\s*;?/g, "")                       // directives MySQL /*!40101 … */
      .replace(/^\s*(SET|LOCK TABLES|UNLOCK TABLES|START TRANSACTION|COMMIT|USE|DELIMITER)\b[^;]*;/gim, "")
      .replace(/^\s*CREATE\s+DATABASE\b[^;]*;/gim, "")
      .replace(/^\s*ALTER\s+TABLE\b[^;]*;/gim, "")                       // clés et contraintes ajoutées après coup (phpMyAdmin)
      .replace(/`/g, "")
      .replace(/\)\s*(ENGINE|TYPE)\s*=[^;]*;/gi, ");")
      .replace(/\bAUTO_INCREMENT\b(\s*=\s*\d+)?/gi, "")
      .replace(/\b(UNSIGNED|ZEROFILL)\b/gi, "")
      .replace(/\bCOMMENT\s+'(?:[^'\\]|\\.|'')*'/gi, "")
      .replace(/\b(CHARACTER SET|CHARSET|COLLATE)\s*=?\s*\w+/gi, "")
      .replace(/\bENUM\s*\([^)]*\)/gi, "TEXT")
      .replace(/^\s*(UNIQUE\s+)?(KEY|INDEX)\s+\w+\s*\([^)]*\)\s*,?\s*$/gim, "")
      .replace(/,(\s*\n\s*\))/g, "$1");
    // MySQL compare les textes sans tenir compte de la casse : même comportement ici
    s = s.replace(/\b((?:VAR)?CHAR\s*\(\s*\d+\s*\)|TEXT)(?!\s+COLLATE)/gi, "$1 COLLATE NOCASE");
    return s;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function versDate(v) {
    if (v === null || v === undefined || v === "") return null;
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(v));
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  }
  function texteDate(d) { return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function maintenant() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }

  function fonctionsMySQL(db) {
    var f = function (nom, fn) { try { db.create_function(nom, fn); } catch (e) { /* déjà définie */ } };
    f("YEAR", function (v) { var d = versDate(v); return d ? d.getUTCFullYear() : null; });
    f("MONTH", function (v) { var d = versDate(v); return d ? d.getUTCMonth() + 1 : null; });
    f("DAY", function (v) { var d = versDate(v); return d ? d.getUTCDate() : null; });
    f("NOW", function () { return maintenant(); });
    f("CURDATE", function () { return maintenant().slice(0, 10); });
    f("DATEDIFF", function (a, b) { var x = versDate(a), y = versDate(b); return x && y ? Math.round((x - y) / 864e5) : null; });
    f("ADDDATE", function (a, n) { var x = versDate(a); if (!x) return null; x.setUTCDate(x.getUTCDate() + Number(n || 0)); return texteDate(x); });
    f("CONCAT", function () { var r = ""; for (var i = 0; i < arguments.length; i++) { if (arguments[i] === null) return null; r += String(arguments[i]); } return r; });
  }

  function creerBase(SQL, script) {
    var db = new SQL.Database(), erreurs = [];
    fonctionsMySQL(db);
    decouper(convertirDump(script)).forEach(function (r) {
      try { db.run(r.sql); } catch (e) { erreurs.push(e.message + " — " + r.sql.slice(0, 60)); }
    });
    return { db: db, erreurs: erreurs };
  }

  /* découpe un texte SQL en requêtes, en gardant l'étiquette de la question qui précède chacune */
  function decouper(texte) {
    var t = String(texte || "").replace(/\r\n?/g, "\n"), res = [], cour = "", etiquette = "", commentaire = "", ligneDebut = 1, ligne = 1, i = 0;
    function etiq(c) { var m = /\b(?:Q|question|requ[eê]te|req)\s*[°n.]*\s*(\d+[a-z]?)/i.exec(c); return m ? "Q" + m[1].toUpperCase() : ""; }
    function pousser() {
      var s = cour.trim();
      if (s) res.push({ sql: s, etiquette: etiquette, commentaire: commentaire.trim(), ligne: ligneDebut });
      cour = ""; commentaire = ""; etiquette = "";
    }
    while (i < t.length) {
      var c = t[i], d = t[i + 1];
      if (c === "\n") ligne++;
      if (!cour.trim() && /\S/.test(c) && c !== "-" && c !== "/" && c !== "#") ligneDebut = ligne;
      if ((c === "-" && d === "-") || c === "#") {
        var fin = t.indexOf("\n", i); if (fin < 0) fin = t.length;
        var com = t.slice(i, fin); if (etiq(com)) etiquette = etiq(com); commentaire += com.replace(/^(--|#)\s?/, "") + " ";
        i = fin; continue;
      }
      if (c === "/" && d === "*") {
        var f2 = t.indexOf("*/", i + 2); if (f2 < 0) f2 = t.length;
        var com2 = t.slice(i, f2 + 2); if (etiq(com2)) etiquette = etiq(com2); commentaire += com2.replace(/^\/\*|\*\/$/g, "") + " ";
        ligne += (com2.match(/\n/g) || []).length; i = f2 + 2; continue;
      }
      if (c === "'" || c === '"') {
        var j = i + 1;
        while (j < t.length && !(t[j] === c && t[j - 1] !== "\\") ) { if (t[j] === "\n") ligne++; j++; }
        cour += t.slice(i, j + 1); i = j + 1; continue;
      }
      if (c === ";") { pousser(); i++; continue; }
      cour += c; i++;
    }
    pousser();
    return res;
  }

  function executer(db, texte) {
    return decouper(texte).map(function (r) {
      var o = { etiquette: r.etiquette, sql: r.sql, ligne: r.ligne, commentaire: r.commentaire, colonnes: [], lignes: [], erreur: "" };
      try {
        var x = db.exec(r.sql);
        if (x.length) { o.colonnes = x[x.length - 1].columns; o.lignes = x[x.length - 1].values; }
        else o.modifiees = db.getRowsModified();
      } catch (e) { o.erreur = e.message; }
      return o;
    });
  }

  function norm(v) {
    if (v === null || v === undefined) return "∅";
    if (typeof v === "number") return String(Math.round(v * 100) / 100);
    var s = String(v).trim();
    if (/^-?\d+(\.\d+)?$/.test(s)) return String(Math.round(Number(s) * 100) / 100);
    return s.toLowerCase();
  }
  function comparer(attendu, obtenu, ordonne) {
    if (obtenu.erreur) return { egal: false, raison: "Erreur SQL : " + obtenu.erreur };
    if (attendu.colonnes.length !== obtenu.colonnes.length) return { egal: false, raison: obtenu.colonnes.length + " colonne(s) au lieu de " + attendu.colonnes.length };
    var a = attendu.lignes.map(function (l) { return l.map(norm).join("␟"); }), b = obtenu.lignes.map(function (l) { return l.map(norm).join("␟"); });
    if (a.length !== b.length) return { egal: false, raison: b.length + " ligne(s) au lieu de " + a.length };
    if (!ordonne) { a = a.slice().sort(); b = b.slice().sort(); }
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return { egal: false, raison: ordonne ? "Lignes différentes ou mal triées (ligne " + (i + 1) + ")" : "Lignes différentes" };
    return { egal: true, raison: "Résultat identique (" + a.length + " ligne" + (a.length > 1 ? "s" : "") + ")" };
  }

  function schema(db) {
    var t = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    if (!t.length) return [];
    return t[0].values.map(function (r) {
      var c = db.exec("PRAGMA table_info(" + r[0] + ")"), n = db.exec("SELECT COUNT(*) FROM " + r[0]);
      return { table: r[0], colonnes: c.length ? c[0].values.map(function (x) { return { nom: x[1], type: String(x[2]).replace(/\s*COLLATE NOCASE/i, ""), cle: !!x[5] }; }) : [], lignes: n.length ? n[0].values[0][0] : 0 };
    });
  }

  return { convertirDump: convertirDump, creerBase: creerBase, decouper: decouper, executer: executer, comparer: comparer, schema: schema };
});
