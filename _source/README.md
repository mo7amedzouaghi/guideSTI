# Sources du site « Guide du Programme STI »

Les pages HTML du site sont générées par `build.py` à partir des fichiers de contenu :

| Fichier | Page produite |
|---|---|
| `page_2.py`, `page_3.py`, `page_4.py` | `niveau-2.html`, `niveau-3.html`, `niveau-4.html` |
| `page_annexe.py` + `annexe/*.json` | `annexe.html` (référentiel) |
| `page_pedagogie.py` | `pedagogie.html` |
| `page_erreurs.py` | `erreurs.html` |
| `page_outils.py` | `outils.html` |
| `page_accueil.py` | `index.html` |
| `lib.py` | composants communs (gabarit, code + aperçu, À retenir, interdits…) |

Pour régénérer le site après une modification :

```
cd _source
python3 build.py
```

Le dossier `_source` n'est pas publié par GitHub Pages. Les polices et la coloration
syntaxique (Prism) sont hébergées dans `assets/vendor` : le site fonctionne aussi hors connexion.
