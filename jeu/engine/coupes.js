'use strict';
// ==== COUPES D'EUROPE (Champions Cup et Challenge Cup) ====
// Poules de 6 : chaque club joue 4 matchs (2 à domicile), contre 4 des 5 autres clubs de sa poule (pas son compatriote).
// Points : victoire 4, nul 2, bonus offensif = au moins 3 essais de plus que l'adversaire, bonus défensif = défaite de 7 points ou moins.
// Phase finale à élimination directe (8es, quarts, demies chez le mieux classé, finale sur terrain neutre).
// Calendrier : les week-ends sans Top 14 (poules en décembre-janvier, phase finale en avril-mai).

// Clubs étrangers (effectifs simplifiés en attendant l'étape « Autres championnats ») : [id, nom, nom court, niveau, championnat, pays]
const EXT0=[
  ['x_bat','Bath Rugby','Bath',80,'prem','ENG'],['x_nor','Northampton Saints','Northampton',78,'prem','ENG'],['x_sar','Saracens','Saracens',77,'prem','ENG'],
  ['x_bri','Bristol Bears','Bristol',77,'prem','ENG'],['x_lei','Leicester Tigers','Leicester',76,'prem','ENG'],['x_sal','Sale Sharks','Sale',75,'prem','ENG'],
  ['x_har','Harlequins','Harlequins',75,'prem','ENG'],['x_glo','Gloucester Rugby','Gloucester',74,'prem','ENG'],['x_exe','Exeter Chiefs','Exeter',72,'prem','ENG'],
  ['x_new','Newcastle Red Bulls','Newcastle',67,'prem','ENG'],
  ['x_lns','Leinster Rugby','Leinster',83,'urc','IRL'],['x_bul','Vodacom Bulls','Bulls',80,'urc','RSA'],['x_gla','Glasgow Warriors','Glasgow',78,'urc','SCO'],
  ['x_sto','DHL Stormers','Stormers',77,'urc','RSA'],['x_mun','Munster Rugby','Munster',76,'urc','IRL'],['x_sha','Hollywoodbets Sharks','Sharks',75,'urc','RSA'],
  ['x_edi','Edinburgh Rugby','Édimbourg',74,'urc','SCO'],['x_uls','Ulster Rugby','Ulster',74,'urc','IRL'],['x_ben','Benetton Rugby','Benetton',73,'urc','ITA'],
  ['x_lio','Emirates Lions','Lions',73,'urc','RSA'],['x_con','Connacht Rugby','Connacht',72,'urc','IRL'],['x_car','Cardiff Rugby','Cardiff',71,'urc','WAL'],
  ['x_osp','Ospreys','Ospreys',70,'urc','WAL'],['x_sca','Scarlets','Scarlets',70,'urc','WAL'],['x_dra','Dragons RFC','Dragons',66,'urc','WAL'],
  ['x_zeb','Zebre Parma','Zebre',66,'urc','ITA'],
  ['x_che','Toyota Cheetahs','Cheetahs',65,'inv','RSA'],['x_bla','Black Lion','Black Lion',66,'inv','GEO']
];
const EXTLG={urc:'URC',prem:'Premiership',inv:'Invité'};
const CTY={ENG:'Angleterre',IRL:'Irlande',SCO:'Écosse',WAL:'Pays de Galles',ITA:'Italie',RSA:'Afrique du Sud',GEO:'Géorgie'};
// Noms des joueurs générés selon le pays (noms courants, sans reprendre de vrais joueurs connus)
const NAMES={
  en:[['Jack','Tom','Harry','Ben','Sam','Joe','Will','Ollie','George','Charlie','Josh','Luke','Alex','Max','Henry','Fraser','Rory','Finn','Ciaran','Conor','Sean','Cian','Jamie','Ross','Gareth','Rhys','Dafydd','Owen','Dan','Ewan','Callum','Niall'],
      ['Smith','Jones','Taylor','Brown','Williams','Wilson','Evans','Thomas','Roberts','Walker','Wright','Hughes','Edwards','Green','Hall','Wood','Murphy','Kelly','Ryan','Byrne','McCarthy','Doyle','Gallagher','Campbell','Stewart','MacDonald','Davies','Morgan','Price','Lewis','Clarke','Harrison','Reid','Quinn']],
  za:[['Pieter','Ruan','Kobus','Jaco','Francois','Eben','Willie','Thabo','Damian','Frans','Andre','Johan','Cobus','Deon','Sbu','Marco','Wian','Gerhard','Lwazi','Kurt'],
      ['van der Merwe','Botha','Smit','Nel','Kriel','de Villiers','Venter','Pretorius','Coetzee','Mostert','Fourie','Swanepoel','Joubert','Visser','Ndlovu','Dlamini','van Wyk','Louw','Engelbrecht','Meyer']],
  it:[['Marco','Luca','Matteo','Andrea','Federico','Tommaso','Giovanni','Lorenzo','Alessandro','Michele','Simone','Paolo','Edoardo','Davide','Riccardo'],
      ['Rossi','Ferrari','Bianchi','Romano','Ricci','Marino','Greco','Bruno','Gallo','Conti','Costa','Fontana','Moretti','Barbieri','Lombardi']],
  ge:[['Giorgi','Levan','Lasha','Beka','Vano','Tornike','Luka','Sandro','Nika','Otar','Davit','Mikheil'],
      ['Kapanadze','Beridze','Japaridze','Lomidze','Abuladze','Tsiklauri','Maisuradze','Gelashvili','Chikvaidze','Kvaratskhelia','Mchedlidze','Datunashvili']]
};
const nameLang=c=>c==='RSA'?'za':c==='ITA'?'it':c==='GEO'?'ge':'en';
const extName=cty=>{const L=NAMES[nameLang(cty)];return R.pick(L[0])+' '+R.pick(L[1])};
function mkExtClub(x){
  const [id,name,short,str,lg,cty]=x;
  const c={id,name,short,str,lg,cty,ext:true,bud:30000,sponsor:0,squad:genSquad(str+3,'t14'),tac:{style:'equilibre',int:'normale'},focus:'equilibre',budget:0,lineup:[],mp:0};
  for(const p of c.squad){p.name=extName(cty);p.nat=CTY[cty]}
  initStaff(c);c.lineup=autoLineup(c);
  return c;
}
function initExt(){G.ext=EXT0.map(mkExtClub)}
// Nouvelle saison : les effectifs simplifiés sont renouvelés
function renewExt(){for(const c of G.ext||[]){const n=mkExtClub([c.id,c.name,c.short,c.str,c.lg,c.cty]);c.squad=n.squad;c.lineup=n.lineup;c.mp=0}}
const lgName=c=>LEAGUES[c.lg]?LEAGUES[c.lg].name:EXTLG[c.lg]||'Nationale';

// ---- Calendrier : les samedis libres du Top 14 ----
function cupDates(){
  const y=seasonYear(),pick=(mo,wk)=>{const yy=mo>=8?y:y+1;let d=firstDow(`${yy}-${String(mo).padStart(2,'0')}-01`,6);for(let i=1;i<wk;i++)d=dAdd(d,7);return d};
  return[pick(12,2),pick(12,3),pick(1,2),pick(1,3),pick(4,1),pick(4,2),pick(4,3),pick(5,1)];
}
// ---- Poules ----
// Une poule = 6 clubs rangés par paires de compatriotes (0-1, 2-3, 4-5) qui ne se rencontrent pas ; 4 journées de 3 matchs.
function poolFixtures(t){
  const pairs=[];for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if(!(j===i+1&&i%2===0))pairs.push([i,j]);
  const rounds=[[],[],[],[]],busy=[new Set(),new Set(),new Set(),new Set()];
  const place=k=>{if(k===pairs.length)return true;const[a,b]=pairs[k];
    for(const r of shuffle([0,1,2,3]))if(!busy[r].has(a)&&!busy[r].has(b)){busy[r].add(a);busy[r].add(b);rounds[r].push([a,b]);if(place(k+1))return true;rounds[r].pop();busy[r].delete(a);busy[r].delete(b)}
    return false};
  place(0);
  // domicile / extérieur : chaque club reçoit 2 fois
  const home=Array(6).fill(0),all=rounds.flat();
  const orient=k=>{if(k===all.length)return true;const m=all[k];
    for(const sw of shuffle([0,1])){const h=sw?m[1]:m[0];if(home[h]<2){home[h]++;m.h=h;m.a=sw?m[0]:m[1];if(orient(k+1))return true;home[h]--}}
    return false};
  orient(0);
  return rounds.map(r=>r.map(m=>({h:t[m.h],a:t[m.a]})));
}
const newRow=id=>({id,j:0,g:0,n:0,p:0,pf:0,pa:0,tf:0,bo:0,pts:0});
function mkPools(groups){return groups.map(t=>{const table={};t.forEach(id=>table[id]=newRow(id));return{teams:t,table,fx:poolFixtures(t)}})}
// Tirage : dans chaque championnat, un club du « chapeau » fort et un du chapeau faible par poule
function drawCups(fr8,fr6){
  const byStr=ids=>[...ids].sort((a,b)=>C(b).str-C(a).str);
  const tiers=(ids,n)=>{const s=byStr(ids),h=s.length/2;const top=shuffle(s.slice(0,h)),bot=shuffle(s.slice(h));return Array.from({length:n},(_,i)=>[top[i],bot[i]])};
  const ext=lg=>byStr((G.ext||[]).filter(c=>c.lg===lg).map(c=>c.id));
  const urc=ext('urc'),prem=ext('prem'),inv=ext('inv');
  const F=tiers(fr8,4),E=tiers(prem.slice(0,8),4),U=tiers(urc.slice(0,8),4);
  const cc=F.map((f,i)=>[...f,...E[i],...U[i]]);
  // Challenge Cup : 6 Français, 8 URC, 2 Premiership, 2 invités → 3 poules de 6
  const F2=tiers(fr6,3),rest=shuffle([...urc.slice(8)]);
  const others=[[rest[0],rest[1],prem[8],inv[0]],[rest[2],rest[3],prem[9],inv[1]],[rest[4],rest[5],rest[6],rest[7]]];
  const ch=F2.map((f,i)=>[...f,...others[i]]);
  return{cc,ch};
}
function mkCup(name,groups,dates,prize){return{name,pools:mkPools(groups),round:0,dates,res:[],ko:null,phase:'pool',champ:null,fin:null,prize}}
// Qualification : les 8 premiers du Top 14 de la saison passée en Champions Cup, les autres en Challenge Cup
function startCups(){
  if(!G.ext)initExt();
  const t14=clubsIn('t14').map(c=>c.id),last=G.lastT14||[];
  const order=[...t14].sort((a,b)=>{const ia=last.indexOf(a),ib=last.indexOf(b);if(ia>=0||ib>=0)return(ia<0?99:ia)-(ib<0?99:ib);return clubStr(C(b))-clubStr(C(a))});
  const fr8=order.slice(0,8),fr6=order.slice(8,14);
  const d=cupDates(),dr=drawCups(fr8,fr6);
  G.cups={cc:mkCup('Champions Cup',dr.cc,d,{part:300,r16:150,qf:250,sf:400,fin:600,win:1500}),
          ch:mkCup('Challenge Cup',dr.ch,d,{part:100,r16:80,qf:120,sf:200,fin:300,win:600})};
  const m=ME();
  for(const k of['cc','ch']){
    const cup=G.cups[k],p=cup.pools.findIndex(x=>x.teams.includes(m.id));
    if(p>=0){const pool=cup.pools[p];m.budget+=cup.prize.part;G.fin.prize+=cup.prize.part;
      mail('Le président',`Tirage de la ${cup.name}`,`Nous sommes dans la <b>poule ${p+1}</b> de la ${cup.name} avec ${pool.teams.filter(id=>id!==m.id).map(id=>`${C(id).name} (${lgName(C(id))})`).join(', ')}.<br><br>Les matchs de poule ont lieu les ${cup.dates.slice(0,4).map(x=>fmtD(x)).join(', ')}. Les 4 premiers de la poule vont en 8es de finale${k==='cc'?', le 5e est reversé en Challenge Cup':''}.<br><br>Prime de participation : ${fmtK(cup.prize.part)}.`,{act:{tab:'cups'}})}
  }
}
// Règles EPCR retenues : bonus offensif à 3 essais d'écart, bonus défensif à 7 points
const cupBonus=r=>[(r.th-r.ta>=3?1:0)+(r.sh<r.sa&&r.sa-r.sh<=7?1:0),(r.ta-r.th>=3?1:0)+(r.sa<r.sh&&r.sh-r.sa<=7?1:0)];
function cupTable(pool,r){
  const h=pool.table[r.h],a=pool.table[r.a];
  h.j++;a.j++;h.pf+=r.sh;h.pa+=r.sa;a.pf+=r.sa;a.pa+=r.sh;h.tf+=r.th;a.tf+=r.ta;
  if(r.sh>r.sa){h.g++;a.p++;h.pts+=4}else if(r.sh<r.sa){a.g++;h.p++;a.pts+=4}else{h.n++;a.n++;h.pts+=2;a.pts+=2}
  h.bo+=r.bo[0];a.bo+=r.bo[1];h.pts+=r.bo[0];a.pts+=r.bo[1];
}
const sortPool=pool=>Object.values(pool.table).sort((x,y)=>y.pts-x.pts||(y.pf-y.pa)-(x.pf-x.pa)||y.tf-x.tf);
// Classement des clubs d'un même rang dans les différentes poules (pour les têtes de série)
const sortSeeds=rows=>rows.sort((x,y)=>y.pts-x.pts||(y.pf-y.pa)-(x.pf-x.pa)||y.tf-x.tf).map(r=>r.id);
// 8es de finale : 1-16, 8-9, 4-13, 5-12, 2-15, 7-10, 3-14, 6-11 (les vainqueurs se retrouvent deux par deux)
const R16=[[0,15],[7,8],[3,12],[4,11],[1,14],[6,9],[2,13],[5,10]];
function setupKO(cup,extra){
  const ranks=[0,1,2,3].map(i=>sortSeeds(cup.pools.map(p=>sortPool(p)[i])));
  const seeds=[].concat(...ranks,extra||[]).slice(0,16);
  cup.ko={seeds,stage:0,next:R16.map(([a,b])=>({h:seeds[a],a:seeds[b]})),res:[]};
  cup.phase='ko';
}
const KONAME=['8es de finale','Quarts de finale','Demi-finales','Finale'];
function cupLabel(cup){return cup.phase==='pool'?`Poules, journée ${cup.round+1}/4`:cup.phase==='ko'?KONAME[cup.ko.stage]:'Terminée'}
// Joue la journée (ou le tour) d'une coupe ; renvoie les résultats
function stepCup(k){
  const cup=G.cups[k],m=ME(),pool=cup.phase==='pool';
  const fx=pool?cup.pools.flatMap(p=>p.fx[cup.round]):cup.ko.next;
  if(!fx.length){cup.round++;return[]}
  const cl=[];fx.forEach(f=>cl.push(C(f.h),C(f.a)));cl.forEach(setMatchLineup);
  const out=playFixtures(fx,!pool);
  for(const r of out){r.bo=cupBonus(r);r.cup=cup.name;r.ko=!pool}
  if(pool){for(const r of out)cupTable(cup.pools.find(p=>p.teams.includes(r.h)),r);cup.res.push({r:cup.round,m:out.map(slimR)});cup.round++;return out}
  // phase finale
  const ko=cup.ko,w=out.map(r=>r.winner),seed=id=>ko.seeds.indexOf(id);
  ko.res.push({stage:ko.stage,m:out.map(slimR)});
  const mine=out.find(r=>involves(r,m.id));
  if(mine){
    if(mine.winner===m.id&&ko.stage<3){const pr=cup.prize[['qf','sf','fin'][ko.stage]];m.budget+=pr;G.fin.prize+=pr;addNews(`${cup.name} : qualifié pour les ${KONAME[ko.stage+1].toLowerCase()} (prime ${fmtK(pr)}).`)}
    else if(mine.winner!==m.id)addNews(`${cup.name} : éliminé en ${KONAME[ko.stage].toLowerCase()}.`);
  }
  if(ko.stage<3){
    const nx=[];for(let i=0;i<w.length;i+=2){const a=w[i],b=w[i+1],[h,x]=seed(a)<=seed(b)?[a,b]:[b,a];nx.push({h,a:x,neutral:ko.stage===2})}
    ko.next=nx;ko.stage++;
  }else{
    cup.champ=w[0];cup.fin=out[0].h===w[0]?out[0].a:out[0].h;cup.phase='done';ko.next=[];
    addNews(`🏆 ${C(cup.champ).name} remporte la ${cup.name} !`);
    if(cup.champ===m.id){m.budget+=cup.prize.win;G.fin.prize+=cup.prize.win;addNews(`🏆 TU REMPORTES LA ${cup.name.toUpperCase()} ! Prime : ${fmtK(cup.prize.win)}.`)}
  }
  cup.round++;
  return out;
}
// Appelé chaque jour : joue les coupes dont la date est arrivée ; renvoie le match du joueur s'il en avait un
function cupDay(){
  if(!G.cups)return null;
  const m=ME();let mine=null,all=[];
  for(const k of['cc','ch']){
    const cup=G.cups[k];if(cup.phase==='done'||!cup.dates[cup.round]||cup.dates[cup.round]>G.date)continue;
    const out=stepCup(k);all=all.concat(out);
    const r=out.find(x=>involves(x,m.id));if(r)mine=r;
  }
  // fin des poules : 8es de finale (les 5es de Champions Cup rejoignent la Challenge Cup)
  const cc=G.cups.cc,ch=G.cups.ch;
  if(cc.phase==='pool'&&cc.round===4&&ch.round===4){
    const fifth=sortSeeds(cc.pools.map(p=>sortPool(p)[4]));
    setupKO(cc);setupKO(ch,fifth);
    for(const k of['cc','ch']){const cup=G.cups[k];if(cup.ko.seeds.includes(m.id)){const pr=cup.prize.r16;m.budget+=pr;G.fin.prize+=pr;
      const f=cup.ko.next.find(x=>involves(x,m.id));mail('Directeur sportif',`${cup.name} : qualifiés pour les 8es !`,`Nous sommes ${cup.ko.seeds.indexOf(m.id)+1}e tête de série. 8e de finale le ${fmtD(cup.dates[4])} ${f.h===m.id?'à domicile contre':'chez'} ${C(f.h===m.id?f.a:f.h).name}. Prime : ${fmtK(pr)}.`,{act:{tab:'cups'}})}}
    if(cc.pools.some(p=>p.teams.includes(m.id))&&!cc.ko.seeds.includes(m.id))addNews(fifth.includes(m.id)?'Champions Cup : 5e de poule, reversé en 8es de Challenge Cup.':'Champions Cup : éliminé en phase de poules.');
  }
  if(mine)mine.others=all.map(slimR);
  return mine;
}
// Prochain match de coupe du joueur : {f, d, ko, cup}
function myCupMatch(){
  if(!G.cups||G.phase!=='season')return null;
  const m=ME();let best=null;
  for(const k of['cc','ch']){
    const cup=G.cups[k];if(cup.phase==='done')continue;
    let f=null;
    if(cup.phase==='pool'){const p=cup.pools.find(p=>p.teams.includes(m.id));if(p)f=p.fx[cup.round].find(x=>involves(x,m.id))}
    else f=cup.ko.next.find(x=>involves(x,m.id));
    if(f&&(!best||cup.dates[cup.round]<best.d))best={f,d:cup.dates[cup.round],ko:cup.phase==='ko',cup:k,lab:`${cup.name} · ${cupLabel(cup)}`};
  }
  return best;
}
