# Guide STI — publication sur Google Play

## 1. Fichiers

| Fichier | Où le trouver | Usage |
|---|---|---|
| `GuideSTI.apk` | https://github.com/mo7amedzouaghi/guideSTI/releases/latest | Installer directement sur un téléphone (test) |
| `GuideSTI-GooglePlay.aab` | même page, après l'étape 2 | À envoyer dans la Play Console |
| Icône 512 × 512 | `android/play/icone-512.png` | Fiche Play |
| Image de présentation 1024 × 500 | `android/play/image-presentation-1024x500.png` | Fiche Play |
| 8 captures téléphone 1080 × 1920 | `android/play/captures/` | Fiche Play |

Nom du paquet : `io.github.mo7amedzouaghi.guidesti`

## 2. Activer la signature (une seule fois)

GitHub → dépôt guideSTI → Settings → Secrets and variables → Actions → New repository secret
- Nom : `ANDROID_KEYSTORE_PASSWORD`
- Valeur : le mot de passe de la clé (communiqué à part, à conserver précieusement)

Puis Actions → « Application Android » → Run workflow. La nouvelle version contient le fichier `.aab`.
La clé d'envoi est `android/cle/guidesti-envoi.p12` (protégée par ce mot de passe). Choisir « Signature d'application par Google Play » à la première publication.

## 3. Fiche Play

- **Nom** : Guide STI
- **Description courte** (80 caractères max) : Cours, exercices corrigés et suivi STI, conformes à l'annexe officielle.
- **Catégorie** : Éducation
- **E-mail de contact** : celui du compte développeur
- **Politique de confidentialité** : https://mo7amedzouaghi.github.io/guideSTI/confidentialite.html

**Description complète :**

Guide STI accompagne les élèves et les enseignants de Sciences et Technologies de l'Informatique (2ème, 3ème et 4ème année), en restant strictement conforme à l'annexe officielle du programme.

Pour les élèves
• Les chapitres de leur niveau, dans l'ordre du programme : HTML5, CSS3, JavaScript, bases de données.
• Chaque chapitre en trois temps : je comprends, je m'entraîne, je retiens.
• 109 exercices corrigés immédiatement : choix multiple, vrai ou faux, code à compléter, trouver l'erreur.
• Un bac à sable HTML, CSS et JavaScript avec aperçu en direct et vérification de conformité au niveau.
• Un aide-mémoire des éléments de l'annexe, filtré selon le niveau.
• La progression suit le compte : au labo, à la maison, sur téléphone.

Pour les enseignants
• Préparer un cours par niveau : notions, exemples, fiche « À retenir » imprimable, déroulé de séance.
• Vérifier un support, un sujet ou une copie : tout élément hors annexe ou au-dessus du niveau est signalé, avec la correction.
• Suivre les résultats des élèves par classe et par chapitre, export Excel.
• Gérer les comptes : modifier, désactiver, réinitialiser un mot de passe, passage de niveau à la rentrée.

Gratuit, sans publicité. Connexion avec un identifiant et un mot de passe, sans adresse e-mail.

## 4. Contenu de l'application (Play Console → Règles → Contenu de l'application)

- **Accès à l'application** : « Toutes ou certaines fonctionnalités sont restreintes » → fournir un compte élève et un compte enseignant de démonstration (identifiant + mot de passe).
- **Annonces** : non.
- **Classification du contenu** : questionnaire, catégorie « Référence, actualités ou éducation » ; aucune violence, aucun contenu sensible.
- **Public cible** : 13-15 ans, 16-17 ans, 18 ans et plus.
- **Sécurité des données** :
  - Données collectées : Nom (informations personnelles), Identifiants utilisateur (identifiant de compte), Activité dans l'application (scores aux exercices).
  - Finalité : fonctionnalité de l'application, gestion du compte.
  - Partagées avec des tiers : non. Chiffrées en transit : oui.
  - Suppression : oui, dans l'application (Mon compte → Supprimer mon compte) et via https://mo7amedzouaghi.github.io/guideSTI/confidentialite.html
- **Suppression de compte (URL)** : https://mo7amedzouaghi.github.io/guideSTI/confidentialite.html

## 5. Tests obligatoires (comptes développeur personnels récents)

Avant la mise en production : un **test fermé** avec au moins **12 testeurs** inscrits pendant **14 jours** consécutifs. Ajouter leurs adresses Gmail dans Tests → Test fermé, leur envoyer le lien d'inscription, puis demander l'accès à la production.
