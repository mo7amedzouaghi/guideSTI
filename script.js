// Base de données de recherche
const searchDatabase = [
    // 2ème année
    { level: '2ème', category: 'HTML5', content: 'html head body structure document doctype', keywords: ['html', 'head', 'body', 'structure', 'doctype', 'meta', 'charset', 'title'] },
    { level: '2ème', category: 'HTML5', content: 'paragraphe p br h1 h2 h3 h4 h5 h6 titres mark', keywords: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'titre', 'paragraphe', 'mark', 'surligner'] },
    { level: '2ème', category: 'HTML5', content: 'liste ul ol li ordonnée puces', keywords: ['ul', 'ol', 'li', 'liste', 'ordonnée', 'puces', 'numérotée'] },
    { level: '2ème', category: 'HTML5', content: 'tableau table tr td th thead tbody tfoot', keywords: ['table', 'tableau', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'ligne', 'cellule', 'en-tête'] },
    { level: '2ème', category: 'HTML5', content: 'image img audio video multimédia src alt controls', keywords: ['img', 'audio', 'video', 'multimédia', 'src', 'alt', 'controls', 'image', 'son', 'vidéo'] },
    { level: '2ème', category: 'HTML5', content: 'lien a href target', keywords: ['a', 'lien', 'href', 'link', 'target', 'hyperlien', 'anchor'] },
    { level: '2ème', category: 'HTML5', content: 'formulaire form input text number radio checkbox select option fieldset legend reset submit', keywords: ['form', 'input', 'formulaire', 'checkbox', 'radio', 'text', 'number', 'select', 'option', 'fieldset', 'legend', 'reset', 'submit', 'action', 'method'] },
    { level: '2ème', category: 'CSS3', content: 'style inline interne font-family font-size font-weight font-style color text-align', keywords: ['css', 'style', 'font', 'color', 'couleur', 'inline', 'interne', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-align', 'bold', 'italic', 'police', 'taille'] },
    { level: '2ème', category: 'CSS3', content: 'border bordure border-style border-width border-color solid dashed dotted', keywords: ['border', 'bordure', 'border-style', 'border-width', 'border-color', 'solid', 'dashed', 'dotted'] },
    { level: '2ème', category: 'CSS3', content: 'background arrière-plan background-color background-image background-repeat', keywords: ['background', 'arrière-plan', 'fond', 'background-color', 'background-image', 'background-repeat', 'repeat', 'no-repeat'] },
    { level: '2ème', category: 'Validation', content: 'W3C validator validation HTML erreurs avertissements', keywords: ['validation', 'w3c', 'validator', 'erreur', 'avertissement', 'valider'] },
    
    // 3ème année
    { level: '3ème', category: 'HTML5', content: 'sémantique header footer nav main section article aside address cite output link script', keywords: ['header', 'footer', 'nav', 'main', 'section', 'article', 'sémantique', 'aside', 'address', 'cite', 'output', 'link', 'script', 'balises sémantiques', 'en-tête', 'pied', 'navigation'] },
    { level: '3ème', category: 'HTML5', content: 'conteneur div span iframe src name', keywords: ['div', 'span', 'iframe', 'conteneur', 'block', 'inline', 'src', 'name'] },
    { level: '3ème', category: 'HTML5', content: 'details summary figure figcaption source open', keywords: ['details', 'summary', 'figure', 'figcaption', 'source', 'open', 'pliable', 'légende'] },
    { level: '3ème', category: 'HTML5', content: 'formulaire avancé date time email tel password range button required placeholder readonly disabled min max list', keywords: ['date', 'time', 'email', 'tel', 'password', 'range', 'button', 'required', 'placeholder', 'readonly', 'disabled', 'min', 'max', 'list', 'curseur', 'obligatoire'] },
    { level: '3ème', category: 'HTML5', content: 'événements onclick oninput onchange onfocus onblur onload', keywords: ['onclick', 'oninput', 'onchange', 'événement', 'event', 'onfocus', 'onblur', 'onload', 'clic', 'focus', 'blur', 'chargement'] },
    { level: '3ème', category: 'CSS3', content: 'fichier externe stylesheet link rel href type', keywords: ['css externe', 'stylesheet', 'link', 'rel', 'href', 'fichier externe', 'feuille de style'] },
    { level: '3ème', category: 'CSS3', content: 'sélecteurs id class élément groupe universel hover', keywords: ['sélecteur', 'id', 'class', '#', '.', 'élément', 'groupe', 'universel', '*', 'hover', 'pseudo-classe'] },
    { level: '3ème', category: 'CSS3', content: 'texte text-shadow text-transform uppercase lowercase capitalize', keywords: ['text-shadow', 'text-transform', 'uppercase', 'lowercase', 'capitalize', 'ombre', 'transformation', 'majuscule', 'minuscule'] },
    { level: '3ème', category: 'CSS3', content: 'listes list-style-type list-style-position list-style-image circle square upper-roman lower-alpha inside outside', keywords: ['list-style-type', 'list-style-position', 'list-style-image', 'circle', 'square', 'upper-roman', 'lower-alpha', 'inside', 'outside', 'puce', 'style liste'] },
    { level: '3ème', category: 'CSS3', content: 'arrière-plan background-size cover contain', keywords: ['background-size', 'cover', 'contain', 'taille fond'] },
    { level: '3ème', category: 'CSS3', content: 'boîte box model width height margin padding box-shadow display position float top bottom left right overflow opacity border-radius', keywords: ['width', 'height', 'margin', 'padding', 'box', 'box-shadow', 'display', 'inline', 'block', 'inline-block', 'position', 'absolute', 'relative', 'fixed', 'static', 'sticky', 'float', 'top', 'bottom', 'left', 'right', 'overflow', 'visible', 'hidden', 'scroll', 'auto', 'opacity', 'border-radius', 'ombre', 'transparence', 'coins arrondis'] },
    { level: '3ème', category: 'CSS3', content: 'transition transition-delay transition-duration transition-property ease', keywords: ['transition', 'transition-delay', 'transition-duration', 'transition-property', 'ease', 'délai', 'durée', 'animation simple'] },
    { level: '3ème', category: 'CSS3', content: 'animation keyframes animation-name animation-duration animation-delay animation-iteration-count animation-direction infinite', keywords: ['animation', 'keyframes', '@keyframes', 'animation-name', 'animation-duration', 'animation-delay', 'animation-iteration-count', 'animation-direction', 'infinite', 'répétition'] },
    { level: '3ème', category: 'CSS3', content: 'transformation transform rotate scale translate skew', keywords: ['transform', 'rotate', 'scale', 'translate', 'skew', 'rotation', 'échelle', 'translation', 'inclinaison', 'transformation'] },
    { level: '3ème', category: 'JavaScript', content: 'variable let const string number boolean array portée locale globale', keywords: ['let', 'const', 'variable', 'string', 'number', 'boolean', 'array', 'tableau', 'portée', 'locale', 'globale', 'type', 'données'] },
    { level: '3ème', category: 'JavaScript', content: 'alert prompt document.write innerHTML getElementById', keywords: ['alert', 'prompt', 'innerHTML', 'getElementById', 'document.write', 'affichage', 'saisie', 'sortie', 'entrée'] },
    { level: '3ème', category: 'JavaScript', content: 'if else else if switch case break default condition', keywords: ['if', 'else', 'else if', 'switch', 'case', 'break', 'default', 'condition', 'conditionnelle', 'test'] },
    { level: '3ème', category: 'JavaScript', content: 'boucle for while do loop itération i increment', keywords: ['for', 'while', 'do', 'boucle', 'loop', 'itération', 'répétition', 'i', 'increment'] },
    { level: '3ème', category: 'JavaScript', content: 'function fonction paramètre return module', keywords: ['function', 'fonction', 'return', 'paramètre', 'module', 'retour', 'argument'] },
    { level: '3ème', category: 'JavaScript', content: 'Date getDate getMonth getFullYear toString new Date', keywords: ['date', 'getDate', 'getMonth', 'getFullYear', 'toString', 'new Date', 'jour', 'mois', 'année', 'objet date'] },
    { level: '3ème', category: 'JavaScript', content: 'String length substring indexOf lastIndexOf toLowerCase toUpperCase trim replace fromCharCode', keywords: ['string', 'length', 'substring', 'indexOf', 'lastIndexOf', 'toLowerCase', 'toUpperCase', 'trim', 'replace', 'fromCharCode', 'chaîne', 'longueur', 'sous-chaîne', 'position', 'remplacement'] },
    { level: '3ème', category: 'JavaScript', content: 'conversion Number parseInt parseFloat String isNaN', keywords: ['number', 'parseInt', 'parseFloat', 'string', 'isNaN', 'conversion', 'transtypage', 'entier', 'réel', 'chaîne'] },
    { level: '3ème', category: 'JavaScript', content: 'Array tableau length', keywords: ['array', 'tableau', 'length', 'longueur'] },
    { level: '3ème', category: 'JavaScript', content: 'Math random round trunc', keywords: ['math', 'random', 'round', 'trunc', 'aléatoire', 'arrondi', 'tronquer', 'mathématiques'] },
    { level: '3ème', category: 'Base de données', content: 'BDR SGBDR MySQL phpMyAdmin table enregistrement champ colonne ligne interface graphique', keywords: ['bdd', 'base de données', 'mysql', 'table', 'BDR', 'SGBDR', 'phpMyAdmin', 'enregistrement', 'champ', 'colonne', 'ligne', 'interface', 'graphique'] },
    { level: '3ème', category: 'Base de données', content: 'clé primaire clé étrangère primary key foreign key contrainte intégrité', keywords: ['clé primaire', 'clé étrangère', 'primary', 'foreign', 'key', 'contrainte', 'intégrité', 'identifiant', 'référence'] },
    { level: '3ème', category: 'Base de données', content: 'relation 1:1 1:∞ ∞:∞ un à un un à plusieurs plusieurs à plusieurs cardinalité', keywords: ['relation', '1:1', '1:∞', '∞:∞', 'cardinalité', 'un à un', 'un à plusieurs', 'plusieurs à plusieurs'] },
    { level: '3ème', category: 'Base de données', content: 'contrainte NOT NULL UNIQUE CHECK DEFAULT', keywords: ['contrainte', 'NOT NULL', 'UNIQUE', 'CHECK', 'DEFAULT', 'intégrité', 'table', 'domaine'] },
    { level: '3ème', category: 'Base de données', content: 'types INT VARCHAR DATE', keywords: ['int', 'varchar', 'date', 'type', 'entier', 'chaîne', 'données'] },
    { level: '3ème', category: 'SQL', content: 'SELECT FROM WHERE ORDER BY DISTINCT ASC DESC', keywords: ['select', 'from', 'where', 'order by', 'distinct', 'asc', 'desc', 'sélection', 'tri', 'requête', 'consulter'] },
    { level: '3ème', category: 'SQL', content: 'INSERT INTO VALUES ajouter', keywords: ['insert', 'into', 'values', 'insertion', 'ajouter', 'enregistrement'] },
    { level: '3ème', category: 'SQL', content: 'UPDATE SET modifier', keywords: ['update', 'set', 'modification', 'modifier', 'mettre à jour'] },
    { level: '3ème', category: 'SQL', content: 'DELETE FROM supprimer', keywords: ['delete', 'from', 'suppression', 'supprimer', 'effacer'] },
    { level: '3ème', category: 'SQL', content: 'opérateurs BETWEEN LIKE IN IS NULL AND OR NOT', keywords: ['between', 'like', 'in', 'null', 'opérateur', 'is null', 'and', 'or', 'not', 'comparaison', 'logique'] },
    
    // 4ème année
    { level: '4ème', category: 'HTML5', content: 'datalist liste suggestions option input', keywords: ['datalist', 'suggestions', 'liste', 'option', 'autocomplétion'] },
    { level: '4ème', category: 'HTML5', content: 'événements onkeydown onkeyup onmouseover onmouseout onplay onpause clavier souris', keywords: ['onkeydown', 'onkeyup', 'onmouseover', 'onmouseout', 'onplay', 'onpause', 'clavier', 'souris', 'keyboard', 'mouse', 'événement'] },
    { level: '4ème', category: 'CSS3', content: 'pseudo-classe link visited hover focus active', keywords: ['link', 'visited', 'hover', 'focus', 'pseudo', 'pseudo-classe', 'active', 'lien', 'visité', 'survol'] },
    { level: '4ème', category: 'CSS3', content: 'sélecteur attribut required type input', keywords: ['attribut', 'required', '[type]', 'sélecteur', 'input[required]', 'input[type]'] },
    { level: '4ème', category: 'CSS3', content: 'transformation transform rotate scale translate skew', keywords: ['transform', 'rotate', 'scale', 'translate', 'skew', 'rotation', 'échelle', 'translation', 'inclinaison', 'transformation'] },
    { level: '4ème', category: 'CSS3', content: 'filtre filter blur grayscale invert', keywords: ['filter', 'filtre', 'blur', 'grayscale', 'invert', 'flou', 'gris', 'inversion'] },
    { level: '4ème', category: 'JavaScript', content: 'getElementsByName name parcourir éléments radio checkbox', keywords: ['getElementsByName', 'name', 'parcourir', 'éléments', 'radio', 'checkbox', 'boucle'] },
    { level: '4ème', category: 'JavaScript', content: 'modification attributs value checked disabled readonly src muted', keywords: ['value', 'checked', 'disabled', 'readonly', 'attribut', 'src', 'muted', 'modification', 'modifier'] },
    { level: '4ème', category: 'JavaScript', content: 'modification style color background border font width height', keywords: ['style', 'color', 'background', 'modification', 'border', 'font', 'width', 'height', 'modifier', 'css javascript'] },
    { level: '4ème', category: 'JavaScript', content: 'méthodes play pause selectedIndex video audio select', keywords: ['play', 'pause', 'selectedIndex', 'video', 'audio', 'méthode', 'lecture', 'select', 'option'] },
    { level: '4ème', category: 'SQL', content: 'CREATE DATABASE DROP DATABASE créer supprimer base', keywords: ['create database', 'drop database', 'créer', 'supprimer', 'base', 'création'] },
    { level: '4ème', category: 'SQL', content: 'CREATE TABLE PRIMARY KEY FOREIGN KEY AUTO_INCREMENT NOT NULL UNIQUE CHECK DEFAULT CASCADE', keywords: ['create table', 'primary key', 'foreign key', 'auto_increment', 'not null', 'unique', 'check', 'default', 'cascade', 'contrainte', 'créer table'] },
    { level: '4ème', category: 'SQL', content: 'ALTER TABLE ADD DROP MODIFY RENAME COLUMN CONSTRAINT', keywords: ['alter table', 'add', 'drop', 'modify', 'alter', 'rename', 'column', 'constraint', 'modifier', 'ajouter', 'supprimer', 'colonne'] },
    { level: '4ème', category: 'SQL', content: 'types INT DECIMAL CHAR VARCHAR TEXT DATE TIME DATETIME', keywords: ['int', 'varchar', 'date', 'datetime', 'type', 'decimal', 'char', 'text', 'time', 'entier', 'chaîne', 'réel'] },
    { level: '4ème', category: 'SQL', content: 'jointure JOIN WHERE multiple tables SQL-89', keywords: ['jointure', 'join', 'where', 'multiple', 'tables', 'sql-89', 'classique', 'lier'] },
    { level: '4ème', category: 'SQL', content: 'agrégation COUNT SUM AVG MIN MAX fonction', keywords: ['count', 'sum', 'avg', 'min', 'max', 'agrégation', 'fonction', 'compter', 'somme', 'moyenne', 'minimum', 'maximum'] },
    { level: '4ème', category: 'SQL', content: 'GROUP BY HAVING groupement regroupement', keywords: ['group by', 'having', 'groupement', 'regrouper', 'groupe'] },
    { level: '4ème', category: 'SQL', content: 'sous-requête subquery IN non corrélée', keywords: ['sous-requête', 'subquery', 'in', 'sous requête', 'requête imbriquée', 'non corrélée'] },
    { level: '4ème', category: 'SQL', content: 'fonctions date YEAR MONTH DAY DATE NOW ADDDATE DATEDIFF', keywords: ['year', 'month', 'day', 'now', 'adddate', 'datediff', 'date', 'fonction date', 'jour', 'mois', 'année', 'différence'] },
    { level: '4ème', category: 'PHP', content: 'PHP syntaxe <?php ?> balise ouverture fermeture echo print', keywords: ['php', 'echo', '$variable', 'print', '<?php', '?>', 'syntaxe', 'balise'] },
    { level: '4ème', category: 'PHP', content: 'types int float string bool array transtypage cast', keywords: ['int', 'float', 'string', 'bool', 'array', 'type php', 'transtypage', 'cast', 'entier', 'réel', 'booléen', 'tableau'] },
    { level: '4ème', category: 'PHP', content: 'structures if else elseif for while do foreach', keywords: ['if php', 'for php', 'while php', 'structure', 'else', 'elseif', 'do', 'foreach', 'condition', 'boucle'] },
    { level: '4ème', category: 'PHP', content: 'fonctions mathématiques abs sqrt round rand min max', keywords: ['abs', 'sqrt', 'round', 'rand', 'math php', 'min', 'max', 'valeur absolue', 'racine', 'arrondi', 'aléatoire'] },
    { level: '4ème', category: 'PHP', content: 'chaînes strlen strtoupper strtolower substr strpos str_replace trim', keywords: ['strlen', 'strtoupper', 'substr', 'strpos', 'chaîne php', 'strtolower', 'str_replace', 'trim', 'longueur', 'majuscule', 'minuscule', 'sous-chaîne', 'position', 'remplacement'] },
    { level: '4ème', category: 'PHP', content: 'date time date() strtotime checkdate format', keywords: ['date php', 'time php', 'strtotime', 'checkdate', 'date()', 'format date', 'timestamp'] },
    { level: '4ème', category: 'PHP', content: 'tableaux array count', keywords: ['array php', 'tableau php', 'count', 'longueur tableau'] },
    { level: '4ème', category: 'PHP', content: '$_GET $_POST transmission données formulaire URL paramètre isset', keywords: ['$_get', '$_post', 'get', 'post', 'formulaire php', 'transmission', 'données', 'url', 'paramètre', 'isset'] },
    { level: '4ème', category: 'PHP', content: 'require include fichier importation inclusion', keywords: ['require', 'include', 'import', 'fichier', 'importation', 'inclusion'] },
    { level: '4ème', category: 'PHP MySQL', content: 'mysqli_connect connexion base données serveur utilisateur mot de passe', keywords: ['mysqli_connect', 'connexion', 'connect', 'base', 'données', 'serveur', 'localhost', 'utilisateur', 'password'] },
    { level: '4ème', category: 'PHP MySQL', content: 'mysqli_query mysqli_fetch_array requête résultats ligne', keywords: ['mysqli_query', 'mysqli_fetch_array', 'query', 'requête', 'résultat', 'fetch', 'ligne', 'enregistrement'] },
    { level: '4ème', category: 'PHP MySQL', content: 'mysqli_num_rows mysqli_affected_rows mysqli_error mysqli_close', keywords: ['mysqli_num_rows', 'mysqli_affected_rows', 'mysqli_error', 'mysqli_close', 'nombre', 'lignes', 'erreur', 'fermer', 'fermeture'] },
];

// Fonction de recherche
function searchContent() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResults');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultCount = document.getElementById('resultCount');
    const clearBtn = document.getElementById('clearBtn');

    // Afficher/masquer le bouton clear
    if (searchTerm) {
        clearBtn.classList.add('active');
    } else {
        clearBtn.classList.remove('active');
        searchResults.classList.remove('active');
        // Réafficher toutes les cartes
        document.querySelectorAll('.level-card').forEach(card => {
            card.style.display = 'block';
        });
        return;
    }

    // Recherche dans la base de données
    const results = searchDatabase.filter(item => {
        return item.content.includes(searchTerm) || 
               item.keywords.some(keyword => keyword.includes(searchTerm)) ||
               item.category.toLowerCase().includes(searchTerm);
    });

    // Afficher les résultats
    if (results.length > 0) {
        searchResults.classList.add('active');
        resultCount.textContent = results.length;
        
        resultsContainer.innerHTML = results.map(result => {
            const highlightedContent = highlightText(result.content, searchTerm);
            return `
                <div class="result-item" onclick="scrollToLevel('${result.level}')">
                    <span class="result-level">${result.level}</span>
                    <strong>${result.category}</strong>
                    <div class="result-text">${highlightedContent}</div>
                </div>
            `;
        }).join('');

        // Filtrer les cartes de niveau
        document.querySelectorAll('.level-card').forEach(card => {
            const levelMatch = results.some(r => card.classList.contains('level-' + r.level.charAt(0)));
            card.style.display = levelMatch ? 'block' : 'none';
        });
    } else {
        searchResults.classList.add('active');
        resultCount.textContent = 0;
        resultsContainer.innerHTML = '<div class="no-results">Aucun résultat trouvé pour "' + searchTerm + '"</div>';
        
        // Masquer toutes les cartes
        document.querySelectorAll('.level-card').forEach(card => {
            card.style.display = 'none';
        });
    }
}

// Fonction pour surligner le texte
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Fonction pour effacer la recherche
function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchContent();
}

// Fonction pour scroller vers un niveau
function scrollToLevel(level) {
    const levelMap = { '2ème': 'level2', '3ème': 'level3', '4ème': 'level4' };
    const levelId = levelMap[level];
    const element = document.getElementById(levelId);
    
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Ouvrir automatiquement le contenu
        setTimeout(() => {
            const contentId = levelId + '-content';
            const content = document.getElementById(contentId);
            if (content && !content.classList.contains('active')) {
                toggleLevel(contentId);
            }
            
            // Animation de highlight
            element.style.transform = 'scale(1.02)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 300);
        }, 500);
    }
}

// Fonction pour afficher/masquer le contenu d'un niveau
function toggleLevel(contentId) {
    const content = document.getElementById(contentId);
    const isActive = content.classList.contains('active');
    
    // Fermer tous les autres contenus
    document.querySelectorAll('.level-content').forEach(item => {
        item.classList.remove('active');
    });
    
    // Ouvrir/fermer le contenu cliqué
    if (!isActive) {
        content.classList.add('active');
        content.parentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Animation au scroll
window.addEventListener('scroll', function() {
    const cards = document.querySelectorAll('.level-card');
    cards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (cardTop < windowHeight - 100) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
});

// Animation initiale au chargement
window.addEventListener('load', function() {
    const cards = document.querySelectorAll('.level-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
    });
});

// Recherche avec la touche Entrée
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', searchContent);
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchContent();
        }
    });
});
