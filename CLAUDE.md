# Rugby Manager — instructions pour Claude Code

## Le projet
Jeu de gestion de club de rugby à XV façon Football Manager, créé par Théophile. Il débute en programmation et ne connaissait pas le rugby au départ : explique simplement, en français. L'interface du jeu est entièrement en français.

Feuille de route : voir `PLAN.md`. On avance étape par étape et on met `PLAN.md` à jour à chaque étape terminée.

## État actuel
Le projet est versionné avec git (branche `main`). Organisation du dossier (voir aussi `LISEZ-MOI.md`) :
- `jeu/` : le jeu. `jeu/index.html` est la page d'entrée, sans dépendance, qui s'ouvre avec un double-clic. Le raccourci `Rugby Manager.lnk` à la racine (créé par `outils/creer-raccourci.ps1`, ignoré par git car il contient un chemin absolu) l'ouvre en mode application d'Edge. `jeu/app.js`, `manifest.webmanifest`, `sw.js` et `icones/` rendent le jeu installable quand il est servi en http(s) ; en `file://`, `app.js` ne fait rien.
- `recherche/` : sources des notes des joueurs (voir plus bas). `tests/` : tests Node. `outils/` : scripts Windows (raccourci, icônes). `archives/` : anciennes copies, ignorées par git.

`jeu/index.html` charge des scripts classiques (`<script src>`, pas de modules ES, pour que le double-clic marche) qui partagent les mêmes variables globales, **dans cet ordre** (chemins relatifs à `jeu/`) :
1. **`data/`** :
   - `joueurs.js` : `REAL`, effectifs réels 2026-27 par club (30 clubs). Format `[nom, poste, sous-poste, année de naissance, nationalité, sélections, sélectionné récemment 0/1, note /99, tags, justification, points forts, points faibles]`.
   - `espoirs.js` : `REALY`, vrais espoirs. Format `[nom, poste, sous-poste, année, nationalité, international U20 0/1, note, potentiel]` (le potentiel est le centre d'une fourchette, voir `potDraw`).
2. **`engine/`** (moteur, en `'use strict'`) :
   - `base.js` : hasard `R`, postes `SLOTS`, attributs `ATTRS`/`W`/`PROF`, styles `STY`, clubs, `LEAGUES`, `ovrAt`, `effAt`, compositions, `teamCalc`.
   - `match.js` : moteur de match phase par phase (voir plus bas).
   - `personnalite.js` : `pro`/`amb`/`det` sur 20 (`realPers`, `ensurePers`, `persLabel`, `weeklyBehaviour`). `staff.js` : six postes `SROLES` (`av tq but pp med rec`) notés sur 20 dans `club.staff` (`staffQ` : 10 = neutre, poste vacant = 4), marché `G.staffPool`, `hireStaff`, `staffSeasonEnd`, effets `coachK` (progression), `recoverK` (forme), `injRiskK` (blessures). Le staff est payé à part (`G.fin.staff`) ; `club.staffRef` = son coût de départ, déjà retiré des frais fixes.
   - `championnat.js` (`stepLeague`, `playFixtures`, phases finales, barrages), `economie.js` (`CLUBINFO`, `capOf`, `salaryFor`, `valueOf`, `askFee`, `wageDemand`), `joueurs.js` (`buildAttrs`, `realPlayer`, `afterMatch`), `mercato.js` (`doTransfer`, `evalOffer`, `genOffers`, `aiMercato`), `saison.js` (`newGame`, `startSeason`, `finishSeason`, `nextSeason`), `calendrier.js`, `messagerie.js` (`mail`), `jour.js` (`dailyUpdate`, `dayStep`, `advance`, `liveDue`), `espoirs.js` (`genYouthPlayer`, `realYouth`, `youthIntake`, `youthSeasonEnd`).
3. **`ui/`** : `style.css` ; `base.js` (`render`, sauvegarde `localStorage` clé `SAVE_KEY`) ; `ecrans.js`, `affichage.js`, `ecrans-gestion.js` (fonctions `view*`) ; `fenetres.js` (fenêtres : fiche joueur, négociation, résumé de match) ; `match-direct.js` (avant-match, direct, terrain 2D) ; `staff.js` (onglet Staff, marché du staff) ; `actions.js` (objet `ACT` des actions, clics délégués via `data-a`, et le `render()` de démarrage, toujours en dernier).

### Moteur de match (`engine/match.js`)
- `newMatch(h, a, opt)` crée l'état du match, `matchStep(ms)` joue **une action** (coup d'envoi, temps de jeu porteur → plaquage → ruck, jeu au pied, touche, mêlée, ballon porté, pénalité), `matchResult(ms)` donne le résultat, `simMatch` enchaîne tout d'un coup. Le direct et les matchs simulés utilisent exactement le même moteur.
- Chaque action utilise les attributs des joueurs concernés via `A(ms, d, k)` : poste, forme du jour, énergie (baisse avec les contacts et le temps), intensité, avantage du terrain, score.
- Consignes du club (`club.tac`) : `style` (`STY`), `int` (`INTS`), `kick` (`KICKS`), `pen` (`PENS`, appliquée dans le camp adverse). Les clubs IA choisissent leur style avec `aiTac`.
- Le résultat garde le format historique (`sh sa th ta pn dr cv yc ev bo winner`) plus `stats` (par équipe), `ps` (joueurs : minutes, note /10, essais, plaquages…) et `motm` (homme du match). `afterMatch(club, r, side)` applique stats de saison, fatigue et blessures.
- Match en direct : `advance` s'arrête la veille d'un match du joueur (`G.liveWait`) ; le direct se joue dans l'interface, puis son résultat passe par `G.liveRes` à `playFixtures`.
- Calibrage visé (Top 14) : ~49 pts et ~5,6 essais par match, ~4 pénalités réussies, ~67-70 % de victoires à domicile, favori gagnant ~70 %, ~26 % d'écarts de 20 points ou plus. Vérifier avec `node tests/calib.js` après toute modification du moteur, et `node tests/consignes.js` pour l'équilibre des consignes (chacune doit rester entre ~50 et ~63 % de victoires).

## Base de recherche des notes
Le dossier `recherche/` contient les données brutes qui ont servi à noter les joueurs :
- un fichier JSON par club pour les pros (`effectifs/`) et pour les espoirs (`espoirs/`), avec la justification de chaque note et un drapeau `unsure` ;
- les consignes de recherche utilisées (`consignes/`), c'est-à-dire la méthode et la grille de calibrage.

Lis `recherche/METHODE.md` avant de toucher aux notes. Pour améliorer une note, modifie d'abord le JSON de `recherche/`, puis régénère `REAL` / `REALY` dans `jeu/data/`.

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
- **Potentiel** : note sur 99 (pas d'étoiles), affichage réglable (affiché ou masqué). Le potentiel est exact pour ses propres joueurs et estimé (« ≈ ») pour les autres. Celui des vrais joueurs est tiré dans une fourchette à chaque nouvelle partie (`potDraw` pour les espoirs, `initPot(…, R.f())` pour les jeunes pros).
- Le joueur veut des notes toujours plus justes : corriger dès qu'un joueur est signalé comme mal noté. Même chose pour la personnalité (estimée : valeurs tirées du nom, bonus pour les stars et les internationaux).
- **Anciennes sauvegardes** : toute nouvelle donnée doit être ajoutée aux parties existantes dans `migrateSave()` (`engine/saison.js`, appelée au chargement et à l'import), sans casser la partie en cours.

## Tests
Pas de framework : des scripts Node dans `tests/` (Node et git sont installés ; dans un terminal ouvert avant leur installation, recharger le PATH). `tests/harness.js` charge les scripts de la page dans l'ordre, avec un faux `document`, un faux `localStorage` et un hasard à graine possible.
- `node tests/test.js [--seasons 2] [--club pau,per]` : saisons complètes pilotées par les actions `ACT` (un match sur trois en direct, avec pause, vitesses, consignes et remplacement), rendu de chaque écran et vérification de l'absence de `undefined`, `NaN` et `[object Object]`. **À lancer après chaque modification.**
- `node tests/calib.js` : statistiques moyennes du moteur de match. `node tests/consignes.js` : effet de chaque consigne.
- `node tests/compare.js ancien.html nouveau.html` : vérifie que deux versions donnent exactement les mêmes écrans (pour les réorganisations qui ne doivent rien changer).
- `node tests/serve.js` : mini-serveur local (http://localhost:8080, sert `jeu/`) pour tester dans le panneau navigateur.
- Pour vérifier la page ouverte en `file://` comme par le raccourci : Edge sans fenêtre, `msedge --headless=new --user-data-dir=<dossier temporaire> --screenshot=<fichier.png> <url file:///…/jeu/index.html>`.
