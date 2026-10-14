'use strict';
// ==== RUGBY AMATEUR : Nationale, Nationale 2, Fédérale 1 / Nationale 3, Fédérale 2, Fédérale 3, Régionales ====
// Sources : pages Wikipédia des championnats 2026-27 (voir recherche/amateur/METHODE.md).
// - Nationale (14 clubs en 2026-27, 16 ensuite) et Nationale 2 (24 clubs en 2 poules, 48 en 4 poules à partir de 2027-28) :
//   clubs complets (effectifs générés, staff, finances), jouables.
// - Fédérale 1 (48 clubs) puis Nationale 3 (créée en 2027-28 avec les clubs non promus), Fédérale 2, Fédérale 3 (vrais clubs,
//   data/amateur.js) et Régionales 1 à 3 (clubs fictifs) : simulation légère (niveau du club seulement).
//   Un club qui monte en Nationale 2 reçoit un effectif complet. Le joueur peut commencer sa carrière à ces niveaux.

// [id, nom, nom court, niveau]
const NATCLUBS=[['mdm','Stade montois','Mont-de-Marsan',61],['car','US Carcassonne','Carcassonne',60],['mas','RC Massy Essonne','Massy',58],
  ['bgj','CS Bourgoin-Jallieu','Bourgoin',58],['rou','Rouen Normandie Rugby','Rouen',58],['alb','SC Albi','Albi',57],['chy','SO Chambéry','Chambéry',57],
  ['pgx','CA Périgueux','Périgueux',57],['bou','US bressane','Bourg-en-Bresse',57],['sur','RC Suresnes','Suresnes',56],['ren','Rennes EC','Rennes',55],
  ['mar','Olympique marcquois','Marcq-en-Barœul',55],['orl','RC Orléans','Orléans',54],['vie','CS Vienne','Vienne',54]];
// [id, nom, nom court, niveau, poule 2026-27]
const N2CLUBS=[['mac','AS Mâcon','Mâcon',52,0],['flo','CM Floirac','Floirac',50,0],['ann','CS Annonay','Annonay',50,0],['rum','RC Savoie Rumilly','Rumilly',52,0],
  ['smd','Saint-Médard RC','Saint-Médard',50,0],['ser','Servette RC','Servette',51,0],['lan','Stade langonnais','Langon',52,0],['stm','Stade métropolitain','Stade métropolitain',51,0],
  ['nan','Stade nantais','Nantes',52,0],['drc','RC Drancy','Drancy',51,0],['mmd','US Marmande','Marmande',51,0],['sal','US Salles','Salles',50,0],
  ['avv','Avenir valencien','Valence d\'Agen',51,1],['pey','Peyrehorade SR','Peyrehorade',50,1],['aub','RC Aubenas Vals','Aubenas',50,1],['auc','RC Auch','Auch',52,1],
  ['nim','RC Nîmes','Nîmes',52,1],['tri','RC Tricastin','Tricastin',51,1],['mau','SA Mauléon','Mauléon',51,1],['sjl','Saint-Jean-de-Luz OR','Saint-Jean-de-Luz',52,1],
  ['sey','US seynoise','La Seyne',52,1],['fle','AS Fleurance','Fleurance',50,1],['gra','SC Graulhet','Graulhet',51,1],['tyr','US Tyrosse','Tyrosse',51,1]];
// Fédérale 1 2026-27 : 4 poules de 12 (nom du club)
const F1POULES=[
  ['Bièvre Saint-Geoirs RC','Beauvais RC','CS Nuiton','Paris UC','RC Auxerre','RC Courbevoie','SC Royannais','US Annecy','US Issoire','US Montmélian','US Tours','XV Corsaire Saint-Malo'],
  ['Avenir gruissanais','AS Monaco','AS Bédarrides Châteauneuf-du-Pape','CO Berre XV','Céret sportif','RC Châteaurenard','RCM Palavas','RO Agde','SC Mazamet','Sor Agout XV','SC Leucate','XV du Coudon'],
  ['Blagnac SCR','CA Sarlat','Cahors Rugby','Rugby Grenade','RO Castelnaudary XV','Saint-Girons SC','SC Tulle','TOEC TOAC FCT','USA Limoges','US L\'Isle-Jourdain','US Saint-Sulpice','UA Gaillac'],
  ['4 Cantons BHAP','AS Layrac','AS Pont-Long','AS Soustons','Anglet ORC','CA Lannemezan','FC Lourdes','FC Oloron','Stade bagnérais','UA Gujan-Mestras','US Nafarroa','Union Barbezieux Jonzac']];
// Budgets estimés (k€) : Nationale 3 à 6,5 M€, Nationale 2 1,3 à 2,5 M€
Object.assign(CLUBINFO,{mdm:{bud:6500},car:{bud:5500},mas:{bud:4500},bgj:{bud:4500},rou:{bud:5000},alb:{bud:4000},chy:{bud:4000},pgx:{bud:3800},
  bou:{bud:4200},sur:{bud:3500},ren:{bud:3200},mar:{bud:3500},orl:{bud:3000},vie:{bud:3000}});
for(const c of N2CLUBS)CLUBINFO[c[0]]={bud:1300+(c[3]-50)*350};
const LEVEL={t14:1,pd2:2,nat:3,n2:4};
const N2SIZE=48,NATSIZE=16; // tailles visées par la réforme de la FFR (2027-28)
// Nom court d'un club amateur : on retire le sigle (US, RC, AS…)
const amShort=n=>n.replace(/^(US|RC|AS|SC|CA|FC|CS|UA|RO|USA|CO|CM|SA|SR|RCM|OR|UBJ)\s+/,'').replace(/^Stade\s+/,'').replace(/\s+(RC|SC|SR|XV|ORC|Rugby|sportif)$/,'');

// ---- Poules (Nationale 2) ----
const nPoules=lg=>lg==='n2'?Math.max(1,Math.round(clubsIn('n2').length/12)):1;
// Répartit les clubs en poules de 12 (nouveau tirage chaque saison, sauf la première où l'on garde les vraies poules)
function drawPoules(lg){
  const cl=clubsIn(lg),P=nPoules(lg);
  if(G.season===1&&P===2&&cl.every(c=>c.poule!=null))return P;
  shuffle(cl).forEach((c,i)=>c.poule=i%P);
  return P;
}
// Calendrier : un tableau de matchs par journée (les poules jouent le même jour)
function mkPouleFixtures(lg,ids){
  const P=lg==='n2'?drawPoules(lg):1;
  // nombre impair de clubs : un club au repos à chaque journée
  if(P===1)return{fixtures:ids.length%2?mkFixtures(shuffle(ids.concat(null))).map(r=>r.filter(([h,a])=>h&&a)):mkFixtures(shuffle(ids)),poules:1};
  const per=[...Array(P)].map((_,i)=>mkFixtures(shuffle(ids.filter(id=>C(id).poule===i))));
  return{fixtures:per[0].map((_,r)=>per.flatMap(f=>f[r]||[])),poules:P};
}
// Nom des tours de phase finale
function poName(lg,stage){
  const L=G.L[lg];
  if(lg==='n2')return(L&&L.po&&L.po.type==='p4'?['8es de finale','Quarts de finale','Demi-finales','Finale']:['Barrages','Quarts de finale','Demi-finales','Finale'])[stage];
  return PONAME[stage];
}
// Phases finales de Nationale 2. 2 poules : 1er et 2e en quarts, 3e à 6e en barrages croisés ; 4 poules : les 4 premiers en 8es.
function setupN2Po(L){
  const P=L.poules,rk=[...Array(P)].map((_,i)=>sortedTable('n2',i).map(r=>r.id));
  if(P===2){
    const[A,B]=rk;
    L.po={type:'p2',stage:0,seeds:[A[0],B[0],A[1],B[1],A[2],B[2],A[3],B[3],A[4],B[4],A[5],B[5]],
      next:[{h:A[2],a:B[5]},{h:B[2],a:A[5]},{h:A[3],a:B[4]},{h:B[3],a:A[4]}],res:[],champ:null,fin:null};
  }else{
    const rows=k=>rk.map(r=>L.table[r[k]]).filter(Boolean).sort((x,y)=>y.pts-x.pts||(y.pf-y.pa)-(x.pf-x.pa)).map(r=>r.id);
    const seeds=[0,1,2,3].flatMap(rows).slice(0,16);
    L.po={type:'p4',stage:0,seeds,next:R16.map(([a,b])=>({h:seeds[a],a:seeds[b]})),res:[],champ:null,fin:null};
  }
  L.phase='playoffs';
}
function stepN2Po(L,out){
  const po=L.po,w=out.map(r=>r.winner),seed=id=>po.seeds.indexOf(id);
  const host=(a,b,neutral)=>seed(a)<=seed(b)?{h:a,a:b,neutral}:{h:b,a,neutral};
  if(po.type==='p2'&&po.stage===0){const s=po.seeds;po.next=[host(s[0],w[3]),host(s[3],w[0]),host(s[1],w[2]),host(s[2],w[1])];po.stage=1;return}
  if(w.length>1){const nx=[];for(let i=0;i<w.length;i+=2)nx.push(host(w[i],w[i+1],w.length===2));po.next=nx;po.stage++;return}
  po.champ=w[0];po.fin=out[0].h===w[0]?out[0].a:out[0].h;L.phase='done';po.next=[];
  addNews(`🏆 ${C(po.champ).name} remporte la Nationale 2.`);
}


// ---- Fédérale 1 (puis Nationale 3), Fédérale 2, Fédérale 3, Régionales 1 à 3 : simulation légère ----
// Chaque club n'a qu'un niveau (str), sauf ceux de la poule du joueur quand il entraîne à ce niveau : ils ont alors
// un vrai effectif, et cette poule devient un championnat complet (G.L[clé]) le temps d'une saison.
// size = nombre de clubs visé, ps = clubs par poule, str = niveau de départ, bud = budget type (k€), start = 1re journée
const AMLV={
  f1:{name:'Fédérale 1',size:24,ps:12,str:[44,50],bud:700,start:'09-06'},
  f2:{name:'Fédérale 2',size:80,ps:10,str:[40,45],bud:400,start:'09-13'},
  f3:{name:'Fédérale 3',size:160,ps:10,str:[36,41],bud:250,start:'09-13'},
  r1:{name:'Régionale 1',size:50,ps:10,str:[33,37],bud:150,start:'09-20'},
  r2:{name:'Régionale 2',size:70,ps:10,str:[30,34],bud:110,start:'09-20'},
  r3:{name:'Régionale 3',size:50,ps:10,str:[26,30],bud:80,start:'09-20'}};
const AMORDER=Object.keys(AMLV);
const isAmLg=lg=>!!AMLV[lg];
// la Fédérale 1 devient la Nationale 3 en 2027-28 (réforme de la FFR)
const amName=k=>k==='f1'&&typeof G!=='undefined'&&G&&G.season>1?'Nationale 3':AMLV[k].name;
Object.assign(LEVEL,{f1:5,f2:6,f3:7,r1:8,r2:9,r3:10});
for(const k of AMORDER)LEAGUES[k]={get name(){return amName(k)},rounds:18,am:true,prize:{champ:Math.round(AMLV[k].bud*.1),fin:Math.round(AMLV[k].bud*.05),qual:0}};
const amUp=k=>k==='f1'?'n2':AMORDER[AMORDER.indexOf(k)-1],amDown=k=>AMORDER[AMORDER.indexOf(k)+1]||null;
// Championnats joués cette saison avec de vrais matchs : Top 14 à Nationale 2, plus la poule du joueur s'il est plus bas
const lgs=()=>isAmLg(ME().lg)&&G.L&&G.L[ME().lg]?LGORDER.concat(ME().lg):LGORDER;
// Régionales : deux ligues seulement, Nouvelle-Aquitaine (na) et Provence-Alpes-Côte d'Azur (paca) ; un club ne change jamais de ligue
const REGNAME={na:'Nouvelle-Aquitaine',paca:"Provence-Alpes-Côte d'Azur"};
const pickReg=()=>R.f()<.8?'na':'paca'; // club venu de Fédérale 3 sans ligue connue (environ 80 % des clubs sont en Nouvelle-Aquitaine)
// Club « léger » : f = fictif, reg = ligue (Régionales)
function amRec(id,name,k,poule,fict,reg){const[a,b]=AMLV[k].str,r={id,name,short:amShort(name),str:Math.round(a+hashN(name)*(b-a)),poule};if(fict)r.f=1;if(reg)r.reg=reg;return r}
function initAMD(){
  G.AMD={reg2:1};
  const src={f1:[F1POULES,'f'],f2:[F2POULES,'g'],f3:[F3POULES,'h']};
  for(const k of AMORDER){
    const clubs=[];
    if(src[k])src[k][0].forEach((pl,pi)=>pl.forEach((n,i)=>clubs.push(amRec(src[k][1]+pi+'_'+i,n,k,pi))));
    else REGPOULES[k].forEach(([reg,pl],pi)=>pl.forEach((n,i)=>clubs.push(amRec(k+'_'+pi+'_'+i,n,k,pi,false,reg))));
    G.AMD[k]={clubs,poules:0,table:{},fixtures:[],dates:[],week:0,phase:'done'};
  }
}
// Club (complet ou léger) à partir de son id
function amC(id){const c=C(id);if(c)return c;if(G.AMD)for(const k of AMORDER){const a=G.AMD[k].clubs.find(x=>x.id===id);if(a)return a}return null}
const amOff=d=>{const mo=+d.slice(5,7),dd=+d.slice(8,10);return(mo===12&&dd>=20)||(mo===1&&dd<=3)}; // trêve de Noël
function startAMD(skip){
  if(!G.AMD)initAMD();
  if(!G.AMD.reg2)realRegionales();
  const m=ME();
  for(const k of AMORDER){
    if(skip&&skip.includes(k))continue;
    const A=G.AMD[k],mine=m.lg===k,all=A.clubs.concat(mine?[m]:[]);
    // Régionales : poules tirées dans chaque ligue (A.preg = ligue de chaque poule)
    if(k[0]==='r')for(const c of all)if(!c.reg)c.reg=pickReg();
    const groups=k[0]==='r'?['na','paca'].map(g=>all.filter(c=>c.reg===g)).filter(g=>g.length):[all];
    const sizes=groups.map(g=>Math.max(1,Math.round(g.length/AMLV[k].ps))),P=sizes.reduce((x,y)=>x+y,0);
    // nouvelles poules chaque saison (la première saison garde les vraies poules)
    A.preg=[];
    if(G.season>1||all.some(c=>c.poule==null||c.poule>=P)){let o=0;groups.forEach((g,gi)=>{shuffle(g).forEach((c,i)=>c.poule=o+i%sizes[gi]);o+=sizes[gi]})}
    for(let i=0;i<P;i++){const c=all.find(x=>x.poule===i);A.preg.push(c&&c.reg||null)}
    A.poules=P;
    if(mine){ // la poule du joueur : vrais effectifs, vrai championnat
      for(const a of A.clubs.filter(c=>c.poule===m.poule)){const c=mkClub([a.id,a.name,a.short,a.str],k);c.poule=a.poule;c.youth=[];c.amStr=a.str;if(a.f)c.fict=1;if(a.reg)c.reg=a.reg;G.clubs.push(c)}
      A.clubs=A.clubs.filter(c=>c.poule!==m.poule);
    }
    const per=[...Array(P)].map((_,i)=>{const ids=A.clubs.filter(c=>c.poule===i).map(c=>c.id);if(ids.length<2)return[];if(ids.length%2)ids.push(null);return mkFixtures(shuffle(ids))});
    const n=Math.max(0,...per.map(f=>f.length));
    A.fixtures=[...Array(n)].map((_,r)=>per.flatMap(f=>(f[r]||[]).filter(([h,a])=>h&&a)));
    A.table={};A.clubs.forEach(c=>A.table[c.id]={id:c.id,j:0,g:0,n:0,p:0,pf:0,pa:0,bo:0,pts:0});
    A.week=0;A.phase=n?'regular':'done';
    const out=[];let d=firstDow(`${seasonYear()}-${AMLV[k].start}`,0);
    while(out.length<n){if(!amOff(d))out.push(d);d=dAdd(d,7)}
    A.dates=out;
  }
}
// Score simulé à partir du niveau des deux clubs (avantage du terrain compris)
function amSim(h,a){
  const d=h.str-a.str+3,sh=Math.max(0,Math.round(R.n(22+d*.9,9))),sa=Math.max(0,Math.round(R.n(22-d*.9,9)));
  const th=Math.max(0,Math.round(sh/7+R.n(0,.6))),ta=Math.max(0,Math.round(sa/7+R.n(0,.6)));
  return{sh,sa,th,ta,bo:[(th-ta>=3?1:0)+(sh<sa&&sa-sh<=5?1:0),(ta-th>=3?1:0)+(sa<sh&&sh-sa<=5?1:0)]};
}
function amDay(){
  if(!G.AMD)return;
  for(const k of AMORDER){
    const A=G.AMD[k];if(A.phase!=='regular'||!A.dates[A.week]||A.dates[A.week]>G.date)continue;
    const by={};for(const c of A.clubs)by[c.id]=c;
    for(const[h,a]of A.fixtures[A.week]){
      const r=amSim(by[h],by[a]),x=A.table[h],y=A.table[a];
      x.j++;y.j++;x.pf+=r.sh;x.pa+=r.sa;y.pf+=r.sa;y.pa+=r.sh;
      if(r.sh>r.sa){x.g++;y.p++;x.pts+=4}else if(r.sh<r.sa){y.g++;x.p++;y.pts+=4}else{x.n++;y.n++;x.pts+=2;y.pts+=2}
      x.bo+=r.bo[0];y.bo+=r.bo[1];x.pts+=r.bo[0];y.pts+=r.bo[1];
    }
    A.week++;if(A.week>=A.fixtures.length)A.phase='done';
  }
}
const amSort=rows=>rows.sort((x,y)=>y.pts-x.pts||(y.pf-y.pa)-(x.pf-x.pa));
function amSorted(k,poule){const A=G.AMD[k],pl={};A.clubs.forEach(c=>pl[c.id]=c.poule);return amSort(Object.values(A.table).filter(r=>poule==null||pl[r.id]===poule))}
// Classement de chaque poule (lignes du tableau), y compris la poule du joueur jouée en vrai
function lvRanks(k){
  const A=G.AMD[k],m=ME();
  return[...Array(A.poules)].map((_,i)=>m.lg===k&&m.poule===i&&G.L[k]?sortedTable(k):amSorted(k,i));
}
// Les n meilleurs (les 1ers de poule, du meilleur au moins bon, puis les 2es…) et les n plus mal classés (derniers, puis avant-derniers…)
const ptsCmp=(x,y)=>y.pts/Math.max(1,y.j)-x.pts/Math.max(1,x.j)||(y.pf-y.pa)-(x.pf-x.pa);
function pickBest(ranks,n,excl,worst){
  const out=[];
  for(let r=0;out.length<n&&r<40;r++){
    const lvl=ranks.map(t=>worst?t[t.length-1-r]:t[r]).filter(x=>x&&!excl.includes(x.id)&&!out.includes(x.id)).sort(ptsCmp);
    if(worst)lvl.reverse();
    for(const x of lvl)if(out.length<n)out.push(x.id);
  }
  return out;
}
const pickWorst=(ranks,n,excl)=>pickBest(ranks,n,excl,true);

// ---- Montées et descentes de la Pro D2 à la Régionale 3 ----
// natUp / pd2down sont déjà connus (Pro D2). On garde 16 clubs en Nationale, 48 en Nationale 2, puis la taille visée de chaque niveau :
// entre deux niveaux, environ une montée et une descente par poule ; si un niveau manque de clubs, on en fait monter davantage.
function amMoves(natUp,pd2down){
  const nat=G.L.nat,n2=G.L.n2,mv={natDown:[],n2Up:[],n2Down:[],n3Up:[],lad:{}};
  if(!nat||!n2||!n2.po)return mv;
  mv.n2Up=[n2.po.champ,n2.po.fin].filter(Boolean);
  const natAfter=clubsIn('nat').length-natUp.length+pd2down.length+mv.n2Up.length;
  if(natAfter>NATSIZE)mv.natDown=sortedTable('nat').slice(-(natAfter-NATSIZE)).map(r=>r.id);
  if(clubsIn('n2').length>=N2SIZE)for(let i=0;i<n2.poules;i++){const t=sortedTable('n2',i);const last=t[t.length-1];if(last&&!mv.n2Up.includes(last.id))mv.n2Down.push(last.id)}
  const n2After=clubsIn('n2').length-mv.n2Up.length+mv.natDown.length-mv.n2Down.length,need=Math.max(0,N2SIZE-n2After);
  if(!G.AMD)return mv;
  let ranks=lvRanks('f1'),outUp=pickBest(ranks,need,[]),inDown=mv.n2Down;
  mv.n3Up=outUp;
  for(const k of AMORDER){
    if(!ranks||!G.AMD[k].poules)break;
    const T=AMLV[k].size,dn=amDown(k),base=ranks.flat().length-outUp.length+inDown.length,L={up:outUp,down:[],gen:0,cut:[]};
    let next=null;
    if(!dn){if(base<T)L.gen=T-base;else if(base>T)L.cut=pickWorst(ranks,base-T,outUp.concat(G.meId))}
    else{
      const sw=Math.min(2*G.AMD[k].poules,Math.round((G.AMD[k].poules+G.AMD[dn].poules)/2));
      // 2026-27 : pas de descente de Fédérale 1 (ses clubs non promus forment la Nationale 3)
      L.down=pickWorst(ranks,G.season===1&&k==='f1'?0:Math.max(0,base-T+sw),outUp);
      next=G.AMD[dn].poules?lvRanks(dn):null;
      outUp=!next?[]:pickBest(next,Math.max(0,T-base+L.down.length),[]);
    }
    mv.lad[k]=L;inDown=L.down;ranks=next;
  }
  return mv;
}
// Club complet qui change de division (budget adapté)
const amBud=lg=>AMLV[lg]?AMLV[lg].bud:lg==='n2'?1300:3000;
function moveFull(c,to){const up=LEVEL[to]<LEVEL[c.lg];c.lg=to;c.bud=up?Math.max(Math.round(c.bud*1.5),amBud(to)):Math.max(Math.round(c.bud*.65),Math.round(amBud(to)*.8));c.youth=c.youth||[]}
// Un club complet redevient « léger » (fin de saison) : il retrouve son niveau de départ (amStr)
function toLight(c,k){
  G.AMD[k].clubs.push({id:c.id,name:c.name,short:c.short,str:c.amStr||Math.min(c.str,50),poule:0,...(c.fict?{f:1}:{}),...(c.reg?{reg:c.reg}:{})});
  G.clubs=G.clubs.filter(x=>x.id!==c.id);
}
function takeLight(k,id){const A=G.AMD[k],a=A.clubs.find(x=>x.id===id);if(a)A.clubs=A.clubs.filter(x=>x!==a);return a}
// Nouveau club fictif en Régionale 3 (seulement si elle manque de clubs) : nom de réserve, sinon « Entente » de deux communes
function newRegClub(){
  const used=new Set(AMORDER.flatMap(k=>G.AMD[k].clubs.map(c=>c.name)).concat(G.clubs.map(c=>c.name)));
  const towns=REGFICT.map(n=>n.replace(/^(US|RC|AS|SC|Stade|Entente|Rugby Club|Avenir|Union|Rugby) /,''));
  let name=REGFICT.find(n=>!used.has(n));
  for(let i=0;!name&&i<50;i++){const x='Entente '+R.pick(towns)+'-'+R.pick(towns);if(!used.has(x))name=x}
  return amRec('x'+G.nid++,name||'Entente '+G.nid,'r3',0,true,pickReg());
}
function applyAmMoves(mv){
  const m=ME();
  for(const id of mv.natDown||[]){const c=C(id);c.lg='n2';c.bud=Math.round(c.bud*.55)}
  for(const id of mv.n2Up||[]){const c=C(id);c.lg='nat';c.bud=Math.max(Math.round(c.bud*1.6),3000);if(!c.youth||!c.youth.length)initYouth(c)}
  if(!G.AMD)return;
  for(const id of mv.n2Down||[]){
    const c=C(id);if(!c)continue;
    if(c===m){c.lg='f1';c.bud=Math.round(c.bud*.55);continue}
    c.squad.forEach(p=>{if(R.f()<.5){p.ctr=0;p.faT=0;G.fa.push(p)}});toLight(c,'f1');
  }
  for(const id of mv.n3Up||[]){
    const c=C(id);if(c){moveFull(c,'n2');continue}
    const a=takeLight('f1',id);if(!a)continue;
    const n=mkClub([a.id,a.name,a.short,a.str+3],'n2');n.youth=[];G.clubs.push(n);
  }
  for(const k of AMORDER){
    const L=(mv.lad||{})[k];if(!L)continue;
    // un club qui monte gagne un peu en niveau (budget, recrues), un club qui descend en perd
    const move=(id,to)=>{const c=C(id);if(c){moveFull(c,to);return}const a=takeLight(k,id);if(a){a.str=clamp(a.str+(LEVEL[to]<LEVEL[k]?2:-2),20,55);G.AMD[to].clubs.push(a)}};
    if(k!=='f1')for(const id of L.up)move(id,amUp(k));
    for(const id of L.down)move(id,amDown(k));
    for(const id of L.cut)takeLight(k,id);
    for(let i=0;i<L.gen;i++)G.AMD[k].clubs.push(newRegClub());
  }
  // les adversaires de la poule du joueur redeviennent des clubs légers
  for(const c of G.clubs.filter(c=>isAmLg(c.lg)&&c!==m))toLight(c,c.lg);
}
// Destination d'un club des divisions légères (montée ou descente), sinon null
function amDest(id,mv){
  for(const k of AMORDER){const L=(mv.lad||{})[k];if(!L)continue;if(L.up.includes(id))return amUp(k);if(L.down.includes(id))return amDown(k)}
  return null;
}
// Parties créées avant l'étape F : création de la Nationale, de la Nationale 2 et de la Fédérale 1.
// Parties créées avant l'étape F2 : l'ancienne Fédérale 1 / Nationale 3 (G.AM) devient G.AMD.f1, on ajoute les autres niveaux.
function migrateAmateur(){
  if(!(G.L&&G.L.nat)){
    for(const c of NATCLUBS)if(!C(c[0]))G.clubs.push(mkClub(c,'nat'));
    for(const c of N2CLUBS)if(!C(c[0])){const k=mkClub(c,'n2');k.poule=c[4];k.youth=[];G.clubs.push(k)}
    for(const c of G.clubs)if(c.lg==='nat'&&!c.youth)initYouth(c);
    delete G.nat;
    if(G.phase==='season')for(const lg of ['nat','n2'])if(!G.L[lg])G.L[lg]=buildLeague(lg);
  }
  if(!G.AMD){
    const old=G.AM;initAMD();
    if(old){G.AMD.f1=Object.assign(G.AMD.f1,{clubs:old.clubs,poules:old.poules||0,table:old.table||{},fixtures:old.fixtures||[],dates:old.dates||[],week:old.week||0,phase:old.phase||'done'})}
    delete G.AM;
    // les autres niveaux démarrent tout de suite (calendrier de la saison en cours, journées passées ignorées)
    if(G.phase==='season'){
      startAMD(old?['f1']:null);
      for(const k of AMORDER)if(k!=='f1'||!old){const A=G.AMD[k];while(A.week<A.dates.length&&A.dates[A.week]<=G.date)A.week++;if(A.week>=A.fixtures.length)A.phase='done'}
    }
  }
  // le joueur entraîne en Régionale : on attend la saison suivante (startAMD) pour ne pas changer sa poule en cours
  if(!G.AMD.reg2&&!(ME().lg[0]==='r'&&isAmLg(ME().lg))){
    realRegionales();
    if(G.phase==='season'){startAMD(['f1','f2','f3']);for(const k of ['r1','r2','r3']){const A=G.AMD[k];while(A.week<A.dates.length&&A.dates[A.week]<=G.date)A.week++;if(A.week>=A.fixtures.length)A.phase='done'}}
  }
}
// Parties créées avec les Régionales fictives (étape F2) : vrais clubs de Nouvelle-Aquitaine et de PACA à la place
function realRegionales(){
  const keep=G.AMD;initAMD();const fresh=G.AMD;G.AMD=keep;
  for(const k of ['r1','r2','r3'])G.AMD[k]=fresh[k];
  G.AMD.reg2=1;
}
// Championnat (structure commune Top 14, Pro D2, Nationale, Nationale 2, et poule du joueur plus bas)
function buildLeague(lg){
  const ids=clubsIn(lg).map(c=>c.id),table={};
  ids.forEach(id=>table[id]={id,j:0,g:0,n:0,p:0,pf:0,pa:0,bo:0,pts:0});
  const fx=mkPouleFixtures(lg,ids);
  return{lg,week:0,phase:'regular',fixtures:fx.fixtures,poules:fx.poules,results:[],table,po:null,...buildSchedule(lg,fx.fixtures.length)};
}
