/* Mise à jour de l'application elle-même (GitHub Actions → release « bureau-derniere »). */
(async function () {
  "use strict";
  var D = window.stiDesktop, S = window.STI, esc = S.esc;
  var $ = function (id) { return document.getElementById(id); };
  var info = await D.info(), etat = await D.app.etat();
  $("app-version").textContent = "version " + etat.version + (etat.portable ? " · portable" : "");
  if (info.variante !== "eleve" && info.profOuvert) $("app-labo-carte").hidden = false;
  if (etat.partage) $("app-labo-texte").textContent = "Une mise à jour élève est prête sur ce poste : les postes du labo la récupèrent pendant le ramassage réseau.";

  function bandeau(type, titre, texte, prog) {
    var ico = { ok: "✔", ko: "⚠", dispo: "★", encours: "⏳" }[type];
    $("app-etat").innerHTML = '<div class="bandeau-maj ' + (type === "ok" ? "ok" : type === "ko" ? "ko" : "") + '"><span class="ico">' + ico + "</span><div><b>" + esc(titre) + "</b>" +
      (texte ? '<p class="m-aide" style="margin:2px 0 0">' + esc(texte) + "</p>" : "") + (prog !== undefined ? '<div class="barre-prog"><i id="app-prog" style="width:' + prog + '%"></i></div>' : "") + "</div></div>";
  }
  D.app.surEvenement(function (x) {
    if (x.etape === "telechargement") { if ($("app-prog")) $("app-prog").style.width = (x.pourcent || 0) + "%"; else bandeau("encours", "Téléchargement de la mise à jour…", "", x.pourcent || 0); }
    if (x.etape === "pret") { bandeau("ok", "Version " + x.version + " téléchargée", "Elle s'installera au prochain démarrage, ou tout de suite avec « Redémarrer et installer »."); $("app-installer").hidden = false; $("app-telecharger").disabled = true; }
    if (x.etape === "erreur") bandeau("ko", "Mise à jour interrompue", x.message);
    if (x.etape === "labo" && $("app-prog")) $("app-prog").style.width = (x.pourcent || 0) + "%";
  });
  if (etat.etat && etat.etat.etape === "pret") { bandeau("ok", "Version " + etat.etat.version + " téléchargée", "Cliquez sur « Redémarrer et installer »."); $("app-installer").hidden = false; }
  else if (etat.disponible) { bandeau("dispo", "Version " + etat.disponible.version + " disponible", "Vous avez la version " + etat.version + "."); $("app-telecharger").disabled = etat.portable; }

  async function verifier(ip) {
    bandeau("encours", "Recherche d'une nouvelle version…", "", undefined);
    try {
      var r = await D.app.verifier(ip);
      if (!r.nouvelle) { bandeau("ok", "L'application est à jour", "Version " + r.actuelle + "."); return; }
      if (etat.portable) { bandeau("dispo", "Version " + r.version + " disponible", "Version portable : téléchargez la nouvelle version portable (" + etat.page + ")."); return; }
      bandeau("dispo", "Version " + r.version + " disponible", "Vous avez la version " + r.actuelle + ". Cliquez sur « Télécharger »."); $("app-telecharger").disabled = false;
      return true;
    } catch (e) { bandeau("ko", "Recherche impossible", S.msg(e)); }
  }
  $("app-verifier").addEventListener("click", function () { verifier(null); });
  $("app-prof").addEventListener("click", async function () { var ip = await S.exigerPosteProf(); if (ip && await verifier(ip)) $("app-telecharger").click(); });
  $("app-telecharger").addEventListener("click", async function () {
    this.disabled = true; bandeau("encours", "Téléchargement de la mise à jour…", "Seules les parties modifiées sont téléchargées.", 0);
    try { await D.app.telecharger(); } catch (e) { bandeau("ko", "Téléchargement impossible", S.msg(e)); this.disabled = false; }
  });
  $("app-installer").addEventListener("click", function () { D.app.installer(); });
  $("app-fichier").addEventListener("click", async function () { try { await D.app.installerFichier(); } catch (e) { S.toast(S.msg(e), "ko"); } });
  $("app-labo").addEventListener("click", async function () {
    this.disabled = true; bandeau("encours", "Téléchargement de la mise à jour élève…", "", 0);
    try { var r = await D.app.preparerLabo(); bandeau("ok", "Mise à jour élève " + r.version + " prête", "Démarrez le ramassage réseau : sur chaque poste du labo, Mise à jour › Application › « Rechercher sur le poste prof »."); }
    catch (e) { bandeau("ko", "Préparation impossible", S.msg(e)); }
    this.disabled = false;
  });
})();
