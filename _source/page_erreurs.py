from lib import *

F = "erreurs.html"


def err(titre, faux, juste, lang, explication, niveau):
    return carte(titre, versus(faux, juste, lang, explication), f"{niveau}")


S = []

S.append(("html", "HTML5", "Les erreurs de structure les plus courantes dans les copies et les TP.", "".join([
    err("Mettre en forme avec des balises",
        '<p><b>Attention</b> : <i>date limite</i></p>',
        '<p><span class="alerte">Attention</span> : <span class="date">date limite</span></p>\n\n/* style.css */\n.alerte { font-weight: bold; }\n.date { font-style: italic; }',
        "html", "Le gras et l'italique relèvent du CSS (<code>font-weight</code>, <code>font-style</code>). Les balises de mise en forme ne sont pas dans l'annexe.", "Tous niveaux"),
    err("Utiliser &lt;button&gt; pour un contrôle JavaScript",
        '<button onclick="verifier()">Valider</button>',
        '<input type="button" value="Valider" onclick="verifier()">',
        "html", "La balise <code>&lt;button&gt;</code> n'est pas dans l'annexe : le bouton est un <code>input</code> de type <code>button</code>.", "3ème et 4ème"),
    err("Oublier l'attribut alt ou fermer mal les balises",
        '<img src="carthage.jpg">\n<p>Carthage<p>Dougga',
        '<img src="carthage.jpg" alt="Ruines de Carthage">\n<p>Carthage</p>\n<p>Dougga</p>',
        "html", "Deux erreurs signalées par le validateur W3C.", "Tous niveaux"),
    err("Boutons radio sans name commun",
        '<input type="radio" name="g1" value="F"> Fille\n<input type="radio" name="g2" value="G"> Garçon',
        '<input type="radio" name="genre" value="F"> Fille\n<input type="radio" name="genre" value="G"> Garçon',
        "html", "Avec deux <code>name</code> différents, les deux options peuvent être cochées en même temps.", "2ème"),
]), "balise b strong button alt radio name"))

S.append(("css", "CSS3", "Mise en page et effets : ce qui fonctionne mais sort de l'annexe, et ce qui ne fonctionne pas du tout.", "".join([
    err("Déclarer la transition sur :hover",
        '.menu a:hover {\n  background-color: gold;\n  transition: background-color 1s;\n}',
        '.menu a {\n  transition: background-color 1s;\n}\n.menu a:hover {\n  background-color: gold;\n}',
        "css", "Sur <code>:hover</code>, la transition ne joue qu'à l'aller : le retour est brutal. Elle se déclare sur l'élément.", "3ème"),
    err("Écrire plusieurs fois transform",
        '.logo:hover {\n  transform: rotate(10deg);\n  transform: scale(1.2);\n}',
        '.logo:hover {\n  transform: rotate(10deg) scale(1.2);\n}',
        "css", "La seconde déclaration écrase la première : seule la mise à l'échelle s'applique.", "3ème"),
    err("Animer left sans positionner l'élément",
        '.bus {\n  animation: rouler 4s infinite;\n}',
        '.bus {\n  position: relative;\n  animation: rouler 4s infinite;\n}',
        "css", "<code>left</code> et <code>top</code> sont sans effet sur un élément non positionné.", "3ème"),
    err("Utiliser Flexbox ou des unités hors programme",
        '.conteneur {\n  display: flex;\n  height: 100vh;\n  font-size: 1.2em;\n}',
        'html, body { height: 100%; }\n.gauche { float: left; width: 30%; height: 100%; }\n.droite { float: right; width: 68%; height: 100%; }\n.conteneur { font-size: 18px; }',
        "css", "Mise en page par <code>float</code> et <code>position</code> ; unités <code>px</code> et <code>%</code> uniquement.", "3ème et 4ème"),
]), "transition hover transform animation position flex vh em"))

S.append(("js", "JavaScript", "Les écarts à l'annexe qui coûtent des points à l'épreuve pratique.", "".join([
    err("charAt, substr et Math.floor",
        'let c = ch.charAt(0);\nlet debut = ch.substr(0, 3);\nlet n = Math.floor(Math.random() * 6) + 1;',
        'let c = ch[0];\nlet debut = ch.substring(0, 3);\nlet n = Math.trunc(Math.random() * 6) + 1;',
        "js", "Seules <code>ch[i]</code>, <code>substring</code> et <code>Math.trunc</code> figurent dans l'annexe.", "3ème et 4ème"),
    err("Continuer après une erreur",
        'if (nom == "") {\n  alert("Nom obligatoire");\n}\ndocument.getElementById("msg").innerHTML = "Inscrit";',
        'if (nom == "") {\n  alert("Nom obligatoire");\n  return;\n}\ndocument.getElementById("msg").innerHTML = "Inscrit";',
        "js", "Sans <code>return</code>, le message de succès s'affiche même quand la saisie est fausse.", "3ème et 4ème"),
    err("Tester « chiffres uniquement » avec isNaN",
        'if (isNaN(tel) || tel.length != 8) {\n  alert("Téléphone invalide");\n  return;\n}',
        'if (tel.length != 8 || !estChiffres(tel)) {\n  alert("Téléphone invalide");\n  return;\n}',
        "js", "<code>isNaN(\"1.5e3\")</code> et <code>isNaN(\" 12\")</code> renvoient <code>false</code> : des points, des espaces ou un exposant passent le test. Parcourir la chaîne avec <code>ch[i]</code>.", "3ème et 4ème"),
    err("Afficher le mois avec getMonth()",
        'let d = new Date();\nalert(d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear());',
        'let d = new Date();\nalert(d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear());',
        "js", "<code>getMonth()</code> renvoie 0 pour janvier. Les parenthèses évitent une concaténation « 9 » + « 1 » = « 91 ».", "3ème"),
    err("Additionner des valeurs de champs",
        'let total = document.getElementById("a").value + document.getElementById("b").value;',
        'let total = Number(document.getElementById("a").value) + Number(document.getElementById("b").value);',
        "js", "<code>value</code> est toujours une chaîne : « 12 » + « 8 » donne « 128 ».", "3ème"),
    err("Écrire readonly en JavaScript",
        'document.getElementById("cin").readonly = true;',
        'document.getElementById("cin").readOnly = true;',
        "js", "La propriété JavaScript s'écrit avec un O majuscule ; l'attribut HTML reste <code>readonly</code>.", "4ème"),
]), "charAt substr floor return isNaN getMonth Number readOnly"))

S.append(("sql", "SQL", "Syntaxe classique des jointures et fonctions de l'annexe.", "".join([
    err("Jointure avec JOIN",
        'SELECT E.nom, C.niveau\nFROM Eleve E JOIN Classe C ON E.idClasse = C.idClasse;',
        'SELECT E.nom, C.niveau\nFROM Eleve E, Classe C\nWHERE E.idClasse = C.idClasse;',
        "sql", "La jointure s'écrit dans <code>WHERE</code>.", "4ème"),
    err("Filtrer un agrégat avec WHERE",
        'SELECT idClasse, COUNT(*) FROM Eleve\nWHERE COUNT(*) > 25\nGROUP BY idClasse;',
        'SELECT idClasse, COUNT(*) FROM Eleve\nGROUP BY idClasse\nHAVING COUNT(*) > 25;',
        "sql", "Une condition sur un groupe va dans <code>HAVING</code>.", "4ème"),
    err("CURDATE et AUTO_INCREMENT",
        'CREATE TABLE Emprunt (id INT PRIMARY KEY AUTO_INCREMENT, d DATE);\nSELECT * FROM Emprunt WHERE d = CURDATE();',
        'CREATE TABLE Emprunt (id INT PRIMARY KEY, d DATE);\nSELECT * FROM Emprunt WHERE d = DATE(NOW());',
        "sql", "Ni <code>AUTO_INCREMENT</code> ni <code>CURDATE()</code> ne sont dans l'annexe.", "4ème"),
    err("Renommer une colonne",
        'ALTER TABLE Eleve RENAME COLUMN prenom TO prenomEleve;',
        'ALTER TABLE Eleve CHANGE prenom prenomEleve VARCHAR(30);',
        "sql", "<code>CHANGE</code> : ancien nom, nouveau nom, type.", "4ème"),
]), "JOIN HAVING WHERE CURDATE AUTO_INCREMENT RENAME CHANGE"))

S.append(("php", "PHP", "mysqli procédural, une connexion centralisée, aucun hachage.", "".join([
    err("PDO ou mysqli orienté objet",
        '$cnx = new PDO("mysql:host=localhost;dbname=ecole", "root", "");\n$cnx = new mysqli("localhost", "root", "", "ecole");',
        '$cnx = mysqli_connect("localhost", "root", "", "ecole")\n       or die("Connexion impossible");',
        "php", "Seules les fonctions <code>mysqli_*</code> procédurales sont au programme.", "4ème"),
    err("Lire $_POST sans tester isset",
        '$nom = $_POST["nom"];\necho "Bonjour " . $nom;',
        'if (isset($_POST["nom"])) {\n  $nom = $_POST["nom"];\n  echo "Bonjour " . $nom;\n}',
        "php", "Sans <code>isset</code>, l'ouverture directe de la page provoque un avertissement.", "4ème"),
    err("Hacher le mot de passe",
        '$mdp = md5($_POST["mdp"]);',
        '$mdp = $_POST["mdp"];',
        "php", "Le mot de passe est comparé tel quel à celui de la base : aucune fonction de hachage dans les supports.", "4ème"),
    err("Utiliser switch",
        'switch ($mention) {\n  case "TB": echo "Très bien"; break;\n}',
        'if ($mention == "TB") {\n  echo "Très bien";\n} else if ($mention == "B") {\n  echo "Bien";\n}',
        "php", "<code>switch</code> n'est pas au programme de PHP.", "4ème"),
]), "PDO mysqli isset POST md5 hachage switch"))


def generer(ecrire):
    som, corps = page_sections(F, S, numerote=False)
    ecrire(F, gabarit(F, "Erreurs fréquentes",
        "Les erreurs les plus courantes en HTML, CSS, JavaScript, SQL et PHP, avec le code incorrect et sa version conforme à l'annexe.",
        bandeau("Erreurs fréquentes", "Code incorrect à gauche, version conforme à droite. Les erreurs que l'on retrouve dans les copies, les TP et parfois dans les supports trouvés en ligne.",
                "Guide de correction", ["HTML5 · CSS3 · JavaScript · SQL · PHP", "22 cas commentés"]),
        f'<div class="page">{som}<div class="contenu">{corps}</div></div>'))
