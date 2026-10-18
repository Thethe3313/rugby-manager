'use strict';
// ==== AVANCER D'UN JOUR ====
// Forme et blessures : chaque jour. Progression des joueurs : une fois par semaine (le lundi), d'un coup de 7 jours (plus rapide à calculer).
function dailyUpdate(){
  const weekly=dDow(G.date)===1;
  if(weekly)for(const c of G.clubs)youthDaily(c,7);
  if(G.date&&G.date.endsWith('-03-15'))youthIntake();
  for(const c of G.clubs.concat(G.ext||[])){
    const ks=FOCUSK[c.focus],lgK=c.lg==='t14'||c.ext?1:c.lg==='pd2'?.85:.7;
    // staff : récupération (préparateur physique), retours de blessure plus rapides (médecin au-dessus de 10/20)
    const rec=recoverK(c),medFast=(staffQ(c,'med')-10)/40,detK=new Set(['pla','dec','sfr','lea','eng']);
    for(const p of c.squad){
      if(p.inj>0&&!p.ni){p.inj--;if(p.inj>0&&R.f()<medFast)p.inj--}
      p.ni=false;
      // récupération plus lente quand le joueur est frais : un titulaire qui joue tous les matchs s'use (il faut faire tourner)
      p.forme=clamp(p.forme+(p.inj>0?1:(1.2+.035*(100-p.forme))*rec),20,100);
      if(p.inj>0||!weekly)continue;
      const o=ovr(p),gap=(p.pot||o)-o;if(gap<=0)continue;
      const base=p.age<=20?.010:p.age<=23?.007:p.age<=26?.004:p.age<=29?.002:0;if(!base)continue;
      const play=.35+.9*(c.mp?playShare(p,c):.5),pro=.6+(p.pro||10)/20*.8;
      const da=base*gap*play*pro*lgK*(R.f()*.6+.7)*19/79;
      // chaque attribut progresse selon l'entraîneur concerné ; le mental aussi selon la détermination
      for(const key in W[p.g])p[key]=Math.min(20,p[key]+da*coachK(c,p,key)*(detK.has(key)?.9+(p.det||10)/100:1));
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
      G.clubs.forEach(setMatchLineup);
      const out=playFixtures(G.access,true);G.access.res=out.map(slimR);
      mine=out.find(r=>involves(r,m.id))||null;if(mine){mine.others=G.access.res;mine.ko=true}
      finishSeason();
    }
  }else if(G.phase==='season'){
    for(const lg of lgs()){
      const L=G.L[lg],due=L.phase==='regular'?L.dates[L.week]:L.phase==='playoffs'?L.poDates[L.po.stage]:null;
      if(!due||due>G.date)continue;
      clubsIn(lg).forEach(setMatchLineup);
      const reg=L.phase==='regular';
      if(lg===m.lg&&reg){const R_=G.L[m.lg].fixtures.length,inc=Math.round(m.bud*.72/R_),w=Math.round(mass(m)/R_),fx=Math.round(m.fixed/R_),sf=Math.round(staffMass(m)/R_);m.budget+=inc-w-fx-sf;G.fin.sponsor+=inc;G.fin.wages+=w;G.fin.opex+=fx;G.fin.staff=(G.fin.staff||0)+sf}
      const r=stepLeague(lg);
      if(r&&lg===m.lg){mine=r;coachAfterMatch(r);
        if(r.h===m.id&&!r.ko){const R_=G.L[m.lg].fixtures.length,n=clubsIn(m.lg).length,rk=rankOf(m.id)||n/2,attF=(.85+.3*(1-(rk-1)/(n-1)))*(G.coach?.85+.3*G.coach.fans/100:1);const rev=Math.round(m.bud*.28/(R_/2)*attF);m.budget+=rev;G.fin.ticket+=rev;r.att=Math.round(({t14:14000,pd2:5000,nat:2500,n2:900,f1:600,f2:400,f3:250,r1:180,r2:130,r3:100}[m.lg]||900)*attF*(.9+R.f()*.2))}}
    }
    // coupes d'Europe (les samedis sans Top 14)
    xlDay();amDay();espDay();bidDay();selMail();
    const cm=cupDay();if(cm)mine=cm;
    if(lgs().every(lg=>G.L[lg].phase==='done'))prepareAccess();
  }
  if(mine){
    const home=mine.h===m.id,o=C(home?mine.a:mine.h),my=home?mine.sh:mine.sa,op=home?mine.sa:mine.sh;
    addNews(`${mine.cup?mine.cup+" : ":""}${mine.winner===m.id?'Victoire':my===op?'Match nul':'Défaite'} ${my}-${op} ${home?'contre':'à'} ${o.short}.`);
    G.lastMatch=mine;
  }
  dailyUpdate();
  // offres : expiration et nouvelles offres pendant les fenêtres
  G.offers=(G.offers||[]).filter(o=>!o.exp||o.exp>=G.date);
  if(G.phase==='season'&&windowOpen()&&R.f()<.05)genOffers(1);
  if(G.phase==='season')delegDaily();
  // courrier
  const wAfter=windowOpen();
  if(G.phase==='season'&&wBefore!==wAfter)mail('Directeur sportif',wAfter?`Ouverture du mercato ${wAfter==='hiver'?'d\'hiver':'d\'été'}`:'Fermeture du mercato',wAfter?'La fenêtre de transferts est ouverte. Tu peux acheter, vendre et recevoir des offres.':'La fenêtre de transferts est fermée. Restent possibles : les joueurs libres (jokers) et les pré-contrats.',{act:{tab:'market'}});
  if(G.phase==='season'||G.phase==='access'){
    const nx=myNextMatch();if(nx&&dDiff(G.date,nx.d)===1)scoutReport(nx);
    if(dDow(G.date)===1){fitnessReport();weeklyBehaviour();weeklyMorale()}
    if(G.date.endsWith('-01'))monthlyMails();
    if(G.date.endsWith('-01-02')){const fl=(G.follow||[]).map(id=>findPlayer(id)).filter(f=>f.p&&f.club&&f.club.id!==m.id&&f.p.ctr<=1);if(fl.length)mail('Recruteur','Joueurs suivis en fin de contrat',`Ces joueurs que tu suis sont en dernière année de contrat : tu peux leur proposer un pré-contrat (ils arriveraient libres la saison prochaine).<br>${fl.map(f=>`${f.p.name} (${f.club.short}, ${Math.round(ovr(f.p))})`).join('<br>')}`,{act:{tab:'market',mt:'follow'},imp:true})}
    if(G.date.endsWith('-01-02')){const ex=m.squad.filter(p=>p.ctr<=1).sort((a,b)=>ovr(b)-ovr(a));if(ex.length)mail('Directeur sportif','Contrats qui arrivent à échéance',`${ex.length} joueur(s) sont en dernière année de contrat :<br>${ex.slice(0,12).map(p=>`${p.name} (${posL(p)}, ${Math.round(ovr(p))})`).join('<br>')}<br><br>Pense à les prolonger, sinon ils partiront libres en fin de saison — et les autres clubs peuvent déjà leur proposer un pré-contrat.`,{act:{tab:'squad'}})}
  }
  return mine;
}
// Composition d'avant-match : celle du joueur s'il la gère lui-même, sinon la meilleure possible
function setMatchLineup(c){if(c.id===G.meId&&c.autoXV===false)fixLineup(c);else c.lineup=autoLineup(c)}
// Le match du joueur a lieu demain ? (on s'arrête la veille pour proposer le match en direct)
function liveDue(){
  if(G.settings&&G.settings.live==='off')return null;
  const nx=myNextMatch();if(!nx||!nx.d)return null;
  return dAdd(G.date,1)>=nx.d?nx:null;
}
// Avancer : 'day' = un jour, 'match' = jusqu'au prochain match (s'arrête sur un événement important).
// S'arrête aussi la veille d'un match du joueur (G.liveWait), sauf avec opt.noLive (résultat immédiat ou match déjà joué en direct).
function advance(mode,opt={}){
  if(G.phase!=='season'&&G.phase!=='access')return null;
  G.lastMatch=null;G.stop=false;G.liveWait=false;let mine=null,guard=0,first=true;
  do{
    if(!(opt.noLive&&first)&&liveDue()){G.liveWait=true;break}
    first=false;mine=dayStep();
  }while(mode==='match'&&!mine&&!G.stop&&(G.phase==='season'||G.phase==='access')&&guard++<400);
  return mine;
}
function playRound(){return advance('match')}
