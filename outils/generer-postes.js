// Génère jeu/data/postes.js (POS2 : postes secondaires connus) depuis recherche/postes/postes2.json
// Utilisation : node outils/generer-postes.js
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const J=JSON.parse(fs.readFileSync(path.join(ROOT,'recherche','postes','postes2.json'),'utf8'));
fs.writeFileSync(path.join(ROOT,'jeu','data','postes.js'),`'use strict';
// ==== POSTES SECONDAIRES CONNUS (généré par outils/generer-postes.js depuis recherche/postes/postes2.json) ====
// nom du joueur -> postes où il joue régulièrement en plus du sien. Les autres joueurs ont des postes secondaires estimés (estPos2).
const POS2=${JSON.stringify(J.joueurs)};
`);
console.log(Object.keys(J.joueurs).length,'joueurs');
