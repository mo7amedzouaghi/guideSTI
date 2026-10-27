from lib import *

N = Niveau("2", "niveau-2.html")

# =====================================================================
N.module("Structure d'une page HTML5",
         "La charpente de toute page web : le squelette obligatoire, les titres, les paragraphes et la validation W3C.")

N.notion("Le squelette obligatoire", f"""
<p>Toute page commence par le même squelette. L'élève doit savoir l'écrire de mémoire et expliquer le rôle de chaque ligne : le <b>&lt;head&gt;</b> décrit la page (encodage, titre de l'onglet), le <b>&lt;body&gt;</b> contient ce que le visiteur voit.</p>
{duo(code('''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Mon lycée</title>
</head>
<body>
  <h1>Lycée Oued Ellil</h1>
  <p>Bienvenue sur le site de notre lycée.</p>
</body>
</html>''', "html", "index.html"),
apercu('<h1>Lycée Oued Ellil</h1><p>Bienvenue sur le site de notre lycée.</p>', "localhost/index.html", 130,
       "Le titre « Mon lycée » s'affiche dans l'onglet, pas dans la page."))}
{tableau(["Élément", "Rôle"], [
    (c("<!DOCTYPE html>"), "Déclare un document HTML5. Toujours en première ligne."),
    (c('<html lang="fr">'), "Élément racine ; l'attribut <code>lang</code> indique la langue de la page."),
    (c('<meta charset="UTF-8">'), "Encodage des caractères : indispensable pour les accents (é, à, ç)."),
    (c("<title>"), "Titre affiché dans l'onglet du navigateur et dans les favoris."),
    (c("<body>"), "Contenu visible de la page.")])}
{enc("prof", "<p>Faites d'abord retirer la ligne <code>meta charset</code> pour montrer l'effet sur les accents : l'élève retient mieux une erreur qu'il a provoquée lui-même.</p>")}
""", "doctype html head body meta charset title squelette structure")

N.notion("Titres, paragraphes et séparations", f"""
<p>Les titres <code>&lt;h1&gt;</code> à <code>&lt;h6&gt;</code> hiérarchisent le contenu (un seul <code>h1</code> par page). Le paragraphe <code>&lt;p&gt;</code> regroupe un bloc de texte, <code>&lt;br&gt;</code> force un retour à la ligne et <code>&lt;hr&gt;</code> trace une ligne de séparation thématique.</p>
{duo(code('''<h1>Club informatique</h1>
<h2>Nos activités</h2>
<p>Programmation, robotique<br>
et création de sites web.</p>
<hr>
<h2>Inscriptions</h2>
<p>Ouvertes jusqu'au 15 novembre.</p>''', "html"),
apercu('<h1>Club informatique</h1><h2>Nos activités</h2><p>Programmation, robotique<br>et création de sites web.</p><hr><h2>Inscriptions</h2><p>Ouvertes jusqu\'au 15 novembre.</p>', haut=230))}
{enc("att", "<p>La mise en forme (gras, italique, couleur) ne se fait <b>jamais</b> avec des balises HTML comme <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code> ou <code>&lt;strong&gt;</code> : elle passe par le CSS (<code>font-weight</code>, <code>font-style</code>). HTML = structure, CSS = présentation.</p>")}
""", "h1 h2 h3 h4 h5 h6 titre paragraphe p br hr ligne séparation")

N.notion("Valider sa page avec le W3C", f"""
<p>Une page « qui s'affiche » n'est pas forcément correcte. Le validateur officiel <a href="https://validator.w3.org/#validate_by_input" target="_blank" rel="noopener">validator.w3.org</a> signale les erreurs (balise non fermée, attribut obligatoire manquant) et les avertissements.</p>
<ol class="etapes">
<li><h4>Copier le code</h4><p>Sélectionner tout le code de la page dans l'éditeur.</p></li>
<li><h4>Coller dans « Validate by Direct Input »</h4><p>Puis cliquer sur <i>Check</i>.</p></li>
<li><h4>Corriger de haut en bas</h4><p>Une seule erreur (une balise non fermée) peut en provoquer plusieurs autres : on corrige la première puis on revalide.</p></li>
</ol>
{versus('<img src="lycee.jpg">\n<p>Notre lycée', '<img src="lycee.jpg" alt="Façade du lycée">\n<p>Notre lycée</p>', "html",
        "Erreurs signalées par le validateur : attribut <code>alt</code> manquant sur l'image et paragraphe non fermé.")}
""", "validation w3c validator erreur avertissement")

N.bloc(retenir([
    "Le squelette HTML5 est toujours le même : DOCTYPE, html, head, body.",
    "<code>meta charset=\"UTF-8\"</code> garantit l'affichage des accents.",
    "Un seul <code>h1</code> par page, puis h2, h3… dans l'ordre.",
    "HTML décrit la structure, jamais la mise en forme.",
    "Une page est terminée quand elle passe le validateur W3C sans erreur.",
], autres=[("Balises de la séquence", ["Balise", "Attributs (annexe)", "Définition", "Utilité"], [
    (c('<html>'), c('lang'), 'Élément racine qui contient toute la page.', "Indiquer la langue du document (fr) aux navigateurs et aux lecteurs d'écran."),
    (c('<head>'), '—', 'En-tête du document, non affiché dans la page.', 'Regrouper les informations sur la page : encodage, titre, styles.'),
    (c('<meta>'), c('charset, name, content'), 'Métadonnée décrivant la page.', "Déclarer l'encodage UTF-8 pour afficher correctement les accents."),
    (c('<title>'), '—', 'Titre du document.', "Afficher un nom dans l'onglet du navigateur et dans les favoris."),
    (c('<body>'), '—', 'Corps du document.', 'Contenir tout ce que le visiteur voit.'),
    (c('<h1> à <h6>'), '—', 'Titres de niveau 1 (le plus important) à 6.', "Hiérarchiser le contenu comme le plan d'un document."),
    (c('<p>'), '—', 'Paragraphe de texte.', 'Regrouper des phrases en un bloc séparé des autres.'),
    (c('<br>'), '—', 'Retour à la ligne (balise orpheline).', "Passer à la ligne à l'intérieur d'un même paragraphe (adresse, poème)."),
    (c('<hr>'), '—', 'Ligne horizontale de séparation.', 'Marquer un changement de thème entre deux parties.')])]), "À retenir — structure")

# =====================================================================
N.module("Listes et tableaux",
         "Organiser l'information : listes à puces, listes numérotées et tableaux de données.")

N.notion("Listes à puces et listes ordonnées", f"""
<p><code>&lt;ul&gt;</code> crée une liste à puces (l'ordre n'a pas d'importance), <code>&lt;ol&gt;</code> une liste numérotée (l'ordre compte). Chaque élément est dans un <code>&lt;li&gt;</code>. La liste ordonnée accepte trois attributs de l'annexe : <code>type</code>, <code>start</code> et <code>reversed</code>.</p>
{duo(code('''<h3>Matériel du labo</h3>
<ul type="square">
  <li>Ordinateurs</li>
  <li>Imprimante</li>
</ul>

<h3>Classement du tournoi</h3>
<ol type="I" start="1">
  <li>3ème Info 1</li>
  <li>3ème Info 2</li>
</ol>

<h3>Compte à rebours</h3>
<ol reversed>
  <li>Prêts</li>
  <li>Partez</li>
</ol>''', "html"),
apercu('<h3>Matériel du labo</h3><ul type="square"><li>Ordinateurs</li><li>Imprimante</li></ul><h3>Classement du tournoi</h3><ol type="I" start="1"><li>3ème Info 1</li><li>3ème Info 2</li></ol><h3>Compte à rebours</h3><ol reversed><li>Prêts</li><li>Partez</li></ol>', haut=330))}
{tableau(["Liste", "Attribut", "Valeurs", "Effet"], [
    (c("<ul>"), c("type"), "disc, circle, square", "Forme de la puce : disque plein (par défaut), cercle vide, carré"),
    (c("<ol>"), c("type"), "1, A, a, I, i", "Style de numérotation : chiffres, lettres majuscules ou minuscules, chiffres romains"),
    (c("<ol>"), c("start"), "un entier", "Numéro du premier élément"),
    (c("<ol>"), c("reversed"), "sans valeur", "Numérotation décroissante")])}
{enc("att", "<p>L'attribut <code>type</code> de <code>&lt;ul&gt;</code> fonctionne dans les navigateurs, mais il n'est pas dans l'annexe et le validateur W3C le signale comme obsolète. Dès la 3ème, la forme des puces se règle en CSS : <code>list-style-type: square;</code></p>")}
""", "liste ul ol li puces numérotée type square circle disc start reversed")

N.notion("Tableaux de données", f"""
<p>Un tableau se construit <b>ligne par ligne</b> : <code>&lt;tr&gt;</code> (ligne), puis les cellules <code>&lt;th&gt;</code> (en-tête) ou <code>&lt;td&gt;</code> (donnée). <code>&lt;caption&gt;</code> donne un titre au tableau, <code>&lt;thead&gt;</code>, <code>&lt;tbody&gt;</code> et <code>&lt;tfoot&gt;</code> en délimitent les parties.</p>
{duo(code('''<table border="1">
  <caption>Emploi du temps — lundi</caption>
  <thead>
    <tr><th>Heure</th><th>Matière</th></tr>
  </thead>
  <tbody>
    <tr><td>8h</td><td>Informatique</td></tr>
    <tr><td>10h</td><td>Mathématiques</td></tr>
  </tbody>
  <tfoot>
    <tr><td>Total</td><td>2 séances</td></tr>
  </tfoot>
</table>''', "html"),
apercu('<table border="1"><caption>Emploi du temps — lundi</caption><thead><tr><th>Heure</th><th>Matière</th></tr></thead><tbody><tr><td>8h</td><td>Informatique</td></tr><tr><td>10h</td><td>Mathématiques</td></tr></tbody><tfoot><tr><td>Total</td><td>2 séances</td></tr></tfoot></table>', haut=170))}
{enc("astuce", "<p>Faites dessiner le tableau sur papier avant de le coder : l'élève compte les lignes, et chaque ligne devient un <code>&lt;tr&gt;</code>.</p>")}
""", "tableau table tr td th thead tbody tfoot caption")

N.bloc(retenir([
    "<code>ul</code> : ordre sans importance ; <code>ol</code> : ordre significatif.",
    "Chaque élément de liste est dans un <code>li</code>.",
    "Un tableau se lit ligne par ligne : <code>tr</code> puis <code>th</code> / <code>td</code>.",
    "<code>caption</code> se place juste après <code>&lt;table&gt;</code>.",
], autres=[("Balises de la séquence", ["Balise", "Attributs (annexe)", "Définition", "Utilité"], [
    (c('<ul>'), 'type (disc, circle, square) — hors annexe', 'Liste non ordonnée (à puces).', "Énumérer des éléments dont l'ordre n'a pas d'importance."),
    (c('<ol>'), c('type, start, reversed'), 'Liste ordonnée (numérotée).', "Énumérer des étapes ou un classement où l'ordre compte."),
    (c('<li>'), '—', "Élément d'une liste.", "Contenir chaque item d'un ul ou d'un ol."),
    (c('<table>'), '—', 'Tableau.', 'Présenter des données en lignes et en colonnes.'),
    (c('<caption>'), '—', 'Titre du tableau.', 'Annoncer le contenu du tableau ; se place juste après <table>.'),
    (c('<thead>'), '—', 'En-tête du tableau.', 'Regrouper la ou les lignes de titres des colonnes.'),
    (c('<tbody>'), '—', 'Corps du tableau.', 'Regrouper les lignes de données.'),
    (c('<tfoot>'), '—', 'Pied du tableau.', 'Regrouper les lignes de total ou de synthèse.'),
    (c('<tr>'), '—', 'Ligne du tableau.', "Contenir les cellules d'une même ligne."),
    (c('<th>'), '—', "Cellule d'en-tête.", "Donner le titre d'une colonne ou d'une ligne (gras et centré par défaut)."),
    (c('<td>'), '—', 'Cellule de donnée.', 'Contenir une valeur du tableau.')])]), "À retenir — listes et tableaux")

# =====================================================================
N.module("Liens et multimédia",
         "Naviguer entre les pages et intégrer images, sons et vidéos.")

N.notion("Les liens hypertextes", f"""
<p>La balise <code>&lt;a&gt;</code> crée un lien. <code>href</code> indique la destination, <code>target</code> la fenêtre d'ouverture.</p>
{code('''<a href="contact.html">Nous contacter</a>
<a href="https://www.education.tn" target="_blank">Site du ministère</a>''', "html")}
{tableau(["Valeur de target", "Effet"], [
    (c("_self"), "Même onglet (par défaut)"), (c("_blank"), "Nouvel onglet"),
    (c("_parent"), "Cadre parent"), (c("_top"), "Fenêtre entière")])}
{enc("info", "<p>Chemins relatifs : <code>contact.html</code> (même dossier), <code>pages/contact.html</code> (sous-dossier), <code>../index.html</code> (dossier parent). C'est la première source d'erreur en TP.</p>")}
""", "lien a href target _blank chemin relatif")

N.notion("Images, audio et vidéo", f"""
<p><code>&lt;img&gt;</code> exige <code>src</code> (le fichier) et <code>alt</code> (le texte de remplacement). <code>&lt;audio&gt;</code> et <code>&lt;video&gt;</code> utilisent <code>src</code> et <code>controls</code> pour afficher les boutons de lecture.</p>
{code('''<img src="images/lycee.jpg" alt="Façade du lycée">

<audio src="sons/hymne.mp3" controls></audio>

<video src="videos/visite.mp4" controls></video>''', "html")}
{enc("att", "<p>Sans <code>controls</code>, le lecteur est invisible et l'élève croit que « la vidéo ne marche pas ».</p>")}
""", "image img src alt audio video controls multimédia")

N.bloc(retenir([
    "<code>href</code> = destination, <code>target</code> = où ouvrir.",
    "<code>alt</code> est obligatoire sur chaque image (validation W3C).",
    "<code>controls</code> affiche les commandes audio/vidéo.",
    "Noms de fichiers sans espace ni accent : <code>photo_classe.jpg</code>.",
], autres=[("Balises de la séquence", ["Balise", "Attributs (annexe)", "Définition", "Utilité"], [
    (c('<a>'), c('href, target'), 'Lien hypertexte.', 'Naviguer vers une autre page, un site ou un fichier.'),
    (c('<img>'), c('src, alt'), 'Image (balise orpheline).', "Afficher une photo ou une illustration ; alt la décrit si elle ne s'affiche pas."),
    (c('<audio>'), c('src, controls'), 'Lecteur de son.', 'Intégrer un fichier audio avec ses boutons de lecture.'),
    (c('<video>'), c('src, controls'), 'Lecteur vidéo.', 'Intégrer une vidéo avec ses commandes.')])]), "À retenir — liens et multimédia")

# =====================================================================
N.module("Formulaires",
         "Recueillir des informations : zones de saisie, choix multiples, listes et boutons.")

N.notion("La balise form et les champs de base", f"""
<p>Le formulaire regroupe les champs. <code>&lt;label for="…"&gt;</code> relie un texte à un champ via son <code>id</code> : cliquer sur le texte active le champ. <code>&lt;fieldset&gt;</code> et <code>&lt;legend&gt;</code> regroupent visuellement des champs liés.</p>
{duo(code('''<form action="inscription.php" method="post">
  <fieldset>
    <legend>Inscription au club</legend>
    <label for="nom">Nom :</label>
    <input type="text" id="nom" name="nom"><br>

    <label for="age">Âge :</label>
    <input type="number" id="age" name="age"><br>

    Classe :
    <input type="radio" name="classe" value="2A"> 2A
    <input type="radio" name="classe" value="2B"> 2B<br>

    <input type="checkbox" name="photo" value="oui">
    J'accepte d'être photographié(e)<br>

    <input type="submit" value="Envoyer">
    <input type="reset" value="Effacer">
  </fieldset>
</form>''', "html", "inscription.html"),
apercu('<form><fieldset><legend>Inscription au club</legend><label for="nom">Nom :</label> <input type="text" id="nom" name="nom"><br><label for="age">Âge :</label> <input type="number" id="age" name="age"><br>Classe : <input type="radio" name="classe" value="2A"> 2A <input type="radio" name="classe" value="2B"> 2B<br><input type="checkbox" name="photo" value="oui"> J\'accepte d\'être photographié(e)<br><input type="submit" value="Envoyer"> <input type="reset" value="Effacer"></fieldset></form>', "localhost/inscription.html", 230))}
{enc("att", "<p>Les boutons radio d'un même groupe portent <b>le même <code>name</code></b> : c'est ce qui rend le choix exclusif.</p>")}
""", "formulaire form input text number radio checkbox submit reset label for fieldset legend action method")

N.notion("Listes déroulantes et zones de texte", f"""
<p><code>&lt;select&gt;</code> propose une liste de <code>&lt;option&gt;</code> ; <code>selected</code> présélectionne une option et <code>multiple</code> autorise plusieurs choix. <code>&lt;textarea&gt;</code> accepte un texte sur plusieurs lignes.</p>
{duo(code('''<label for="gouv">Gouvernorat :</label>
<select id="gouv" name="gouv">
  <option value="">-- Choisir --</option>
  <option value="Manouba" selected>Manouba</option>
  <option value="Tunis">Tunis</option>
</select>
<br>
<label for="msg">Message :</label><br>
<textarea id="msg" name="msg" rows="3" cols="30"
  maxlength="200" placeholder="Votre message"></textarea>''', "html"),
apercu('<label for="gouv">Gouvernorat :</label> <select id="gouv" name="gouv"><option value="">-- Choisir --</option><option value="Manouba" selected>Manouba</option><option value="Tunis">Tunis</option></select><br><label for="msg">Message :</label><br><textarea id="msg" name="msg" rows="3" cols="30" maxlength="200" placeholder="Votre message"></textarea>', haut=150))}
""", "select option selected multiple textarea rows cols maxlength placeholder liste déroulante")

N.bloc(retenir([
    "<code>method</code> vaut <code>get</code> ou <code>post</code> ; <code>action</code> désigne la page de traitement.",
    "<code>name</code> identifie la donnée envoyée, <code>id</code> sert au <code>label</code>.",
    "Radio : même <code>name</code> pour un choix unique.",
    "En 2ème : text, number, radio, checkbox, submit, reset uniquement.",
], autres=[("Balises et types de la séquence", ["Balise", "Attributs (annexe)", "Définition", "Utilité"], [
    (c('<form>'), c('action, method, target'), 'Formulaire.', 'Regrouper des champs et envoyer leurs valeurs à une page de traitement.'),
    (c('<fieldset>'), '—', 'Groupe de champs.', 'Encadrer des champs liés (identité, coordonnées).'),
    (c('<legend>'), '—', "Titre d'un fieldset.", 'Nommer le groupe de champs.'),
    (c('<label>'), c('for'), "Étiquette d'un champ.", "Décrire le champ ; un clic sur l'étiquette active le champ dont l'id est for."),
    (c('<input>'), c('type, name, value'), 'Champ de saisie (text, number, radio, checkbox, submit, reset).', "Recueillir une donnée ou déclencher l'envoi / la remise à zéro."),
    (c('<select>'), c('name, required, disabled, multiple'), 'Liste déroulante.', 'Proposer un choix parmi plusieurs options sans encombrer la page.'),
    (c('<option>'), c('value, selected'), "Choix d'une liste.", 'Définir chaque valeur proposée par le select.'),
    (c('<textarea>'), c('name, rows, cols, maxlength, placeholder'), 'Zone de texte multiligne.', 'Saisir un texte long (message, commentaire).')])]), "À retenir — formulaires")

# =====================================================================
N.module("CSS en ligne et interne",
         "Mettre en forme sans fichier externe : texte, bordures et arrière-plans.")

N.notion("Deux façons d'écrire le CSS en 2ème", f"""
<p>En 2ème année, le CSS s'écrit <b>en ligne</b> (attribut <code>style</code>, pour un seul élément) ou <b>en interne</b> (balise <code>&lt;style&gt;</code> dans le <code>&lt;head&gt;</code>, pour toute la page). La syntaxe est toujours : <code>sélecteur {{ propriété: valeur; }}</code>.</p>
{duo(code('''<head>
  <meta charset="UTF-8">
  <title>Club</title>
  <style>
    h1 {
      color: navy;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Club informatique</h1>
  <p style="color: green;">Inscriptions ouvertes</p>
</body>''', "html"),
apercu('<style>h1{color:navy;text-align:center}</style><h1>Club informatique</h1><p style="color: green;">Inscriptions ouvertes</p>', haut=120))}
{enc("info", "<p>Sélecteurs utilisés en 2ème : le nom de l'élément (<code>h1</code>, <code>p</code>, <code>table</code>…). Les sélecteurs <code>#id</code> et <code>.classe</code> arrivent en 3ème.</p>")}
""", "css inline en ligne interne style syntaxe sélecteur propriété valeur")

N.notion("Mettre en forme le texte", f"""
{duo(code('''<style>
  h2 {
    font-family: Georgia, serif;
    font-size: 26px;
    color: darkred;
  }
  p {
    font-weight: bold;
    font-style: italic;
    text-align: justify;
  }
</style>''', "css"),
apercu('<style>h2{font-family:Georgia,serif;font-size:26px;color:darkred}p{font-weight:bold;font-style:italic;text-align:justify}</style><h2>Le patrimoine de Carthage</h2><p>Carthage, fondée au IXe siècle avant J.-C., est inscrite au patrimoine mondial de l\'UNESCO depuis 1979.</p>', haut=140))}
{enc("astuce", "<p>La propriété abrégée <code>font</code> regroupe style, graisse, taille et police : <code>font: italic bold 18px Arial;</code></p>")}
""", "texte font-family font-size font-weight font-style text-align color font police gras italique")

N.notion("Bordures", f"""
{duo(code('''<style>
  table {
    border-width: 2px;
    border-style: solid;
    border-color: navy;
  }
  td {
    border: 1px dashed gray;
  }
</style>''', "css"),
apercu('<style>table{border-width:2px;border-style:solid;border-color:navy}td{border:1px dashed gray;padding:6px}</style><table><tr><td>Lundi</td><td>Informatique</td></tr><tr><td>Mardi</td><td>Physique</td></tr></table>', haut=110))}
""", "bordure border border-width border-style border-color solid dashed dotted")

N.notion("Arrière-plans", f"""
{duo(code('''<style>
  body {
    background-color: lightyellow;
  }
  h1 {
    background-image: url("motif.png");
    background-repeat: repeat-x;
  }
</style>''', "css"),
apercu('<style>body{background-color:lightyellow}h1{background-color:#cfe3ff}</style><h1>Bienvenue</h1><p>Fond de page jaune clair.</p>', haut=110,
       legende="L'image de fond est remplacée ici par une couleur."))}
""", "arrière-plan fond background background-color background-image background-repeat repeat-x repeat-y")

N.bloc(retenir([
    "CSS en ligne : attribut <code>style</code> ; CSS interne : <code>&lt;style&gt;</code> dans le <code>head</code>.",
    "Syntaxe : <code>sélecteur { propriété: valeur; }</code>, chaque déclaration se termine par <code>;</code>.",
    "Gras et italique se font en CSS : <code>font-weight</code>, <code>font-style</code>.",
    "Pas de fichier .css externe en 2ème année.",
], css=[
    ("font-family", "nom(s) de police par ordre de préférence", "Georgia, serif", "Police du texte"),
    ("font-size", "taille en px", "26px", "Taille des caractères"),
    ("font-weight", "bold, bolder, lighter", "bold", "Graisse du texte"),
    ("font-style", "italic", "italic", "Style du texte"),
    ("font", "combine style, graisse, taille, police", "italic bold 18px Arial", "Propriété abrégée du texte"),
    ("text-align", "left, center, right, justify", "justify", "Alignement horizontal"),
    ("color", "nom, #hexadécimal, rgb()", "darkred", "Couleur du texte"),
    ("border-width", "medium, thin, thick, valeur en px", "2px", "Épaisseur de la bordure"),
    ("border-style", "solid, dashed, dotted…", "solid", "Style du trait"),
    ("border-color", "nom, #hexadécimal, rgb()", "navy", "Couleur de la bordure"),
    ("border", "combine largeur, style, couleur", "1px dashed gray", "Propriété abrégée"),
    ("background-color", "nom, #hexadécimal, rgb()", "lightyellow", "Couleur de fond"),
    ("background-image", "url(\"fichier\")", "url(\"motif.png\")", "Image de fond"),
    ("background-repeat", "repeat, repeat-x, repeat-y", "repeat-x", "Répétition de l'image de fond"),
    ("background", "combine les propriétés de fond", "—", "Propriété abrégée"),
]), "À retenir — CSS 2ème", "font border background css")

# =====================================================================
N.module("Limites du programme et progression",
         "Ce qui ne s'enseigne pas en 2ème, et une répartition possible sur l'année.")

N.bloc(interdits("À ne pas enseigner en 2ème année", [
    "Balises sémantiques<small>header, nav, section, article, footer… (3ème)</small>",
    "JavaScript<small>introduit en 3ème</small>",
    "CSS externe<small>fichier .css et balise link (3ème)</small>",
    "Types date, time, email, tel, password, range<small>3ème</small>",
    "Sélecteurs #id, .classe, pseudo-classes<small>3ème et 4ème</small>",
    "Mise en forme par balises<small>b, strong, i, em, u, font, center</small>",
]), "Interdits", "interdits 2ème")

N.bloc(f"""<article class="notion" id="m6-progression"><div class="notion-tete"><h3>Progression suggérée</h3><span class="annexe-tag">Proposition</span></div><div class="notion-corps">
<p>Fil rouge conseillé : un <b>mini-site du lycée</b> (accueil, emploi du temps, club, inscription) que l'élève enrichit à chaque séance.</p>
{tableau(["Trimestre", "Notions", "Production de l'élève"], [
    ("1er", "Squelette, titres, paragraphes, listes, validation W3C", "Page d'accueil du lycée, validée"),
    ("2ème", "Tableaux, liens, images, audio, vidéo, CSS en ligne et interne", "Emploi du temps + navigation entre pages"),
    ("3ème", "Formulaires, CSS des bordures et arrière-plans", "Fiche d'inscription au club, mise en forme")])}
</div></article>""", "Progression suggérée", "progression trimestre fil rouge projet")

PAGE = N
