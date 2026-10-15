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
   - `couleurs.js` (après `amateur.js`) : `COULEURS`, couleurs de maillot des clubs connus (`clubCols`/`kits` dans `ui/match-direct.js`).
   - `joueurs.js` : `REAL`, effectifs réels 2026-27 par club (30 clubs). Format `[nom, poste, sous-poste, année de naissance, nationalité, sélections, sélectionné récemment 0/1, note /99, tags, justification, points forts, points faibles]`.
   - `amateur.js` (chargé après `staff.js`) : `F2POULES`, `F3POULES` (vrais clubs de Fédérale 2 et 3), `REGPOULES` (vraies Régionales de Nouvelle-Aquitaine `na` et PACA `paca`, depuis `recherche/amateur/brut/regionales.json`), `REGFICT` (clubs fictifs de réserve), générés par `outils/generer-amateur.js`.
   - `espoirs.js` : `REALY`, vrais espoirs. Format `[nom, poste, sous-poste, année, nationalité, international U20 0/1, note, potentiel]` (le potentiel est le centre d'une fourchette, voir `potDraw`).
2. **`engine/`** (moteur, en `'use strict'`) :
   - `base.js` : hasard `R`, postes `SLOTS`, attributs `ATTRS`/`W`/`PROF`, styles `STY`, clubs, `LEAGUES`, `ovrAt`, `effAt`, compositions, `teamCalc`.
   - `match.js` : moteur de match phase par phase (voir plus bas). `jour-de-match.js` : météo `WX` (`weatherFor`, selon le mois, toit pour le Racing), arbitres fictifs `G.refs` (`refFor`, sévérité `sev` → `refK`), capitaine (`club.captain`, `updateCaptain`, `capDisc`), buteur désigné (`club.kicker`, dans `kickerOf`), discours `TALKS` / `applyTalk` (moral `S.mor`, ±5 %). Météo et arbitre sont déterminés par la date et le stade : la prévision d'avant-match est exacte (`opt.date` pour le direct).
   - `personnalite.js` : `pro`/`amb`/`det` sur 20 (`realPers`, `ensurePers`, `persLabel`, `weeklyBehaviour`). `staff.js` : six postes `SROLES` (`av tq but pp med rec`) notés sur 20 dans `club.staff` (`staffQ` : 10 = neutre, poste vacant = 4), marché `G.staffPool`, `hireStaff`, `staffSeasonEnd`, effets `coachK` (progression), `recoverK` (forme), `injRiskK` (blessures). Le staff est payé à part (`G.fin.staff`) ; `club.staffRef` = son coût de départ, déjà retiré des frais fixes.
   - `ligues-etrangeres.js` : URC, Premiership, Super Rugby Pacific (février-juin, 6 qualifiés) et League One japonaise (décembre-avril) simulés en arrière-plan (`XLEAGUES` avec calendrier propre, `G.XL`, `startXL`, `xlDay` appelé par `dayStep`, `xlSorted`, bonus `xlBonus` : 4 essais / défaite ≤ 7 pts) ; classements dans l'onglet Classement ; `G.lastXL` sert à la qualification européenne.
   - `divisions.js` : Nationale (`nat`) et Nationale 2 (`n2`, en poules : `c.poule`, `G.L.n2.poules`, phases finales `setupN2Po`/`stepN2Po`, `poName`) gérées comme le Top 14 et la Pro D2 (`LGORDER=['t14','pd2','nat','n2']`, `buildLeague`) ; en dessous, six niveaux en simulation légère `AMLV`/`AMORDER` (`f1` Fédérale 1 puis Nationale 3, `f2`, `f3`, `r1`-`r3` Régionales de deux ligues, poules tirées par ligue `c.reg`/`A.preg`, `REGNAME` ; clubs dans `jeu/data/amateur.js`, généré par `outils/generer-amateur.js`) : `G.AMD[clé]` (`initAMD`, `startAMD`, `amDay`, `amSorted`, `amC`). Le joueur peut y commencer (`newGame` avec un id léger) : sa poule devient un vrai championnat `G.L[clé]` (`lgs()` = `LGORDER` + cette clé, pas de phases finales, le 1er est champion), ses adversaires redeviennent légers en fin de saison (`toLight`, niveau `amStr`). Montées et descentes en cascade `amMoves`/`applyAmMoves` (`mv.lad[clé]` : `up`, `down`, `gen`, `cut` ; `amDest`) avec les tailles visées (16 en Nationale, 48 en Nationale 2, puis `AMLV[clé].size`). Plus de licenciement sur descente (l'ancien `fate:'horsjeu'` ne sert qu'aux vieilles sauvegardes).
   - Vitesse : les matchs qui ne concernent pas le club du joueur en Nationale, Nationale 2 et dans les championnats étrangers sont simulés d'après le niveau des équipes (`playFixtures(fx,ko,light)`, joueurs crédités du match) ; la progression des joueurs est calculée une fois par semaine (le lundi).
   - `coupes.js` : Champions Cup et Challenge Cup (`G.cups.cc` / `G.cups.ch`). Clubs étrangers `EXT0` dans `G.ext` (hors `G.clubs`, mais `C(id)`, `findPlayer`, le marché, la progression quotidienne et la fin de saison les incluent). Vrais effectifs `REALX` (`jeu/data/etranger.js`, généré par `outils/generer-etranger.js` depuis `recherche/etranger/`, 48 clubs) ; seuls les 2 invités ont un effectif généré. `fillExt` complète les effectifs chaque été (joueurs libres, puis jeunes du pays). Seuls les clubs `urc`/`prem`/`inv` jouent les coupes. Le mercato IA (`aiMercato`) recrute aussi à l'étranger et libère un joueur pour rester sous le plafond. `startCups` (qualification par `G.lastT14`, tirage, poules de 6 sans compatriote), `cupDay` (appelé par `dayStep`, les samedis sans Top 14 donnés par `cupDates`), `stepCup`, `setupKO` (8es → finale, 5es de Champions Cup reversés en Challenge Cup), bonus EPCR `cupBonus` (3 essais d'écart, défaite ≤ 7 pts). `myNextMatch` renvoie le prochain match, championnat ou coupe (`lab`, `ko`).
   - `championnat.js` (`stepLeague`, `playFixtures`, phases finales, barrages), `economie.js` (`CLUBINFO`, `capOf`, `salaryFor`, `valueOf`, `askFee`, `wageDemand`), `joueurs.js` (`buildAttrs`, `realPlayer`, `afterMatch`), `mercato.js` (`doTransfer`, `evalOffer`, `genOffers`, `aiMercato`), `saison.js` (`newGame`, `startSeason`, `finishSeason`, `nextSeason`), `calendrier.js`, `messagerie.js` (`mail`), `jour.js` (`dailyUpdate`, `dayStep`, `advance`, `liveDue`), `espoirs.js` (`genYouthPlayer`, `realYouth`, `youthIntake`, `youthSeasonEnd`).
3. **`ui/`** : `style.css` ; `base.js` (`render`, `save`/`load`, export/import) ; `stockage.js` (`Store` : parties dans IndexedDB, 4 emplacements `G.slot`, résumé `Store.meta` ; repli sur localStorage si IndexedDB manque, comme dans les tests ; reprend l'ancienne sauvegarde `SAVE_KEY`) ; `ecrans.js`, `affichage.js`, `ecrans-gestion.js` (fonctions `view*`) ; `fenetres.js` (fenêtres : fiche joueur, négociation, résumé de match) ; `match-direct.js` (avant-match, direct, terrain 2D) ; `staff.js` (onglet Staff, marché du staff) ; `coupes.js` (onglet Europe) ; `actions.js` (objet `ACT` des actions, clics délégués via `data-a`, et le `render()` de démarrage, toujours en dernier).

### Moteur de match (`engine/match.js`)
- `newMatch(h, a, opt)` crée l'état du match, `matchStep(ms)` joue **une action** (coup d'envoi, temps de jeu porteur → plaquage → ruck, jeu au pied, touche, mêlée, ballon porté, pénalité), `matchResult(ms)` donne le résultat, `simMatch` enchaîne tout d'un coup. Le direct et les matchs simulés utilisent exactement le même moteur.
- Chaque action utilise les attributs des joueurs concernés via `A(ms, d, k)` : poste, forme du jour, énergie (baisse avec les contacts et le temps), intensité, avantage du terrain, score.
- Consignes du club (`club.tac`) : `style` (`STY`), `int` (`INTS`), `kick` (`KICKS`), `pen` (`PENS`, appliquée dans le camp adverse). Les clubs IA choisissent leur style avec `aiTac`.
- Le résultat garde le format historique (`sh sa th ta pn dr cv yc ev bo winner`) plus `stats` (par équipe), `ps` (joueurs : minutes, note /10, essais, plaquages…) et `motm` (homme du match). `afterMatch(club, r, side)` applique stats de saison, fatigue et blessures.
- Match en direct : `advance` s'arrête la veille d'un match du joueur (`G.liveWait`) ; le direct se joue dans l'interface, puis son résultat passe par `G.liveRes` à `playFixtures`.
- Calibrage visé (Top 14) : ~49 pts et ~5,6 essais par match, ~4 pénalités réussies, ~67-70 % de victoires à domicile, favori gagnant ~70 %, ~26 % d'écarts de 20 points ou plus. Vérifier avec `node tests/calib.js` après toute modification du moteur, et `node tests/consignes.js` pour l'équilibre des consignes (chacune doit rester entre ~50 et ~63 % de victoires).

### Vie du club (étape G)
- Fatigue : récupération `(1.2+.035*(100-forme))*recoverK` par jour, effet en match `fm=.78+.22*forme/100` (même facteur dans `effAt`), blessures plus fréquentes sous 75 %.
- Causerie d'après-match `postTalk` (`jour-de-match.js`) → `G.postMor` (±3 %) appliqué au moral du match suivant dans `newMatch`.
- Offres d'achat par messages : `sendBid`/`bidDay`/`answerBid` (`G.bids`, réponse 1-3 jours plus tard, motif `bidReason`). Joueurs suivis `G.follow`. Continuer animé : `ACT.go`/`goTick` (s'arrête la veille d'un match ou sur un message `imp`).

## Base de recherche des notes
Le dossier `recherche/` contient les données brutes qui ont servi à noter les joueurs :
- un fichier JSON par club pour les pros (`effectifs/`) et pour les espoirs (`espoirs/`), avec la justification de chaque note et un drapeau `unsure` ;
- les consignes de recherche utilisées (`consignes/`), c'est-à-dire la méthode et la grille de calibrage.

Le staff réel 2026-27 est dans `recherche/staff/staff-2026-27.json` (sources, fonction réelle, drapeau sûr/supposé ; `brut/` = sections Wikipédia). Après modification : `node outils/generer-staff.js` régénère `jeu/data/staff.js` (`REALSTAFF`, chargé après `espoirs.js`). Les postes sans source restent fictifs (`s.f`), affichés comme tels. Ne jamais inventer un nom réel.

Les divisions amateurs sont décrites dans `recherche/amateur/METHODE.md` (clubs réels, effectifs générés). Les effectifs étrangers (URC, Premiership, Super Rugby, Japon) sont dans `recherche/etranger/` (voir son `METHODE.md` : internationaux notés un par un, autres estimés).

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
- **Formats réels des championnats** : quand la FFR ou la LNR change un format, reproduire le vrai format (ex. réforme 2027-28 de la Nationale 2 à 48 clubs).
- **Potentiel** : note sur 99 (pas d'étoiles), affichage réglable (affiché ou masqué). Le potentiel est exact pour ses propres joueurs et estimé (« ≈ ») pour les autres. Celui des vrais joueurs est tiré dans une fourchette à chaque nouvelle partie (`potDraw` pour les espoirs, `initPot(…, R.f())` pour les jeunes pros).
- Le joueur veut des notes toujours plus justes : corriger dès qu'un joueur est signalé comme mal noté. Méthode : vérifier ses 3 saisons sur le web, appliquer la grille, corriger `recherche/effectifs/<club>.json` **et** l'entrée de `REAL` dans `jeu/data/joueurs.js`, puis ajouter la correction à `NOTEFIX` (`jeu/data/corrections.js`) pour que les parties en cours en profitent. Même chose pour la personnalité (estimée : valeurs tirées du nom, bonus pour les stars et les internationaux).
- **Anciennes sauvegardes** : toute nouvelle donnée doit être ajoutée aux parties existantes dans `migrateSave()` (`engine/saison.js`, appelée au chargement et à l'import), sans casser la partie en cours.

## Publication
Dépôt public https://github.com/Thethe3313/rugby-manager (e-mail des commits : adresse noreply de GitHub, réglée dans la config locale du dépôt). `.github/workflows/pages.yml` publie `jeu/` sur https://thethe3313.github.io/rugby-manager/ à chaque push sur `main`. Le service worker (`jeu/sw.js`) prend le réseau d'abord : les joueurs reçoivent la nouvelle version au prochain lancement. Outil GitHub : `C:Program FilesGitHub CLIgh.exe` (connecté au compte Thethe3313).

## Tests
Pas de framework : des scripts Node dans `tests/` (Node et git sont installés ; dans un terminal ouvert avant leur installation, recharger le PATH). `tests/harness.js` charge les scripts de la page dans l'ordre, avec un faux `document`, un faux `localStorage` et un hasard à graine possible.
- `node tests/test.js [--seasons 2] [--club pau,per]` : saisons complètes pilotées par les actions `ACT` (un match sur trois en direct, avec pause, vitesses, consignes et remplacement), rendu de chaque écran et vérification de l'absence de `undefined`, `NaN` et `[object Object]`. **À lancer après chaque modification.**
- `node tests/calib.js` : statistiques moyennes du moteur de match. `node tests/consignes.js` : effet de chaque consigne.
- `node tests/compare.js ancien.html nouveau.html` : vérifie que deux versions donnent exactement les mêmes écrans (pour les réorganisations qui ne doivent rien changer).
- `node outils/captures.js --out <dossier> [--jeu <dossier du jeu>] [--ecrans home,squad]` : photographie chaque écran (ordinateur 1366×900 et téléphone 390×844) avec Edge sans fenêtre, sur une partie de démonstration à graine fixe. Pour tout changement d'interface : captures avant / après, montrées au joueur (page HTML dans `apercus/`, ignoré par git, avec les images intégrées en base64 : l’aperçu de l’appli n’ouvre pas les fichiers voisins) **avant** d’intégrer le changement.
- `node tests/serve.js` : mini-serveur local (http://localhost:8080, sert `jeu/`) pour tester dans le panneau navigateur.
- Pour vérifier la page ouverte en `file://` comme par le raccourci : Edge sans fenêtre, `msedge --headless=new --user-data-dir=<dossier temporaire> --screenshot=<fichier.png> <url file:///…/jeu/index.html>`.
