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
