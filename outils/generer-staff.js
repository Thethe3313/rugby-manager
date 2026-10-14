// Génère jeu/data/staff.js (REALSTAFF) à partir de la recherche recherche/staff/staff-2026-27.json.
// À relancer après chaque correction de la recherche : node outils/generer-staff.js
'use strict';
const fs=require('fs'),path=require('path');
const src=path.join(__dirname,'..','recherche','staff','staff-2026-27.json');
const out=path.join(__dirname,'..','jeu','data','staff.js');
const J=JSON.parse(fs.readFileSync(src,'utf8')),R={};
for(const [id,c] of Object.entries(J)){
  if(id.startsWith('_'))continue;
  const o={};if(c.man)o.man=c.man;
  for(const r of ['av','tq','but','pp','med','rec'])if(c[r])o[r]=c[r];
  R[id]=o;
}
fs.writeFileSync(out,`'use strict';
// ==== STAFF RÉEL 2026-27 (généré par outils/generer-staff.js depuis recherche/staff/) ====
// Par club : man = manager (entraîneur principal) ; av tq but pp med rec = [nom, fonction réelle, sûr 1 / supposé 0].
// Un poste absent = pas de source trouvée : le jeu crée un membre du staff fictif.
const REALSTAFF=${JSON.stringify(R)};
`);
console.log('REALSTAFF :',Object.keys(R).length,'clubs,',Object.values(R).reduce((n,c)=>n+Object.keys(c).filter(k=>k!=='man').length,0),'membres du staff réels,',Object.values(R).filter(c=>c.man).length,'managers');
