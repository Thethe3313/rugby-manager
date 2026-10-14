// Scénario de test : une partie complète pilotée par les mêmes actions qu'un joueur (objet ACT).
// À chaque étape, on rend l'écran et on le passe à `check(nom, html)`.
// Un match sur trois est suivi en direct (avec pause, vitesses, consignes et un remplacement manuel), les autres en résultat immédiat.
'use strict';
const TABS=['home','mail','squad','youth','lineup','cal','table','market','fin','settings','help'];

// Joue un match en direct jusqu'au bout en appelant liveTick() comme le ferait la minuterie du navigateur
function driveLive(game,label,check){
  const {run,app,elems}=game;
  const liveEls=()=>Object.values(elems).filter(e=>e.id.startsWith('lv-')).map(e=>e.innerHTML+' '+e.textContent+' '+(e.style.transform||'')+' '+(e.style.opacity??'')).join('\n');
  run('ACT.goLive()');check(label+':live-debut',app.innerHTML);
  let n=0,subDone=false;
  while(!run('UI.live.ms.done')&&n++<3000){
    if(run('UI.live.paused')){check(label+':live-pause',app.innerHTML);run('ACT.livePause()')}
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
    for(const t of ['offers','pre','log']){run(`G.tab='market';ACT.mt({t:'${t}'})`);check(label+':market-'+t,app.innerHTML)}
    run(`UI.mt='search';ACT.tab({t:'home'})`);
    // fiche d'un joueur de l'effectif, d'un joueur adverse, d'un espoir, et négociation
    const ids=run(`[ME().squad[0].id, G.clubs.find(c=>c.id!==G.meId).squad[0].id, (ME().youth[0]||ME().squad[1]).id]`);
    for(const id of ids){run(`ACT.player({id:${id}})`);check(label+':player',app.innerHTML)}
    run(`ACT.neg({id:${ids[1]},mode:'buy'})`);check(label+':neg-buy',app.innerHTML);
    run(`ACT.sendNeg()`);check(label+':neg-send',app.innerHTML);
    run(`ACT.neg({id:${ids[0]},mode:'renew'})`);check(label+':neg-renew',app.innerHTML);
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
        if(run(`UI.modal&&UI.modal.type==='match'`))for(const v of['stats','notes','resume']){run(`ACT.mtab({v:'${v}'})`);check(lb+':match-'+v,app.innerHTML)}
      }
      run('UI.modal=null');
      if(guard===12)allTabs(`s${s}:milieu`);
    }
    allTabs(`s${s}:fin`);
    if(run(`G.phase==='offseason'`)){run('ACT.nextSeason()');check(`s${s}:nouvelle`,app.innerHTML)}
    if(run(`G.phase==='sacked'`))break;
  }
}
module.exports={scenario,TABS};
