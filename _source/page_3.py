from lib import *

N = Niveau("3", "niveau-3.html")

# =====================================================================
N.module("HTML5 avancé",
         "Relier des fichiers externes, structurer la page avec les balises sémantiques et enrichir les formulaires.")

N.notion("Relier une feuille de style et un script", f"""
<p>À partir de la 3ème, le CSS et le JavaScript vivent dans des <b>fichiers séparés</b>, reliés dans le <code>&lt;head&gt;</code>. Une même feuille de style sert alors à toutes les pages du site.</p>
{code('''<head>
  <meta charset="UTF-8">
  <title>Découvrir la Tunisie</title>
  <link rel="stylesheet" type="text/css" href="css/style.css">
  <script type="text/javascript" src="js/controle.js"></script>
</head>''', "html", "index.html")}
{tableau(["Balise", "Attributs (annexe)", "Rôle"], [
    (c("<link>"), c("href, rel, type"), "Relie une ressource externe (feuille de style)"),
    (c("<script>"), c("src, type"), "Relie (ou contient) un script JavaScript"),
    (c("<style>"), c("type, media"), "Feuille de style interne")])}
""", "link script rel href type stylesheet fichier externe")

N.notion("Les balises de structuration sémantique", f"""
<p>Les balises sémantiques remplacent les <code>&lt;div&gt;</code> anonymes par des zones qui ont un sens. La page devient lisible comme un plan, par l'élève comme par les moteurs de recherche.</p>
{duo(code('''<body>
  <header>Découvrir la Tunisie</header>
  <nav>Accueil | Régions | Contact</nav>
  <main>
    <section>
      <article>Carthage</article>
      <article>Dougga</article>
    </section>
    <aside>Le saviez-vous ?</aside>
  </main>
  <footer>
    <address>Lycée Oued Ellil</address>
  </footer>
</body>''', "html"),
apercu('''<style>body{margin:8px;font:13px Arial}header,nav,main,footer,section,article,aside{display:block;border:2px solid;border-radius:6px;padding:6px;margin:5px 0}
header{border-color:#0D2B6B;background:#e9eef8}nav{border-color:#D35400;background:#fdf0e6}main{border-color:#1D4ED8}section{border-color:#1E7B3C;background:#e7f5ec;width:62%;float:left}
article{border-color:#1E7B3C;background:#fff}aside{border-color:#5B2C9F;background:#f1eafb;width:28%;float:right}footer{clear:both;border-color:#0D2B6B;background:#e9eef8}main::after{content:"";display:block;clear:both}
b{font-size:11px;color:#555}</style>
<header><b>header</b> Découvrir la Tunisie</header><nav><b>nav</b> Accueil | Régions | Contact</nav><main><b>main</b><section><b>section</b><article><b>article</b> Carthage</article><article><b>article</b> Dougga</article></section><aside><b>aside</b> Le saviez-vous ?</aside></main><footer><b>footer</b> <address style="display:inline">Lycée Oued Ellil</address></footer>''', haut=290,
       legende="Bordures ajoutées uniquement pour visualiser les zones."))}
{tableau(["Balise", "Contenu attendu"], [
    (c("<header>"), "En-tête : logo, titre du site"), (c("<nav>"), "Menu de navigation"),
    (c("<main>"), "Contenu principal (un seul par page)"), (c("<section>"), "Regroupement thématique"),
    (c("<article>"), "Contenu autonome (fiche, actualité)"), (c("<aside>"), "Contenu annexe, encadré"),
    (c("<footer>"), "Pied de page"), (c("<address>"), "Coordonnées de contact"),
    (c("<cite>"), "Titre d'une œuvre citée")])}
""", "sémantique header nav main section article aside footer address cite")

N.notion("Conteneurs, iframe, figure et details", f"""
<p><code>&lt;div&gt;</code> (bloc) et <code>&lt;span&gt;</code> (en ligne) sont des conteneurs neutres, utiles pour appliquer un style. <code>&lt;iframe&gt;</code> affiche une autre page à l'intérieur de la page ; nommé par <code>name</code>, il peut servir de cible à un lien. <code>&lt;figure&gt;</code> associe une illustration à sa légende <code>&lt;figcaption&gt;</code>, et <code>&lt;details&gt;</code> / <code>&lt;summary&gt;</code> créent un bloc dépliable.</p>
{duo(code('''<a href="carthage.html" target="cadre">Carthage</a>
<iframe src="accueil.html" name="cadre"
        width="300" height="80"></iframe>

<figure>
  <img src="dougga.jpg" alt="Théâtre de Dougga">
  <figcaption>Le théâtre romain de Dougga</figcaption>
</figure>

<details>
  <summary>Horaires de visite</summary>
  Tous les jours de 8h à 17h.
</details>''', "html"),
apercu('<a href="#" onclick="return false">Carthage</a><br><iframe srcdoc="<p style=\'font:13px Arial\'>Contenu de accueil.html</p>" width="300" height="60" style="border:1px solid #999"></iframe><figure style="margin:8px 0"><div style="width:160px;height:60px;background:#e8d9b5;display:grid;place-items:center;font:12px Arial">dougga.jpg</div><figcaption>Le théâtre romain de Dougga</figcaption></figure><details><summary>Horaires de visite</summary>Tous les jours de 8h à 17h.</details>', haut=250,
       legende="Cliquez sur « Horaires de visite » pour déplier."))}
""", "div span iframe src name target figure figcaption details summary open")

N.notion("Formulaires : nouveaux types et attributs", f"""
<p>La 3ème enrichit les formulaires de types spécialisés et d'attributs de contrôle. Le bouton qui déclenche un contrôle JavaScript est un <code>&lt;input type="button"&gt;</code>.</p>
{duo(code('''<form>
  <input type="email" placeholder="adresse@mail.tn" required>
  <input type="tel" placeholder="8 chiffres">
  <input type="password" placeholder="Mot de passe">
  <input type="date" min="2026-09-15">
  <input type="time">
  Niveau : <input type="range" min="1" max="10" value="5">
  <input type="text" value="Oued Ellil" readonly>
  <input type="button" value="Valider" onclick="verifier()">
</form>''', "html"),
apercu('<form style="display:grid;gap:5px;max-width:260px"><input type="email" placeholder="adresse@mail.tn" required><input type="tel" placeholder="8 chiffres"><input type="password" placeholder="Mot de passe"><input type="date" min="2026-09-15"><input type="time"><span>Niveau : <input type="range" min="1" max="10" value="5"></span><input type="text" value="Oued Ellil" readonly><input type="button" value="Valider"></form>', haut=280))}
{tableau(["Types", "Attributs utilisables (annexe)"], [
    ("text, email, tel", c("name, value, placeholder, readonly, required, disabled, list")),
    ("password", c("name, value, placeholder, readonly, required, disabled")),
    ("number, range", c("name, value, readonly, required, disabled, min, max")),
    ("date, time", c("name, value, required, disabled, min, max")),
    ("checkbox, radio", c("name, value, required, disabled, checked")),
    ("button, reset, submit", c("name, value, disabled"))])}
""", "formulaire email tel password date time range button required placeholder readonly disabled min max list")

N.notion("Événements HTML", f"""
<p>Un événement relie une action de l'utilisateur à une fonction JavaScript, directement dans la balise. En 3ème, on n'utilise pas <code>addEventListener</code>.</p>
{tableau(["Événement", "Se déclenche quand…", "Exemple"], [
    (c("onclick"), "on clique sur l'élément", c('<input type="button" onclick="calculer()">')),
    (c("oninput"), "la valeur change à chaque modification", c('<input type="range" oninput="afficher()">')),
    (c("onchange"), "la valeur change et le champ est quitté", c('<input type="date" onchange="age()">')),
    (c("onfocus"), "le champ reçoit le focus", c('<input onfocus="aide()">')),
    (c("onblur"), "le champ perd le focus", c('<input onblur="verifierNom()">')),
    (c("onload"), "la page a fini de charger", c('<body onload="init()">'))])}
""", "événement onclick oninput onchange onfocus onblur onload")

N.bloc(retenir([
    "CSS et JS sont dans des fichiers externes reliés par <code>link</code> et <code>script</code>.",
    "Balises sémantiques : header, nav, main, section, article, aside, footer.",
    "Un <code>iframe</code> nommé (<code>name</code>) devient la cible d'un lien (<code>target</code>).",
    "Bouton de contrôle : <code>&lt;input type=\"button\" onclick=\"…\"&gt;</code>, jamais <code>&lt;button&gt;</code>.",
], autres=[("Balises de la séquence", ["Balise", "Attributs (annexe)", "Définition", "Utilité"], [
    (c('<link>'), c('href, rel, type'), 'Lien vers une ressource externe.', 'Relier la feuille de style .css à la page.'),
    (c('<script>'), c('src, type'), 'Script JavaScript (interne ou externe).', 'Relier le fichier .js qui rend la page interactive.'),
    (c('<header>'), '—', "En-tête de la page ou d'une section.", 'Contenir le logo, le titre du site, le slogan.'),
    (c('<nav>'), '—', 'Zone de navigation.', 'Regrouper les liens du menu principal.'),
    (c('<main>'), '—', 'Contenu principal (un seul par page).', 'Délimiter le contenu propre à la page, hors en-tête et pied.'),
    (c('<footer>'), '—', "Pied de la page ou d'une section.", "Afficher les coordonnées, l'auteur, les mentions."),
    (c('<section>'), '—', 'Regroupement thématique.', 'Découper le contenu en grandes parties, chacune avec son titre.'),
    (c('<article>'), '—', 'Contenu autonome.', 'Présenter une fiche, une actualité ou un produit compréhensible seul.'),
    (c('<aside>'), '—', 'Contenu complémentaire.', 'Placer un encadré, une info « Le saviez-vous ? », des liens annexes.'),
    (c('<div>'), '—', 'Conteneur neutre de type bloc.', 'Regrouper des éléments pour leur appliquer un style quand aucune balise sémantique ne convient.'),
    (c('<span>'), '—', 'Conteneur neutre en ligne.', "Mettre en forme une partie d'un texte (avec une classe)."),
    (c('<iframe>'), c('src, name'), 'Cadre affichant une autre page.', 'Intégrer une page dans la page ; nommé, il sert de cible (target) aux liens.'),
    (c('<figure>'), '—', 'Illustration autonome.', 'Associer une image (ou un schéma) à sa légende.'),
    (c('<figcaption>'), '—', "Légende d'une figure.", "Décrire l'image contenue dans figure."),
    (c('<details>'), c('open'), 'Bloc dépliable.', "Masquer un contenu secondaire que le visiteur affiche s'il le souhaite."),
    (c('<summary>'), '—', "Titre cliquable d'un details.", 'Indiquer ce que contient le bloc dépliable.'),
    (c('<address>'), '—', 'Coordonnées de contact.', "Donner l'adresse, le téléphone ou l'e-mail de l'auteur ou de l'établissement."),
    (c('<cite>'), '—', "Titre d'une œuvre.", "Citer le titre d'un livre, d'un film ou d'un article.")])]), "À retenir — HTML5 avancé")

# =====================================================================
N.module("CSS3 : feuille externe et sélecteurs",
         "Centraliser la mise en forme dans un fichier .css et cibler précisément les éléments.")

N.notion("Sélecteurs de base", f"""
{duo(code('''/* style.css */
p { color: #333; }              /* élément   */
#titre { color: navy; }         /* id        */
.important { color: crimson; }  /* classe    */
h2, h3 { font-family: Arial; }  /* groupe    */
* { margin: 0px; }              /* universel */''', "css", "css/style.css"),
apercu('<style>*{margin:0}p{color:#333}#titre{color:navy}.important{color:crimson}h2,h3{font-family:Arial}</style><h2 id="titre">Gouvernorat de Manouba</h2><p>Chef-lieu : Manouba.</p><p class="important">Population : environ 380 000 habitants.</p><h3>Délégations</h3>', haut=120))}
{enc("info", "<p>Un <code>id</code> est unique dans la page ; une <code>class</code> peut être partagée par plusieurs éléments.</p>")}
""", "sélecteur id classe class groupe universel élément #")

N.notion("Texte, listes et arrière-plan", f"""
{duo(code('''h1 {
  text-transform: uppercase;
  text-shadow: 2px 2px 3px gray;
}
ul {
  list-style-type: square;
  list-style-position: inside;
}
header {
  background-image: url("../images/sahara.jpg");
  background-size: cover;
}''', "css", "css/style.css"),
apercu('<style>h1{text-transform:uppercase;text-shadow:2px 2px 3px gray;font:bold 22px Arial}ul{list-style-type:square;list-style-position:inside;padding:0}</style><h1>Le Sahara tunisien</h1><ul><li>Douz</li><li>Tozeur</li><li>Ksar Ghilane</li></ul>', haut=150))}
""", "text-transform text-shadow list-style-type list-style-position list-style-image list-style background-size cover contain")

N.notion("Tableaux en CSS", f"""
{duo(code('''table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
}
td, th {
  border: 1px solid #0D2B6B;
}''', "css"),
apercu('<style>table{border-collapse:collapse;table-layout:fixed;width:100%;font:14px Arial}td,th{border:1px solid #0D2B6B;padding:5px}th{background:#e9eef8}</style><table><tr><th>Site</th><th>Région</th></tr><tr><td>Carthage</td><td>Tunis</td></tr><tr><td>El Jem</td><td>Mahdia</td></tr></table>', haut=110))}
""", "tableau border-collapse collapse separate table-layout fixed")

N.bloc(retenir([
    "Sélecteurs de 3ème : élément, <code>#id</code>, <code>.classe</code>, groupe, universel.",
    "Une seule feuille de style externe pour tout le site.",
    "Unités : <b>px et %</b> uniquement (pas de em, rem, vh, vw).",
], css=[
    ("text-shadow", "décalage-x décalage-y flou couleur", "2px 2px 3px gray", "Ombre du texte"),
    ("text-transform", "uppercase, lowercase, capitalize", "uppercase", "Casse des caractères"),
    ("list-style-type", "circle, square, upper-roman, lower-alpha", "square", "Type de puce"),
    ("list-style-position", "outside, inside", "inside", "Position de la puce"),
    ("list-style-image", "url(\"image\")", "—", "Image comme puce"),
    ("list-style", "combine type, position, image", "—", "Propriété abrégée des listes"),
    ("background-size", "cover, contain, valeur en px ou %", "cover", "Taille de l'image de fond"),
    ("border-collapse", "separate, collapse", "collapse", "Bordures fusionnées ou séparées"),
    ("table-layout", "auto, fixed", "fixed", "Disposition des colonnes"),
]), "À retenir — sélecteurs et propriétés", "css sélecteurs")

# =====================================================================
N.module("Mise en page : boîtes et positionnement",
         "Dimensionner les blocs, les faire flotter et les positionner, sans Flexbox ni Grid.")

N.notion("Le modèle de boîte", f"""
<p>Chaque élément est une boîte : le contenu (<code>width</code>, <code>height</code>), la marge intérieure (<code>padding</code>), la bordure, puis la marge extérieure (<code>margin</code>).</p>
{duo(code('''.carte {
  width: 220px;
  padding: 15px;
  border: 3px solid #1D4ED8;
  margin: 20px;
  border-radius: 10px;
  box-shadow: 4px 4px 8px gray;
}''', "css"),
apercu('<style>.carte{width:220px;padding:15px;border:3px solid #1D4ED8;margin:20px;border-radius:10px;box-shadow:4px 4px 8px gray;font:14px Arial}</style><div class="carte">Kairouan — ville sainte, célèbre pour sa Grande Mosquée.</div>', haut=140))}
""", "boîte box width height padding margin border-radius box-shadow")

N.notion("display, float et position", f"""
<p>La mise en page de 3ème repose sur <code>float</code> (blocs côte à côte) et <code>position</code>. Pour une page pleine hauteur : <code>html, body {{ height: 100%; }}</code> puis des hauteurs en % sur les enfants.</p>
{duo(code('''nav {
  float: left;
  width: 25%;
}
section {
  float: right;
  width: 70%;
}
footer {
  clear: both;
}
.badge {
  position: absolute;
  top: 10px;
  right: 10px;
}''', "css"),
apercu('<style>body{font:13px Arial;position:relative;margin:6px}nav,section,footer{padding:6px;border-radius:5px}nav{float:left;width:25%;background:#e8efff;height:90px}section{float:right;width:70%;background:#e7f5ec;height:90px}footer{clear:both;background:#e9eef8;margin-top:6px}.badge{position:absolute;top:2px;right:2px;background:#F5B800;padding:2px 8px;border-radius:9px;font-weight:bold}</style><nav>nav (float: left)</nav><section>section (float: right)</section><footer>footer (clear: both)</footer><span class="badge">Nouveau</span>', haut=150))}
{tableau(["Valeur de position", "Comportement"], [
    (c("static"), "Placement normal (par défaut)"),
    (c("relative"), "Décalé par rapport à sa place normale (top, left…)"),
    (c("absolute"), "Placé par rapport au premier parent positionné"),
    (c("fixed"), "Fixé à la fenêtre, ne défile pas"),
    (c("sticky"), "Normal puis collé au bord pendant le défilement")])}
{enc("att", "<p><code>clear</code> ne figure pas dans l'annexe actuelle ; il reste indispensable pour arrêter un flottement. Les membres du comité de réforme proposent de l'y ajouter.</p>")}
""", "display inline block inline-block float left right none position static relative absolute fixed sticky top bottom left right clear hauteur 100%")

N.notion("Débordement et transparence", f"""
{duo(code('''.actualites {
  height: 70px;
  overflow: scroll;
}
.filigrane {
  opacity: 0.4;
}''', "css"),
apercu('<style>body{font:13px Arial}.actualites{height:70px;overflow:scroll;border:1px solid #ccc;padding:4px}.filigrane{opacity:.4;font-size:20px;font-weight:bold}</style><div class="actualites">Lundi : réunion des parents.<br>Mardi : sortie à Carthage.<br>Mercredi : club robotique.<br>Jeudi : examen blanc.</div><p class="filigrane">BROUILLON</p>', haut=140))}
""", "overflow visible hidden clip scroll auto opacity transparence")

N.bloc(retenir([
    "Taille totale d'une boîte = width + padding + border + margin.",
    "<code>float</code> place les blocs côte à côte ; le pied de page arrête le flottement.",
    "<code>top</code>, <code>left</code>… n'agissent que sur un élément positionné.",
    "Flexbox et Grid ne sont pas au programme.",
], css=[
    ("width / height", "valeur en px ou %", "220px", "Largeur / hauteur du contenu"),
    ("padding", "1 à 4 valeurs en px", "15px", "Marge intérieure"),
    ("margin", "1 à 4 valeurs en px", "20px", "Marge extérieure"),
    ("border-radius", "valeur en px ou %", "10px", "Coins arrondis"),
    ("box-shadow", "décalage-x décalage-y flou couleur", "4px 4px 8px gray", "Ombre de la boîte"),
    ("display", "inline, block, inline-block", "—", "Comportement d'affichage"),
    ("float", "left, right, none", "left", "Flottement"),
    ("position", "absolute, fixed, relative, static, sticky", "absolute", "Mode de positionnement"),
    ("top / bottom / left / right", "valeur en px ou %", "10px", "Décalage d'un élément positionné"),
    ("overflow", "visible, hidden, clip, scroll, auto", "scroll", "Gestion du débordement"),
    ("opacity", "de 0 (transparent) à 1 (opaque)", "0.4", "Niveau de transparence"),
]), "À retenir — mise en page", "box float position")

# =====================================================================
N.module("Effets : transitions, transformations, animations",
         "Donner du mouvement à la page : passer en douceur d'un état à un autre, déformer, animer.")

N.notion("Transitions", f"""
<p>Une transition rend <b>progressif</b> le changement d'une propriété. Elle se déclare sur l'élément lui-même ; le changement est provoqué par <code>:hover</code>.</p>
{duo(code('''.carre {
  width: 100px;
  background-color: lightblue;
  transition: width 2s 0.5s;
}
.carre:hover {
  width: 200px;
}''', "css"),
apercu('<style>.carre{width:100px;height:60px;background-color:lightblue;transition:width 2s .5s;font:12px Arial;display:grid;place-items:center}.carre:hover{width:200px}</style><div class="carre">Survolez-moi</div>', haut=90,
       legende="Survolez le carré : sa largeur passe à 200px en 2s, après 0,5s."))}
{enc("att", "<p><code>transition</code> se place sur l'élément, <b>jamais</b> sur <code>:hover</code>. <code>transition-timing-function</code> (ease, linear…) n'est pas dans l'annexe.</p>")}
""", "transition transition-property transition-duration transition-delay hover")

N.notion("Transformations", f"""
<p><code>transform</code> fait tourner, agrandir, déplacer ou incliner un élément. Toutes les fonctions s'écrivent sur <b>une seule ligne</b>, sinon seule la dernière s'applique.</p>
{duo(code('''.logo {
  transition: transform 1s;
}
.logo:hover {
  transform: rotate(15deg) scale(1.3) translate(20px, 0px);
}''', "css"),
apercu('<style>.logo{width:90px;height:50px;margin:25px;background:#F5B800;border-radius:8px;display:grid;place-items:center;font:bold 13px Arial;transition:transform 1s}.logo:hover{transform:rotate(15deg) scale(1.3) translate(20px,0px)}</style><div class="logo">STI</div>', haut=110,
       legende="Survolez le logo."))}
{tableau(["Fonction", "Effet", "Exemple"], [
    (c("rotate()"), "Rotation", c("rotate(45deg)")), (c("scale()"), "Agrandissement / réduction", c("scale(1.5)")),
    (c("translate()"), "Déplacement (x, y)", c("translate(50px, 20px)")), (c("skew()"), "Inclinaison", c("skew(10deg, 5deg)"))])}
""", "transform rotate scale translate skew transformation")

N.notion("Animations", f"""
<p>Une animation enchaîne des états définis dans <code>@keyframes</code>, sans action de l'utilisateur. Pour animer <code>left</code> ou <code>top</code>, l'élément doit être <b>positionné</b>.</p>
{duo(code('''@keyframes traversee {
  0%   { left: 0px; }
  100% { left: 220px; }
}
.bateau {
  position: relative;
  animation-name: traversee;
  animation-duration: 3s;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}''', "css"),
apercu('<style>@keyframes traversee{0%{left:0}100%{left:220px}}.bateau{position:relative;width:70px;text-align:center;font:26px Arial;animation-name:traversee;animation-duration:3s;animation-iteration-count:infinite;animation-direction:alternate}.mer{background:#cfe8ff;padding:10px;border-radius:8px}</style><div class="mer"><div class="bateau">⛵</div></div>', haut=90))}
""", "animation keyframes @keyframes animation-name animation-duration animation-delay animation-iteration-count animation-direction infinite alternate")

N.bloc(retenir([
    "Transition = changement progressif déclenché par un événement (<code>:hover</code>).",
    "Animation = enchaînement automatique d'états définis par <code>@keyframes</code>.",
    "<code>transform</code> : toutes les fonctions sur une seule ligne.",
    "<code>translate(x, y)</code> uniquement (pas translateX / translateY).",
], css=[
    ("transition-property", "nom d'une propriété CSS", "width", "Propriété animée par la transition"),
    ("transition-duration", "durée en s", "2s", "Durée de la transition"),
    ("transition-delay", "durée en s", "0.5s", "Délai avant le début"),
    ("transition", "propriété durée délai", "width 2s 0.5s", "Propriété abrégée"),
    ("transform", "rotate(), scale(), translate(), skew()", "rotate(15deg) scale(1.3)", "Transformation 2D"),
    ("@keyframes", "étapes de 0% à 100%", "traversee", "États clés de l'animation"),
    ("animation-name", "nom des @keyframes", "traversee", "Animation à jouer"),
    ("animation-duration", "durée en s", "3s", "Durée d'un cycle"),
    ("animation-delay", "durée en s", "—", "Délai avant le début"),
    ("animation-iteration-count", "nombre entier, infinite", "infinite", "Nombre de répétitions"),
    ("animation-direction", "normal, reverse, alternate", "alternate", "Sens de lecture"),
    ("animation", "nom durée délai répétitions direction", "—", "Propriété abrégée"),
]), "À retenir — effets", "transition animation transform")

# =====================================================================
N.module("JavaScript",
         "Rendre la page interactive : lire les saisies, calculer, contrôler un formulaire et afficher un résultat.")

N.notion("Entrées, sorties et accès aux éléments", f"""
{duo(code('''// Entrée
let prenom = prompt("Votre prénom ?");

// Sorties
alert("Bienvenue " + prenom);
document.write("Bonjour");

// Lire un champ et écrire dans la page
let nom = document.getElementById("nom").value;
document.getElementById("res").innerHTML = "Merci " + nom;''', "js", "js/script.js"),
apercu('<input id="nom" value="Amine"> <input type="button" value="Afficher" onclick="document.getElementById(\'res\').innerHTML=\'Merci \'+document.getElementById(\'nom\').value"><p id="res"></p>', haut=90,
       legende="Cliquez sur « Afficher »."))}
{tableau(["Instruction", "Rôle"], [
    (c("prompt(message)"), "Affiche une boîte de saisie et renvoie le texte tapé"),
    (c("alert(message)"), "Affiche un message dans une boîte"),
    (c("document.write(texte)"), "Écrit dans la page pendant son chargement"),
    (c("document.getElementById(id)"), "Renvoie l'élément ayant cet id"),
    (c("element.value"), "Valeur saisie dans un champ"),
    (c("element.innerHTML"), "Contenu HTML d'un élément (lecture ou écriture)")])}
{enc("att", "<p><code>console.log()</code> n'est pas au programme : on affiche avec <code>alert()</code> ou <code>innerHTML</code>.</p>")}
""", "prompt alert document.write innerHTML getElementById value entrée sortie")

N.notion("Variables, conditions et boucles", f"""
{code('''let moyenne = 13.5;        // variable
const SEUIL = 10;          // constante
let mention;

if (moyenne >= 15) {
  mention = "Très bien";
} else if (moyenne >= SEUIL) {
  mention = "Admis";
} else {
  mention = "Ajourné";
}

let somme = 0;
for (let i = 1; i <= 10; i++) {
  somme = somme + i;
}

let n = 0;
while (n < 3) {
  n++;
}''', "js")}
{tableau(["Opérateurs", "Symboles (annexe)"], [
    ("Arithmétiques", c("+ - * / %")), ("Comparaison", c("== != > < >= <=")), ("Logiques", c("&& || !"))])}
""", "variable let const if else for while do boucle condition opérateur")

N.notion("Fonctions", f"""
<p>Une fonction regroupe des instructions réutilisables. Elle est appelée par un événement HTML ou par une autre fonction.</p>
{duo(code('''function surface(longueur, largeur) {
  return longueur * largeur;
}

function calculer() {
  let L = Number(document.getElementById("L").value);
  let l = Number(document.getElementById("l").value);
  document.getElementById("res").innerHTML =
    "Surface : " + surface(L, l) + " m²";
}''', "js", "js/script.js"),
apercu('<script>function surface(a,b){return a*b}function calculer(){let L=Number(document.getElementById("L").value);let l=Number(document.getElementById("l").value);document.getElementById("res").innerHTML="Surface : "+surface(L,l)+" m²"}</script>Longueur <input id="L" type="number" value="8" style="width:60px"> Largeur <input id="l" type="number" value="6" style="width:60px"> <input type="button" value="Calculer" onclick="calculer()"><p id="res"></p>', haut=90))}
""", "fonction function return paramètre appel")

N.notion("Chaînes de caractères", f"""
<p>On accède à un caractère par son indice : <code>ch[i]</code> (le premier est <code>ch[0]</code>). Les méthodes ci-dessous sont les seules de l'annexe.</p>
{code('''let ch = "Oued Ellil";
ch.length;               // 10
ch[0];                   // "O"   (jamais charAt)
ch.indexOf("E");         // 5
ch.lastIndexOf("l");     // 9
ch.substring(0, 4);      // "Oued" (jamais substr)
ch.replace("Oued", "Wed");
ch.toUpperCase();        // "OUED ELLIL"
ch.toLowerCase();
"  ok  ".trim();          // "ok"
String.fromCharCode(65); // "A"''', "js")}
{enc("prof", "<p>Fonction type à faire construire : tester qu'une chaîne ne contient que des chiffres (téléphone, code postal, CAPTCHA).</p>")}
{code('''function estChiffres(ch) {
  if (ch.length == 0) {
    return false;              // chaîne vide refusée
  }
  for (let i = 0; i < ch.length; i++) {
    if (ch[i] < "0" || ch[i] > "9") {
      return false;
    }
  }
  return true;
}''', "js")}
""", "chaîne string length indexOf lastIndexOf substring replace toUpperCase toLowerCase trim fromCharCode ch[i] estChiffres")

N.notion("Conversions, Math et Date", f"""
{code('''Number("12.5");          // 12.5
parseInt("42", 10);      // 42
parseFloat("3.14");      // 3.14
String(2026);            // "2026"
isNaN("abc");            // true

Math.abs(-4);            // 4
Math.sqrt(25);           // 5
Math.round(2.6);         // 3
Math.trunc(7.9);         // 7   (jamais floor / ceil)
let de = Math.trunc(Math.random() * 6) + 1;   // entier de 1 à 6

let d = new Date();               // date du jour
let n = new Date("2026-10-27");
d.getDate();                       // jour du mois
d.getMonth() + 1;                  // mois (getMonth renvoie 0 à 11)
d.getFullYear();                   // année
d.toString().substring(0, 3);      // jour de la semaine en anglais : "Tue"''', "js")}
{enc("att", "<p><code>getDay()</code> n'est pas dans l'annexe : le jour de la semaine s'obtient par <code>d.toString().substring(0, 3)</code>.</p>")}
""", "Number parseInt parseFloat String isNaN Math abs sqrt round trunc random Date getDate getMonth getFullYear toString")

N.notion("Contrôler un formulaire", f"""
<p>Schéma attendu à l'examen : un bouton <code>type="button"</code> appelle <code>verifier()</code> ; chaque erreur affiche un <code>alert()</code> puis <code>return</code> ; si tout est correct, le message de succès s'écrit avec <code>innerHTML</code>.</p>
{duo(code('''function verifier() {
  let nom = document.getElementById("nom").value;
  let tel = document.getElementById("tel").value;

  if (nom.length < 3) {
    alert("Le nom doit contenir au moins 3 lettres");
    return;
  }
  if (tel.length != 8 || !estChiffres(tel)) {
    alert("Le téléphone doit contenir 8 chiffres");
    return;
  }
  document.getElementById("msg").innerHTML =
    "Inscription enregistrée pour " + nom;
}''', "js", "js/controle.js"),
apercu('''<script>function estChiffres(ch){if(ch.length==0)return false;for(let i=0;i<ch.length;i++){if(ch[i]<"0"||ch[i]>"9")return false}return true}
function verifier(){let nom=document.getElementById("nom").value;let tel=document.getElementById("tel").value;if(nom.length<3){alert("Le nom doit contenir au moins 3 lettres");return}if(tel.length!=8||!estChiffres(tel)){alert("Le téléphone doit contenir 8 chiffres");return}document.getElementById("msg").innerHTML="Inscription enregistrée pour "+nom}</script>
<style>body{font:14px Arial}input{margin:3px 0}#msg{color:#1E7B3C;font-weight:bold}</style>
Nom : <input id="nom" value="Sami"><br>Téléphone : <input id="tel" value="9876543"><br><input type="button" value="Valider" onclick="verifier()"><p id="msg"></p>''', "localhost/inscription.html", 150,
       legende="Le numéro n'a que 7 chiffres : cliquez sur Valider, corrigez, recommencez."))}
""", "contrôle formulaire verifier alert return innerHTML validation saisie bouton onclick")

N.bloc(retenir([
    "Lire : <code>getElementById(id).value</code> ; écrire : <code>innerHTML</code>.",
    "Bouton : <code>input type=\"button\"</code> + <code>onclick</code>.",
    "Erreur : <code>alert()</code> puis <code>return</code>.",
    "Caractère : <code>ch[i]</code> ; extraction : <code>substring</code>.",
    "Arrondis : <code>Math.trunc</code> et <code>Math.round</code> seulement.",
    "Mois affiché : <code>getMonth() + 1</code>.",
], js=[
    ("alert(msg)", "Affiche un message"), ("prompt(msg)", "Saisie d'une valeur"),
    ("document.write(t)", "Écrit dans la page"), ("document.getElementById(id)", "Accède à un élément"),
    ("innerHTML", "Lit ou modifie le contenu d'un élément"),
    ("Number(ch) / parseInt(ch, b) / parseFloat(ch)", "Convertit une chaîne en nombre"),
    ("String(x)", "Convertit en chaîne"), ("isNaN(ch)", "Vrai si la valeur n'est pas un nombre"),
    ("ch.length", "Longueur de la chaîne"), ("ch.indexOf(ch1) / lastIndexOf(ch1)", "Première / dernière position"),
    ("ch.substring(d, f)", "Sous-chaîne de d à f exclu"), ("ch.replace(ch1, ch2)", "Remplace ch1 par ch2"),
    ("toUpperCase() / toLowerCase()", "Majuscules / minuscules"), ("ch.trim()", "Supprime les espaces aux extrémités"),
    ("String.fromCharCode(n)", "Caractère de code n"),
    ("Math.abs / sqrt / round / trunc", "Valeur absolue, racine, arrondi, partie entière"),
    ("Math.random()", "Réel aléatoire dans [0, 1["),
    ("new Date() / new Date(ch)", "Date du jour / date donnée"),
    ("getDate() / getMonth() / getFullYear()", "Jour, mois (0 à 11), année"),
    ("d.toString()", "Date complète sous forme de chaîne"),
]), "À retenir — JavaScript", "javascript méthodes")

# =====================================================================
N.module("Bases de données",
         "Comprendre le modèle relationnel, créer une base en mode assisté et l'interroger en SQL sur une seule table.")

N.notion("Vocabulaire du modèle relationnel", f"""
{tableau(["Terme", "Définition", "Exemple"], [
    ("Base de données relationnelle (BDR)", "Ensemble de tables liées entre elles", "bibliotheque"),
    ("SGBDR", "Logiciel qui gère la base", "MySQL (via phpMyAdmin)"),
    ("Table", "Ensemble d'enregistrements de même structure", "Livre"),
    ("Champ (colonne)", "Information élémentaire", "titre"),
    ("Enregistrement (ligne)", "Une occurrence complète", "(12, 'Le Prophète', …)"),
    ("Clé primaire", "Champ qui identifie chaque ligne de façon unique", "idLivre"),
    ("Clé étrangère", "Champ qui fait référence à la clé primaire d'une autre table", "idAuteur#")])}
""", "BDR SGBDR table champ enregistrement clé primaire clé étrangère vocabulaire")

N.notion("Représentation textuelle et relations", f"""
<p>La clé primaire est <b>soulignée</b>, la clé étrangère est suivie de <b>#</b>.</p>
<div class="code"><div class="code-tete"><span><span class="lang">Schéma</span>bibliotheque</span></div><pre class="language-none"><code class="language-none">Auteur (<span class="pk">idAuteur</span>, nom, nationalite)
Livre  (<span class="pk">idLivre</span>, titre, annee, idAuteur#)
Eleve  (<span class="pk">idEleve</span>, nom, prenom, classe)
Emprunt (<span class="pk">idLivre#</span>, <span class="pk">idEleve#</span>, <span class="pk">dateEmprunt</span>, dateRetour)</code></pre></div>
{tableau(["Relation", "Signification", "Exemple"], [
    ("1:1", "une ligne de A correspond à une seule ligne de B", "Lycée — Directeur"),
    ("1:∞", "une ligne de A correspond à plusieurs lignes de B", "Auteur — Livre"),
    ("∞:∞", "plusieurs lignes de A pour plusieurs lignes de B : table intermédiaire", "Livre — Élève (via Emprunt)")])}
""", "représentation textuelle graphique relation 1:1 1:n plusieurs souligné #")

N.notion("Types et contraintes", f"""
{tableau(["Type", "Usage"], [
    (c("INT"), "Entier"), (c("DECIMAL(p,d)"), "Réel : p chiffres dont d après la virgule"),
    (c("CHAR(n)"), "Chaîne de longueur fixe"), (c("VARCHAR(n)"), "Chaîne de longueur variable (n max)"),
    (c("TEXT"), "Texte long"), (c("DATE"), "Date AAAA-MM-JJ"), (c("TIME"), "Heure"), (c("DATETIME"), "Date et heure")])}
{tableau(["Contrainte", "Rôle"], [
    (c("PRIMARY KEY"), "Identifiant unique et non vide"), (c("FOREIGN KEY … REFERENCES"), "Lien vers une autre table"),
    (c("NOT NULL"), "Valeur obligatoire"), (c("UNIQUE"), "Pas de doublon"),
    (c("DEFAULT"), "Valeur par défaut"), (c("CHECK"), "Condition à respecter")])}
""", "type INT DECIMAL CHAR VARCHAR TEXT DATE TIME DATETIME contrainte PRIMARY KEY FOREIGN KEY NOT NULL UNIQUE DEFAULT CHECK")

N.notion("Créer la base en mode assisté (phpMyAdmin)", f"""
<p>En 3ème, la base et ses tables se créent <b>avec l'interface graphique</b> : aucune instruction CREATE, ALTER ou DROP n'est écrite à la main.</p>
<ol class="etapes">
<li><h4>Démarrer XAMPP</h4><p>Lancer Apache et MySQL, puis ouvrir <code>localhost/phpmyadmin</code>.</p></li>
<li><h4>Créer la base</h4><p>Onglet <i>Bases de données</i> : saisir <code>bibliotheque</code>, interclassement <code>utf8mb4_general_ci</code>.</p></li>
<li><h4>Créer chaque table</h4><p>Nom, nombre de colonnes, puis pour chaque champ : nom, type, taille, Null ou non, index <i>PRIMARY</i>.</p></li>
<li><h4>Relier les tables</h4><p>Onglet <i>Structure</i> → <i>Vue relationnelle</i> : choisir la table et le champ référencés (moteur InnoDB).</p></li>
<li><h4>Saisir des données</h4><p>Onglet <i>Insérer</i>, puis vérifier dans <i>Parcourir</i>.</p></li>
</ol>
""", "phpmyadmin mode assisté xampp créer base table interface graphique")

N.notion("Interroger une table en SQL", f"""
{code('''-- Sélection, condition, tri
SELECT titre, annee FROM Livre
WHERE annee >= 2000
ORDER BY annee DESC;

-- Sans doublons
SELECT DISTINCT nationalite FROM Auteur;

-- Opérateurs
SELECT * FROM Livre WHERE annee BETWEEN 1990 AND 2010;
SELECT * FROM Livre WHERE titre LIKE 'Le%';
SELECT * FROM Eleve WHERE classe IN ('3SI1', '3SI2');
SELECT * FROM Livre WHERE idAuteur IS NULL;

-- Mise à jour des données
INSERT INTO Eleve (idEleve, nom, prenom, classe)
VALUES (25, 'Ben Salah', 'Rim', '3SI1');

UPDATE Eleve SET classe = '3SI2' WHERE idEleve = 25;

DELETE FROM Eleve WHERE idEleve = 25;''', "sql")}
{enc("att", "<p>En 3ème : une seule table par requête. Jointures, fonctions d'agrégation, GROUP BY et sous-requêtes sont réservés à la 4ème.</p>")}
""", "SQL SELECT WHERE ORDER BY DISTINCT BETWEEN LIKE IN IS NULL INSERT UPDATE DELETE requête")

N.bloc(retenir([
    "Clé primaire soulignée, clé étrangère suivie de #.",
    "Relation ∞:∞ = table intermédiaire.",
    "Création de la base et des tables : mode assisté uniquement.",
    "Requêtes SQL sur une seule table.",
], autres=[("Instructions SQL de 3ème", ["Instruction", "Rôle"], [
    (c("SELECT … FROM … WHERE … ORDER BY"), "Consulter, filtrer, trier"), (c("DISTINCT"), "Supprimer les doublons"),
    (c("BETWEEN / LIKE / IN / IS NULL"), "Intervalle, motif, liste, valeur absente"),
    (c("AND / OR / NOT"), "Combiner des conditions"),
    (c("INSERT INTO … VALUES"), "Ajouter une ligne"), (c("UPDATE … SET … WHERE"), "Modifier des lignes"),
    (c("DELETE FROM … WHERE"), "Supprimer des lignes")])]), "À retenir — bases de données", "sql bdd")

# =====================================================================
N.module("Limites du programme et progression",
         "Ce qui ne s'enseigne pas en 3ème, et une organisation possible en cinq séquences.")

N.bloc(interdits("À ne pas enseigner en 3ème année", [
    "PHP<small>réservé à la 4ème</small>",
    "Flexbox et Grid<small>mise en page par float et position</small>",
    "Unités em, rem, vh, vw<small>px et % uniquement</small>",
    "console.log() et addEventListener<small>alert, innerHTML, événements HTML</small>",
    "getElementsByName<small>4ème</small>",
    "charAt, substr, Math.floor, Math.ceil, getDay<small>ch[i], substring, Math.trunc</small>",
    "&lt;button&gt;, onsubmit sur un bouton<small>input type=\"button\" + onclick</small>",
    "CREATE, ALTER, DROP écrits<small>mode assisté phpMyAdmin</small>",
    "Jointures, agrégats, GROUP BY, sous-requêtes<small>4ème</small>",
    "transition-timing-function, translateX/Y<small>hors annexe</small>",
]), "Interdits", "interdits 3ème")

N.bloc(f"""<article class="notion" id="m7-progression"><div class="notion-tete"><h3>Progression suggérée</h3><span class="annexe-tag">Proposition</span></div><div class="notion-corps">
{tableau(["Séquence", "Projet fil rouge", "Notions"], [
    ("1. HTML5 / CSS3 avancés", "Site « Découvrir la Tunisie »", "Sémantique, CSS externe, boîte, float, position, effets"),
    ("2. Systèmes et réseaux", "Le réseau du laboratoire", "Système d'exploitation, adressage, partage"),
    ("3. JavaScript", "Espace élève du lycée", "E/S, conditions, boucles, fonctions, String, Math, Date, formulaires"),
    ("4. Bases de données", "Bibliothèque du lycée", "Modèle relationnel, phpMyAdmin, SQL une table"),
    ("5. Objets connectés", "Station météo du lycée", "Capteurs, carte programmable")])}
</div></article>""", "Progression suggérée", "progression séquence projet fil rouge")

PAGE = N
