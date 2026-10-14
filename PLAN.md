# Rugby Manager — Plan d'action

Mis à jour le 14 octobre 2026. Ce fichier sert de feuille de route : on avance étape par étape, et à chaque étape on coche ce qui est fait.

## ✅ Déjà fait

- **Base du jeu** : jeu web en un seul fichier (`rugby-manager.html`), sauvegarde dans le navigateur.
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

## ▶️ Prochaine étape

### Étape A — Match en direct façon FM + potentiel en fourchette
- **Terrain 2D** : le ballon et les temps forts sont animés ; le match se déroule minute par minute à vitesse réglable, avec pause.
- **Changements en cours de match** : remplacements, joueurs fatigués visibles, blessures.
- **Consignes** :
  - Style de jeu, intensité, jeu au pied ou à la main.
  - Sur pénalité : l'équipe décide par défaut, ou une consigne imposée (prendre les points, touche, mêlée, jouer vite).
- **Moteur de match** : il simule de vraies phases (conquête, touche, mêlée, ruck, ballon porté) pour que les consignes aient un effet réel.
- **Après-match** : notes des joueurs, homme du match, statistiques (plaquages, mètres, pénalités concédées).
- **Potentiel en fourchette (comme FM)** : chaque nouvelle partie tire le potentiel des vrais jeunes dans une fourchette (par exemple 80 à 90). Chaque sauvegarde est donc différente.

## 📋 À faire ensuite (dans l'ordre)

1. **Staff et personnalité** :
   - Personnalité visible (professionnalisme, ambition, détermination) qui influence la progression, le comportement et les négociations.
   - Staff : entraîneurs (avants, trois-quarts, buteurs, préparation physique), médecin, recruteurs. Leur qualité influence la progression, la récupération et la précision des estimations de potentiel.
   - Recrutement du staff, avec contrats et salaires.
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

- **Aujourd'hui** : développement dans Claude (fichier unique envoyé à chaque version).
- **Passage à Claude Code** : recommandé à partir de l'étape A (voir les explications). Le projet devient un dossier de plusieurs fichiers, testé et versionné directement sur l'ordinateur.
