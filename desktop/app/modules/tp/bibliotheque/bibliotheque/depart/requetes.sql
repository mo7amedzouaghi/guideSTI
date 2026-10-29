-- TP SQL : bibliothèque du lycée
-- Chaque requête ci-dessous contient UNE erreur. Corrige-la, exécute-la, puis complète le tableau.

-- Q1. Titre et auteur des romans (catégorie « Roman »), par ordre alphabétique du titre.
SELECT titre, auteur
FROM Livre
WHERE categorie = 'Roman'
ORDER BY titre DESC;

-- Q2. Nom et prénom des élèves de la classe 4SI1 nés en 2008.
SELECT nom, prenom
FROM Eleve
WHERE classe = '4SI1' OR YEAR(dateNaiss) = 2008;

-- Q3. Titre des livres empruntés par l'élève n° 3.
SELECT titre
FROM Livre, Emprunt
WHERE numEl = 3;

-- Q4. Titre et année des livres parus entre 2000 et 2010 (inclus).
SELECT titre, annee
FROM Livre
WHERE annee > 2000 AND annee < 2010;

-- Q5. Nom et prénom des élèves dont le nom commence par la lettre B.
SELECT nom, prenom
FROM Eleve
WHERE nom LIKE '%B';

-- Q6. Nombre d'emprunts pour chaque catégorie de livres.
SELECT categorie, COUNT(*) AS nbEmprunts
FROM Livre, Emprunt
WHERE Livre.codeLivre = Emprunt.codeLivre;

-- Q7. Catégories ayant plus de 4 emprunts.
SELECT categorie, COUNT(*) AS nbEmprunts
FROM Livre, Emprunt
WHERE Livre.codeLivre = Emprunt.codeLivre
GROUP BY categorie
WHERE COUNT(*) > 4;

-- Q8. Code du livre et date d'emprunt des emprunts non encore rendus.
SELECT codeLivre, dateEmprunt
FROM Emprunt
WHERE dateRetour = NULL;
