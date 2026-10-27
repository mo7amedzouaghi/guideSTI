/* Bac à sable : HTML, CSS, JS avec rendu en direct, vérification de conformité et téléchargement. */
(function () {
  "use strict";
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var Z = { html: document.getElementById("b-html"), css: document.getElementById("b-css"), js: document.getElementById("b-js") };
  var apercu = document.getElementById("b-apercu"), sortie = document.getElementById("b-resultat");
  var selN = document.getElementById("b-niveau");

  var DEPART = {
    html: '<!DOCTYPE html>\n<html lang="fr">\n<head>\n  <meta charset="UTF-8">\n  <title>Ma page</title>\n</head>\n<body>\n  <h1>Mon club</h1>\n  <p>Modifie ce code et regarde le résultat à droite.</p>\n  <input type="text" id="nom" placeholder="Ton prénom">\n  <input type="button" value="Valider" onclick="saluer()">\n  <p id="msg"></p>\n</body>\n</html>',
    css: "h1 {\n  color: #0D2B6B;\n  text-align: center;\n}\n#msg {\n  color: green;\n  font-weight: bold;\n}",
    js: 'function saluer() {\n  let nom = document.getElementById("nom").value;\n  if (nom.length < 2) {\n    alert("Écris ton prénom");\n    return;\n  }\n  document.getElementById("msg").innerHTML = "Bonjour " + nom + " !";\n}'
  };

  var sauve = null;
  try { sauve = JSON.parse(lire("sti-bac") || "null"); } catch (e) { sauve = null; }
  ["html", "css", "js"].forEach(function (p) { Z[p].value = sauve && typeof sauve[p] === "string" ? sauve[p] : DEPART[p]; });
  var niv = lire("sti-niveau-eleve");
  if (niv) selN.value = niv;

  /* import d'un exemple depuis un chapitre */
  if (/import=1/.test(location.search)) {
    var imp = null;
    try { imp = JSON.parse(lire("sti-bac-import") || "null"); } catch (e) { imp = null; }
    if (imp && Z[imp.p]) {
      if (imp.p === "html") { Z.html.value = imp.code; Z.css.value = ""; Z.js.value = ""; }
      else if (imp.p === "css") {
        Z.css.value = imp.code;
        if (!/<body/i.test(Z.html.value)) Z.html.value = DEPART.html;
      } else { Z.js.value = imp.code; }
      onglet(imp.p);
      try { localStorage.removeItem("sti-bac-import"); } catch (e) { /* ignoré */ }
      history.replaceState(null, "", location.pathname);
    }
  }

  function documentComplet() {
    var h = Z.html.value, css = Z.css.value.trim(), js = Z.js.value.trim();
    var style = css ? "<style>\n" + css + "\n</style>\n" : "", script = js ? "<script>\n" + js + "\n<\/script>\n" : "";
    if (/<\/head>/i.test(h)) h = h.replace(/<\/head>/i, style + "</head>");
    else h = style + h;
    if (/<\/body>/i.test(h)) h = h.replace(/<\/body>/i, script + "</body>");
    else h = h + script;
    return h;
  }

  var minuteur = null;
  function majApercu() {
    clearTimeout(minuteur);
    minuteur = setTimeout(function () {
      apercu.srcdoc = documentComplet();
      ecrire("sti-bac", JSON.stringify({ html: Z.html.value, css: Z.css.value, js: Z.js.value }));
    }, 350);
  }

  function onglet(p) {
    document.querySelectorAll(".bac-onglets button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.p === p ? "true" : "false"); });
    ["html", "css", "js"].forEach(function (x) { Z[x].hidden = x !== p; });
    Z[p].focus();
  }
  document.querySelectorAll(".bac-onglets button").forEach(function (b) { b.addEventListener("click", function () { onglet(b.dataset.p); }); });

  ["html", "css", "js"].forEach(function (p) {
    Z[p].addEventListener("input", majApercu);
    Z[p].addEventListener("keydown", function (e) {
      if (e.key === "Tab") { e.preventDefault(); var s = Z[p].selectionStart; Z[p].value = Z[p].value.slice(0, s) + "  " + Z[p].value.slice(Z[p].selectionEnd); Z[p].selectionStart = Z[p].selectionEnd = s + 2; majApercu(); }
    });
  });

  /* vérification de conformité, onglet par onglet */
  document.getElementById("b-verifier").addEventListener("click", function () {
    var n = Number(selN.value);
    ecrire("sti-niveau-eleve", String(n));
    var noms = { html: "HTML", css: "CSS", js: "JavaScript" }, tous = [];
    ["html", "css", "js"].forEach(function (p) {
      if (!Z[p].value.trim()) return;
      window.Verificateur.analyser(Z[p].value, n, p).problemes.forEach(function (x) { x.onglet = p; x.nomOnglet = noms[p]; tous.push(x); });
    });
    if (!tous.length) {
      sortie.innerHTML = '<div class="bilan ok"><b>✔</b><div><h2>Bravo, ton code respecte le programme de ' + n + 'ème année</h2><p>Aucun élément interdit à ton niveau n\'a été trouvé.</p></div></div>';
    } else {
      var TYPES = { hors: ["Pas au programme", "t-hors"], niveau: ["Pas encore à ton niveau", "t-niveau"], convention: ["À corriger", "t-conv"] };
      sortie.innerHTML = '<div class="bilan ko"><b>' + tous.length + '</b><div><h2>' + tous.length + " point" + (tous.length > 1 ? "s" : "") + ' à revoir</h2><p>Clique sur un point pour aller à la ligne concernée.</p></div></div>' +
        '<ul class="b-problemes">' + tous.map(function (x, i) {
          return '<li><button type="button" class="aller" data-i="' + i + '">' + x.nomOnglet + " · ligne " + x.ligne + '</button> <span class="badge ' + TYPES[x.type][1] + '">' + TYPES[x.type][0] + "</span><p>" + esc(x.message) + "</p>" +
            (x.alternative ? '<details><summary>Voir la correction</summary><pre class="alt">' + esc(x.alternative) + "</pre></details>" : "") + "</li>";
        }).join("") + "</ul>";
      sortie.querySelectorAll(".aller").forEach(function (b) {
        b.addEventListener("click", function () {
          var x = tous[Number(b.dataset.i)], z = Z[x.onglet];
          onglet(x.onglet);
          var lignes = z.value.split("\n"), debut = 0;
          for (var k = 0; k < x.ligne - 1 && k < lignes.length; k++) debut += lignes[k].length + 1;
          z.setSelectionRange(debut, debut + (lignes[x.ligne - 1] || "").length);
          z.scrollTop = Math.max(0, (x.ligne - 4) * 21);
        });
      });
    }
    sortie.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("b-telecharger").addEventListener("click", function () {
    var url = URL.createObjectURL(new Blob([documentComplet()], { type: "text/html;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url; a.download = "ma-page.html";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  });
  document.getElementById("b-vider").addEventListener("click", function () {
    if (!confirm("Remettre le code de départ ? Ton travail actuel sera effacé.")) return;
    ["html", "css", "js"].forEach(function (p) { Z[p].value = DEPART[p]; });
    sortie.innerHTML = "";
    majApercu();
  });

  majApercu();
})();
