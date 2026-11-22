// Calibrage de la note de match selon le poste (jeu/engine/indice.js) : médiane et écart de la note brute par poste, puis vérification de la note finale sur 10.
// Utilisation : node tests/indice.js [--n 500]   (affiche la ligne NOTECAL à coller dans jeu/engine/indice.js)
'use strict';
const path=require('path');
const {load}=require('./harness');
const args=process.argv.slice(2),ni=args.indexOf('--n'),N=ni>=0?+args[ni+1]:500;
const g=load(path.join(__dirname,'..','jeu','index.html'),{seed:5});
g.run(`newGame('pau')`);
const raw=g.run(`(()=>{
  const RAW={},cl=clubsIn('t14').concat(clubsIn('pd2'));cl.forEach(c=>c.lineup=autoLineup(c));
  for(const k in NOTECAL)delete NOTECAL[k];
  const o=rateOf;rateOf=function(ms,d){(RAW[d.p.g]=RAW[d.p.g]||[]).push([noteRaw(ms,d),d.secs/60]);return o(ms,d)};
  for(let i=0;i<${N};i++){
    const h=R.pick(cl);let a=R.pick(cl);while(a===h)a=R.pick(cl);
    h.squad.forEach(p=>p.forme=90);a.squad.forEach(p=>p.forme=90);
    simMatch(h,a,{date:R.pick(G.L.t14.dates)});
  }
  rateOf=o;return JSON.stringify(RAW)})()`);
const D=JSON.parse(raw),cal={};
for(const k in D){const v=D[k].filter(x=>x[1]>=40).map(x=>x[0]).sort((a,b)=>a-b),m=v.reduce((s,x)=>s+x,0)/v.length,sd=Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/v.length);cal[k]=[Math.round(v[v.length>>1]*100)/100,Math.round(sd*100)/100]}
console.log('Object.assign(NOTECAL,'+JSON.stringify(cal)+');');
const chk=g.run(`(()=>{Object.assign(NOTECAL,${JSON.stringify(cal)});
  const a=[],cl=clubsIn('t14');cl.forEach(c=>c.lineup=autoLineup(c));
  for(let i=0;i<${Math.round(N)};i++){const h=R.pick(cl);let b=R.pick(cl);while(b===h)b=R.pick(cl);const r=simMatch(h,b,{date:R.pick(G.L.t14.dates)});for(const x of r.ps)if(x.min>=40)a.push([x.g,x.r])}
  const f=a.map(x=>x[1]),m=f.reduce((s,x)=>s+x,0)/f.length,sd=Math.sqrt(f.reduce((s,x)=>s+(x-m)**2,0)/f.length),gm={};
  for(const x of a)(gm[x[0]]=gm[x[0]]||[]).push(x[1]);for(const k in gm)gm[k]=Math.round(gm[k].reduce((s,x)=>s+x,0)/gm[k].length*100)/100;
  return JSON.stringify({n:f.length,moyenne:Math.round(m*100)/100,ecart:Math.round(sd*100)/100,parPoste:gm})})()`);
console.log(chk,'(avant : moyenne 6,55 · écart 0,85, mais piliers à 6,0 et centres à 6,96)');
