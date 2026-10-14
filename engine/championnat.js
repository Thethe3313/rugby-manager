'use strict';
// Moteur : classements, journées, phases finales, barrages d'accession
function updateTable(lg,r){
  const T=G.L[lg].table,h=T[r.h],a=T[r.a];
  h.j++;a.j++;h.pf+=r.sh;h.pa+=r.sa;a.pf+=r.sa;a.pa+=r.sh;
  if(r.sh>r.sa){h.g++;a.p++;h.pts+=4}else if(r.sh<r.sa){a.g++;h.p++;a.pts+=4}else{h.n++;a.n++;h.pts+=2;a.pts+=2}
  h.bo+=r.bo[0];a.bo+=r.bo[1];h.pts+=r.bo[0];a.pts+=r.bo[1];
}
const sortedTable=lg=>Object.values(G.L[lg||ME().lg].table).sort((x,y)=>y.pts-x.pts||(y.pf-y.pa)-(x.pf-x.pa)||y.pf-x.pf);
function rankOf(id){const c=C(id);if(!c||!G.L[c.lg])return 0;return sortedTable(c.lg).findIndex(r=>r.id===id)+1}
const involves=(f,id)=>f.h===id||f.a===id;
function nextMatchOf(m){
  if(G.phase==='access')return (G.access||[]).find(f=>involves(f,m.id))||null;
  if(G.phase!=='season')return null;
  const L=G.L[m.lg];if(!L)return null;
  if(L.phase==='regular'){const f=L.fixtures[L.week].find(x=>x[0]===m.id||x[1]===m.id);return f?{h:f[0],a:f[1]}:null}
  if(L.phase==='playoffs')return L.po.next.find(f=>involves(f,m.id))||null;
  return null;
}
// libellé de l'étape en cours pour le championnat du joueur
function stageLabel(m){
  if(G.phase==='access')return 'Barrages d\'accession';
  if(G.phase!=='season')return 'Intersaison';
  const L=G.L[m.lg];
  if(L.phase==='regular')return `Journée ${L.week+1}/${LEAGUES[m.lg].rounds}`;
  if(L.phase==='playoffs')return PONAME[L.po.stage];
  return 'Saison terminée';
}
const slimR=r=>({h:r.h,a:r.a,sh:r.sh,sa:r.sa,th:r.th,ta:r.ta,bo:r.bo,winner:r.winner});
function playFixtures(fx,ko){
  const out=[];
  for(const f of fx){
    const hc=C(f.h),ac=C(f.a);
    const r=simMatch(hc,ac,{ko,neutral:f.neutral});r.h=f.h;r.a=f.a;
    afterMatch(hc);afterMatch(ac);
    out.push(r);
  }
  return out;
}
// Joue une étape (journée ou tour de phase finale) d'un championnat
function stepLeague(lg){
  const L=G.L[lg],m=ME();
  if(L.phase==='done')return null;
  const ko=L.phase==='playoffs';
  const fx=ko?L.po.next:L.fixtures[L.week].map(x=>({h:x[0],a:x[1]}));
  const out=playFixtures(fx,ko);
  if(!ko)out.forEach(r=>updateTable(lg,r));
  const slim=out.map(slimR);
  if(!ko)L.results[L.week]=slim;else L.po.res.push({stage:L.po.stage,m:slim});
  const mine=out.find(r=>involves(r,m.id))||null;
  if(mine){mine.others=slim;mine.ko=ko}
  if(!ko){
    L.week++;
    if(L.week===LEAGUES[lg].rounds){
      const seeds=sortedTable(lg).slice(0,6).map(r=>r.id);
      L.po={stage:0,seeds,next:[{h:seeds[2],a:seeds[5]},{h:seeds[3],a:seeds[4]}],res:[],champ:null,fin:null};
      L.phase='playoffs';
      if(lg===m.lg)addNews(`Fin de la phase régulière de ${LEAGUES[lg].name}. Qualifiés : ${seeds.map(id=>C(id).short).join(', ')}.`);
    }
  }else{
    const po=L.po,w=out.map(r=>r.winner);
    if(po.stage===0){po.next=[{h:po.seeds[0],a:w[1]},{h:po.seeds[1],a:w[0]}];po.stage=1}
    else if(po.stage===1){po.next=[{h:w[0],a:w[1],neutral:true}];po.stage=2}
    else{po.champ=w[0];po.fin=out[0].h===w[0]?out[0].a:out[0].h;L.phase='done';po.next=[];
      addNews(`🏆 ${C(po.champ).name} remporte le ${LEAGUES[lg].name} !`)}
  }
  return mine;
}
// Bouton "Jouer" : joue l'étape, puis avance automatiquement tant que le club du joueur n'a pas de match
// Barrages d'accession : 13e du Top 14 contre le finaliste perdant de Pro D2,
// 15e de Pro D2 contre le finaliste de Nationale
function prepareAccess(){
  const t=sortedTable('t14'),p=sortedTable('pd2'),pPo=G.L.pd2.po;
  const natPick=[...G.nat].sort((a,b)=>b[3]-a[3]+R.n(0,2));
  const natChamp=natPick[0],natFin=natPick[1];
  G.nat=G.nat.filter(x=>x!==natChamp&&x!==natFin);
  const nc=mkClub(natChamp,'nat'),nf=mkClub(natFin,'nat');
  G.clubs.push(nc,nf);
  G.moves={t14down:t[13].id,pd2up:pPo.champ,pd2down:p[15].id,natUp:nc.id,acc:[]};
  G.access=[{h:pPo.fin,a:t[12].id,kind:'t14'},{h:nf.id,a:p[14].id,kind:'pd2'}];
  addNews(`Barrages d'accession : ${C(pPo.fin).short} - ${C(t[12].id).short} (Top 14/Pro D2) et ${nf.short} - ${C(p[14].id).short} (Pro D2/Nationale).`);
  G.phase='access';G.accessDate=dAdd(G.date,7);
  if(G.access.some(f=>involves(f,G.meId)))mail('Le président','Barrage d\'accession',`Nous disputerons un barrage d'accession le ${fmtD(G.accessDate,true)}. Tout se joue sur un match.`);
}
