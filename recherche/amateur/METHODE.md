# Rugby amateur français (Nationale, Nationale 2, Fédérales, Régionales)

Recherche du 14 octobre 2026, saison 2026-27.

## Sources
- Wikipédia : « Championnat de France de rugby à XV de Nationale 2026-2027 » : 14 clubs, 26 journées, phases finales à 6 ; le champion monte en Pro D2, le finaliste joue un barrage chez le 15e de Pro D2 ; aucune descente cette saison (la Nationale passe à 16 clubs en 2027-28).
- Wikipédia : « Championnat de France de rugby à XV de Nationale 2 2026-2027 » : 24 clubs en 2 poules de 12 ; les 2 premiers de chaque poule en quarts, les 3e à 6e en barrages ; les 2 finalistes montent ; aucune descente (réforme de la FFR : 48 clubs en 2027-28).
- Wikipédia : « Championnat de France de rugby à XV de 1re division fédérale 2026-2027 » : 48 clubs en 4 poules de 12 ; 26 montent en Nationale 2 (les 6 premiers de chaque poule et 2 clubs classés 7es), les 22 autres forment la nouvelle Nationale 3.

- Wikipédia : « Championnat de France de rugby à XV de 3e division fédérale 2026-2027 » : 160 clubs en 16 poules de 10 (le RC Bassin d'Arcachon, liquidé, est retiré : 159 clubs).
- Wikipédia : « Championnat de France de rugby à XV de 2e division fédérale 2025-2026 » (pas de page 2026-27) : 96 clubs en 8 poules ; on retire ceux qui sont montés en Fédérale 1 ou descendus en Fédérale 3 en 2026-27 (77 clubs restants).
- Listes brutes : `brut/federales.json` (tirées des modèles « chemin équipes » des pages). `node outils/generer-amateur.js` en tire `jeu/data/amateur.js`.
- Régionales 1 à 3 : aucune liste nationale exploitable (une ligue par région) : **clubs fictifs**, nommés d'après de vraies communes qui n'ont pas déjà un club en Fédérale (30 par niveau, une « région type »).

## Dans le jeu
- Noms et composition des divisions : réels (listes ci-dessus, dans `jeu/engine/divisions.js`).
- Effectifs : **générés** (pas de données fiables sur les joueurs amateurs). Niveau des clubs estimé : Nationale 54 à 61, Nationale 2 50 à 52, Fédérale 1 44 à 50.
- Budgets : estimés (Nationale 3 à 6,5 M€, Nationale 2 1,3 à 2,5 M€).
- Fédérale 1 / Nationale 3, Fédérale 2, Fédérale 3, Régionales : simulation légère (niveau du club seulement, pas d'effectif). Un club qui monte en Nationale 2 reçoit un effectif généré. Niveaux de départ : Fédérale 1 44-50, Fédérale 2 40-45, Fédérale 3 36-41, Régionale 1 33-37, Régionale 2 30-34, Régionale 3 26-30. Budgets types : 700, 400, 250, 150, 110 et 80 k€.
- Carrière dans ces divisions : la poule du joueur reçoit des effectifs générés et se joue en vrai ; pas de phases finales (le 1er de la poule est champion).
- Saisons suivantes (règles futures inconnues, choix du jeu) : Nationale à 16 clubs (2 descentes), Nationale 2 à 48 clubs en 4 poules (le dernier de chaque poule descend, les meilleurs de Nationale 3 montent pour compléter). Tailles visées plus bas : Nationale 3 24 clubs (2 poules de 12), Fédérale 2 80, Fédérale 3 160, Régionales 30 (poules de 10). Entre deux niveaux, environ une montée et une descente par poule (moyenne des nombres de poules des deux niveaux) ; si un niveau manque de clubs, on en fait monter davantage ; la Régionale 3 est complétée par de nouveaux clubs fictifs. 2026-27 : aucune descente de Fédérale 1 (vraie règle).
- Wikipédia indiquait Fabrice Estebanez et Mariano Taverna au staff de Bourg-en-Bresse, ce qui contredit d'autres sources 2026-27 (Castres, Oyonnax) : cette information n'a pas été reprise.
