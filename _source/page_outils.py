from lib import *

F = "outils.html"

S = []

S.append(("logiciels", "Logiciels du laboratoire", "Des outils gratuits, installés une fois sur chaque poste.", tableau(
    ["Outil", "Usage", "Niveau"], [
        ("Éditeur de code<br><small>Notepad++, Visual Studio Code</small>", "Écrire HTML, CSS, JS, PHP avec coloration syntaxique", "Tous"),
        ("Navigateurs<br><small>Firefox, Chrome</small>", "Tester les pages ; touche F12 pour inspecter les éléments", "Tous"),
        ("Validateur W3C<br><small><a href=\"https://validator.w3.org/\" target=\"_blank\" rel=\"noopener\">validator.w3.org</a></small>", "Vérifier qu'une page HTML est conforme", "Tous"),
        ("XAMPP", "Serveur local : Apache (pages PHP) et MySQL (bases de données)", "3ème et 4ème"),
        ("phpMyAdmin<br><small>localhost/phpmyadmin</small>", "Créer et gérer les bases en mode assisté, tester les requêtes SQL", "3ème et 4ème"),
    ]) + enc("astuce", "<p>Dans l'onglet <i>SQL</i> de phpMyAdmin, l'élève teste chaque requête avant de la placer dans son code PHP : une erreur SQL se corrige bien plus vite à cet endroit.</p>"),
    "éditeur notepad++ vscode navigateur validateur w3c xampp phpmyadmin apache mysql"))

S.append(("xampp", "Mettre en route un projet PHP", "Les étapes à suivre à chaque séance de 4ème.", """<ol class="etapes">
<li><h4>Lancer XAMPP Control Panel</h4><p>Cliquer sur <i>Start</i> devant Apache et MySQL : les deux lignes passent au vert.</p></li>
<li><h4>Placer le projet dans htdocs</h4><p>Dossier <code>C:\\xampp\\htdocs\\bibliotheque\\</code> contenant les pages et <code>connexion.php</code>.</p></li>
<li><h4>Créer ou importer la base</h4><p>Dans phpMyAdmin : nouvelle base, ou onglet <i>Importer</i> pour un fichier <code>.sql</code> fourni.</p></li>
<li><h4>Ouvrir par le serveur</h4><p>Saisir <code>localhost/bibliotheque/</code> dans le navigateur. Un double-clic sur un fichier .php affiche le code au lieu de l'exécuter.</p></li>
</ol>""" + enc("att", "<p>Apache ne démarre pas ? Un autre logiciel occupe souvent le port 80 (Skype, IIS). Fermez-le ou changez le port d'Apache dans la configuration de XAMPP.</p>"),
    "xampp htdocs localhost apache mysql port 80 projet php importer sql"))

GLOSSAIRE = [
    ("Annexe", "Document officiel qui liste, pour chaque niveau, les balises, propriétés, méthodes et instructions au programme."),
    ("Attribut", "Information ajoutée dans une balise HTML : <code>src</code>, <code>href</code>, <code>name</code>…"),
    ("Balise", "Élément de structure HTML délimité par des chevrons : <code>&lt;p&gt;</code>…<code>&lt;/p&gt;</code>."),
    ("Balise sémantique", "Balise qui indique le rôle d'une zone : <code>header</code>, <code>nav</code>, <code>main</code>, <code>footer</code>…"),
    ("Clé étrangère", "Champ qui fait référence à la clé primaire d'une autre table ; notée avec <b>#</b>."),
    ("Clé primaire", "Champ (ou groupe de champs) qui identifie chaque enregistrement de façon unique ; <span class=\"pk\">soulignée</span>."),
    ("Concaténation", "Mise bout à bout de chaînes : <code>+</code> en JavaScript, <code>.</code> en PHP."),
    ("CSS externe", "Feuille de style dans un fichier .css relié par <code>&lt;link&gt;</code> ; partagée par toutes les pages."),
    ("DOM", "Représentation de la page que JavaScript manipule (<code>getElementById</code>, <code>innerHTML</code>)."),
    ("Enregistrement", "Une ligne d'une table : toutes les valeurs décrivant un même objet."),
    ("Événement", "Action qui déclenche du code : clic, saisie, survol, chargement de la page."),
    ("Jointure", "Mise en relation de plusieurs tables par l'égalité clé étrangère = clé primaire, écrite dans WHERE."),
    ("LDD / LMD", "Langage de définition des données (CREATE, ALTER, DROP) / de manipulation (SELECT, INSERT, UPDATE, DELETE)."),
    ("Mode assisté", "Création de la base et des tables par l'interface de phpMyAdmin, sans écrire de SQL (3ème)."),
    ("Modèle de boîte", "Découpage d'un élément en contenu, padding, bordure et margin."),
    ("mysqli", "Ensemble de fonctions PHP procédurales pour dialoguer avec MySQL (seule méthode au programme)."),
    ("Pseudo-classe", "Sélecteur d'un état : <code>:hover</code>, <code>:focus</code>, <code>a:visited</code>…"),
    ("Requête", "Instruction SQL adressée à la base pour lire ou modifier des données."),
    ("SGBDR", "Système de gestion de bases de données relationnelles, par exemple MySQL."),
    ("Sous-requête", "Requête SELECT placée dans une autre ; en 4ème, uniquement non corrélée."),
    ("Superglobale", "Tableau PHP disponible partout : <code>$_GET</code> (paramètres d'URL), <code>$_POST</code> (formulaire)."),
    ("Transition", "Passage progressif d'une valeur CSS à une autre lors d'un changement d'état."),
    ("Validation W3C", "Contrôle automatique de la conformité d'une page HTML aux normes du Web."),
]

S.append(("glossaire", "Glossaire", "Les mots du programme, définis simplement, pour l'enseignant comme pour l'élève.",
          '<dl class="glossaire">' + "".join(f"<dt>{t}</dt><dd>{d}</dd>" for t, d in GLOSSAIRE) + "</dl>",
          "glossaire définition vocabulaire " + " ".join(t for t, _ in GLOSSAIRE)))


def generer(ecrire):
    som, corps = page_sections(F, S, numerote=False)
    ecrire(F, gabarit(F, "Outils et glossaire",
        "Les logiciels du laboratoire STI, la mise en route d'un projet PHP avec XAMPP et le glossaire du programme.",
        bandeau("Outils et glossaire", "Ce qu'il faut installer au laboratoire, comment démarrer un projet PHP sans perdre de temps, et le vocabulaire du programme expliqué simplement.",
                "Ressources", ["Logiciels gratuits", "XAMPP pas à pas", f"{len(GLOSSAIRE)} définitions"]),
        f'<div class="page">{som}<div class="contenu">{corps}</div></div>'))
