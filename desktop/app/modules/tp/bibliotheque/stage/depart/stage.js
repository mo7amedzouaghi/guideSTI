// Code de vérification généré au chargement de la page
var codeCaptcha = "";

// Génère un code de 5 lettres majuscules aléatoires
function genererCaptcha() {
    var alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    codeCaptcha = "";
    for (var i = 0; i <= 5; i++) {
        codeCaptcha = codeCaptcha + alpha[Math.floor(Math.random() * 26)];
    }
    document.getElementById("code").innerHTML = codeCaptcha;
}

// Affiche la durée choisie dans l'élément output
function afficherDuree() {
    document.getElementById("aff").value = document.getElementById("duree").value;
}

// Vérifie qu'une chaîne non vide ne contient que des lettres et des espaces
function estAlpha(ch) {
    if (ch.length == 0) {
        return false;
    }
    ch = ch.toUpperCase();
    var i = 0;
    while (i < ch.length && ((ch.charAt(i) >= "A" && ch.charAt(i) <= "Z") || ch.charAt(i) == " ")) {
        i++;
    }
    return i == ch.length;
}

function verifier() {
    var nom = document.getElementById("nom").value;
    var prenom = document.getElementById("prenom").value;
    var dn = document.getElementById("dn").value;
    var spec = document.getElementById("spec").selectedIndex;
    var ville = document.getElementById("ville").value;
    var duree = Number(document.getElementById("duree").value);
    var cap = document.getElementById("cap").value;
    var d = new Date();

    if (estAlpha(nom) == false) {
        alert("Nom invalide : lettres et espaces uniquement.");
        return;
    }
    if (estAlpha(prenom) == false) {
        alert("Prénom invalide : lettres et espaces uniquement.");
    }

    if (dn == "") {
        alert("Saisir la date de naissance.");
        return;
    }
    var age = d.getFullYear() - Number(dn.substring(0, 2));
    if (age < 15 || age > 20) {
        alert("Stage réservé aux élèves âgés de 15 à 20 ans.");
        return;
    }

    if (spec == -1) {
        alert("Choisir une spécialité.");
        return;
    }

    if (ville == "") {
        alert("Saisir la ville.");
        return;
    }

    var niv = document.getElementsByName("niv");
    var i = 0;
    while (i <= niv.length && niv[i].checked == false) {
        i++;
    }
    if (i == niv.length) {
        alert("Choisir un niveau.");
        return;
    }

    if (cap != codeCaptcha) {
        alert("Code de vérification incorrect.");
        genererCaptcha();
        return;
    }

    // Succès : message de confirmation daté
    document.getElementById("resultat").innerHTML = "Inscription enregistrée le "
        + d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear()
        + " : " + prenom + " " + nom + " — " + document.getElementById("spec").value
        + " à " + ville + ", " + duree + " semaine(s), niveau " + niv[i].value + ".";
}
