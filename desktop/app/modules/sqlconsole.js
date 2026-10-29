/* Console SQL (TP de bases de données) : exécute les requêtes d'un fichier .sql sur la base du TP
   et affiche chaque résultat sous forme de tableau. Nécessite /vendor/sql-wasm.js et sqlmoteur.js.
   STIConsole.creer(conteneur, scriptBase) → { executer(texte), schema() } (promesse) */
(function () {
  "use strict";
  var M = window.STISQL;
  function esc(s) { return String(s == null ? "NULL" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  var moteur = null;
  function charger() {
    if (!moteur) moteur = window.initSqlJs({ locateFile: function (f) { return "/vendor/" + f; } });
    return moteur;
  }

  function tableau(r) {
    if (r.erreur) return '<div class="sq-err">Erreur : ' + esc(r.erreur) + "</div>";
    if (!r.colonnes.length) return '<div class="sq-info">' + (r.modifiees !== undefined ? r.modifiees + " ligne(s) modifiée(s)." : "Aucun résultat.") + "</div>";
    var max = 200;
    return '<div class="sq-meta">' + r.lignes.length + " ligne" + (r.lignes.length > 1 ? "s" : "") + '</div><div class="sq-tab"><table class="t"><thead><tr>' +
      r.colonnes.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      r.lignes.slice(0, max).map(function (l) { return "<tr>" + l.map(function (v) { return "<td" + (v === null ? ' class="sq-null"' : "") + ">" + esc(v) + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div>" + (r.lignes.length > max ? '<div class="sq-info">… ' + (r.lignes.length - max) + " ligne(s) non affichée(s)</div>" : "");
  }

  async function creer(cont, script, nom) {
    cont.classList.add("sq");
    cont.innerHTML = '<div class="apercu-tete"><span class="points"><i></i><i></i><i></i></span><span class="url">base ' + esc(nom || "du TP") + ' (SQL hors ligne)</span>' +
      '<button type="button" class="btn sec sq-schema" style="padding:4px 10px">Schéma</button><button type="button" class="btn sq-exec" style="padding:4px 12px">▶ Exécuter</button></div>' +
      '<div class="sq-res"><p class="m-aide" style="padding:14px">Chargement de la base…</p></div>';
    var res = cont.querySelector(".sq-res");
    var SQL = await charger();
    var db = null;
    function neuve() { if (db) db.close(); var b = M.creerBase(SQL, script || ""); db = b.db; return b; }
    var init = neuve();
    function afficherSchema() {
      res.innerHTML = '<div class="sq-carte"><b>Schéma de la base</b>' + (init.erreurs.length ? '<div class="sq-err">' + init.erreurs.length + " instruction(s) du script ignorée(s)</div>" : "") +
        M.schema(db).map(function (t) {
          return '<div class="sq-table"><b>' + esc(t.table) + "</b> (" + t.colonnes.map(function (c) { return c.cle ? "<u>" + esc(c.nom) + "</u>" : esc(c.nom); }).join(", ") + ') <span class="sq-meta">' + t.lignes + " lignes</span></div>";
        }).join("") + "</div>";
    }
    afficherSchema();
    cont.querySelector(".sq-schema").addEventListener("click", afficherSchema);
    var api = {
      // chaque exécution repart de la base d'origine (un DELETE d'essai n'abîme pas les données)
      executer: function (texte) {
        neuve();
        var l = M.executer(db, texte);
        res.innerHTML = l.length ? l.map(function (r, i) {
          return '<div class="sq-carte"><div class="sq-tete"><b>' + esc(r.etiquette || "Requête " + (i + 1)) + '</b><span class="sq-meta">ligne ' + r.ligne + '</span></div><pre class="sq-sql">' + esc(r.sql) + "</pre>" + tableau(r) + "</div>";
        }).join("") : '<p class="m-aide" style="padding:14px">Aucune requête à exécuter.</p>';
        return l;
      },
      schema: afficherSchema,
      surExecution: function (fn) { cont.querySelector(".sq-exec").addEventListener("click", fn); }
    };
    return api;
  }

  window.STIConsole = { creer: creer, charger: charger };
})();
