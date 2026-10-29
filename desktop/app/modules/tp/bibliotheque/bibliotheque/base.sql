-- Base « bibliotheque » du lycée — TP SQL STI (4ème Sc. Info)
-- Eleve (numEl, nom, prenom, classe, dateNaiss)
-- Livre (codeLivre, titre, auteur, categorie, annee, nbExemplaires)
-- Emprunt (numEl#, codeLivre#, dateEmprunt, dateRetour)

CREATE TABLE Eleve (
  numEl INT NOT NULL,
  nom VARCHAR(30) NOT NULL,
  prenom VARCHAR(30) NOT NULL,
  classe VARCHAR(6) NOT NULL,
  dateNaiss DATE NOT NULL,
  PRIMARY KEY (numEl)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Livre (
  codeLivre VARCHAR(5) NOT NULL,
  titre VARCHAR(60) NOT NULL,
  auteur VARCHAR(40) NOT NULL,
  categorie VARCHAR(20) NOT NULL,
  annee INT NOT NULL,
  nbExemplaires INT NOT NULL,
  PRIMARY KEY (codeLivre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Emprunt (
  numEl INT NOT NULL,
  codeLivre VARCHAR(5) NOT NULL,
  dateEmprunt DATE NOT NULL,
  dateRetour DATE NULL,
  PRIMARY KEY (numEl, codeLivre, dateEmprunt),
  FOREIGN KEY (numEl) REFERENCES Eleve (numEl),
  FOREIGN KEY (codeLivre) REFERENCES Livre (codeLivre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO Eleve VALUES
(1, 'Ben Salah', 'Amine', '4SI1', '2008-03-14'),
(2, 'Trabelsi', 'Yasmine', '4SI1', '2008-11-02'),
(3, 'Bouzid', 'Karim', '4SI1', '2007-06-21'),
(4, 'Ayeb', 'Salma', '4SI2', '2008-01-30'),
(5, 'Jaziri', 'Mehdi', '4SI2', '2008-09-09'),
(6, 'Belhaj', 'Ines', '4SI2', '2007-12-15'),
(7, 'Gharbi', 'Nour', '4SI1', '2008-05-05'),
(8, 'Mansouri', 'Ahmed', '4SI2', '2009-02-11'),
(9, 'Chaabane', 'Rim', '4SI1', '2008-07-19'),
(10, 'Zitouni', 'Walid', '4SI2', '2007-04-03'),
(11, 'Bacha', 'Hiba', '4SI1', '2008-10-27'),
(12, 'Hammami', 'Omar', '4SI2', '2008-08-16');

INSERT INTO Livre VALUES
('L01', 'Le Petit Prince', 'Saint-Exupéry', 'Roman', 1943, 3),
('L02', 'Les Misérables', 'Victor Hugo', 'Roman', 1862, 2),
('L03', 'Algorithmique pour le lycée', 'Ben Ali', 'Informatique', 2010, 5),
('L04', 'Le Web pas à pas', 'Gharsalli', 'Informatique', 2018, 4),
('L05', 'Bases de données relationnelles', 'Kammoun', 'Informatique', 2000, 3),
('L06', 'Une brève histoire du temps', 'Hawking', 'Sciences', 1988, 2),
('L07', 'Le Gène égoïste', 'Dawkins', 'Sciences', 1976, 1),
('L08', 'Mathématiques en jeux', 'Souissi', 'Sciences', 2005, 2),
('L09', 'Le Prophète', 'Gibran', 'Poésie', 1923, 2),
('L10', 'Les Chants de la vie', 'Chebbi', 'Poésie', 1955, 3),
('L11', 'Le Vieil Homme et la Mer', 'Hemingway', 'Roman', 1952, 2),
('L12', 'Programmer en JavaScript', 'Trabelsi', 'Informatique', 2021, 3),
('L13', 'Atlas de la Tunisie', 'Hamdi', 'Géographie', 2009, 1),
('L14', 'Cosmos', 'Sagan', 'Sciences', 1980, 1),
('L15', 'Le Comte de Monte-Cristo', 'Dumas', 'Roman', 1844, 2);

INSERT INTO Emprunt VALUES
(1, 'L01', '2026-09-20', '2026-10-01'),
(1, 'L04', '2026-10-05', NULL),
(2, 'L02', '2026-09-22', '2026-10-10'),
(2, 'L06', '2026-10-12', NULL),
(3, 'L03', '2026-09-18', '2026-09-30'),
(3, 'L05', '2026-10-02', '2026-10-16'),
(3, 'L12', '2026-10-18', NULL),
(4, 'L09', '2026-09-25', '2026-10-05'),
(4, 'L10', '2026-10-07', NULL),
(5, 'L04', '2026-09-21', '2026-10-03'),
(5, 'L03', '2026-10-06', NULL),
(6, 'L07', '2026-09-28', '2026-10-20'),
(6, 'L14', '2026-10-21', NULL),
(7, 'L01', '2026-10-03', '2026-10-15'),
(7, 'L11', '2026-10-16', NULL),
(8, 'L08', '2026-09-30', '2026-10-14'),
(9, 'L12', '2026-09-19', '2026-10-02'),
(9, 'L04', '2026-10-04', '2026-10-18'),
(9, 'L05', '2026-10-19', NULL),
(10, 'L06', '2026-09-23', '2026-10-07'),
(10, 'L08', '2026-10-08', '2026-10-22'),
(12, 'L15', '2026-10-01', NULL),
(1, 'L06', '2026-09-02', '2026-09-15'),
(5, 'L12', '2026-09-03', '2026-09-17'),
(9, 'L03', '2026-09-04', '2026-09-16');
