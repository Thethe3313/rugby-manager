'use strict';
// ==== CALENDRIER (jour par jour) ====
const DAY=86400000;
const dAdd=(iso,n)=>new Date(Date.parse(iso+'T12:00:00Z')+n*DAY).toISOString().slice(0,10);
const dDow=iso=>new Date(iso+'T12:00:00Z').getUTCDay();
const dDiff=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/DAY);
const MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'],JOURS=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
function fmtD(iso,year){const d=new Date(iso+'T12:00:00Z');return JOURS[d.getUTCDay()]+' '+d.getUTCDate()+' '+MOIS[d.getUTCMonth()]+(year?' '+d.getUTCFullYear():'')}
function firstDow(iso,dow){let d=iso;while(dDow(d)!==dow)d=dAdd(d,1);return d}
const seasonYear=()=>2025+G.season;
// Week-ends sans match : semaines de coupes d'Europe, trêves (mois -> rang du week-end dans le mois)
const OFF={t14:{10:[3],11:[2],12:[2,3],1:[2,3],4:[1,2,3],5:[1]},pd2:{11:[2],12:[4],1:[1],2:[3],3:[2],4:[2]},
  nat:{10:[4],11:[2],12:[4],1:[1],2:[3],3:[2]},n2:{10:[4],11:[2],12:[3,4],1:[1],2:[2,3],3:[2]}};
function buildSchedule(lg,n){
  n=n||LEAGUES[lg].rounds;
  const y=seasonYear(),out=[];
  // Top 14 le samedi, Pro D2 le vendredi, Nationale et Nationale 2 le dimanche
  let d=lg==='t14'?firstDow(`${y}-09-01`,6):lg==='pd2'?firstDow(`${y}-08-21`,5):lg==='nat'?firstDow(`${y}-08-21`,0):isAmLg(lg)?firstDow(`${y}-${AMLV[lg].start}`,0):firstDow(`${y}-09-04`,0);
  while(out.length<n){
    const dt=new Date(d+'T12:00:00Z'),mo=dt.getUTCMonth()+1,wk=Math.ceil(dt.getUTCDate()/7);
    if(!(OFF[lg]?(OFF[lg][mo]||[]).includes(wk):amOff(d)))out.push(d);
    d=dAdd(d,7);
  }
  const last=out[out.length-1];
  const po=lg==='t14'?[dAdd(last,7),dAdd(last,14),dAdd(last,28)]:lg==='n2'?[dAdd(last,14),dAdd(last,21),dAdd(last,28),dAdd(last,42)]:lg==='nat'?[dAdd(last,14),dAdd(last,21),dAdd(last,35)]:[dAdd(last,7),dAdd(last,14),dAdd(last,21)];
  return{dates:out,poDates:po};
}
// Prochain match du joueur : {f (h, a, neutral), d (date), w (journée), ko (élimination directe), lab (compétition et tour)}
// Championnat ou coupe d'Europe : le plus proche des deux.
function myNextMatch(){
  const m=ME();
  if(G.phase==='access'){const f=(G.access||[]).find(f=>involves(f,m.id));return f?{f,d:G.accessDate,ko:true,lab:'Barrage d\'accession'}:null}
  if(G.phase!=='season')return null;
  const L=G.L[m.lg];let lg=null;
  if(L.phase==='regular'){for(let w=L.week;w<L.fixtures.length;w++){const x=L.fixtures[w].find(x=>x[0]===m.id||x[1]===m.id);if(x){lg={f:{h:x[0],a:x[1]},d:L.dates[w],w,ko:false,lab:`${LEAGUES[m.lg].name} · Journée ${w+1}`};break}}}
  if(L.phase==='playoffs'){const f=L.po.next.find(f=>involves(f,m.id));if(f)lg={f,d:L.poDates[L.po.stage],ko:true,lab:`${LEAGUES[m.lg].name} · ${poName(m.lg,L.po.stage)}`}}
  const cup=myCupMatch();
  return cup&&(!lg||cup.d<lg.d)?cup:lg;
}
function windowOpen(){
  if(G.phase==='offseason')return 'été';
  if(G.phase!=='season'||!G.date)return null;
  const y=seasonYear();
  if(G.date<=`${y}-09-15`)return 'été';
  if(G.date>=`${y}-12-15`&&G.date<=`${y+1}-01-31`)return 'hiver';
  return null;
}
