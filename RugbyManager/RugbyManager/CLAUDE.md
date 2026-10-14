# Rugby Manager — instructions pour Claude Code

## Le projet
Jeu de gestion de club de rugby à XV façon Football Manager, créé par Théophile. Il débute en programmation et ne connaissait pas le rugby au départ : explique simplement, en français. L'interface du jeu est entièrement en français.

Feuille de route : voir `PLAN.md`. On avance étape par étape et on met `PLAN.md` à jour à chaque étape terminée.

## État actuel
Tout tient dans `rugby-manager.html`, une page HTML/JS sans dépendance qui s'ouvre avec un double-clic. Elle contient trois blocs `<script>` :
1. **Données** :
   - `REAL` : effectifs réels 2026-27 par club (30 clubs). Format `[nom, poste, sous-poste, année de naissance, nationalité, sélections, sélectionné récemment 0/1, note /99, tags, justification, points forts, points faibles]`.
   - `REALY` : vrais espoirs. Format `[nom, poste, sous-poste, année, nationalité, international U20 0/1, note, potentiel]`.
2. **Moteur** :
   - Clubs, joueurs, attributs, simulation de match (`simMatch`).
   - Championnats (`LEAGUES`, `stepLeague`, phases finales, barrages d'accession, Nationale).
   - Calendrier jour par jour (`dayStep`, `advance`, `buildSchedule`), messagerie (`mail`).
   - Économie (`CLUBINFO`, `capOf`, `salaryFor`, `valueOf`), mercato (`askFee`, `wageDemand`, `evalOffer`, `doTransfer`, `aiMercato`, `genOffers`).
   - Progression et potentiel (`dailyUpdate`), espoirs et regens (`genYouthPlayer`, `youthIntake`, `youthSeasonEnd`).
3. **Interface** : fonctions `view*` qui renvoient du HTML et l'objet `ACT` des actions (clics délégués via `data-a`). La sauvegarde utilise `localStorage` (clé `SAVE_KEY`).

Prochaine évolution prévue : découper ce fichier en plusieurs modules (`data/`, `engine/`, `ui/`) quand on construira le match en direct.

## Base de recherche des notes
Le dossier `recherche/` contient les données brutes qui ont servi à noter les joueurs :
- un fichier JSON par club pour les pros et pour les espoirs, avec la justification de chaque note et un drapeau `unsure` ;
- les consignes de recherche utilisées, c'est-à-dire la méthode et la grille de calibrage.

Lis `recherche/METHODE.md` avant de toucher aux notes. Pour améliorer une note, modifie d'abord le JSON de `recherche/`, puis régénère `REAL` / `REALY` dans le jeu.

## Règles et choix importants (à respecter)
- **Échelles** :
  - Les attributs vont de 1 à 20 (17 attributs : `tac mai pas evi pie but mel tou rck` techniques, `pla dec sfr lea eng` mentaux, `vit pui end` physiques).
  - La note globale sur 99 se calcule par `ovrAt` (moyenne pondérée selon le poste via `W`, convertie avec `to99`).
- **Calibrage des notes** :
  - Repères : Dupont 95, Bielle-Biarrey / Ramos / Ntamack / Alldritt / J-B Gros 88-91, internationaux titulaires 84-89, bon titulaire de Top 14 72-77, rotation 66-71.
  - La Pro D2 reste en dessous du Top 14, et son meilleur joueur (Bituniyata) est vers 79.
  - Les notes viennent des 3 dernières saisons (50/30/20) ; une saison blessée ne compte pas.
- **Piliers** : sous-poste `LH` (gauche, n°1) ou `TH` (droit, n°3). Un joueur hors de son poste perd de sa note (`effAt`).
- **Règles LNR** : bonus offensif = au moins 3 essais de plus que l'adversaire, bonus défensif = défaite de 5 points ou moins. Les 6 premiers vont en phases finales.
- **Pas de descente programmée** pour un promu : seule la qualité de la gestion compte.
- **Potentiel** : note sur 99 (pas d'étoiles), affichage réglable (affiché ou masqué). Le potentiel est exact pour ses propres joueurs et estimé (« ≈ ») pour les autres.
- Le joueur veut des notes toujours plus justes : corriger dès qu'un joueur est signalé comme mal noté.

## Tests
Il n'y a pas de framework de tests pour l'instant. On teste en extrayant les blocs `<script>` et en les exécutant avec Node, avec un faux `document` et un faux `localStorage` : simulation de saisons complètes et rendu de chaque écran, en vérifiant l'absence de `undefined` et `NaN` dans le HTML produit. Garder cette habitude : après chaque modification, simuler au moins une saison et parcourir tous les onglets.
