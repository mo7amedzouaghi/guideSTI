/* Moteur de recherche dans l'annexe (partagé par le Mode IA).
   Expose window.MoteurSTI = { rechercher, norm, esc, data, hors } */
(function () {
  "use strict";
  var DATA = window.ANNEXE || [];
  var HORS = window.HORS_ANNEXE || [];

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[’']/g, " ").replace(/\s+/g, " ").trim();
  }
  function coeur(s) {
    return norm(s).replace(/\(.*$/, "").replace(/^ch\.|^d\.|^document\.|^element\./, "").replace(/[<>\[\]]/g, "").trim();
  }
  function racine(m) { return m.length > 4 ? m.replace(/(es|s|x)$/, "") : m; }

  var VIDE = {};
  ("a au aux avec ce ces c comment dans de des du elle en est et faire faut il je j la le les leur lui ma me mes mon ne " +
   "on ou par pas pour qu que quel quelle quels quelles qui sa se ses son sur ta te tes ton tu un une vos votre veux voudrais " +
   "puis peut peux quoi l d s n m t y svp merci bonjour donne donner exemple exemples utiliser utilise sert " +
   "signifie definition definir expliquer explique explique-moi moyen maniere facon methode fonction propriete balise ecris ecrire " +
   "code programme corrige corriger aide aider difference entre").split(" ").forEach(function (m) { VIDE[m] = true; });
  var ALIAS = { html: "HTML5", html5: "HTML5", css: "CSS3", css3: "CSS3", js: "JavaScript", javascript: "JavaScript",
    sql: "SQL", mysql: "SQL", php: "PHP" };

  DATA.forEach(function (it, i) {
    it.i = i;
    it._nom = norm(it.e);
    it._coeur = coeur(it.e);
    it._mots = norm(it.k || "").split(" ");
    it._def = norm(it.d + " " + (it.rq || []).join(" "));
    it._cat = norm(it.c);
  });
  HORS.forEach(function (h) { h._m = h.m.map(norm); });

  var DF = {};
  DATA.forEach(function (it) {
    var vus = {};
    it._mots.forEach(function (m) { if (m && !vus[m]) { vus[m] = true; DF[m] = (DF[m] || 0) + 1; } });
  });
  var LOGN = Math.log(DATA.length + 1);
  function poids(m) {
    var df = DF[m] || DF[racine(m)] || 1;
    return 0.5 + Math.log((DATA.length + 1) / (df + 1)) / LOGN;
  }

  function analyser(q) {
    var qn = norm(q), langue = null, restants = [];
    var mots = qn.split(/[\s,;?!:.]+/).filter(Boolean);
    mots.forEach(function (m) {
      if (ALIAS[m] && mots.length > 1) { langue = ALIAS[m]; return; }
      if (!VIDE[m]) restants.push(m);
    });
    return { qn: qn, langue: langue, mots: restants, coeur: coeur(qn) };
  }

  function scorer(it, a, niveau) {
    if (a.langue && it.l !== a.langue) return 0;
    var s = 0;
    if (a.qn === it._nom || (a.coeur && a.coeur === it._coeur)) s += 200;
    else if (a.qn.length >= 2 && it._nom.indexOf(a.qn) !== -1) s += 70;
    else if (it._coeur.length >= 2 && (" " + a.mots.join(" ") + " ").indexOf(" " + it._coeur + " ") !== -1) s += a.mots.length > 1 ? 20 : 50;
    var trouves = 0;
    a.mots.forEach(function (m) {
      var r = racine(m), ok = false, w = poids(m);
      if (m === it._coeur) { s += a.mots.length > 1 ? 20 : 40; ok = true; }
      else if (m.length >= 3 && it._nom.indexOf(m) !== -1) { s += 10; ok = true; }
      if (it._mots.indexOf(m) !== -1 || it._mots.indexOf(r) !== -1) { s += Math.round(16 * w); ok = true; }
      else if (r.length >= 4 && it._mots.some(function (k) { return k.indexOf(r) === 0 || (k.length >= 5 && r.indexOf(k) === 0); })) { s += Math.round(8 * w); ok = true; }
      if (r.length >= 4 && it._def.indexOf(r) !== -1) { s += 3; ok = true; }
      if (r.length >= 4 && it._cat.indexOf(r) !== -1) { s += 3; ok = true; }
      if (ok) trouves++;
    });
    if (a.mots.length > 1) s += Math.round(20 * trouves / a.mots.length);
    if (niveau && it.n > niveau) s = Math.round(s * 0.6);
    return s;
  }

  function horsAnnexe(a) {
    var mots = " " + a.mots.join(" ") + " ";
    return HORS.filter(function (h) {
      if (a.langue && h.l !== a.langue) return false;
      return h._m.some(function (t) {
        if (a.qn === t) return true;
        if (/[^a-z0-9 ]/.test(t)) return a.qn.indexOf(t) !== -1;
        return mots.indexOf(" " + t + " ") !== -1;
      });
    });
  }

  function rechercher(q, niveau) {
    var a = analyser(q);
    var res = DATA.map(function (it) { return { it: it, s: scorer(it, a, niveau || 0) }; })
      .filter(function (r) { return r.s >= 12; })
      .sort(function (x, y) { return y.s - x.s || x.it.n - y.it.n; });
    return { a: a, res: res, hors: horsAnnexe(a) };
  }

  window.MoteurSTI = { rechercher: rechercher, norm: norm, esc: esc, data: DATA, hors: HORS };
})();
