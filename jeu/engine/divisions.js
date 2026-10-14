'use strict';
// ==== RUGBY AMATEUR : Nationale, Nationale 2, Fédérale 1 / Nationale 3 ====
// Sources : pages Wikipédia des championnats 2026-27 (voir recherche/amateur/METHODE.md).
// - Nationale (14 clubs en 2026-27, 16 ensuite) et Nationale 2 (24 clubs en 2 poules, 48 en 4 poules à partir de 2027-28) :
//   clubs complets (effectifs générés, staff, finances), jouables.
// - Fédérale 1 (48 clubs) puis Nationale 3 (créée en 2027-28 avec les clubs non promus) : simulation légère (niveau du club seulement).
//   Un club qui monte en Nationale 2 reçoit un effectif complet.

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
  if(P===1)return{fixtures:mkFixtures(shuffle(ids)),poules:1};
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

// ---- Fédérale 1 / Nationale 3 : simulation légère ----
function initAM(){
  const clubs=[];
  F1POULES.forEach((pl,pi)=>pl.forEach((n,i)=>clubs.push({id:'f'+pi+'_'+i,name:n,short:amShort(n),str:Math.round(44+hashN(n)*6),poule:pi})));
  G.AM={clubs,name:'Fédérale 1'};
}
const amC=id=>(G.AM&&G.AM.clubs.find(c=>c.id===id))||C(id);
function startAM(){
  if(!G.AM)initAM();
  const A=G.AM,P=Math.max(1,Math.round(A.clubs.length/12));
  if(G.season>1){A.name='Nationale 3';shuffle(A.clubs).forEach((c,i)=>c.poule=i%P)}
  const per=[...Array(P)].map((_,i)=>{const ids=A.clubs.filter(c=>c.poule===i).map(c=>c.id);if(ids.length%2)ids.push(null);return mkFixtures(shuffle(ids))});
  const n=Math.max(...per.map(f=>f.length));
  A.fixtures=[...Array(n)].map((_,r)=>per.flatMap(f=>(f[r]||[]).filter(([h,a])=>h&&a)));
  A.table={};A.clubs.forEach(c=>A.table[c.id]={id:c.id,j:0,g:0,n:0,p:0,pf:0,pa:0,bo:0,pts:0});
  A.week=0;A.poules=P;A.phase='regular';
  const out=[];let d=firstDow(`${seasonYear()}-09-06`,0);
  while(out.length<n){const mo=+d.slice(5,7);if(!(mo===12&&+d.slice(8,10)>=20)&&!(mo===1&&+d.slice(8,10)<=3))out.push(d);d=dAdd(d,7)}
  A.dates=out;
}
// Score simulé à partir du niveau des deux clubs (avantage du terrain compris)
function amSim(h,a){
  const d=h.str-a.str+3,sh=Math.max(0,Math.round(R.n(22+d*.9,9))),sa=Math.max(0,Math.round(R.n(22-d*.9,9)));
  const th=Math.max(0,Math.round(sh/7+R.n(0,.6))),ta=Math.max(0,Math.round(sa/7+R.n(0,.6)));
  return{sh,sa,th,ta,bo:[(th-ta>=3?1:0)+(sh<sa&&sa-sh<=5?1:0),(ta-th>=3?1:0)+(sa<sh&&sh-sa<=5?1:0)]};
}
function amDay(){
  const A=G.AM;if(!A||A.phase!=='regular'||!A.dates[A.week]||A.dates[A.week]>G.date)return;
  for(const[h,a]of A.fixtures[A.week]){
    const r=amSim(amC(h),amC(a)),T=A.table,x=T[h],y=T[a];
    x.j++;y.j++;x.pf+=r.sh;x.pa+=r.sa;y.pf+=r.sa;y.pa+=r.sh;
    if(r.sh>r.sa){x.g++;y.p++;x.pts+=4}else if(r.sh<r.sa){y.g++;x.p++;y.pts+=4}else{x.n++;y.n++;x.pts+=2;y.pts+=2}
    x.bo+=r.bo[0];y.bo+=r.bo[1];x.pts+=r.bo[0];y.pts+=r.bo[1];
  }
  A.week++;if(A.week>=A.fixtures.length)A.phase='done';
}
const amSorted=(poule)=>Object.values(G.AM.table).filter(r=>poule==null||amC(r.id).poule===poule).sort((x,y)=>y.pts-x.pts||(y.pf-y.pa)-(x.pf-x.pa));

// ---- Montées et descentes entre Pro D2, Nationale, Nationale 2 et Nationale 3 ----
// natUp / pd2down sont déjà connus (Pro D2) ; on calcule le reste pour garder 16 clubs en Nationale et 48 en Nationale 2.
function amMoves(natUp,pd2down){
  const nat=G.L.nat,n2=G.L.n2,mv={natDown:[],n2Up:[],n2Down:[],n3Up:[]};
  if(!nat||!n2||!n2.po)return mv;
  mv.n2Up=[n2.po.champ,n2.po.fin].filter(Boolean);
  const natAfter=clubsIn('nat').length-natUp.length+pd2down.length+mv.n2Up.length;
  if(natAfter>NATSIZE)mv.natDown=sortedTable('nat').slice(-(natAfter-NATSIZE)).map(r=>r.id);
  if(clubsIn('n2').length>=N2SIZE)for(let i=0;i<n2.poules;i++){const t=sortedTable('n2',i);const last=t[t.length-1];if(last&&!mv.n2Up.includes(last.id))mv.n2Down.push(last.id)}
  const n2After=clubsIn('n2').length-mv.n2Up.length+mv.natDown.length-mv.n2Down.length,need=Math.max(0,N2SIZE-n2After);
  if(G.AM&&need){const P=G.AM.poules,ranks=[...Array(P)].map((_,i)=>amSorted(i));for(let k=0;mv.n3Up.length<need&&k<14;k++)for(const t of ranks)if(t[k]&&mv.n3Up.length<need)mv.n3Up.push(t[k].id)}
  return mv;
}
function applyAmMoves(mv){
  for(const id of mv.natDown||[]){const c=C(id);c.lg='n2';c.bud=Math.round(c.bud*.55)}
  for(const id of mv.n2Up||[]){const c=C(id);c.lg='nat';c.bud=Math.max(Math.round(c.bud*1.6),3000);if(!c.youth||!c.youth.length)initYouth(c)}
  for(const id of mv.n2Down||[]){
    const c=C(id);if(!c)continue;
    G.AM.clubs.push({id:c.id,name:c.name,short:c.short,str:Math.min(c.str,50),poule:0});
    c.squad.forEach(p=>{if(R.f()<.5){p.ctr=0;p.faT=0;G.fa.push(p)}});G.clubs=G.clubs.filter(x=>x.id!==id);
  }
  for(const id of mv.n3Up||[]){
    const a=G.AM.clubs.find(x=>x.id===id);if(!a)continue;
    const c=mkClub([a.id,a.name,a.short,a.str+3],'n2');c.youth=[];G.clubs.push(c);
    G.AM.clubs=G.AM.clubs.filter(x=>x.id!==id);
  }
}
// Parties créées avant l'étape F : création de la Nationale, de la Nationale 2 et de la Fédérale 1
function migrateAmateur(){
  if(G.L&&G.L.nat&&G.AM)return;
  for(const c of NATCLUBS)if(!C(c[0]))G.clubs.push(Object.assign(mkClub(c,'nat'),{}));
  for(const c of N2CLUBS)if(!C(c[0])){const k=mkClub(c,'n2');k.poule=c[4];k.youth=[];G.clubs.push(k)}
  for(const c of G.clubs)if(c.lg==='nat'&&!c.youth)initYouth(c);
  delete G.nat;
  if(!G.AM){initAM();if(G.phase==='season')startAM()}
  if(G.phase==='season')for(const lg of ['nat','n2'])if(!G.L[lg])G.L[lg]=buildLeague(lg);
}
// Championnat (structure commune Top 14, Pro D2, Nationale, Nationale 2)
function buildLeague(lg){
  const ids=clubsIn(lg).map(c=>c.id),table={};
  ids.forEach(id=>table[id]={id,j:0,g:0,n:0,p:0,pf:0,pa:0,bo:0,pts:0});
  const fx=mkPouleFixtures(lg,ids);
  return{lg,week:0,phase:'regular',fixtures:fx.fixtures,poules:fx.poules,results:[],table,po:null,...buildSchedule(lg,fx.fixtures.length)};
}
