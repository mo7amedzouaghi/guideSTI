/* Interface du vérificateur de conformité. */
(function () {
  "use strict";
  var V = window.Verificateur;
  var champ = document.getElementById("v-code"), selN = document.getElementById("v-niveau"), selL = document.getElementById("v-langue");
  var sortie = document.getElementById("v-resultat");

  var EXEMPLES = {
    html: '<!DOCTYPE html>\n<html lang="fr">\n<head>\n  <meta charset="UTF-8">\n  <title>Inscription au club</title>\n  <style>\n    body { display: flex; font-size: 1.1em; }\n    .bouton:hover { background-color: gold; transition: all 0.3s ease; }\n    nav > a { text-decoration: none; }\n  </style>\n</head>\n<body>\n  <p><b>Inscriptions ouvertes</b></p>\n  <img src="logo.png">\n  <input type="text" id="tel" pattern="[0-9]{8}">\n  <button onclick="verifier()">Valider</button>\n  <p id="msg"></p>\n  <script>\n    function verifier() {\n      let tel = document.getElementById("tel").value;\n      if (tel.charAt(0) === "0") {\n        console.log("Commence par zéro");\n      }\n      let code = Math.floor(Math.random() * 10);\n      document.getElementById("msg").textContent = tel.substr(0, 2);\n    }\n  </script>\n</body>\n</html>',
    sql: "SELECT E.nom, C.niveau\nFROM Eleve E JOIN Classe C ON E.idClasse = C.idClasse;\n\nSELECT ville, COUNT(*) FROM Eleve\nGROUP BY ville HAVING COUNT(*) > 2;\n\nCREATE TABLE Emprunt (id INT PRIMARY KEY AUTO_INCREMENT, d DATE);\n\nSELECT * FROM Emprunt WHERE d = CURDATE() LIMIT 10;",
    php: '<?php\n  $cnx = new PDO("mysql:host=localhost;dbname=ecole", "root", "");\n  $res = mysqli_query($cnx, "SELECT nom FROM Eleve WHERE ville = \'Tunis\'");\n  while ($ligne = mysqli_fetch_assoc($res)) {\n    print_r($ligne);\n  }\n  $mdp = md5($_POST["mdp"]);\n  switch ($choix) {\n    case 1: echo "Ajout"; break;\n  }\n  $_SESSION["login"] = $login;\n?>'
  };
  var NIV_EX = { html: "3", sql: "3", php: "4" };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  var TYPES = { hors: ["Hors annexe", "t-hors"], niveau: ["Niveau supérieur", "t-niveau"], convention: ["Convention", "t-conv"] };

  function lancer() {
    var code = champ.value;
    if (!code.trim()) { sortie.innerHTML = '<p class="res-vide">Collez d\'abord un code dans la zone ci-dessus.</p>'; return; }
    var n = Number(selN.value);
    var r = V.analyser(code, n, selL.value);
    var compte = { hors: 0, niveau: 0, convention: 0 };
    r.problemes.forEach(function (p) { compte[p.type]++; });
    var h = "";
    if (!r.problemes.length) {
      h += '<div class="bilan ok"><b>✔</b><div><h2>Conforme au programme de ' + n + 'ème année</h2><p>Aucun élément hors annexe ni au-dessus du niveau n\'a été détecté (' + r.langages.join(", ") + ').</p></div></div>';
    } else {
      h += '<div class="bilan ko"><b>' + r.problemes.length + '</b><div><h2>' + r.problemes.length + " point" + (r.problemes.length > 1 ? "s" : "") + " à corriger pour la " + n + "ème année</h2><p>" +
        [compte.hors && compte.hors + " hors annexe", compte.niveau && compte.niveau + " au-dessus du niveau", compte.convention && compte.convention + " convention" + (compte.convention > 1 ? "s" : "")].filter(Boolean).join(" · ") +
        " — langages analysés : " + r.langages.join(", ") + '.</p></div><button type="button" class="btn-sec" id="v-copier">Copier le rapport</button></div>';
      h += '<div class="tableau-wrap"><table class="t rapport"><thead><tr><th>Ligne</th><th>Problème</th><th>Correction conforme</th></tr></thead><tbody>' +
        r.problemes.map(function (p, i) {
          return '<tr data-ligne="' + p.ligne + '"><td><button type="button" class="aller" data-ligne="' + p.ligne + '">L' + p.ligne + '</button></td><td><span class="badge ' + TYPES[p.type][1] + '">' + TYPES[p.type][0] +
            '</span> <span class="lg">' + esc(p.langage) + "</span><p>" + esc(p.message) + '</p><code class="extrait">' + esc(p.extrait) + "</code></td><td>" +
            (p.alternative ? '<pre class="alt">' + esc(p.alternative) + "</pre>" : "—") + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }
    // code numéroté avec lignes signalées
    var marquees = {};
    r.problemes.forEach(function (p) { marquees[p.ligne] = p.type === "convention" && marquees[p.ligne] !== "ko" ? "conv" : "ko"; });
    h += '<h3 class="res-titre">Votre code</h3><div class="code-num" id="v-vue">' + code.split("\n").map(function (l, i) {
      var m = marquees[i + 1];
      return '<div class="ln' + (m ? " " + m : "") + '" id="L' + (i + 1) + '"><span>' + (i + 1) + "</span><code>" + (esc(l) || " ") + "</code></div>";
    }).join("") + "</div>";
    if (r.elements.length) {
      h += '<h3 class="res-titre">Éléments de l\'annexe utilisés</h3><div class="elements">' + r.elements.map(function (e) {
        return '<span class="el' + (e.n > n ? " trop" : "") + '"><code>' + esc(e.nom) + '</code><span class="nb n' + e.n + '">' + e.n + "</span></span>";
      }).join("") + "</div>";
    }
    sortie.innerHTML = h;
    sortie.querySelectorAll(".aller").forEach(function (b) {
      b.addEventListener("click", function () {
        var l = document.getElementById("L" + b.dataset.ligne);
        if (l) { l.scrollIntoView({ behavior: "smooth", block: "center" }); l.classList.add("flash"); setTimeout(function () { l.classList.remove("flash"); }, 1400); }
      });
    });
    var cp = document.getElementById("v-copier");
    if (cp) cp.addEventListener("click", function () {
      var t = "Vérification de conformité — " + n + "ème année\n\n" + r.problemes.map(function (p) {
        return "Ligne " + p.ligne + " [" + TYPES[p.type][0] + "] " + p.message + (p.alternative ? "\n  Correction : " + p.alternative.replace(/\n/g, "\n  ") : "");
      }).join("\n\n");
      var ok = function () { cp.textContent = "Rapport copié ✓"; };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, ok); else ok();
    });
    sortie.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("v-lancer").addEventListener("click", lancer);
  document.getElementById("v-effacer").addEventListener("click", function () { champ.value = ""; sortie.innerHTML = ""; champ.focus(); });
  document.querySelectorAll("[data-exemple]").forEach(function (b) {
    b.addEventListener("click", function () { champ.value = EXEMPLES[b.dataset.exemple]; selN.value = NIV_EX[b.dataset.exemple]; selL.value = "auto"; lancer(); });
  });
  champ.addEventListener("keydown", function (e) {
    if (e.key === "Tab") { e.preventDefault(); var s = champ.selectionStart; champ.value = champ.value.slice(0, s) + "  " + champ.value.slice(champ.selectionEnd); champ.selectionStart = champ.selectionEnd = s + 2; }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) lancer();
  });
  var p = new URLSearchParams(location.search);
  if (p.get("niveau")) selN.value = p.get("niveau");
})();
