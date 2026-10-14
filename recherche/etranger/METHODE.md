# Effectifs étrangers (URC, Premiership)

Recherche du 14 octobre 2026 pour les 26 clubs d'URC et de Premiership présents en coupe d'Europe.

## Contenu
- `brut/<club>.txt` : sections « Current squad » des pages Wikipédia (anglais) des clubs, effectifs 2026-27.
- `effectifs-brut.json` : joueurs extraits du premier bloc d'effectif (équipe pro, sans l'académie). Pour chaque joueur : nom, poste, nation, international (`cap=y` sur Wikipédia), capitaine, année de naissance (Wikidata, propriété P569 ; 942 sur 1 158 trouvées).
- `notes-internationaux.json` : notes /99 des 484 internationaux, données une par une, plus les listes des buteurs et des joueurs rapides.
- `effectifs/<club>.json` : résultat final, au format de la recherche du Top 14 (`rt`, `ev`, `unsure`…).

## Méthode des notes
1. **Internationaux** : note estimée par Claude à partir de ses connaissances (jusqu'à mi-2026) sur les saisons 2023-24 à 2025-26 et le statut en sélection, avec la grille commune : Dupont 95 ; classe mondiale 90-94 ; titulaire international 84-89 ; international remplaçant ou de petite nation 72-82.
2. **Non-internationaux** (`unsure: true`) : niveau du club − 10, ajusté selon l'âge (−7 à 19 ans … −3 après 33 ans), +3 pour les clubs sud-africains (réservoir très profond), petite variation propre au joueur.
3. Âge inconnu : ~22 ans. Sous-poste des piliers (gauche/droit) inconnu : réparti au hasard (fixe pour un joueur).
4. Effectifs limités à 46 joueurs : minimums par poste, puis les mieux notés.

Ces notes sont **moins précises** que celles du Top 14 (pas de recherche saison par saison). À corriger dès qu'un joueur est signalé.

## Régénérer
Après une correction de `notes-internationaux.json` : `node outils/generer-etranger.js` (réécrit `jeu/data/etranger.js`). Pour une partie en cours, ajouter aussi la correction à `NOTEFIX` (`jeu/data/corrections.js`).
