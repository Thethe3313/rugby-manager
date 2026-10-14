# Rugby Manager

Jeu de gestion de club de rugby à XV, façon Football Manager : Top 14 et Pro D2, effectifs réels 2026-27.

## Jouer
- **Double-clic sur « Rugby Manager »** (le raccourci avec le ballon) : le jeu s'ouvre dans sa propre fenêtre, comme une appli.
- Pour l'avoir sous la main : clic droit sur le raccourci → « Épingler à la barre des tâches » ou « Épingler à l'écran de démarrage ».
- Si le dossier est déplacé, le raccourci ne marche plus : relance `outils\creer-raccourci.ps1` (clic droit → « Exécuter avec PowerShell »).
- Sans le raccourci, on peut aussi ouvrir `jeu\index.html` avec n'importe quel navigateur.

Les parties (4 emplacements) sont enregistrées dans le navigateur, dans sa base de données IndexedDB. Pour la passer d'un navigateur à un autre (par exemple de Chrome vers l'appli, qui utilise Edge) : **Réglages → Exporter ma partie**, puis **Importer une partie** depuis l'autre.

## Le dossier
| Dossier | Contenu |
|---|---|
| `jeu/` | Le jeu : `index.html`, les icônes, et le code (`data/` données, `engine/` moteur, `ui/` interface). |
| `recherche/` | La recherche qui a servi à noter les joueurs (une fiche par club, la méthode). |
| `tests/` | Les tests automatiques (`node tests/test.js`). |
| `outils/` | Scripts pour recréer le raccourci et l'icône. |
| `archives/` | Anciennes copies (non suivies par git, on peut les supprimer). |
| `PLAN.md` | La feuille de route. |
| `CLAUDE.md` | Les instructions pour Claude Code. |
