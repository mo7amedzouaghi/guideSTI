from lib import *

F = "pedagogie.html"

S = []

S.append(("rentree", "Préparer sa rentrée", "Les cinq choses à régler avant la première séance.", f"""
{carte("Liste de préparation", '''<ul class="coches" style="columns:1">
<li><b>Télécharger l'annexe officielle</b> de chaque niveau enseigné et la garder ouverte en permanence : c'est la seule référence de ce qui s'enseigne et se note.</li>
<li><b>Établir la progression annuelle</b> : répartir les séquences par trimestre en tenant compte des congés et des semaines de devoirs (modèles dans les pages <a href="niveau-2.html#m6">2ème</a>, <a href="niveau-3.html#m7">3ème</a>, <a href="niveau-4.html#m6">4ème</a>).</li>
<li><b>Tester le laboratoire</b> : éditeur de code, navigateurs, XAMPP (Apache + MySQL) et phpMyAdmin sur chaque poste.</li>
<li><b>Créer l'arborescence de travail</b> : un dossier par classe et par élève sur le serveur ou le poste (voir la section Laboratoire).</li>
<li><b>Choisir un projet fil rouge</b> par séquence, ancré dans la vie de l'élève : lycée, région, club, patrimoine tunisien.</li>
</ul>''')}
""", "rentrée préparation annexe progression laboratoire projet fil rouge"))

S.append(("regle", "La règle d'or : l'annexe", "Ce qui n'est pas dans l'annexe ne s'enseigne pas et ne se note pas, même si cela fonctionne.", f"""
{enc("att", "<p>Beaucoup de tutoriels en ligne utilisent Flexbox, <code>addEventListener</code>, <code>charAt</code>, <code>JOIN</code> ou PDO. Ces techniques fonctionnent, mais elles sont <b>hors programme</b> : un élève qui les utilise à l'épreuve pratique s'éloigne du corrigé officiel.</p>")}
{tableau(["Si vous voulez…", "Hors annexe", "Conforme à l'annexe"], [
    ("Mettre un texte en gras", c("<b>, <strong>"), c("font-weight: bold;")),
    ("Créer un bouton de contrôle", c("<button>"), c('<input type="button" onclick="verifier()">')),
    ("Lire le 3e caractère", c("ch.charAt(2)"), c("ch[2]")),
    ("Extraire une sous-chaîne", c("ch.substr(0, 3)"), c("ch.substring(0, 3)")),
    ("Partie entière", c("Math.floor(x)"), c("Math.trunc(x)")),
    ("Afficher un résultat", c("console.log(x)"), c("alert(x) ou innerHTML")),
    ("Disposer deux blocs côte à côte", c("display: flex"), c("float: left / right")),
    ("Relier deux tables", c("JOIN … ON"), c("FROM A, B WHERE A.id = B.id")),
    ("Date du jour en SQL", c("CURDATE()"), c("DATE(NOW())")),
    ("Se connecter à MySQL en PHP", c("new PDO(…)"), c("mysqli_connect(…)"))])}
{enc("astuce", '<p>Un doute sur un élément ? Cherchez-le dans le <a href="annexe.html">référentiel</a> ou interrogez le <a href="https://mo7amedzouaghi.github.io/annexe4STITN/" target="_blank" rel="noopener">chatbot de l\'annexe</a>.</p>')}
""", "règle annexe hors programme interdit conforme"))

S.append(("seance", "Construire une séance", "La pédagogie par projet : chaque séance fait avancer un projet concret que l'élève construit lui-même.", f"""
<ol class="etapes">
<li><h4>En-tête</h4><p>Niveau, séquence, numéro de séance, durée, projet fil rouge.</p></li>
<li><h4>Objectifs et prérequis</h4><p>Deux ou trois objectifs avec des verbes d'action observables : <i>créer</i>, <i>appliquer</i>, <i>contrôler</i>, <i>corriger</i>. Jamais « comprendre » ou « connaître ».</p></li>
<li><h4>Situation de départ</h4><p>Un besoin réel du projet : « Le menu du site touristique doit changer de couleur au survol. » L'élève comprend pourquoi il apprend.</p></li>
<li><h4>Activités</h4><p>Découverte (l'élève essaie et observe), construction guidée (le professeur structure), application autonome (l'élève réinvestit seul). Consignes numérotées, fichiers à créer, aperçu attendu.</p></li>
<li><h4>À retenir</h4><p>Synthèse courte, puis <b>tableau des nouvelles propriétés CSS</b> (valeurs possibles selon l'annexe, valeur utilisée, définition) et <b>tableau des méthodes JS</b> (définition). Ajouter les erreurs fréquentes.</p></li>
<li><h4>Évaluation formative</h4><p>Une partie théorique (QCM, vrai/faux justifié, repérer l'erreur) et une partie pratique courte sur le projet.</p></li>
<li><h4>Corrigé</h4><p>Rédigé avant la séance : il révèle souvent une consigne ambiguë.</p></li>
</ol>
{carte("Exemple : 3ème année, séquence 1, séance 9 (2 h)", tableau(["Rubrique", "Contenu"], [
    ("Projet", "Site « Découvrir la Tunisie »"),
    ("Objectifs", "Appliquer une transition à un bouton du menu ; régler sa durée et son délai."),
    ("Prérequis", "Sélecteurs, :hover, propriétés de couleur et de taille."),
    ("Situation de départ", "Le changement de couleur du menu est brutal : le client veut un effet progressif."),
    ("Découverte", "Survoler le menu fourni, observer, puis ajouter <code>transition: background-color 1s;</code> et comparer."),
    ("Construction", "Rôle de transition-property, -duration, -delay ; pourquoi la transition se déclare sur l'élément."),
    ("Application", "Agrandir les vignettes des régions au survol (largeur 150px → 200px en 0,8 s)."),
    ("Évaluation formative", "QCM sur l'emplacement de la transition + modification de la durée sur le projet.")]), "Modèle")}
""", "séance pédagogie projet objectifs situation départ activités à retenir évaluation formative corrigé"))

S.append(("tp", "Concevoir un TP", "Un bon TP se fait en autonomie : l'élève sait quoi produire, où l'enregistrer et comment il sera noté.", f"""
<ol class="etapes">
<li><h4>Contexte</h4><p>Deux ou trois lignes qui situent le projet (ex. : « Le club robotique ouvre les inscriptions en ligne. »).</p></li>
<li><h4>Fichiers fournis</h4><p>Un dossier de départ (<code>index.html</code>, <code>css/style.css</code>, <code>js/controle.js</code>, images) pour que la séance porte sur les notions visées, pas sur la saisie.</p></li>
<li><h4>Travail demandé</h4><p>Questions numérotées, une notion par question, du plus simple au plus difficile, avec un aperçu attendu.</p></li>
<li><h4>Consignes de sauvegarde</h4><p>Dossier à créer (<code>D:\\Bac2027\\NomPrenom</code>), noms de fichiers imposés, enregistrement régulier.</p></li>
<li><h4>Corrigé et barème</h4><p>Code conforme, indenté et commenté, plus une grille critère par critère.</p></li>
</ol>
{enc("prof", "<p>Testez toujours le TP sur un poste du labo, avec les fichiers fournis aux élèves, avant la séance. Un chemin d'image erroné peut bloquer toute une classe.</p>")}
""", "TP travaux pratiques énoncé fichiers fournis consignes sauvegarde barème"))

S.append(("evaluer", "Évaluer", "Formative à chaque séance, sommative chaque trimestre : deux contrôles d'une heure et un devoir de synthèse de deux heures.", f"""
{tableau(["Évaluation", "Durée", "Contenu", "Livrables"], [
    ("Formative", "10 à 20 min", "Théorie (QCM, vrai/faux) + petite tâche pratique", "Énoncé + corrigé"),
    ("Contrôle n°1 et n°2", "1 h", "Partie théorique + partie pratique, sur 20", "Énoncé, corrigé commenté, grille"),
    ("Devoir de synthèse", "2 h", "Partie théorique + partie pratique sur un projet complet", "Énoncé, fichiers de départ, corrigé, grille détaillée"),
    ("Bac pratique (4ème)", "1 h", "Application Web : HTML, CSS, JS, PHP, MySQL", "Format proche du sujet officiel")])}
{carte("Exemple de grille de correction — contrôle de formulaire en JavaScript", tableau(["Critère", "Points"], [
    ("Bouton <code>input type=\"button\"</code> appelant <code>verifier()</code>", "1"),
    ("Lecture correcte des champs (<code>getElementById(…).value</code>)", "2"),
    ("Contrôle du nom (longueur minimale) avec <code>alert</code> + <code>return</code>", "3"),
    ("Contrôle du téléphone : 8 caractères, chiffres uniquement (<code>estChiffres</code>)", "4"),
    ("Message de succès écrit avec <code>innerHTML</code>", "2"),
    ("Mise en forme CSS demandée (externe, propriétés de l'annexe)", "5"),
    ("Code indenté, commenté, fichiers bien nommés et enregistrés", "3"),
    ("Total", "20")]), "Barème")}
""", "évaluation contrôle synthèse barème grille correction bac pratique"))

S.append(("labo", "Gérer le laboratoire", "Des habitudes simples qui évitent la perte de travail et font gagner du temps à chaque séance.", f"""
{duo(code('''D:\\STI\\
└── 3SI1\\
    └── BenSalah_Rim\\
        └── tunisie\\
            ├── index.html
            ├── regions.html
            ├── css\\
            │   └── style.css
            ├── js\\
            │   └── controle.js
            └── images\\
                └── carthage.jpg''', "txt", "Arborescence type"),
carte("Bonnes pratiques", '''<ul class="coches" style="columns:1">
<li>Noms de fichiers en minuscules, sans espace ni accent.</li>
<li>Un dossier <code>css</code>, un dossier <code>js</code>, un dossier <code>images</code>.</li>
<li>Pour PHP : projets dans <code>C:\\xampp\\htdocs</code>, page ouverte par <code>localhost/projet/</code>, jamais par double-clic.</li>
<li>Démarrer Apache et MySQL au début de la séance, pas pendant.</li>
<li>Sauvegarde sur clé ou sur le serveur en fin de séance.</li>
</ul>'''))}
""", "laboratoire dossier arborescence nommage xampp htdocs sauvegarde"))

S.append(("verifier", "Avant de distribuer un support", "La vérification finale, à faire pour chaque cours, TP ou devoir.", f"""
{carte("Contrôle de conformité", '''<ul class="coches" style="columns:1">
<li>Chaque balise, propriété, valeur, méthode et requête figure dans l'annexe du niveau.</li>
<li>Aucune notion n'est utilisée avant d'avoir été enseignée.</li>
<li>Le « À retenir » contient le tableau des propriétés CSS et le tableau des méthodes JS.</li>
<li>L'évaluation formative a une partie théorique et une partie pratique, avec son corrigé.</li>
<li>Le code a été exécuté : rendu vérifié dans le navigateur, page validée par le W3C.</li>
<li>Le code est indenté et commenté ; les noms de fichiers sont ceux de l'énoncé.</li>
<li>Aucune mise en forme par balise HTML ; boutons en <code>input type="button"</code>.</li>
</ul>''')}
""", "vérification conformité checklist support distribuer"))

def generer(ecrire):
    som, corps = page_sections(F, S)
    ecrire(F, gabarit(F, "Enseigner pas à pas",
        "Guide pratique pour l'enseignant STI débutant : préparer l'année, construire une séance, concevoir un TP, évaluer et gérer le laboratoire.",
        bandeau("Enseigner pas à pas", "Pour l'enseignant qui débute en STI : de la préparation de la rentrée à la correction des devoirs, une méthode éprouvée et conforme à l'annexe.",
                "Accompagnement", ["Pédagogie par projet", "Modèles de séance et de TP", "Grilles d'évaluation"]),
        f'<div class="page">{som}<div class="contenu">{corps}</div></div>'))
