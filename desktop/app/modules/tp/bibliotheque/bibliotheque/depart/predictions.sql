-- Prédictions : écris ta prédiction dans le tableau AVANT d'exécuter.

-- P1. Élèves de la classe 4SI2, triés par nom.
SELECT nom, prenom
FROM Eleve
WHERE classe = '4SI2'
ORDER BY nom;

-- P2. Livres d'informatique disponibles en au moins 3 exemplaires.
SELECT titre
FROM Livre
WHERE nbExemplaires >= 3 AND categorie = 'informatique';

-- P3. Classes ayant au moins un emprunt non rendu.
SELECT DISTINCT classe
FROM Eleve, Emprunt
WHERE Eleve.numEl = Emprunt.numEl AND dateRetour IS NULL;
