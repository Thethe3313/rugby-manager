'use strict';
// Moteur : nouvelle partie, début et fin de saison
const SETTINGS_KEY='rugbyManager_settings';
function loadSettings(){try{return Object.assign({pot:'exact',live:'ask'},JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'))}catch(err){return{pot:'exact',live:'ask'}}}
// Corrections de notes (data/corrections.js) pour les parties déjà commencées : la note gagne l'écart corrigé,
// la progression déjà acquise est conservée ; le potentiel monte d'autant.
const fixKey=f=>f[0]+'@'+f[3];
function applyNoteFixes(){
  G.fixes=G.fixes||[];
  for(const f of NOTEFIX){
    if(G.fixes.includes(fixKey(f)))continue;
    const p=G.clubs.flatMap(c=>c.squad.concat(c.youth||[])).concat(G.fa||[]).find(x=>x.name===f[0]);
    if(p){const da=(f[2]-f[1])*19/79;for(const k in W[p.g])p[k]=clamp(p[k]+da,1,20);p.pot=Math.min(99,Math.max(p.pot+(f[2]-f[1]),Math.round(ovr(p))))}
    G.fixes.push(fixKey(f));
  }
}
// Mise à jour d'une ancienne sauvegarde : ajoute ce qui n'existait pas encore (personnalité, staff, marché du staff)
function migrateSave(){
  // (le staff ajouté était déjà compté dans les frais de fonctionnement : on les diminue d'autant)
  for(const c of G.clubs){for(const p of c.squad.concat(c.youth||[]))ensurePers(p);if(!c.staff){initStaff(c);if(c.fixed)c.fixed=Math.max(0,c.fixed-c.staffRef)}}
  for(const p of G.fa||[])ensurePers(p);
  if(!G.staffPool)genStaffPool();
  if(G.fin&&G.fin.staff==null)G.fin.staff=0;
  applyRealStaff();
  applyNoteFixes();
  if(!G.ext||G.ext.some(c=>!c.real&&typeof REALX!=='undefined'&&REALX[c.id]))initExt();
  else for(const x of EXT0)if(!G.ext.some(c=>c.id===x[0]))G.ext.push(mkExtClub(x)); // nouveaux clubs (Super Rugby, Japon)
  if(G.phase==='season'&&G.cups)startXL(true);
  if(!G.cups&&G.phase==='season')startCups();
  migrateAmateur();
}

function newGame(meId){
  G={nid:1,season:1,meId,phase:'season',tuto:0,tick:0,clubs:[],L:{},access:null,news:[],fa:[],offers:[],pre:[],tlog:[],tab:'home',fin:zeroFin(),hist:[],lastMatch:null,summary:null,moves:null,mail:[],settings:loadSettings()};
  G.clubs=CLUBS0.map(c=>mkClub(c,'t14')).concat(PD2CLUBS.map(c=>mkClub(c,'pd2')),NATCLUBS.map(c=>mkClub(c,'nat')),N2CLUBS.map(c=>Object.assign(mkClub(c,'n2'),{poule:c[4]})));
  initAMD();
  // carrière plus bas (Fédérale, Régionale) : le club choisi reçoit un effectif complet
  if(!C(meId))for(const k of AMORDER){const a=takeLight(k,meId);if(a){const c=mkClub([a.id,a.name,a.short,a.str],k);c.poule=a.poule;if(a.f)c.fict=1;if(a.reg)c.reg=a.reg;G.clubs.push(c);break}}
  G.clubs.forEach(initYouth);
  genFA(40);
  genStaffPool();
  G.fixes=NOTEFIX.map(fixKey);
  const m=ME();
  m.budget=Math.round(m.bud*.05);
  startSeason();
  addNews(`Bienvenue à la tête de ${m.name} (${LEAGUES[m.lg].name}) ! Ton président t'a fixé ses objectifs dans la messagerie.`);
}
function startSeason(){
  G.phase='season';G.summary=null;G.moves=null;G.access=null;G.offers=[];
  G.L={};
  startAMD(); // avant les championnats : la poule du joueur, s'il joue plus bas, reçoit de vrais effectifs
  for(const lg of lgs().concat(isAmLg(ME().lg)?[ME().lg]:[]))if(!G.L[lg])G.L[lg]=buildLeague(lg);
  G.date=`${seasonYear()}-08-01`;G.accessDate=null;
  for(const c of G.clubs){
    if(!c.staff)initStaff(c);
    c.mp=0;c.fixed=Math.max(0,Math.max(Math.round(c.bud*.4),c.bud-Math.max(capOf(c),mass(c)))-(c.staffRef||0));
    c.squad.forEach(p=>{p.st={mj:0,tit:0,es:0,pts:0};p.o0=Math.round(ovr(p))});
    (c.youth||[]).forEach(p=>{p.o0=Math.round(ovr(p))});
    c.lineup=autoLineup(c);
  }
  G.fin=zeroFin();
  setObjective();
  startCups();
  startXL();
  mail('Directeur sportif','Le mercato d\'été est ouvert',`La fenêtre de transferts reste ouverte jusqu'au 15 septembre. Premier match de ${LEAGUES[ME().lg].name} : ${fmtD(G.L[ME().lg].dates[0],true)}.`,{act:{tab:'market'}});
}
function finishSeason(){
  const m=ME(),lg=m.lg,L=G.L[lg],po=L.po,rank=rankOf(m.id),P=LEAGUES[lg].prize;
  const mv=G.moves,acc=G.access.res||[];
  const accTxt=acc.map(r=>`${C(r.h).short} ${r.sh}-${r.sa} ${C(r.a).short}`);
  const a1=acc[0],a2=acc[1];
  const up=[mv.pd2up],down=[mv.t14down],pd2down=[mv.pd2down],natUp=[mv.natUp];
  if(a1){if(a1.winner===a1.h){up.push(a1.h);down.push(a1.a)}}
  if(a2&&a2.winner===a2.a){natUp.push(a2.a);pd2down.push(a2.h)}
  G.moves={up,down,pd2down,natUp,...amMoves(natUp,pd2down)};
  const M=G.moves;
  let prize=0;
  if(po.champ===m.id)prize=P.champ;else if(po.fin===m.id)prize=P.fin;else if(po.seeds.includes(m.id))prize=P.qual;
  m.budget+=prize;G.fin.prize+=prize;
  // destination du club du joueur la saison prochaine
  const to=up.includes(m.id)?'t14':down.includes(m.id)||natUp.includes(m.id)?'pd2':pd2down.includes(m.id)||M.n2Up.includes(m.id)?'nat':M.natDown.includes(m.id)||M.n3Up.includes(m.id)?'n2':M.n2Down.includes(m.id)?'f1':amDest(m.id,M);
  let fate=to?(LEVEL[to]<LEVEL[lg]?'promu':'relégué'):'maintenu';
  G.summary={lg,to,rank,champ:po.champ,fin:po.fin,prize,qualified:po.seeds.includes(m.id),fate,champNat:G.L.nat&&G.L.nat.po?G.L.nat.po.champ:null,champN2:G.L.n2&&G.L.n2.po?G.L.n2.po.champ:null,
    champT14:G.L.t14.po.champ,champPD2:G.L.pd2.po.champ,acc:accTxt};
  G.lastT14=sortedTable('t14').map(r=>r.id); // qualification européenne de la saison suivante
  G.lastXL={};for(const [lg,L] of Object.entries(G.XL||{}))G.lastXL[lg]=xlSorted(L).map(r=>r.id);
  const xlW=lg=>G.XL&&G.XL[lg]&&G.XL[lg].champ?C(G.XL[lg].champ).short:null;
  const cupW=k=>G.cups&&G.cups[k]&&G.cups[k].champ?C(G.cups[k].champ).short:null;
  G.hist.push({s:seasonLabel(),lg,champ:C(G.L.t14.po.champ).short,champ2:C(G.L.pd2.po.champ).short,nat:G.summary.champNat?C(G.summary.champNat).short:null,n2:G.summary.champN2?C(G.summary.champN2).short:null,cc:cupW('cc'),ch:cupW('ch'),urc:xlW('urc'),prem:xlW('prem'),srp:xlW('srp'),jpn:xlW('jpn'),rank,fate});
  addNews(po.champ===m.id?(isAmLg(lg)?`🏆 TU TERMINES EN TÊTE DE TA POULE DE ${LEAGUES[lg].name.toUpperCase()} !`:`🏆 TU ES CHAMPION DE ${LEAGUES[lg].name.toUpperCase()} !`):`Saison terminée : ${rank}e de ${LEAGUES[lg].name}${isAmLg(lg)?' (poule '+(m.poule+1)+')':''}.`);
  if(fate==='promu')addNews(`⬆ ${m.name} monte en ${LEAGUES[to].name} !`);
  if(fate==='relégué')addNews(`⬇ ${m.name} descend en ${LEAGUES[to].name}.`);
  G.phase='offseason';
  const tgt=G.obj?G.obj.t:99;mail('Le président',`Bilan de la saison ${seasonLabel()}`,`Nous terminons ${rank}e de ${LEAGUES[lg].name}. ${rank<=tgt?'Objectif atteint, bravo.':'L\'objectif ('+(G.obj?G.obj.l:'')+') n\'est pas atteint.'} ${fate==='promu'?`Et nous montons en ${LEAGUES[to].name} !`:fate==='relégué'?`Nous descendons en ${LEAGUES[to].name} : il faudra repartir de l'avant.`:fate==='horsjeu'?'Nous descendons en Nationale 3.':''}`);
  G.offers=[];genOffers(R.i(1,3));
  addNews('Le mercato d\'été est ouvert : recrute, vends et prolonge avant de lancer la nouvelle saison.');
}
function nextSeason(){
  const m=ME(),mv=G.moves;
  if(G.summary&&G.summary.fate==='horsjeu'){G.phase='sacked';return}
  // montées et descentes (le budget suit la division)
  for(const id of mv.up){const c=C(id);c.lg='t14';c.cap=c.cap||CAP_BASE;c.bud=Math.max(Math.round(c.bud*1.6),22000)}
  for(const id of mv.down){const c=C(id);c.lg='pd2';c.bud=Math.round(c.bud*.65)}
  for(const id of mv.natUp){const c=C(id);c.lg='pd2';c.bud=Math.max(Math.round(c.bud*1.8),6000);if(!c.youth||!c.youth.length)initYouth(c)}
  for(const id of mv.pd2down){const c=C(id);c.lg='nat';c.bud=Math.round(c.bud*.5)}
  applyAmMoves(mv);
  // pré-contrats signés pendant la saison
  for(const pc of G.pre||[]){const f=findPlayer(pc.pid);if(f.p&&f.club&&f.club.id!==m.id){doTransfer(f.p,f.club,m,0,pc.sal,pc.yrs);f.p.fresh=true}}
  G.pre=[];
  for(const c of G.clubs){if(!c.youth)initYouth(c);youthSeasonEnd(c)}
  genStaffPool();staffSeasonEnd();
  // bilan de progression, vieillissement, contrats
  for(const c of G.clubs.concat(G.ext||[])){
    const keep=[];
    for(const p of c.squad){
      const share=playShare(p,c);
      if(p.age<=23&&c.mp>0){
        if(share<.15){const old=p.pot;p.pot=Math.max(Math.round(ovr(p)),p.pot-R.i(1,3));if(c===m&&old-p.pot>=2)addNews(`📉 ${p.name} n'a presque pas joué : son potentiel baisse.`)}
        else if(share>=.6&&R.f()<.12+(p.pro||10)/100+((p.det||10)-10)/150){p.pot=Math.min(99,p.pot+R.i(1,4));if(c===m)addNews(`🌟 ${p.name} explose cette saison : son potentiel augmente !`)}
      }
      p.hist=(p.hist||[]).concat([{s:seasonLabel(),c:c.short,o:Math.round(ovr(p)),mj:p.st.mj,es:p.st.es}]).slice(-12);
      p.age++;p.inj=0;p.ni=false;p.forme=90;
      if(p.age>=31){const dec=(p.age-30)*.11*(1.2-staffQ(c,'pp')/20*.4)*(1.3-(p.pro||10)/20*.6);for(const k of['vit','pui','end','evi'])p[k]=Math.max(1,p[k]-Math.max(0,R.n(dec,.12)));for(const k of['tac','mai','pas','rck','mel','tou'])p[k]=Math.max(1,p[k]-Math.max(0,R.n(dec*.3,.08)))}
      if(p.age>=23&&p.age<=32)for(const k of['pla','dec','sfr','lea'])p[k]=Math.min(20,p[k]+Math.max(0,R.n(.15,.12)));
      if(p.fresh){delete p.fresh;keep.push(p);continue}
      p.ctr--;
      if(p.age>=37||(p.ctr<=0&&(p.age>=36||(p.age>=34&&R.f()<.45)))){if(c===m||ovr(p)>=78)addNews(`👋 ${p.name} (${c.short}) prend sa retraite.`);continue}
      if(p.ctr<=0){
        if(c===m){addNews(`${p.name} (${posL(p)}) quitte le club libre, en fin de contrat.`);p.faT=0;p.sal=salaryFor(ovr(p),p.age,'pd2');G.fa.push(p);continue}
        if(R.f()<clamp(.65+(ovr(p)-70)/60,.5,.93)){p.ctr=R.i(1,3);p.sal=Math.max(8,salaryFor(ovr(p),p.age,c.lg))}
        else{p.faT=0;G.fa.push(p);continue}
      }
      keep.push(p);
    }
    c.squad=keep;
  }
  // joueurs libres : vieillissement et renouvellement
  G.fa=G.fa.filter(p=>{p.faT=(p.faT||0)+1;if(p.faT>1)p.age++;return p.age<35&&p.faT<=2}).sort((a,b)=>ovr(b)-ovr(a)).slice(0,160);
  genFA(20);
  aiMercato();
  renewExt();
  for(const c of G.clubs)if(c.id!==m.id)c.str=clamp(Math.round(clubStr({...c,lineup:autoLineup(c)})),20,88);
  // centre de formation et postes manquants pour le joueur
  // (les jeunes arrivent désormais par le centre de formation : génération annuelle le 15 mars, onglet Espoirs)
  for(const g in MINCOMP){const n=m.squad.filter(p=>p.g===g).length;for(let i=n;i<MINCOMP[g];i++){const p=genPlayer(g,R.n({t14:58,pd2:55,nat:50,n2:45}[m.lg]||(AMLV[m.lg]?AMLV[m.lg].str[0]-3:45),3),R.i(22,28));p.ctr=1;p.sal=salaryFor(ovr(p),p.age,m.lg);m.squad.push(p);addNews(`Joker recruté au poste de ${GROUPS[g]} : ${p.name}.`)}}
  G.season++;
  startSeason();
  if(mass(m)>capOf(m))addNews(`⚠ Ta masse salariale dépasse ton plafond (${fmtK(capOf(m))}) : aucun recrutement possible tant que tu n'es pas repassé dessous.`);
  if(m.budget<0)addNews('⚠ Ta trésorerie est négative : plus aucune indemnité de transfert possible.');
  addNews(`Nouvelle saison ${seasonLabel()} en ${LEAGUES[m.lg].name} !`);
}
