/* Pages Connexion et Inscription. */
(function () {
  "use strict";
  var C = window.CompteSTI;
  var suite = new URLSearchParams(location.search).get("suite");

  function destination(s) {
    // retour à la page demandée si le rôle y donne accès, sinon accueil du rôle
    if (suite && /^\/[\w\-./%]*$/.test(suite)) {
      var versProf = /\/prof\//.test(suite);
      if (!versProf || s.role === "prof") return suite;
    }
    return C.accueilDe(s);
  }
  function erreur(id, msg) { var p = document.getElementById(id); p.textContent = msg; p.hidden = !msg; }

  var motif = new URLSearchParams(location.search).get("motif");
  var msgMotif = { desactive: "Votre compte a été désactivé par un enseignant.", supprime: "Votre compte n'existe plus. Refaites l'inscription avec le même identifiant." }[motif];
  if (msgMotif) {
    var carte = document.querySelector(".compte-carte h1");
    if (carte) carte.insertAdjacentHTML("afterend", '<p class="motif" role="alert">' + msgMotif + "</p>");
  }
  if (C.enLigne) {
    var note = document.getElementById("note-mode");
    if (note) note.textContent = "Votre compte fonctionne sur tous vos appareils : ordinateur du labo, maison, téléphone.";
  }
  function bouton(f, actif) { var b = f && f.querySelector('button[type="submit"]'); if (b) { b.disabled = !actif; b.classList.toggle("attente", !actif); } }

  /* déjà connecté */
  C.pret.then(function (s) {
  if (s) {
    var d = document.getElementById("deja");
    d.hidden = false;
    d.innerHTML = '<p>Vous êtes connecté en tant que <strong></strong>.</p><a class="btn-compte" href="#">Continuer</a> <button type="button" class="btn-lien">Changer de compte</button>';
    d.querySelector("strong").textContent = s.prenom + " " + s.nom + (s.role === "prof" ? " (enseignant)" : " (élève)");
    d.querySelector("a").href = destination(s);
    d.querySelector("button").addEventListener("click", function () { C.deconnecter(); });
  }
  });

  /* connexion */
  var fc = document.getElementById("f-connexion");
  if (fc) fc.addEventListener("submit", async function (e) {
    e.preventDefault();
    erreur("c-erreur", "");
    var id = document.getElementById("c-id").value, mdp = document.getElementById("c-mdp").value;
    if (!id.trim() || !mdp) { erreur("c-erreur", "Saisissez votre identifiant et votre mot de passe."); return; }
    bouton(fc, false);
    try { location.href = destination(await C.connecter(id, mdp)); }
    catch (er) { erreur("c-erreur", er.message); bouton(fc, true); }
  });

  /* inscription */
  var fi = document.getElementById("f-inscription");
  if (fi) {
    var role = function () { return fi.querySelector('input[name="role"]:checked').value; };
    var maj = function () {
      var be = document.getElementById("bloc-eleve"), bp = document.getElementById("bloc-prof");
      be.hidden = role() !== "eleve"; be.style.display = role() === "eleve" ? "" : "none";
      bp.hidden = role() !== "prof"; bp.style.display = role() === "prof" ? "" : "none";
    };
    fi.querySelectorAll('input[name="role"]').forEach(function (r) { r.addEventListener("change", maj); });
    maj();
    var sansAccent = function (t) { return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, ""); };
    var champId = document.getElementById("i-id"), modifie = false;
    champId.addEventListener("input", function () { modifie = true; });
    ["i-prenom", "i-nom"].forEach(function (k) {
      document.getElementById(k).addEventListener("input", function () {
        if (modifie) return;
        var p = sansAccent(document.getElementById("i-prenom").value), n = sansAccent(document.getElementById("i-nom").value);
        champId.value = p && n ? p + "." + n : p || n;
      });
    });
    fi.addEventListener("submit", async function (e) {
      e.preventDefault();
      erreur("i-erreur", "");
      var v = function (k) { return document.getElementById(k).value.trim(); };
      var d = { role: role(), prenom: v("i-prenom"), nom: v("i-nom"), niveau: v("i-niveau"), classe: v("i-classe"),
                code: document.getElementById("i-code").value, identifiant: v("i-id"), mdp: document.getElementById("i-mdp").value };
      if (d.prenom.length < 2 || d.nom.length < 2) { erreur("i-erreur", "Saisissez votre prénom et votre nom."); return; }
      if (d.role === "eleve" && !d.niveau) { erreur("i-erreur", "Choisissez votre niveau."); return; }
      if (d.role === "prof" && !d.code.trim()) { erreur("i-erreur", "Saisissez le code enseignant."); return; }
      if (d.mdp !== document.getElementById("i-mdp2").value) { erreur("i-erreur", "Les deux mots de passe ne sont pas identiques."); return; }
      bouton(fi, false);
      try { location.href = destination(await C.inscrire(d)); }
      catch (er) { erreur("i-erreur", er.message); bouton(fi, true); }
    });
  }
})();
