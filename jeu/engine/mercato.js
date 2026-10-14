'use strict';
// Moteur : transferts et mercato
function removeFromClub(p,club){club.squad=club.squad.filter(x=>x.id!==p.id);club.lineup=club.lineup.map(id=>id===p.id?null:id)}
function tlog(t){G.tlog=G.tlog||[];G.tlog.unshift(`${seasonLabel()} · ${t}`);if(G.tlog.length>80)G.tlog.length=80}
// Transfert effectif d'un joueur vers un club (from = null pour un joueur libre)
function doTransfer(p,from,to,fee,sal,yrs){
  if(from)removeFromClub(p,from);else G.fa=G.fa.filter(x=>x.id!==p.id);
  p.sal=sal;p.ctr=yrs;p.list=false;if(G.phase==='offseason')p.fresh=true;p.forme=Math.min(p.forme,85);delete p.faT;
  to.squad.push(p);
  if(from&&from.id===G.meId){from.budget+=fee;G.fin.transfers+=fee}
  if(to.id===G.meId){to.budget-=fee;G.fin.transfers-=fee}
  else if(from)from.budget=(from.budget||0)+fee;
  const txt=`${p.name} (${posL(p)}, ${Math.round(ovr(p))}) : ${from?from.short:'libre'} → ${to.short}${fee?` pour ${fmtK(fee)}`:''}`;
  tlog(txt);
  if(to.id===G.meId||(from&&from.id===G.meId)||ovr(p)>=76)addNews('Mercato : '+txt);
}
const fmtK=n=>Math.abs(n)>=1000?(n/1000).toFixed(2).replace('.',',')+' M€':Math.round(n)+' k€';
// Évaluation d'une offre du joueur (pre = pré-contrat gratuit pour un joueur en dernière année)
function evalOffer(p,from,fee,sal,yrs,pre){
  const m=ME();
  if(!yrs||yrs<1||yrs>5)return{msg:'Durée de contrat : entre 1 et 5 ans.'};
  if(m.squad.length>=50&&!pre)return{msg:'Effectif complet (50 joueurs maximum).'};
  if(!pre&&mass(m)+sal>capOf(m))return{msg:`Plafond salarial dépassé : il te reste ${fmtK(Math.max(0,capOf(m)-mass(m)))} de marge.`};
  if(from&&!pre){
    if(!windowOpen())return{msg:'La fenêtre de transferts est fermée (ouverte à l\'intersaison et de la 10e à la 13e journée). Seuls les joueurs libres et les pré-contrats sont possibles.'};
    if(fee>m.budget)return{msg:`Trésorerie insuffisante (${fmtK(m.budget)}).`};
    const ask=askFee(p,from);
    if(fee<ask)return{club:`${from.short} refuse ton offre. Il faudrait environ ${fmtK(ask)}.`,counter:ask};
  }
  const dem=wageDemand(p,m,pre?'pre':'move');
  const cur=from;
  if(cur&&cur.lg==='t14'&&m.lg==='pd2'&&(ovr(p)>=80||((p.amb||10)>=16&&ovr(p)>=70))&&sal<dem*1.4)return{club:from&&!pre?`${from.short} accepte l'indemnité.`:'',player:`${p.name}${(p.amb||10)>=16?' est très ambitieux et':''} ne veut pas descendre en Pro D2 (il faudrait un salaire exceptionnel, environ ${fmtK(Math.round(dem*1.4))}).`};
  if(p.age>=32&&yrs>2)return{player:`${p.name} (${p.age} ans) ne signera pas plus de 2 ans.`};
  if(sal<dem*.97)return{club:from&&!pre?`${from.short} accepte l'indemnité.`:'',player:`${p.name} refuse : il demande au moins ${fmtK(dem)} par an.`};
  return{ok:true,club:from&&!pre?`${from.short} accepte l'indemnité.`:'',player:`${p.name} accepte !`};
}
// Offres des clubs IA pour les joueurs du joueur
function genOffers(n){
  const m=ME();G.offers=G.offers||[];
  for(let i=0;i<n;i++){
    const cands=m.squad.filter(p=>ovr(p)>=62&&p.ctr>0&&!G.offers.some(o=>o.pid===p.id));
    if(!cands.length)return;
    const w=cands.map(p=>valueOf(p)*(p.list?3:1));let r=R.f()*w.reduce((a,b)=>a+b,0),p=cands[0];
    for(let j=0;j<cands.length;j++){r-=w[j];if(r<=0){p=cands[j];break}}
    const buyers=G.clubs.filter(c=>c.id!==m.id&&c.lg!=='nat'&&(ovr(p)<74||c.lg==='t14')&&mass(c)+salaryFor(ovr(p),p.age,c.lg)<=capOf(c));
    if(!buyers.length)return;
    const b=R.pick(buyers);
    const fee=Math.round(askFee(p,m)*R.n(p.list?.85:1,.12)/10)*10;
    if(fee>0){G.offers.push({pid:p.id,club:b.id,fee,exp:G.phase==='season'?dAdd(G.date,7):null});mail('Directeur sportif',`Offre de ${b.short} pour ${p.name}`,`${b.name} propose <b>${fmtK(fee)}</b> pour ${p.name} (${posL(p)}, ${Math.round(ovr(p))}, valeur ${fmtK(valueOf(p))}).${G.phase==='season'?' L\'offre expire dans 7 jours.':''}`,{act:{tab:'market',mt:'offers'},imp:true})}
  }
}
// Mercato des clubs IA à l'intersaison
function aiMercato(){
  const m=ME(),ai=shuffle(G.clubs.filter(c=>c.id!==m.id));
  // 1) les gros clubs recrutent un ou deux joueurs dans des clubs plus faibles
  const strong=[...ai].sort((a,b)=>clubStr(b)-clubStr(a)).slice(0,10);
  for(const c of strong){
    if(R.f()<.4)continue;
    const g=R.pick(GORDER);
    const mine=c.squad.filter(x=>x.g===g).sort((a,b)=>ovr(b)-ovr(a));
    const ref=mine[Math.min(STARTERS[g],mine.length)-1];const refO=ref?ovr(ref):60;
    const targets=G.clubs.filter(x=>x!==c&&x.id!==m.id&&clubStr(x)<clubStr(c)).flatMap(x=>x.squad.filter(p=>p.g===g&&ovr(p)>refO+2&&p.age<=30).map(p=>({p,x})));
    if(!targets.length)continue;
    const t=R.pick(targets),sal=salaryFor(ovr(t.p),t.p.age,c.lg);
    if(mass(c)+sal>capOf(c))continue;
    doTransfer(t.p,t.x,c,askFee(t.p,t.x),sal,R.i(2,4));
  }
  // 2) les meilleurs joueurs libres signent d'abord dans les clubs qui peuvent les payer (Top 14 en priorité)
  for(const p of [...G.fa].sort((a,b)=>ovr(b)-ovr(a)).filter(p=>ovr(p)>=72)){
    const opts=ai.filter(c=>{const s=salaryFor(ovr(p),p.age,c.lg);const pos=c.squad.filter(x=>x.g===p.g).sort((a,b)=>ovr(b)-ovr(a));const ref=pos[Math.min(STARTERS[p.g],pos.length)-1];return mass(c)+s<=capOf(c)&&(!ref||ovr(p)>ovr(ref)-2)}).sort((a,b)=>(b.lg==='t14')-(a.lg==='t14')||b.bud-a.bud);
    if(opts.length){const c=opts[R.i(0,Math.min(2,opts.length-1))];doTransfer(p,null,c,0,salaryFor(ovr(p),p.age,c.lg),R.i(1,3))}
  }
  // 3) chaque club comble ses postes avec des joueurs libres, sinon avec des jeunes du centre de formation
  for(const c of [...ai].sort((a,b)=>b.bud-a.bud)){
    for(const g in COMP){
      let n=c.squad.filter(p=>p.g===g).length;
      while(n<COMP[g]){
        const fa=G.fa.filter(p=>p.g===g).map(p=>({p,s:salaryFor(ovr(p),p.age,c.lg)})).filter(x=>mass(c)+x.s<=capOf(c)).sort((a,b)=>ovr(b.p)-ovr(a.p));
        if(fa.length&&ovr(fa[0].p)>=c.str-14){doTransfer(fa[0].p,null,c,0,fa[0].s,R.i(1,3))}
        else if((c.youth||[]).some(y=>y.g===g&&y.age>=18)){const y=c.youth.filter(y=>y.g===g&&y.age>=18).sort((a,b)=>ovr(b)-ovr(a))[0];promoteYouth(c,y)}
        else{const p=genPlayer(g,c.str-14+R.n(0,3),R.i(18,20));p.pot=clamp(Math.round(ovr(p)+R.i(8,24)),55,92);p.ctr=3;p.sal=salaryFor(ovr(p),p.age,c.lg);c.squad.push(p)}
        n++;
      }
    }
  }
}
