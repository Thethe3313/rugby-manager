'use strict';
// ==== AVANCER D'UN JOUR ====
function dailyUpdate(){
  for(const c of G.clubs)youthDaily(c);
  if(G.date&&G.date.endsWith('-03-15'))youthIntake();
  for(const c of G.clubs){
    const ks=FOCUSK[c.focus],lgK=c.lg==='t14'?1:c.lg==='pd2'?.85:.7;
    for(const p of c.squad){
      if(p.inj>0&&!p.ni)p.inj--;
      p.ni=false;
      p.forme=clamp(p.forme+(p.inj>0?1:3.2),20,100);
      if(p.inj>0)continue;
      const o=ovr(p),gap=(p.pot||o)-o;if(gap<=0)continue;
      const base=p.age<=20?.010:p.age<=23?.007:p.age<=26?.004:p.age<=29?.002:0;if(!base)continue;
      const play=.35+.9*(c.mp?playShare(p,c):.5),pro=.6+(p.pro||10)/20*.8;
      const da=base*gap*play*pro*lgK*(R.f()*.6+.7)/7*19/79;
      for(const key in W[p.g])p[key]=Math.min(20,p[key]+da);
      if(c.focus!=='equilibre')for(const key of ks)p[key]=Math.min(20,p[key]+da*.3);
    }
  }
}
function dayStep(){
  const m=ME();let mine=null;
  const wBefore=windowOpen();
  G.date=dAdd(G.date,1);
  if(G.phase==='access'){
    if(G.date>=G.accessDate){
      G.clubs.forEach(c=>{if(c===m&&m.autoXV===false)fixLineup(c);else c.lineup=autoLineup(c)});
      const out=playFixtures(G.access,true);G.access.res=out.map(slimR);
      mine=out.find(r=>involves(r,m.id))||null;if(mine){mine.others=G.access.res;mine.ko=true}
      finishSeason();
    }
  }else if(G.phase==='season'){
    for(const lg of LGORDER){
      const L=G.L[lg],due=L.phase==='regular'?L.dates[L.week]:L.phase==='playoffs'?L.poDates[L.po.stage]:null;
      if(!due||due>G.date)continue;
      clubsIn(lg).forEach(c=>{if(c===m&&m.autoXV===false)fixLineup(c);else c.lineup=autoLineup(c)});
      const reg=L.phase==='regular';
      if(lg===m.lg&&reg){const R_=LEAGUES[m.lg].rounds,inc=Math.round(m.bud*.72/R_),w=Math.round(mass(m)/R_),fx=Math.round(m.fixed/R_);m.budget+=inc-w-fx;G.fin.sponsor+=inc;G.fin.wages+=w;G.fin.opex+=fx}
      const r=stepLeague(lg);
      if(r&&lg===m.lg){mine=r;
        if(r.h===m.id&&!r.ko){const R_=LEAGUES[m.lg].rounds,n=clubsIn(m.lg).length,rk=rankOf(m.id)||n/2,attF=.85+.3*(1-(rk-1)/(n-1));const rev=Math.round(m.bud*.28/(R_/2)*attF);m.budget+=rev;G.fin.ticket+=rev;r.att=Math.round((m.lg==='t14'?14000:5000)*attF*(.9+R.f()*.2))}}
    }
    if(LGORDER.every(lg=>G.L[lg].phase==='done'))prepareAccess();
  }
  if(mine){
    const home=mine.h===m.id,o=C(home?mine.a:mine.h),my=home?mine.sh:mine.sa,op=home?mine.sa:mine.sh;
    addNews(`${mine.winner===m.id?'Victoire':my===op?'Match nul':'Défaite'} ${my}-${op} ${home?'contre':'à'} ${o.short}.`);
    G.lastMatch=mine;
  }
  dailyUpdate();
  // offres : expiration et nouvelles offres pendant les fenêtres
  G.offers=(G.offers||[]).filter(o=>!o.exp||o.exp>=G.date);
  if(G.phase==='season'&&windowOpen()&&R.f()<.05)genOffers(1);
  // courrier
  const wAfter=windowOpen();
  if(G.phase==='season'&&wBefore!==wAfter)mail('Directeur sportif',wAfter?`Ouverture du mercato ${wAfter==='hiver'?'d\'hiver':'d\'été'}`:'Fermeture du mercato',wAfter?'La fenêtre de transferts est ouverte. Tu peux acheter, vendre et recevoir des offres.':'La fenêtre de transferts est fermée. Restent possibles : les joueurs libres (jokers) et les pré-contrats.',{act:{tab:'market'}});
  if(G.phase==='season'||G.phase==='access'){
    const nx=myNextMatch();if(nx&&dDiff(G.date,nx.d)===1)scoutReport(nx);
    if(dDow(G.date)===1)fitnessReport();
    if(G.date.endsWith('-01'))monthlyMails();
    if(G.date.endsWith('-01-02')){const ex=m.squad.filter(p=>p.ctr<=1).sort((a,b)=>ovr(b)-ovr(a));if(ex.length)mail('Directeur sportif','Contrats qui arrivent à échéance',`${ex.length} joueur(s) sont en dernière année de contrat :<br>${ex.slice(0,12).map(p=>`${p.name} (${posL(p)}, ${Math.round(ovr(p))})`).join('<br>')}<br><br>Pense à les prolonger, sinon ils partiront libres en fin de saison — et les autres clubs peuvent déjà leur proposer un pré-contrat.`,{act:{tab:'squad'}})}
  }
  return mine;
}
// Avancer : 'day' = un jour, 'match' = jusqu'au prochain match (s'arrête sur un événement important)
function advance(mode){
  if(G.phase!=='season'&&G.phase!=='access')return null;
  G.lastMatch=null;G.stop=false;let mine=null,guard=0;
  do{mine=dayStep()}while(mode==='match'&&!mine&&!G.stop&&(G.phase==='season'||G.phase==='access')&&guard++<400);
  return mine;
}
function playRound(){return advance('match')}
