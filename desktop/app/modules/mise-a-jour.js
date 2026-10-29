/* Module E — mise à jour du contenu du guide depuis GitHub, le poste prof ou un fichier .zip. */
(async function () {
  "use strict";
  var D = window.stiDesktop, S = window.STI, esc = S.esc;
  var $ = function (id) { return document.getElementById(id); };

  function date(d) { return d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "date inconnue"; }
  var SOURCES = { integre: "livrée avec l'application", github: "téléchargée depuis GitHub", fichier: "installée depuis un fichier", reseau: "reçue du poste prof" };
  function carte(titre, v, c) {
    return '<div class="v-carte" style="--c:' + c + '"><small>' + titre + "</small><b>" + esc(date(v.date)) + "</b>" +
      (v.sha ? "<code>" + esc(v.sha.slice(0, 7)) + "</code> " : "") + '<span class="m-aide">' + esc(SOURCES[v.source] || v.source || "") + "</span>" +
      (v.message ? "<p>« " + esc(v.message) + " »</p>" : "") + "</div>";
  }

  var etat;
  async function rendre() {
    etat = await D.maj.etat();
    var h = carte("Version utilisée", etat.active, "var(--n2)");
    if (etat.misAJour) h += carte("Version d'origine", etat.integree, "var(--texte-2)");
    if (etat.disponible) h += carte("Disponible sur GitHub", etat.disponible, "var(--orange)");
    $("versions").innerHTML = h;
    $("carte-revenir").hidden = !etat.misAJour;
    if (etat.derniereVerif && !$("etat").innerHTML) message(etat.disponible ? "dispo" : "ok", etat.disponible ? "Une nouvelle version du guide est disponible." : "Le guide est à jour.", "Dernière vérification : " + date(etat.derniereVerif));
  }
  function message(type, titre, texte, progression) {
    var ico = { ok: "✔", ko: "⚠", dispo: "★", encours: "⏳" }[type];
    $("etat").innerHTML = '<div class="bandeau-maj ' + (type === "ok" ? "ok" : type === "ko" ? "ko" : "") + '"><span class="ico">' + ico + "</span><div><b>" + esc(titre) + "</b>" +
      (texte ? '<p class="m-aide" style="margin:2px 0 0">' + esc(texte) + "</p>" : "") + (progression ? '<div class="barre-prog indet" id="prog"><i></i></div>' : "") + "</div></div>";
  }
  var boutons = ["verifier", "github", "prof", "fichier", "revenir"];
  function occupe(oui) { boutons.forEach(function (b) { $(b).disabled = oui; }); }

  D.maj.surProgression(function (p) {
    var b = $("prog"); if (!b) return;
    if (p.etape === "telechargement" && p.total) { b.classList.remove("indet"); b.firstChild.style.width = Math.round(100 * p.recu / p.total) + "%"; }
    if (p.etape === "telechargement" && !p.total && p.recu) { var t = $("etat").querySelector("p"); if (t) t.textContent = "Téléchargé : " + (p.recu / 1048576).toFixed(1) + " Mo"; }
    if (p.etape === "installation") { b.classList.add("indet"); var t2 = $("etat").querySelector("p"); if (t2) t2.textContent = "Installation et adaptation des pages…"; }
  });

  async function action(titre, fn, succes) {
    occupe(true);
    message("encours", titre, "", true);
    try {
      var r = await fn();
      if (r === null) { $("etat").innerHTML = ""; }
      else succes(r);
    } catch (e) { message("ko", "Échec", S.msg(e)); }
    occupe(false);
    await rendre();
  }
  function installe(v) {
    message("ok", "Guide mis à jour", "Version du " + date(v.date) + (v.sha ? " (" + v.sha.slice(0, 7) + ")" : "") + ". Les pages ouvertes utilisent désormais ce contenu.");
    S.toast("Guide mis à jour ✔", "ok");
  }

  $("verifier").addEventListener("click", function () {
    action("Recherche sur GitHub…", function () { return D.maj.verifier(); }, function (r) {
      if (r.nouvelle) message("dispo", "Nouvelle version disponible", "Publiée le " + date(r.derniere.date) + " : « " + r.derniere.message + " ». Cliquez sur « Installer la dernière version ».");
      else message("ok", "Le guide est à jour", "Dernière publication : " + date(r.derniere.date) + ".");
    });
  });
  $("github").addEventListener("click", function () { action("Téléchargement depuis GitHub…", function () { return D.maj.installerGithub(); }, installe); });
  $("fichier").addEventListener("click", function () { action("Installation depuis le fichier…", function () { return D.maj.installerFichier(); }, installe); });
  $("prof").addEventListener("click", async function () {
    var ip = await S.exigerPosteProf(); if (!ip) return;
    action("Réception depuis le poste prof…", function () { return D.maj.depuisProf(ip); }, function (r) {
      if (r.dejaAJour) message("ok", "Déjà à jour", "Ce poste a la même version que le poste prof.");
      else installe(r.version);
    });
  });
  $("revenir").addEventListener("click", async function () {
    var ok = await S.dialogue({ titre: "Revenir à la version d'origine ?", valider: "Revenir", texte: "La mise à jour téléchargée sera supprimée. Vous pourrez la réinstaller plus tard." });
    if (ok) action("Retour à la version d'origine…", function () { return D.maj.revenir(); }, function () { message("ok", "Version d'origine rétablie", ""); });
  });

  await rendre();
  if (/verifier=1/.test(location.search)) $("verifier").click();
})();
