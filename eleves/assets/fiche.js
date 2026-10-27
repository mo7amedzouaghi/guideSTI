/* Rendu d'une fiche de l'annexe (paramètres, retour, exemple, remarques) et d'une fiche « hors annexe ». */
(function () {
  "use strict";
  var DATA = window.ANNEXE || [];
  var PRISM = { HTML5: "markup", CSS3: "css", JavaScript: "javascript", SQL: "sql", PHP: "php" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function code(src, langue, titre) {
    var cls = PRISM[langue] || "none";
    return '<div class="code"><div class="code-tete"><span><span class="lang">' + esc(langue) + "</span>" + esc(titre || "Exemple conforme") +
      '</span><button class="copier" type="button">Copier</button></div><pre class="language-' + cls + '"><code class="language-' + cls + '">' +
      esc(src) + "</code></pre></div>";
  }

  function html(it, niveau) {
    var h = '<div class="fiche-v2">';
    if (niveau && it.n > niveau) h += '<p class="fiche-alerte">Introduit en ' + it.n + "ème : pas encore au programme de " + niveau + "ème.</p>";
    h += '<p class="fiche-def">' + esc(it.d) + "</p>";
    if (it.syntaxe) h += '<h4>Syntaxe</h4><div class="fiche-syntaxe">' + esc(it.syntaxe) + "</div>";
    if (it.p && it.p.length) {
      var titreP = it.l === "HTML5" ? (it.t === "événement" ? "Valeur" : "Attributs") : "Paramètres";
      h += "<h4>" + titreP + '</h4><div class="tableau-wrap"><table class="t"><thead><tr><th>' + (it.l === "HTML5" ? "Attribut" : "Paramètre") +
        "</th><th>Rôle</th></tr></thead><tbody>" + it.p.map(function (p) { return "<tr><td>" + esc(p.nom) + "</td><td>" + esc(p.rôle) + "</td></tr>"; }).join("") +
        "</tbody></table></div>";
    } else if (it.attributs && it.attributs.length) {
      h += "<h4>Attributs (annexe)</h4><p>" + it.attributs.map(function (x) { return "<code>" + esc(x) + "</code>"; }).join(" ") + "</p>";
    }
    if (it.types) {
      h += '<h4>Types et attributs autorisés</h4><div class="tableau-wrap"><table class="t"><thead><tr><th>type</th><th>Attributs</th></tr></thead><tbody>' +
        it.types.map(function (t) { return "<tr><td>" + esc(t.type) + "</td><td>" + esc(t.attributs_generiques.concat(t.attributs_specifiques).join(", ")) + "</td></tr>"; }).join("") +
        "</tbody></table></div>";
    }
    if (it.v) h += '<h4>Valeurs possibles (annexe)</h4><p class="fiche-valeurs">' + esc(it.v) + "</p>";
    if (it.r) h += '<h4>Valeur de retour</h4><p class="fiche-valeurs">' + esc(it.r) + "</p>";
    if (it.ex) h += "<h4>Exemple</h4>" + code(it.ex, it.l);
    if (it.rq && it.rq.length) h += '<h4>Remarques</h4><ul class="fiche-rq">' + it.rq.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>";
    return h + "</div>";
  }

  function hors(h) {
    return '<article class="carte-hors"><div class="carte-hors-tete"><strong>Hors annexe</strong><span>' + esc(h.l) + "</span></div><p>" + esc(h.x) +
      "</p>" + code(h.a, h.l, "Alternative conforme") + "</article>";
  }

  function brancher(zone) {
    zone.querySelectorAll("code[class*='language-']").forEach(function (c) { if (window.Prism && !c.dataset.ok) { Prism.highlightElement(c); c.dataset.ok = "1"; } });
    zone.querySelectorAll(".copier").forEach(function (b) {
      if (b.dataset.ok) return;
      b.dataset.ok = "1";
      b.addEventListener("click", function () {
        var t = b.closest(".code").querySelector("code").innerText;
        var ok = function () { b.textContent = "Copié ✓"; setTimeout(function () { b.textContent = "Copier"; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, ok); else ok();
      });
    });
  }

  window.FicheSTI = { html: html, hors: hors, brancher: brancher, esc: esc, data: DATA };
})();
