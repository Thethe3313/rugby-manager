// Scénario de test : une partie complète pilotée par les mêmes actions qu'un joueur (objet ACT).
// À chaque étape, on rend l'écran et on le passe à `check(nom, html)`.
// Un match sur trois est suivi en direct (avec pause, vitesses, consignes et un remplacement manuel), les autres en résultat immédiat.
'use strict';
const TABS=['home','mail','squad','youth','staff','lineup','cal','table','cups','market','fin','settings','help','career','vest','histo'];

// Joue un match en direct jusqu'au bout en appelant liveTick() comme le ferait la minuterie du navigateur
function driveLive(game,label,check){
  const {run,app,elems}=game;
  const liveEls=()=>Object.values(elems).filter(e=>e.id.startsWith('lv-')).map(e=>e.innerHTML+' '+e.textContent+' '+(e.style.transform||'')+' '+(e.style.opacity??'')).join('\n');
  run(`ACT.talk({},{value:'exige'});ACT.role({k:'captain'},{value:String(ME().lineup[1])});ACT.role({k:'kicker'},{value:String(ME().lineup[14])})`);
  run('ACT.goLive()');check(label+':live-debut',app.innerHTML);
  let n=0,subDone=false;
  while(!run('UI.live.ms.done')&&n++<3000){
    if(run('UI.live.paused')){check(label+':live-pause',app.innerHTML);if(run('UI.live.htTalk'))run(`ACT.liveTalk({v:'exiger'})`);check(label+':live-discours',app.innerHTML);run('ACT.livePause()')}
    run('liveTick()');
    if(n%40===0)check(label+':live-maj',liveEls());
    if(n===20)run(`ACT.liveSpeed({v:'forts'})`);
    if(n===30){run(`ACT.liveTac({k:'style'},{value:'mouvement'})`);run(`ACT.liveTac({k:'pen'},{value:'touche'})`);run('ACT.liveAuto()');check(label+':live-consignes',app.innerHTML)}
    if(!subDone&&run('UI.live.ms.half===2')){
      // remplacement manuel : le n°1 sort, le premier remplaçant entre
      run(`(()=>{const L=UI.live,S=L.ms.T[L.side],o=S.on.find(d=>d&&!d.sin),b=S.bench.find(x=>!x.used);if(o&&b){ACT.liveSel({id:o.p.id});ACT.liveSub({id:b.p.id})}})()`);
      check(label+':live-remplacement',app.innerHTML);subDone=true;
    }
  }
  if(n>=3000)throw new Error('match en direct sans fin');
  check(label+':live-fin',app.innerHTML);
  run('ACT.liveEnd()');
}

function scenario(game,{club='pau',seasons=1,check=()=>{},liveEvery=3}={}){
  const {run,app}=game;
  run('UI.modal=null');
  check('start',(run('render()'),app.innerHTML));
  run(`ACT.start({id:${JSON.stringify(club)}})`);
  const allTabs=label=>{
    for(const t of TABS){run(`ACT.tab({t:'${t}'})`);check(label+':'+t,app.innerHTML)}
    // composition sur terrain : échange de deux titulaires, puis un joueur de la réserve à l'arrière, puis retour à l'adjoint
    run(`G.tab='lineup';UI.luv='terrain';ACT.luPick({k:'s0'})`);check(label+':terrain-selection',app.innerHTML);
    run(`ACT.luPick({k:'s2'});(()=>{const m=ME(),r=m.squad.find(p=>!m.lineup.includes(p.id)&&p.inj===0);if(r){ACT.luPick({k:'s14'});ACT.luPick({k:'p'+r.id})}})()`);check(label+':terrain-echange',app.innerHTML);
    run(`ACT.luv({v:'liste'});ME().autoXV=true;ME().lineup=autoLineup(ME());UI.luv='terrain'`);check(label+':liste',app.innerHTML);
    // page d'un club (depuis le classement), puis un de ses joueurs et retour ; classement espoirs ; date cible
    run(`ACT.club({id:G.clubs.find(c=>c.id!==G.meId).id})`);check(label+':club',app.innerHTML);
    run(`ACT.player({id:C(UI.cid).squad[0].id});ACT.closeModal()`);check(label+':club-retour',app.innerHTML);run('ACT.closeModal()');
    run(`G.tab='table';UI.lg=G.ESP&&Object.keys(G.ESP.poules)[0]?'esp_'+Object.keys(G.ESP.poules)[0]:null`);check(label+':espoirs-classement',app.innerHTML);run('UI.lg=null');
    // vestiaire : un joueur mécontent répond, délégation activée, prêt d'un remplaçant
    run(`(()=>{const p=ME().squad[ME().squad.length-1];p.sat=20;p.talk=G.date;ACT.tab({t:'vest'});ACT.vTalk({id:p.id,k:'prom'})})()`);check(label+':vestiaire',app.innerHTML);
    run(`G.deleg={renew:true,youth:true,offers:true,recruit:true}`);
    run(`(()=>{const m=ME(),p=[...m.squad].sort((a,b)=>ovr(a)-ovr(b))[0];ACT.player({id:p.id});ACT.loanPick({id:p.id})})()`);check(label+':pret',app.innerHTML);
    run(`(()=>{const T=loanTargets(ME().squad.find(x=>x.id===UI.pid));if(T.length&&(G.phase==='offseason'||windowOpen()))ACT.loanDo({c:T[0].c.id});else ACT.closeModal()})()`);check(label+':pret-fait',app.innerHTML);
    // recrutement : observation d'un joueur adverse (fourchette de note), fiche avant/après
    run(`(()=>{const p=G.clubs.find(c=>c.id!==G.meId&&c.lg!==ME().lg).squad[0];ACT.observe({id:p.id});ACT.player({id:p.id})})()`);check(label+':observation',app.innerHTML);run('ACT.closeModal()');
    // missions de recrutement : départ, retour (rapport), pépite intégrée au centre de formation
    run(`G.tab='market';UI.mt='scout';ME().budget+=100;ACT.mission()`);check(label+':mission',app.innerHTML);
    run(`if(G.mission)endMission();UI.mt='scout';render()`);check(label+':mission-rapport',app.innerHTML);
    run(`if((G.pros||[]).length)ACT.signPro({id:G.pros[0].id});UI.mt='search'`);check(label+':pepite',app.innerHTML);
    // prêts : un remplaçant sur la liste des prêts, onglet Prêts, demande de prêt d'un jeune d'un autre club
    run(`(()=>{const m=ME(),p=[...m.squad].sort((a,b)=>ovr(a)-ovr(b))[1];ACT.loanList({id:p.id});G.tab='market';UI.mt='loans';render()})()`);check(label+':prets',app.innerHTML);
    run(`(()=>{const a=loanAvailable()[0];if(a)ACT.loanAsk({id:a.p.id});if((G.loanOffers||[]).length)ACT.loanAcc({i:0});UI.mt='search'})()`);check(label+':prets-faits',app.innerHTML);
    // joueurs suivis : on suit le meilleur joueur adverse, puis l'onglet des suivis
    run(`ACT.follow({id:G.clubs.find(c=>c.id!==G.meId).squad[1].id})`);
    for(const t of ['follow','offers','pre','log']){run(`G.tab='market';ACT.mt({t:'${t}'})`);check(label+':market-'+t,app.innerHTML)}
    run(`UI.mt='search';ACT.tab({t:'home'})`);
    // fiche d'un joueur de l'effectif, d'un joueur adverse, d'un espoir, et négociation
    const ids=run(`[ME().squad[0].id, G.clubs.find(c=>c.id!==G.meId).squad[0].id, (ME().youth[0]||ME().squad[1]).id]`);
    for(const id of ids){run(`ACT.player({id:${id}})`);check(label+':player',app.innerHTML)}
    run(`ACT.neg({id:${ids[1]},mode:'buy'})`);check(label+':neg-buy',app.innerHTML);
    run(`ACT.sendNeg()`);check(label+':neg-send',app.innerHTML);
    run(`ACT.neg({id:${ids[0]},mode:'renew'})`);check(label+':neg-renew',app.innerHTML);
    run('ACT.closeModal()');
    // staff : marché, embauche du meilleur recruteur disponible, prolongations
    run(`ACT.tab({t:'cups'});ACT.cupsel({k:'ch'})`);check(label+':cups-ch',app.innerHTML);run(`ACT.cupsel({k:'cc'})`);
    run(`G.tab='staff';ACT.staffMarket({r:'rec'})`);check(label+':staff-marche',app.innerHTML);
    run(`(()=>{const s=(G.staffPool||[]).filter(x=>x.role==='rec').sort((a,b)=>b.q-a.q)[0];if(s)ACT.hireStaff({id:s.id})})()`);check(label+':staff-embauche',app.innerHTML);
    run('ACT.closeModal()');
  };
  allTabs('debut');
  let nMatch=0;
  for(let s=0;s<seasons;s++){
    let guard=0;
    while(run(`G.phase==='season'||G.phase==='access'`)&&guard++<300){
      const lb=`s${s}:step${guard}`;
      run('ACT.toMatch()');
      check(lb,app.innerHTML);
      if(run(`UI.modal&&UI.modal.type==='prematch'`)){
        nMatch++;
        if(liveEvery&&nMatch%liveEvery===1)driveLive(game,lb,check);
        else run('ACT.quickMatch()');
        check(lb+':apres-match',app.innerHTML);
        if(run(`UI.modal&&UI.modal.type==='match'`)){for(const v of['stats','notes','resume']){run(`ACT.mtab({v:'${v}'})`);check(lb+':match-'+v,app.innerHTML)}
          run(`ACT.postTalk({v:'${['feliciter','encourager','critiquer','rien'][nMatch%4]}'})`);check(lb+':causerie',app.innerHTML)}
      }
      run('UI.modal=null');
      if(guard===12)allTabs(`s${s}:milieu`);
      // Continuer façon FM : premier pas de l'avancée animée (le minuteur ne tourne pas dans les tests), puis arrêt
      if(guard===8){run(`document.getElementById('gd').value=dAdd(G.date,3);ACT.goUntil()`);check(lb+':aller-date',app.innerHTML);run('UI.adv=null')}
      if(guard===5){run('ACT.go()');check(lb+':avance',app.innerHTML);run('if(UI.adv)ACT.go()')}
    }
    allTabs(`s${s}:fin`);
    // intersaison : on prolonge le médecin et l'entraîneur des avants s'ils sont en fin de contrat (les autres partent)
    if(run(`G.phase==='offseason'`)){run(`['med','av'].forEach(r=>{const s=ME().staff[r];if(s&&s.ctr<=1)ACT.renewStaff({r})})`);check(`s${s}:staff-prolongation`,(run(`ACT.tab({t:'home'})`),app.innerHTML));run('ACT.nextSeason()');check(`s${s}:nouvelle`,app.innerHTML)}
    if(run(`G.phase==='sacked'`))break;
  }
}
module.exports={scenario,TABS};
