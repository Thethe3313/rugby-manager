// Test complet : simule des saisons entières et vérifie chaque écran (pas de « undefined » ni de « NaN »).
// Utilisation : node tests/test.js [--seasons 2] [--club pau] [--seed 42] [fichier.html]
'use strict';
const path=require('path');
const {load,badBits}=require('./harness');
const {scenario}=require('./scenario');

const args=process.argv.slice(2),opt=k=>{const i=args.indexOf('--'+k);return i>=0?args[i+1]:null};
const html=args.find(a=>a.endsWith('.html'))||path.join(__dirname,'..','jeu','index.html');
const seasons=+(opt('seasons')||2),seed=opt('seed')!==null?+opt('seed'):undefined;
const clubs=(opt('club')||'pau,per').split(',');

let problems=0,screens=0,lives=0,matches=0;
const t0=Date.now();
for(const club of clubs){
  const game=load(html,{seed});
  scenario(game,{club,seasons,check:(name,h)=>{screens++;if(name.endsWith(':live-fin'))lives++;if(name.endsWith(':match-stats'))matches++;for(const b of badBits(h)){problems++;if(problems<=20)console.log(`✗ [${club}] ${name} : ${b}`)}}});
  const s=game.run(`({saison:seasonLabel(),phase:G.phase,lg:ME().lg,rang:rankOf(G.meId),joueurs:G.clubs.reduce((n,c)=>n+c.squad.length,0)})`);
  console.log(`✓ ${club} : ${seasons} saison(s) simulée(s) →`,JSON.stringify(s));
}
console.log(`${matches} matchs du joueur (dont ${lives} en direct) · ${screens} écrans vérifiés en ${((Date.now()-t0)/1000).toFixed(1)} s · ${problems?problems+' problème(s)':'aucun problème'}`);
process.exit(problems?1:0);
