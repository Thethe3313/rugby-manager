# Rugby Manager — Plan d'action

Mis à jour le 14 octobre 2026. Ce fichier sert de feuille de route : on avance étape par étape, et à chaque étape on coche ce qui est fait.

## ✅ Déjà fait

- **Base du jeu** : jeu web sans installation (`rugby-manager.html` s'ouvre d'un double-clic), sauvegarde dans le navigateur.
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

- **Étape A — Match en direct façon FM + potentiel en fourchette (14 octobre 2026)** :
  - **Moteur de match phase par phase** : coup d'envoi, temps de jeu (porteur, plaquage, ruck), jeu au pied, touche, mêlée, ballon porté, pénalités, cartons jaunes. Calibré sur le Top 14 (≈ 49 points et 5,6 essais par match, ≈ 68 % de victoires à domicile). Il sert aussi pour tous les matchs simulés.
  - **Match en direct** : la veille du match, on choisit entre le direct et le résultat immédiat. Terrain 2D vu de dessus (joueurs numérotés, ballon animé), 4 vitesses (dont « temps forts »), pause, pause automatique à la mi-temps, bandeau sur les temps forts.
  - **Pendant le match** : remplacements (ou par l'adjoint), énergie de chaque joueur visible, blessures, consignes modifiables.
  - **Consignes** : style de jeu, intensité, jeu au pied ou à la main, choix sur pénalité (l'équipe décide, prendre les points, touche, mêlée, jouer vite). Elles ont un effet réel et mesuré, et aucune ne gagne à tous les coups.
  - **Après-match** : temps forts, statistiques des deux équipes, notes des joueurs sur 10, homme du match. Note moyenne de la saison dans l'effectif et sur la fiche du joueur.
  - **Potentiel en fourchette** : celui des vrais jeunes est tiré au hasard à chaque nouvelle partie.
  - Prolongation puis tirs au but en phases finales.

## ▶️ Prochaine étape

### Étape B — Staff et personnalité
- Personnalité visible (professionnalisme, ambition, détermination) qui influence la progression, le comportement et les négociations.
- Staff : entraîneurs (avants, trois-quarts, buteurs, préparation physique), médecin, recruteurs. Leur qualité influence la progression, la récupération et la précision des estimations de potentiel.
- Recrutement du staff, avec contrats et salaires.

## 📋 À faire ensuite (dans l'ordre)

1. **Match en direct, suite (idées)** : discours d'avant-match et de mi-temps, consignes individuelles (ex. : buteur désigné, capitaine), météo (pluie = plus d'en-avant), arbitre plus ou moins sévère.
2. **Coupes d'Europe** : Champions Cup (4 poules de 6, bonus offensif à 3 essais d'écart, défensif à 7 points) et Challenge Cup. Qualification depuis le classement, clubs étrangers.
3. **Autres championnats** : URC, Premiership, Super Rugby, Japon… pour avoir les meilleurs joueurs du monde et un mercato international.
4. **Rugby amateur français** : Nationale, Fédérales, Régionales (R1 à R3), d'après FFR Compétition (notes plus basses, précision moindre acceptable).
5. **Point sur l'interface** : la rendre intuitive (navigation, lisibilité, mobile), avec un tutoriel pour débuter.
6. **Application** :
   - Version installable (PWA, puis Android et iOS).
   - Comptes, 4 emplacements de sauvegarde en ligne.
   - Vrai stockage : la sauvegarde du navigateur sera bientôt trop petite.

## 🔁 En continu

- Améliorer les notes des joueurs dès qu'une erreur est repérée (citer le joueur).
- Garder la Pro D2 en dessous du Top 14, sans descente programmée : un promu bien géré peut se maintenir puis viser le titre.

## 🧰 Outils

- **Claude Code** depuis le 14 octobre 2026 : le projet est un dossier de plusieurs fichiers, versionné avec git et testé directement sur l'ordinateur (`node tests/test.js`).
