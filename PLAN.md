# Rugby Manager — Plan d'action

Mis à jour le 14 octobre 2026. Ce fichier sert de feuille de route : on avance étape par étape, et à chaque étape on coche ce qui est fait.

## ✅ Déjà fait

- **Base du jeu** : jeu web sans installation, sauvegarde dans le navigateur.
- **Passage à Claude Code (14 octobre 2026)** :
  - Projet versionné avec git.
  - Code découpé en dossiers `data/` (données), `engine/` (moteur) et `ui/` (interface), sans rien changer au jeu (vérifié écran par écran).
  - Tests automatiques dans `tests/`.
- **Top 14 et Pro D2 2026-27** : clubs et effectifs réels (~1 300 joueurs), montées et descentes, barrages d'accession, Nationale (clubs fictifs).
- **Règles LNR** : bonus offensif à 3 essais d'écart, bonus défensif à 5 points ou moins, phases finales à 6.
- **Notation façon FM** :
  - 17 attributs sur 20 et note sur 99 calculée selon le poste.
  - Notes réelles établies sur les 3 dernières saisons (50/30/20), avec les points forts et faibles de chaque joueur.
  - Piliers gauche ou droit ; un joueur hors de son poste perd de sa note.
- **Potentiel** : note sur 99, réglable dans les Réglages (affiché ou masqué) ; la progression dépend du temps de jeu.
- **Mercato** :
  - Offres, négociation, pré-contrats, joueurs libres, liste des transferts, libérations.
  - Salary cap réel du Top 14, budgets réels des clubs, salaires et valeurs calculés.
- **Calendrier jour par jour** avec dates réelles et fenêtres de mercato datées.
- **Messagerie** : président, analyste vidéo, staff médical, préparateur physique, directeur sportif, joueurs.
- **Espoirs** :
  - 553 vrais espoirs.
  - Centre de formation noté sur 20.
  - Nouvelle génération chaque 15 mars, avec de futurs cracks (💎).

- **Appli et dossier réorganisé (14 octobre 2026)** :
  - Raccourci « Rugby Manager » avec icône : le jeu s'ouvre dans sa propre fenêtre (mode application d'Edge).
  - Dossier rangé : `jeu/` (le jeu), `recherche/` (sources des notes), `tests/`, `outils/`, `archives/`.
  - Export et import de la sauvegarde dans un fichier (Réglages et écran d'accueil).
  - Déjà prêt pour l'installation en ligne (manifeste, icônes, service worker) : il suffira d'héberger le dossier `jeu/`.
- **Étape A — Match en direct façon FM + potentiel en fourchette (14 octobre 2026)** :
  - **Moteur de match phase par phase** : coup d'envoi, temps de jeu (porteur, plaquage, ruck), jeu au pied, touche, mêlée, ballon porté, pénalités, cartons jaunes. Calibré sur le Top 14 (≈ 49 points et 5,6 essais par match, ≈ 68 % de victoires à domicile). Il sert aussi pour tous les matchs simulés.
  - **Match en direct** : la veille du match, on choisit entre le direct et le résultat immédiat. Terrain 2D vu de dessus (joueurs numérotés, ballon animé), 4 vitesses (dont « temps forts »), pause, pause automatique à la mi-temps, bandeau sur les temps forts.
  - **Pendant le match** : remplacements (ou par l'adjoint), énergie de chaque joueur visible, blessures, consignes modifiables.
  - **Consignes** : style de jeu, intensité, jeu au pied ou à la main, choix sur pénalité (l'équipe décide, prendre les points, touche, mêlée, jouer vite). Elles ont un effet réel et mesuré, et aucune ne gagne à tous les coups.
  - **Après-match** : temps forts, statistiques des deux équipes, notes des joueurs sur 10, homme du match. Note moyenne de la saison dans l'effectif et sur la fiche du joueur.
  - **Potentiel en fourchette** : celui des vrais jeunes est tiré au hasard à chaque nouvelle partie.
  - Prolongation puis tirs au but en phases finales.

- **Étape B — Staff et personnalité (14 octobre 2026)** :
  - **Personnalité** visible sur la fiche de chaque joueur : professionnalisme, ambition, détermination (sur 20) et une étiquette (« Modèle de professionnalisme », « Très ambitieux », « Peu fiable »…).
    - Le professionnalisme accélère la progression, ralentit le déclin après 30 ans et réduit les fautes en match ; un joueur peu professionnel peut avoir des écarts de conduite (forme en baisse, message du staff).
    - L'ambition joue sur les salaires demandés et le refus de rejoindre un club plus faible, et un ambitieux réclame plus vite du temps de jeu.
    - La détermination aide à réagir quand l'équipe est menée, fait progresser le mental et fait « exploser » plus souvent les jeunes. Les leaders déterminés tirent le groupe.
  - **Staff** (nouvel onglet) : entraîneurs des avants, des trois-quarts et des buteurs, préparateur physique, médecin, recruteur, notés sur 20. Ils agissent sur la progression (jusqu'à ±20 %), la récupération, le déclin, les blessures et leur durée, et la précision du potentiel estimé.
  - **Recrutement du staff** : marché des techniciens libres renouvelé chaque été, salaires selon la qualité et la division, contrats de 1 à 3 ans, indemnité si on remplace quelqu'un, prolongations à l'intersaison, poste vacant si on oublie. Salaires du staff dans les finances.
  - Les anciennes sauvegardes reçoivent automatiquement personnalités et staff.
  - **Vrais noms du staff** (Top 14 et Pro D2, 2026-27) : 53 membres et 29 managers retrouvés (Wikipédia, guides RugbyPass, presse), avec leur fonction réelle ; les postes sans source (souvent médecin, recruteur) restent fictifs et sont signalés. Le manager remplacé par le joueur est indiqué dans l'onglet Staff, celui de l'adversaire dans l'avant-match.

- **Étape C — Coupes d'Europe (14 octobre 2026)** :
  - **Champions Cup** (8 clubs du Top 14, 8 de Premiership, 8 d'URC ; 4 poules de 6) et **Challenge Cup** (6 du Top 14, 8 URC, 2 Premiership, 2 invités ; 3 poules de 6).
  - Chaque club joue 4 matchs de poule (pas contre son compatriote), puis 8es, quarts, demies (chez le mieux classé) et finale sur terrain neutre ; les 5es de Champions Cup sont reversés en Challenge Cup.
  - Bonus offensif à 3 essais d'écart, défensif pour une défaite de 7 points ou moins ; prolongation et tirs au but en phase finale.
  - Qualification : les 8 premiers du Top 14 (phase régulière de la saison passée) en Champions Cup, les autres en Challenge Cup.
  - Dates : les samedis sans Top 14 (poules en décembre-janvier, phase finale d'avril à début mai).
  - 28 clubs étrangers réels (Leinster, Bath, Glasgow, Bulls…) avec des effectifs simplifiés (joueurs générés selon le pays).
  - Onglet Europe (poules, phase finale), matchs européens dans le calendrier, en direct et au palmarès, primes à chaque tour.

- **Étape D — Match en direct, suite (14 octobre 2026)** :
  - **Météo** annoncée la veille, selon la saison (pluie, forte pluie, vent, beau temps ; toit fermé à La Défense Arena) : la pluie fait passer de ~50 à ~40 points par match (plus d'en-avant, plus de jeu au pied), le vent gêne les buteurs.
  - **Arbitre** plus ou moins sévère (noms fictifs) : de ~0,7 à ~1,2 carton jaune par match, plus ou moins de pénalités.
  - **Capitaine et buteur désignés** (Composition) : le leadership du capitaine joue sur la discipline et l'équipe ; le brassard passe au meilleur leader s'il sort.
  - **Discours** d'avant-match et de mi-temps (en direct), avec la réaction des joueurs : l'effet dépend du score, du rapport de force et de la détermination de l'effectif.
- **Corrections de notes** : Marius Domon revu (71 → 75) ; les corrections s'appliquent aussi aux parties en cours.

- **Étape E1 — URC et Premiership (14 octobre 2026)** :
  - **Vrais effectifs 2026-27** des 26 clubs (1 092 joueurs, Wikipédia + Wikidata pour les âges) : les 484 internationaux notés un par un, les autres estimés selon le niveau du club et l'âge (voir `recherche/etranger/METHODE.md`).
  - **Championnats simulés** chaque week-end : URC (16 clubs, 18 journées, quarts, demies, finale) et Premiership (10 clubs, 18 journées, demies, finale), avec pauses pendant les tests de novembre et le Tournoi ; classements dans l'onglet Classement, champions au palmarès.
  - Les clubs étrangers vivent d'une saison à l'autre (progression, vieillissement, contrats, retraites, jeunes qui arrivent) et leurs classements qualifient pour les coupes d'Europe.
  - **Mercato international** : les joueurs d'URC et de Premiership sont recrutables (filtre « Étranger » du mercato).
  - Sauvegarde allégée (nombres arrondis) : 1,6 Mo au lieu de 2,2 Mo.

- **Vrai stockage (14 octobre 2026)** : parties enregistrées dans IndexedDB (des centaines de Mo au lieu de ~5 Mo), **4 emplacements de sauvegarde** sur l'écran d'accueil (continuer, supprimer, choisir l'emplacement d'une nouvelle partie) ; l'ancienne sauvegarde est reprise automatiquement.

- **Étape E2 — Super Rugby et Japon (14 octobre 2026)** :
  - **Super Rugby Pacific** (10 clubs : Moana Pasifika a été dissous en juin 2026) et **Japan Rugby League One** (12 clubs de 1re division) : vrais effectifs, 925 joueurs de plus (Will Jordan, Cam Roigard, Wallace Sititi, Fraser McReight…, et les stars parties au Japon : Pieter-Steph du Toit, Malcolm Marx, Jesse Kriel…).
  - Championnats simulés avec leur vrai calendrier (Super Rugby de février à juin, League One de décembre à avril), classements et palmarès.
  - **Mercato mondial** : les clubs IA français recrutent aussi à l'étranger (en libérant un joueur pour rester sous le plafond), les clubs étrangers signent des joueurs libres.
  - Au total : 48 clubs étrangers, 2 017 joueurs, 794 internationaux notés un par un.

- **Étape F1 — Nationale et Nationale 2 (14 octobre 2026)** :
  - **Nationale** (14 clubs réels 2026-27 : Mont-de-Marsan, Carcassonne, Massy…) et **Nationale 2** (24 clubs réels en 2 poules) : clubs complets (effectifs générés, staff, finances), **jouables** dès l'écran d'accueil.
  - Vrais formats 2026-27 : phases finales à 6 en Nationale (le champion monte, le finaliste joue le barrage chez le 15e de Pro D2), barrages / quarts / demies / finale en Nationale 2 (les 2 finalistes montent).
  - **Réforme de la FFR reproduite** : en 2027-28, la Nationale passe à 16 clubs et la Nationale 2 à 48 clubs en 4 poules (26 clubs montent de Fédérale 1) ; les autres clubs de Fédérale 1 forment la Nationale 3.
  - Fédérale 1 / Nationale 3 (48 vrais clubs) simulées légèrement ; classements dans l'onglet Classement.
  - Une descente ne coûte plus ta place, sauf une descente en Nationale 3 (hors des divisions gérées).
  - Simulation accélérée (environ 2 fois plus rapide) : progression hebdomadaire, matchs sans le club du joueur simulés d'après le niveau des équipes en Nationale, Nationale 2 et à l'étranger.

- **Étape F2 — Fédérales et Régionales (14 octobre 2026)** :
  - Six niveaux de plus sous la Nationale 2 : **Fédérale 1** (devient la Nationale 3 en 2027-28), **Fédérale 2** (77 vrais clubs), **Fédérale 3** (159 vrais clubs 2026-27), **Régionales 1, 2 et 3** : vrais clubs 2026-27 des ligues de Nouvelle-Aquitaine et de Provence-Alpes-Côte d'Azur (166 clubs, noms relevés sur Mon Club House) ; les autres ligues viendront plus tard. Joueurs amateurs : noms fictifs (ce sont des particuliers).
  - **Carrière tout en bas** : sur l'écran d'accueil, « Commencer plus bas » permet de choisir n'importe quel club de ces divisions. Ta poule est jouée en vrai (effectifs générés, match en direct), les autres poules en simulation légère.
  - Petits budgets (de 80 k€ en Régionale 3 à 700 k€ en Fédérale 1), joueurs et staff simplement défrayés, pas de centre de formation.
  - Montées et descentes en cascade jusqu'en Régionale 3 ; tailles visées : 24 clubs en Nationale 3, 80 en Fédérale 2, 160 en Fédérale 3, 50 / 70 / 50 en Régionales 1 / 2 / 3. Une descente ne coûte plus jamais ta place.
  - Les anciennes parties reçoivent les nouvelles divisions automatiquement.

- **Point sur l'interface (14 octobre 2026)** : deux mises en page. Ordinateur presque inchangé (bandeau sur une ligne) ; téléphone refait (bandeau compact, barre du bas avec Continuer toujours visible, tableaux resserrés). Tutoriel de 5 étapes pour les nouvelles parties, écran de départ par onglets de divisions. Méthode : captures avant / après (`outils/captures.js`) validées par le joueur avant intégration.

- **Mise en ligne (14 octobre 2026)** : jeu publié sur https://thethe3313.github.io/rugby-manager/ (GitHub Pages), installable sur téléphone depuis le navigateur.

## ▶️ Prochaine étape

### Étape G — Retours de jeu de Théophile (15 octobre 2026)
- **Lot 1** :
  - Avancer façon FM : les jours défilent avec une animation, arrêt automatique au prochain match ou sur un message important, bouton Stop.
  - Écrans téléphone à revoir : Messagerie, Espoirs, Staff et les autres onglets.
  - Mercato par messages : « le club a reçu ton offre », puis réponse quelques jours plus tard (acceptée → le joueur arrive ; refusée → la raison : indemnité, salaire, durée…).
- **Lot 2** :
  - Fatigue et forme qui obligent à faire tourner l'effectif.
  - Couleurs réelles des clubs.
  - Causerie d'après-match.
  - Liste de joueurs suivis au mercato.
- **Lot 3** :
  - Seconds postes (ex. Ferté : demi de mêlée, ailier, arrière).
  - Composition sur un terrain, en glissant les joueurs façon FM.
- **Lot 4** :
  - Championnat espoirs, pour que les jeunes jouent et progressent.
  - Pouvoir fermer la fenêtre du jour de match et revenir au menu.
  - Simuler jusqu'à une date choisie (comme FM / FIFA).
  - Voir l'effectif des autres clubs : noms d'équipes cliquables partout (classements de tous les championnats) → page du club.

## 📋 À faire ensuite

1. **Application** :
   - Version installable : faite et en ligne (https://thethe3313.github.io/rugby-manager/) ; reste une vraie appli Android et iOS.
   - Comptes et sauvegardes en ligne (les 4 emplacements existent déjà dans le navigateur).

## 🔁 En continu

- Améliorer les notes des joueurs dès qu'une erreur est repérée (citer le joueur).
- Garder la Pro D2 en dessous du Top 14, sans descente programmée : un promu bien géré peut se maintenir puis viser le titre.

## 🧰 Outils

- **Claude Code** depuis le 14 octobre 2026 : le projet est un dossier de plusieurs fichiers, versionné avec git et testé directement sur l'ordinateur (`node tests/test.js`).
