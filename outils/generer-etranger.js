// Génère les effectifs étrangers (URC, Premiership) du jeu à partir de la recherche :
//   recherche/etranger/effectifs-brut.json (effectifs 2026-27 de Wikipédia : nom, poste, nation, international, année de naissance)
//   recherche/etranger/notes-internationaux.json (notes des internationaux)
// Écrit recherche/etranger/effectifs/<club>.json (même format que la recherche du Top 14) et jeu/data/etranger.js (REALX).
// Utilisation : node outils/generer-etranger.js
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),RE=path.join(ROOT,'recherche','etranger');
const brut=JSON.parse(fs.readFileSync(path.join(RE,'effectifs-brut.json'),'utf8'));
const notes=JSON.parse(fs.readFileSync(path.join(RE,'notes-internationaux.json'),'utf8'));
// niveau des clubs (même échelle que le jeu) : sert à estimer les non-internationaux
const STR={x_bat:80,x_nor:78,x_sar:77,x_bri:77,x_lei:76,x_sal:75,x_har:75,x_glo:74,x_exe:72,x_new:67,x_lns:83,x_bul:80,x_gla:78,x_sto:77,x_mun:76,x_sha:75,x_edi:74,x_uls:74,x_ben:73,x_lio:76,x_con:72,x_car:71,x_osp:70,x_sca:70,x_dra:66,x_zeb:66};
const MIN={PIL:6,TAL:3,'2L':4,'3L':6,DM:3,OUV:2,CEN:4,AIL:4,ARR:2},MAX=46;
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967296};
const kick=new Set(notes._buteurs),pace=new Set(notes._rapides);
const STRP={PIL:'mel',TAL:'tou',ARR:'pie',OUV:'pas',DM:'pas'}; // point fort par défaut selon le poste (internationaux)
const out={},miss=[];let nInt=0,nEst=0;
fs.mkdirSync(path.join(RE,'effectifs'),{recursive:true});
for(const [id,list] of Object.entries(brut)){
  const N=notes[id]||{},used=new Set();
  const rows=list.map(p=>{
    const age=p.by?2026-p.by:22,aj=age<=19?-7:age<=20?-5:age<=21?-3:age<=22?-2:age<=30?0:age<=33?-1:-3;
    let rt,unsure,ev;
    if(N[p.n]!=null){rt=N[p.n];used.add(p.n);unsure=false;ev=`${p.intl?'International ('+p.nat+')':'Joueur'} ; note estimée sur ses saisons 2023-26 et son statut en sélection.`;nInt++}
    // (clubs sud-africains : réservoir très profond, beaucoup de non-internationaux aux portes des Springboks)
    else{rt=Math.round(STR[id]-10+aj+(hash(p.n)-.5)*4+(p.intl?4:0)+(['x_bul','x_sto','x_sha','x_lio'].includes(id)?3:0));unsure=true;ev=`${p.intl?'International ('+p.nat+'), ':''}note estimée selon le niveau du club et l'âge${p.by?'':' (âge inconnu, ~22 ans)'}.`;nEst++}
    const tags=(kick.has(p.n)?'k':'')+(pace.has(p.n)?'v':'');
    const sub=p.pos==='PIL'?(hash(p.n+'s')<.5?'LH':'TH'):p.pos;
    return{n:p.n,pos:p.pos,sub,by:p.by||2004,nat:p.nat,caps:0,recent:p.intl?1:0,rt:Math.max(50,Math.min(95,rt)),ev,tags,str:N[p.n]!=null&&STRP[p.pos]?[STRP[p.pos]]:[],weak:[],unsure,intl:p.intl,capt:p.capt};
  });
  for(const n of Object.keys(N))if(!used.has(n))miss.push(id+' : '+n);
  // 46 joueurs au plus : les minimums par poste, puis les meilleurs
  const keep=new Set(),by=g=>rows.filter(r=>r.pos===g).sort((a,b)=>b.rt-a.rt);
  for(const g in MIN)by(g).slice(0,MIN[g]).forEach(r=>keep.add(r));
  for(const r of [...rows].sort((a,b)=>b.rt-a.rt)){if(keep.size>=MAX)break;keep.add(r)}
  const squad=rows.filter(r=>keep.has(r));
  fs.writeFileSync(path.join(RE,'effectifs',id+'.json'),JSON.stringify(squad,null,1));
  out[id]=squad.map(r=>[r.n,r.pos,r.sub,r.by,r.nat,0,r.recent,r.rt,r.tags,r.ev,r.str.join(','),'',r.intl?1:0,r.capt?1:0]);
}
fs.writeFileSync(path.join(ROOT,'jeu','data','etranger.js'),`'use strict';
// ==== EFFECTIFS ÉTRANGERS 2026-27 (URC, Premiership) — généré par outils/generer-etranger.js depuis recherche/etranger/ ====
// Même format que REAL, plus [12] international (0/1) et [13] capitaine (0/1). Le nombre de sélections n'est pas connu (0).
const REALX=${JSON.stringify(out)};
`);
console.log('REALX :',Object.keys(out).length,'clubs,',Object.values(out).reduce((n,l)=>n+l.length,0),'joueurs gardés ·',nInt,'notés un par un,',nEst,'estimés');
if(miss.length)console.log('Noms des notes introuvables dans les effectifs :',miss.join(' | '));
