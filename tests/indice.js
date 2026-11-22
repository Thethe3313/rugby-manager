// Calibrage de l'indice de performance : calcule la moyenne et l'écart de la note brute par poste, puis vérifie la répartition obtenue.
// Utilisation : node tests/indice.js [--n 500]   (affiche la ligne IPCAL à coller dans jeu/engine/indice.js)
'use strict';
const path=require('path');
const {load}=require('./harness');
const args=process.argv.slice(2),ni=args.indexOf('--n'),N=ni>=0?+args[ni+1]:500;
const g=load(path.join(__dirname,'..','jeu','index.html'),{seed:5});
g.run(`newGame('pau')`);
const raw=g.run(`(()=>{
  const out={},cl=clubsIn('t14').concat(clubsIn('pd2'));cl.forEach(c=>c.lineup=autoLineup(c));
  const was=IPCAL;for(const k in IPCAL)delete IPCAL[k];
  for(let i=0;i<${N};i++){
    const h=R.pick(cl);let a=R.pick(cl);while(a===h)a=R.pick(cl);
    h.squad.forEach(p=>p.forme=90);a.squad.forEach(p=>p.forme=90);
    const r=simMatch(h,a,{date:R.pick(G.L.t14.dates)});
    for(const x of r.ps)if(x.ip!=null)(out[x.g]=out[x.g]||[]).push(x.ip);
  }
  return JSON.stringify(out)})()`);
const D=JSON.parse(raw),cal={};
for(const k in D){const v=D[k].sort((a,b)=>a-b),m=v.reduce((s,x)=>s+x,0)/v.length,sd=Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/v.length);cal[k]=[Math.round(v[v.length>>1]*100)/100,Math.round(sd*100)/100]}
console.log('Object.assign(IPCAL,'+JSON.stringify(cal)+');');
// vérification de la répartition après calibrage
const chk=g.run(`(()=>{Object.assign(IPCAL,${JSON.stringify(cal)});
  const all=[],cl=clubsIn('t14');cl.forEach(c=>c.lineup=autoLineup(c));
  for(let i=0;i<${Math.round(N/2)};i++){const h=R.pick(cl);let a=R.pick(cl);while(a===h)a=R.pick(cl);const r=simMatch(h,a,{date:R.pick(G.L.t14.dates)});for(const x of r.ps)if(x.ip!=null)all.push(x.ip)}
  all.sort((a,b)=>a-b);const n=all.length,pc=f=>Math.round(all.filter(f).length/n*1000)/10;
  return JSON.stringify({n,mediane:all[n>>1],'<50':pc(v=>v<50),'50-69':pc(v=>v>=50&&v<70),'70-79':pc(v=>v>=70&&v<80),'80-89':pc(v=>v>=80&&v<90),'90+':pc(v=>v>=90)})})()`);
console.log(chk,'(cible : médiane 63 · <50 22 % · 50-69 48 % · 70-79 20 % · 80-89 9 % · 90+ 1 %)');
