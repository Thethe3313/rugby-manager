// Scénario de test : une partie complète pilotée par les mêmes actions qu'un joueur (objet ACT).
// À chaque étape, on rend l'écran et on le passe à `check(nom, html)`.
'use strict';
const TABS=['home','mail','squad','youth','lineup','cal','table','market','fin','settings','help'];

function scenario(game,{club='pau',seasons=1,check=()=>{},live=false}={}){
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
  for(let s=0;s<seasons;s++){
    let guard=0;
    while(run(`G.phase==='season'||G.phase==='access'`)&&guard++<200){
      run('ACT.toMatch()');
      check(`s${s}:step${guard}`,app.innerHTML);
      if(live&&run(`UI.modal&&UI.modal.type==='live'`))live(game,`s${s}:step${guard}`);
      run('UI.modal=null');
      if(guard===12)allTabs(`s${s}:milieu`);
    }
    allTabs(`s${s}:fin`);
    if(run(`G.phase==='offseason'`)){run('ACT.nextSeason()');check(`s${s}:nouvelle`,app.innerHTML)}
    if(run(`G.phase==='sacked'`))break;
  }
}
module.exports={scenario,TABS};
