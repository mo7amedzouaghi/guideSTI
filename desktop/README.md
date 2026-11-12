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

## Correcteur de devoirs (1.5) : grille proposée, notation comme à la main

- **Grille proposée depuis l'énoncé** : en joignant le sujet (PDF, Word — numérotation automatique comprise —, ODT, HTML, texte), l'application repère parties, questions, sous-questions et le **barème du sujet** (points écrits à côté des questions, tableau « Barème / Grille d'évaluation », points des exercices ; sinon répartition sur 20). Chaque question reçoit ses vérifications (fichier, balises, propriétés CSS, fonctions JS, PHP, requête SQL) ; les questions de cours sont « manuel ». Tout reste modifiable (onglet 2, « ↻ Proposer depuis l'énoncé »). Une grille officielle (ligne « Détail ») importée garde son barème et reçoit les vérifications de l'énoncé.
- **Notation** : chaque critère arrondi au quart (réglable) ; une erreur de forme coûte une fois **par type** sur la copie ; conformité à l'annexe : −0,25 par type d'écart (et non plus « moitié ou 0 ») ; code commenté ignoré ; motifs séparés par « | » avec ou sans espaces.
- **SQL** : résultat identique → tous les points ; sinon −0,25 par type d'erreur (colonnes, tables, jointure, condition, GROUP BY, ORDER BY…), commande principale fausse → 0, requête largement fausse → éléments justes seulement ; INSERT/UPDATE/DELETE jugés sur l'état de la base ; requêtes sans « -- Qn » retrouvées dans le fichier.
- **Personnalisation** : réglages de notation par devoir, correction adaptée par élève (erreurs de forme ignorées, pénalités ≤ 1 pt), message d'alerte reformulé accepté (D4), colonne « Réf. » pour saisir votre note à la main et voir l'écart.
- **Export** : feuille « Grille officielle » (format correcteurAuto : une colonne par critère, ligne « Détail »), notes provisoires signalées.

### 1.5.2 — correction JS sur le code

- **A11 — propriété oubliée** (−0,25 par élément, réglable) : le correcteur lit le code de l'élève comme l'enseignant. `N = document.getElementById("n"); alert(N)` → `.value` ; case ou bouton radio → `.checked` ; `document.getElementById("r") = "…"` ou `r = "…"` sur une zone d'affichage → `.innerHTML`. Le scénario est rejoué sur le code corrigé. Pas de correction si l'élément est déjà utilisé avec un point ailleurs (`N.focus()`, `N.value`).
- **Attribut / propriété manquant** (vérification « contient ») : `required`, `type="email"`, `.value`… absent → −0,25 (réglable) au lieu de perdre toute la part du motif, si le travail existe.
- **Démarche juste, résultat faux** (vérification « page ») : le code est lu (fonction appelée écrite, champs lus, zone d'affichage écrite, alert et message, condition) ; jusqu'à 50 % des points perdus sont rendus (réglable : 0, 25, 50, 75 %) en proportion des éléments présents, sans jamais atteindre la note entière. Ligne marquée « à revoir » avec le détail.

### 1.5.1 — seconde expertise du correcteur

- **SQL** : règle stricte « −0,25 par type d'erreur, commande principale fausse = 0 » ; noms de tables / colonnes mal orthographiés tolérés (requête rejouée avec le bon nom) ; numérotation « 1) SELECT… », « -- 1) », « R1 : » reconnue ; sans étiquette, chaque requête est affectée à une seule question ; CREATE / ALTER non exécutables comparés à l'écriture ; ORDER BY demandé mais absent = erreur même si l'ordre coïncide.
- **Fichiers ANSI** (Bloc-notes, Windows-1252) lus avec leurs accents ; « // » dans le texte d'une page n'est plus pris pour un commentaire ; fichier vide ≠ conforme ; une vérification en erreur devient « à noter à la main » (plus de 0 silencieux).
- **Note finale** arrondie au quart de point (réglable) ; message de réussite jamais accepté à la place d'un message d'erreur (D4).
- **Énoncé** : barème en tableau vertical (« Question | Points »), en ligne (« Ex1 : 5 pts – Ex2 : 7 pts »), points dans la cellule de droite, sections I- / II-, « 1) a) », consigne mère (« Écrire les requêtes permettant de : a)… »), vrai/faux et QCM notés à la main, PHP (connexion, exécution, affichage).

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

Tolérance (règles validées, réglables par devoir dans l'onglet Grille) : A1 parenthèse JS, A2 accolade JS, A4 majuscule dans une méthode, A5 faute de frappe dans une méthode, A7 = au lieu de ==, A10 accolade CSS, C1 nom approché, D3 faute dans un id → réparés, −0,25 pt ; A9 « ; » CSS , B1 margin-*/padding-*/border-* détaillées (margin-top, padding-left, border-top…) et B2 sélecteur descendant (div a ; pas > + ~) dans le critère « conforme » → tolérés (0 pt). Désactivées par défaut : A6, A8, C2, C3. Une erreur n'est pénalisée qu'une fois par élève ; au plus 3 réparations par page ; les critères concernés sont marqués « à revoir » (`lib/tolerance.js`).

Ressources (facultatif) : dossier ou archive des fichiers donnés aux élèves (images, sons, vidéos, HTML prêt, CSS / JS à compléter). Pour les tests de page, le projet de l'élève est complété par les ressources (ses fichiers sont prioritaires) ; une page HTML fournie non rendue est testée avec le CSS / JS de l'élève. Un fichier fourni rendu sans modification ne rapporte rien au critère « fichier » et est exclu du critère « conforme ».

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
