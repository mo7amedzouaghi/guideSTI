"""Génère la version 2 du site dans ../v2 : python3 v2.py
Contenus réutilisés (page_2/3/4, pedagogie, erreurs, outils), nouvelle organisation :
accueil = recherche, vérificateur de conformité, une page par séquence, vue par niveau."""
import importlib
import json
import os
import re
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import lib  # noqa: E402
from lib import esc, tableau, enc, interdits, carte, page_sections  # noqa: E402

SORTIE = os.path.join(os.path.dirname(ICI), "v2")
CHATBOT = "https://mo7amedzouaghi.github.io/annexe4STITN/"

NIVEAUX = {
    "2": ("2ème année", "Bases du Web", "Structurer une page en HTML5 et la mettre en forme avec du CSS en ligne et interne."),
    "3": ("3ème année", "Web interactif et bases de données", "HTML5 sémantique, CSS3 externe, mise en page et effets, JavaScript, bases de données en mode assisté."),
    "4": ("4ème année", "Bac — sites dynamiques", "Compléments HTML, CSS et JS, SQL complet, PHP et MySQL en mysqli procédural."),
}

MENU = [("verifier.html", "Vérifier un code", "cle"), ("n2.html", "2ème", "m2"), ("n3.html", "3ème", "m3"), ("n4.html", "4ème", "m4"),
        ("annexe.html", "Annexe", ""), ("pedagogie.html", "Enseigner", ""), ("erreurs.html", "Erreurs", ""), ("outils.html", "Outils", "")]

INDEX_NOTIONS = []


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
<title>{titre} — STI, l'annexe en pratique</title>
<meta name="description" content="{esc(description)}">
<link rel="icon" href="assets/flag.png">
<link rel="stylesheet" href="assets/vendor/fonts.css">
<link rel="stylesheet" href="assets/vendor/prism-tomorrow.css">
<link rel="stylesheet" href="assets/style.css">
<link rel="stylesheet" href="assets/v2.css">
</head>
<body class="{classe}" id="haut">
<header class="barre">
  <div class="barre-in">
    <a class="marque" href="index.html"><span class="marque-logo">STI</span><span class="marque-txt">L'annexe en pratique<small>Guide de l'enseignant STI</small></span></a>
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
      <h4>STI, l'annexe en pratique</h4>
      <p>Ressources pour les enseignants de Sciences et Technologies de l'Informatique, conformes à l'annexe officielle du programme tunisien.</p>
      <p>Conçu par <span class="signature">Zouaghi Mohamed</span>, professeur d'informatique au Lycée Oued Ellil.</p>
    </div>
    <div>
      <h4>Programme</h4>
      <a href="n2.html">2ème année</a><a href="n3.html">3ème année</a><a href="n4.html">4ème année</a><a href="annexe.html">Annexe complète</a>
    </div>
    <div>
      <h4>Outils</h4>
      <a href="verifier.html">Vérifier un code</a><a href="pedagogie.html">Enseigner pas à pas</a><a href="erreurs.html">Erreurs fréquentes</a><a href="outils.html">Logiciels et glossaire</a>
    </div>
  </div>
  <div class="pied-bas">Version 2 · octobre 2026 · <a href="../">Version 1 du guide</a> · En cas de doute, l'annexe officielle fait foi.</div>
</footer>
<script src="assets/vendor/prism.js"></script>
{scripts}
<script src="assets/app.js"></script>
</body>
</html>
"""


def bandeau(titre, chapeau, pastille=None, ariane=None):
    p = f'<span class="pastille-niveau">{pastille}</span><br>' if pastille else ""
    a = f'<nav class="ariane-v2" aria-label="Fil d\'Ariane">{ariane}</nav>' if ariane else ""
    return (f'<section class="bandeau"><div class="bandeau-grille" aria-hidden="true"></div><div class="bandeau-in">'
            f'{a}{p}<h1>{titre}</h1><p class="chapeau">{chapeau}</p></div></section>')


def lien_v1_vers_v2(html, modules_par_niveau):
    def rep(m):
        n, k = m.group(1), int(m.group(2))
        if k >= modules_par_niveau[n]:
            return f'href="n{n}.html#progression"'
        return f'href="n{n}-s{k}.html"'
    html = re.sub(r'href="niveau-(\d)\.html#m(\d+)"', rep, html)
    return re.sub(r'href="niveau-(\d)\.html"', r'href="n\1.html"', html)


def main():
    os.makedirs(SORTIE, exist_ok=True)
    niveaux = {n: importlib.import_module(f"page_{n}").PAGE for n in NIVEAUX}
    nb_seq = {n: len(p.modules) for n, p in niveaux.items()}  # le dernier module = limites et progression

    # ------------------------------------------------------------ pages séquence + vue niveau
    for n, page in niveaux.items():
        titre_n, sous_n, chapeau_n = NIVEAUX[n]
        mods = page.modules
        sequences, limites = mods[:-1], mods[-1]
        cartes = ""
        for k, (mid, num, titre, intro, blocs, sous) in enumerate(sequences, 1):
            f = f"n{n}-s{k}.html"
            notions = [t for i, t in sous if not t.startswith("À retenir")]
            cartes += (f'<a class="seq-carte" href="{f}"><span class="seq-num">{k:02d}</span><div><h3>{titre}</h3><p>{intro}</p>'
                       f'<ul>{"".join(f"<li>{esc(t)}</li>" for t in notions)}</ul></div></a>')
            INDEX_NOTIONS.append({"t": f"Chapitre {k} — {titre}", "u": f, "n": f"{n}ème", "k": intro})
            # navigation latérale
            nav = '<nav class="sommaire" aria-label="Chapitres"><h2>' + titre_n + '</h2><ol>'
            for k2, m2 in enumerate(sequences, 1):
                cur = ' class="actif" aria-current="page"' if k2 == k else ""
                nav += f'<li><a href="n{n}-s{k2}.html"{cur}>{k2}. {m2[2]}</a>'
                if k2 == k:
                    nav += "<ol>" + "".join(f'<li><a href="#{i}">{esc(t)}</a></li>' for i, t in sous) + "</ol>"
                nav += "</li>"
            nav += f'<li><a href="n{n}.html#progression">Limites et progression</a></li></ol></nav>'
            outils = (f'<div class="outils-seq"><button type="button" class="btn-imp" data-imprimer="retenir">Imprimer la fiche « À retenir »</button>'
                      f'<button type="button" class="btn-imp" data-imprimer="tout">Imprimer le chapitre</button>'
                      f'<a class="btn-imp" href="verifier.html?niveau={n}">Vérifier un code de {titre_n}</a></div>')
            prec = f'<a href="n{n}-s{k-1}.html">← {k-1}. {sequences[k-2][2]}</a>' if k > 1 else f'<a href="n{n}.html">← {titre_n}</a>'
            suiv = f'<a href="n{n}-s{k+1}.html">{k+1}. {sequences[k][2]} →</a>' if k < len(sequences) else f'<a href="n{n}.html#progression">Limites et progression →</a>'
            corps = (f'<div class="page">{nav}<div class="contenu">{outils}{"".join(blocs)}'
                     f'<nav class="suite" aria-label="Chapitres voisins">{prec}{suiv}</nav></div></div>')
            ariane = f'<a href="index.html">Accueil</a> › <a href="n{n}.html">{titre_n}</a> › Chapitre {k}'
            ecrire(f, gabarit(f, f"{titre} ({titre_n})", intro,
                              bandeau(titre, intro, f"{titre_n} · Chapitre {k}", ariane), corps, f"niv-{n}",
                              '<script src="assets/sequence.js"></script>', actif=f"n{n}.html"))
            for e in lib.INDEX:
                if e["u"].startswith(f"niveau-{n}.html#{mid}-"):
                    INDEX_NOTIONS.append({"t": e["t"], "u": f + "#" + e["u"].split("#")[1], "n": f"{n}ème", "k": e["k"]})
        # vue niveau
        lim_blocs = lien_v1_vers_v2("".join(limites[4]), nb_seq)
        vue = (f'<div class="page pleine"><h2 class="titre-section">Les chapitres</h2><div class="seq-grille">{cartes}</div>'
               f'<h2 class="titre-section" id="progression">Limites du programme et progression</h2>{lim_blocs}</div>')
        ariane = f'<a href="index.html">Accueil</a> › {titre_n}'
        ecrire(f"n{n}.html", gabarit(f"n{n}.html", titre_n, chapeau_n,
                                      bandeau(f"{titre_n} STI", chapeau_n, sous_n, ariane), vue, f"niv-{n}"))
        INDEX_NOTIONS.append({"t": f"{titre_n} — chapitres et progression", "u": f"n{n}.html", "n": f"{n}ème", "k": chapeau_n})

    # ------------------------------------------------------------ ressources réutilisées
    for nom, titre, chapeau, numerote in [
        ("pedagogie", "Enseigner pas à pas", "De la préparation de la rentrée à la correction des devoirs : une méthode conforme à l'annexe.", True),
        ("erreurs", "Erreurs fréquentes", "Code incorrect à gauche, version conforme à droite, avec l'explication.", False),
        ("outils", "Logiciels et glossaire", "Le laboratoire, la mise en route de XAMPP et le vocabulaire du programme.", False)]:
        mod = importlib.import_module(f"page_{nom}")
        som, corps = page_sections(f"{nom}.html", mod.S, numerote=numerote)
        corps = lien_v1_vers_v2(corps, nb_seq)
        for sid, t, intro, h, mots in mod.S:
            INDEX_NOTIONS.append({"t": t, "u": f"{nom}.html#{sid}", "n": "Guide", "k": intro + " " + mots})
        ecrire(f"{nom}.html", gabarit(f"{nom}.html", titre, chapeau, bandeau(titre, chapeau), f'<div class="page">{som}<div class="contenu">{corps}</div></div>'))

    # ------------------------------------------------------------ annexe complète (fiches détaillées)
    ecrire("annexe.html", gabarit("annexe.html", "Annexe complète",
        "Toutes les balises, propriétés, méthodes, fonctions et instructions de l'annexe, avec paramètres, exemple conforme et remarques.",
        bandeau("L'annexe complète", "Chaque élément autorisé, avec son niveau d'introduction, ses paramètres, un exemple conforme et les remarques utiles. Cliquez sur une ligne pour ouvrir la fiche."),
        """<div class="page pleine">
<div class="filtres" role="search">
  <input type="search" id="ref-q" placeholder="Filtrer : float, substring, GROUP BY, mysqli…" aria-label="Filtrer l'annexe">
  <div class="puces" id="ref-langue" aria-label="Langage">
    <button type="button" data-v="" aria-pressed="true">Tous</button><button type="button" data-v="HTML5" aria-pressed="false">HTML5</button><button type="button" data-v="CSS3" aria-pressed="false">CSS3</button><button type="button" data-v="JavaScript" aria-pressed="false">JavaScript</button><button type="button" data-v="SQL" aria-pressed="false">SQL</button><button type="button" data-v="PHP" aria-pressed="false">PHP</button>
  </div>
  <div class="puces" id="ref-niveau" aria-label="Niveau">
    <button type="button" data-v="" aria-pressed="true">Tous niveaux</button><button type="button" data-v="2" aria-pressed="false">2ème</button><button type="button" data-v="3" aria-pressed="false">3ème</button><button type="button" data-v="4" aria-pressed="false">4ème</button>
  </div>
  <span class="compteur" id="ref-compte" aria-live="polite"></span>
</div>
<div id="ref-liste"></div>
</div>""", "", '<script src="assets/data.js"></script>\n<script src="assets/fiche.js"></script>\n<script src="assets/annexe.js"></script>'))

    # ------------------------------------------------------------ vérificateur
    ecrire("verifier.html", gabarit("verifier.html", "Vérifier un code",
        "Collez un code HTML, CSS, JavaScript, SQL ou PHP : chaque élément hors annexe ou d'un niveau supérieur est signalé, avec l'alternative conforme.",
        bandeau("Vérifier un code", "Collez un support, un sujet ou une copie d'élève. Chaque élément hors annexe ou au-dessus du niveau choisi est signalé avec sa ligne et l'alternative conforme. Rien n'est envoyé sur Internet."),
        """<div class="page pleine verif">
<div class="verif-zone">
  <div class="verif-reglages">
    <label>Niveau
      <select id="v-niveau"><option value="2">2ème année</option><option value="3" selected>3ème année</option><option value="4">4ème année</option></select>
    </label>
    <label>Langage
      <select id="v-langue"><option value="auto" selected>Détection automatique</option><option value="html">Page HTML (avec CSS, JS, PHP)</option><option value="css">CSS seul</option><option value="js">JavaScript seul</option><option value="sql">SQL seul</option><option value="php">PHP seul</option></select>
    </label>
    <span class="verif-exemples">Essayer :
      <button type="button" data-exemple="html">Page HTML/CSS/JS</button>
      <button type="button" data-exemple="sql">Requêtes SQL</button>
      <button type="button" data-exemple="php">Script PHP</button>
    </span>
  </div>
  <textarea id="v-code" spellcheck="false" placeholder="Collez ici votre code (page HTML complète, feuille CSS, script JS, requêtes SQL ou script PHP)…" aria-label="Code à vérifier"></textarea>
  <div class="verif-actions">
    <button type="button" class="btn-principal" id="v-lancer">Vérifier la conformité</button>
    <button type="button" class="btn-sec" id="v-effacer">Effacer</button>
    <span class="verif-info">Analyse faite dans votre navigateur : le code n'est envoyé nulle part.</span>
  </div>
</div>
<div id="v-resultat" aria-live="polite"></div>
</div>""", "", '<script src="assets/data.js"></script>\n<script src="assets/verificateur.js"></script>\n<script src="assets/verifier-ui.js"></script>'))

    # ------------------------------------------------------------ accueil
    tuiles = "".join(
        f'<a class="tuile {c}" href="{u}"><span class="tuile-ic" aria-hidden="true">{i}</span><h3>{t}</h3><p>{d}</p></a>' for u, c, i, t, d in [
            ("verifier.html", "t-verif", "✔", "Vérifier un code", "Collez un support ou une copie : tout ce qui sort de l'annexe est signalé, ligne par ligne, avec la correction."),
            ("n3.html", "t-seq", "▤", "Préparer un cours", "Une page par chapitre : notions, exemples avec leur rendu, fiche « À retenir » imprimable."),
            ("annexe.html", "t-annexe", "§", "Consulter l'annexe", "Chaque élément avec ses paramètres, un exemple conforme et les remarques.")])
    niveaux_html = ""
    for n, page in niveaux.items():
        titre_n, sous_n, _ = NIVEAUX[n]
        seqs = "".join(f'<li><a href="n{n}-s{k}.html">{m[2]}</a></li>' for k, m in enumerate(page.modules[:-1], 1))
        niveaux_html += (f'<section class="niv-col niv-{n}"><h3><a href="n{n}.html"><b>{n}</b> {titre_n}</a></h3>'
                         f'<p>{sous_n}</p><ol>{seqs}</ol></section>')
    accueil_haut = f"""<section class="bandeau accueil-v2"><div class="bandeau-grille" aria-hidden="true"></div><div class="bandeau-in">
  <h1>Que cherchez-vous ?</h1>
  <p class="chapeau">Une balise, une propriété, une fonction ou un besoin : « arrondir un nombre », « centrer un titre », « jointure »…</p>
  <form class="grande-recherche" id="g-form" role="search" autocomplete="off">
    <input type="search" id="g-q" placeholder="Ex. : substring, float, liste déroulante, date du jour" aria-label="Rechercher">
    <button type="submit">Rechercher</button>
  </form>
  <div class="niveau-filtre" role="group" aria-label="Mon niveau">
    <span>Mon niveau :</span>
    <button type="button" data-n="0" aria-pressed="true">Tous</button><button type="button" data-n="2" aria-pressed="false">2ème</button><button type="button" data-n="3" aria-pressed="false">3ème</button><button type="button" data-n="4" aria-pressed="false">4ème</button>
  </div>
</div></section>"""
    accueil_corps = f"""<div class="page pleine">
<div id="g-resultats" aria-live="polite"></div>
<div id="g-accueil">
<div class="tuiles">{tuiles}</div>
<h2 class="titre-section">Les chapitres par niveau</h2>
<div class="niv-cols">{niveaux_html}</div>
</div>
</div>"""
    ecrire("index.html", gabarit("index.html", "Accueil",
        "Ressources STI conformes à l'annexe : recherche, vérificateur de conformité, séquences par niveau, annexe détaillée.",
        accueil_haut, accueil_corps, "accueil",
        '<script src="assets/data.js"></script>\n<script src="assets/moteur.js"></script>\n<script src="assets/notions.js"></script>\n<script src="assets/fiche.js"></script>\n<script src="assets/recherche.js"></script>', actif="index.html"))

    ecrire("assets/notions.js", "window.NOTIONS_STI = " + json.dumps(INDEX_NOTIONS, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("v2 :", len(os.listdir(SORTIE)), "fichiers ;", len(INDEX_NOTIONS), "notions indexées")


if __name__ == "__main__":
    main()
