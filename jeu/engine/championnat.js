'use strict';
// Moteur : classements, journées, phases finales, barrages d'accession
function updateTable(lg,r){
  const T=G.L[lg].table,h=T[r.h],a=T[r.a];
  h.j++;a.j++;h.pf+=r.sh;h.pa+=r.sa;a.pf+=r.sa;a.pa+=r.sh;
  if(r.sh>r.sa){h.g++;a.p++;h.pts+=4}else if(r.sh<r.sa){a.g++;h.p++;a.pts+=4}else{h.n++;a.n++;h.pts+=2;a.pts+=2}
  h.bo+=r.bo[0];a.bo+=r.bo[1];h.pts+=r.bo[0];a.pts+=r.bo[1];
}
// Classement (en Nationale 2 : par poule ; sans poule précisée, celle du club du joueur s'il y joue)
function sortedTable(lg,poule){
  lg=lg||ME().lg;const L=G.L[lg];let rows=Object.values(L.table);
  if(L.poules>1){if(poule==null&&ME().lg===lg)poule=ME().poule;if(poule!=null)rows=rows.filter(r=>C(r.id)&&C(r.id).poule===poule)}
  return rows.sort((x,y)=>y.pts-x.pts||(y.pf-y.pa)-(x.pf-x.pa)||y.pf-x.pf);
}
function rankOf(id){const c=C(id);if(!c||!G.L[c.lg])return 0;return sortedTable(c.lg,c.poule).findIndex(r=>r.id===id)+1}
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
  if(L.phase==='regular')return `Journée ${L.week+1}/${L.fixtures.length}`;
  if(L.phase==='playoffs')return poName(m.lg,L.po.stage);
  return 'Saison terminée';
}
const slimR=r=>({h:r.h,a:r.a,sh:r.sh,sa:r.sa,th:r.th,ta:r.ta,bo:r.bo,winner:r.winner});
// light : les matchs qui ne concernent pas le club du joueur sont simulés d'après le niveau des équipes (Nationale 2, pour aller plus vite)
function playFixtures(fx,ko,light){
  const out=[];
  for(const f of fx){
    const hc=C(f.h),ac=C(f.a);
    if(light&&f.h!==G.meId&&f.a!==G.meId){
      const r=amSim({str:clubStr(hc)},{str:clubStr(ac)});r.h=f.h;r.a=f.a;r.ps=[];
      r.winner=r.sh>r.sa?f.h:r.sa>r.sh?f.a:ko?(R.f()<.5?f.h:f.a):null;
      // les joueurs de la composition sont crédités du match (temps de jeu, donc progression)
      for(const c of [hc,ac]){c.mp=(c.mp||0)+1;c.lineup.forEach((id,i)=>{const p=id!=null&&c.squad.find(x=>x.id===id);if(p){p.st.mj++;if(i<15)p.st.tit=(p.st.tit||0)+1}})}
      out.push(r);continue;
    }
    // le match du joueur a peut-être déjà été joué en direct : on reprend son résultat
    let r;
    if(G.liveRes&&G.liveRes.h===f.h&&G.liveRes.a===f.a){r=G.liveRes.r;delete G.liveRes}
    else r=simMatch(hc,ac,{ko,neutral:f.neutral});
    r.h=f.h;r.a=f.a;
    afterMatch(hc,r,0);afterMatch(ac,r,1);
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
  const out=playFixtures(fx,ko,lg!=='t14'&&lg!=='pd2');
  if(!ko)out.forEach(r=>updateTable(lg,r));
  const slim=out.map(slimR);
  if(!ko)L.results[L.week]=slim;else L.po.res.push({stage:L.po.stage,m:slim});
  const mine=out.find(r=>involves(r,m.id))||null;
  if(mine){mine.others=slim;mine.ko=ko}
  if(!ko){
    L.week++;
    // poule du joueur en Fédérale ou Régionale : pas de phases finales, le 1er de la poule est champion
    if(L.week===L.fixtures.length&&isAmLg(lg)){const t=sortedTable(lg);L.po={stage:0,seeds:[],next:[],res:[],champ:t[0].id,fin:t[1]?t[1].id:null};L.phase='done';
      if(lg===m.lg)addNews(`Fin de la saison de ${LEAGUES[lg].name} : ${C(t[0].id).short} termine en tête de la poule.`)}
    else if(L.week===L.fixtures.length&&lg==='n2'){setupN2Po(L);if(lg===m.lg)addNews('Fin de la phase régulière de Nationale 2 : place aux phases finales.')}
    else if(L.week===L.fixtures.length){
      const seeds=sortedTable(lg).slice(0,6).map(r=>r.id);
      L.po={stage:0,seeds,next:[{h:seeds[2],a:seeds[5]},{h:seeds[3],a:seeds[4]}],res:[],champ:null,fin:null};
      L.phase='playoffs';
      if(lg===m.lg)addNews(`Fin de la phase régulière de ${LEAGUES[lg].name}. Qualifiés : ${seeds.map(id=>C(id).short).join(', ')}.`);
    }
  }else{
    const po=L.po,w=out.map(r=>r.winner);
    if(lg==='n2')stepN2Po(L,out);
    else if(po.stage===0){po.next=[{h:po.seeds[0],a:w[1]},{h:po.seeds[1],a:w[0]}];po.stage=1}
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
  // Nationale : le champion monte, le finaliste joue le barrage chez le 15e de Pro D2
  const nPo=G.L.nat.po,nf=C(nPo.fin);
  G.moves={t14down:t[13].id,pd2up:pPo.champ,pd2down:p[15].id,natUp:nPo.champ,acc:[]};
  G.access=[{h:pPo.fin,a:t[12].id,kind:'t14'},{h:p[14].id,a:nf.id,kind:'pd2'}];
  addNews(`Barrages d'accession : ${C(pPo.fin).short} - ${C(t[12].id).short} (Top 14/Pro D2) et ${C(p[14].id).short} - ${nf.short} (Pro D2/Nationale).`);
  G.phase='access';G.accessDate=dAdd(G.date,7);
  if(G.access.some(f=>involves(f,G.meId)))mail('Le président','Barrage d\'accession',`Nous disputerons un barrage d'accession le ${fmtD(G.accessDate,true)}. Tout se joue sur un match.`);
}
