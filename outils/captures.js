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
