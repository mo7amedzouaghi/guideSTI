"""Exercices auto-corrigés de l'espace élèves, conformes à l'annexe.
Types :
  qcm    : q, choix[], bonne (indice), expl
  vf     : q, rep (True/False), expl
  code   : q, code (avec ___ à compléter), attendu[] (réponses acceptées), expl
  erreur : q, lignes[], bonne (indice de la ligne fautive), expl
Clé : (niveau, numéro de chapitre)."""

def qcm(q, choix, bonne, expl): return dict(type="qcm", q=q, choix=choix, bonne=bonne, expl=expl)
def vf(q, rep, expl): return dict(type="vf", q=q, rep=rep, expl=expl)
def code(q, c, attendu, expl): return dict(type="code", q=q, code=c, attendu=attendu, expl=expl)
def erreur(q, lignes, bonne, expl): return dict(type="erreur", q=q, lignes=lignes, bonne=bonne, expl=expl)

EX = {}

# ============================================================ 2ème année
EX[("2", 1)] = [
    qcm("Quelle ligne doit toujours être la première d'une page HTML5 ?", ["<html>", "<!DOCTYPE html>", "<head>", "<meta charset=\"UTF-8\">"], 1,
        "<!DOCTYPE html> annonce au navigateur un document HTML5. Il précède <html>."),
    qcm("Où se place la balise <title> ?", ["Dans <body>", "Dans <head>", "Avant <html>", "Dans <h1>"], 1,
        "<title> est une information sur la page : elle va dans <head> et s'affiche dans l'onglet."),
    vf("Une page peut contenir plusieurs titres <h1>.", False,
       "On utilise un seul <h1> par page, puis <h2>, <h3>… pour hiérarchiser."),
    code("Complète pour que les lettres accentuées s'affichent correctement.", '<meta ___="UTF-8">', ["charset"],
         "L'attribut charset de <meta> fixe l'encodage des caractères."),
    qcm("Quelle balise trace une ligne de séparation horizontale ?", ["<br>", "<hr>", "<p>", "<line>"], 1,
        "<hr> sépare deux parties ; <br> ne fait qu'un retour à la ligne."),
    vf("Pour mettre un mot en gras, on utilise la balise <b>.", False,
       "La mise en forme se fait en CSS : font-weight: bold. Les balises de mise en forme ne sont pas dans l'annexe."),
    erreur("Le validateur W3C signale une erreur. Quelle ligne est fautive ?",
           ["<h1>Mon lycée</h1>", "<img src=\"lycee.jpg\">", "<p>Bienvenue</p>"], 1,
           "L'attribut alt est obligatoire sur <img> : <img src=\"lycee.jpg\" alt=\"Façade du lycée\">."),
]
EX[("2", 2)] = [
    qcm("Quelle balise crée une liste numérotée ?", ["<ul>", "<ol>", "<li>", "<dl>"], 1, "<ol> = ordered list, liste ordonnée."),
    qcm("Dans un tableau, quelle balise crée une ligne ?", ["<td>", "<th>", "<tr>", "<row>"], 2, "<tr> = table row. Les cellules <td> ou <th> se placent dedans."),
    vf("<th> sert aux cellules d'en-tête d'un tableau.", True, "<th> = table header : titre d'une colonne ou d'une ligne."),
    code("Complète pour que la numérotation commence à 5.", '<ol ___="5">', ["start"], "L'attribut start fixe le numéro du premier élément."),
    qcm("Quelle valeur de type numérote en chiffres romains majuscules ?", ["1", "A", "I", "i"], 2, "type=\"I\" : I, II, III… ; type=\"i\" : i, ii, iii…"),
    code("Complète pour donner un titre au tableau.", "<table>\n  <___>Emploi du temps</___>", ["caption"], "<caption> se place juste après <table>."),
    erreur("Quelle ligne est mal construite ?", ["<ul>", "  <li>Ordinateurs</li>", "  <td>Imprimante</td>", "</ul>"], 2,
           "Dans une liste, chaque élément est un <li>. <td> appartient aux tableaux."),
]
EX[("2", 3)] = [
    qcm("Quel attribut indique la destination d'un lien ?", ["src", "href", "target", "link"], 1, "href = adresse de destination."),
    qcm("Quelle valeur de target ouvre le lien dans un nouvel onglet ?", ["_self", "_top", "_blank", "_new"], 2, "_blank ouvre un nouvel onglet ou une nouvelle fenêtre."),
    vf("L'attribut alt est obligatoire sur une image.", True, "Sans alt, la page n'est pas valide W3C ; alt décrit l'image si elle ne s'affiche pas."),
    code("Complète pour afficher les boutons de lecture de la vidéo.", '<video src="visite.mp4" ___></video>', ["controls"], "controls affiche lecture, pause, volume."),
    qcm("La page contact.html est dans le dossier pages. Quel lien est correct depuis index.html (dossier parent) ?",
        ['href="contact.html"', 'href="pages/contact.html"', 'href="../contact.html"', 'href="/contact"'], 1, "Chemin relatif vers un sous-dossier : dossier/fichier."),
    vf("La balise <source> sert à donner le fichier d'une vidéo en 2ème année.", False, "<source> n'est pas dans l'annexe : le fichier est donné par l'attribut src de <video>."),
]
EX[("2", 4)] = [
    qcm("Pour que deux boutons radio s'excluent, ils doivent avoir :", ["le même id", "le même name", "le même value", "la même classe"], 1,
        "Les boutons radio d'un même groupe partagent le même name."),
    qcm("Quel type d'input efface tous les champs du formulaire ?", ["submit", "reset", "button", "clear"], 1, "reset remet le formulaire à son état initial."),
    code("Complète pour relier l'étiquette au champ d'id « nom ».", '<label ___="nom">Nom :</label>', ["for"], "L'attribut for de <label> reçoit l'id du champ."),
    vf("<textarea> permet de saisir un texte sur plusieurs lignes.", True, "rows et cols règlent sa taille visible."),
    qcm("Quelle balise donne un titre à un groupe de champs <fieldset> ?", ["<title>", "<caption>", "<legend>", "<label>"], 2, "<legend> nomme le fieldset."),
    code("Complète pour présélectionner l'option Manouba.", '<option value="Manouba" ___>Manouba</option>', ["selected"], "selected choisit l'option par défaut."),
    erreur("Quelle ligne n'est pas au programme de 2ème ?", ['<input type="text" name="nom">', '<input type="number" name="age">', '<input type="email" name="mail">', '<input type="checkbox" name="ok">'], 2,
           "Le type email est introduit en 3ème. En 2ème : text, number, radio, checkbox, submit, reset."),
]
EX[("2", 5)] = [
    qcm("Où s'écrit le CSS interne ?", ["Dans l'attribut style", "Dans <style> dans le <head>", "Dans un fichier .css", "Dans <body>"], 1,
        "CSS interne : balise <style> dans le <head>. Le fichier .css externe arrive en 3ème."),
    code("Complète pour mettre les paragraphes en gras.", "p {\n  font-weight: ___;\n}", ["bold"], "Valeurs de l'annexe : bold, bolder, lighter."),
    qcm("Quelle propriété aligne un texte au centre ?", ["align: center", "text-align: center", "center: true", "font-align: center"], 1, "text-align : left, center, right, justify."),
    code("Complète pour un fond jaune clair sur toute la page.", "body {\n  ___: lightyellow;\n}", ["background-color"], "background-color = couleur de fond."),
    vf("La syntaxe CSS est : sélecteur { propriété: valeur; }", True, "Chaque déclaration se termine par un point-virgule."),
    qcm("Quelles valeurs de background-repeat sont dans l'annexe ?", ["repeat, repeat-x, repeat-y", "no-repeat seulement", "cover, contain", "left, right"], 0,
        "L'annexe liste repeat, repeat-x et repeat-y."),
    erreur("Quelle déclaration contient une erreur ?", ["color: navy;", "font-size: 18px;", "border: 2px dashed gray", "text-align: justify;"], 2,
           "Il manque le point-virgule à la fin de la déclaration."),
]

# ============================================================ 3ème année
EX[("3", 1)] = [
    qcm("Quelle balise relie une feuille de style externe ?", ["<style>", "<link>", "<css>", "<script>"], 1, '<link rel="stylesheet" type="text/css" href="style.css">'),
    qcm("Quelle balise sémantique contient le menu de navigation ?", ["<header>", "<nav>", "<menu>", "<aside>"], 1, "<nav> regroupe les liens de navigation."),
    vf("Une page peut contenir plusieurs balises <main>.", False, "Un seul <main> par page : le contenu principal."),
    code("Complète pour qu'un lien s'ouvre dans l'iframe nommé « cadre ».", '<a href="carthage.html" ___="cadre">Carthage</a>', ["target"], "target reçoit le name de l'iframe."),
    qcm("Quelle balise associe une légende à une image dans <figure> ?", ["<caption>", "<legend>", "<figcaption>", "<label>"], 2, "<figcaption> est la légende de <figure>."),
    qcm("Quel événement se déclenche à chaque modification de la valeur d'un curseur range ?", ["onchange", "oninput", "onclick", "onblur"], 1,
        "oninput réagit à chaque modification ; onchange seulement quand la valeur est validée."),
    erreur("Quelle ligne n'est pas conforme à l'annexe ?", ['<input type="text" id="nom">', '<button onclick="verifier()">Valider</button>', '<p id="msg"></p>'], 1,
           'Le bouton s\'écrit <input type="button" value="Valider" onclick="verifier()">. <button> n\'est pas dans l\'annexe.'),
    code("Complète pour que le bloc <details> soit déplié à l'ouverture.", "<details ___>\n  <summary>Horaires</summary>", ["open"], "L'attribut open affiche le contenu dès le départ."),
]
EX[("3", 2)] = [
    qcm("Quel sélecteur cible l'élément d'id « titre » ?", [".titre", "#titre", "titre", "*titre"], 1, "# pour un id, . pour une classe."),
    qcm("Quel sélecteur cible tous les éléments de classe « alerte » ?", ["#alerte", ".alerte", "alerte", "[alerte]"], 1, "Une classe peut être donnée à plusieurs éléments."),
    code("Complète pour écrire le texte en majuscules.", "h1 {\n  text-transform: ___;\n}", ["uppercase"], "Valeurs : uppercase, lowercase, capitalize."),
    code("Complète pour des puces carrées.", "ul {\n  list-style-type: ___;\n}", ["square"], "Valeurs de l'annexe : circle, square, upper-roman, lower-alpha."),
    qcm("Quelle propriété fusionne les bordures des cellules d'un tableau ?", ["border-spacing", "border-collapse", "table-layout", "border-merge"], 1, "border-collapse: collapse;"),
    vf("En 3ème, on peut écrire font-size: 1.5em;", False, "Unités autorisées : px et %."),
    erreur("Quelle ligne est hors annexe ?", ["h2 { text-shadow: 2px 2px 3px gray; }", "a { text-decoration: none; }", "header { background-size: cover; }"], 1,
           "text-decoration n'est pas dans l'annexe."),
]
EX[("3", 3)] = [
    qcm("Dans le modèle de boîte, quelle propriété crée l'espace entre le contenu et la bordure ?", ["margin", "padding", "border", "width"], 1, "padding = marge intérieure ; margin = marge extérieure."),
    qcm("Comment placer deux blocs côte à côte en 3ème ?", ["display: flex", "float: left et float: right", "display: grid", "position: center"], 1, "Flexbox et Grid ne sont pas au programme : float et position."),
    code("Complète pour fixer le bandeau en haut de la fenêtre même pendant le défilement.", ".bandeau {\n  position: ___;\n  top: 0px;\n}", ["fixed"], "fixed fixe l'élément par rapport à la fenêtre."),
    vf("top et left agissent sur un élément en position static.", False, "Ils n'agissent que sur un élément positionné (relative, absolute, fixed, sticky)."),
    qcm("Quelle valeur d'overflow ajoute des barres de défilement ?", ["visible", "hidden", "scroll", "clip"], 2, "scroll affiche toujours les barres ; auto seulement si nécessaire."),
    code("Complète pour une transparence de moitié.", ".filigrane {\n  opacity: ___;\n}", ["0.5", ".5"], "opacity va de 0 (transparent) à 1 (opaque)."),
    qcm("Pour une hauteur de 80% de la page, que faut-il d'abord écrire ?", ["html, body { height: 100%; }", "body { height: 100vh; }", "* { height: auto; }", "rien"], 0,
        "Une hauteur en % exige une hauteur définie sur le parent. vh n'est pas au programme."),
]
EX[("3", 4)] = [
    qcm("Où se déclare la propriété transition ?", ["Dans la règle :hover", "Dans la règle de l'élément", "Dans @keyframes", "N'importe où"], 1,
        "Sur l'élément : ainsi l'effet joue à l'aller et au retour."),
    code("Complète : la largeur change en 2 secondes après 0,5 seconde.", ".carre {\n  transition: width ___ 0.5s;\n}", ["2s"], "Ordre : propriété durée délai."),
    erreur("Pourquoi seule la mise à l'échelle s'applique-t-elle ?", [".logo:hover {", "  transform: rotate(10deg);", "  transform: scale(1.2);", "}"], 2,
           "La 2e déclaration transform remplace la 1re. Écrire : transform: rotate(10deg) scale(1.2);"),
    qcm("Quelle fonction déplace un élément de 20px à droite ?", ["translateX(20px)", "translate(20px, 0px)", "move(20px)", "shift(20px)"], 1, "translateX n'est pas dans l'annexe : translate(x, y)."),
    code("Complète pour répéter l'animation sans fin.", ".bateau {\n  animation-iteration-count: ___;\n}", ["infinite"], "infinite = répétition infinie."),
    vf("Pour animer left, l'élément doit être positionné (par exemple position: relative).", True, "left n'a aucun effet sur un élément non positionné."),
    qcm("Quelle valeur fait aller et revenir l'animation ?", ["normal", "reverse", "alternate", "back"], 2, "animation-direction: alternate."),
]
EX[("3", 5)] = [
    qcm("Comment lire le texte saisi dans le champ d'id « nom » ?", ['document.getElementById("nom").value', 'document.getElementById("nom").innerHTML', 'nom.text', 'document.nom'], 0, ".value donne la valeur d'un champ."),
    code("Complète pour obtenir le premier caractère de ch.", "let c = ch[___];", ["0"], "Les indices commencent à 0. charAt() n'est pas dans l'annexe."),
    qcm("Que vaut \"12\" + 8 en JavaScript ?", ["20", "\"128\"", "NaN", "erreur"], 1, "Avec une chaîne, + concatène. Utiliser Number(\"12\") + 8 pour additionner."),
    code("Complète pour un entier aléatoire entre 1 et 6.", "let de = Math.___(Math.random() * 6) + 1;", ["trunc"], "Math.floor n'est pas dans l'annexe : Math.trunc."),
    qcm("new Date(\"2026-10-27\").getMonth() renvoie :", ["10", "9", "27", "2026"], 1, "getMonth() va de 0 (janvier) à 11 : octobre = 9. Afficher getMonth() + 1."),
    erreur("Le message de succès s'affiche même quand le nom est vide. Quelle ligne manque-t-il ?",
           ['if (nom == "") {', '  alert("Nom obligatoire");', "}", 'document.getElementById("msg").innerHTML = "Inscrit";'], 1,
           "Après alert(), il faut return; pour arrêter la fonction."),
    code("Complète pour extraire « Oued » de ch = \"Oued Ellil\".", "ch.___(0, 4)", ["substring"], "substring(d, f) : de d à f exclu. substr n'est pas dans l'annexe."),
    vf("console.log() sert à afficher un résultat à l'élève en 3ème.", False, "On affiche avec alert(), document.write() ou innerHTML."),
]
EX[("3", 6)] = [
    qcm("Dans la représentation textuelle, comment repère-t-on la clé primaire ?", ["Elle est suivie de #", "Elle est soulignée", "Elle est en majuscules", "Elle est entre parenthèses"], 1, "Clé primaire soulignée, clé étrangère suivie de #."),
    qcm("Une relation ∞:∞ entre Livre et Élève nécessite :", ["une clé étrangère dans Livre", "une table intermédiaire", "rien de plus", "une seule table"], 1, "Exemple : Emprunt(idLivre#, idEleve#, dateEmprunt)."),
    code("Complète pour trier par nom croissant.", "SELECT nom FROM Eleve ___ BY nom ASC;", ["order"], "ORDER BY … ASC (croissant) ou DESC (décroissant)."),
    code("Complète pour les noms qui commencent par « Ben ».", "SELECT nom FROM Eleve WHERE nom LIKE '___';", ["ben%"], "% remplace n'importe quelle suite de caractères."),
    qcm("Quel opérateur teste une valeur absente ?", ["= NULL", "IS NULL", "== NULL", "EMPTY"], 1, "On écrit IS NULL, jamais = NULL."),
    vf("En 3ème, on écrit les CREATE TABLE à la main.", False, "En 3ème, la base se crée en mode assisté dans phpMyAdmin."),
    erreur("Quelle requête n'est pas au programme de 3ème ?",
           ["SELECT * FROM Livre WHERE annee > 2000;", "SELECT nom FROM Eleve, Classe WHERE Eleve.idClasse = Classe.idClasse;", "DELETE FROM Eleve WHERE idEleve = 25;"], 1,
           "Une requête sur plusieurs tables (jointure) est au programme de 4ème."),
]

# ============================================================ 4ème année
EX[("4", 1)] = [
    code("Complète pour relier le champ à la liste de suggestions d'id « villes ».", '<input type="text" ___="villes">', ["list"], "list = id du <datalist>."),
    qcm("Quel événement se déclenche quand une touche est relâchée ?", ["onkeydown", "onkeyup", "onkeypress", "oninput"], 1, "onkeyup : touche relâchée."),
    qcm("Dans quel ordre écrire les pseudo-classes de lien ?", ["hover, link, active, visited", "link, visited, hover, active", "active, hover, visited, link", "n'importe lequel"], 1, "link, visited, hover, active."),
    code("Complète pour afficher l'image en noir et blanc.", "img {\n  filter: ___(100%);\n}", ["grayscale"], "Fonctions de l'annexe : blur(), grayscale(), invert()."),
    qcm("Quel sélecteur cible les champs obligatoires ?", ["input:required", "input[required]", "input.required", "#required"], 1, "Sélecteur d'attribut : element[attr]."),
    vf("onsubmit s'écrit sur la balise <form>, avec return.", True, '<form action="ajout.php" method="post" onsubmit="return verifier()">'),
]
EX[("4", 2)] = [
    qcm("Quelle méthode récupère tous les boutons radio name=\"niveau\" ?", ['getElementById("niveau")', 'getElementsByName("niveau")', 'querySelector("niveau")', 'getElementsByClassName("niveau")'], 1, "getElementsByName renvoie la liste ; on la parcourt avec une boucle."),
    code("Complète pour tester qu'aucune option réelle n'est choisie.", 'if (liste.___ == 0) {\n  alert("Choisir une option");\n  return;\n}', ["selectedIndex"], "La première option sert de consigne : selectedIndex == 0."),
    code("Complète pour rendre le champ « cin » non modifiable.", 'document.getElementById("cin").___ = true;', ["readOnly"], "En JavaScript : readOnly avec un O majuscule."),
    qcm("Comment lancer la lecture d'une vidéo d'id « v » ?", ['document.getElementById("v").play();', 'document.getElementById("v").start();', 'play("v");', 'v.run();'], 0, "Méthodes média de l'annexe : play() et pause()."),
    vf("En 4ème, on peut écrire le JavaScript directement dans la page avec <script>…</script>.", False, "En 4ème, le script est obligatoirement dans un fichier .js externe."),
    erreur("Quelle ligne contient une erreur ?", ['let t = document.getElementsByName("genre");', "for (let i = 0; i < t.length; i++) {", "  if (t[i].checked == true) {", "    choix = t.value;"], 3,
           "Il faut la valeur de l'élément coché : choix = t[i].value;"),
]
EX[("4", 3)] = [
    qcm("Quelle instruction ajoute une colonne à une table ?", ["ALTER TABLE t ADD col type;", "UPDATE TABLE t ADD col;", "INSERT COLUMN col INTO t;", "CREATE COLUMN col;"], 0, "ALTER TABLE … ADD."),
    code("Complète pour renommer prenom en prenomEleve (MySQL).", "ALTER TABLE Eleve ___ prenom prenomEleve VARCHAR(30);", ["change"], "CHANGE : ancien nom, nouveau nom, type."),
    vf("AUTO_INCREMENT fait partie de l'annexe.", False, "La clé primaire est saisie explicitement."),
    qcm("Que fait ON DELETE CASCADE ?", ["Empêche toute suppression", "Supprime aussi les lignes qui dépendent de la ligne supprimée", "Supprime la table", "Rien"], 1, "La suppression se propage aux lignes liées."),
    code("Complète la contrainte de clé étrangère.", "CONSTRAINT fk_e FOREIGN KEY (idClasse) ___ Classe(idClasse)", ["references"], "FOREIGN KEY (col) REFERENCES table(col)."),
    erreur("Quelle ligne est hors annexe ?", ["CREATE TABLE Eleve (", "  idEleve INT PRIMARY KEY AUTO_INCREMENT,", "  nom VARCHAR(30) NOT NULL", ");"], 1, "AUTO_INCREMENT n'est pas dans l'annexe."),
]
EX[("4", 4)] = [
    qcm("Une condition sur COUNT(*) s'écrit dans :", ["WHERE", "HAVING", "ORDER BY", "FROM"], 1, "WHERE filtre les lignes, HAVING filtre les groupes."),
    code("Complète la jointure classique.", "SELECT E.nom, C.niveau\nFROM Eleve E, Classe C\n___ E.idClasse = C.idClasse;", ["where"], "Tables dans FROM, condition de jointure dans WHERE. JOIN n'est pas dans l'annexe."),
    code("Complète pour la date du jour.", "SELECT * FROM Emprunt WHERE dateEmprunt = DATE(___());", ["now"], "CURDATE() n'est pas dans l'annexe : DATE(NOW())."),
    qcm("Quel est l'ordre correct des clauses ?", ["SELECT FROM WHERE GROUP BY HAVING ORDER BY", "SELECT WHERE FROM ORDER BY GROUP BY", "FROM SELECT WHERE HAVING", "SELECT FROM HAVING WHERE"], 0, "SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY."),
    qcm("DATEDIFF('2026-10-27', '2026-10-20') renvoie :", ["7", "-7", "27", "une date"], 0, "DATEDIFF(d1, d2) = d1 - d2 en jours."),
    vf("Une sous-requête corrélée est au programme de 4ème.", False, "Seules les sous-requêtes non corrélées (exécutables seules) sont au programme."),
]
EX[("4", 5)] = [
    qcm("Quelle fonction ouvre la connexion à MySQL ?", ["mysqli_open()", "mysqli_connect()", "new PDO()", "mysql_start()"], 1, "mysqli procédural uniquement."),
    code("Complète pour concaténer en PHP.", 'echo "Bonjour " ___ $nom;', ["."], "En PHP, la concaténation se fait avec le point."),
    code("Complète pour vérifier que le formulaire a été envoyé.", 'if (___($_POST["nom"])) {', ["isset"], "isset() teste l'existence de la variable."),
    qcm("Quelle fonction donne le nombre de lignes d'un résultat SELECT ?", ["mysqli_affected_rows()", "mysqli_num_rows()", "count()", "mysqli_rows()"], 1, "mysqli_affected_rows() concerne INSERT, UPDATE, DELETE."),
    vf("Le mot de passe saisi est haché avec md5() avant la comparaison.", False, "Dans les supports, le mot de passe est comparé tel quel, sans hachage."),
    erreur("Quelle ligne est hors annexe ?", ['require("connexion.php");', '$res = mysqli_query($cnx, $req);', 'while ($l = mysqli_fetch_assoc($res)) {', '  echo $l["nom"];'], 2,
           "mysqli_fetch_assoc() n'est pas dans l'annexe : mysqli_fetch_array() ou mysqli_fetch_row()."),
    code("Complète : substr(\"Oued Ellil\", 0, ___) doit donner « Oued ».", 'echo substr("Oued Ellil", 0, ___);', ["4"], "En PHP, le 3e paramètre de substr est une longueur."),
]
