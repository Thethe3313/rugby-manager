'use strict';
// ==== JOUEURS : note actuelle / potentiel (façon Football Manager) ====
// pot = potentiel (note maximale atteignable), pro = professionnalisme caché (1-20) qui accélère la progression
function buildAttrs(p,g,o,noise,mods){
  const T=to20(o);
  // attributs hors poste (mêlée d'un demi de mêlée, buteur d'un pilier…) : bas et peu liés au niveau général
  for(const [k] of ATTRS){const pr=PROF[g][k]??-2;let v=(pr<=-6?T*.5+pr*.6:T+pr)+noise(k);if(mods&&mods[k])v+=mods[k];p[k]=v}
  for(let it=0;it<6;it++){const d=T-to20(ovrAt(p,g));for(const k in W[g])p[k]+=d;for(const [k] of ATTRS)p[k]=clamp(p[k],1,20)}
}
function initPot(o,age,h){const g=age<=19?14+h*14:age<=21?8+h*12:age<=23?4+h*9:age<=25?1+h*5:age<=28?h*2.5:0;return Math.round(Math.min(99,o+g))}
function genPlayer(g,level,age){
  age=age||clamp(Math.round(R.n(26,4)),19,36);
  const p={id:G.nid++,name:genName(),g,age,forme:90,inj:0,ni:false,ctr:R.i(1,4),st:{mj:0,tit:0,es:0,pts:0},sub:g==='PIL'?R.pick(['LH','TH']):g,pro:R.i(4,18),amb:R.i(3,18),det:R.i(3,18),hist:[]};
  buildAttrs(p,g,clamp(level,30,95),()=>R.n(0,1.3));
  const o=ovrAt(p,g);
  p.pot=initPot(o,age,R.f());
  p.sal=salaryFor(o,age,'pd2');
  return p;
}
function realPlayer(r,lg){
  const [n,g,sub,by,nat,caps,rec,rt,tags,ev,str,weak,intl]=r,age=2026-by;
  const o=clamp(rt,45,97);
  const p={id:G.nid++,name:n,g,age,forme:90,inj:0,ni:false,ctr:R.i(1,4),st:{mj:0,tit:0,es:0,pts:0},real:true,nat,sub,tags,caps,ev,hist:[]};
  const mods={};
  for(const t of tags)if(TAGMOD[t])for(const k in TAGMOD[t])mods[k]=(mods[k]||0)+TAGMOD[t][k];
  for(const k of (str||'').split(',').filter(Boolean))mods[k]=(mods[k]||0)+3;
  for(const k of (weak||'').split(',').filter(Boolean))mods[k]=(mods[k]||0)-3;
  buildAttrs(p,g,o,k=>(hashN(n+k)-.5)*2.6,mods);
  const ov=ovrAt(p,g);
  p.pro=clamp(Math.round(5+hashN(n+'pro')*12+(tags.includes('w')?2:0)+(rec?1:0)),1,20);
  realPers(p,n,caps,rec,tags,rt);
  if(intl)p.intl=true;
  // potentiel tiré dans sa fourchette à chaque nouvelle partie (initPot(…,0) à initPot(…,1)) : chaque sauvegarde est différente
  p.pot=initPot(ov,age,R.f());
  p.sal=Math.round(salaryFor(ov,age,lg)*(.88+hashN(n+'sal')*.24));
  return p;
}
function realSquad(id,str,lg){
  const s=REAL[id].map(r=>realPlayer(r,lg));
  for(const g in MINCOMP){const n=s.filter(p=>p.g===g).length;for(let i=n;i<MINCOMP[g];i++){const p=genPlayer(g,str-8+R.n(0,2));p.sal=salaryFor(ovr(p),p.age,lg);s.push(p)}}
  return s;
}
function genSquad(str,lg){const s=[];for(const g in COMP)for(let i=0;i<COMP[g];i++){const p=genPlayer(g,str-i*3.2+R.n(0,3));p.sal=salaryFor(ovr(p),p.age,lg||'nat');s.push(p)}return s}
function mkClub(c,lg){
  const info=CLUBINFO[c[0]]||{bud:lg==='nat'?3000:lg==='n2'?1300:9000};
  const cl={id:c[0],name:c[1],short:c[2],str:c[3],lg,bud:info.bud,cap:info.cap,sponsor:0,squad:REAL[c[0]]?realSquad(c[0],c[3],lg):genSquad(c[3],lg),tac:{style:'equilibre',int:'normale'},focus:'equilibre',budget:0,lineup:[],mp:0};
  // ajuste la masse salariale pour qu'elle respecte le plafond (et soit proche du cap en Top 14)
  const cap=capOf(cl),ms=mass(cl);
  if(ms>cap*.97||(lg==='t14'&&ms<cap*.85)){const f=(lg==='t14'?.92:.95)*cap/ms;cl.squad.forEach(p=>p.sal=Math.max(8,Math.round(p.sal*f)))}
  initStaff(cl);
  cl.lineup=autoLineup(cl);return cl;
}
// Après un match : statistiques de la saison, fatigue selon le temps de jeu, blessures survenues pendant le match
function afterMatch(club,r,side){
  const cost={basse:14,normale:20,haute:28}[club.tac.int]||20;
  club.mp=(club.mp||0)+1;
  for(const x of r.ps||[]){
    if(x.s!==side)continue;
    const p=club.squad.find(y=>y.id===x.id);if(!p)continue;
    const st=p.st;st.mj++;if(x.st)st.tit=(st.tit||0)+1;
    st.es+=x.es;st.pts+=x.pts;st.tac=(st.tac||0)+x.tac;st.m=(st.m||0)+x.m;st.nt=(st.nt||0)+x.r;st.nn=(st.nn||0)+1;if(r.motm===x.id)st.motm=(st.motm||0)+1;
    p.forme=clamp(p.forme-cost*Math.max(.3,x.min/80),20,100);
    if(x.inj){const w=R.pick([1,1,2,2,3,4,6,8,12]);p.inj=Math.max(3,Math.round((w*7+R.i(-2,2))*injRiskK(club)));p.ni=true;p.forme=Math.min(p.forme,60);if(club.id===G.meId){const t=R.pick(w<=2?['contracture aux ischio-jambiers','entorse de la cheville','commotion cérébrale (protocole)','béquille à la cuisse']:w<=6?['entorse du genou','déchirure musculaire','lésion à l\'épaule','fracture du nez']:['rupture des ligaments','fracture de la main','luxation de l\'épaule','lésion du tendon d\'Achille']);addNews(`Blessure : ${p.name} (${posL(p)}) est absent ${injDur(p.inj)}.`);mail('Staff médical',`Blessure : ${p.name}`,`${p.name} (${posL(p)}) souffre d'une ${t}. Durée d'indisponibilité estimée : <b>${injDur(p.inj)}</b>.`,{act:{tab:'squad'}})}}
  }
}
const playShare=(p,c)=>c&&c.mp?Math.min(1,((p.st.tit||0)+.4*(p.st.mj-(p.st.tit||0)))/c.mp):0;
// Progression hebdomadaire : âge, écart au potentiel, temps de jeu, professionnalisme, niveau du championnat
function genFA(n){
  for(let i=0;i<n;i++){
    const g=R.pick(GORDER.flatMap(x=>Array(COMP[x]).fill(x)));
    const p=genPlayer(g,clamp(R.n(62,6),50,76),R.i(21,33));
    p.ctr=0;p.faT=0;p.sal=salaryFor(ovr(p),p.age,'pd2');G.fa.push(p);
  }
}
