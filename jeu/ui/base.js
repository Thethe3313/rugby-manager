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
// Poste : nom complet sur ordinateur, abrégé sur téléphone
const POSS={PIL:'Pilier',TAL:'Talon.',DM:'Mêlée',OUV:'Ouvreur',CEN:'Centre',AIL:'Ailier',ARR:'Arrière'};
function posS(p){return p.g==='PIL'?(p.sub==='TH'?'Pil. D':'Pil. G'):p.g==='3L'?(p.sub==='N8'?'N° 8':p.sub==='FL'?'Flanker':'3e l.'):p.g==='2L'?'2e l.':POSS[p.g]||posL(p)}
const posLS=p=>`<span class="lg-only">${posL(p)}</span><span class="sm-only">${posS(p)}</span>`;
function injTxt(p){return away(p)?`<span class="warn">🌍 En sélection (${p.sel})</span>`:p.inj>0?`<span class="ko">🚑 ${injDur(p.inj)}</span>`:'<span class="ok">Apte</span>'}
// Joueurs suivis au mercato (étoile)
const isFollowed=p=>(G.follow||[]).includes(p.id);
const followBtn=(p,big)=>big?`<button class="btn sec sm" data-a="follow" data-id="${p.id}">${isFollowed(p)?'★ Ne plus suivre':'☆ Suivre'}</button>`:`<span class="star ${isFollowed(p)?'on':''}" data-a="follow" data-id="${p.id}" title="Suivre ce joueur">${isFollowed(p)?'★':'☆'}</span> `;
const obsBtn=p=>knowOf(p)>=3?'':(G.obsQ||[]).some(x=>x.pid===p.id)?'<span class="mut">🔍 en observation</span>':`<button class="btn sec sm" data-a="observe" data-id="${p.id}">🔍 Faire observer</button>`;
// texte sans accents ni majuscules (recherche par nom)
const normTxt=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const formeCls=f=>f>=80?'ok':f>=65?'warn':'ko';
function formeBar(f){return `<div class="bar" title="${rd(f)}%"><i style="width:${f}%;background:${f>75?'var(--acc)':f>50?'var(--acc2)':'var(--bad)'}"></i></div>`}

// Écran de téléphone (même seuil que la feuille de style)
const isPhone=()=>typeof matchMedia==='function'&&matchMedia('(max-width:700px)').matches;
function render(){
  if(!G){$app.innerHTML=viewStart();return}
  if(G.phase==='sacked'){$app.innerHTML=viewSacked();return}
  const m=ME();
  const ph=stageLabel(m),f=famOf(G.tab);
  // Bandeau : sur téléphone, seules les pastilles sans classe « x » restent visibles (le bouton ⋯ affiche les autres)
  $app.innerHTML=`<div id="top" class="${UI.topOpen?'open':''}"><span class="logo">🏉<span class="lt"> Rugby Manager</span></span><span class="pill"><b>${m.name}</b></span><span class="pill">📅 <b>${fmtD(G.date)}<span class="lt"> ${G.date.slice(0,4)}</span></b></span><span class="pill x"><b>${LEAGUES[m.lg].name}</b> · ${seasonLabel()} · <b>${ph}</b></span><span class="sp"></span>${windowOpen()?'<span class="pill x" style="color:var(--acc)"><b>Mercato ouvert</b></span>':''}<span class="pill"><span class="lb">Trésorerie </span><span class="lm">💰 </span><b class="${m.budget<0?'ko':''}">${k(m.budget)}</b></span><span class="pill x" title="Masse salariale / plafond">Masse <b>${k(mass(m))}</b> / ${k(capOf(m))}</span><button class="btn sec sm tgl" data-a="topTgl" title="Plus d'informations">${UI.topOpen?'▲':'⋯'}</button>${musicBtn()}<button class="btn sec sm" data-a="save" title="Sauvegarder">💾<span class="lt"> Sauvegarder</span></button><button class="btn sec sm hmo" data-a="menu">Menu</button></div>
  <div id="wrap"><div id="nav">${FAMS.map(x=>`<a class="${f===x[0]?'on':''}" data-a="fam" data-f="${x[0]}"><span class="fi">${x[1]}</span>${famLabel(x)}</a>`).join('')}</div><div id="main">${crumb(f)}${subBar(f)}${view()}</div></div>${UI.adv?advBar():''}${phoneBar(f)}${tutoHTML()}${UI.modal?modalView():''}`;
}
// Menu en 6 familles : chaque famille regroupe des écrans (sous-onglets). G.tab garde le nom de l'écran.
const FAMS=[
  ['home','🏠','Accueil',[['home','Accueil']]],
  ['team','👥','Équipe',[['squad','Effectif'],['lineup','Composition'],['vest','Vestiaire'],['youth','Espoirs'],['staff','Staff']]],
  ['games','🏆','Matchs',[['cal','Calendrier'],['table','Classement'],['cups','Europe']]],
  ['recru','💱','Recrutement',[['market','Mercato']]],
  ['club','🏛️','Club',[['fin','Finances'],['career','Carrière'],['histo','Histoire'],['settings','Réglages'],['help','Rugby 101']]],
  ['mail','✉️','Messagerie',[['mail','Messagerie']]]];
const famOf=t=>(FAMS.find(x=>x[3].some(y=>y[0]===t))||FAMS[0])[0];
const famLabel=x=>x[0]==='mail'&&unread()?`${x[2]} <span class="badge">${unread()}</span>`:x[2];
// Fil d'Ariane : où l'on est, et retour à l'écran précédent
function crumb(f){
  const x=FAMS.find(y=>y[0]===f),t=x&&x[3].find(y=>y[0]===G.tab),h=UI.hist||[];
  if(!x||(f==='home'&&!h.length))return '';
  return `<div id="crumb">${h.length?'<a class="cb" data-a="back" title="Revenir à l’écran précédent">← Retour</a>':''}<span>${x[2]}${t&&x[3].length>1?` › <b>${t[1]}</b>`:''}</span></div>`;
}
// Sous-onglets de la famille en cours (rien pour une famille d'un seul écran)
function subBar(f){
  const x=FAMS.find(y=>y[0]===f);
  if(f==='recru'&&G.tab==='market')return mtBar();
  if(!x||x[3].length<2)return '';
  return `<div id="sub">${x[3].map(t=>`<a class="${G.tab===t[0]?'on':''}" data-a="tab" data-t="${t[0]}">${t[1]}</a>`).join('')}${f==='club'?'<a class="sm-only" data-a="menu">💾 Mes parties</a>':''}</div>`;
}
// Téléphone : barre du bas (les 6 familles) et bouton Continuer toujours accessible (masqués sur ordinateur)
function phoneBar(f){
  const go=G.phase==='season'||G.phase==='access',sh={recru:'Recrut.',mail:'Messages'},u=unread();
  return `<div id="bbar">${go?`<div id="bcont"><button class="btn ${UI.adv?'bad':''}" data-a="go">${UI.adv?'■ Stop':'Continuer ▶'}</button><button class="btn sec" data-a="cont" ${UI.adv?'disabled':''}>+1 jour</button></div>`:''}
  <nav id="bnav">${FAMS.map(x=>`<a class="${f===x[0]?'on':''}" data-a="fam" data-f="${x[0]}">${x[1]}${x[0]==='mail'&&u?`<span class="badge">${u}</span>`:''}<small>${sh[x[0]]||x[2]}</small></a>`).join('')}</nav></div>`;
}
// Tutoriel de la première partie (G.tuto = étape en cours ; absent ou -1 : terminé). Chaque étape ouvre l'onglet concerné.
const TUTO=[
  ['home','Bienvenue, coach !','Voici l’<b>Accueil</b> : ton prochain match (avec la force des deux équipes), les nouvelles du club et le classement. Ton président t’a fixé un objectif dans la <b>Messagerie</b>.'],
  ['lineup','Ta composition','Ici tu choisis ton <b>XV</b>, tes remplaçants et ta <b>tactique</b> (style de jeu, jeu au pied…). Au début, ton adjoint compose l’équipe tout seul : tu peux lui laisser la main.'],
  ['squad','Ton effectif','Tous tes joueurs, avec leur <b>note sur 99</b>, leur forme et leurs blessures. Touche un nom pour ouvrir la fiche du joueur (attributs, contrat, personnalité).'],
  ['market','Le mercato','Pour <b>recruter</b> et vendre pendant les fenêtres de transferts. Attention au budget et à la masse salariale autorisée.'],
  ['home','Faire avancer le temps','<b>Continuer ▶</b> avance d’un jour, <b>Prochain match</b> va jusqu’au match. Avant chaque match, tu peux le suivre en direct. Pour les règles du rugby : <b>Club › Rugby 101</b>. Bon match !']];
function tutoHTML(){
  if(G.tuto==null||G.tuto<0||G.tuto>=TUTO.length||G.phase!=='season'||UI.modal)return '';
  const[,t,x]=TUTO[G.tuto];
  return `<div id="tuto"><div class="row" style="justify-content:space-between"><b>${t}</b><span class="mut">${G.tuto+1}/${TUTO.length}</span></div><p>${x}</p><div class="row"><button class="btn sm" data-a="tutoNext">${G.tuto<TUTO.length-1?'Suivant':'C’est parti !'}</button><button class="btn sec sm" data-a="tutoSkip">Passer le tutoriel</button></div></div>`;
}
// Bandeau d'avancée (les jours qui passent)
function advBar(){return `<div id="advbar"><span class="spin">⏩</span> Les jours passent… <b>${fmtD(G.date,true)}</b>${UI.adv.until?' → '+fmtD(UI.adv.until,true):''} <button class="btn sec sm" data-a="go">■ Stop</button></div>`}
function view(){
  switch(G.tab){
    case'squad':return viewSquad();case'lineup':return viewLineup();case'cal':return viewCal();
    case'table':return viewTable();case'market':return viewMarket();case'fin':return viewFin();case'settings':return viewSettings();case'youth':return viewYouth();case'staff':return viewStaff();case'cups':return viewCups();case'mail':return viewMail();case'help':return viewHelp();case'career':return viewCareer();case'vest':return viewVest();case'histo':return viewHisto();
    default:return G.phase==='offseason'?viewOffseason():viewHome();
  }
}
