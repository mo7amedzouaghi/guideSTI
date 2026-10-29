/* Éditeur de code multi-fichiers (onglets, numéros de lignes) + aperçu de la page.
   STIEditeur.creer(conteneur, fichiers {nom: code}, { lectureSeule, surChangement })
   STIEditeur.documentApercu(fichiers, principal) → HTML autonome (CSS et JS intégrés) */
(function () {
  "use strict";
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function langue(nom) { var m = /\.(\w+)$/.exec(nom); return m ? m[1].toLowerCase() : "txt"; }

  function creer(cont, fichiers, o) {
    o = o || {};
    // seuls les fichiers de code ont un onglet (les images restent dans le projet)
    var noms = Object.keys(fichiers).filter(function (n) { return /\.(html?|css|js|sql|php)$/i.test(n); }), actif = noms[0];
    cont.classList.add("ed");
    cont.innerHTML = '<div class="ed-onglets" role="tablist">' + noms.map(function (n) {
      return '<button type="button" role="tab" data-f="' + esc(n) + '"><span class="ed-lg ed-' + langue(n) + '">' + langue(n).toUpperCase() + "</span>" + esc(n) + "</button>";
    }).join("") + '</div><div class="ed-corps"><pre class="ed-num" aria-hidden="true"></pre><textarea class="code" spellcheck="false" autocomplete="off"' + (o.lectureSeule ? " readonly" : "") + "></textarea></div>";
    var ta = cont.querySelector("textarea"), num = cont.querySelector(".ed-num");
    function lignes() { var n = ta.value.split("\n").length, t = ""; for (var i = 1; i <= n; i++) t += i + "\n"; num.textContent = t; num.scrollTop = ta.scrollTop; }
    function montrer(n) {
      actif = n; ta.value = fichiers[n]; ta.scrollTop = 0; lignes();
      cont.querySelectorAll(".ed-onglets button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.f === n ? "true" : "false"); });
    }
    cont.querySelector(".ed-onglets").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) montrer(b.dataset.f); });
    ta.addEventListener("scroll", function () { num.scrollTop = ta.scrollTop; });
    ta.addEventListener("input", function () { fichiers[actif] = ta.value; lignes(); if (o.surChangement) o.surChangement(actif, fichiers); });
    ta.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || o.lectureSeule) return;
      e.preventDefault();
      var d = ta.selectionStart, f = ta.selectionEnd;
      ta.value = ta.value.slice(0, d) + "    " + ta.value.slice(f);
      ta.selectionStart = ta.selectionEnd = d + 4;
      ta.dispatchEvent(new Event("input"));
    });
    montrer(actif);
    return {
      fichiers: function () { return fichiers; },
      actif: function () { return actif; },
      montrer: montrer,
      allerLigne: function (n, l) {
        montrer(n);
        var pos = 0, t = ta.value.split("\n");
        for (var i = 0; i < l - 1 && i < t.length; i++) pos += t[i].length + 1;
        ta.focus(); ta.setSelectionRange(pos, pos + (t[l - 1] || "").length);
        ta.scrollTop = Math.max(0, (l - 6) * 20);
      },
      remplacer: function (nv) { fichiers = nv; montrer(fichiers[actif] !== undefined ? actif : Object.keys(nv)[0]); }
    };
  }

  function documentApercu(fichiers, principal) {
    var h = fichiers[principal] || "";
    h = h.replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, function (tout, href) {
      if (!/stylesheet/i.test(tout) || fichiers[href] === undefined) return tout;
      return "<style>\n" + fichiers[href] + "\n</style>";
    });
    h = h.replace(/<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, function (tout, src) {
      if (fichiers[src] === undefined) return tout;
      return "<script>\n" + fichiers[src].replace(/<\/script/gi, "<\\/script") + "\n<\/script>";
    });
    // images du projet (SVG) intégrées à l'aperçu : un chemin faux reste visible comme une image manquante
    h = h.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'])/gi, function (tout, a, src, b) {
      var f = fichiers[src];
      if (f === undefined || !/\.svg$/i.test(src)) return tout;
      return a + "data:image/svg+xml;charset=utf-8," + encodeURIComponent(f) + b;
    });
    // erreurs JavaScript de la page signalées à l'éditeur
    var espion = "<script>window.onerror=function(m){try{parent.postMessage({stiErreur:String(m)},'*')}catch(e){}};<\/script>";
    h = /<head(\s[^>]*)?>/i.test(h) ? h.replace(/<head(\s[^>]*)?>/i, function (x) { return x + espion; }) : espion + h;
    return h;
  }

  window.STIEditeur = { creer: creer, documentApercu: documentApercu };
})();
