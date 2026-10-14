'use strict';
// ==== CHAMPIONNATS ÉTRANGERS (URC, Premiership) ====
// Simulés en arrière-plan avec les vrais effectifs : 18 journées le samedi (hors week-ends de coupe d'Europe),
// puis phases finales (URC : 8 qualifiés, quarts, demies, finale ; Premiership : 4 qualifiés, demies, finale).
// Points : victoire 4, nul 2, bonus offensif = 4 essais ou plus, bonus défensif = défaite de 7 points ou moins.
const XLEAGUES={urc:{name:'URC',rounds:18,po:8},prem:{name:'Premiership',rounds:18,po:4}};
const XLPO={8:['Quarts de finale','Demi-finales','Finale'],4:['Demi-finales','Finale']};
const xlBonus=r=>[(r.th>=4?1:0)+(r.sh<r.sa&&r.sa-r.sh<=7?1:0),(r.ta>=4?1:0)+(r.sa<r.sh&&r.sh-r.sa<=7?1:0)];
// Dates : les samedis de mi-septembre à mai, sauf les week-ends de coupe d'Europe,
// les tests de novembre (2e et 3e week-ends) et le Tournoi des Six Nations (février, début mars)
function xlDates(n){
  const cup=new Set(G.cups?G.cups.cc.dates:[]),out=[];
  const pause=d=>{const mo=+d.slice(5,7),day=+d.slice(8,10);return(mo===11&&day>=8&&day<=21)||mo===2||(mo===3&&day<=14)};
  let d=firstDow(`${seasonYear()}-09-14`,6);
  while(out.length<n){if(!cup.has(d)&&!pause(d))out.push(d);d=dAdd(d,7)}
  return out;
}
function startXL(){
  if(!G.ext)return;
  G.XL={};
  for(const [lg,X] of Object.entries(XLEAGUES)){
    const cl=G.ext.filter(c=>c.lg===lg);if(!cl.length)continue;
    for(const c of cl){c.mp=0;c.squad.forEach(p=>{p.st={mj:0,tit:0,es:0,pts:0};p.o0=Math.round(ovr(p))})}
    const fx=mkFixtures(shuffle(cl.map(c=>c.id))).slice(0,X.rounds),table={};
    cl.forEach(c=>table[c.id]=newRow(c.id));
    const dates=xlDates(X.rounds+(X.po===8?3:2));
    G.XL[lg]={lg,name:X.name,week:0,phase:'regular',fixtures:fx.map(r=>r.map(([h,a])=>({h,a}))),table,dates,po:null,champ:null,fin:null};
  }
}
const xlSorted=L=>Object.values(L.table).sort((x,y)=>y.pts-x.pts||(y.pf-y.pa)-(x.pf-x.pa)||y.tf-x.tf);
function xlStep(L){
  const reg=L.phase==='regular',fx=reg?L.fixtures[L.week]:L.po.next;
  [...new Set(fx.flatMap(f=>[f.h,f.a]))].forEach(id=>setMatchLineup(C(id)));
  const out=playFixtures(fx,!reg);
  if(reg){
    for(const r of out){r.bo=xlBonus(r);cupTable(L,r)}
    L.week++;
    if(L.week===L.fixtures.length){
      const n=XLEAGUES[L.lg].po,s=xlSorted(L).slice(0,n).map(r=>r.id);
      L.po={stage:0,seeds:s,next:n===8?[[0,7],[3,4],[1,6],[2,5]].map(([a,b])=>({h:s[a],a:s[b]})):[{h:s[0],a:s[3]},{h:s[1],a:s[2]}],res:[]};
      L.phase='playoffs';
    }
    return;
  }
  const po=L.po,w=out.map(r=>r.winner),seed=id=>po.seeds.indexOf(id);
  po.res.push({stage:po.stage,m:out.map(slimR)});
  if(w.length>1){
    const nx=[];for(let i=0;i<w.length;i+=2){const[a,b]=seed(w[i])<=seed(w[i+1])?[w[i],w[i+1]]:[w[i+1],w[i]];nx.push({h:a,a:b,neutral:w.length===2&&L.lg==='prem'})}
    po.next=nx;po.stage++;
  }else{L.champ=w[0];L.fin=out[0].h===w[0]?out[0].a:out[0].h;L.phase='done';po.next=[];addNews(`🏆 ${C(L.champ).name} remporte le championnat ${L.name}.`)}
}
// Appelé chaque jour par dayStep
function xlDay(){
  if(!G.XL)return;
  for(const L of Object.values(G.XL)){
    if(L.phase==='done')continue;
    const i=L.phase==='regular'?L.week:L.fixtures.length+L.po.stage;
    if(L.dates[i]&&L.dates[i]<=G.date)xlStep(L);
  }
}
