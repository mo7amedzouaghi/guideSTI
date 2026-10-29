(async function () {
  "use strict";
  var D = window.stiDesktop, S = window.STI;
  var info = await D.info();
  var complet = info.variante !== "eleve";
  document.getElementById("version").textContent = (complet ? "STI Guide" : "STI Élève") + " · version " + info.version;
  if (!complet) document.getElementById("cartes").classList.add("seule");

  /* mise à jour de l'application : recherche automatique une fois par jour (version installée seulement) */
  (async function () {
    var a = await D.app.etat();
    function bandeauApp(v) {
      var b = document.getElementById("maj-bandeau");
      b.hidden = false;
      b.innerHTML = "<span>★</span><span><b>Nouvelle version de l'application : " + S.esc(v) + "</b> — vous avez la version " + S.esc(a.version) + '.</span><a href="../modules/mise-a-jour.html">Mettre à jour</a>';
    }
    if (a.disponible) return bandeauApp(a.disponible.version);
    if (!a.installee || (a.derniereVerif && Date.now() - new Date(a.derniereVerif).getTime() < 864e5)) return;
    try { var r = await D.app.verifier(null); if (r.nouvelle) bandeauApp(r.version); } catch (e) { /* hors ligne */ }
  })();

  /* module E : version du guide et recherche automatique (une fois par jour, si Internet) */
  (async function () {
    var m = await D.maj.etat(), lien = document.getElementById("lien-maj");
    var jour = function (d) { return d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "?"; };
    lien.textContent = "Guide du " + jour(m.active.date) + " · Mettre à jour";
    function bandeau(v) {
      var b = document.getElementById("maj-bandeau");
      b.hidden = false;
      b.innerHTML = "<span>★</span><span><b>Nouvelle version du guide disponible</b> — publiée le " + S.esc(jour(v.date)) + (v.message ? " : « " + S.esc(v.message) + " »" : "") + '</span><a href="../modules/mise-a-jour.html">Mettre à jour</a>';
    }
    if (m.disponible) return bandeau(m.disponible);
    if (m.derniereVerif && Date.now() - new Date(m.derniereVerif).getTime() < 864e5) return;
    try { var r = await D.maj.verifier(); if (r.nouvelle) bandeau(r.derniere); } catch (e) { /* hors ligne : rien à signaler */ }
  })();

  function majQui() {
    var i = S.identite();
    document.getElementById("qui").innerHTML = i && i.nom
      ? "Poste de <b>" + S.esc(i.prenom + " " + i.nom) + "</b> · " + S.esc(i.classe) + " · poste " + S.esc(i.poste) + ' — <button type="button" class="lien" id="changer-id">changer</button>'
      : '<button type="button" class="lien" id="changer-id">Me présenter (nom, classe, poste)</button>';
    document.getElementById("changer-id").addEventListener("click", async function () { await S.demanderIdentite(false); majQui(); });
  }
  majQui();

  document.getElementById("go-eleve").addEventListener("click", async function () {
    if (!(await S.exigerIdentite())) return;
    location.href = "../contenu/eleves/index.html";
  });

  if (!complet) return;
  document.getElementById("carte-prof").hidden = false;

  async function ouvrirProf() {
    info = await D.info();
    if (info.profOuvert) return true;
    if (!info.pinDefini) {
      var v = await S.dialogue({
        titre: "Créer votre code prof", valider: "Créer le code",
        texte: "Premier lancement : choisissez un code de 4 à 8 chiffres. Il protège l'Espace Prof (corrigés, notes, ramassage) sur ce poste. Aucun compte n'est créé.",
        champs: [{ id: "a", label: "Code prof", type: "password", requis: true }, { id: "b", label: "Confirmer le code", type: "password", requis: true }],
        verifier: async function (x) {
          if (!/^\d{4,8}$/.test(x.a)) return "Le code doit contenir 4 à 8 chiffres.";
          if (x.a !== x.b) return "Les deux codes sont différents.";
          return await D.pin.definir(x.a) ? true : "Code impossible à créer.";
        }
      });
      return !!v;
    }
    var r = await S.dialogue({
      titre: "Espace Prof", valider: "Déverrouiller", texte: "Saisissez votre code prof.",
      champs: [{ id: "pin", label: "Code prof", type: "password", requis: true }],
      verifier: async function (x) { return (await D.pin.verifier(x.pin)) ? true : "Code incorrect."; }
    });
    return !!r;
  }
  function majVerrou() { document.getElementById("verrouiller").hidden = !info.profOuvert; }
  majVerrou();

  document.getElementById("go-prof").addEventListener("click", async function () { if (await ouvrirProf()) location.href = "../contenu/prof/index.html"; });
  document.querySelectorAll("#raccourcis-prof a").forEach(function (a) {
    a.addEventListener("click", async function (e) { e.preventDefault(); if (await ouvrirProf()) location.href = a.getAttribute("href"); });
  });
  document.getElementById("verrouiller").addEventListener("click", async function () { await D.pin.verrouiller(); info = await D.info(); majVerrou(); S.toast("Espace Prof verrouillé", "ok"); });
  document.getElementById("changer-pin").addEventListener("click", async function () {
    if (!(await D.info()).pinDefini) { await ouvrirProf(); info = await D.info(); majVerrou(); return; }
    var v = await S.dialogue({
      titre: "Changer le code prof", valider: "Changer",
      champs: [{ id: "a", label: "Code actuel", type: "password", requis: true }, { id: "b", label: "Nouveau code (4 à 8 chiffres)", type: "password", requis: true }],
      verifier: async function (x) { await D.pin.changer(x.a, x.b); return true; }
    });
    if (v) S.toast("Code prof modifié", "ok");
  });

  if (location.hash === "#prof") { history.replaceState(null, "", location.pathname); if (await ouvrirProf()) location.href = "../contenu/prof/index.html"; }
})();
