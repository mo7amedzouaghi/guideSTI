/* Module D — ramassage des travaux et des progressions sur le réseau du labo. */
(async function () {
  "use strict";
  var D = window.stiDesktop, S = window.STI, esc = S.esc;
  var $ = function (id) { return document.getElementById(id); };
  $("nom").value = S.lire("sti-ram-nom") || "Poste prof";
  $("classe").value = S.lire("sti-ram-classe") || "";

  function afficher(etat) {
    var on = !!etat;
    $("voyant").className = "voyant" + (on ? " on" : "");
    $("voyant").textContent = on ? "ramassage en cours" : "arrêté";
    $("demarrer").hidden = on; $("arreter").hidden = !on;
    $("nom").disabled = $("classe").disabled = on;
    $("adresses").innerHTML = on
      ? (etat.adresses.length
        ? '<p class="m-aide" style="margin-bottom:4px">Adresse(s) de ce poste à communiquer si la recherche automatique échoue :</p>' + etat.adresses.map(function (a) { return '<span class="ip-grande" title="' + esc(a.interface) + '">' + esc(a.ip) + "</span>"; }).join("")
        : '<p class="m-aide" style="color:var(--rouge)">Aucune carte réseau active : branchez le poste au réseau du labo.</p>')
      : "";
  }
  function journal(t) {
    var j = $("journal");
    if (j.querySelector("p")) j.innerHTML = "";
    var d = document.createElement("div");
    d.innerHTML = "<time>" + new Date().toLocaleTimeString("fr-FR") + "</time>" + t;
    j.prepend(d);
  }

  async function recus() {
    var l = await D.ramassage.liste(), jour = new Date().toISOString().slice(0, 10);
    var auj = l.filter(function (x) { return x.jour === jour; });
    $("recus").innerHTML = auj.length ? '<table class="t"><thead><tr><th>Élève</th><th>Classe</th><th>Poste</th><th>TP</th><th>Heure</th><th></th></tr></thead><tbody>' + auj.map(function (x) {
      return "<tr><td><b>" + esc(x.identite.nom + " " + x.identite.prenom) + "</b></td><td>" + esc(x.identite.classe) + "</td><td>" + esc(x.identite.poste) + "</td><td>" + esc(x.tpId) + "</td><td>" +
        (x.remis ? new Date(x.remis).toLocaleTimeString("fr-FR") : "") + '</td><td><button type="button" class="btn sec" data-tp="' + esc(x.tpId) + '" style="padding:5px 10px">Corriger</button></td></tr>';
    }).join("") + "</tbody></table>" + '<p class="m-aide" style="margin-top:8px">' + auj.length + " travail(aux) reçu(s) aujourd'hui · " + l.length + " au total.</p>"
      : '<p class="vide">Aucun travail reçu aujourd\'hui.</p>';
    $("recus").querySelectorAll("[data-tp]").forEach(function (b) {
      b.addEventListener("click", function () { S.ecrire("sti-prof-tp", b.dataset.tp); S.ecrire("sti-prof-onglet", "copies"); location.href = "tp.html"; });
    });
  }

  $("demarrer").addEventListener("click", async function () {
    S.ecrire("sti-ram-nom", $("nom").value.trim() || "Poste prof"); S.ecrire("sti-ram-classe", $("classe").value.trim().toUpperCase());
    try { afficher(await D.ramassage.demarrer({ nom: $("nom").value.trim() || "Poste prof", classe: $("classe").value.trim().toUpperCase() })); journal("Ramassage démarré."); }
    catch (e) { S.toast(S.msg(e), "ko"); }
  });
  $("arreter").addEventListener("click", async function () { await D.ramassage.arreter(); afficher(null); journal("Ramassage arrêté."); });
  $("dossier").addEventListener("click", function () { D.ramassage.ouvrirDossier(); });

  D.ramassage.surEvenement(function (x) {
    var i = (x.donnees && x.donnees.identite) || {};
    if (x.type === "remise") { journal("📥 <b>" + esc(i.prenom + " " + i.nom) + "</b> (poste " + esc(i.poste) + ") a remis « " + esc(x.donnees.tpId) + " »"); recus(); }
    if (x.type === "progression") journal("📊 Progression reçue de <b>" + esc(i.prenom + " " + i.nom) + "</b> (" + esc(i.classe) + ")");
    if (x.type === "erreur") { S.toast(x.donnees.message, "ko"); afficher(null); }
  });

  afficher(await D.ramassage.etat());
  recus();
})();
