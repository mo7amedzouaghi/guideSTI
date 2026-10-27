from lib import *

N = Niveau("4", "niveau-4.html")

# =====================================================================
N.module("Compléments HTML5 et CSS3",
         "Suggestions de saisie, nouveaux événements, sélecteurs avancés et filtres d'images.")

N.notion("Liste de suggestions : datalist", f"""
<p><code>&lt;datalist&gt;</code> propose des valeurs pendant la saisie, tout en laissant l'utilisateur taper autre chose. Il est relié au champ par l'attribut <code>list</code>.</p>
{duo(code('''<label for="ville">Ville :</label>
<input type="text" id="ville" name="ville" list="villes">
<datalist id="villes">
  <option value="Tunis">
  <option value="Sousse">
  <option value="Sfax">
</datalist>''', "html"),
apercu('<label for="ville">Ville :</label> <input type="text" id="ville" list="villes"><datalist id="villes"><option value="Tunis"><option value="Sousse"><option value="Sfax"></datalist>', haut=90,
       legende="Cliquez dans le champ pour voir les suggestions."))}
""", "datalist list option suggestion saisie")

N.notion("Nouveaux événements", f"""
{tableau(["Événement", "Se déclenche quand…"], [
    (c("onmouseover / onmouseout"), "le pointeur entre dans l'élément / en sort"),
    (c("onkeydown / onkeyup"), "une touche est enfoncée / relâchée"),
    (c("onplay / onpause"), "la lecture d'un média démarre / est suspendue"),
    (c("onsubmit"), "le formulaire est envoyé (sur &lt;form&gt;, avec <code>return</code>)")])}
{duo(code('''<img id="carte" src="carte.png" alt="Carte"
     onmouseover="agrandir()" onmouseout="reduire()">

<input id="cin" onkeyup="compter()">
<span id="nb">0</span> / 8 chiffres''', "html"),
apercu('<script>function compter(){document.getElementById("nb").innerHTML=document.getElementById("cin").value.length}</script>CIN : <input id="cin" onkeyup="compter()" maxlength="8"> <span id="nb">0</span> / 8 chiffres', haut=70,
       legende="Tapez dans le champ."))}
""", "onmouseover onmouseout onkeydown onkeyup onplay onpause onsubmit événement")

N.notion("Pseudo-classes et sélecteurs avancés", f"""
{duo(code('''a:link    { color: #1D4ED8; }  /* non visité   */
a:visited { color: #5B2C9F; }  /* visité       */
a:hover   { color: #D35400; }  /* survolé      */
a:active  { color: #C62828; }  /* au clic      */
input:focus { border: 2px solid #F5B800; }

input[required]     { border-left: 4px solid red; }
input[type="email"] { width: 250px; }
p.note              { color: gray; }''', "css"),
apercu('<style>a:link{color:#1D4ED8}a:visited{color:#5B2C9F}a:hover{color:#D35400}a:active{color:#C62828}input:focus{border:2px solid #F5B800;outline:none}input[required]{border-left:4px solid red}input[type="email"]{width:200px}p.note{color:gray}body{font:14px Arial}</style><a href="#">Lien du menu</a><br><br><input required placeholder="obligatoire"> <input type="email" placeholder="e-mail"><p class="note">Les champs bordés de rouge sont obligatoires.</p>', haut=120))}
{enc("info", "<p>Ordre conseillé des pseudo-classes de lien : <b>link, visited, hover, active</b>.</p>")}
""", "a:link a:visited a:hover a:active :focus pseudo-classe sélecteur attribut element.class")

N.notion("Filtres et transformations", f"""
{duo(code('''.photo {
  filter: grayscale(100%);
  transition: filter 1s;
}
.photo:hover {
  filter: blur(2px);
}
.negatif {
  filter: invert(100%);
}''', "css"),
apercu('<style>.p{width:110px;height:70px;display:inline-grid;place-items:center;margin:4px;font:bold 13px Arial;color:#fff;background:linear-gradient(135deg,#1D4ED8,#F5B800,#C62828);border-radius:6px}.photo{filter:grayscale(100%);transition:filter 1s}.photo:hover{filter:blur(2px)}.negatif{filter:invert(100%)}</style><div class="p">original</div><div class="p photo">grayscale</div><div class="p negatif">invert</div>', haut=100,
       legende="Survolez l'image grise pour le flou."))}
""", "filter blur grayscale invert filtre image")

N.bloc(retenir([
    "<code>datalist</code> se relie au champ par <code>list</code> = <code>id</code> du datalist.",
    "<code>onsubmit</code> s'écrit sur la balise <code>form</code>, avec <code>return</code>.",
    "Pseudo-classes de lien dans l'ordre link, visited, hover, active.",
], css=[
    ("filter", "blur(), grayscale(), invert()", "grayscale(100%)", "Filtre graphique appliqué à l'élément"),
    ("transform", "rotate(), scale(), translate(), skew()", "—", "Transformation 2D (sur une seule ligne)"),
], autres=[("Sélecteurs de 4ème", ["Sélecteur", "Cible"], [
    (c("a:link / a:visited"), "Liens non visités / visités"), (c("a:hover / a:active"), "Survol / clic"),
    (c(":focus"), "Élément ayant le focus"), (c("element[attr]"), "Éléments possédant l'attribut"),
    (c("element[attr=valeur]"), "Éléments dont l'attribut a cette valeur"), (c("element.class"), "Éléments de ce type avec cette classe")])]),
    "À retenir — compléments HTML/CSS", "filter pseudo-classes")

# =====================================================================
N.module("JavaScript avancé",
         "Parcourir des groupes de boutons radio, modifier attributs et styles, piloter un média, préparer l'envoi vers PHP.")

N.notion("Script externe obligatoire", f"""
<p>En 4ème, tout le code JavaScript est dans un fichier <code>.js</code> relié par <code>&lt;script src&gt;</code>. Aucun script interne dans la page.</p>
{versus('<script>\n  function verifier() { … }\n</script>', '<script src="js/controle.js"></script>', "html")}
""", "script externe src fichier js")

N.notion("Groupe de boutons radio : getElementsByName", f"""
{duo(code('''function choixFiliere() {
  let options = document.getElementsByName("filiere");
  let choix = "";
  for (let i = 0; i < options.length; i++) {
    if (options[i].checked) {
      choix = options[i].value;
    }
  }
  if (choix == "") {
    alert("Choisissez une filière");
    return;
  }
  document.getElementById("res").innerHTML = "Filière : " + choix;
}''', "js", "js/controle.js"),
apercu('<script>function choixFiliere(){let o=document.getElementsByName("filiere");let c="";for(let i=0;i<o.length;i++){if(o[i].checked){c=o[i].value}}if(c==""){alert("Choisissez une filière");return}document.getElementById("res").innerHTML="Filière : "+c}</script><style>body{font:14px Arial}</style><input type="radio" name="filiere" value="Informatique"> Informatique <input type="radio" name="filiere" value="Sciences"> Sciences <input type="radio" name="filiere" value="Lettres"> Lettres<br><input type="button" value="Valider" onclick="choixFiliere()"><p id="res"></p>', haut=100))}
""", "getElementsByName radio checked boucle parcourir groupe")

N.notion("Liste déroulante : selectedIndex", f"""
{duo(code('''function verifierGouv() {
  let liste = document.getElementById("gouv");
  if (liste.selectedIndex == 0) {
    alert("Choisissez un gouvernorat");
    return;
  }
  document.getElementById("res").innerHTML =
    "Choix : " + liste.value;
}''', "js", "js/controle.js"),
apercu('<script>function verifierGouv(){let l=document.getElementById("gouv");if(l.selectedIndex==0){alert("Choisissez un gouvernorat");return}document.getElementById("res").innerHTML="Choix : "+l.value}</script><style>body{font:14px Arial}</style><select id="gouv"><option value="">-- Choisir --</option><option value="Manouba">Manouba</option><option value="Ariana">Ariana</option></select> <input type="button" value="Valider" onclick="verifierGouv()"><p id="res"></p>', haut=90))}
{enc("info", "<p>L'option 0 (« -- Choisir -- ») sert de message : <code>selectedIndex == 0</code> signifie qu'aucun vrai choix n'a été fait.</p>")}
""", "selectedIndex select liste déroulante option")

N.notion("Modifier attributs, styles et médias", f"""
<p>Syntaxe générale : <code>element.attribut = valeur</code>, <code>element.style.propriété = valeur</code>, <code>element.méthode()</code>.</p>
{duo(code('''let v = document.getElementById("video");
let img = document.getElementById("img");
let ok = document.getElementById("accord");
let btn = document.getElementById("envoyer");

ok.checked = true;            // attribut
btn.disabled = false;
document.getElementById("cin").readOnly = true;
img.src = "images/kairouan.jpg";
v.muted = true;

img.style.width = "200px";    // style
img.style.border = "3px solid gold";

v.play();                     // méthodes média
v.pause();''', "js", "js/script.js"),
apercu('<script>function activer(){let b=document.getElementById("envoyer");b.disabled=!document.getElementById("accord").checked;document.getElementById("cadre").style.border=b.disabled?"2px dashed #999":"3px solid gold";document.getElementById("cadre").style.background=b.disabled?"#fff":"#fff6d6"}</script><style>body{font:14px Arial}#cadre{padding:10px;border:2px dashed #999;border-radius:8px}</style><div id="cadre"><input type="checkbox" id="accord" onclick="activer()"> J\'accepte le règlement<br><br><input type="button" id="envoyer" value="Envoyer" disabled></div>', haut=120,
       legende="Cochez la case : le bouton s'active et le style du cadre change."))}
{tableau(["Propriété JS", "Effet"], [
    (c("value"), "Valeur d'un champ"), (c("checked"), "Case cochée ou non"), (c("disabled"), "Élément désactivé"),
    (c("readOnly"), "Champ en lecture seule (attention à la majuscule O)"), (c("src"), "Source d'une image ou d'un média"),
    (c("muted"), "Son coupé"), (c("style.propriété"), "Modifie une propriété CSS (color, background, border, font, width, height)"),
    (c("play() / pause()"), "Lecture / pause d'un média")])}
""", "attribut value checked disabled readOnly src muted style play pause modifier")

N.notion("Contrôler avant l'envoi vers PHP", f"""
<p>Quand le formulaire part vers une page PHP, le contrôle se branche sur <code>onsubmit</code> de la balise <code>form</code> : la fonction renvoie <code>false</code> pour bloquer l'envoi, <code>true</code> pour l'autoriser.</p>
{code('''<form action="inscription.php" method="post" onsubmit="return verifier()">
  <input type="text" id="nom" name="nom">
  <input type="submit" value="S'inscrire">
</form>''', "html", "inscription.html")}
{code('''function verifier() {
  let nom = document.getElementById("nom").value;
  if (nom.length < 3) {
    alert("Nom trop court");
    return false;
  }
  return true;
}''', "js", "js/controle.js")}
""", "onsubmit return false true envoi formulaire php")

N.bloc(retenir([
    "Script toujours externe en 4ème.",
    "Groupe radio : <code>getElementsByName</code> + boucle sur <code>checked</code>.",
    "Liste déroulante : tester <code>selectedIndex</code>.",
    "<code>onsubmit=\"return verifier()\"</code> pour un envoi vers PHP.",
], js=[
    ("document.getElementsByName(n)", "Renvoie la liste des éléments ayant ce name"),
    ("element.attribut = valeur", "Modifie un attribut (value, checked, disabled, readOnly, src, muted)"),
    ("element.style.propriété = valeur", "Modifie une propriété CSS de l'élément"),
    ("element.play() / pause()", "Lance / suspend un média"),
    ("selectedIndex", "Indice de l'option choisie dans une liste"),
]), "À retenir — JavaScript avancé", "getElementsByName selectedIndex")

# =====================================================================
N.module("SQL : définition des données",
         "Écrire soi-même la création de la base, des tables, des contraintes et leurs modifications.")

N.notion("Créer et supprimer une base", f"""
{code('''CREATE DATABASE ecole;
DROP DATABASE ecole;''', "sql")}
""", "CREATE DATABASE DROP DATABASE base")

N.notion("Créer une table avec ses contraintes", f"""
{code('''CREATE TABLE Classe (
  idClasse VARCHAR(10) PRIMARY KEY,
  niveau   INT NOT NULL
);

CREATE TABLE Eleve (
  idEleve   INT,
  nom       VARCHAR(30) NOT NULL,
  prenom    VARCHAR(30) NOT NULL,
  dateNais  DATE,
  moyenne   DECIMAL(4,2) CHECK (moyenne BETWEEN 0 AND 20),
  ville     VARCHAR(30) DEFAULT 'Manouba',
  email     VARCHAR(60) UNIQUE,
  idClasse  VARCHAR(10),
  CONSTRAINT pk_eleve PRIMARY KEY (idEleve),
  CONSTRAINT fk_eleve_classe FOREIGN KEY (idClasse)
    REFERENCES Classe(idClasse)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);''', "sql")}
{enc("att", "<p><code>AUTO_INCREMENT</code> n'est pas dans l'annexe : la clé primaire est saisie explicitement.</p>")}
""", "CREATE TABLE PRIMARY KEY FOREIGN KEY REFERENCES CONSTRAINT NOT NULL UNIQUE DEFAULT CHECK ON DELETE CASCADE ON UPDATE CASCADE")

N.notion("Modifier la structure : ALTER TABLE", f"""
{code('''-- Ajouter une colonne
ALTER TABLE Eleve ADD tel VARCHAR(8);

-- Supprimer une colonne
ALTER TABLE Eleve DROP tel;

-- Renommer une colonne / changer son type (MySQL)
ALTER TABLE Eleve CHANGE prenom prenomEleve VARCHAR(40);

-- Ajouter / supprimer une contrainte
ALTER TABLE Eleve ADD CONSTRAINT uq_nom UNIQUE (nom, prenomEleve);
ALTER TABLE Eleve DROP CONSTRAINT uq_nom;

-- Supprimer une table
DROP TABLE Eleve;''', "sql")}
{enc("info", "<p>L'annexe mentionne aussi <code>ALTER TABLE t ALTER colonne type</code> et <code>ALTER TABLE t RENAME nom1 TO nom2</code>. Sous MySQL, ces formes ne s'exécutent pas pour modifier une colonne : on enseigne <code>CHANGE</code> (ancien nom, nouveau nom, type).</p>")}
""", "ALTER TABLE ADD DROP CHANGE CONSTRAINT DROP TABLE modifier colonne renommer")

N.bloc(retenir([
    "Clé primaire et clé étrangère se déclarent avec <code>CONSTRAINT nom</code>.",
    "<code>ON DELETE / ON UPDATE CASCADE</code> propage les suppressions et modifications.",
    "Renommer ou retyper une colonne : <code>CHANGE</code>.",
    "Pas d'<code>AUTO_INCREMENT</code>.",
], autres=[("Instructions de définition", ["Instruction", "Syntaxe (annexe)"], [
    (c("CREATE DATABASE"), c("CREATE DATABASE nom")), (c("DROP DATABASE"), c("DROP DATABASE nom")),
    (c("CREATE TABLE"), c("CREATE TABLE t (col type [contrainte], …, [CONSTRAINT nom] contrainte)")),
    (c("ALTER TABLE … ADD"), c("ALTER TABLE t ADD col type [contrainte]")),
    (c("ALTER TABLE … DROP"), c("ALTER TABLE t DROP col")),
    (c("ALTER TABLE … ADD CONSTRAINT"), c("ALTER TABLE t ADD CONSTRAINT nom contrainte")),
    (c("ALTER TABLE … DROP CONSTRAINT"), c("ALTER TABLE t DROP CONSTRAINT nom")),
    (c("DROP TABLE"), c("DROP TABLE t"))])]), "À retenir — définition des données", "sql ldd")

# =====================================================================
N.module("SQL : interrogation avancée",
         "Calculer des statistiques, regrouper, relier plusieurs tables et imbriquer des requêtes.")

N.notion("Fonctions d'agrégation, GROUP BY et HAVING", f"""
{code('''-- Statistiques globales
SELECT COUNT(*) AS nbEleves, AVG(moyenne) AS moyClasse,
       MIN(moyenne), MAX(moyenne)
FROM Eleve;

-- Par groupe
SELECT idClasse, COUNT(*) AS effectif
FROM Eleve
GROUP BY idClasse
HAVING COUNT(*) > 25
ORDER BY effectif DESC;''', "sql")}
{enc("astuce", "<p><code>WHERE</code> filtre les lignes <b>avant</b> le regroupement, <code>HAVING</code> filtre les groupes <b>après</b>.</p>")}
""", "COUNT SUM AVG MIN MAX GROUP BY HAVING agrégation regroupement")

N.notion("Jointures (syntaxe classique)", f"""
<p>Les tables sont listées dans <code>FROM</code>, la condition de jointure s'écrit dans <code>WHERE</code>. Pas de mot-clé <code>JOIN</code>.</p>
{code('''SELECT E.nom, E.prenom, C.niveau
FROM Eleve E, Classe C
WHERE E.idClasse = C.idClasse
  AND C.niveau = 4;

-- Trois tables
SELECT L.titre, E.nom, P.dateEmprunt
FROM Livre L, Eleve E, Emprunt P
WHERE P.idLivre = L.idLivre
  AND P.idEleve = E.idEleve;''', "sql")}
""", "jointure FROM WHERE plusieurs tables alias classique")

N.notion("Sous-requêtes non corrélées", f"""
{code('''-- Élèves dont la moyenne dépasse la moyenne générale
SELECT nom, moyenne
FROM Eleve
WHERE moyenne > (SELECT AVG(moyenne) FROM Eleve);

-- Livres jamais empruntés
SELECT titre FROM Livre
WHERE idLivre NOT IN (SELECT idLivre FROM Emprunt);''', "sql")}
{enc("att", "<p>La sous-requête doit pouvoir s'exécuter seule : les sous-requêtes corrélées (qui utilisent une colonne de la requête principale) sont hors programme.</p>")}
""", "sous-requête imbriquée IN NOT IN non corrélée")

N.notion("Fonctions sur les dates", f"""
{code('''SELECT nom, YEAR(dateNais) FROM Eleve;
SELECT * FROM Emprunt WHERE MONTH(dateEmprunt) = 10;
SELECT DAY(NOW());
SELECT * FROM Emprunt WHERE dateEmprunt = DATE(NOW());          -- aujourd'hui
SELECT idLivre, ADDDATE(dateEmprunt, 15) AS retourPrevu FROM Emprunt;
SELECT idLivre, DATEDIFF(DATE(NOW()), dateEmprunt) AS jours FROM Emprunt;''', "sql")}
{enc("att", "<p><code>CURDATE()</code> n'est pas dans l'annexe : la date du jour s'écrit <code>DATE(NOW())</code>.</p>")}
""", "DATE DAY MONTH YEAR NOW ADDDATE DATEDIFF date du jour")

N.bloc(retenir([
    "Ordre des clauses : SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY.",
    "Jointure : tables dans FROM, condition dans WHERE.",
    "Sous-requête non corrélée seulement.",
    "Date du jour : <code>DATE(NOW())</code>.",
], autres=[("Fonctions SQL", ["Fonction", "Rôle"], [
    (c("COUNT()"), "Nombre de lignes"), (c("SUM()"), "Somme"), (c("AVG()"), "Moyenne"),
    (c("MIN() / MAX()"), "Minimum / maximum"), (c("DATE()"), "Partie date d'un DATETIME"),
    (c("DAY() / MONTH() / YEAR()"), "Jour, mois, année"), (c("NOW()"), "Date et heure courantes"),
    (c("ADDDATE(d, n)"), "Ajoute n jours (ou un INTERVAL)"), (c("DATEDIFF(d1, d2)"), "Nombre de jours entre deux dates")])]),
    "À retenir — interrogation", "sql agrégats jointures")

# =====================================================================
N.module("PHP et MySQL",
         "Produire des pages dynamiques : recevoir les données d'un formulaire et dialoguer avec la base en mysqli procédural.")

N.notion("Bases du langage PHP", f"""
{code('''<?php
  $nom = "Yassine";             // string
  $age = 17;                    // int
  $moyenne = 14.75;             // float
  $admis = true;                // bool
  $notes = array(12, 15, 9);    // array

  $n = (int) "42";              // transtypage : (int) (float) (string) (bool) (array)

  echo "Bonjour " . $nom;       // concaténation avec le point

  if ($moyenne >= 10 && $age < 20) {
    echo "Admis";
  } else {
    echo "Ajourné";
  }

  for ($i = 0; $i < count($notes); $i++) {
    echo $notes[$i] . " ";
  }
?>''', "php", "bases.php")}
{enc("att", "<p>Pas de <code>switch</code> ni de <code>var_dump()</code> en PHP : on utilise <code>if / else if</code> et <code>echo</code>.</p>")}
""", "php variable echo concaténation if for while array count transtypage")

N.notion("Fonctions PHP de l'annexe", f"""
{code('''<?php
  abs(-3);  sqrt(16);  round(2.567, 2);  rand(1, 6);

  strlen("Tunis");                  // 5
  substr("Oued Ellil", 0, 4);       // "Oued"
  strpos("Oued Ellil", "E");        // 5
  strcmp("abc", "abd");             // < 0
  str_replace("Oued", "Wed", $ch);
  strtoupper($ch);  strtolower($ch);  trim($ch);
  ord("A");  chr(65);

  date("d/m/Y");                    // 27/10/2026
  time();                           // timestamp actuel
  strtotime("2026-12-31");
  checkdate(2, 30, 2026);           // false
?>''', "php")}
""", "abs sqrt round rand strlen substr strpos strcmp str_replace strtoupper strtolower trim ord chr date time strtotime checkdate")

N.notion("Recevoir des données : $_GET, $_POST, isset", f"""
{duo(code('''<?php
  if (isset($_POST["nom"])) {
    $nom = $_POST["nom"];
    $classe = $_POST["classe"];
    echo "Bienvenue " . $nom . " (" . $classe . ")";
  } else {
    echo "Formulaire non envoyé";
  }
?>''', "php", "inscription.php"),
code('''<!-- Lien avec paramètre -->
<a href="fiche.php?id=12">Voir la fiche</a>

<?php
  // fiche.php
  $id = $_GET["id"];
?>''', "php", "liste.php"))}
""", "$_GET $_POST isset formulaire paramètre url")

N.notion("Cycle mysqli : connexion, requête, fermeture", f"""
<p>La connexion est écrite une fois dans <code>connexion.php</code>, puis importée par <code>require</code> dans chaque page.</p>
{code('''<?php
  $cnx = mysqli_connect("localhost", "root", "", "ecole")
         or die("Connexion impossible");
?>''', "php", "connexion.php")}
{code('''<?php
  require("connexion.php");

  $req = "SELECT nom, prenom, moyenne FROM Eleve ORDER BY moyenne DESC";
  $res = mysqli_query($cnx, $req) or die(mysqli_error($cnx));

  echo "<p>" . mysqli_num_rows($res) . " élève(s)</p>";
  echo "<table border='1'>";
  while ($ligne = mysqli_fetch_array($res)) {
    echo "<tr><td>" . $ligne["nom"] . "</td><td>" . $ligne["prenom"]
       . "</td><td>" . $ligne["moyenne"] . "</td></tr>";
  }
  echo "</table>";

  mysqli_close($cnx);
?>''', "php", "liste.php")}
""", "mysqli_connect mysqli_query mysqli_fetch_array mysqli_num_rows mysqli_close mysqli_error require connexion.php die")

N.notion("Ajouter, modifier, supprimer", f"""
{code('''<?php
  require("connexion.php");

  $id = $_POST["id"];
  $nom = $_POST["nom"];
  $prenom = $_POST["prenom"];

  $req = "INSERT INTO Eleve (idEleve, nom, prenom) VALUES ($id, '$nom', '$prenom')";
  mysqli_query($cnx, $req) or die(mysqli_error($cnx));

  if (mysqli_affected_rows($cnx) == 1) {
    echo "Élève ajouté";
  }

  // UPDATE Eleve SET nom = '$nom' WHERE idEleve = $id
  // DELETE FROM Eleve WHERE idEleve = $id

  mysqli_close($cnx);
?>''', "php", "ajout.php")}
""", "INSERT UPDATE DELETE mysqli_affected_rows ajout modification suppression php")

N.notion("Authentification", f"""
<p>Le mot de passe saisi est comparé <b>tel quel</b> à celui de la base, sans hachage. On vérifie qu'exactement une ligne correspond.</p>
{code('''<?php
  require("connexion.php");

  $login = $_POST["login"];
  $mdp = $_POST["mdp"];

  $req = "SELECT nom FROM Utilisateur WHERE login = '$login' AND mdp = '$mdp'";
  $res = mysqli_query($cnx, $req) or die(mysqli_error($cnx));

  if (mysqli_num_rows($res) == 1) {
    $ligne = mysqli_fetch_row($res);
    echo "Bienvenue " . $ligne[0];
  } else {
    echo "Login ou mot de passe incorrect";
  }
  mysqli_close($cnx);
?>''', "php", "connexion_utilisateur.php")}
""", "authentification login mot de passe mysqli_fetch_row mysqli_num_rows")

N.bloc(retenir([
    "mysqli procédural uniquement : jamais PDO ni <code>new mysqli()</code>.",
    "Connexion centralisée dans <code>connexion.php</code>, importée par <code>require</code>.",
    "Toujours tester <code>isset()</code> avant de lire <code>$_POST</code>.",
    "Mot de passe comparé tel quel, sans hachage.",
], js=[
    ("mysqli_connect(h, u, p, b)", "Ouvre la connexion au serveur et à la base"),
    ("mysqli_query(cnx, req)", "Exécute une requête SQL"),
    ("mysqli_fetch_array(res)", "Ligne suivante (indices numériques et noms de colonnes)"),
    ("mysqli_fetch_row(res)", "Ligne suivante (indices numériques)"),
    ("mysqli_num_rows(res)", "Nombre de lignes d'un SELECT"),
    ("mysqli_affected_rows(cnx)", "Lignes touchées par INSERT, UPDATE, DELETE"),
    ("mysqli_error(cnx)", "Message de la dernière erreur"),
    ("mysqli_close(cnx)", "Ferme la connexion"),
    ("die(msg)", "Affiche un message et arrête le script"),
    ("isset($var)", "Vrai si la variable existe"),
    ("require(fichier)", "Importe un fichier PHP"),
]), "À retenir — PHP et MySQL", "php mysqli")

# =====================================================================
N.module("Limites du programme et progression",
         "Ce qui ne s'enseigne pas en 4ème, et une organisation possible vers l'épreuve pratique du bac.")

N.bloc(interdits("À ne pas enseigner en 4ème année", [
    "PDO, new mysqli(), requêtes préparées<small>mysqli procédural uniquement</small>",
    "Sessions et cookies",
    "switch et var_dump() en PHP",
    "Hachage des mots de passe<small>md5, password_hash…</small>",
    "AUTO_INCREMENT, CURDATE()<small>DATE(NOW())</small>",
    "JOIN explicite<small>syntaxe classique avec WHERE</small>",
    "Sous-requêtes corrélées",
    "Attribut pattern, console.log()",
    "Script JavaScript interne<small>fichier .js externe obligatoire</small>",
    "Upload de fichiers, AJAX, JSON",
]), "Interdits", "interdits 4ème")

N.bloc(f"""<article class="notion" id="m6-progression"><div class="notion-tete"><h3>Progression suggérée</h3><span class="annexe-tag">Proposition</span></div><div class="notion-corps">
{tableau(["Trimestre", "Contenu", "Production"], [
    ("1er", "Rappels HTML/CSS/JS, compléments 4ème, SQL : définition des données", "Formulaire contrôlé + script de création de la base"),
    ("2ème", "SQL : agrégats, jointures, sous-requêtes, dates ; PHP : bases, $_GET, $_POST", "Pages de consultation et d'ajout"),
    ("3ème", "PHP + MySQL complet, authentification, sujets de bac pratique", "Mini-application complète (liste, ajout, modification, suppression)")])}
</div></article>""", "Progression suggérée", "progression bac pratique")

PAGE = N
