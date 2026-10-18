// Photographie les écrans du jeu (taille ordinateur et taille téléphone) avec Edge sans fenêtre.
// Sert à comparer l'interface avant / après une modification.
// Utilisation : node outils/captures.js --out <dossier> [--jeu <dossier du jeu>] [--ecrans home,squad] [--club pau]
// Le jeu est chargé depuis --jeu (par défaut jeu/), une partie de démonstration est créée (hasard à graine fixe : mêmes images
// d'une version à l'autre), rien n'est enregistré dans les vraies parties (profil Edge temporaire).
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),{execFileSync}=require('child_process');
const args=process.argv.slice(2),opt=k=>{const i=args.indexOf('--'+k);return i>=0?args[i+1]:null};
const ROOT=path.join(__dirname,'..');
const JEU=path.resolve(opt('jeu')||path.join(ROOT,'jeu')),OUT=path.resolve(opt('out')||path.join(os.tmpdir(),'captures-rugby'));
const CLUB=opt('club')||'pau';
const EDGE=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));
if(!EDGE)throw new Error('Edge introuvable');
// écran -> code exécuté une fois la partie de démonstration prête (G.tab, fenêtre…)
const SCREENS={
  accueil:"G=null;UI.amLv=null",accueilbas:"G=null;UI.startLg='am';UI.amLv='r1'",tuto:"G.tuto=1;G.tab='lineup'",plus:"G.tab='squad';UI.more=true",
  avance:"G.tab='home';UI.adv={n:3}",mailouvert:"G.tab='mail';UI.mid=G.mail[0].id;UI.mailView=true",
  offre:"const c=C('bay'),b=c.squad[2];sendBid(b,c,10,wageDemand(b,ME(),'move'),2);for(let i=0;i<4;i++)dayStep();G.tab='mail';UI.mid=G.mail.find(m=>/Offre/.test(m.subj)).id;UI.mailView=true",
  suivis:"G.follow=[C('tou').squad[0].id,C('lar').squad[3].id,C('bay').squad[6].id];G.tab='market';UI.mt='follow'",
  fatigue:"for(let i=0;i<8;i++)advance('match',{noLive:true});G.tab='lineup'",
  ferte:"G.tab='squad';UI.modal={type:'player'};UI.pid=(ME().squad.find(p=>p.name==='Mathis Ferté')||ME().squad[0]).id",
  terrainsel:"G.tab='lineup';UI.luSel='s10'",
  clubpage:"G.tab='table';UI.modal={type:'club'};UI.cid='tou'",
  espc:"for(let i=0;i<5;i++)advance('match',{noLive:true});G.tab='table';UI.lg='esp_t14'",
  youth5:"for(let i=0;i<5;i++)advance('match',{noLive:true});G.tab='youth'",
  carriere:"for(let i=0;i<4;i++)advance('match',{noLive:true});G.tab='career'",
  licencie:"G.coach.board=8;coachAfterMatch({h:G.meId,a:'tou',sh:0,sa:40,ko:false})",
  bilan:"{let n=0;while((G.phase==='season'||G.phase==='access')&&n++<500)advance('match',{noLive:true})}G.tab='home'",
  direction:"for(let i=0;i<4;i++)advance('match',{noLive:true});G.tab='home';window.scrollTo(0,0)",
  vest:"for(let i=0;i<6;i++)advance('match',{noLive:true});const p=[...ME().squad].sort((a,b)=>playShare(a,ME())-playShare(b,ME())).find(p=>p.age>=24);p.sat=28;p.talk=G.date;G.tab='vest'",
  deleg:"G.deleg={renew:true,offers:true};G.tab='staff'",
  pret:"const p=[...ME().squad].filter(p=>p.age<=22).sort((a,b)=>ovr(a)-ovr(b))[0];G.tab='squad';UI.modal={type:'loan'};UI.pid=p.id",
  inconnu:"G.tab='market';const p=C('x_lns').squad.find(p=>!p.sel&&(p.caps||0)<20)||C('x_lns').squad[5];UI.modal={type:'player'};UI.pid=p.id",
  histo:"{let n=0;while((G.phase==='season'||G.phase==='access')&&n++<500)advance('match',{noLive:true})}G.tab='histo'",
  mission:"ME().budget+=200;startMission('nz','ALL');G.mission.due=G.date;missionDay();startMission('pac','ALL');G.tab='market';UI.mt='scout'",
  rapport:"ME().budget+=200;startMission('nz','ALL');G.mission.due=G.date;missionDay();G.tab='mail';UI.mid=G.mail.find(m=>/Rapport de mission/.test(m.subj)).id;UI.mailView=true",
  directjeu:"G.settings.live='ask';advance('match');ACT.goLive();for(let i=0;i<137&&!UI.live.ms.done;i++)liveTick();UI.live.paused=true",
  directessai:"G.settings.live='ask';advance('match');ACT.goLive();for(let i=0;i<400&&!UI.live.ms.done;i++){liveTick();if(UI.live.ms.step.some(e=>e.k==='try'))break}UI.live.paused=true",
  prets:"const m=ME(),p=[...m.squad].filter(p=>p.age<=23).sort((a,b)=>ovr(a)-ovr(b))[0];p.loanList=true;genLoanOffers(p,2);G.tab='market';UI.mt='loans'",
  decisif:"G.settings.live='ask';advance('match');ACT.goLive();for(let i=0;i<900&&!UI.live.ms.done&&UI.live.ms.t<76*60;i++){liveTick();if(UI.live.paused&&!UI.live.ms.decision)ACT.livePause()}const ms=UI.live.ms;ms.decision={a:UI.live.side,dist:38,side:'en coin',pS:58,gain:30,lead:ms.sc[UI.live.side]-ms.sc[1-UI.live.side]<-7?-5:ms.sc[UI.live.side]-ms.sc[1-UI.live.side],min:77,p:32};UI.live.paused=true;UI.live.flash='⏱ Moment décisif !'",
  trisal:"G.tab='squad';UI.ss={k:'sal',d:1}",
  nego:"const m=ME(),p=m.squad.find(x=>x.age<=23&&ovr(x)<70)||m.squad[20];G.offers=[{pid:p.id,club:'bri',fee:80,max:110,pat:2}];G.tab='market';UI.mt='offers';UI.oi=0;counterOffer(G.offers[0],150);UI.negMsg='Brive : « C’est beaucoup trop. Notre dernière offre : 100 k€. »';UI.modal={type:'sellneg'}",
  home:"G.tab='home'",mail:"G.tab='mail'",squad:"G.tab='squad'",youth:"G.tab='youth'",staff:"G.tab='staff'",
  lineup:"G.tab='lineup'",cal:"G.tab='cal'",table:"G.tab='table'",cups:"G.tab='cups'",market:"G.tab='market'",
  fin:"G.tab='fin'",settings:"G.tab='settings'",help:"G.tab='help'",
  joueur:"G.tab='squad';UI.modal={type:'player'};UI.pid=ME().squad[3].id",
  avantmatch:"G.settings.live='ask';advance('match');UI.modal={type:'prematch'}",
  direct:"G.settings.live='ask';advance('match');ACT.goLive();for(let i=0;i<260&&!UI.live.ms.done;i++)liveTick();UI.live.paused=true",
  resultat:"G.lastMatch=advance('match',{noLive:true});UI.mtab='resume';UI.modal={type:'match'}"
};
const SIZES={ordi:[1366,900],tel:[390,844]};
const list=(opt('ecrans')||Object.keys(SCREENS).join(',')).split(',');
fs.mkdirSync(OUT,{recursive:true});
const seeded="(function(seed){let a=seed>>>0;Math.random=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})(42);";
const html0=fs.readFileSync(path.join(JEU,'index.html'),'utf8');
const base='file:///'+JEU.replace(/\\/g,'/')+'/';
const prof=fs.mkdtempSync(path.join(os.tmpdir(),'edge-captures-'));
for(const sc of list){
  // partie de démonstration : 10 jours après le début de saison, puis l'écran demandé
  const setup=`setTimeout(()=>{try{save=cb=>{cb&&cb()};newGame('${CLUB}');G.tuto=-1;G.slot=9;G.settings.live='off';for(let i=0;i<40;i++)advance('day',{noLive:true});${SCREENS[sc]};render();window.scrollTo(0,0)}catch(e){document.body.innerHTML='<pre style="color:red">'+e.stack+'</pre>'}},400);`;
  const html=html0.replace('<head>','<head><base href="'+base+'"><script>'+seeded+'</script>').replace('</body>','<script>'+setup+'</script></body>');
  const f=path.join(OUT,'_'+sc+'.html');fs.writeFileSync(f,html);
  for(const [sz,[w,h]] of Object.entries(SIZES)){
    const png=path.join(OUT,sc+'-'+sz+'.png');
    // Edge sans fenêtre a une largeur minimale (~500 px) : le format téléphone passe par un cadre (iframe) de la bonne largeur
    const fr=path.join(OUT,'_'+sc+'-'+sz+'.html');
    fs.writeFileSync(fr,'<!doctype html><body style="margin:0;background:#000"><iframe src="_'+sc+'.html" style="border:0;width:'+w+'px;height:'+h+'px;display:block"></iframe></body>');
    execFileSync(EDGE,['--headless=new','--user-data-dir='+prof,'--hide-scrollbars','--virtual-time-budget=4000','--window-size='+Math.max(w,520)+','+h,'--screenshot='+png,'file:///'+fr.replace(/\\/g,'/')],{stdio:'ignore'});
    fs.unlinkSync(fr);
    console.log('✓',path.basename(png));
  }
  fs.unlinkSync(f);
}
fs.rmSync(prof,{recursive:true,force:true});
console.log('Captures dans',OUT);
