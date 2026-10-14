# Base de recherche des notes

Ce dossier contient la recherche qui a servi à noter les joueurs du jeu. C'est la source à améliorer, puis à réinjecter dans les données du jeu (`REAL` et `REALY`).

## Contenu
- `effectifs/<id>.json` : effectifs pro 2026-27, un fichier par club (30 clubs, 1 312 joueurs).
- `espoirs/<id>.json` : vrais espoirs 2026-27 (560 joueurs avant dédoublonnage).
- `consignes/` : consignes de recherche données aux agents. Ce sont la méthode et la grille de calibrage à réutiliser pour toute nouvelle recherche.

Identifiants des clubs :
- **Top 14** : tou, ubb, tln, lar, rac, mon, sfp, pau, cle, cas, lou, bay, per, van.
- **Pro D2** : pro, oyo, bri, col, bia, mtb, age, vro, soy, gre, nev, aur, bez, dax, nic, nar.

## Champs d'un joueur pro (`effectifs/`)
- `n` : nom.
- `pos` : poste parmi PIL, TAL, 2L, 3L, DM, OUV, CEN, AIL, ARR.
- `sub` : sous-poste. LH (pilier gauche) ou TH (pilier droit) pour les piliers, FL ou N8 pour la 3e ligne.
- `by` : année de naissance.
- `nat` : nationalité.
- `caps` : nombre de sélections.
- `recent` : sélectionné depuis janvier 2025.
- `rt` : **note sur 99**.
- `ev` : justification sur 3 saisons.
- `tags` : profil, parmi kicker, pace, power…
- `str` / `weak` : points forts et faibles, en codes d'attributs (tac, mai, pas, evi, pie, but, mel, tou, rck, pla, dec, sfr, lea, eng, vit, pui, end).
- `unsure` : `true` = peu de données, note à vérifier en priorité. Environ 360 joueurs sont dans ce cas, surtout des remplaçants et des espoirs.

## Champs d'un espoir (`espoirs/`)
`n`, `pos`, `sub`, `by`, `nat`, `u20` (international jeunes), `rt` (note), `pot` (potentiel), `unsure`.

## Méthode utilisée
1. **Constitution des effectifs** : RugbyPass (guides 2026-27 de chaque club), all.rugby, prod2.lnr.fr, Wikipédia.
2. **Recherche par joueur sur les saisons 2023-24, 2024-25 et 2025-26** : matchs, titularisations, essais, sélections, distinctions, blessures. Sources principales : pages joueurs all.rugby (tableaux par saison), RugbyPass, itsrugby, Wikipédia. Plusieurs sites limitaient le nombre de requêtes.
3. **Note `rt`** : jugement guidé par une grille commune, pas une formule.
   - Poids des saisons : 50 % pour 2025-26, 30 % pour 2024-25, 20 % pour 2023-24.
   - Une saison blessée est ignorée.
   - Repères : Dupont 95, joueurs de classe mondiale 90-94, internationaux titulaires 84-89, bon titulaire de Top 14 72-77, rotation 66-71. Meilleurs joueurs de Pro D2 vers 76-79 (Bituniyata 79).
4. **Corrections manuelles demandées par Théophile** : Gros est le meilleur pilier gauche du monde (89) ; Bituniyata est le meilleur joueur de Pro D2 (79) ; une partie de l'effectif de Toulon était sous-notée et a été revue.
5. **Dans le jeu** : les 17 attributs sur 20 sont générés à partir de la note, du profil type du poste, des points forts et faibles (+3 / −3) et d'une petite variation propre au joueur. Ils sont ensuite ajustés pour que la note recalculée soit exactement `rt`.

## Pour améliorer
- Traiter en priorité les joueurs `unsure: true`, puis les joueurs signalés par Théophile.
- Garder la même grille de calibrage pour que les clubs restent comparables entre eux.
- Après modification, régénérer `REAL` et `REALY` dans le jeu à partir de ces fichiers. Garder le même ordre de champs (voir `CLAUDE.md`) et retirer des espoirs les noms déjà présents dans un effectif pro.
