"""Composants du site « Guide du Programme STI ».

Chaque page est générée par build.py à partir de ces fonctions.
Le contenu des notions est écrit dans les fichiers page_*.py.
"""
import html
import re

INDEX = []          # index de recherche global
PRISM = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0"

NIV_COULEUR = {"2": "n2", "3": "n3", "4": "n4"}


def esc(s):
    return html.escape(s, quote=False)


def slug(s):
    s = s.lower()
    for a, b in (("éèêë", "e"), ("àâä", "a"), ("îï", "i"), ("ôö", "o"), ("ùûü", "u"), ("ç", "c")):
        for c in a:
            s = s.replace(c, b)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def indexer(titre, url, niveau, mots=""):
    INDEX.append({"t": titre, "u": url, "n": niveau, "k": mots})


# ------------------------------------------------------------------ blocs
LANGS = {"html": ("markup", "HTML"), "css": ("css", "CSS"), "js": ("javascript", "JS"),
         "sql": ("sql", "SQL"), "php": ("php", "PHP"), "txt": ("none", "Texte")}


def code(src, lang="html", fichier=None):
    src = src.strip("\n")
    cls, nom = LANGS[lang]
    tete = f'<span><span class="lang">{nom}</span>{esc(fichier) if fichier else ""}</span>'
    return (f'<div class="code"><div class="code-tete">{tete}'
            f'<button class="copier" type="button">Copier</button></div>'
            f'<pre class="language-{cls}"><code class="language-{cls}">{esc(src)}</code></pre></div>')


def apercu(doc, url="localhost/page.html", haut=170, legende=None):
    """Fenêtre de navigateur affichant le rendu réel du document."""
    if "<html" not in doc:
        doc = ('<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">'
               '<style>body{font-family:Arial,sans-serif;margin:12px;font-size:15px}</style>'
               f'</head><body>{doc}</body></html>')
    leg = f'<div class="legende-apercu">{legende}</div>' if legende else ""
    return (f'<div class="navigateur"><div class="navigateur-tete"><span class="points"><i></i><i></i><i></i></span>'
            f'<span class="url">{esc(url)}</span></div>'
            f'<iframe title="Aperçu : {esc(url)}" style="height:{haut}px" sandbox="allow-scripts allow-modals allow-same-origin" '
            f'srcdoc="{html.escape(doc, quote=True)}"></iframe>{leg}</div>')


def duo(gauche, droite=None):
    if droite is None:
        return f'<div class="duo solo">{gauche}</div>'
    return f'<div class="duo">{gauche}{droite}</div>'


def tableau(entetes, lignes):
    th = "".join(f"<th>{h}</th>" for h in entetes)
    tr = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in l) + "</tr>" for l in lignes)
    return f'<div class="tableau-wrap"><table class="t"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'


def enc(sorte, texte):
    ico = {"info": "i", "att": "!", "astuce": "★", "prof": "✎"}[sorte]
    return f'<div class="enc {sorte}"><b class="ico" aria-hidden="true">{ico}</b><div>{texte}</div></div>'


def c(s):
    """Code en ligne."""
    return f"<code>{esc(s)}</code>"


def retenir(points, css=None, js=None, autres=None, titre="À retenir"):
    """css : [(propriété, valeurs annexe, valeur utilisée, description)]
       js  : [(méthode, description)]
       autres : [(titre_tableau, entetes, lignes)]"""
    h = f'<div class="retenir"><h3>{titre}</h3><ul class="coches">'
    h += "".join(f"<li>{p}</li>" for p in points) + "</ul>"
    if css:
        h += "<h4>Nouvelles propriétés CSS</h4>" + tableau(
            ["Propriété", "Valeurs possibles (annexe)", "Valeur utilisée", "Définition"],
            [(c(a), b, c(v) if v else "—", d) for a, b, v, d in css])
    if js:
        h += "<h4>Méthodes et fonctions</h4>" + tableau(
            ["Méthode / fonction", "Définition"], [(c(a), d) for a, d in js])
    for t, ent, lig in (autres or []):
        h += f"<h4>{t}</h4>" + tableau(ent, lig)
    return h + "</div>"


def interdits(titre, items):
    lis = "".join(f"<li>{i}</li>" for i in items)
    return f'<div class="interdits"><h3>{titre}</h3><ul>{lis}</ul></div>'


def versus(faux, juste, lang="html", explication=""):
    return (f'<div class="versus"><div class="faux"><div class="etiq">✗ Incorrect</div>{code(faux, lang)}</div>'
            f'<div class="juste"><div class="etiq">✔ Conforme</div>{code(juste, lang)}</div></div>'
            + (f"<p>{explication}</p>" if explication else ""))


# ------------------------------------------------------------------ structure de page de niveau
class Niveau:
    def __init__(self, num, page):
        self.num = num
        self.page = page
        self.modules = []   # (id, num, titre, intro, [contenu html], [(id, titre)])
        self.courant = None

    def module(self, titre, intro):
        n = len(self.modules) + 1
        mid = f"m{n}"
        self.courant = [mid, n, titre, intro, [], []]
        self.modules.append(self.courant)
        indexer(f"Module {n} — {titre}", f"{self.page}#{mid}", f"{self.num}ème", intro)

    def notion(self, titre, corps, mots="", niveau=None):
        nid = f"{self.courant[0]}-{slug(titre)[:40]}"
        nv = niveau or self.num
        tag = f'<span class="annexe-tag {NIV_COULEUR[nv]}">Annexe {nv}ème</span>'
        self.courant[4].append(
            f'<article class="notion" id="{nid}"><div class="notion-tete"><h3>{titre}</h3>{tag}</div>'
            f'<div class="notion-corps">{corps}</div></article>')
        self.courant[5].append((nid, titre))
        indexer(titre, f"{self.page}#{nid}", f"{self.num}ème", mots)

    def bloc(self, h, sommaire=None, mots=""):
        """Bloc libre (À retenir, interdits…) ; ajouté au sommaire si un titre est fourni."""
        if sommaire:
            bid = f"{self.courant[0]}-{slug(sommaire)}"
            h = f'<div id="{bid}">{h}</div>'
            self.courant[5].append((bid, sommaire))
            indexer(sommaire, f"{self.page}#{bid}", f"{self.num}ème", mots)
        self.courant[4].append(h)

    def rendu(self):
        som = '<nav class="sommaire" aria-label="Sommaire"><h2>Sommaire</h2><ol>'
        corps = ""
        for mid, n, titre, intro, blocs, sous in self.modules:
            som += f'<li><a href="#{mid}">{n}. {titre}</a><ol>'
            som += "".join(f'<li><a href="#{i}">{t}</a></li>' for i, t in sous)
            som += "</ol></li>"
            corps += (f'<section class="module" id="{mid}"><div class="module-tete"><div class="module-num">{n:02d}</div>'
                      f'<div><h2>{titre}</h2><p>{intro}</p></div></div>{"".join(blocs)}'
                      f'<a class="haut-page" href="#haut">Retour en haut de page</a></section>')
        som += "</ol></nav>"
        return som, corps


# ------------------------------------------------------------------ gabarit
MENU = [("index.html", "Accueil", ""), ("niveau-2.html", "2ème année", "m2"),
        ("niveau-3.html", "3ème année", "m3"), ("niveau-4.html", "4ème année", "m4"),
        ("annexe.html", "Annexe", ""), ("pedagogie.html", "Enseigner", ""),
        ("erreurs.html", "Erreurs", ""), ("outils.html", "Outils", "")]


def gabarit(fichier, titre, description, bandeau, contenu, classe_body="", scripts=""):
    menu = "".join(
        f'<a href="{f}" class="{cl}"{" aria-current=\"page\"" if f == fichier else ""}>{t}</a>'
        for f, t, cl in MENU)
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{titre} — Guide du Programme STI</title>
<meta name="description" content="{esc(description)}">
<link rel="icon" href="flag.png">
<link rel="stylesheet" href="assets/vendor/fonts.css">
<link rel="stylesheet" href="assets/vendor/prism-tomorrow.css">
<link rel="stylesheet" href="assets/style.css">
</head>
<body class="{classe_body}" id="haut">
<header class="barre">
  <div class="barre-in">
    <a class="marque" href="index.html"><span class="marque-logo">STI</span><span class="marque-txt">Guide du Programme<small>Sciences et Technologies de l'Informatique</small></span></a>
    <button class="burger" type="button" aria-expanded="false" aria-label="Ouvrir le menu">Menu</button>
    <nav class="menu" aria-label="Navigation principale">{menu}</nav>
  </div>
</header>
<main>
{bandeau}
{contenu}
</main>
<footer class="pied">
  <div class="pied-in">
    <div>
      <h4>Guide du Programme STI</h4>
      <p>Référence pédagogique pour les enseignants de Sciences et Technologies de l'Informatique (2ème, 3ème et 4ème année), conforme à l'annexe officielle du programme tunisien.</p>
      <p>Conçu par <span class="signature">Zouaghi Mohamed</span>, professeur d'informatique au Lycée Oued Ellil.</p>
    </div>
    <div>
      <h4>Programme</h4>
      <a href="niveau-2.html">2ème année</a><a href="niveau-3.html">3ème année</a><a href="niveau-4.html">4ème année</a><a href="annexe.html">Référentiel annexe</a>
    </div>
    <div>
      <h4>Accompagnement</h4>
      <a href="pedagogie.html">Enseigner pas à pas</a><a href="erreurs.html">Erreurs fréquentes</a><a href="outils.html">Outils & glossaire</a>
      <a href="https://mo7amedzouaghi.github.io/annexe4STITN/" target="_blank" rel="noopener">Chatbot annexe STI</a>
    </div>
  </div>
  <div class="pied-bas">Guide du Programme STI · Mise à jour : octobre 2026 · En cas de doute, l'annexe officielle fait foi.</div>
</footer>
<a class="bouton-chatbot" href="https://mo7amedzouaghi.github.io/annexe4STITN/" target="_blank" rel="noopener" aria-label="Chatbot annexe STI">🤖 <span>Chatbot annexe</span></a>
<script src="assets/vendor/prism.js"></script>
<script src="assets/index-recherche.js"></script>
{scripts}
<script src="assets/app.js"></script>
</body>
</html>
"""


def bandeau(titre, chapeau, pastille=None, faits=None):
    p = f'<span class="pastille-niveau">{pastille}</span><br>' if pastille else ""
    f = ('<div class="bandeau-faits">' + "".join(f"<span>{x}</span>" for x in faits) + "</div>") if faits else ""
    return (f'<section class="bandeau"><div class="bandeau-grille" aria-hidden="true"></div><div class="bandeau-in">'
            f'{p}<h1>{titre}</h1><p class="chapeau">{chapeau}</p>{f}</div></section>')


def page_sections(fichier, sections, niveau_index="Guide", numerote=True):
    """sections : [(id, titre, intro, html, mots)] -> (sommaire, corps) avec index de recherche."""
    som = '<nav class="sommaire" aria-label="Sommaire"><h2>Sommaire</h2><ol>'
    corps = ""
    for n, (sid, titre, intro, h, mots) in enumerate(sections, 1):
        som += f'<li><a href="#{sid}">{titre}</a></li>'
        num = f'<div class="module-num">{n:02d}</div>' if numerote else ""
        corps += (f'<section class="module" id="{sid}"><div class="module-tete">{num}'
                  f'<div><h2>{titre}</h2><p>{intro}</p></div></div>{h}</section>')
        indexer(titre, f"{fichier}#{sid}", niveau_index, intro + " " + mots)
    return som + "</ol></nav>", corps


def carte(titre, corps, etiquette=None):
    tag = f'<span class="annexe-tag">{etiquette}</span>' if etiquette else ""
    return (f'<article class="notion"><div class="notion-tete"><h3>{titre}</h3>{tag}</div>'
            f'<div class="notion-corps">{corps}</div></article>')
