# STI Guide — application bureau (Windows)

Guide du Programme STI hors ligne, **sans inscription** : Espace Élèves + Espace Prof (protégé par un code PIN local).
Conçu par Zouaghi Mohamed — Lycée Oued Ellil.

## Deux installations

| Fichier | Pour qui | Contenu |
|---|---|---|
| `STI-Guide-Installation-x.exe` / `STI-Guide-Portable-x.exe` | Poste du prof | Espace Élèves + Espace Prof (code PIN au 1er lancement) |
| `STI-Eleve-Installation-x.exe` / `STI-Eleve-Portable-x.exe` | Postes du labo | Espace Élèves seulement : aucune page prof, aucun corrigé dans les fichiers |

La version **Portable** se lance directement depuis une clé USB, sans installation.

## Modules

- **Socle** : accueil Élève / Prof, code PIN local (modifiable), identité élève sans compte (nom, prénom, classe, n° de poste), suivi des élèves local.
- **A. Bac à sable enrichi** : « Ouvrir un projet » / « Enregistrer le projet » (dossier `index.html`, `style.css`, `script.js`).
- **B. Vérifier un dossier** : glisser-déposer un dossier de TP → rapport de conformité à l'annexe, fichier par fichier, export PDF.
- **C. Bibliothèque de TP + mode examen** : éditeur multi-fichiers, aperçu en direct, minuteur, tableau de réponses, fiche surprise attribuée par poste et débloquée à l'heure prévue (ou par code du jour / par le réseau), sauvegarde automatique dans *Documents › STI › TP*. Côté prof : séance, corrigé, fiches et cartes d'entretien, correction des copies, grille de notation, export des notes (Excel) et PDF.
  - TP fournis (tous « anti-IA » : débogage + tableau d'explication, fiche surprise par poste débloquée à la 40e minute, cartes d'entretien) :
    *Inscription à un stage* (JavaScript, 4ème), *Découvrir la Tunisie — page à réparer* (HTML5/CSS3, 3ème), *Bibliothèque du lycée — requêtes à réparer* (SQL, 4ème, avec console SQL hors ligne).
- **G. Correcteur de devoirs** (prof) : énoncé + grille d'évaluation Excel + archive RAR/ZIP des travaux → correction automatique critère par critère, saisie des critères manuels, export Excel (voir plus bas).
- **D. Ramassage réseau** : le poste prof reçoit les travaux et les progressions (*Documents › STI › Ramassage*). Les postes élèves trouvent le poste prof automatiquement (port UDP 47471), sinon par son adresse IP (port TCP 47470). Windows peut demander d'autoriser l'application sur le réseau privé : accepter.
- **E. Mise à jour du guide** : page *Mettre à jour le guide* (lien en bas de l'accueil, menu STI). Trois sources : GitHub (dernier commit de `main`, archive ≈ 4 Mo), le poste prof pendant le ramassage (pour les postes sans Internet), ou un fichier `.zip` (« Code › Download ZIP » sur GitHub). Recherche automatique une fois par jour quand Internet est disponible, avec un bandeau sur l'accueil. Le contenu mis à jour est rangé dans les données de l'application ; « Revenir à la version d'origine » le supprime. Seul le contenu du guide est mis à jour, pas l'application elle-même ; la version élève n'extrait jamais `prof/`.
- **F. Installateurs** : `.exe` d'installation (français) + version portable, pour chaque variante.
- **Mise à jour de l'application** (depuis la 1.4.0) : page *Mise à jour › Application*. Recherche automatique une fois par jour, téléchargement différentiel (seules les parties modifiées), installation au redémarrage ; les données (PIN, devoirs, TP, suivi) sont conservées. Sources : Internet (release GitHub `bureau-derniere`), le poste prof pendant le ramassage (le prof clique d'abord « Préparer la mise à jour élève »), ou un installateur sur clé USB. La version portable ne se met pas à jour seule : remplacer le fichier.

## Publier une nouvelle version

1. Dans `desktop/package.json`, augmenter `"version"` (ex. `1.4.1`) et pousser sur `main`.
2. Sur GitHub : onglet **Actions › Application bureau › Run workflow** (ou pousser un tag `bureau-v1.4.1`).

Le workflow `bureau.yml` construit les deux variantes sous Windows (≈ 10 min) et publie la release `bureau-v1.4.1` et la release `bureau-derniere`, lue par les applications installées.

## Mettre à jour le contenu du guide

Le contenu vient du dépôt `guideSTI` (dossiers `prof/` et `eleves/`). Après une modification du site :

```bash
git clone https://github.com/mo7amedzouaghi/guideSTI ../guideSTI
npm install
npm run contenu -- ../guideSTI   # copie prof/ et eleves/, retire Firebase, note la version (commit)
npm start                         # essai
npm run dist                      # installateurs dans dist/complet et dist/eleve
```

Sous Windows, `npm run dist` fonctionne directement. Sous Linux, il faut `wine` (32 et 64 bits).

## Ajouter un TP

Un TP est un dossier :

```
mon-tp/
  tp.json        titre, niveau, duree, conditions, depart[], principal, parties[], fiches[], questionFiche
  depart/        fichiers de départ donnés à l'élève
  corrige.json   (facultatif, prof seulement) erreurs, variantes, cartes, grille, fichiersCorriges
```

Modèle complet : `app/modules/tp/bibliotheque/stage/tp.json` et `app/prof-modules/tp/stage/corrige.json`.
Dans l'application prof : **TP & notes › Importer un TP (dossier)**. Les postes élèves le reçoivent avec **Récupérer les TP du poste prof** pendant le ramassage.

Champs facultatifs pour un TP de bases de données : `"console": "sql"`, `"base": "base.sql"` (script MySQL ou phpMyAdmin), `"nomBase"`.

Types de parties : `tableau` (colonnes + nombre de lignes), `surprise` (déblocage en minutes, fiches attribuées par poste), `info` (texte).

## Correcteur de devoirs : la grille

Une ligne par critère (le modèle s'obtient avec **Modèle de grille (Excel)**, feuille *Aide* incluse) :

| Question | Critère | Points | Vérification | Fichier | Paramètre |
|---|---|---|---|---|---|
| Q1 | Structure nav / section / footer | 2 | contient | index.html | `<nav \| <section \| <footer` |
| Q1 | Conforme à l'annexe | 2 | conforme | *.html | |
| Q2 | Nom vide refusé | 2 | page | index.html | `saisir #nom = ; cliquer input[type=button] ; alerte contient nom` |
| Q3 | Requête Q3 | 2 | sql | requetes.sql | `SELECT titre FROM Livre, Emprunt WHERE …` |
| Q4 | Présentation | 2 | manuel | | |

Vérifications : `manuel`, `fichier`, `contient` (points proportionnels), `absent`, `conforme` (vérificateur du guide, niveau du devoir), `page` (scénario joué dans un navigateur caché, sans réseau), `sql` (résultat comparé à la requête attendue sur la base de référence jointe). Une grille avec seulement Question / Critère / Points est acceptée (tout est alors noté à la main).

Tolérance (règles validées, réglables par devoir dans l'onglet Grille) : A1 parenthèse JS, A2 accolade JS, A4 majuscule dans une méthode, A5 faute de frappe dans une méthode, A7 = au lieu de ==, A10 accolade CSS, C1 nom approché, D3 faute dans un id → réparés, −0,25 pt ; A9 « ; » CSS → toléré (0 pt). Désactivées par défaut : A6, A8, C2, C3. Une erreur n'est pénalisée qu'une fois par élève ; au plus 3 réparations par page ; les critères concernés sont marqués « à revoir » (`lib/tolerance.js`).

Travaux : une archive RAR ou ZIP avec un dossier (ou une archive) par élève ; les dossiers englobants et les archives imbriquées sont gérés. Export Excel : feuilles *Notes* (points par question, total, note /20, moyenne), *Grille détaillée* (chaque critère, justification en commentaire de cellule), *Justifications*, *Statistiques*, *Barème*. Les devoirs sont rangés dans *Documents › STI › Devoirs*.

## Structure

```
main.js            processus principal : protocole sti://app, PIN, fichiers, TP, ramassage réseau, mises à jour
lib/contenu.js     adaptation du guide à la version bureau (construction et mises à jour)
lib/correcteur.js  correcteur de devoirs : archives RAR/ZIP, grille Excel, vérifications, export Excel
lib/tolerance.js   correction tolérante : comparaison souple, réparation du JS / CSS / HTML
lib/sonde.js       capture des alertes dans les pages testées par le correcteur
preload.js         API sécurisée window.stiDesktop
app/accueil/       écran d'accueil
app/desktop/       ajouts injectés dans les pages du guide (dock, identité, progression)
app/contenu/       copie du guide (générée par npm run contenu)
app/modules/       modules élève : TP, vérification de dossier, éditeur, moteur et console SQL (sql.js)
app/prof-modules/  modules prof : TP/corrigés/notes, correcteur de devoirs, ramassage (exclus de la version élève)
scripts/           preparer-contenu.js, construire.js
```
