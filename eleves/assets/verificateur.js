/* Vérificateur de conformité à l'annexe STI.
   window.Verificateur.analyser(code, niveau, langue) -> { segments, problemes, elements }
   Chaque problème : { ligne, extrait, type: "hors" | "niveau" | "convention", message, alternative, langage } */
(function () {
  "use strict";
  var DATA = window.ANNEXE || [];
  var HORS = window.HORS_ANNEXE || [];

  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  }
  var LCOURANT = null;   // langage du segment analysé : la fiche de ce langage est préférée
  function hors(cle) {
    var n = norm(cle), autre = null;
    for (var i = 0; i < HORS.length; i++) {
      if (HORS[i].m.map(norm).indexOf(n) !== -1) {
        if (!LCOURANT || HORS[i].l === LCOURANT) return HORS[i];
        if (!autre) autre = HORS[i];
      }
    }
    return autre;
  }

  /* ---------------------------------------------------------------- connaissances tirées de l'annexe */
  var TAGS = {}, EVENTS = {}, CSSP = {}, JSM = {}, PHPF = {}, SQLF = {};
  DATA.forEach(function (it) {
    if (it.l === "HTML5" && it.t === "balise") {
      if (it.e === "<h1> à <h6>") { for (var h = 1; h <= 6; h++) TAGS["h" + h] = it.n; }
      else TAGS[it.e.replace(/[<>]/g, "")] = it.n;
    }
    if (it.l === "HTML5" && it.t === "événement") EVENTS[it.e] = it.n;
    if (it.l === "CSS3" && it.t === "propriété") CSSP[it.e] = it.n;
    if (it.l === "PHP" && it.t === "fonction") PHPF[it.e.replace(/\(\)$/, "")] = it.n;
    if (it.l === "SQL" && it.t === "fonction") SQLF[it.e.replace(/\(\)$/, "")] = it.n;
  });
  // méthodes et fonctions JavaScript de l'annexe (nom -> niveau)
  [["getElementById", 3], ["getElementsByName", 4], ["write", 3], ["substring", 3], ["indexOf", 3], ["lastIndexOf", 3],
   ["replace", 3], ["toLowerCase", 3], ["toUpperCase", 3], ["trim", 3], ["fromCharCode", 3], ["getDate", 3], ["getMonth", 3],
   ["getFullYear", 3], ["toString", 3], ["play", 4], ["pause", 4]].forEach(function (x) { JSM[x[0]] = x[1]; });
  var MATH = { abs: 3, sqrt: 3, round: 3, trunc: 3, random: 3 };
  var JSGLOB = { alert: 3, prompt: 3, isNaN: 3, Number: 3, parseInt: 3, parseFloat: 3, String: 3, Date: 3 };
  var JSKW = { "if": 1, "for": 1, "while": 1, "switch": 1, "function": 1, "return": 1, "catch": 1, "do": 1, "else": 1 };
  PHPF.echo = 4;
  var PHPKW = { "if": 1, "elseif": 1, "else": 1, "for": 1, "while": 1, "do": 1, "function": 1, "return": 1, "array": 1,
    "isset": 1, "echo": 1, "require": 1, "die": 1, "count": 1, "and": 1, "or": 1, "int": 1, "float": 1, "string": 1, "bool": 1 };
  var TYPES_INPUT = { text: 2, number: 2, radio: 2, checkbox: 2, submit: 2, reset: 2,
    email: 3, tel: 3, password: 3, date: 3, time: 3, range: 3, button: 3 };
  var PSEUDO = { link: 4, visited: 4, hover: 3, focus: 4, active: 4 };
  var NOM_TAG = { b: "<b>", strong: "<b>", i: "<b>", em: "<b>", u: "<b>", font: "<b>", center: "<b>",
    button: "<button>", source: "<source>", abbr: "<abbr>" };

  /* ---------------------------------------------------------------- outils de texte */
  function blanchir(s) { return s.replace(/[^\n]/g, " "); }
  // remplace commentaires et chaînes par des espaces (positions conservées)
  function sansChaines(code, lang) {
    var re = lang === "sql" ? /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g
      : lang === "css" ? /\/\*[\s\S]*?\*\/|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g
      : /\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
    if (lang === "js") re = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
    return code.replace(re, function (m) { return m.charAt(0) + blanchir(m.slice(1, -1)) + (m.length > 1 ? m.charAt(m.length - 1) : ""); });
  }

  /* ---------------------------------------------------------------- découpage en segments */
  function detecter(code) {
    var t = code.trim();
    if (/<\?php/i.test(t)) return "html";
    if (/^</.test(t)) return "html";
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(t)) return "sql";
    if (/\b(function|let|const|var|document\.|alert\s*\()/.test(t)) return "js";
    if (/[^{}]+\{[^{}]*:[^{}]*\}/.test(t)) return "css";
    return "js";
  }

  function segmenter(code, langue) {
    var segs = [];
    if (langue && langue !== "auto" && langue !== "html") return [{ lang: langue, debut: 0, texte: code }];
    if (detecter(code) !== "html" && langue !== "html") return [{ lang: detecter(code), debut: 0, texte: code }];
    var reste = code;
    var m, re;
    // PHP
    re = /<\?php([\s\S]*?)(\?>|$)/gi;
    while ((m = re.exec(code))) {
      var d = m.index + 5;
      segs.push({ lang: "php", debut: d, texte: m[1] });
      reste = reste.slice(0, m.index) + blanchir(m[0]) + reste.slice(m.index + m[0].length);
    }
    // <style>
    re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    while ((m = re.exec(reste))) {
      var d2 = m.index + m[0].indexOf(">") + 1;
      segs.push({ lang: "css", debut: d2, texte: m[1] });
      reste = reste.slice(0, d2) + blanchir(m[1]) + reste.slice(d2 + m[1].length);
    }
    // <script> interne
    re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
    while ((m = re.exec(reste))) {
      if (m[2].trim()) {
        var d3 = m.index + m[0].indexOf(">") + 1;
        segs.push({ lang: "js", debut: d3, texte: m[2], interne: true });
        reste = reste.slice(0, d3) + blanchir(m[2]) + reste.slice(d3 + m[2].length);
      }
    }
    // attributs style="…" et on…="…"
    re = /\s(style|on[a-z]+)\s*=\s*("([^"]*)"|'([^']*)')/gi;
    while ((m = re.exec(reste))) {
      var val = m[3] !== undefined ? m[3] : m[4];
      var d4 = m.index + m[0].indexOf(m[2]) + 1;
      if (m[1].toLowerCase() === "style") segs.push({ lang: "cssdecl", debut: d4, texte: val });
      else segs.push({ lang: "js", debut: d4, texte: val, attribut: true });
    }
    segs.unshift({ lang: "html", debut: 0, texte: reste });
    return segs;
  }

  /* ---------------------------------------------------------------- analyse */
  function analyser(code, niveau, langue) {
    niveau = Number(niveau) || 4;
    var debutsLignes = [0];
    for (var i = 0; i < code.length; i++) if (code[i] === "\n") debutsLignes.push(i + 1);
    function ligneDe(pos) {
      var lo = 0, hi = debutsLignes.length - 1;
      while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (debutsLignes[mid] <= pos) lo = mid; else hi = mid - 1; }
      return lo + 1;
    }
    var problemes = [], vus = {}, elements = {};
    function ajouter(pos, type, message, alternative, langage, cle) {
      var ligne = ligneDe(pos);
      var k = type + "|" + (cle || message) + "|" + ligne;
      if (vus[k]) return;
      vus[k] = true;
      var fin = code.indexOf("\n", debutsLignes[ligne - 1]);
      var extrait = code.slice(debutsLignes[ligne - 1], fin === -1 ? code.length : fin).trim();
      problemes.push({ ligne: ligne, extrait: extrait.length > 90 ? extrait.slice(0, 87) + "…" : extrait,
        type: type, message: message, alternative: alternative || "", langage: langage });
    }
    function element(nom, l, n) { elements[l + "|" + nom] = { nom: nom, l: l, n: n }; }
    function horsMsg(cle, defaut) { var h = hors(cle); return { m: h ? h.x : defaut, a: h ? h.a : "" }; }
    function niveauMsg(nom, n) { return nom + " est introduit en " + n + "ème : pas encore au programme de " + niveau + "ème."; }

    var segs = segmenter(code, langue);
    var dejaNiveau = {};

    segs.forEach(function (s) {
      var lang = s.lang;
      LCOURANT = { html: "HTML5", css: "CSS3", cssdecl: "CSS3", js: "JavaScript", php: "PHP", sql: "SQL" }[lang];
      /* -------------------- HTML */
      if (lang === "html") {
        var t = s.texte, m, re = /<\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
        while ((m = re.exec(t))) {
          var tag = m[1].toLowerCase(), attrs = m[2], pos = s.debut + m.index;
          if (tag === "!doctype") continue;
          if (TAGS[tag] === undefined) {
            var hm = horsMsg(NOM_TAG[tag] || "<" + tag + ">", "La balise <" + tag + "> n'est pas dans l'annexe.");
            ajouter(pos, "hors", hm.m.indexOf(tag) === -1 && NOM_TAG[tag] ? "<" + tag + "> : " + hm.m : hm.m, hm.a, "HTML", "tag" + tag);
          } else {
            element("<" + tag + ">", "HTML5", TAGS[tag]);
            if (TAGS[tag] > niveau) ajouter(pos, "niveau", niveauMsg("<" + tag + ">", TAGS[tag]), "", "HTML", "tag" + tag);
          }
          var a, ra = /\s([a-zA-Z-]+)(\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;
          while ((a = ra.exec(attrs))) {
            var nomA = a[1].toLowerCase(), val = (a[3] || "").replace(/^["']|["']$/g, "").toLowerCase();
            var posA = pos + m[0].indexOf(a[0]);
            if (nomA.indexOf("on") === 0) {
              if (EVENTS[nomA] === undefined) ajouter(posA, "hors", "L'événement " + nomA + " n'est pas dans l'annexe.", "", "HTML", nomA);
              else {
                element(nomA, "HTML5", EVENTS[nomA]);
                if (EVENTS[nomA] > niveau) ajouter(posA, "niveau", niveauMsg(nomA, EVENTS[nomA]), "", "HTML", nomA);
                if (nomA === "onsubmit" && tag !== "form") ajouter(posA, "convention", "onsubmit s'écrit uniquement sur la balise <form>, avec return. Pour un contrôle sans envoi : input type=\"button\" + onclick.", '<input type="button" value="Valider" onclick="verifier()">', "HTML", "onsubmit-tag");
              }
            }
            if (nomA === "pattern") { var hp = hors("pattern"); ajouter(posA, "hors", hp.x, hp.a, "HTML", "pattern"); }
            if (tag === "ul" && nomA === "type") ajouter(posA, "hors", "L'attribut type de <ul> n'est pas dans l'annexe (obsolète pour le W3C). En 3ème : list-style-type en CSS.", "ul {\n  list-style-type: square;\n}", "HTML", "ultype");
            if (tag === "input" && nomA === "type") {
              if (TYPES_INPUT[val] === undefined) ajouter(posA, "hors", "Le type d'input « " + val + " » n'est pas dans l'annexe.", "", "HTML", "type" + val);
              else if (TYPES_INPUT[val] > niveau) ajouter(posA, "niveau", niveauMsg('input type="' + val + '"', TYPES_INPUT[val]), "", "HTML", "type" + val);
            }
            if (tag === "img" && nomA === "src" && !/\salt\s*=/.test(attrs)) ajouter(pos, "convention", "Attribut alt manquant : la page ne sera pas valide W3C.", '<img src="photo.jpg" alt="Description de l\'image">', "HTML", "alt");
          }
        }
        if (niveau === 2 && /<\s*link[^>]*stylesheet/i.test(t)) ajouter(s.debut + t.search(/<\s*link/i), "niveau", "La feuille de style externe (link) est introduite en 3ème : en 2ème, CSS en ligne ou interne.", "", "HTML", "link2");
      }

      /* -------------------- CSS */
      if (lang === "css" || lang === "cssdecl") {
        var src = sansChaines(s.texte, "css");
        var regles = [];
        if (lang === "cssdecl") regles.push({ sel: null, corps: src, debut: 0 });
        else {
          var profondeur = 0, deb = 0, selDeb = 0, mm;
          var reR = /([^{}]*)\{([^{}]*)\}/g;
          // gère @keyframes { 0% {…} 100% {…} } en aplatissant
          var plat = src.replace(/@keyframes\s+[\w-]+\s*\{/g, function (x) { return blanchir(x); });
          plat = plat.replace(/\}\s*\}/g, function (x) { return "}" + blanchir(x.slice(1)); });
          while ((mm = reR.exec(plat))) regles.push({ sel: mm[1], corps: mm[2], debut: mm.index + mm[1].length + 1, debutSel: mm.index });
          void profondeur; void deb; void selDeb;
          if (/@keyframes/.test(src)) element("@keyframes", "CSS3", CSSP["@keyframes"] || 3);
        }
        regles.forEach(function (r) {
          var base = s.debut + (r.debut || 0);
          // sélecteur
          if (r.sel) {
            var sel = r.sel.trim(), posS = s.debut + r.debutSel + r.sel.indexOf(sel);
            if (/^\d+%$|^(from|to)$/i.test(sel) || sel === "") { /* étape de keyframes */ }
            else {
              if (/::|:(nth-|first-|last-|not\(|before|after|checked|disabled)/.test(sel)) { var hs = hors("::before"); ajouter(posS, "hors", hs.x, hs.a, "CSS", "pseudo"); }
              // sélecteurs combinés (descendant « .menu a », enfant >, frères + ~) : hors annexe
              sel.split(",").forEach(function (partie) {
                var p = partie.replace(/\[[^\]]*\]/g, "[]").trim();
                if (!p || !/\s|[>+~]/.test(p)) return;
                var cible = p.split(/[\s>+~]+/).pop().replace(/\[\]/g, "").replace(/:[a-z-]+(\([^)]*\))?/g, "");
                var balise = (cible.match(/^[a-z][a-z0-9]*/i) || ["a"])[0];
                var nomC = (partie.trim().split(/[\s>+~]+/)[0].replace(/[^\w-]/g, "") || "zone") + "-" + balise;
                ajouter(posS, "hors", "Le sélecteur combiné « " + partie.trim() + " » n'est pas dans l'annexe. Sélecteurs autorisés : element, #id, .classe, element.classe, element[attr], element[attr=valeur], a:link, a:visited, a:hover, a:active, :focus. Donner une classe (ou un id) aux éléments ciblés.",
                  "/* HTML : <" + balise + ' class="' + nomC + '"> */\n.' + nomC + " {\n  color: white;\n}", "CSS", "combine");
              });
              var pc, rp = /:([a-z-]+)/g;
              while ((pc = rp.exec(sel.replace(/::[a-z-]+/g, "")))) {
                var nomP = pc[1];
                if (PSEUDO[nomP] !== undefined) {
                  var nP = nomP === "hover" ? 3 : PSEUDO[nomP];
                  element(":" + nomP, "CSS3", nP);
                  if (nP > niveau) ajouter(posS, "niveau", niveauMsg(":" + nomP, nP), "", "CSS", "pseudo" + nomP);
                }
              }
              if (/\[/.test(sel)) { element("element[attr]", "CSS3", 4); if (niveau < 4) ajouter(posS, "niveau", niveauMsg("Le sélecteur d'attribut [attr]", 4), "", "CSS", "attrsel"); }
              if (/(^|[\s,])[a-z][a-z0-9]*\.[\w-]/i.test(sel)) { element("element.class", "CSS3", 4); if (niveau < 4) ajouter(posS, "niveau", niveauMsg("Le sélecteur élément.classe", 4), "", "CSS", "elclass"); }
              if (niveau === 2 && /[#.]/.test(sel.replace(/\[[^\]]*\]/g, ""))) ajouter(posS, "niveau", "Les sélecteurs #id et .classe sont introduits en 3ème : en 2ème, sélecteur d'élément.", "", "CSS", "sel2");
            }
          }
          // déclarations
          var dcl, rd = /([a-zA-Z-]+)\s*:\s*([^;]*)/g, nbTransform = 0;
          while ((dcl = rd.exec(r.corps))) {
            var prop = dcl[1].toLowerCase(), valeur = dcl[2], posD = base + dcl.index;
            if (prop.indexOf("--") === 0) continue;
            if (CSSP[prop] === undefined) {
              var cle = prop === "clear" ? "clear" : prop === "line-height" ? "line-height" : prop === "text-decoration" ? "text-decoration"
                : prop === "outline" ? "outline" : /^(justify-content|align-items|flex|flex-|grid)/.test(prop) ? "flex"
                : /timing-function/.test(prop) ? "ease" : null;
              var hc = cle ? hors(cle) : null;
              ajouter(posD, prop === "clear" ? "convention" : "hors", hc ? hc.x : "La propriété " + prop + " n'est pas dans l'annexe.", hc ? hc.a : "", "CSS", "p" + prop);
            } else {
              element(prop, "CSS3", CSSP[prop]);
              if (CSSP[prop] > niveau) ajouter(posD, "niveau", niveauMsg("La propriété " + prop, CSSP[prop]), "", "CSS", "p" + prop);
            }
            if (/\d(\.\d+)?(em|rem|vh|vw)\b/.test(valeur)) { var he = hors("em"); ajouter(posD, "hors", he.x, he.a, "CSS", "unite"); }
            if (prop === "display" && /\b(flex|grid|inline-flex)\b/.test(valeur)) { var hf = hors("flex"); ajouter(posD, "hors", hf.x, hf.a, "CSS", "flex"); }
            if (/linear-gradient|radial-gradient/.test(valeur)) { var hg = hors("linear-gradient"); ajouter(posD, "hors", hg.x, hg.a, "CSS", "gradient"); }
            if (/^(transition|animation)/.test(prop) && /\b(ease|ease-in|ease-out|ease-in-out|linear|cubic-bezier|steps)\b/.test(valeur)) { var hz = hors("ease"); ajouter(posD, "hors", hz.x, hz.a, "CSS", "ease"); }
            if (prop === "transform" && /(translate|rotate|scale)[XYZ]\s*\(/.test(valeur)) { var ht = hors("translatex"); ajouter(posD, "hors", ht.x, ht.a, "CSS", "translatex"); }
            if (prop === "background-repeat" && /no-repeat/.test(valeur) || prop === "background" && /no-repeat/.test(valeur)) { var hn = hors("no-repeat"); ajouter(posD, "hors", hn.x, hn.a, "CSS", "norepeat"); }
            if (prop === "transform") nbTransform++;
            if (/^transition/.test(prop) && r.sel && /:hover/.test(r.sel)) ajouter(posD, "convention", "La transition se déclare sur l'élément, pas dans :hover (sinon l'effet ne joue qu'à l'aller).", ".bouton {\n  transition: background-color 1s;\n}\n.bouton:hover {\n  background-color: gold;\n}", "CSS", "transhover");
          }
          if (nbTransform > 1) ajouter(base, "convention", "Plusieurs déclarations transform dans la même règle : seule la dernière s'applique. Écrire toutes les fonctions sur une seule ligne.", "transform: rotate(10deg) scale(1.2);", "CSS", "transform2");
        });
      }

      /* -------------------- JavaScript */
      if (lang === "js") {
        if (niveau === 2 && !dejaNiveau.js) { dejaNiveau.js = true; ajouter(s.debut, "niveau", "JavaScript est introduit en 3ème.", "", "JS", "js2"); }
        if (s.interne && niveau === 4) ajouter(s.debut, "convention", "En 4ème, le JavaScript est obligatoirement dans un fichier externe.", '<script src="js/controle.js"></script>', "JS", "jsinterne");
        var js = sansChaines(s.texte, "js"), mj;
        var fonctions = {};
        var rf = /function\s+([A-Za-z_$][\w$]*)/g;
        while ((mj = rf.exec(js))) fonctions[mj[1]] = true;
        // aussi les fonctions déclarées ailleurs dans le code collé
        var rf2 = /function\s+([A-Za-z_$][\w$]*)/g, tout = code;
        while ((mj = rf2.exec(tout))) fonctions[mj[1]] = true;
        var rc = /(\.\s*)?\b([A-Za-z_$][\w$]*)\s*\(/g;
        while ((mj = rc.exec(js))) {
          var nom = mj[2], pos2 = s.debut + mj.index + (mj[1] ? mj[1].length : 0);
          var avant = js.slice(Math.max(0, mj.index - 12), mj.index);
          if (JSKW[nom] || /function\s+$/.test(avant)) continue;
          if (mj[1]) {
            var objet = (js.slice(0, mj.index).match(/([A-Za-z_$][\w$]*)\s*$/) || [])[1] || "";
            if (objet === "Math") {
              if (MATH[nom] !== undefined) element("Math." + nom + "()", "JavaScript", 3);
              else { var hm2 = hors("math.floor"); ajouter(pos2, "hors", "Math." + nom + "() n'est pas dans l'annexe. " + (hm2 ? hm2.x : ""), hm2 ? hm2.a : "", "JS", "math" + nom); }
            } else if (objet === "console") {
              var hcl = hors("console.log"); ajouter(pos2, "hors", hcl.x, hcl.a, "JS", "console");
            } else if (JSM[nom] !== undefined) {
              element(nom + "()", "JavaScript", JSM[nom]);
              if (JSM[nom] > niveau) ajouter(pos2, "niveau", niveauMsg(nom + "()", JSM[nom]), "", "JS", "m" + nom);
            } else if (!fonctions[nom]) {
              var hj = hors(nom) || hors(nom + "()");
              ajouter(pos2, "hors", hj ? hj.x : "La méthode " + nom + "() n'est pas dans l'annexe.", hj ? hj.a : "", "JS", "m" + nom);
            }
          } else if (JSGLOB[nom] !== undefined) {
            element(nom + "()", "JavaScript", 3);
          } else if (!fonctions[nom] && !(s.attribut && !hors(nom))) {
            var hg2 = hors(nom);
            ajouter(pos2, "hors", hg2 ? hg2.x : "La fonction " + nom + "() n'est pas définie dans le code et n'est pas dans l'annexe.", hg2 ? hg2.a : "", "JS", "f" + nom);
          }
        }
        var rx;
        var reP = /\.(textContent|innerText)\b/g;
        while ((rx = reP.exec(js))) { var htc = hors("textcontent"); ajouter(s.debut + rx.index, "hors", htc.x, htc.a, "JS", "textcontent"); }
        var reS = /[!=]==/g;
        while ((rx = reS.exec(js))) { var hst = hors("==="); ajouter(s.debut + rx.index, "hors", hst.x, hst.a, "JS", "strict"); }
        var reV = /\.(value|innerHTML|checked|disabled|readOnly|src|muted|selectedIndex|length|style)\b/g;
        while ((rx = reV.exec(js))) element("." + rx[1], "JavaScript", rx[1] === "selectedIndex" || rx[1] === "style" || rx[1] === "disabled" || rx[1] === "readOnly" || rx[1] === "muted" ? 4 : 3);
        if (/\.readonly\s*=/.test(js)) ajouter(s.debut + js.search(/\.readonly\s*=/), "convention", "En JavaScript, l'attribut s'écrit readOnly (O majuscule) : .readonly est sans effet.", 'document.getElementById("cin").readOnly = true;', "JS", "readonly");
        if (/\.style\.[a-z]+-[a-z]/.test(js)) ajouter(s.debut + js.search(/\.style\.[a-z]+-[a-z]/), "convention", "Une propriété CSS avec tiret s'écrit en camelCase en JavaScript.", 'element.style.backgroundColor = "navy";', "JS", "camel");
      }

      /* -------------------- PHP */
      if (lang === "php") {
        if (niveau < 4 && !dejaNiveau.php) { dejaNiveau.php = true; ajouter(s.debut, "niveau", "PHP est au programme de 4ème uniquement.", "", "PHP", "php"); }
        var php = sansChaines(s.texte, "php"), mp;
        var fphp = {}, rfp = /function\s+(\w+)/g;
        while ((mp = rfp.exec(php))) fphp[mp[1].toLowerCase()] = true;
        var rcp = /(->|::)?\b([A-Za-z_]\w*)\s*\(/g;
        while ((mp = rcp.exec(php))) {
          var f = mp[2].toLowerCase(), posP = s.debut + mp.index;
          var avantP = php.slice(Math.max(0, mp.index - 12), mp.index);
          if (/function\s+$/.test(avantP) || /new\s+$/.test(avantP)) continue;
          if (mp[1]) { ajouter(posP, "hors", "La syntaxe objet (-> ou ::) n'est pas au programme : fonctions mysqli procédurales.", hors("pdo").a, "PHP", "objet"); continue; }
          if (PHPF[f] !== undefined) { element(f + "()", "PHP", 4); continue; }
          if (PHPKW[f] || fphp[f]) continue;
          var hpf = hors(f);
          if (f === "switch") { ajouter(posP, "hors", hors("switch").x, hors("switch").a, "PHP", "switch"); continue; }
          if (f === "foreach") { ajouter(posP, "hors", hors("foreach").x, hors("foreach").a, "PHP", "foreach"); continue; }
          ajouter(posP, "hors", hpf ? hpf.x : "La fonction " + f + "() n'est pas dans l'annexe.", hpf ? hpf.a : "", "PHP", "f" + f);
        }
        var rn = /\bnew\s+(\w+)/gi, mn;
        while ((mn = rn.exec(php))) { var hpd = hors("pdo"); ajouter(s.debut + mn.index, "hors", hpd.x, hpd.a, "PHP", "new"); }
        if (/\$_SESSION|\$_COOKIE/.test(s.texte)) { var hss = hors("session"); ajouter(s.debut + s.texte.search(/\$_SESSION|\$_COOKIE/), "hors", hss.x, hss.a, "PHP", "session"); }
        if (/[!=]==/.test(php)) ajouter(s.debut + php.search(/[!=]==/), "hors", "=== et !== ne sont pas dans l'annexe : == et !=.", "", "PHP", "strictphp");
        // requêtes SQL contenues dans les chaînes PHP
        var rs = /(["'])((?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b(?:(?!\1)[\s\S])*)\1/gi, ms;
        while ((ms = rs.exec(s.texte))) segs.push({ lang: "sql", debut: s.debut + ms.index + 1, texte: ms[2], dansPhp: true });
      }
    });

    /* -------------------- SQL (y compris celles trouvées dans le PHP) */
    LCOURANT = "SQL";
    segs.filter(function (s) { return s.lang === "sql"; }).forEach(function (s) {
      var sql = sansChaines(s.texte, "sql").replace(/\$\w+/g, function (x) { return blanchir(x); });
      var U = sql.toUpperCase(), mq;
      if (niveau === 2 && !dejaNiveau.sql) { dejaNiveau.sql = true; ajouter(s.debut, "niveau", "Les bases de données sont introduites en 3ème.", "", "SQL", "sql2"); }
      var HORS_SQL = [[/\b(INNER|LEFT|RIGHT|NATURAL|CROSS)?\s*JOIN\b/g, "join"], [/\bCURDATE\s*\(|\bCURRENT_DATE\b/g, "curdate"],
        [/\bAUTO_INCREMENT\b/g, "auto_increment"], [/\bMODIFY\b|\bRENAME\s+COLUMN\b/g, "modify"], [/\bIF\s+(NOT\s+)?EXISTS\b/g, "if exists"],
        [/\bLIMIT\s+\d/g, "limit"], [/\b(BOOLEAN|ENUM|FLOAT|DOUBLE)\b/g, "boolean"]];
      HORS_SQL.forEach(function (x) {
        var mq2;
        while ((mq2 = x[0].exec(U))) { var hq = hors(x[1]); ajouter(s.debut + mq2.index, "hors", hq.x, hq.a, "SQL", "sql" + x[1]); }
      });
      var rfn = /\b([A-Z_]+)\s*\(/g;
      var OKSQL = { IN: 1, VALUES: 1, CHECK: 1, KEY: 1, VARCHAR: 1, CHAR: 1, DECIMAL: 1, INT: 1, INTERVAL: 1, EXISTS: 1, AND: 1, OR: 1, NOT: 1, TABLE: 1, INTO: 1, REFERENCES: 1, ON: 1, WHERE: 1, SELECT: 1, FROM: 1 };
      var NONANNEXE = { CONCAT: 1, UPPER: 1, LOWER: 1, LENGTH: 1, SUBSTRING: 1, ROUND: 1, IFNULL: 1, COALESCE: 1, DATE_FORMAT: 1, DATE_ADD: 1, DATE_SUB: 1, TIMESTAMPDIFF: 1, CURTIME: 1, RAND: 1 };
      while ((mq = rfn.exec(U))) {
        var fn = mq[1], posF = s.debut + mq.index;
        if (SQLF[fn] !== undefined) {
          element(fn + "()", "SQL", SQLF[fn]);
          if (SQLF[fn] > niveau) ajouter(posF, "niveau", niveauMsg(fn + "()", SQLF[fn]), "", "SQL", "f" + fn);
        } else if (NONANNEXE[fn]) ajouter(posF, "hors", "La fonction SQL " + fn + "() n'est pas dans l'annexe.", "", "SQL", "f" + fn);
        void OKSQL;
      }
      if (niveau === 3) {
        var R3 = [[/\b(CREATE|ALTER|DROP)\s+(TABLE|DATABASE)\b/g, "Les instructions CREATE, ALTER et DROP sont réservées à la 4ème : en 3ème, la base se crée en mode assisté (phpMyAdmin)."],
          [/\bGROUP\s+BY\b/g, "GROUP BY est au programme de 4ème."], [/\bHAVING\b/g, "HAVING est au programme de 4ème."],
          [/\(\s*SELECT\b/g, "Les sous-requêtes sont au programme de 4ème."]];
        R3.forEach(function (x) { var m3; while ((m3 = x[0].exec(U))) ajouter(s.debut + m3.index, "niveau", x[1], "", "SQL", x[1]); });
        var rFrom = /\bFROM\s+([\s\S]*?)(\bWHERE\b|\bORDER\b|\bGROUP\b|;|$)/g, mf;
        while ((mf = rFrom.exec(U))) if (/,/.test(mf[1])) ajouter(s.debut + mf.index, "niveau", "Une requête sur plusieurs tables (jointure) est au programme de 4ème : en 3ème, une seule table.", "", "SQL", "multi");
      }
      ["SELECT", "INSERT INTO", "UPDATE", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "GROUP BY", "HAVING", "ORDER BY", "DISTINCT", "BETWEEN", "LIKE", "IS NULL", "FOREIGN KEY", "PRIMARY KEY"]
        .forEach(function (k) { if (new RegExp("\\b" + k.replace(" ", "\\s+") + "\\b").test(U)) element(k, "SQL", /CREATE|ALTER|DROP|GROUP|HAVING|FOREIGN/.test(k) ? 4 : 3); });
    });

    problemes.sort(function (a, b) { return a.ligne - b.ligne; });
    var langs = {};
    segs.forEach(function (s) { if (s.texte.trim()) langs[{ html: "HTML", css: "CSS", cssdecl: "CSS", js: "JavaScript", php: "PHP", sql: "SQL" }[s.lang]] = true; });
    return { langages: Object.keys(langs), problemes: problemes,
      elements: Object.keys(elements).map(function (k) { return elements[k]; }).sort(function (a, b) { return a.l.localeCompare(b.l) || a.n - b.n; }) };
  }

  window.Verificateur = { analyser: analyser };
})();
