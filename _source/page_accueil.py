from lib import *

DEMO_CSS = '''.bouton {
  background-color: #0D2B6B;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  transition: background-color 0.6s;
}
.bouton:hover {
  background-color: #F5B800;
}'''

DEMO_APERCU = ('<style>body{font-family:Arial,sans-serif;margin:0;padding:22px;background:#fff}h2{font-size:17px;color:#0D2B6B;margin:0 0 6px}p{margin:0 0 14px;color:#444;font-size:14px}'
               '.bouton{display:inline-block;background-color:#0D2B6B;color:white;padding:12px 24px;border-radius:8px;transition:background-color .6s;cursor:pointer;font-weight:bold}'
               '.bouton:hover{background-color:#F5B800}</style><h2>Découvrir la Tunisie</h2><p>Carthage, Dougga, El Jem, Kairouan…</p><span class="bouton">Visiter les régions</span>')


def generer(ecrire):
    hero = f"""<section class="bandeau"><div class="bandeau-grille" aria-hidden="true"></div><div class="bandeau-in">
<div class="accueil-hero">
  <div>
    <span class="pastille-niveau">Guide de l'enseignant STI</span>
    <h1>Enseigner l'informatique en STI, conforme à l'annexe</h1>
    <p class="chapeau">Tout le programme de la 2ème à la 4ème année : chaque notion expliquée, illustrée par un code qui respecte l'annexe et son rendu réel, prête à être enseignée dès demain.</p>
    <div class="recherche-globale">
      <input type="search" id="recherche" placeholder="Une balise, une propriété, une fonction…" aria-label="Rechercher dans le guide" autocomplete="off">
      <div class="resultats" id="resultats" role="listbox"></div>
    </div>
  </div>
  <div class="demo" aria-label="Exemple : code CSS et rendu">
    {code(DEMO_CSS, "css", "css/style.css")}
    {apercu(DEMO_APERCU, "localhost/tunisie/index.html", 150, "Survolez le bouton : la transition est déclarée sur l'élément, comme l'exige l'annexe.")}
  </div>
</div></div></section>"""

    niveaux = [
        ("niveau-2.html", "var(--n2)", "2", "2ème année", "Bases du Web", ["Structure HTML5 et validation W3C", "Listes, tableaux, liens, médias", "Formulaires de base", "CSS en ligne et interne"]),
        ("niveau-3.html", "var(--n3)", "3", "3ème année", "Web interactif et bases de données", ["HTML5 sémantique, iframe, formulaires", "CSS3 externe, float, position", "Transitions, transformations, animations", "JavaScript et contrôle de formulaire", "Bases de données en mode assisté"]),
        ("niveau-4.html", "var(--n4)", "4", "4ème année", "Bac — sites dynamiques", ["Compléments HTML, CSS et JS", "SQL : définition et manipulation", "Agrégats, jointures, sous-requêtes", "PHP + MySQL en mysqli"]),
    ]
    cartes = "".join(
        f'<a class="niveau-carte" href="{u}" style="--c:{col}"><div class="haut"><b>{n}</b><div><h3>{t}</h3><p>{s}</p></div></div>'
        f'<ul>{"".join(f"<li>{x}</li>" for x in items)}</ul><div class="bas">Ouvrir le programme de {t}</div></a>'
        for u, col, n, t, s, items in niveaux)

    portes = [
        ("pedagogie.html", "🧭", "Enseigner pas à pas", "Préparer la rentrée, construire une séance, concevoir un TP, évaluer."),
        ("annexe.html", "📑", "Référentiel de l'annexe", "Chaque élément autorisé, filtrable par langage et par niveau."),
        ("erreurs.html", "🛠️", "Erreurs fréquentes", "Code incorrect et version conforme, côte à côte, commentés."),
        ("outils.html", "🧰", "Outils et glossaire", "Logiciels du labo, XAMPP pas à pas, vocabulaire du programme."),
    ]
    portes_h = "".join(f'<a class="porte" href="{u}"><span class="ic" aria-hidden="true">{i}</span><div><h3>{t}</h3><p>{d}</p></div></a>' for u, i, t, d in portes)

    lecture = f"""<div class="portes">
{carte("Le code et son rendu", "<p>Chaque exemple montre le code à gauche et la page réellement affichée à droite. Les aperçus sont vivants : survolez, cliquez, saisissez.</p>")}
{carte("La pastille de niveau", "<p>La pastille indique le niveau où la notion est introduite dans l'annexe : <span class='annexe-tag n2'>Annexe 2ème</span> <span class='annexe-tag n3'>Annexe 3ème</span> <span class='annexe-tag n4'>Annexe 4ème</span></p>")}
{carte("À retenir", "<p>En fin de séquence : la synthèse, le tableau des propriétés CSS (valeurs de l'annexe, valeur utilisée, définition) et celui des méthodes.</p>")}
{carte("Les interdits", "<p>Chaque niveau se termine par la liste de ce qui ne s'enseigne pas encore, avec l'alternative conforme.</p>")}
</div>"""

    regles = retenir([
        "Aucune mise en forme par balise HTML : tout passe par le CSS.",
        "Bouton de contrôle : <code>input type=\"button\"</code> + <code>onclick</code>.",
        "Unités CSS : <code>px</code> et <code>%</code> uniquement.",
        "JavaScript : <code>ch[i]</code>, <code>substring</code>, <code>Math.trunc</code>.",
        "Erreur de saisie : <code>alert()</code> puis <code>return</code>.",
        "SQL : jointures dans <code>WHERE</code>, date du jour <code>DATE(NOW())</code>.",
        "PHP : <code>mysqli</code> procédural, connexion dans <code>connexion.php</code>.",
        "Mots de passe comparés tels quels, sans hachage.",
    ], titre="Les règles qui reviennent à tous les niveaux")

    contenu = f"""<div class="page pleine">
<h2 class="titre-section">Choisir un niveau</h2>
<div class="niveaux">{cartes}</div>
<h2 class="titre-section">Par où commencer</h2>
<div class="portes">{portes_h}</div>
<h2 class="titre-section">Comment lire ce guide</h2>
{lecture}
<div style="margin-top:28px">{regles}</div>
</div>"""

    ecrire("index.html", gabarit("index.html", "Accueil",
        "Guide du programme STI pour les enseignants : HTML5, CSS3, JavaScript, SQL et PHP de la 2ème à la 4ème année, conforme à l'annexe officielle.",
        hero, contenu))
