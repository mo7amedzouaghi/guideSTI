# Activer les comptes en ligne (Firebase)

Sans configuration, le site fonctionne en **mode local** : les comptes restent dans le navigateur de chaque appareil.
Une fois Firebase relié, les comptes fonctionnent sur tous les appareils et les scores remontent sur la page
**Espace Prof → Suivi**. Le plan gratuit (Spark) suffit pour un établissement.

## 1. Créer le projet
1. Aller sur https://console.firebase.google.com et se connecter avec un compte Google.
2. **Créer un projet** → nom : `guidesti` → Google Analytics : inutile (désactiver) → Créer.

## 2. Activer la connexion par mot de passe
**Build → Authentication → Commencer → Sign-in method → Adresse e-mail/Mot de passe → Activer → Enregistrer.**
Puis onglet **Settings → Domaines autorisés → Ajouter un domaine** : `mo7amedzouaghi.github.io`.

## 3. Créer la base de données
**Build → Firestore Database → Créer une base de données** → emplacement `eur3 (europe-west)` → mode **production**.
Onglet **Règles** : remplacer tout le contenu par celui du fichier `connexion/firestore.rules` → **Publier**.

## 4. Récupérer la configuration
**Paramètres du projet (roue dentée) → Général → Vos applications → icône Web `</>`** → surnom `guidesti` → Enregistrer.
Copier l'objet `firebaseConfig` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
et le coller dans `connexion/config.js` à la place des valeurs vides. Ces clés ne sont pas secrètes : la protection est assurée par les règles.

## Code enseignant
Le code demandé à l'inscription d'un enseignant est `STI-OUED-ELLIL`. Pour le changer :
- dans `connexion/firestore.rules` (ligne `CODE_PROF`), puis republier les règles ;
- dans `connexion/compte.js`, remplacer `CODE_ENSEIGNANT_SHA256` par l'empreinte SHA-256 du nouveau code
  (commande : `echo -n "NOUVEAU-CODE" | sha256sum`).

## Mot de passe oublié
Les identifiants ne sont pas de vraies adresses e-mail : pas de réinitialisation par mail.
L'enseignant retire l'élève (page Suivi), supprime son compte dans **Authentication → Utilisateurs**, puis l'élève se réinscrit.
