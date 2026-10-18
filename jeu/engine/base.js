'use strict';
// Moteur : bases (hasard, postes, attributs, styles, clubs, championnats, composition)
// ==== ENGINE ====
const R={
  f:()=>Math.random(),
  i:(a,b)=>Math.floor(Math.random()*(b-a+1))+a,
  pick:a=>a[Math.floor(Math.random()*a.length)],
  n:(m,s)=>{let u=0;while(!u)u=Math.random();const v=Math.random();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=R.i(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};

const GROUPS={PIL:'Pilier',TAL:'Talonneur','2L':'2e ligne','3L':'3e ligne',DM:'Demi de mêlée',OUV:'Ouvreur',CEN:'Centre',AIL:'Ailier',ARR:'Arrière'};
const GORDER=['PIL','TAL','2L','3L','DM','OUV','CEN','AIL','ARR'];
// [numéro, poste, libellé, postes acceptés sans pénalité]
const SLOTS=[
  [1,'PIL','Pilier gauche',['PIL'],'LH'],[2,'TAL','Talonneur',['TAL']],[3,'PIL','Pilier droit',['PIL'],'TH'],
  [4,'2L','Deuxième ligne',['2L']],[5,'2L','Deuxième ligne',['2L']],
  [6,'3L','Flanker',['3L']],[7,'3L','Flanker',['3L']],[8,'3L','Numéro 8',['3L']],
  [9,'DM','Demi de mêlée',['DM']],[10,'OUV','Demi d\'ouverture',['OUV']],
  [11,'AIL','Ailier gauche',['AIL']],[12,'CEN','Premier centre',['CEN']],[13,'CEN','Deuxième centre',['CEN']],
  [14,'AIL','Ailier droit',['AIL']],[15,'ARR','Arrière',['ARR']],
  [16,'TAL','Banc : talonneur',['TAL']],[17,'PIL','Banc : pilier gauche',['PIL'],'LH'],[18,'PIL','Banc : pilier droit',['PIL'],'TH'],
  [19,'2L','Banc : 2e ligne',['2L']],[20,'3L','Banc : 3e ligne',['3L']],[21,'DM','Banc : demi de mêlée',['DM']],
  [22,'OUV','Banc : ouvreur/centre',['OUV','CEN']],[23,'ARR','Banc : trois-quarts',['AIL','ARR','CEN']]
];
const NEIGH={PIL:['TAL'],TAL:['PIL'],'2L':['3L'],'3L':['2L'],DM:['OUV'],OUV:['DM','CEN'],CEN:['OUV','AIL'],AIL:['ARR','CEN'],ARR:['AIL','OUV']};
// ==== ATTRIBUTES (FM-style, rated 1-20) ====
// The overall rating /99 is computed from the attributes, weighted by position.
const ATTRS=[
  ['tac','Plaquage','T'],['mai','Prise de balle','T'],['pas','Passe','T'],['evi','Évitement','T'],['pie','Jeu au pied','T'],['but','Buteur','T'],['mel','Mêlée','T'],['tou','Touche','T'],['rck','Jeu au sol','T'],
  ['pla','Placement','M'],['dec','Décisions','M'],['sfr','Sang-froid','M'],['lea','Leadership','M'],['eng','Engagement','M'],
  ['vit','Vitesse','P'],['pui','Puissance','P'],['end','Endurance','P']
];
const AGRP={T:'Technique',M:'Mental',P:'Physique'};
const W={
  PIL:{mel:.30,pui:.16,tac:.10,rck:.08,end:.08,eng:.07,pla:.05,mai:.04,tou:.04,dec:.03,sfr:.02,vit:.01,pas:.01,evi:.01},
  TAL:{tou:.22,mel:.16,pui:.12,tac:.10,rck:.10,end:.07,mai:.06,eng:.06,pla:.04,dec:.03,sfr:.02,vit:.02},
  '2L':{tou:.22,pui:.16,tac:.12,mel:.10,end:.10,eng:.08,rck:.06,mai:.05,pla:.05,dec:.03,sfr:.02,vit:.01},
  '3L':{tac:.17,rck:.14,end:.13,pui:.12,eng:.08,mai:.08,pla:.07,vit:.07,tou:.05,dec:.04,pas:.03,evi:.02},
  DM:{pas:.24,dec:.14,pie:.12,vit:.10,sfr:.08,pla:.08,mai:.07,evi:.05,tac:.05,end:.04,lea:.03},
  OUV:{dec:.18,pie:.17,pas:.17,sfr:.10,but:.08,pla:.08,mai:.07,evi:.06,vit:.04,tac:.03,lea:.02},
  CEN:{tac:.13,pui:.12,mai:.12,pas:.11,evi:.11,vit:.11,pla:.10,dec:.08,end:.05,rck:.04,sfr:.03},
  AIL:{vit:.28,evi:.18,mai:.12,pla:.10,pui:.08,tac:.07,dec:.05,pie:.04,end:.04,sfr:.04},
  ARR:{pie:.16,mai:.14,pla:.14,vit:.13,evi:.10,dec:.09,tac:.07,pas:.06,sfr:.06,but:.03,end:.02}
};
// Typical profile per position (offset in points out of 20 relative to the player's level)
const PROF={
  PIL:{mel:2,pui:2,tac:0,rck:0,end:-1,eng:1,pla:-1,mai:-2,tou:-2,dec:-2,sfr:-1,vit:-5,pas:-4,evi:-4,pie:-7,but:-8,lea:-1},
  TAL:{tou:2,mel:1,pui:1,tac:0,rck:1,end:0,mai:-1,eng:1,pla:-1,dec:-1,sfr:-1,vit:-3,pas:-3,evi:-3,pie:-6,but:-8,lea:0},
  '2L':{tou:2,pui:1,tac:0,mel:0,end:0,eng:1,rck:-1,mai:-1,pla:-1,dec:-1,sfr:-1,vit:-4,pas:-4,evi:-4,pie:-7,but:-8,lea:0},
  '3L':{tac:1,rck:1,end:1,pui:1,eng:1,mai:0,pla:0,vit:-1,tou:-1,dec:-1,pas:-2,evi:-2,mel:-2,pie:-6,but:-8,sfr:-1,lea:0},
  DM:{pas:2,dec:1,pie:0,vit:0,sfr:0,pla:0,mai:0,evi:0,tac:-2,end:0,lea:0,pui:-4,mel:-8,tou:-8,rck:-3,but:-4,eng:-1},
  OUV:{dec:1,pie:2,pas:1,but:1,sfr:1,pla:0,mai:0,evi:0,vit:-1,tac:-2,lea:0,pui:-4,mel:-8,tou:-8,rck:-4,end:-2,eng:-2},
  CEN:{tac:1,pui:1,mai:0,pas:0,evi:0,vit:0,pla:0,dec:-1,end:0,rck:-1,sfr:-1,pie:-3,but:-6,mel:-8,tou:-8,eng:0,lea:-1},
  AIL:{vit:3,evi:1,mai:0,pla:0,pui:-1,tac:-2,dec:-2,pie:-3,end:-1,sfr:-1,pas:-2,rck:-4,mel:-9,tou:-9,but:-6,eng:-1,lea:-2},
  ARR:{pie:1,mai:1,pla:1,vit:1,evi:0,dec:0,tac:-1,pas:0,sfr:0,but:-2,end:-1,pui:-3,rck:-4,mel:-9,tou:-9,eng:-2,lea:-1}
};
// Conversion between the 1-20 attribute scale and the /99 overall rating
const to20=o=>(o-20)*19/79+1, to99=a=>20+(a-1)*79/19;
const COMP={PIL:7,TAL:4,'2L':5,'3L':7,DM:3,OUV:3,CEN:4,AIL:5,ARR:2};
const MINCOMP={PIL:4,TAL:2,'2L':4,'3L':4,DM:2,OUV:2,CEN:3,AIL:3,ARR:1};
const STY={
  equilibre:{n:'Équilibré',wp:.5,wb:.5,wk:0,try:1,pen:1,drop:1},
  conquete:{n:'Jeu de conquête (avants)',wp:.65,wb:.35,wk:0,try:.85,pen:1.3,drop:1},
  mouvement:{n:'Jeu de mouvement (trois-quarts)',wp:.35,wb:.65,wk:0,try:1.2,pen:.9,drop:1},
  pied:{n:'Jeu au pied / territoire',wp:.4,wb:.4,wk:.2,try:.95,pen:1.1,drop:2.5}
};
const INTS={basse:'Basse (économise les joueurs)',normale:'Normale',haute:'Haute (+performance, +fatigue/blessures)'};
const FOCUS={equilibre:'Équilibré',physique:'Physique (vitesse, puissance, endurance)',technique:'Technique (plaquage, passe, prise de balle, évitement)',conquete:'Conquête (mêlée, touche, jeu au sol)',pied:'Jeu au pied et buteur',mental:'Mental (placement, décisions, sang-froid)'};
const FOCUSK={equilibre:ATTRS.map(a=>a[0]),physique:['vit','pui','end'],technique:['tac','pas','mai','evi'],conquete:['mel','tou','rck'],pied:['pie','but'],mental:['pla','dec','sfr']};
const FIRST=['Antoine','Romain','Thomas','Julien','Baptiste','Maxime','Louis','Hugo','Paul','Mathieu','Clément','Nicolas','Pierre','Théo','Jules','Rémi','Florian','Damien','Kévin','Yoann','Cyril','Anthony','Lucas','Dylan','Étienne','Gaëtan','Sébastien','Alexis','Valentin','Guillaume','Jonathan','Arthur','Bastien','Mickaël','Tom','Enzo','Jason','Loïc','Dorian','Axel'];
const LAST=['Martin','Bernard','Dubois','Moreau','Laurent','Lefebvre','Garcia','Roux','Fournier','Mercier','Blanc','Guérin','Faure','Rousseau','Vidal','Lambert','Fontaine','Chevalier','Masson','Brun','Barbier','Arnaud','Giraud','Perrin','Carré','Navarro','Lacroix','Castex','Darricau','Etcheverry','Larrieu','Sallaberry','Pouchan','Lassalle','Camou','Dufau','Bordenave','Castagnet','Duhau','Lahitte'];
const FFIRST=['Tevita','Josaia','Sione','Mateo','Ruan','Pieter','Liam','Callum','Giorgi','Levan','Hemi','Tane','Siosaia','Kobus','Aisea','Jack'];
const FLAST=['Waqa','Mafi','Fonua','Havili','Van der Berg','Botha','Smit','Kriel','Kapanadze','Beridze','Walker','Hughes','McAllister','Ngata','Parata','Wiremu','Tuku','Naqelevuki'];
// id, nom, nom court, force, (la composition du Top 14 est modifiable ici)
const CLUBS0=[
  ['tou','Stade Toulousain','Toulouse',82],['ubb','Union Bordeaux-Bègles','Bordeaux-Bègles',77],
  ['mon','Montpellier Hérault Rugby','Montpellier',76],['sfp','Stade Français Paris','Stade Français',76],
  ['lar','Stade Rochelais','La Rochelle',76],['rac','Racing 92','Racing 92',75],
  ['pau','Section Paloise','Pau',74],['cle','ASM Clermont Auvergne','Clermont',73],
  ['tln','RC Toulon','Toulon',72],['cas','Castres Olympique','Castres',70],
  ['lou','LOU Rugby','Lyon',70],['bay','Aviron Bayonnais','Bayonne',69],
  ['per','USA Perpignan','Perpignan',66],['van','RC Vannes','Vannes',64]
];
// ==== CHAMPIONNATS ====
// cap = plafond salarial (k€) · mean = niveau moyen visé par les clubs IA · sp* = sponsor · att* = affluence · price = prix moyen du billet (€)
const LEAGUES={
  t14:{name:'Top 14',rounds:26,cap:11000,mean:72,spB:3000,spK:350,spRef:58,attB:7000,attK:140,price:29,opex:1800,prize:{champ:2000,fin:1000,qual:300}},
  pd2:{name:'Pro D2',rounds:30,cap:5500,mean:64,spB:2600,spK:160,spRef:55,attB:2500,attK:55,price:18,opex:900,prize:{champ:800,fin:400,qual:120}},
  nat:{name:'Nationale',rounds:26,prize:{champ:300,fin:150,qual:50}},
  n2:{name:'Nationale 2',rounds:22,prize:{champ:150,fin:100,qual:30}}
};
const LGORDER=['t14','pd2','nat','n2'];
const PD2CLUBS=[
  ['pro','Provence Rugby','Provence',68],['oyo','Oyonnax Rugby','Oyonnax',68],['bri','CA Brive','Brive',68],
  ['col','US Colomiers','Colomiers',67],['bia','Biarritz Olympique','Biarritz',66],['mtb','US Montauban','Montauban',66],
  ['age','SU Agen','Agen',65],['vro','Valence Romans Drôme Rugby','Valence Romans',65],['soy','Soyaux Angoulême XV','Soyaux-Angoulême',64],
  ['gre','FC Grenoble','Grenoble',64],['nev','USON Nevers','Nevers',63],['aur','Stade Aurillacois','Aurillac',63],
  ['bez','AS Béziers Hérault','Béziers',63],['dax','US Dax','Dax',62],['nic','Nissa Rugby','Nice',62],['nar','RC Narbonne','Narbonne',61]
];
// Clubs de Nationale (3e division, effectifs fictifs) qui peuvent monter en Pro D2
const NAT0=[['car','US Carcassonne','Carcassonne',59],['mdm','Stade Montois','Mont-de-Marsan',59],['mas','RC Massy Essonne','Massy',58],['bgj','CS Bourgoin-Jallieu','Bourgoin',58],['chy','SO Chambéry','Chambéry',57],['pgx','CA Périgueux','Périgueux',57],['rou','Rouen Normandie Rugby','Rouen',57],['alb','SC Albi','Albi',56],['tar','Stado Tarbes','Tarbes',56],['bla','Blagnac Rugby','Blagnac',55],['hye','Hyères Carqueiranne','Hyères',55],['sur','RC Suresnes','Suresnes',55]];
const PONAME=['Barrages','Demi-finales','Finale'];

let G=null;
const C=id=>G.clubs.find(c=>c.id===id)||(G.ext||[]).find(c=>c.id===id); // clubs français, puis clubs étrangers (coupes d'Europe)
const ME=()=>C(G.meId);
const LS=lg=>G.L[lg];

function ovrAt(p,g){const w=W[g];let s=0;for(const k in w)s+=p[k]*w[k];return to99(s)}
const ovr=p=>ovrAt(p,p.g);
function genName(){return R.f()<.14?R.pick(FFIRST)+' '+R.pick(FLAST):R.pick(FIRST)+' '+R.pick(LAST)}
const TAGMOD={k:{but:5,pie:2},v:{vit:3,evi:1},p:{pui:3},m:{pas:2,dec:2},w:{end:3,eng:1},l:{tou:3},s:{mel:3},f:{evi:2,vit:1},d:{tac:3,pla:1},h:{mai:2,pas:1}};
function hashN(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967296}
const mass=cl=>cl.squad.reduce((s,p)=>s+p.sal,0);

// Postes secondaires (p.pos2) : connus pour les vrais joueurs de POS2 (data/postes.js) — leurs attributs sont alors
// ajustés pour qu'ils y valent au moins leur note moins 3 ; sinon estimés (p.p2e) : combinaison fréquente [poste, probabilité]
// ET profil qui convient (note au second poste à 2 points au plus de la note au poste). À son second poste, un joueur ne perd que 3 %.
const P2RULES={PIL:[],TAL:[],'2L':[['3L',.25]],'3L':[['2L',.15]],DM:[['OUV',.06],['AIL',.04]],OUV:[['CEN',.15],['ARR',.15],['DM',.05]],CEN:[['AIL',.25],['OUV',.06]],AIL:[['ARR',.35],['CEN',.12]],ARR:[['AIL',.5],['OUV',.08]]};
function estPos2(p,h){const o=ovrAt(p,p.g);return P2RULES[p.g].filter(([g,pr],i)=>((h*(i+3)*7.13)%1)<Math.min(1,pr*2)&&o-ovrAt(p,g)<=2).map(([g])=>g)}
// Monte les attributs plus utiles au second poste qu'au poste naturel, jusqu'à y valoir la note moins 3
function fitPos2(p,g2){const o=ovrAt(p,p.g);for(let n=0;n<80&&ovrAt(p,g2)<o-3;n++){let bk=null,bv=-9;for(const[k]of ATTRS){if(p[k]>=20)continue;const v=(W[g2][k]||0)-(W[p.g][k]||0);if(v>bv){bv=v;bk=k}}if(!bk||bv<=0)break;p[bk]=Math.min(20,p[bk]+.25)}
  // la note au poste naturel ne doit pas bouger : on redescend les attributs qui comptent surtout pour lui
  for(let n=0;n<80&&ovrAt(p,p.g)>o+.2;n++){let bk=null,bv=-9;for(const[k]of ATTRS){if(p[k]<=1.25)continue;const v=(W[p.g][k]||0)-(W[g2][k]||0);if(v>bv){bv=v;bk=k}}if(!bk)break;p[bk]-=.25;if(ovrAt(p,g2)<o-3.5){p[bk]+=.25;break}}}
function setPos2(p,h){
  const k=typeof POS2!=='undefined'&&POS2[p.name];
  if(k){p.pos2=k.filter(g=>g!==p.g);delete p.p2e;for(const g2 of p.pos2)fitPos2(p,g2)}else{p.pos2=estPos2(p,h!=null?h:hashN(p.name+'p2'));if(p.pos2.length)p.p2e=1;else delete p.p2e}
}
const atPos2=(p,slot)=>!!(p.pos2&&p.pos2.some(g=>slot[3].includes(g)));
function posFit(p,slot){
  if(slot[3].includes(p.g))return slot[4]&&p.sub&&p.sub!==slot[4]?.94:1;
  return atPos2(p,slot)?.97:NEIGH[slot[1]].includes(p.g)?.9:.72;
}
function effAt(p,slot){
  const ok=slot[3].includes(p.g),fit=posFit(p,slot);
  return ovrAt(p,ok?p.g:slot[1])*fit*(.78+.22*p.forme/100); // même effet de la forme qu'en match (engine/match.js)
}
// Composition : on place d'abord chaque joueur à son poste naturel (titulaires puis banc),
// et on ne met quelqu'un hors de son poste que s'il n'y a plus personne de disponible à ce poste.
function fillSlots(club,out,used){
  const avail=club.squad.filter(p=>p.inj===0&&!used.has(p.id));
  for(const natural of [true,false]){
    for(let i=0;i<23;i++){
      if(out[i])continue;
      let best=null,bv=-1;
      for(const p of avail){
        if(used.has(p.id))continue;
        if(natural&&!SLOTS[i][3].includes(p.g)&&!atPos2(p,SLOTS[i]))continue; // postes naturels et seconds postes d'abord
        const v=effAt(p,SLOTS[i]);if(v>bv){bv=v;best=p}
      }
      if(best){out[i]=best.id;used.add(best.id)}
    }
  }
  return out;
}
function autoLineup(club){return fillSlots(club,Array(23).fill(null),new Set())}
function fixLineup(club){
  const byId=id=>club.squad.find(p=>p.id===id);
  const used=new Set();
  const out=club.lineup.map(id=>{const p=byId(id);if(p&&p.inj===0&&!used.has(id)){used.add(id);return id}return null});
  club.lineup=fillSlots(club,out,used);
}
function teamCalc(club){
  const L=club.lineup.map((id,i)=>{const p=club.squad.find(x=>x.id===id);return{p,i,v:p?effAt(p,SLOTS[i]):40}});
  const avg=(a,b)=>{let s=0;for(let i=a;i<=b;i++)s+=L[i].v;return s/(b-a+1)};
  const ks=[8,9,14].map(i=>L[i]).filter(x=>x.p);
  let kp=ks.length?ks.reduce((a,b)=>b.p.but>a.p.but?b:a).p:null;
  let men=0,n=0;for(let i=0;i<15;i++)if(L[i].p){men+=to99((L[i].p.sfr+L[i].p.dec)/2);n++}
  return{L,pack:avg(0,7),backs:avg(8,14),bench:avg(15,22),kick:kp?to99((kp.but*2+kp.pie)/3):50,kickerP:kp,men:n?men/n:50};
}
const clubStr=cl=>{const t=teamCalc(cl);return(t.pack*8+t.backs*7)/15};

function mkFixtures(ids){
  const n=ids.length,arr=[...ids],rounds=[];
  for(let r=0;r<n-1;r++){
    const m=[];
    for(let i=0;i<n/2;i++){let a=arr[i],b=arr[n-1-i];if((r+i)%2)[a,b]=[b,a];m.push([a,b])}
    rounds.push(m);arr.splice(1,0,arr.pop());
  }
  return rounds.concat(rounds.map(m=>m.map(([a,b])=>[b,a])));
}
const zeroFin=()=>({ticket:0,sponsor:0,wages:0,staff:0,opex:0,transfers:0,prize:0});
function addNews(t){G.news.unshift(t);if(G.news.length>40)G.news.length=40}
const seasonLabel=()=>`${2026+G.season-1}-${2027+G.season-1}`;
const clubsIn=lg=>G.clubs.filter(c=>c.lg===lg);
