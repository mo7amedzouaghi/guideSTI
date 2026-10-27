/* Suivi des élèves : meilleur score par élève et par chapitre (comptes en ligne). */
(function () {
  "use strict";
  var zone = document.getElementById("s-zone");
  var PLAN = window.PLAN_STI || {};
  var C = window.CompteSTI;
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  function teinte(v) { return v == null ? "vide" : v >= 80 ? "ok" : v >= 50 ? "moyen" : "ko"; }

  if (!C || !C.enLigne) {
    zone.innerHTML = '<div class="s-info"><h2>Suivi disponible avec les comptes en ligne</h2>' +
      "<p>Le site fonctionne pour l'instant en <b>mode local</b> : chaque compte et chaque score restent dans le navigateur de l'appareil de l'élève. Aucun résultat ne peut donc remonter jusqu'ici.</p>" +
      "<p>Une fois le projet Firebase relié (fichier <code>connexion/config.js</code>), les scores de vos élèves apparaîtront sur cette page, par niveau, classe et chapitre.</p></div>";
    return;
  }

  var D = null, F = { n: lire("sti-suivi-n") || "3", classe: lire("sti-suivi-classe") || "", q: "" };

  function charger() {
    zone.innerHTML = '<p class="s-chargement">Chargement des résultats…</p>';
    C.suivi().then(function (d) { D = d; rendre(); }).catch(function (e) {
      zone.innerHTML = '<div class="s-info ko"><h2>Résultats inaccessibles</h2><p>' + esc(e && e.code === "permission-denied"
        ? "La base refuse l'accès : vérifiez que les règles Firestore (connexion/firestore.rules) sont publiées et que votre compte est bien un compte enseignant."
        : "Vérifiez la connexion Internet puis rechargez la page.") + "</p></div>";
    });
  }

  function lignes() {
    var n = Number(F.n), chaps = PLAN[F.n] || [];
    var parUid = {};
    D.scores.forEach(function (x) { if (x.n === n) (parUid[x.uid] = parUid[x.uid] || {})[x.c] = x; });
    return D.eleves.filter(function (e) {
      if (Number(e.niveau) !== n) return false;
      if (F.classe && (e.classe || "") !== F.classe) return false;
      if (F.q && (e.prenom + " " + e.nom + " " + e.identifiant).toLowerCase().indexOf(F.q.toLowerCase()) < 0) return false;
      return true;
    }).map(function (e) {
      var sc = parUid[e.uid] || {}, faits = 0, somme = 0, maitrises = 0;
      var cases = chaps.map(function (c) {
        var x = sc[c.k], v = x ? x.meilleur : null;
        if (v != null) { faits++; somme += v; if (v >= 80) maitrises++; }
        return { v: v, essais: x ? x.essais : 0 };
      });
      return { e: e, cases: cases, moy: faits ? Math.round(somme / faits) : null, faits: faits, maitrises: maitrises };
    }).sort(function (a, b) { return (a.e.classe || "").localeCompare(b.e.classe || "") || a.e.nom.localeCompare(b.e.nom, "fr") || a.e.prenom.localeCompare(b.e.prenom, "fr"); });
  }

  function rendre() {
    var chaps = PLAN[F.n] || [];
    var classes = Array.from(new Set(D.eleves.filter(function (e) { return String(e.niveau) === F.n; }).map(function (e) { return e.classe || ""; }))).filter(Boolean).sort();
    if (F.classe && classes.indexOf(F.classe) < 0) F.classe = "";
    var L = lignes();

    // bilan par chapitre
    var parChap = chaps.map(function (c, i) {
      var vals = L.map(function (l) { return l.cases[i].v; }).filter(function (v) { return v != null; });
      return { c: c, nb: vals.length, moy: vals.length ? Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length) : null };
    });
    var aReprendre = parChap.filter(function (x) { return x.moy != null && x.nb >= 1; }).sort(function (a, b) { return a.moy - b.moy; }).slice(0, 3);
    var moyClasse = L.filter(function (l) { return l.moy != null; });
    moyClasse = moyClasse.length ? Math.round(moyClasse.reduce(function (a, l) { return a + l.moy; }, 0) / moyClasse.length) : null;
    var actifs = L.filter(function (l) { return l.faits; }).length;

    var h = '<div class="filtres s-filtres">' +
      '<div class="puces" id="s-n">' + ["2", "3", "4"].map(function (n) { return '<button type="button" data-v="' + n + '" aria-pressed="' + (n === F.n) + '">' + n + "ème année</button>"; }).join("") + "</div>" +
      '<label>Classe <select id="s-classe"><option value="">Toutes</option>' + classes.map(function (c) { return '<option' + (c === F.classe ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select></label>" +
      '<input type="search" id="s-q" placeholder="Rechercher un élève" value="' + esc(F.q) + '" aria-label="Rechercher un élève">' +
      '<button type="button" class="btn-sec" id="s-csv">Exporter (Excel)</button><button type="button" class="btn-sec" id="s-maj">Actualiser</button></div>';

    h += '<div class="s-cartes"><div class="s-carte"><b>' + L.length + "</b><span>élève" + (L.length > 1 ? "s" : "") + " inscrit" + (L.length > 1 ? "s" : "") + "</span></div>" +
      '<div class="s-carte"><b>' + actifs + "</b><span>ont fait au moins un entraînement</span></div>" +
      '<div class="s-carte ' + teinte(moyClasse) + '"><b>' + (moyClasse == null ? "–" : moyClasse + " %") + "</b><span>moyenne des élèves actifs</span></div>" +
      '<div class="s-carte large"><span>Chapitres les moins réussis</span>' + (aReprendre.length ? "<ol>" + aReprendre.map(function (x) {
        return "<li>" + esc(x.c.t) + ' <em class="' + teinte(x.moy) + '">' + x.moy + " %</em></li>";
      }).join("") + "</ol>" : "<p>Pas encore de résultats.</p>") + "</div></div>";

    if (!L.length) {
      h += '<div class="s-info"><p>Aucun élève inscrit en ' + F.n + "ème année" + (F.classe ? " dans la classe " + esc(F.classe) : "") +
        ". Donnez à vos élèves l'adresse de la page d'inscription :</p><p class=\"s-lien\"><code>" + esc(new URL("../connexion/inscription.html", location.href).href) + "</code></p></div>";
    } else {
      h += '<div class="tableau-wrap s-wrap"><table class="s-table"><thead><tr><th scope="col">Élève</th><th scope="col">Classe</th>' +
        chaps.map(function (c, i) { return '<th scope="col" class="s-ch" title="' + esc(c.t) + '">C' + c.k + "</th>"; }).join("") +
        '<th scope="col">Moy.</th><th scope="col">Maîtrisés</th><th scope="col"><span class="sr">Actions</span></th></tr></thead><tbody>' +
        L.map(function (l) {
          return '<tr><th scope="row">' + esc(l.e.nom) + " " + esc(l.e.prenom) + '<small>' + esc(l.e.identifiant) + "</small></th><td>" + esc(l.e.classe) + "</td>" +
            l.cases.map(function (x) { return '<td class="s-v ' + teinte(x.v) + '"' + (x.essais ? ' title="' + x.essais + ' essai(s)"' : "") + ">" + (x.v == null ? "·" : x.v) + "</td>"; }).join("") +
            '<td class="s-v ' + teinte(l.moy) + '"><b>' + (l.moy == null ? "–" : l.moy) + "</b></td><td>" + l.maitrises + " / " + chaps.length + "</td>" +
            '<td><button type="button" class="s-retirer" data-uid="' + esc(l.e.uid) + '" data-nom="' + esc(l.e.prenom + " " + l.e.nom) + '">Retirer</button></td></tr>';
        }).join("") + "</tbody></table></div>" +
        '<p class="s-legende"><span class="ok">≥ 80 % maîtrisé</span><span class="moyen">50 à 79 %</span><span class="ko">&lt; 50 %</span><span class="vide">· pas encore fait</span></p>' +
        '<ol class="s-chapitres">' + chaps.map(function (c) { return "<li><b>C" + c.k + "</b> " + esc(c.t) + "</li>"; }).join("") + "</ol>";
    }
    zone.innerHTML = h;

    zone.querySelectorAll("#s-n button").forEach(function (b) { b.addEventListener("click", function () { F.n = b.dataset.v; ecrire("sti-suivi-n", F.n); rendre(); }); });
    document.getElementById("s-classe").addEventListener("change", function () { F.classe = this.value; ecrire("sti-suivi-classe", F.classe); rendre(); });
    var q = document.getElementById("s-q");
    q.addEventListener("input", function () { F.q = q.value; var p = q.selectionStart; rendre(); var nq = document.getElementById("s-q"); nq.focus(); nq.setSelectionRange(p, p); });
    document.getElementById("s-maj").addEventListener("click", charger);
    document.getElementById("s-csv").addEventListener("click", function () { exporter(L, chaps); });
    zone.querySelectorAll(".s-retirer").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!confirm("Retirer " + b.dataset.nom + " de la liste et effacer ses scores ?")) return;
        b.disabled = true;
        C.retirerEleve(b.dataset.uid).then(charger).catch(function () { b.disabled = false; alert("Suppression impossible. Réessayez."); });
      });
    });
  }

  function exporter(L, chaps) {
    var cel = function (v) { v = String(v == null ? "" : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var t = [["Nom", "Prénom", "Identifiant", "Classe"].concat(chaps.map(function (c) { return "C" + c.k + " " + c.t; }), ["Moyenne", "Chapitres maîtrisés"])];
    L.forEach(function (l) { t.push([l.e.nom, l.e.prenom, l.e.identifiant, l.e.classe].concat(l.cases.map(function (x) { return x.v; }), [l.moy, l.maitrises])); });
    var csv = "﻿" + t.map(function (r) { return r.map(cel).join(";"); }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "suivi-" + F.n + "eme" + (F.classe ? "-" + F.classe : "") + ".csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  C.pret.then(charger);
})();
