/* Mon compte : informations et changement de mot de passe. */
(function () {
  "use strict";
  var C = window.CompteSTI;
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  if (!C.session()) { location.replace("index.html?suite=" + encodeURIComponent(location.pathname)); return; }
  function afficher(s) {
    if (!s) { location.replace("index.html?suite=" + encodeURIComponent(location.pathname)); return; }
    var lignes = [["Nom", s.prenom + " " + s.nom], ["Identifiant", s.id], ["Profil", s.role === "prof" ? "Enseignant" : "Élève"]];
    if (s.role !== "prof") lignes.push(["Niveau", s.niveau ? s.niveau + "ème année" : "–"], ["Classe", s.classe || "–"]);
    document.getElementById("mc-infos").innerHTML = lignes.map(function (l) { return "<dt>" + l[0] + "</dt><dd>" + esc(l[1]) + "</dd>"; }).join("");
    document.getElementById("mc-user").value = s.id;
    document.getElementById("mc-retour").href = C.accueilDe(s);
    if (s.role !== "prof" && !document.getElementById("mc-aide")) document.getElementById("mc-infos").insertAdjacentHTML("afterend", '<p class="aide" id="mc-aide">Une erreur de nom, de niveau ou de classe ? Demandez à votre professeur de la corriger.</p>');
  }
  var note = document.getElementById("note-mode");
  if (note && C.enLigne) note.textContent = "Votre compte fonctionne sur tous vos appareils : ordinateur du labo, maison, téléphone.";
  var note = document.getElementById("note-mode");
  if (note && C.enLigne) note.textContent = "Votre compte fonctionne sur tous vos appareils : ordinateur du labo, maison, téléphone.";
  afficher(C.session());
  C.pret.then(afficher);
  document.getElementById("mc-sortir").addEventListener("click", function () { C.deconnecter(); });
  var f = document.getElementById("f-mdp"), err = document.getElementById("m-erreur"), ok = document.getElementById("m-ok"), btn = f.querySelector("button");
  f.addEventListener("submit", async function (e) {
    e.preventDefault();
    err.hidden = true; ok.hidden = true;
    var a = document.getElementById("m-ancien").value, n = document.getElementById("m-nouveau").value;
    if (n !== document.getElementById("m-nouveau2").value) { err.textContent = "Les deux nouveaux mots de passe ne sont pas identiques."; err.hidden = false; return; }
    btn.disabled = true; btn.classList.add("attente");
    try { await C.changerMotDePasse(a, n); f.reset(); ok.hidden = false; }
    catch (x) { err.textContent = x.message; err.hidden = false; }
    btn.disabled = false; btn.classList.remove("attente");
  });
})();
