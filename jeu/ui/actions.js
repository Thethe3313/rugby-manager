// Interface : actions des boutons (data-a) et démarrage
const ACT={
  start(d){const s=+UI.newSlot||Store.firstFree()||1;if(Store.meta[s]&&!confirm(`L'emplacement ${s} contient déjà une partie (${Store.meta[s].club}). L'écraser ?`))return;newGame(d.id);G.slot=s;UI.newSlot=null;save();render()},
  continue(d){load(+(d&&d.slot)||1,ok=>{if(ok)render();else alert('Impossible de charger cette partie.')})},
  delSlot(d){const s=+d.slot,m=Store.meta[s];if(!m||!confirm(`Supprimer définitivement la partie de l'emplacement ${s} (${m.club}) ?`))return;Store.del(s,()=>render())},
  menu(){G=null;UI.live=null;render()},
  exportSave(){exportSave()},
  // ---- staff ----
  staffMarket(d){UI.srole=d.r;UI.smsg='';UI.modal={type:'staff'};render()},
  hireStaff(d){const m=ME(),s=(G.staffPool||[]).find(x=>x.id===+d.id);if(!s)return;
    const err=hireStaff(m,s,+(UI.syrs||2));if(err){UI.smsg=err;return render()}
    UI.modal=null;save();render()},
  renewStaff(d){const s=ME().staff[d.r];if(!s)return;s.ctr+=2;s.sal=Math.round(s.sal*1.05/5)*5;addNews(`✍ ${s.name} prolonge de 2 ans (${fmtK(s.sal)}/an).`);save();render()},
  importSave(d,el){importSave(el.files&&el.files[0]);el.value=''},
  save(){save(ok=>{addNews(ok?`Partie sauvegardée (emplacement ${G.slot}).`:'Sauvegarde impossible dans ce navigateur.');render()})},
  tab(d){G.tab=d.t;UI.more=false;render()},
  more(){UI.more=!UI.more;render()},
  topTgl(){UI.topOpen=!UI.topOpen;render()},
  tutoNext(){G.tuto++;if(G.tuto>=TUTO.length)G.tuto=-1;else G.tab=TUTO[G.tuto][0];UI.more=false;render()},
  tutoSkip(){G.tuto=-1;render()},
  tutoReset(){G.tuto=0;G.tab=TUTO[0][0];render()},
  lgsel(d){UI.lg=d.lg;render()},
  cupsel(d){UI.cup=d.k;render()},
  play(){ACT.toMatch()},
  cont(){const r=advance('day');save();UI.mtab='resume';if(r)UI.modal={type:'match'};else if(G.liveWait)UI.modal={type:'prematch'};render()},
  toMatch(){const r=advance('match');save();UI.mtab='resume';if(r)UI.modal={type:'match'};else if(G.liveWait)UI.modal={type:'prematch'};else if(G.stop){G.tab='mail';UI.mid=(G.mail[0]||{}).id}render()},
  // ---- jour de match et match en direct ----
  goLive(){startLive()},
  talk(d,el){UI.talk=el.value},
  liveTalk(d){const L=UI.live;if(!L||!L.htTalk)return;L.talkTxt=applyTalk(L.ms,L.side,d.v,false);L.htTalk=false;render()},
  role(d,el){const m=ME();m[d.k]=el.value?+el.value:null;save();render()},
  quickMatch(){UI.modal=null;G.talk=UI.talk||'motive';const r=advance('day',{noLive:true});save();UI.mtab='resume';if(r)UI.modal={type:'match'};render()},
  preLineup(){UI.modal=null;G.tab='lineup';render()},
  mtab(d){UI.mtab=d.v;render()},
  livePause(){const L=UI.live;if(!L)return;L.paused=!L.paused;if(!L.paused)L.htTalk=false;render();liveSchedule()},
  liveSpeed(d){const L=UI.live;if(!L)return;L.speed=d.v;render();liveSchedule()},
  liveSkip(){const L=UI.live;if(!L)return;let g=0;while(!L.ms.done&&g++<4000)matchStep(L.ms);L.paused=true;render()},
  liveEnd(){endLive()},
  liveSel(d){const L=UI.live;if(!L)return;const x=L.ms.P[+d.id];L.sel=L.sel===+d.id||!x||x.slot<0||x.sin?null:+d.id;render();liveSchedule()},
  liveSub(d){const L=UI.live;if(!L)return;const inn=L.ms.P[+d.id],out=L.ms.P[L.sel];
    if(out&&inn&&!inn.used&&out.slot>=0&&!out.sin)doSub(L.ms,L.ms.T[L.side],out,inn,false);
    L.sel=null;render();liveSchedule()},
  liveAuto(){const L=UI.live;if(!L)return;const S=L.ms.T[L.side];S.auto=!S.auto;render();liveSchedule()},
  liveTac(d,el){const L=UI.live;if(!L)return;L.ms.T[L.side].tac[d.k]=el.value;render();liveSchedule()},
  setLive(d){G.settings=G.settings||{};G.settings.live=d.v;try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(G.settings))}catch(err){}save();render()},
  openMail(d){UI.mid=+d.id;render()},
  promote(d){const m=ME(),p=(m.youth||[]).find(x=>x.id===+d.id);if(!p)return;if(m.squad.length>=50){addNews('Effectif pro complet (50 joueurs).');return render()}
    const s=Math.max(15,salaryFor(ovr(p),p.age,m.lg));if(mass(m)+s>capOf(m)){addNews('Plafond salarial dépassé : impossible de signer ce contrat pro.');return render()}
    promoteYouth(m,p);addNews(`✍ ${p.name} signe son premier contrat pro (3 ans, ${fmtK(p.sal)}/an).`);UI.modal=null;save();render()},
  relYouth(d){const m=ME(),p=(m.youth||[]).find(x=>x.id===+d.id);if(!p)return;if(!confirm(`Libérer l'espoir ${p.name} ?`))return;m.youth=m.youth.filter(x=>x.id!==p.id);save();render()},
  mailAct(d){const x=(G.mail||[]).find(y=>y.id===+d.id);if(!x||!x.act)return;if(x.act.player){UI.modal={type:'player'};UI.pid=x.act.player}else{G.tab=x.act.tab;if(x.act.mt)UI.mt=x.act.mt}render()},
  closeModal(){UI.modal=null;render()},
  autoXV(){const m=ME();m.autoXV=m.autoXV===false;if(m.autoXV)m.lineup=autoLineup(m);save();render()},
  slot(d,el){const i=+d.i,id=el.value?+el.value:null,m=ME();m.autoXV=false;if(id){const j=m.lineup.indexOf(id);if(j>=0&&j!==i)m.lineup[j]=m.lineup[i]}m.lineup[i]=id;save();render()},
  auto(){const m=ME();m.lineup=autoLineup(m);save();render()},
  tac(d,el){const m=ME();if(d.k==='focus')m.focus=el.value;else m.tac[d.k]=el.value;save();render()},
  ef(d,el){UI.ef=el.value;render()},
  player(d){UI.modal={type:'player'};UI.pid=+d.id;render()},
  neg(d){UI.neg={pid:+d.id,mode:d.mode};UI.negMsg='';UI.modal={type:'neg'};render()},
  sendNeg(){
    const N=UI.neg,f=findPlayer(N.pid),p=f.p,m=ME();if(!p)return;
    const val=id=>{const e=document.getElementById(id);return e&&e.value!==undefined?+e.value:NaN};
    const fee=N.mode==='buy'?Math.max(0,Math.round(val('ng-fee')||0)):0,sal=Math.max(0,Math.round(val('ng-sal')||0)),yrs=Math.round(val('ng-yrs')||0);
    N.fee=fee;N.sal=sal;N.yrs=yrs;
    let r;
    if(N.mode==='renew'){
      const dem=wageDemand(p,m,'renew'),unhappy=m.mp>=6&&playShare(p,m)<.3&&ovr(p)>=70&&p.age<30;
      if(yrs<1||yrs>5)r={msg:'Durée : entre 1 et 5 ans.'};
      else if(mass(m)-p.sal+sal>capOf(m))r={msg:`Plafond salarial dépassé : marge ${fmtK(Math.max(0,capOf(m)-mass(m)+p.sal))}.`};
      else if(sal<dem*(unhappy?1.25:.97))r={player:unhappy?`${p.name} manque de temps de jeu : il ne prolongera que pour environ ${fmtK(Math.round(dem*1.25))} par an.`:`${p.name} refuse : il demande au moins ${fmtK(dem)} par an.`};
      else{p.sal=sal;p.ctr=yrs;if(G.phase==='offseason')p.fresh=true;addNews(`✍ ${p.name} prolonge de ${yrs} an(s) (${fmtK(sal)}/an).`);UI.modal=null;save();return render()}
    }else{
      if(N.mode==='pre'&&(G.pre||[]).some(x=>x.pid===p.id))r={msg:'Pré-contrat déjà signé avec ce joueur.'};
      else r=evalOffer(p,f.club,fee,sal,yrs,N.mode==='pre');
      if(r.ok){
        if(N.mode==='pre'){G.pre.push({pid:p.id,sal,yrs});addNews(`✍ Pré-contrat signé : ${p.name} rejoindra le club la saison prochaine (${fmtK(sal)}/an, ${yrs} an(s)).`)}
        else doTransfer(p,f.club,m,fee,sal,yrs);
        UI.modal=null;save();return render();
      }
    }
    UI.negMsg=[r.msg,r.club,r.player].filter(Boolean).map(x=>`<p>${x}</p>`).join('');render();
  },
  acceptOffer(d){
    const m=ME(),o=G.offers[+d.i];if(!o)return;const p=m.squad.find(x=>x.id===o.pid),b=C(o.club);
    if(!p||!b){G.offers.splice(+d.i,1);return render()}
    if(m.squad.length<=28){addNews('Effectif minimum de 28 joueurs : vente impossible.');return render()}
    doTransfer(p,m,b,o.fee,salaryFor(ovr(p),p.age,b.lg),R.i(2,4));
    G.offers=G.offers.filter(x=>x.pid!==p.id);save();render();
  },
  refuseOffer(d){G.offers.splice(+d.i,1);save();render()},
  goOffers(){G.tab='market';UI.mt='offers';render()},
  listP(d){const p=ME().squad.find(x=>x.id===+d.id);if(p){p.list=!p.list;addNews(p.list?`${p.name} est placé sur la liste des transferts.`:`${p.name} est retiré de la liste des transferts.`);save();render()}},
  release(d){
    const m=ME(),p=m.squad.find(x=>x.id===+d.id);if(!p)return;
    const cost=Math.round(p.sal*p.ctr*.5);
    if(m.squad.length<=28){addNews('Effectif minimum de 28 joueurs atteint.');return render()}
    if(!confirm(`Libérer ${p.name} ? Indemnité de rupture : ${fmtK(cost)} (50 % du salaire restant).`))return;
    m.budget-=cost;G.fin.transfers-=cost;removeFromClub(p,m);p.ctr=0;p.faT=0;p.list=false;G.fa.push(p);
    addNews(`${p.name} est libéré (${fmtK(cost)} d'indemnité).`);UI.modal=null;save();render();
  },
  mt(d){UI.mt=d.t;render()},
  startLg(d){UI.startLg=d.v;render()},
  flt(d,el){UI[d.k]=el.value;render()},
  setPot(d){G.settings=G.settings||{};G.settings.pot=d.v;try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(G.settings))}catch(err){}save();render()},
  nextSeason(){nextSeason();save();G.tab='home';render()}
};
// clics sur les boutons ; les listes déroulantes et les choix de fichier réagissent au changement de valeur
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.tagName==='SELECT'||b.type==='file')return;const f=ACT[b.dataset.a];if(f)f(b.dataset,b)});
document.addEventListener('change',e=>{const b=e.target;if((b.tagName==='SELECT'||b.type==='file')&&b.dataset.a){const f=ACT[b.dataset.a];if(f)f(b.dataset,b)}});
// démarrage : ouverture du stockage, puis premier affichage
Store.init(()=>render());
