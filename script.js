// Base de données de recherche
const searchDatabase = [
    // 2ème année
    { level: '2ème', category: 'HTML5', content: 'html head body structure document', keywords: ['html', 'head', 'body', 'structure', 'doctype'] },
    { level: '2ème', category: 'HTML5', content: 'paragraphe p br h1 h2 h3 h4 h5 h6 titres', keywords: ['p', 'br', 'h1', 'h2', 'h3', 'titre', 'paragraphe'] },
    { level: '2ème', category: 'HTML5', content: 'liste ul ol li ordonnée puces', keywords: ['ul', 'ol', 'li', 'liste'] },
    { level: '2ème', category: 'HTML5', content: 'tableau table tr td th thead tbody tfoot', keywords: ['table', 'tableau', 'tr', 'td', 'th'] },
    { level: '2ème', category: 'HTML5', content: 'image img audio video multimédia src alt controls', keywords: ['img', 'audio', 'video', 'multimédia'] },
    { level: '2ème', category: 'HTML5', content: 'lien a href target', keywords: ['a', 'lien', 'href', 'link'] },
    { level: '2ème', category: 'HTML5', content: 'formulaire form input text number radio checkbox select option fieldset legend', keywords: ['form', 'input', 'formulaire', 'checkbox', 'radio'] },
    { level: '2ème', category: 'CSS3', content: 'style inline font-family font-size color text-align', keywords: ['css', 'style', 'font', 'color', 'couleur'] },
    { level: '2ème', category: 'CSS3', content: 'border bordure border-style border-width border-color', keywords: ['border', 'bordure'] },
    { level: '2ème', category: 'CSS3', content: 'background arrière-plan background-color background-image', keywords: ['background', 'arrière-plan', 'fond'] },
    { level: '2ème', category: 'Validation', content: 'W3C validator validation HTML erreurs', keywords: ['validation', 'w3c', 'validator'] },
    
    // 3ème année
    { level: '3ème', category: 'HTML5', content: 'sémantique header footer nav main section article aside', keywords: ['header', 'footer', 'nav', 'main', 'section', 'article', 'sémantique'] },
    { level: '3ème', category: 'HTML5', content: 'conteneur div span iframe', keywords: ['div', 'span', 'iframe', 'conteneur'] },
    { level: '3ème', category: 'HTML5', content: 'details summary figure figcaption source', keywords: ['details', 'summary', 'figure', 'figcaption'] },
    { level: '3ème', category: 'HTML5', content: 'formulaire avancé date time email tel password range required placeholder', keywords: ['date', 'time', 'email', 'tel', 'password', 'required', 'placeholder'] },
    { level: '3ème', category: 'HTML5', content: 'événements onclick oninput onchange onfocus onblur onload', keywords: ['onclick', 'oninput', 'onchange', 'événement', 'event'] },
    { level: '3ème', category: 'CSS3', content: 'fichier externe stylesheet link rel href', keywords: ['css externe', 'stylesheet', 'link'] },
    { level: '3ème', category: 'CSS3', content: 'sélecteurs id class élément groupe universel', keywords: ['sélecteur', 'id', 'class', '#', '.'] },
    { level: '3ème', category: 'CSS3', content: 'boîte box model width height margin padding', keywords: ['width', 'height', 'margin', 'padding', 'box'] },
    { level: '3ème', category: 'CSS3', content: 'position absolute relative fixed static sticky float', keywords: ['position', 'absolute', 'relative', 'fixed', 'float'] },
    { level: '3ème', category: 'CSS3', content: 'border-radius box-shadow opacity overflow display', keywords: ['border-radius', 'box-shadow', 'opacity', 'overflow'] },
    { level: '3ème', category: 'CSS3', content: 'animation transition keyframes transform rotate scale translate', keywords: ['animation', 'transition', 'keyframes', 'transform', 'rotate', 'scale'] },
    { level: '3ème', category: 'JavaScript', content: 'variable let const string number boolean array', keywords: ['let', 'const', 'variable', 'string', 'number'] },
    { level: '3ème', category: 'JavaScript', content: 'alert prompt document.write innerHTML getElementById', keywords: ['alert', 'prompt', 'innerHTML', 'getElementById'] },
    { level: '3ème', category: 'JavaScript', content: 'if else switch condition', keywords: ['if', 'else', 'switch', 'condition'] },
    { level: '3ème', category: 'JavaScript', content: 'boucle for while do loop itération', keywords: ['for', 'while', 'do', 'boucle', 'loop'] },
    { level: '3ème', category: 'JavaScript', content: 'function fonction paramètre return', keywords: ['function', 'fonction', 'return'] },
    { level: '3ème', category: 'JavaScript', content: 'Date getDate getMonth getFullYear', keywords: ['date', 'getDate', 'getMonth', 'getFullYear'] },
    { level: '3ème', category: 'JavaScript', content: 'String length substring indexOf toLowerCase toUpperCase trim', keywords: ['string', 'length', 'substring', 'indexOf', 'toLowerCase'] },
    { level: '3ème', category: 'JavaScript', content: 'Math random round trunc', keywords: ['math', 'random', 'round'] },
    { level: '3ème', category: 'Base de données', content: 'BDR SGBDR MySQL table enregistrement champ', keywords: ['bdd', 'base de données', 'mysql', 'table'] },
    { level: '3ème', category: 'Base de données', content: 'clé primaire clé étrangère primary key foreign key', keywords: ['clé primaire', 'clé étrangère', 'primary', 'foreign'] },
    { level: '3ème', category: 'Base de données', content: 'relation 1:1 1:∞ un à plusieurs', keywords: ['relation', '1:1', '1:∞', 'cardinalité'] },
    { level: '3ème', category: 'SQL', content: 'SELECT FROM WHERE ORDER BY DISTINCT', keywords: ['select', 'from', 'where', 'order by', 'distinct'] },
    { level: '3ème', category: 'SQL', content: 'INSERT INTO VALUES', keywords: ['insert', 'into', 'values'] },
    { level: '3ème', category: 'SQL', content: 'UPDATE SET', keywords: ['update', 'set'] },
    { level: '3ème', category: 'SQL', content: 'DELETE FROM', keywords: ['delete', 'from'] },
    { level: '3ème', category: 'SQL', content: 'BETWEEN LIKE IN IS NULL opérateurs', keywords: ['between', 'like', 'in', 'null'] },
    
    // 4ème année
    { level: '4ème', category: 'HTML5', content: 'datalist liste suggestions', keywords: ['datalist', 'suggestions'] },
    { level: '4ème', category: 'HTML5', content: 'événements onkeydown onkeyup onmouseover onmouseout onplay onpause', keywords: ['onkeydown', 'onkeyup', 'onmouseover', 'onmouseout', 'clavier', 'souris'] },
    { level: '4ème', category: 'CSS3', content: 'pseudo-classe link visited hover focus', keywords: ['link', 'visited', 'hover', 'focus', 'pseudo'] },
    { level: '4ème', category: 'CSS3', content: 'sélecteur attribut required type', keywords: ['attribut', 'required', '[type]'] },
    { level: '4ème', category: 'JavaScript', content: 'getElementsByName parcourir éléments', keywords: ['getElementsByName', 'name'] },
    { level: '4ème', category: 'JavaScript', content: 'modification attributs value checked disabled readonly src', keywords: ['value', 'checked', 'disabled', 'readonly', 'attribut'] },
    { level: '4ème', category: 'JavaScript', content: 'modification style color background border font width height', keywords: ['style', 'color', 'background', 'modification'] },
    { level: '4ème', category: 'JavaScript', content: 'méthodes play pause selectedIndex', keywords: ['play', 'pause', 'selectedIndex', 'video', 'audio'] },
    { level: '4ème', category: 'SQL', content: 'CREATE DATABASE DROP DATABASE', keywords: ['create database', 'drop database', 'créer'] },
    { level: '4ème', category: 'SQL', content: 'CREATE TABLE PRIMARY KEY FOREIGN KEY AUTO_INCREMENT', keywords: ['create table', 'primary key', 'foreign key', 'auto_increment'] },
    { level: '4ème', category: 'SQL', content: 'ALTER TABLE ADD DROP MODIFY RENAME', keywords: ['alter table', 'add', 'drop', 'modify', 'alter'] },
    { level: '4ème', category: 'SQL', content: 'types INT VARCHAR DATE DATETIME DECIMAL CHAR TEXT', keywords: ['int', 'varchar', 'date', 'datetime', 'type'] },
    { level: '4ème', category: 'SQL', content: 'jointure JOIN WHERE multiple tables', keywords: ['jointure', 'join', 'where', 'multiple'] },
    { level: '4ème', category: 'SQL', content: 'agrégation COUNT SUM AVG MIN MAX', keywords: ['count', 'sum', 'avg', 'min', 'max', 'agrégation'] },
    { level: '4ème', category: 'SQL', content: 'GROUP BY HAVING groupement', keywords: ['group by', 'having', 'groupement'] },
    { level: '4ème', category: 'SQL', content: 'sous-requête IN sous requête', keywords: ['sous-requête', 'subquery', 'in'] },
    { level: '4ème', category: 'SQL', content: 'fonctions date YEAR MONTH DAY NOW ADDDATE DATEDIFF', keywords: ['year', 'month', 'day', 'now', 'adddate', 'datediff', 'date'] },
    { level: '4ème', category: 'PHP', content: 'PHP syntaxe <?php ?> echo variable', keywords: ['php', 'echo', '$variable'] },
    { level: '4ème', category: 'PHP', content: 'types int float string bool array transtypage', keywords: ['int', 'float', 'string', 'bool', 'array', 'type php'] },
    { level: '4ème', category: 'PHP', content: 'structures if else for while do', keywords: ['if php', 'for php', 'while php', 'structure'] },
    { level: '4ème', category: 'PHP', content: 'fonctions mathématiques abs sqrt round rand', keywords: ['abs', 'sqrt', 'round', 'rand', 'math php'] },
    { level: '4ème', category: 'PHP', content: 'chaînes strlen strtoupper strtolower substr strpos str_replace trim', keywords: ['strlen', 'strtoupper', 'substr', 'strpos', 'chaîne php'] },
    { level: '4ème', category: 'PHP', content: 'date time date() strtotime checkdate', keywords: ['date php', 'time php', 'strtotime', 'checkdate'] },
    { level: '4ème', category: 'PHP', content: '$_GET $_POST transmission données formulaire URL', keywords: ['$_get', '$_post', 'get', 'post', 'formulaire php'] },
    { level: '4ème', category: 'PHP', content: 'require include fichier importation', keywords: ['require', 'include', 'import'] },
    { level: '4ème', category: 'PHP MySQL', content: 'mysqli_connect connexion base données', keywords: ['mysqli_connect', 'connexion', 'connect'] },
    { level: '4ème', category: 'PHP MySQL', content: 'mysqli_query mysqli_fetch_array requête résultats', keywords: ['mysqli_query', 'mysqli_fetch_array', 'query'] },
    { level: '4ème', category: 'PHP MySQL', content: 'mysqli_num_rows mysqli_affected_rows mysqli_error', keywords: ['mysqli_num_rows', 'mysqli_affected_rows', 'mysqli_error'] },
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