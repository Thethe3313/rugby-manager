// ==== UI ====
const SAVE_KEY='rugbyManager_v8';
const UI={modal:null,mf:'ALL',ef:'ALL',pid:null,mt:'search',ml:'ALL',ms:'ALL',mo:60,ma:40,neg:null,negMsg:''};
const k=n=>Math.abs(n)>=1000?(n/1000).toFixed(2).replace('.',',')+' M€':Math.round(n)+' k€';
const oc=v=>v>=78?'o1':v>=68?'o2':v>=58?'o3':'o4';
const rd=Math.round;
// Sauvegarde : les nombres à virgule (attributs, énergie…) sont arrondis à 3 décimales pour alléger le fichier
const saveJSON=()=>JSON.stringify(G,(k,v)=>typeof v==='number'&&!Number.isInteger(v)?Math.round(v*1000)/1000:v);
// Sauvegarde dans l'emplacement de la partie (voir ui/stockage.js : IndexedDB, 4 emplacements)
function save(cb){if(!G)return false;if(!G.slot)G.slot=Store.firstFree()||1;Store.save(G.slot,saveJSON(),slotInfo(G),cb);return !Store.failed}
function load(slot,cb){Store.adoptOld(()=>Store.load(slot,s=>{if(!s)return cb(false);try{G=JSON.parse(s);G.slot=slot;migrateSave();cb(true)}catch(e){cb(false)}}))}
// Export / import de la sauvegarde dans un fichier (pour la changer de navigateur, d'ordinateur, ou la mettre à l'abri)
function exportSave(){
  const blob=new Blob([saveJSON()],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=`rugby-manager-${ME().short.replace(/\W+/g,'-')}-${G.date}.json`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function importSave(file){
  if(!file)return;
  const rd_=new FileReader();
  rd_.onload=()=>{
    try{const g=JSON.parse(rd_.result);if(!g||!Array.isArray(g.clubs)||!g.meId)throw 0;const slot=(G&&G.slot)||+UI.newSlot||Store.firstFree()||1;G=g;G.slot=slot;migrateSave();UI.modal=null;UI.live=null;save();render()}
    catch(err){alert('Ce fichier n\'est pas une sauvegarde de Rugby Manager.')}
  };
  rd_.readAsText(file);
}
const $app=document.getElementById('app');

function posL(p){return p.g==='PIL'?(p.sub==='TH'?'Pilier droit':'Pilier gauche'):p.g==='3L'?(p.sub==='N8'?'Numéro 8':p.sub==='FL'?'Flanker':GROUPS[p.g]):GROUPS[p.g]}
function injTxt(p){return p.inj>0?`<span class="ko">🚑 ${injDur(p.inj)}</span>`:'<span class="ok">Apte</span>'}
function formeBar(f){return `<div class="bar" title="${rd(f)}%"><i style="width:${f}%;background:${f>75?'var(--acc)':f>50?'var(--acc2)':'var(--bad)'}"></i></div>`}

function render(){
  if(!G){$app.innerHTML=viewStart();return}
  if(G.phase==='sacked'){$app.innerHTML=viewSacked();return}
  const m=ME();
  const tabs=[['home','Accueil'],['mail',`Messagerie${unread()?' ('+unread()+')':''}`],['squad','Effectif'],['youth','Espoirs'],['staff','Staff'],['lineup','Composition'],['cal','Calendrier'],['table','Classement'],['cups','Europe'],['market','Mercato'],['fin','Finances'],['settings','Réglages'],['help','Rugby 101']];
  const ph=stageLabel(m);
  $app.innerHTML=`<div id="top"><span class="logo">🏉 Rugby Manager</span><span class="pill"><b>${m.name}</b></span><span class="pill">📅 <b>${fmtD(G.date,true)}</b></span><span class="pill"><b>${LEAGUES[m.lg].name}</b></span><span class="pill">Saison <b>${seasonLabel()}</b></span><span class="pill"><b>${ph}</b></span><span class="sp"></span>${windowOpen()?'<span class="pill" style="color:var(--acc)"><b>Mercato ouvert</b></span>':''}<span class="pill">Trésorerie <b class="${m.budget<0?'ko':''}">${k(m.budget)}</b></span><span class="pill">Masse salariale <b>${k(mass(m))}</b> / ${k(capOf(m))}</span><button class="btn sec sm" data-a="save">💾 Sauvegarder</button><button class="btn sec sm" data-a="menu">Menu</button></div>
  <div id="wrap"><div id="nav">${tabs.map(t=>`<a class="${G.tab===t[0]?'on':''}" data-a="tab" data-t="${t[0]}">${t[1]}</a>`).join('')}</div><div id="main">${view()}</div></div>${UI.modal?modalView():''}`;
}
function view(){
  switch(G.tab){
    case'squad':return viewSquad();case'lineup':return viewLineup();case'cal':return viewCal();
    case'table':return viewTable();case'market':return viewMarket();case'fin':return viewFin();case'settings':return viewSettings();case'youth':return viewYouth();case'staff':return viewStaff();case'cups':return viewCups();case'mail':return viewMail();case'help':return viewHelp();
    default:return G.phase==='offseason'?viewOffseason():viewHome();
  }
}
