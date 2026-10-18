'use strict';
// ==== CENTRES DE FORMATION ET ESPOIRS (regens façon FM) ====
// Qualité du centre de formation sur 20 (estimation d'après la réputation des académies)
const ACAD={tou:20,cle:18,rac:17,ubb:16,lar:15,mon:15,sfp:15,pau:15,lou:14,tln:13,cas:13,bay:13,per:13,van:11,
  bri:13,gre:12,bia:12,age:12,col:12,mtb:11,oyo:11,pro:11,dax:11,vro:10,soy:10,bez:10,nev:10,aur:9,nic:9,nar:9};
const acadOf=c=>c.acad||ACAD[c.id]||(c.lg==='t14'?13:c.lg==='pd2'?10:7);
function genYouthPlayer(c,age){
  const a=acadOf(c);
  const g=R.pick(GORDER.flatMap(x=>Array(COMP[x]).fill(x)));
  const lvl=R.n(37+a*.6+(age-16)*5,4);
  const p=genPlayer(g,lvl,age);
  const r=R.f();
  let pa=58+a*.6+R.n(0,7);
  if(r<.002+a*.0009){pa=R.i(88,97);p.pro=Math.max(p.pro,R.i(12,20));p.det=Math.max(p.det,R.i(11,20));p.gem=true}
  else if(r<.07)pa+=R.i(6,12);
  p.pot=Math.round(clamp(pa,Math.round(ovr(p))+5,97));
  p.youth=true;p.ctr=0;p.sal=12;p.nat='France';
  return p;
}
// Potentiel en fourchette (comme FM) : la valeur des données est le centre d'une fourchette d'autant plus large que le joueur est jeune
// (par exemple 85 à 16 ans → entre 77 et 93). Le tirage favorise le centre : les valeurs extrêmes sont rares.
const potRange=age=>age<=17?8:age<=19?6:4;
function potDraw(pot,age){const w=potRange(age);return pot+(R.f()+R.f()-1)*w}
function realYouth(r){
  const [n,g,sub,by,nat,u20,rt,pot]=r,age=2026-by;
  const p={id:G.nid++,name:n,g,age,forme:90,inj:0,ni:false,ctr:0,st:{mj:0,tit:0,es:0,pts:0},real:true,nat,sub,tags:'',caps:0,hist:[],youth:true,sal:12};
  buildAttrs(p,g,clamp(rt,40,75),k=>(hashN(n+k)-.5)*2.6);
  p.pro=clamp(Math.round(6+hashN(n+'pro')*11+(u20?3:0)),1,20);
  realPers(p,n,0,u20,'',rt);
  p.pot=Math.round(clamp(potDraw(pot,age),Math.round(ovrAt(p,g))+3,97));
  if(p.pot>=85)p.gem=true;
  if(u20)p.ev='International jeunes (U20/U18)';
  setPos2(p);
  return p;
}
function initYouth(c){
  if(c.lg==='n2'||isAmLg(c.lg)){c.youth=[];return} // pas de centre de formation agréé en Nationale 2 et plus bas
  c.youth=(REALY[c.id]||[]).map(realYouth);
  while(c.youth.length<12)c.youth.push(genYouthPlayer(c,R.i(16,19)));
}
function youthIntake(){
  const m=ME();
  for(const c of G.clubs){
    if(c.lg==='n2'||isAmLg(c.lg))continue;
    c.youth=c.youth||[];
    const n=R.i(4,7),news=[];
    for(let i=0;i<n;i++){const p=genYouthPlayer(c,R.i(16,17));c.youth.push(p);news.push(p)}
    if(c===m){
      const best=[...news].sort((a,b)=>b.pot-a.pot)[0];
      const gem=news.find(p=>p.gem);
      mail('Directeur du centre de formation',`Nouvelle génération : ${n} jeunes intègrent le centre`,`${n} jeunes de 16-17 ans rejoignent nos espoirs :<br>${news.map(p=>`${p.name} · ${posL(p)} · note ${Math.round(ovr(p))} · potentiel ≈ ${p.pot}`).join('<br>')}<br><br>${gem?`<b>Attention, ${gem.name} a un talent exceptionnel. Il faut le faire progresser avec soin.</b>`:`Le plus prometteur semble être ${best.name}.`}`,{act:{tab:'youth'}});
    }
  }
}
function youthDaily(c,mult=1){
  const a=acadOf(c),k=.7+a/40;
  for(const p of c.youth||[]){
    if(p.inj>0){p.inj=Math.max(0,p.inj-mult);continue}
    const o=ovr(p),gap=p.pot-o;if(gap<=0)continue;
    const base=p.age<=17?.007:p.age<=20?.005:.003,pro=.6+(p.pro||10)/20*.8;
    const da=base*gap*.75*k*pro*(R.f()*.6+.7)/7*mult*19/79;
    for(const key in W[p.g])p[key]=Math.min(20,p[key]+da);
  }
}
function promoteYouth(c,p){
  c.youth=c.youth.filter(x=>x.id!==p.id);
  p.youth=false;p.ctr=3;p.sal=Math.max(15,salaryFor(ovr(p),p.age,c.lg));p.st={mj:0,tit:0,es:0,pts:0};p.o0=Math.round(ovr(p));
  c.squad.push(p);
}
// Fin de saison : âge, sorties des espoirs de 21 ans, promotions des clubs IA
function youthSeasonEnd(c){
  const m=ME(),keep=[];
  for(const p of c.youth||[]){
    p.age++;
    if(p.age>=21){
      if(c===m){addNews(`${p.name} (espoir, 21 ans) quitte le centre de formation faute de contrat pro.`);if(ovr(p)>=48){p.youth=false;p.ctr=0;p.faT=0;p.sal=salaryFor(ovr(p),p.age,'pd2');G.fa.push(p)}continue}
      const pos=c.squad.filter(x=>x.g===p.g).sort((a,b)=>ovr(a)-ovr(b));
      if(ovr(p)>=(pos[0]?ovr(pos[0])-4:0)||p.pot>=c.str+5){promoteYouth(c,p);continue}
      if(ovr(p)>=48){p.youth=false;p.ctr=0;p.faT=0;p.sal=salaryFor(ovr(p),p.age,'pd2');G.fa.push(p)}
      continue;
    }
    // les clubs IA lancent tôt leurs meilleurs jeunes
    if(c!==m&&((p.age>=19&&ovr(p)>=c.str-8)||(p.gem&&p.age>=18&&ovr(p)>=c.str-15))){promoteYouth(c,p);continue}
    keep.push(p);
  }
  // 25 espoirs maximum : on garde les plus prometteurs
  c.youth=keep.sort((a,b)=>b.pot-a.pot).slice(0,25);
}

// ==== CHAMPIONNAT ESPOIRS ====
// Une poule par division (Top 14, Pro D2, Nationale), matchs aller-retour le dimanche, simulés d'après le niveau des
// 15 meilleurs espoirs de chaque club. Les espoirs qui jouent (15 titulaires + 3 remplaçants) progressent plus vite
// (en plus de l'entraînement) : statistiques p.yst = {mj, es}.
const ESPLG={t14:'Espoirs Top 14',pd2:'Espoirs Pro D2',nat:'Espoirs Nationale'};
const espTeam=c=>[...(c.youth||[])].filter(p=>p.inj===0).sort((a,b)=>ovr(b)-ovr(a)).slice(0,18);
// moins de 15 espoirs valides : l'équipe est complétée par des joueurs moins forts (niveau abaissé)
const espStr=c=>{const t=espTeam(c).slice(0,15);return t.length?t.reduce((s,p)=>s+ovr(p),0)/t.length*Math.pow(t.length/15,.3):35};
function startESP(){
  const E={poules:{},fixtures:[],table:{},week:0,dates:[],phase:'regular'};
  for(const lg in ESPLG){const ids=clubsIn(lg).filter(c=>(c.youth||[]).length>=10).map(c=>c.id);if(ids.length>=4)E.poules[lg]=ids}
  const per=Object.values(E.poules).map(ids=>{const x=shuffle([...ids]);if(x.length%2)x.push(null);return mkFixtures(x)});
  const n=Math.max(0,...per.map(f=>f.length));
  E.fixtures=[...Array(n)].map((_,r)=>per.flatMap(f=>(f[r]||[]).filter(([h,a])=>h&&a)));
  for(const ids of Object.values(E.poules))for(const id of ids)E.table[id]={id,j:0,g:0,n:0,p:0,pf:0,pa:0,bo:0,pts:0};
  let d=firstDow(`${seasonYear()}-09-06`,0);while(E.dates.length<n){if(!amOff(d))E.dates.push(d);d=dAdd(d,7)}
  if(!n)E.phase='done';
  for(const c of G.clubs)for(const p of c.youth||[])p.yst={mj:0,es:0};
  G.ESP=E;
}
function espDay(){
  const E=G.ESP;if(!E||E.phase!=='regular'||!E.dates[E.week]||E.dates[E.week]>G.date)return;
  const res=[];
  for(const[h,a]of E.fixtures[E.week]){
    const ch=C(h),ca=C(a);if(!ch||!ca)continue;
    const r=amSim({str:espStr(ch)},{str:espStr(ca)}),x=E.table[h],y=E.table[a];
    x.j++;y.j++;x.pf+=r.sh;x.pa+=r.sa;y.pf+=r.sa;y.pa+=r.sh;
    if(r.sh>r.sa){x.g++;y.p++;x.pts+=4}else if(r.sh<r.sa){y.g++;x.p++;y.pts+=4}else{x.n++;y.n++;x.pts+=2;y.pts+=2}
    x.bo+=r.bo[0];y.bo+=r.bo[1];x.pts+=r.bo[0];y.pts+=r.bo[1];
    [[ch,r.th],[ca,r.ta]].forEach(([c,tries])=>espPlayed(c,tries));
    res.push({h,a,sh:r.sh,sa:r.sa});
  }
  E.last=res;E.week++;if(E.week>=E.fixtures.length)E.phase='done';
  const m=ME(),mine=res.find(x=>x.h===m.id||x.a===m.id);
  if(mine)addNews(`Espoirs : ${C(mine.h).short} ${mine.sh}-${mine.sa} ${C(mine.a).short}.`);
}
// Les espoirs alignés : un match de plus, quelques essais, une progression supplémentaire, rarement une blessure
function espPlayed(c,tries){
  const team=espTeam(c),a=acadOf(c),k=.7+a/40;
  team.forEach((p,i)=>{
    p.yst=p.yst||{mj:0,es:0};p.yst.mj++;
    const o=ovr(p),gap=p.pot-o;
    if(gap>0){const da=(p.age<=17?.007:p.age<=20?.005:.003)*gap*.3*k*(.6+(p.pro||10)/20*.8)*(i<15?1:.5)*19/79;for(const key in W[p.g])p[key]=Math.min(20,p[key]+da)}
    if(R.f()<.012)p.inj=R.i(7,35);
  });
  const backs=team.slice(0,15).filter(p=>['AIL','CEN','ARR','DM','3L','OUV'].includes(p.g));
  for(let t=0;t<tries&&backs.length;t++)R.pick(backs).yst.es++;
}
const espSorted=lg=>{const E=G.ESP;return E&&E.poules[lg]?E.poules[lg].map(id=>E.table[id]).filter(Boolean).sort((x,y)=>y.pts-x.pts||(y.pf-y.pa)-(x.pf-x.pa)):[]};
