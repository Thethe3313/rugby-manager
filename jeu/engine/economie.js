'use strict';
// ==== ÉCONOMIE ====
// Budgets 2026-27 en k€ (Midi Olympique via RugbyPass). Estimations pour UBB, Toulon, La Rochelle, Stade Français, Bayonne, Castres.
// cap = masse salariale autorisée 2026-27 en Top 14 (11 M€ de base + crédit "internationaux").
const CLUBINFO={tou:{bud:60300,cap:13800},ubb:{bud:43000,cap:12720},tln:{bud:41000,cap:12180},lar:{bud:42000,cap:12160},pau:{bud:33900,cap:12000},
  cle:{bud:38200,cap:11640},lou:{bud:44300,cap:11640},mon:{bud:33300,cap:11460},rac:{bud:26000,cap:11460},bay:{bud:32000,cap:11280},
  sfp:{bud:39000,cap:11280},cas:{bud:29000,cap:11100},per:{bud:23500,cap:11100},van:{bud:26900,cap:11100},
  pro:{bud:20000},bri:{bud:17000},gre:{bud:13000},bia:{bud:12500},nev:{bud:12400},oyo:{bud:12200},mtb:{bud:12000},age:{bud:11400},
  nic:{bud:10500},bez:{bud:10000},vro:{bud:9500},soy:{bud:9000},col:{bud:8000},nar:{bud:7000},dax:{bud:6500},aur:{bud:5500}};
const CAP_BASE=11000;
// Masse salariale maximale : salary cap en Top 14 ; en Pro D2 le cap légal est le même mais c'est le budget qui limite (25 % du budget)
function capOf(c){if(c.lg==='t14')return c.cap||CAP_BASE;if(c.lg==='nat'||c.lg==='n2')return Math.round((c.bud||2000)*.3);if(isAmLg(c.lg))return Math.round((c.bud||200)*.45);if(c.lg==='pd2')return Math.min(CAP_BASE,Math.round((c.bud||9000)*.25));return Math.round((c.bud||2500)*.2)}
// Salaire annuel brut (k€) d'un joueur de Top 14 selon sa note (calé sur Midi Olympique : moyenne ~260 k€, stars 480-600 k€+, espoirs < 60 k€)
const SALTAB=[[40,10],[45,15],[50,25],[55,40],[60,65],[65,110],[70,175],[75,250],[80,340],[85,450],[90,560],[95,720],[99,850]];
function interp(t,x){if(x<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(x<=t[i][0]){const[a,b]=t[i-1],[c,d]=t[i];return b+(d-b)*(x-a)/(c-a)}return t[t.length-1][1]}
const LGSAL={t14:1,pd2:.45,nat:.12,n2:.06,f1:.04,f2:.03,f3:.02,r1:.015,r2:.012,r3:.01,prem:.85,urc:.8,inv:.3,srp:.6,jpn:.9};
function salaryFor(o,age,lg){const ak=age<=20?.4:age<=21?.5:age<=22?.65:age<=23?.82:age>=34?.8:age>=32?.9:1;return Math.max(isAmLg(lg)?1:8,Math.round(interp(SALTAB,o)*(LGSAL[lg]||.3)*ak))} // amateurs : simples défraiements
// Valeur marchande (k€) : note, âge, marge de progression
function valueOf(p){
  const o=ovr(p),ak=p.age<=21?1.6:p.age<=23?1.35:p.age<=27?1.1:p.age<=30?.8:p.age<=32?.5:.25;
  const pk=p.age<=24?1+Math.max(0,(p.pot||o)-o)/25:1;
  return Math.max(10,Math.round(interp(SALTAB,o)*1.6*ak*pk/10)*10);
}
const STARTERS={PIL:2,TAL:1,'2L':2,'3L':3,DM:1,OUV:1,CEN:2,AIL:2,ARR:1};
function depthRank(p,club){return club.squad.filter(x=>x.g===p.g&&x.id!==p.id&&ovr(x)>ovr(p)).length}
// Indemnité demandée par le club vendeur
function askFee(p,club){
  if(!club||p.ctr<=0)return 0;
  const rk=[...club.squad].sort((a,b)=>ovr(b)-ovr(a)).indexOf(p);
  const imp=rk<5?1.6:rk<15?1.25:.9;
  const short=club.squad.filter(x=>x.g===p.g).length<=MINCOMP[p.g]?1.8:1;
  return Math.round(valueOf(p)*Math.min(p.ctr,3)/2*imp*short/10)*10;
}
// Salaire exigé par le joueur pour signer dans un club
function wageDemand(p,club,mode){
  const o=ovr(p);let d=salaryFor(o,p.age,club.lg);
  const wouldStart=club.squad.filter(x=>x.g===p.g&&x.id!==p.id&&ovr(x)>o).length<STARTERS[p.g];
  d*=wouldStart?.95:1.12;
  const cur=findPlayer(p.id).club;
  if(mode!=='renew'&&cur&&cur.lg==='t14'&&club.lg!=='t14')d*=1.2;
  // ambition : un ambitieux demande plus, surtout pour rejoindre un club plus faible que le sien
  const amb=p.amb||10;d*=.92+amb/20*.16;
  if(mode!=='renew'&&cur&&amb>=14&&clubStr(club)<clubStr(cur)-3)d*=1+(amb-13)*.03;
  d=Math.max(d,p.sal*(mode==='renew'?1:1.05));
  return Math.round(d/5)*5;
}
function findPlayer(id){
  for(const c of G.clubs.concat(G.ext||[])){const p=c.squad.find(x=>x.id===id)||(c.youth||[]).find(x=>x.id===id);if(p)return{p,club:c}}
  const p=(G.fa||[]).find(x=>x.id===id);return p?{p,club:null}:{p:null,club:null};
}
