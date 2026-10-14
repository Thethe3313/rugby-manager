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

## ▶️ Prochaine étape

### Étape D — Match en direct, suite
- Discours d'avant-match et de mi-temps, consignes individuelles (ex. : buteur désigné, capitaine), météo (pluie = plus d'en-avant), arbitre plus ou moins sévère.

## 📋 À faire ensuite (dans l'ordre)

1. **Autres championnats** : URC, Premiership, Super Rugby, Japon… pour avoir les meilleurs joueurs du monde et un mercato international (les vrais effectifs remplaceront les effectifs simplifiés des clubs étrangers des coupes d'Europe).
2. **Rugby amateur français** : Nationale, Fédérales, Régionales (R1 à R3), d'après FFR Compétition (notes plus basses, précision moindre acceptable).
3. **Point sur l'interface** : la rendre intuitive (navigation, lisibilité, mobile), avec un tutoriel pour débuter.
4. **Application** :
   - Version installable : déjà préparée (manifeste, icônes, service worker), il reste à héberger le dossier `jeu/` en ligne ; puis Android et iOS.
   - Comptes, 4 emplacements de sauvegarde en ligne.
   - Vrai stockage : la sauvegarde du navigateur sera bientôt trop petite.

## 🔁 En continu

- Améliorer les notes des joueurs dès qu'une erreur est repérée (citer le joueur).
- Garder la Pro D2 en dessous du Top 14, sans descente programmée : un promu bien géré peut se maintenir puis viser le titre.

## 🧰 Outils

- **Claude Code** depuis le 14 octobre 2026 : le projet est un dossier de plusieurs fichiers, versionné avec git et testé directement sur l'ordinateur (`node tests/test.js`).
