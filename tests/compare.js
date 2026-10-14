// Compare deux versions du jeu : avec le même hasard (graine), elles doivent produire exactement les mêmes écrans.
// Utilisation : node tests/compare.js ancien.html nouveau.html [--seasons 1]
'use strict';
const crypto=require('crypto');
const {load}=require('./harness');
const {scenario}=require('./scenario');

const [a,b]=process.argv.slice(2).filter(x=>x.endsWith('.html'));
const i=process.argv.indexOf('--seasons'),seasons=i>0?+process.argv[i+1]:1;
const trace=(html,club,seed)=>{const out=[];const g=load(html,{seed});scenario(g,{club,seasons,check:(n,h)=>out.push([n,crypto.createHash('md5').update(h).digest('hex')])});out.push(['G',crypto.createHash('md5').update(g.run('JSON.stringify(G)')).digest('hex')]);return out};
let ok=true;
for(const [club,seed] of [['pau',1],['tou',7],['bia',3]]){
  const A=trace(a,club,seed),B=trace(b,club,seed);
  const d=A.findIndex((x,k)=>!B[k]||x[1]!==B[k][1]||x[0]!==B[k][0]);
  if(d<0&&A.length===B.length)console.log(`✓ ${club} : ${A.length} étapes identiques`);
  else{ok=false;console.log(`✗ ${club} : différence à l'étape ${d} (${(A[d]||[])[0]} / ${(B[d]||[])[0]})`)}
}
process.exit(ok?0:1);
