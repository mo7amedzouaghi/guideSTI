"""Référentiel de l'annexe : données issues des fichiers JSON de l'annexe officielle,
avec le niveau d'introduction retenu par le guide."""
import json
import os
from lib import gabarit, bandeau, enc, indexer

ICI = os.path.dirname(os.path.abspath(__file__))
CLES = ("balise", "sélecteur", "propriété", "méthode", "fonction", "opérateur", "événement",
        "attribut", "commande", "contrainte", "variable", "type")

N2 = {
    "html5": {"<html>", "<head>", "<body>", "<meta>", "<title>", "<style>", "<p>", "<h1> à <h6>", "<hr>", "<img>",
              "<audio>", "<video>", "<a>", "<br>", "<ul>", "<ol>", "<li>", "<table>", "<thead>", "<tbody>", "<tfoot>",
              "<tr>", "<th>", "<td>", "<caption>", "<form>", "<fieldset>", "<legend>", "<label>", "<input>",
              "<textarea>", "<select>", "<option>", "style", "lang"},
    "css3": {"element", "font-family", "font-weight", "font-style", "font-size", "font", "text-align", "color",
             "border-color", "border-style", "border-width", "border", "background-color", "background-image",
             "background-repeat", "background"},
}
N4 = {
    "html5": {"<datalist>", "onmouseover", "onmouseout", "onplay", "onpause", "onsubmit", "onkeydown", "onkeyup"},
    "css3": {"element[attr]", "element[attr=valeur]", "element.class", "a:link", "a:visited", ":focus", "a:active", "filter"},
    "javascript": {"document.getElementsByName()"},
    "sql": {"ON UPDATE CASCADE", "ON DELETE CASCADE"},
}
CAT4 = {
    "javascript": {"Modification du contenu, des attributs ou des styles des éléments HTML"},
    "sql": {"Fonctions définies sur le type date", "Fonctions d'agrégation", "Définition des données"},
}
REMARQUES = {
    "ALTER TABLE ALTER": "Ne modifie pas le type d'une colonne sous MySQL : enseigner ALTER TABLE t CHANGE col col type.",
    "ALTER TABLE RENAME": "Pour renommer une colonne sous MySQL : ALTER TABLE t CHANGE ancien nouveau type.",
    "SELECT": "En 3ème : une seule table, sans GROUP BY ni HAVING.",
    "<input>": "2ème : text, number, radio, checkbox, submit, reset. Les autres types arrivent en 3ème.",
    "float": "Arrêt du flottement : clear: both (absent de l'annexe, proposé à la réforme).",
    "transition": "Déclarée sur l'élément, jamais sur :hover. Pas de transition-timing-function.",
    "transform": "Toutes les fonctions sur une seule ligne ; translate(x, y) uniquement.",
    "Math.trunc(x)": "Remplace Math.floor et Math.ceil, hors annexe.",
    "ch.substring(d, f)": "Remplace substr, hors annexe. Accès à un caractère : ch[i] (pas charAt).",
    "d.getMonth()": "Renvoie 0 à 11 : afficher getMonth() + 1.",
    "mysqli_connect()": "Écrite une seule fois dans connexion.php, importée par require.",
    "NOW()": "Date du jour : DATE(NOW()) (CURDATE() hors annexe).",
}
LANGUES = [("html5", "HTML5"), ("css3", "CSS3"), ("javascript", "JavaScript"), ("sql", "SQL"), ("php", "PHP")]


def niveau(lang, cat, nom):
    if lang == "php":
        return 4
    if nom in N4.get(lang, ()) or cat in CAT4.get(lang, ()):
        return 4
    if nom in N2.get(lang, ()):
        return 2
    return 3


def details(it):
    morceaux = []
    if it.get("attributs"):
        morceaux.append("Attributs : " + ", ".join(it["attributs"]))
    if it.get("valeurs_attributs"):
        morceaux.append("Valeurs : " + " ; ".join(f"{k} = {', '.join(v)}" for k, v in it["valeurs_attributs"].items()))
    if it.get("types"):
        morceaux.append(" | ".join(
            f"type {t['type']} : {', '.join(t['attributs_generiques'] + t['attributs_specifiques'])}" for t in it["types"]))
    if it.get("syntaxe"):
        morceaux.append("Syntaxe : " + it["syntaxe"])
    return morceaux


def donnees():
    out = []
    for lang, nom_lang in LANGUES:
        d = json.load(open(os.path.join(ICI, "annexe", f"{lang}.json"), encoding="utf-8"))
        for cat, items in d.items():
            for it in items:
                nom = next(it[k] for k in CLES if k in it)
                n = niveau(lang, cat, nom)
                out.append({"l": nom_lang, "c": cat, "e": nom, "d": it.get("définition", "").replace("*", ""),
                            "x": details(it), "n": n, "r": REMARQUES.get(nom, "")})
                indexer(f"{nom} ({nom_lang})", "annexe.html?q=" + nom.replace(" ", "+"), f"{n}ème",
                        f"{cat} {it.get('définition', '')}")
    return out


def generer(ecrire):
    data = donnees()
    ecrire("assets/annexe-data.js", "window.ANNEXE = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    contenu = f"""<div class="page pleine">
{enc("info", "<p>Chaque élément de l'annexe officielle, avec sa définition et le <b>niveau d'introduction</b> retenu par ce guide. Un élément introduit en 3ème reste utilisable en 4ème. Cliquez sur un élément pour ouvrir sa fiche détaillée (paramètres, exemple conforme, remarques) dans l'<a href=\"https://mo7amedzouaghi.github.io/annexe4STITN/\" target=\"_blank\" rel=\"noopener\">assistant de l'annexe</a>. En cas de doute, l'annexe officielle fait foi.</p>")}
<div class="filtres" role="search">
  <input type="search" id="ref-q" placeholder="Rechercher : float, substring, GROUP BY, mysqli…" aria-label="Rechercher dans l'annexe">
  <div class="puces" id="ref-langue" aria-label="Langage">
    <button type="button" data-v="" aria-pressed="true">Tous</button>
    {''.join(f'<button type="button" data-v="{n}" aria-pressed="false">{n}</button>' for _, n in LANGUES)}
  </div>
  <div class="puces" id="ref-niveau" aria-label="Niveau">
    <button type="button" data-v="" aria-pressed="true">Tous niveaux</button>
    <button type="button" data-v="2" aria-pressed="false">2ème</button>
    <button type="button" data-v="3" aria-pressed="false">3ème</button>
    <button type="button" data-v="4" aria-pressed="false">4ème</button>
  </div>
  <span class="compteur" id="ref-compte" aria-live="polite"></span>
</div>
<div id="ref-liste"></div>
</div>"""
    ecrire("annexe.html", gabarit(
        "annexe.html", "Référentiel de l'annexe",
        "Toutes les balises, propriétés, méthodes, fonctions et instructions de l'annexe officielle STI, filtrables par langage et par niveau.",
        bandeau("Référentiel de l'annexe", "Toutes les balises, propriétés, méthodes, fonctions et instructions autorisées, avec leur niveau d'introduction. Filtrez, cherchez, vérifiez avant de distribuer un support.",
                None, [f"{len(data)} éléments", "HTML5 · CSS3 · JavaScript · SQL · PHP", "Filtre par niveau"]),
        contenu, "", '<script src="assets/annexe-data.js"></script>\n<script src="assets/annexe.js"></script>'))
