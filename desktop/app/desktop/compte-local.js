/* Version bureau : remplace connexion/compte.js (aucune inscription).
   - Espace Élèves : les scores restent sur le poste, le nombre d'essais est compté.
   - Espace Prof (suivi.html) : les résultats viennent des progressions reçues ou importées. */
(function () {
  "use strict";
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  var D = window.stiDesktop;
  window.CompteSTI = {
    enLigne: true,
    pret: Promise.resolve(null),
    session: function () { return null; },
    enregistrerScore: function (n, c) {
      var k = "sti-essais-" + n + "-" + c;
      ecrire(k, String((Number(lire(k)) || 0) + 1));
      return Promise.resolve();
    },
    suivi: function () { return D ? D.suivi.local() : Promise.resolve({ eleves: [], scores: [] }); }
  };
})();
