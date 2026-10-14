// Génère les effectifs étrangers du jeu à partir de la recherche (recherche/etranger/) :
//   effectifs-brut.json (URC, Premiership : 2026-27) et effectifs-brut-sud.json (Japon 2026-27, Super Rugby 2026), tirés de Wikipédia
//   notes-internationaux.json et notes-sud.json (notes des internationaux, données une par une)
// Un joueur présent à plusieurs endroits n'est gardé qu'une fois : France (REAL) > URC/Premiership > Japon > Super Rugby.
// Écrit recherche/etranger/effectifs/<club>.json et jeu/data/etranger.js (REALX).
// Utilisation : node outils/generer-etranger.js
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),RE=path.join(ROOT,'recherche','etranger');
const rd=f=>JSON.parse(fs.readFileSync(path.join(RE,f),'utf8'));
const brut={...rd('effectifs-brut.json'),...rd('effectifs-brut-sud.json')};
const N1=rd('notes-internationaux.json'),N2=rd('notes-sud.json'),notes={...N1,...N2};
// niveau des clubs (même échelle que le jeu) : sert à estimer les non-internationaux
const STR={x_bat:80,x_nor:78,x_sar:77,x_bri:77,x_lei:76,x_sal:75,x_har:75,x_glo:74,x_exe:72,x_new:67,x_lns:83,x_bul:80,x_gla:78,x_sto:77,x_mun:76,x_sha:75,x_edi:74,x_uls:74,x_ben:73,x_lio:76,x_con:72,x_car:71,x_osp:70,x_sca:70,x_dra:66,x_zeb:66,
  s_chi:80,s_cru:79,s_hur:79,s_blu:78,s_bru:76,s_red:75,s_hig:73,s_war:72,s_for:71,s_dru:71,
  j_kub:77,j_tos:77,j_wkn:76,j_sun:75,j_ver:75,j_kob:74,j_brv:73,j_eag:73,j_blr:72,j_dro:71,j_hon:70,j_dyn:70};
const ESTK=id=>id.startsWith('j_')?-11:-10; // les non-internationaux japonais sont un peu en dessous
const SAB=['x_bul','x_sto','x_sha','x_lio']; // Afrique du Sud : réservoir très profond
const MIN={PIL:6,TAL:3,'2L':4,'3L':6,DM:3,OUV:2,CEN:4,AIL:4,ARR:2},MAX=46;
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967296};
const kick=new Set([...N1._buteurs,...N2._buteurs]),pace=new Set([...N1._rapides,...N2._rapides]);
const STRP={PIL:'mel',TAL:'tou',ARR:'pie',OUV:'pas',DM:'pas'};
// dédoublonnage
const french=fs.readFileSync(path.join(ROOT,'jeu','data','joueurs.js'),'utf8');
const prio=id=>id.startsWith('x_')?1:id.startsWith('j_')?2:3,owner=new Map();
for(const id of Object.keys(brut).sort((a,b)=>prio(a)-prio(b)))for(const p of brut[id]){if(!owner.has(p.n)&&!french.includes(`["${p.n}",`))owner.set(p.n,id)}
const out={},miss=[];let nInt=0,nEst=0,nDup=0;
fs.mkdirSync(path.join(RE,'effectifs'),{recursive:true});
for(const [id,list] of Object.entries(brut)){
  const Nn=notes[id]||{},used=new Set(),rows=[];
  for(const p of list){
    if(owner.get(p.n)!==id||used.has('§'+p.n)){nDup++;continue}
    used.add('§'+p.n);
    const age=p.by?2026-p.by:22,aj=age<=19?-7:age<=20?-5:age<=21?-3:age<=22?-2:age<=30?0:age<=33?-1:-3;
    let rt,unsure,ev,pos=p.pos,v=Nn[p.n];
    if(v!=null){if(Array.isArray(v)){pos=v[1];v=v[0]}rt=v;used.add(p.n);unsure=false;ev=`${p.intl?'International ('+p.nat+')':'Joueur'} ; note estimée sur ses saisons 2023-26 et son statut en sélection.`;nInt++}
    else{rt=Math.round(STR[id]+ESTK(id)+aj+(hash(p.n)-.5)*4+(p.intl?4:0)+(SAB.includes(id)?3:0));unsure=true;ev=`${p.intl?'International ('+p.nat+'), ':''}note estimée selon le niveau du club et l'âge${p.by?'':' (âge inconnu, ~22 ans)'}.`;nEst++}
    rows.push({n:p.n,pos,sub:pos==='PIL'?(hash(p.n+'s')<.5?'LH':'TH'):pos,by:p.by||2004,nat:p.nat,caps:0,recent:p.intl?1:0,rt:Math.max(50,Math.min(95,rt)),ev,
      tags:(kick.has(p.n)?'k':'')+(pace.has(p.n)?'v':''),str:Nn[p.n]!=null&&STRP[pos]?[STRP[pos]]:[],weak:[],unsure,intl:p.intl,capt:p.capt});
  }
  for(const n of Object.keys(Nn))if(!n.startsWith('_')&&!used.has(n)&&owner.get(n)===id)miss.push(id+' : '+n);
  // au moins 2 arrières : les ailiers non notés un par un passent arrières si besoin (Super Rugby : « outside backs »)
  for(const r of rows.filter(r=>r.pos==='AIL'&&r.unsure).sort((a,b)=>b.rt-a.rt)){if(rows.filter(x=>x.pos==='ARR').length>=2)break;r.pos='ARR';r.sub='ARR'}
  // 46 joueurs au plus : les minimums par poste, puis les meilleurs
  const keep=new Set(),by=g=>rows.filter(r=>r.pos===g).sort((a,b)=>b.rt-a.rt);
  for(const g in MIN)by(g).slice(0,MIN[g]).forEach(r=>keep.add(r));
  for(const r of [...rows].sort((a,b)=>b.rt-a.rt)){if(keep.size>=MAX)break;keep.add(r)}
  const squad=rows.filter(r=>keep.has(r));
  fs.writeFileSync(path.join(RE,'effectifs',id+'.json'),JSON.stringify(squad,null,1));
  out[id]=squad.map(r=>[r.n,r.pos,r.sub,r.by,r.nat,0,r.recent,r.rt,r.tags,r.ev,r.str.join(','),'',r.intl?1:0,r.capt?1:0]);
}
fs.writeFileSync(path.join(ROOT,'jeu','data','etranger.js'),`'use strict';
// ==== EFFECTIFS ÉTRANGERS (URC, Premiership, Super Rugby, Japon) — généré par outils/generer-etranger.js depuis recherche/etranger/ ====
// Même format que REAL, plus [12] international (0/1) et [13] capitaine (0/1). Le nombre de sélections n'est pas connu (0).
const REALX=${JSON.stringify(out)};
`);
console.log('REALX :',Object.keys(out).length,'clubs,',Object.values(out).reduce((n,l)=>n+l.length,0),'joueurs gardés ·',nInt,'notés un par un,',nEst,'estimés,',nDup,'doublons écartés');
if(miss.length)console.log('Notes sans joueur trouvé :',miss.join(' | '));
