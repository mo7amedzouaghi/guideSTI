"""Génère l'espace Élèves dans ../eleves : python3 eleves.py
Pour chaque chapitre : Comprendre (notions + exemples à essayer), S'entraîner (exercices auto-corrigés),
Retenir (fiche imprimable). Outils : bac à sable avec vérification de conformité, aide-mémoire."""
import importlib
import json
import os
import re
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
from lib import esc, page_sections  # noqa: E402
from exercices import EX  # noqa: E402

SORTIE = os.path.join(os.path.dirname(ICI), "eleves")
NIVEAUX = {"2": ("2ème année", "Les bases du Web"), "3": ("3ème année", "Web interactif et bases de données"), "4": ("4ème année", "Bac — sites dynamiques")}
MENU = [("index.html", "Accueil", ""), ("n2.html", "2ème", "m2"), ("n3.html", "3ème", "m3"), ("n4.html", "4ème", "m4"),
        ("bac.html", "Bac à sable", "cle"), ("memo.html", "Aide-mémoire", ""), ("erreurs.html", "Erreurs à éviter", "")]

# passages rédigés pour l'enseignant, reformulés pour l'élève
REFORMULER = [
    ("L'élève doit savoir l'écrire de mémoire et expliquer le rôle de chaque ligne", "Tu dois savoir l'écrire de mémoire et expliquer le rôle de chaque ligne"),
    ("Faites dessiner le tableau sur papier avant de le coder : l'élève compte les lignes, et chaque ligne devient un",
     "Dessine le tableau sur papier avant de le coder : compte les lignes, chaque ligne devient un"),
    ("le lecteur est invisible et l'élève croit que", "le lecteur est invisible et on croit que"),
    ("par l'élève comme par les moteurs de recherche", "par toi comme par les moteurs de recherche"),
]


def pour_eleve(h):
    for a, b in REFORMULER:
        h = h.replace(a, b)
    h = re.sub(r'<div class="enc prof"><b class="ico" aria-hidden="true">✎</b><div><p>Fonction type à faire construire : (.*?)</p></div></div>',
               r'<div class="enc astuce"><b class="ico" aria-hidden="true">★</b><div><p>Fonction très utile : \1</p></div></div>', h, flags=re.S)
    return re.sub(r'<div class="enc prof">.*?</div></div>', "", h, flags=re.S)


def ecrire(nom, contenu):
    with open(os.path.join(SORTIE, nom), "w", encoding="utf-8") as f:
        f.write(contenu)


def gabarit(fichier, titre, description, haut, contenu, classe="", scripts="", actif=None):
    actif = actif or fichier
    menu = "".join(f'<a href="{f}" class="{cl}"{" aria-current=\"page\"" if f == actif else ""}>{t}</a>' for f, t, cl in MENU)
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{titre} — STI Espace Élèves</title>
<meta name="description" content="{esc(description)}">
<link rel="icon" href="assets/flag.png">
<link rel="stylesheet" href="assets/vendor/fonts.css">
<link rel="stylesheet" href="assets/vendor/prism-tomorrow.css">
<link rel="stylesheet" href="assets/style.css">
<link rel="stylesheet" href="assets/eleves.css">
</head>
<body class="{classe}" id="haut">
<header class="barre">
  <div class="barre-in">
    <a class="marque" href="index.html"><span class="marque-logo">STI</span><span class="marque-txt">Espace Élèves<small>Apprendre le Web pas à pas</small></span></a>
    <button class="burger" type="button" aria-expanded="false" aria-label="Ouvrir le menu">Menu</button>
    <nav class="menu" aria-label="Navigation principale">{menu}</nav>
  </div>
</header>
<main>
{haut}
{contenu}
</main>
<footer class="pied">
  <div class="pied-in">
    <div>
      <h4>STI · Espace Élèves</h4>
      <p>Cours, exercices corrigés et bac à sable pour les élèves de Sciences et Technologies de l'Informatique, conformes au programme officiel tunisien.</p>
      <p>Conçu par <span class="signature">Zouaghi Mohamed</span>, Lycée Oued Ellil.</p>
    </div>
    <div>
      <h4>Mon niveau</h4>
      <a href="n2.html">2ème année</a><a href="n3.html">3ème année</a><a href="n4.html">4ème année</a>
    </div>
    <div>
      <h4>Outils</h4>
      <a href="bac.html">Bac à sable</a><a href="memo.html">Aide-mémoire</a><a href="erreurs.html">Erreurs à éviter</a><a href="../prof/">Espace Prof</a>
    </div>
  </div>
  <div class="pied-bas">Ta progression est enregistrée sur cet appareil uniquement.</div>
</footer>
<script src="assets/vendor/prism.js"></script>
{('<script src="assets/plan.js"></script>' + chr(10)) if "eleve.js" in scripts else ""}{scripts}
<script src="assets/app.js"></script>
</body>
</html>
"""


def bandeau(titre, chapeau, pastille=None, ariane=None, extra=""):
    p = f'<span class="pastille-niveau">{pastille}</span><br>' if pastille else ""
    a = f'<nav class="ariane-v2" aria-label="Fil d\'Ariane">{ariane}</nav>' if ariane else ""
    return (f'<section class="bandeau"><div class="bandeau-grille" aria-hidden="true"></div><div class="bandeau-in">'
            f'{a}{p}<h1>{titre}</h1><p class="chapeau">{chapeau}</p>{extra}</div></section>')


def main():
    os.makedirs(SORTIE, exist_ok=True)
    niveaux = {n: importlib.import_module(f"page_{n}").PAGE for n in NIVEAUX}
    plan = {}

    for n, page in niveaux.items():
        titre_n, sous_n = NIVEAUX[n]
        chapitres = page.modules[:-1]
        plan[n] = []
        for k, (mid, num, titre, intro, blocs, sous) in enumerate(chapitres, 1):
            f = f"n{n}-c{k}.html"
            exos = EX.get((n, k), [])
            plan[n].append({"k": k, "t": titre, "i": intro, "f": f, "nb": len(exos)})
            notions = [b for b in blocs if "a-retenir" not in b[:80]]
            retenir = [b for b in blocs if "a-retenir" in b[:80]]
            comprendre = pour_eleve("".join(notions))
            onglets = ('<nav class="etapes-chap" aria-label="Étapes du chapitre">'
                       '<a href="#comprendre"><b>1</b>Je comprends</a><a href="#entrainer"><b>2</b>Je m\'entraîne</a><a href="#retenir"><b>3</b>Je retiens</a></nav>')
            corps = f"""<div class="page pleine chap" data-niveau="{n}" data-chap="{k}">
{onglets}
<section id="comprendre" class="etape"><h2 class="etape-titre"><b>1</b> Je comprends</h2>
<p class="etape-aide">Lis chaque notion, observe le rendu, puis clique sur <strong>« Essayer »</strong> sous un code pour le modifier dans le bac à sable.</p>
{comprendre}</section>
<section id="entrainer" class="etape"><h2 class="etape-titre"><b>2</b> Je m'entraîne</h2>
<p class="etape-aide">{len(exos)} questions corrigées immédiatement. Ton meilleur score est enregistré sur cet appareil.</p>
<div id="quiz"></div></section>
<section id="retenir" class="etape"><h2 class="etape-titre"><b>3</b> Je retiens</h2>
<div class="outils-retenir"><button type="button" class="btn-imp" data-imprimer="retenir">Imprimer ma fiche « À retenir »</button></div>
{"".join(retenir)}</section>
<nav class="suite" aria-label="Chapitres voisins">{f'<a href="n{n}-c{k-1}.html">← {chapitres[k-2][2]}</a>' if k > 1 else f'<a href="n{n}.html">← {titre_n}</a>'}{f'<a href="n{n}-c{k+1}.html">{chapitres[k][2]} →</a>' if k < len(chapitres) else f'<a href="n{n}.html">Tous les chapitres →</a>'}</nav>
</div>
<script>window.EXOS = {json.dumps(exos, ensure_ascii=False)};</script>"""
            ariane = f'<a href="index.html">Accueil</a> › <a href="n{n}.html">{titre_n}</a> › Chapitre {k}'
            ecrire(f, gabarit(f, titre, intro, bandeau(titre, intro, f"{titre_n} · Chapitre {k}", ariane), corps, f"niv-{n}",
                              '<script src="assets/quiz.js"></script>\n<script src="assets/eleve.js"></script>', actif=f"n{n}.html"))

        cartes = "".join(
            f'<a class="chap-carte" href="{c["f"]}" data-score="{n}-{c["k"]}"><span class="chap-num">{c["k"]}</span><div class="chap-txt"><h3>{c["t"]}</h3><p>{c["i"]}</p>'
            f'<div class="prog"><div class="prog-barre"><span></span></div><span class="prog-txt">Pas encore commencé</span></div></div></a>' for c in plan[n])
        ariane = f'<a href="index.html">Accueil</a> › {titre_n}'
        ecrire(f"n{n}.html", gabarit(f"n{n}.html", titre_n, sous_n,
               bandeau(f"{titre_n} STI", sous_n, "Mon parcours", ariane,
                       '<nav class="choix-niveau" aria-label="Changer de niveau"><span>Niveau :</span>' +
                       "".join(f'<a href="n{x}.html"{" aria-current=\"page\"" if x == n else ""}>{x}ème année</a>' for x in NIVEAUX) + "</nav>"),
               f'<div class="page pleine"><div class="chap-liste">{cartes}</div>'
               f'<p class="conseil">Conseil : suis les chapitres dans l\'ordre. Un chapitre est <strong>maîtrisé</strong> quand ton score d\'entraînement atteint 80 %.</p></div>',
               f"niv-{n}", '<script src="assets/eleve.js"></script>'))

    # ---------------------------------------------------------------- accueil
    niveaux_cartes = "".join(
        f'<a class="niv-choix niv-{n}" href="n{n}.html" data-niveau-total="{n}"><b>{n}</b><span>{NIVEAUX[n][0]}</span><small>{NIVEAUX[n][1]}</small>'
        f'<div class="prog"><div class="prog-barre"><span></span></div><span class="prog-txt"></span></div></a>' for n in NIVEAUX)
    haut = f"""<section class="bandeau accueil-eleves"><div class="bandeau-grille" aria-hidden="true"></div><div class="bandeau-in">
<h1>Apprendre le Web, pas à pas</h1>
<p class="chapeau">Comprends une notion, entraîne-toi avec des exercices corrigés, puis teste ton propre code dans le bac à sable. Choisis ton niveau pour commencer.</p>
<div class="niv-choix-grille">{niveaux_cartes}</div>
</div></section>"""
    outils = "".join(
        f'<a class="porte" href="{u}"><span class="ic" aria-hidden="true">{i}</span><div><h3>{t}</h3><p>{d}</p></div></a>' for u, i, t, d in [
            ("bac.html", "▶", "Bac à sable", "Écris du HTML, du CSS et du JavaScript, vois le résultat en direct et vérifie que ton code respecte le programme."),
            ("memo.html", "§", "Aide-mémoire", "Toutes les balises, propriétés et fonctions de ton niveau, avec un exemple et les pièges à éviter."),
            ("erreurs.html", "⚠", "Erreurs à éviter", "Les erreurs les plus fréquentes, avec la version correcte à côté."),
        ])
    methode = """<ol class="methode">
<li><b>1</b><div><h3>Je comprends</h3><p>Chaque notion avec un exemple et son rendu réel.</p></div></li>
<li><b>2</b><div><h3>Je m'entraîne</h3><p>Des questions corrigées tout de suite, avec l'explication.</p></div></li>
<li><b>3</b><div><h3>Je retiens</h3><p>La fiche de synthèse, à imprimer et à garder.</p></div></li>
<li><b>4</b><div><h3>Je pratique</h3><p>J'écris mon code dans le bac à sable et je le vérifie.</p></div></li>
</ol>"""
    ecrire("index.html", gabarit("index.html", "Accueil", "Espace élèves STI : cours, exercices corrigés, bac à sable et aide-mémoire, conformes au programme.",
           haut, f'<div class="page pleine"><h2 class="titre-section">Comment ça marche</h2>{methode}<h2 class="titre-section">Mes outils</h2><div class="portes outils-eleves">{outils}</div></div>',
           "accueil", '<script src="assets/eleve.js"></script>'))

    # ---------------------------------------------------------------- bac à sable
    ecrire("bac.html", gabarit("bac.html", "Bac à sable",
        "Écris du HTML, du CSS et du JavaScript, vois le résultat en direct et vérifie la conformité de ton code.",
        "", """<div class="bac" id="bac">
  <div class="bac-barre">
    <h1>Bac à sable</h1>
    <label>Mon niveau <select id="b-niveau"><option value="2">2ème</option><option value="3" selected>3ème</option><option value="4">4ème</option></select></label>
    <button type="button" class="btn-principal" id="b-verifier">Vérifier mon code</button>
    <button type="button" class="btn-sec" id="b-telecharger">Télécharger ma page</button>
    <button type="button" class="btn-sec" id="b-vider">Recommencer</button>
  </div>
  <div class="bac-grille">
    <div class="bac-edit">
      <div class="bac-onglets" role="tablist">
        <button type="button" role="tab" data-p="html" aria-selected="true">HTML</button>
        <button type="button" role="tab" data-p="css" aria-selected="false">CSS</button>
        <button type="button" role="tab" data-p="js" aria-selected="false">JavaScript</button>
      </div>
      <textarea id="b-html" class="bac-zone" spellcheck="false" aria-label="Code HTML"></textarea>
      <textarea id="b-css" class="bac-zone" spellcheck="false" aria-label="Code CSS" hidden></textarea>
      <textarea id="b-js" class="bac-zone" spellcheck="false" aria-label="Code JavaScript" hidden></textarea>
    </div>
    <div class="bac-rendu">
      <div class="navigateur"><div class="navigateur-tete"><span class="points"><i></i><i></i><i></i></span><span class="url">localhost/ma-page.html</span></div>
      <iframe id="b-apercu" title="Rendu de ma page" sandbox="allow-scripts allow-modals"></iframe></div>
    </div>
  </div>
  <div id="b-resultat" aria-live="polite"></div>
</div>""", "bac-page", '<script src="assets/data.js"></script>\n<script src="assets/verificateur.js"></script>\n<script src="assets/bac.js"></script>', actif="bac.html"))

    # ---------------------------------------------------------------- aide-mémoire
    ecrire("memo.html", gabarit("memo.html", "Aide-mémoire",
        "Les balises, propriétés et fonctions de ton niveau, avec exemple et remarques.",
        bandeau("Aide-mémoire", "Tout ce que tu as le droit d'utiliser à ton niveau. Ouvre une fiche pour voir les paramètres, un exemple et les pièges à éviter."),
        """<div class="page pleine">
<div class="filtres" role="search">
  <input type="search" id="ref-q" placeholder="Chercher : float, substring, liste…" aria-label="Chercher dans l'aide-mémoire">
  <div class="puces" id="ref-langue" aria-label="Langage">
    <button type="button" data-v="" aria-pressed="true">Tous</button><button type="button" data-v="HTML5" aria-pressed="false">HTML5</button><button type="button" data-v="CSS3" aria-pressed="false">CSS3</button><button type="button" data-v="JavaScript" aria-pressed="false">JavaScript</button><button type="button" data-v="SQL" aria-pressed="false">SQL</button><button type="button" data-v="PHP" aria-pressed="false">PHP</button>
  </div>
  <div class="puces" id="ref-niveau" aria-label="Mon niveau">
    <button type="button" data-v="2" aria-pressed="false">2ème</button><button type="button" data-v="3" aria-pressed="true">3ème</button><button type="button" data-v="4" aria-pressed="false">4ème</button>
  </div>
  <span class="compteur" id="ref-compte" aria-live="polite"></span>
</div>
<div id="ref-liste"></div>
</div>""", "", '<script src="assets/data.js"></script>\n<script src="assets/fiche.js"></script>\n<script src="assets/memo.js"></script>'))

    # ---------------------------------------------------------------- erreurs
    mod = importlib.import_module("page_erreurs")
    som, corps = page_sections("erreurs.html", mod.S, numerote=False)
    ecrire("erreurs.html", gabarit("erreurs.html", "Erreurs à éviter", "Les erreurs les plus fréquentes, avec la version correcte.",
           bandeau("Erreurs à éviter", "À gauche le code incorrect, à droite la version correcte, avec l'explication."),
           f'<div class="page">{som}<div class="contenu">{corps}</div></div>'))

    ecrire("assets/plan.js", "window.PLAN_STI = " + json.dumps(plan, ensure_ascii=False) + ";\n")
    print("élèves :", len([f for f in os.listdir(SORTIE) if f.endswith('.html')]), "pages ;", sum(len(v) for v in EX.values()), "questions")


if __name__ == "__main__":
    main()
