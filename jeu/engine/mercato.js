'use strict';
// Moteur : transferts et mercato
function removeFromClub(p,club){club.squad=club.squad.filter(x=>x.id!==p.id);club.lineup=club.lineup.map(id=>id===p.id?null:id)}
function tlog(t){G.tlog=G.tlog||[];G.tlog.unshift(`${seasonLabel()} · ${t}`);if(G.tlog.length>80)G.tlog.length=80}
// Transfert effectif d'un joueur vers un club (from = null pour un joueur libre)
function doTransfer(p,from,to,fee,sal,yrs){
  if(from&&from.id===G.meId)fansTransfer(p,true);else if(to.id===G.meId)fansTransfer(p,false);
  if((G.follow||[]).includes(p.id)&&to.id!==G.meId)mail('Recruteur',`Joueur suivi : ${p.name} signe à ${to.short}`,`${p.name} (${GROUPS[p.g]}, ${Math.round(ovr(p))}) quitte ${from?from.short:'les joueurs libres'} pour ${to.name}${fee?' ('+fmtK(fee)+')':''}.`,{act:{player:p.id}});
  if(to.id===G.meId&&G.follow)G.follow=G.follow.filter(x=>x!==p.id);
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
    const buyers=G.clubs.filter(c=>c.id!==m.id&&c.lg!=='nat'&&c.lg!=='n2'&&!isAmLg(c.lg)&&(ovr(p)<74||c.lg==='t14')&&mass(c)+salaryFor(ovr(p),p.age,c.lg)<=capOf(c));
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
    // cibles : clubs plus faibles, en France comme à l'étranger (URC, Premiership, Super Rugby, Japon)
    const targets=G.clubs.concat(G.ext||[]).filter(x=>x!==c&&x.id!==m.id&&clubStr(x)<clubStr(c)).flatMap(x=>x.squad.filter(p=>p.g===g&&ovr(p)>refO+2&&p.age<=30).map(p=>({p,x})));
    if(!targets.length)continue;
    const t=R.pick(targets),sal=salaryFor(ovr(t.p),t.p.age,c.lg);
    // plafond salarial : le club laisse partir son joueur le plus faible à ce poste pour faire de la place
    if(mass(c)+sal>capOf(c)){
      const out=mine.filter(x=>x!==t.p).slice(-1)[0];
      if(!out||mass(c)-out.sal+sal>capOf(c))continue;
      removeFromClub(out,c);out.ctr=0;out.faT=0;out.list=false;G.fa.push(out);tlog(`${out.name} (${posL(out)}, ${Math.round(ovr(out))}) quitte ${c.short} pour faire de la place.`);
    }
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
// ---- Offres d'achat par messages : le club reçoit l'offre, puis répond 1 à 3 jours plus tard (G.bids) ----
// À l'intersaison les jours ne passent pas : la réponse arrive tout de suite (toujours par message).
function bidReason(r){
  if(r.counter)return `<b>Motif : indemnité trop faible.</b> ${r.club}`;
  const t=r.player||r.msg||'';
  const why=/ne signera pas plus/.test(t)?'durée de contrat':/descendre/.test(t)?'il ne veut pas descendre de division':/demande au moins|manque de temps/.test(t)?'salaire trop faible':/Plafond/.test(t)?'plafond salarial':/Trésorerie/.test(t)?'trésorerie insuffisante':/fenêtre/.test(t)?'fenêtre de transferts fermée':/Effectif complet/.test(t)?'effectif complet':'refus';
  return `<b>Motif : ${why}.</b> ${[r.club,t].filter(Boolean).join(' ')}`;
}
function sendBid(p,from,fee,sal,yrs){
  const b={pid:p.id,club:from.id,fee,sal,yrs,due:dAdd(G.date,R.i(1,3))};
  mail('Directeur sportif',`Offre envoyée : ${p.name} (${from.short})`,`${from.name} a bien reçu notre offre pour <b>${p.name}</b> : indemnité de transfert ${fmtK(fee)}, salaire proposé au joueur ${fmtK(sal)} par an sur ${yrs} an(s).${G.phase==='season'?' Réponse attendue dans les prochains jours.':''}`,{act:{player:p.id}});
  if(G.phase==='season'){G.bids=(G.bids||[]).concat([b]);return null}
  return answerBid(b);
}
function answerBid(b){
  const f=findPlayer(b.pid),p=f.p,c=C(b.club),m=ME();
  if(!p||!f.club||f.club.id!==b.club){mail('Directeur sportif','Offre sans suite',`${p?p.name:'Le joueur'} a quitté ${c?c.short:'son club'} entre-temps : notre offre tombe à l'eau.`,{imp:true});return{ok:false}}
  const r=evalOffer(p,f.club,b.fee,b.sal,b.yrs,false);
  if(r.ok){
    doTransfer(p,f.club,m,b.fee,b.sal,b.yrs);
    mail('Directeur sportif',`✅ Offre acceptée : ${p.name} nous rejoint`,`${c.name} accepte notre offre de ${fmtK(b.fee)} et ${p.name} a signé son contrat (${fmtK(b.sal)} par an, ${b.yrs} an(s)). Il rejoint l'effectif dès aujourd'hui.`,{act:{player:p.id},imp:true});
  }else mail('Directeur sportif',`❌ Offre refusée : ${p.name}`,`Réponse de ${c.name} pour ${p.name} :<br>${bidReason(r)}<br><br>Tu peux faire une nouvelle offre depuis le mercato.`,{act:{player:p.id},imp:true});
  return r;
}
function bidDay(){
  if(!G.bids||!G.bids.length)return;
  const due=G.bids.filter(b=>b.due<=G.date);if(!due.length)return;
  G.bids=G.bids.filter(b=>b.due>G.date);
  for(const b of due)answerBid(b);
}
// ---- Recrutement : ce que tu sais des joueurs des autres clubs ----
// Connaissance de 0 (inconnu) à 3 (parfaitement connu ; tes joueurs). Base 1 pour ceux de ton championnat et les internationaux ;
// chaque observation du recruteur (quelques jours) ajoute 1. Plus le recruteur est bon, plus la fourchette de note est étroite.
function knowOf(p){const f=findPlayer(p.id);if(f.club&&f.club.id===G.meId)return 3;const base=(f.club&&f.club.lg===ME().lg)||p.sel||(p.caps||0)>=20?1:0;return Math.min(3,base+((G.obs||{})[p.id]||0))}
function noteRange(p){const k=knowOf(p),o=ovr(p);if(k>=3)return[Math.round(o),Math.round(o)];const hw=Math.max(.5,9-staffQ(ME(),'rec')*.35)*[1,.6,.3][k],c=o+(hashN(p.name+'n'+G.meId)-.5)*hw;return[Math.max(20,Math.round(c-hw)),Math.min(99,Math.round(c+hw))]}
const noteEst=p=>{const[a,b]=noteRange(p);return(a+b)/2};
function observe(p){
  G.obsQ=G.obsQ||[];if(G.obsQ.some(x=>x.pid===p.id)||knowOf(p)>=3)return 'déjà';if(G.obsQ.length>=5)return 'plein';
  const x={pid:p.id,due:dAdd(G.date,R.i(4,8))};if(G.phase==='season')G.obsQ.push(x);else obsReport(x);return 'ok';
}
function obsReport(x){
  const p=findPlayer(x.pid).p;if(!p)return;G.obs=G.obs||{};G.obs[p.id]=Math.min(3,(G.obs[p.id]||0)+1);const[a,b]=noteRange(p);
  mail('Recruteur',`Rapport d'observation : ${p.name}`,`J'ai observé ${p.name} (${GROUPS[p.g]}, ${p.age} ans). Note estimée : <b>${a===b?a:a+'-'+b}</b>, potentiel ≈ ${potEst(p)}. ${knowOf(p)>=2?'Ses attributs sont maintenant visibles dans sa fiche.':'Une observation de plus affinera l\'estimation.'}`,{act:{player:p.id}});
}
function obsDay(){if(!G.obsQ||!G.obsQ.length)return;const due=G.obsQ.filter(x=>x.due<=G.date);G.obsQ=G.obsQ.filter(x=>x.due>G.date);due.forEach(obsReport)}
