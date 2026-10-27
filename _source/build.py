"""Génère le site dans le dossier parent : python3 build.py"""
import importlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from lib import gabarit, bandeau, INDEX  # noqa: E402

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NIVEAUX = {
    "2": ("2ème année STI", "Les fondements du Web : structurer une page en HTML5 et la mettre en forme avec du CSS en ligne et interne.",
          "Bases du Web", ["5 séquences", "HTML5 + CSS en ligne et interne", "Validation W3C"]),
    "3": ("3ème année STI", "Le Web interactif : HTML5 sémantique, CSS3 externe avec mise en page et effets, JavaScript pour contrôler les formulaires, et premières bases de données.",
          "Web interactif & bases de données", ["5 séquences", "HTML5 · CSS3 · JavaScript", "BDR en mode assisté"]),
    "4": ("4ème année — Bac Sciences de l'informatique", "Le site dynamique : compléments HTML/CSS/JS, SQL complet (définition et manipulation des données) et PHP avec MySQL en mysqli procédural.",
          "Sites dynamiques", ["5 séquences", "SQL LDD + LMD", "PHP + MySQL (mysqli)"]),
}


def ecrire(nom, contenu):
    with open(os.path.join(RACINE, nom), "w", encoding="utf-8") as f:
        f.write(contenu)
    print("écrit", nom)


def main():
    for n, (titre, chapeau, sous, faits) in NIVEAUX.items():
        try:
            mod = importlib.import_module(f"page_{n}")
        except ModuleNotFoundError:
            continue
        som, corps = mod.PAGE.rendu()
        ecrire(f"niveau-{n}.html", gabarit(
            f"niveau-{n}.html", titre, chapeau,
            bandeau(titre, chapeau, f"{n}ème année · {sous}", faits),
            f'<div class="page">{som}<div class="contenu">{corps}</div></div>', f"niv-{n}"))

    for nom in ("annexe", "pedagogie", "erreurs", "outils", "accueil"):
        try:
            mod = importlib.import_module(f"page_{nom}")
        except ModuleNotFoundError:
            continue
        mod.generer(ecrire)

    ecrire("assets/index-recherche.js",
           "window.INDEX_STI = " + json.dumps(INDEX, ensure_ascii=False, separators=(",", ":")) + ";\n")


if __name__ == "__main__":
    main()
