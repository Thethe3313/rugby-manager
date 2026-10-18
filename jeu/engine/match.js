'use strict';
// ==== MOTEUR DE MATCH (phase par phase) ====
// Le match avance action par action, comme un vrai match : coup d'envoi, temps de jeu (porteur → plaquage → ruck),
// jeu au pied, touche, mêlée, ballon porté, pénalité. Chaque action utilise les attributs des joueurs concernés,
// leur fraîcheur (énergie) et les consignes de l'équipe.
// Le même moteur sert au match en direct (une action à la fois, `matchStep`) et aux matchs simulés d'un coup (`simMatch`).
// Terrain : x = distance (m) depuis l'en-but de l'équipe qui reçoit (0 à 100), y = largeur (0 à 70).

// ---- Consignes ----
const KICKS={main:{n:'À la main (garder le ballon)',k:.5},mixte:{n:'Équilibré',k:1},pied:{n:'Au pied (jeu d\'occupation)',k:1.6}};
const PENS={auto:'L\'équipe décide',points:'Prendre les points',touche:'Jouer la touche',melee:'Choisir la mêlée',vite:'Jouer vite à la main'};
// Intensité : performance, fatigue, blessures et fautes
const INTK={basse:{perf:.965,tire:.75,inj:.7,pen:.88},normale:{perf:1,tire:1,inj:1,pen:1},haute:{perf:1.035,tire:1.35,inj:1.5,pen:1.15}};
// Poids par place sur le terrain (index 0 = n°1 … 14 = n°15) : qui porte le ballon, qui plaque, qui gratte au sol
const WCAR=[1,1,1,1.1,1.1,1.4,1.4,1.8,.35,.6,1,1.5,1.5,1,.9];
const WTAC=[1,1.1,1,1.3,1.3,1.7,1.8,1.5,.8,.9,.8,1.4,1.4,.8,.6];
const WJAC=[.5,1.2,.5,.6,.6,2.5,3,1.5,.2,.1,.1,.6,.4,.1,.1];
// Minute d'entrée prévue des remplaçants selon leur poste (± quelques minutes)
const SUBMIN={PIL:50,TAL:52,'2L':55,'3L':58,DM:60,OUV:65,CEN:64,AIL:66,ARR:66};
// Fin de chaque période (en secondes) : 1re mi-temps, 2e mi-temps, prolongations
const PEND=[0,2400,4800,5400,6000],PMIN=[0,40,80,90,100];

function tacOf(c){const t=c.tac||{};return{style:t.style||'equilibre',int:t.int||'normale',kick:t.kick||'mixte',pen:t.pen||'auto'}}
// Les clubs IA adaptent leur style à leur effectif
function aiTac(c){const t=teamCalc(c);return{style:t.pack>t.backs+3?'conquete':t.backs>t.pack+3?'mouvement':'equilibre',int:'normale',kick:'mixte',pen:'auto'}}

// ---- Petits outils ----
const nm=(ms,i)=>ms.clubs[i].short;
const paOf=(ms,i)=>i===0?ms.x:100-ms.x; // position vue par l'équipe i (0 = sa ligne, 100 = ligne adverse)
function setPa(ms,i,v){v=clamp(v,0,100);ms.x=i===0?v:100-v}
const active=S=>S.on.filter(d=>d&&!d.sin);
const byNo=(list,n)=>list.find(d=>d.slot===n-1)||null;
const best=(list,k)=>list.reduce((b,d)=>!b||d.p[k]>b.p[k]?d:b,null);
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
function pickW(arr,w){
  let tot=0;const ws=arr.map(x=>{const v=Math.max(0,w(x));tot+=v;return v});
  if(!arr.length)return null;if(!tot)return R.pick(arr);
  let r=R.f()*tot;for(let i=0;i<arr.length;i++){r-=ws[i];if(r<=0)return arr[i]}return arr[arr.length-1];
}
function fitAt(p,k){return posFit(p,SLOTS[k])}
// Valeur d'un attribut pendant le match : poste, forme du jour, énergie restante, intensité, avantage du terrain
// (une équipe qui mène largement relâche un peu son effort, une équipe menée de plus d'un essai pousse plus fort)
const scoreK=lead=>lead>10?1-Math.min(.08,(lead-10)*.006):lead<-7?1+Math.min(.05,(-lead-7)*.004):1;
function A(ms,d,k){
  const S=ms.T[d.side];
  // la détermination du joueur renforce la réaction quand son équipe est menée
  const lead=ms.sc[d.side]-ms.sc[1-d.side],dk=.6+(d.p.det||10)/25;
  const rush=lead<0&&lead>=-7&&ms.t>=PEND[ms.half]-720&&ms.half!==1?1+.025*dk:1;
  let sk=scoreK(lead);if(sk>1)sk=1+(sk-1)*dk;
  return d.p[k]*d.fit*d.fm*(.76+.24*d.en/100)*INTK[S.tac.int].perf*S.day*S.mor*S.capK*(d.side===0&&!ms.opt.neutral?1.055:1)*sk*rush;
}
function kickerOf(ms,i){const a=active(ms.T[i]),S=ms.T[i],kd=S.kickId&&a.find(d=>d.p.id===S.kickId);if(kd)return kd;return best(a.filter(d=>d.slot===8||d.slot===9||d.slot===14),'but')||best(a,'but')}
function coverOf(ms,i){const b=active(ms.T[i]).filter(d=>d.slot>=10);return b.length?Math.max(...b.map(d=>.6*A(ms,d,'vit')+.4*A(ms,d,'pla'))):8}

// ---- Création du match ----
function newMatch(hc,ac,opt={}){
  const ms={clubs:[hc,ac],opt,t:0,half:1,x:50,y:35,sc:[0,0],tr:[0,0],pn:[0,0],dr:[0,0],cv:[0,0],P:{},ev:[],step:[],now:'',
    next:{k:'kickoff',team:0},dead:false,phase:0,quick:false,counter:false,tap:false,fromSet:false,terr:[0,0],done:false,
    view:{k:'kickoff',a:0},key:false,pause:false,winner:null,so:false};
  ms.T=[mkSide(ms,hc,0),mkSide(ms,ac,1)];
  const date=opt.date||G.date;ms.wx=opt.wx||weatherFor(date,hc);ms.ref=opt.ref||refFor(date,hc);
  for(const S of ms.T){S.capMain=S.club.captain&&S.on.some(d=>d&&d.p.id===S.club.captain)?S.club.captain:null;updateCaptain(ms,S)}
  // discours d'avant-match : celui du joueur (G.talk, motivant par défaut) ; les clubs IA motivent leurs joueurs aussi bien en moyenne
  for(const S of ms.T){if(S.club.id===G.meId){applyTalk(ms,S.i,G.talk||'motive',true);delete G.talk;if(G.postMor){S.mor*=1+G.postMor/100;delete G.postMor}}else if(S.club.id!==G.meId)S.mor=clamp(1+R.n(.018,.008),.99,1.04)}
  evt(ms,-1,'info',`Coup d'envoi : ${hc.short} - ${ac.short}.`,1);
  return ms;
}
function mkSide(ms,club,i){
  // day = forme collective du jour (une équipe peut passer à côté de son match, ou être dans un grand jour)
  const S={i,club,tac:club.id===G.meId?tacOf(club):aiTac(club),on:Array(15).fill(null),bench:[],auto:true,day:clamp(R.n(1,.03),.92,1.08),mor:1,capK:1,capId:null,kickId:club.kicker||null,disc:1,
    st:{pos:0,tac:0,mt:0,car:0,m:0,cle:0,rk:0,to:0,pc:0,mel:0,melW:0,tou:0,touW:0,err:0,kick:0,yc:0,off:0}};
  (club.lineup||[]).forEach((id,k)=>{
    const p=id!=null&&club.squad.find(x=>x.id===id);if(!p||ms.P[p.id])return;
    const d={p,side:i,no:k+1,slot:k<15?k:-1,ls:k<15?k:-1,fit:1,en:100,fm:.78+.22*clamp(p.forme,0,100)/100,start:k<15,used:false,
      secs:0,sin:0,inj:false,plan:(SUBMIN[p.g]||60)+R.i(-5,5),s:{tac:0,mt:0,car:0,m:0,cle:0,to:0,pen:0,es:0,pts:0,err:0,tw:0,off:0,yc:0}};
    ms.P[p.id]=d;
    if(k<15){d.fit=fitAt(p,k);S.on[k]=d}else S.bench.push(d);
  });
  return S;
}

// ---- Événements (commentaire) : lv 0 = action courante, 1 = notable, 2 = temps fort ----
function evt(ms,ti,k,x,lv){
  const m=Math.min(Math.floor(ms.t/60)+1,PMIN[ms.half]);
  const scoring=k==='try'||k==='conv'||k==='pen'||k==='drop';
  const e={m,ti,k,x:x+(scoring?`  (${ms.sc[0]}-${ms.sc[1]})`:'')};
  if(lv>=1)ms.ev.push(e);
  ms.step.push({...e,lv});ms.now=e.x;
  if(lv>=2)ms.key=true;
}

// ---- Une action ----
function matchStep(ms){
  if(ms.done)return;
  ms.key=false;ms.step=[];
  const end=PEND[ms.half];
  if(ms.t>=end&&(ms.dead||ms.t>=end+420)){periodEnd(ms);return}
  ms.dead=false;
  const n=ms.next,a=n.team;
  let dt;
  switch(n.k){
    case'kickoff':dt=doKickoff(ms,a);break;
    case'scrum':dt=doScrum(ms,a);break;
    case'lineout':dt=doLineout(ms,a);break;
    case'pen':dt=doPenalty(ms,a);break;
    default:dt=doPhase(ms,a);
  }
  ms.T[a].st.pos+=dt;ms.terr[ms.x>50?0:1]+=dt;
  ms.t+=dt;
  tickPlayers(ms,dt);
  for(const i of[0,1])autoSubs(ms,i);
}
function periodEnd(ms){
  const sc=()=>`${ms.clubs[0].short} ${ms.sc[0]} - ${ms.sc[1]} ${ms.clubs[1].short}`;
  const restart=(t,k)=>{ms.t=t;ms.next={k:'kickoff',team:k};ms.x=50;ms.y=35;ms.dead=false;ms.phase=0;ms.view={k:'kickoff',a:k};
    for(const S of ms.T)for(const d of S.on)if(d)d.en=Math.min(100,d.en+5)};
  if(ms.half===1){ms.half=2;restart(PEND[1],1);evt(ms,-1,'half',`Mi-temps : ${sc()}`,1);ms.pause=true;return}
  if(ms.half===2&&ms.opt.ko&&ms.sc[0]===ms.sc[1]){ms.half=3;restart(PEND[2],0);evt(ms,-1,'half',`Égalité à la fin du temps réglementaire (${sc()}) : prolongation de 2 × 10 minutes !`,2);ms.pause=true;return}
  if(ms.half===3){ms.half=4;restart(PEND[3],1);evt(ms,-1,'half',`Fin de la première prolongation : ${sc()}`,1);return}
  if(ms.opt.ko&&ms.sc[0]===ms.sc[1]){
    // toujours à égalité : le plus d'essais marqués, sinon une séance de tirs au but
    if(ms.tr[0]!==ms.tr[1])ms.winner=ms.tr[0]>ms.tr[1]?0:1;
    else{const k0=kickerOf(ms,0),k1=kickerOf(ms,1),b0=k0?A(ms,k0,'but'):10,b1=k1?A(ms,k1,'but'):10;ms.winner=R.f()<.5+(b0-b1)/30?0:1;ms.so=true}
    evt(ms,ms.winner,'info',`${nm(ms,ms.winner)} se qualifie ${ms.so?'aux tirs au but':'grâce au nombre d\'essais marqués'} !`,2);
  }
  ms.done=true;
  evt(ms,-1,'half',`Fin du match : ${sc()}`,1);
}
function tickPlayers(ms,dt){
  for(const S of ms.T)updateCaptain(ms,S);
  for(const S of ms.T){
    const tire=INTK[S.tac.int].tire;
    for(const d of S.on){
      if(!d)continue;
      if(d.sin){if(ms.t>=d.sin){d.sin=0;evt(ms,S.i,'info',`Retour de ${d.p.name} sur le terrain (${S.club.short}).`,1)}continue}
      d.secs+=dt;
      d.en=Math.max(5,d.en-dt/60*(d.slot<8?.62:.45)*tire*(1.5-d.p.end/20));
    }
  }
}
// Contact : fatigue et risque de blessure (plus élevé quand on est fatigué ou à haute intensité)
function contact(ms,d,cost){
  if(!d||d.slot<0)return;
  d.en=Math.max(5,d.en-cost);
  if(R.f()<.0008*INTK[ms.T[d.side].tac.int].inj*injRiskK(ms.T[d.side].club)*(.8+(100-d.en)/150)*(d.p.forme<75?1+(75-d.p.forme)/60:1))injure(ms,d); // un joueur fatigué se blesse plus
}
function injure(ms,d){
  const S=ms.T[d.side];if(d.inj||d.slot<0)return;
  d.inj=true;
  evt(ms,S.i,'inj',`${d.p.name} (${S.club.short}) se blesse et doit sortir.`,2);
  const b=bestBench(S,d.slot);
  if(b)doSub(ms,S,d,b,true);
  else{S.on[d.slot]=null;d.slot=-1;evt(ms,S.i,'info',`Plus de remplaçant : ${S.club.short} termine à ${active(S).length}.`,1)}
}
function bestBench(S,k){
  let bb=null,bv=-1;
  for(const b of S.bench){if(b.used)continue;const s=SLOTS[k],v=ovrAt(b.p,s[3].includes(b.p.g)?b.p.g:s[1])*fitAt(b.p,k);if(v>bv){bv=v;bb=b}}
  return bb;
}
function doSub(ms,S,out,inn,forced){
  const k=out.slot;if(k<0||inn.used)return false;
  inn.slot=k;inn.ls=k;inn.fit=fitAt(inn.p,k);inn.used=true;S.on[k]=inn;
  out.slot=-1;
  S.bench=S.bench.filter(x=>x!==inn);
  evt(ms,S.i,'sub',forced?`${inn.p.name} entre à la place de ${out.p.name} (${S.club.short}).`:`Remplacement ${S.club.short} : ${inn.p.name} remplace ${out.p.name}.`,1);
  return true;
}
// Remplacements automatiques (clubs IA, ou l'adjoint si le joueur le laisse faire)
function autoSubs(ms,i){
  const S=ms.T[i];if(!S.auto||ms.half<2||ms.done)return;
  const min=ms.t/60,blow=Math.abs(ms.sc[0]-ms.sc[1])>=25?8:0;
  if(Math.floor(min)===S.chk)return;S.chk=Math.floor(min); // une vérification par minute suffit
  for(const b of [...S.bench]){
    if(b.used)continue;
    const cands=S.on.filter(d=>d&&!d.sin&&d.start&&fitAt(b.p,d.slot)>=.94);
    if(!cands.length)continue;
    const t=cands.reduce((x,y)=>y.en<x.en?y:x);
    if(min>=b.plan-blow||(t.en<38&&min>=45))doSub(ms,S,t,b,false);
  }
}

// ---- Coup d'envoi ----
function doKickoff(ms,k){
  const r=1-k;ms.phase=0;ms.quick=false;ms.tap=false;ms.view={k:'kickoff',a:k};
  const u=R.f();
  if(u<.03){setPa(ms,r,50);ms.y=35;ms.next={k:'scrum',team:r};evt(ms,k,'info',`Coup d'envoi directement en touche : mêlée pour ${nm(ms,r)} au centre.`,0);return 20}
  if(u<.12){
    const c=pickW(active(ms.T[k]),d=>d.slot>=3&&d.slot<=7?2:d.slot>=10?1:.2);
    setPa(ms,k,R.i(52,60));ms.y=R.i(10,60);ms.next={k:'play',team:k};
    evt(ms,k,'info',`Coup d'envoi récupéré par ${c?c.p.name:'?'} (${nm(ms,k)}) !`,1);return 15;
  }
  setPa(ms,r,R.i(12,28));ms.y=R.i(10,60);ms.next={k:'play',team:r};ms.counter=true;
  evt(ms,k,'info',`Coup d'envoi de ${nm(ms,k)}, réception de ${nm(ms,r)}.`,0);
  return 12;
}

// ---- Jeu courant : l'équipe en possession choisit entre jouer, taper ou tenter le drop ----
function doPhase(ms,a){
  const d=1-a,S=ms.T[a],p=paOf(ms,a),tac=S.tac,lead=ms.sc[a]-ms.sc[d];
  const end=PEND[ms.half],over=ms.t>=end,finalHalf=ms.half===2||ms.half===4;
  // temps écoulé : l'équipe qui mène (ou qui est dans son camp à la pause) sort le ballon
  if(over&&((finalHalf&&lead>0)||(!finalHalf&&p<55))){
    ms.dead=true;ms.next={k:'lineout',team:d};ms.view={k:'kick',a};
    evt(ms,a,'info',`${nm(ms,a)} envoie le ballon en touche${finalHalf?' : c\'est terminé !':' : c\'est la pause.'}`,1);return 5;
  }
  let pd=0;
  if(p>=58&&p<=80&&ms.phase>=2){pd=.01*STY[tac.style].drop;if(ms.t>=end-600&&lead<=0&&lead>=-3)pd*=5;if(over&&lead<=0&&lead>=-3)pd=.5}
  if(R.f()<pd)return doDrop(ms,a);
  let pk=(p<22?.5:p<40?.28:p<55?.14:p<75?.04:.012)*WX[ms.wx].kick;
  pk*=KICKS[tac.kick].k*(tac.style==='pied'?1.35:tac.style==='mouvement'?.8:1);
  if(ms.counter)pk*=1.3;
  if(ms.phase>=8&&p<50)pk*=1.5;
  if(ms.t>=end-300&&lead<0)pk*=.15;
  if(R.f()<pk)return doKick(ms,a);
  return doCarry(ms,a);
}
function doCarry(ms,a){
  const d=1-a,S=ms.T[a],D=ms.T[d],p=paOf(ms,a),st=S.tac.style,att=active(S),def=active(D);
  const fs=(st==='conquete'?.64:st==='mouvement'?.42:.53)+(p>94?.3:p>85?.12:0)-(ms.fromSet?.25:0);
  const fwd=R.f()<fs;
  const car=pickW(att,x=>(x.slot<8)===fwd?WCAR[x.slot]:0);
  const tk=pickW(def,x=>WTAC[x.slot]*((x.slot<8)===(car.slot<8)?1.6:1));
  const bonus=(ms.quick?.6:0)+(ms.counter&&car.slot>=10?.8:0)+(ms.tap?1:0);
  ms.quick=false;ms.counter=false;ms.tap=false;ms.fromSet=false;
  ms.view={k:'open',a,c:car.p.id};ms.y=clamp(ms.y+R.n(0,9),4,66);
  car.s.car++;S.st.car++;
  // en-avant
  if(R.f()<.035*(1+(12-car.p.mai)/30)*(st==='mouvement'?1.2:st==='conquete'?.85:1)*WX[ms.wx].err){
    car.s.err++;S.st.err++;ms.next={k:'scrum',team:d};
    evt(ms,a,'info',`En-avant de ${car.p.name} (${nm(ms,a)}). Mêlée pour ${nm(ms,d)}.`,0);return 10;
  }
  const cv=.3*A(ms,car,'pui')+.25*A(ms,car,'evi')+.2*A(ms,car,'vit')+.15*A(ms,car,'mai')+.1*A(ms,car,'dec');
  const tv=tk?.5*A(ms,tk,'tac')+.25*A(ms,tk,'pla')+.25*A(ms,tk,'pui'):0;
  const short=15-def.length;
  const pMade=tk?clamp(.87+(tv-cv-bonus)*.016-short*.05,.68,.965):0;
  contact(ms,car,.6);
  let gain,brk=false,missed=false;
  if(R.f()<pMade){
    tk.s.tac++;D.st.tac++;contact(ms,tk,.5);
    // plaquage dangereux : pénalité et carton
    if(R.f()<.0011*(.6+tk.p.eng/25))return foul(ms,d,tk,'plaquage dangereux',8,true);
    gain=car.slot<8?R.n(1.6+(cv+bonus-tv)*.25,1.4):R.n(2.4+(cv+bonus-tv)*.3,2.2);
    if(p>94)gain*=.6;
    gain=clamp(gain,-3,12);
    // passe après contact
    const pOff=.06*(car.p.pas+car.p.mai)/24*(st==='mouvement'?1.6:st==='conquete'?.6:1)*(car.slot<5?.4:1);
    if(R.f()<pOff){
      car.s.off++;S.st.off++;
      if(R.f()<.14*WX[ms.wx].err){car.s.err++;S.st.err++;setPa(ms,a,p+Math.max(0,gain));ms.next={k:'scrum',team:d};evt(ms,a,'info',`Passe après contact de ${car.p.name} ratée : en-avant, mêlée pour ${nm(ms,d)}.`,0);return 9}
      gain+=clamp(R.n(6,4),1,20);ms.quick=true;if(R.f()<.18)brk=true;
    }
  }else{
    missed=true;if(tk){tk.s.mt++;D.st.mt++}
    gain=clamp(R.n(6+A(ms,car,'vit')*.3,4),2,30);
    brk=R.f()<clamp(.3+(A(ms,car,'vit')*.6+A(ms,car,'evi')*.4-coverOf(ms,d))*.04+short*.06,.1,.7)*WX[ms.wx].brk;
  }
  if(brk){
    car.s.cle++;S.st.cle++;
    const rem=100-p,cover=coverOf(ms,d);
    const pTry=clamp(.28+(A(ms,car,'vit')-cover)*.035+(rem<25?.4:rem<45?.2:rem<60?.05:0)+short*.05,.04,.85);
    if(R.f()<pTry){
      const sup=att.filter(x=>x!==car&&x.slot>=9);
      const sc=R.f()<.35&&sup.length?pickW(sup,x=>x.slot===10||x.slot===13?3:1):car;
      car.s.m+=rem;S.st.m+=rem;
      return scoreTry(ms,a,sc,sc===car?`après une percée de ${car.p.name}`:`à la conclusion d'une percée de ${car.p.name}`,true);
    }
    gain=Math.min(rem-1,gain+clamp(R.n(15,10),3,45));
    evt(ms,a,'info',`Percée de ${car.p.name} (${nm(ms,a)}) ! ${Math.round(gain)} m gagnés.`,1);ms.quick=true;
  }else if(p+gain>=100){
    // au ras de la ligne : essai, ou ballon tenu en l'air par la défense
    if(R.f()<.72){S.st.m+=100-p;car.s.m+=100-p;return scoreTry(ms,a,car,car.slot<8?'au ras du regroupement':car.slot===10||car.slot===13?'en bout de ligne':'en force',car.slot===10||car.slot===13)}
    setPa(ms,d,8);ms.next={k:'play',team:d};
    evt(ms,d,'info',`Ballon tenu en l'air par la défense de ${nm(ms,d)} ! Renvoi depuis l'en-but.`,1);return 30;
  }
  gain=Math.min(gain,99.5-p);
  car.s.m+=Math.max(0,gain);S.st.m+=Math.max(0,gain);
  setPa(ms,a,p+gain);
  if(!brk)evt(ms,a,'info',missed?`${car.p.name} échappe à ${tk?tk.p.name:'la défense'} et gagne ${Math.round(gain)} m.`:`${car.p.name} ${gain>=1?'avance de '+Math.round(gain)+' m':'est stoppé'}, plaqué par ${tk.p.name}.`,0);
  return doRuck(ms,a,car,tk,7+R.i(0,4));
}
// Ruck : l'attaque conserve, la défense gratte le ballon, ou quelqu'un fait une faute
function doRuck(ms,a,car,tk,dt){
  const d=1-a,S=ms.T[a],D=ms.T[d],att=active(S),def=active(D);
  const fw=att.filter(x=>x!==car&&x.slot<8),sup=[car];
  for(let n=0;n<2&&fw.length;n++){const x=pickW(fw,y=>WJAC[y.slot]+.5);sup.push(x);fw.splice(fw.indexOf(x),1)}
  // un avant qui porte le ballon le présente mieux au sol ; en jeu de conquête on engage plus de joueurs dans les rucks
  const st=S.tac.style;
  const rA=avg(sup.map(x=>.6*A(ms,x,'rck')+.4*A(ms,x,'pui')))+(ms.quick?.5:0)+(car.slot<8?.7:0)+(st==='conquete'?.6:st==='mouvement'?-.3:0);
  const j=pickW(def.filter(x=>x!==tk||R.f()<.3),x=>WJAC[x.slot]);
  const rJ=j?.7*A(ms,j,'rck')+.3*A(ms,j,'pui'):0;
  sup.forEach(x=>contact(ms,x,.25));if(j)contact(ms,j,.3);
  const short=15-def.length;
  const disc=x=>clamp(1+(11-(x.p.dec+x.p.sfr)/2)/22+(10-(x.p.pro||10))/45,.7,1.45);
  const pTO=j?clamp(.045*Math.exp((rJ-rA)/3.2)-short*.006,.01,.16):0;
  const pPA=.03*INTK[S.tac.int].pen*disc(car)*refK(ms)*S.disc*capDisc(ms,S)*(rJ>rA?1+(rJ-rA)*.08:1);
  const pPD=.036*INTK[D.tac.int].pen*(j?disc(j):1)*refK(ms)*D.disc*capDisc(ms,D)*(paOf(ms,a)>78?1.3:1)*(rA>rJ?1+(rA-rJ)*.06:1);
  const u=R.f();
  if(ms.view.k==='open')ms.view.k='ruck';
  if(u<pTO){j.s.to++;D.st.to++;ms.phase=0;ms.next={k:'play',team:d};ms.counter=R.f()<.3;evt(ms,d,'info',`Ballon gratté par ${j.p.name} (${nm(ms,d)}) !`,1);return dt}
  if(u<pTO+pPA)return foul(ms,a,R.pick(sup),R.pick(['maintien au sol','pas de libération du ballon','entrée sur le côté']),dt);
  if(u<pTO+pPA+pPD)return foul(ms,d,j||R.pick(def),R.pick(['hors-jeu','mains dans le ruck','plaqueur qui ne se relève pas']),dt);
  S.st.rk++;ms.phase++;ms.quick=ms.quick||(rA>rJ+1.5&&R.f()<.5);ms.next={k:'play',team:a};
  return dt;
}
// Faute de l'équipe f (joueur o) : pénalité pour l'adversaire, et parfois un carton jaune
function foul(ms,f,o,why,dt,grave){
  const b=1-f,F=ms.T[f];
  if(o)o.s.pen++;F.st.pc++;
  ms.next={k:'pen',team:b};ms.phase=0;ms.quick=false;
  evt(ms,b,'info',`Pénalité pour ${nm(ms,b)} : ${why}${o?' ('+o.p.name+')':''}.`,1);
  const pY=grave?.6:.045*(.56+ms.ref.sev/25)*(1+Math.max(0,F.st.pc-7)*.12)*(paOf(ms,b)>85?1.8:1)*INTK[F.tac.int].pen;
  if(o&&!o.sin&&o.slot>=0&&R.f()<pY)card(ms,o,grave?why:F.st.pc>=8&&R.f()<.5?'répétition des fautes':'faute grossière');
  return dt;
}
function card(ms,o,why){
  const S=ms.T[o.side];o.sin=ms.t+600;S.st.yc++;o.s.yc++;
  evt(ms,o.side,'card',`Carton jaune pour ${o.p.name} (${S.club.short}, ${why}) : ${S.club.short} à ${active(S).length} pendant 10 minutes.`,2);
}
// ---- Jeu au pied ----
function doKick(ms,a){
  const d=1-a,S=ms.T[a],D=ms.T[d],p=paOf(ms,a),att=active(S);
  ms.phase=0;S.st.kick++;ms.counter=false;ms.fromSet=false;
  const box=p<45&&R.f()<.4,grub=p>=65;
  const k=box?(byNo(att,9)||best(att,'pie')):grub?(byNo(att,10)||best(att,'pie')):(pickW(att.filter(x=>x.slot===8||x.slot===9||x.slot===14),x=>x.p.pie)||best(att,'pie'));
  const pie=A(ms,k,'pie');
  ms.view={k:'kick',a,from:ms.x};
  if(grub){
    // petit coup de pied à suivre ou par-dessus la défense
    const dist=clamp(R.n(15,6),5,30),np=p+dist;
    const ch=pickW(att.filter(x=>x.slot>=10),x=>x.slot===10||x.slot===13?2:1)||k;
    const pReg=clamp(.28+(A(ms,ch,'vit')-coverOf(ms,d))*.03+(S.tac.style==='mouvement'?.05:0),.1,.5);
    if(R.f()<pReg){
      if(np>=100)return scoreTry(ms,a,ch,`sur un coup de pied à suivre de ${k.p.name}`,true);
      setPa(ms,a,np);ms.next={k:'play',team:a};ms.quick=true;
      evt(ms,a,'info',`Coup de pied à suivre de ${k.p.name}, récupéré par ${ch.p.name} !`,1);return 8;
    }
    if(np>=100){setPa(ms,d,22);ms.next={k:'play',team:d};evt(ms,a,'info',`Coup de pied de ${k.p.name} aplati dans l'en-but par ${nm(ms,d)} : renvoi aux 22 m.`,0);return 25}
    setPa(ms,a,np);ms.next={k:'play',team:d};
    evt(ms,a,'info',`Coup de pied de ${k.p.name}, récupéré par la défense de ${nm(ms,d)}.`,0);return 8;
  }
  if(box){
    // chandelle : ballon disputé en l'air
    const dist=clamp(R.n(18+(pie-10)*.8,5),8,35);
    setPa(ms,a,Math.min(p+dist,95));ms.y=clamp(ms.y+R.n(0,8),5,65);
    const ch=pickW(att.filter(x=>x.slot===10||x.slot===13||x.slot===14),()=>1);
    const ca=pickW(active(D).filter(x=>x.slot>=10),()=>1);
    const pWin=clamp(.3+((ch?A(ms,ch,'mai'):10)-(ca?A(ms,ca,'mai'):10))*.03,.12,.55);
    if(R.f()<pWin){ms.next={k:'play',team:a};evt(ms,a,'info',`Chandelle de ${k.p.name}, ballon récupéré par ${ch?ch.p.name:nm(ms,a)} !`,1);return 8}
    if(ca&&R.f()<.07*WX[ms.wx].err){ca.s.err++;D.st.err++;ms.next={k:'scrum',team:a};evt(ms,d,'info',`${ca.p.name} relâche la chandelle : en-avant, mêlée pour ${nm(ms,a)}.`,0);return 10}
    ms.next={k:'play',team:d};ms.counter=true;evt(ms,a,'info',`Chandelle de ${k.p.name}, bien captée par ${ca?ca.p.name:nm(ms,d)}.`,0);return 8;
  }
  // coup de pied long : chercher la touche ou le fond du terrain
  const toTouch=R.f()<(p<22?.6:.35);
  const dist=clamp(R.n((toTouch?30:38)+(pie-10)*1.8,7),10,60),np=Math.min(p+dist,toTouch?95:97);
  setPa(ms,a,np);ms.y=toTouch?(R.f()<.5?0:70):R.i(10,60);
  if(toTouch){ms.dead=true;ms.next={k:'lineout',team:d};evt(ms,a,'info',`${k.p.name} trouve la touche (${Math.round(np-p)} m).`,0);return 30}
  if(np>=97){setPa(ms,d,22);ms.next={k:'play',team:d};evt(ms,a,'info',`Long coup de pied de ${k.p.name} jusque dans l'en-but : renvoi aux 22 m pour ${nm(ms,d)}.`,0);return 25}
  ms.next={k:'play',team:d};ms.counter=true;
  evt(ms,a,'info',`Long coup de pied de ${k.p.name} (${Math.round(np-p)} m).`,0);
  if(R.f()<.03)return foul(ms,a,R.pick(att),'hors-jeu sur le jeu au pied',9);
  return 9;
}
function doDrop(ms,a){
  const att=active(ms.T[a]),k=byNo(att,10)||best(att,'pie'),dist=100-paOf(ms,a);
  const pS=clamp(.55-(dist-22)*.02+(A(ms,k,'pie')-12)*.03+(A(ms,k,'sfr')-12)*.01+WX[ms.wx].goal*1.5,.05,.7);
  ms.view={k:'goal',a};ms.phase=0;
  if(R.f()<pS){ms.sc[a]+=3;ms.dr[a]++;k.s.pts+=3;ms.dead=true;ms.next={k:'kickoff',team:1-a};evt(ms,a,'drop',`Drop réussi par ${k.p.name} (${nm(ms,a)}) !`,2);return 40}
  setPa(ms,1-a,22);ms.next={k:'play',team:1-a};
  evt(ms,a,'miss',`Tentative de drop de ${k.p.name} à côté.`,1);return 25;
}
// ---- Pénalité : prendre les points, jouer la touche, la mêlée, ou jouer vite ----
function doPenalty(ms,a){
  const d=1-a,S=ms.T[a],p=paOf(ms,a),lead=ms.sc[a]-ms.sc[d],k=kickerOf(ms,a);
  const end=PEND[ms.half],over=ms.t>=end,late=ms.t>=end-600,finalHalf=ms.half===2||ms.half===4;
  ms.phase=0;ms.view={k:'pen',a};
  if(over&&finalHalf&&lead>0){ms.dead=true;ms.next={k:'kickoff',team:d};evt(ms,a,'info',`${nm(ms,a)} tape le ballon en touche : c'est terminé !`,1);return 10}
  const lat=R.i(0,25),dist=Math.hypot(100-p,lat*.7),range=k?22+A(ms,k,'but')*1.1:28;
  // une consigne imposée s'applique dans le camp adverse ; dans son camp, l'équipe décide (en général, dégager en touche)
  let ch=p>=50?S.tac.pen:'auto';
  if(ch==='auto'){
    if(dist<=range&&!(late&&lead<=-4&&p>=60)&&!(p>=78&&R.f()<(S.tac.style==='conquete'?.6:S.tac.style==='mouvement'?.45:.4)))ch='points';
    else if(p>=88&&scrumPow(ms,a)>scrumPow(ms,d)+1&&R.f()<.5)ch='melee';
    else if((S.tac.style==='mouvement'&&p>=40&&R.f()<.15)||(late&&lead<0&&p<60&&R.f()<.5))ch='vite';
    else ch='touche';
  }else if(ch==='points'&&dist>range+6)ch='touche';
  if(ch==='points'&&k){
    ms.view={k:'goal',a};
    const pS=clamp(.96-Math.max(0,dist-20)*.016-(20-A(ms,k,'but'))*.022-(late&&Math.abs(lead)<=7?.04:0)+WX[ms.wx].goal,.05,.96);
    if(R.f()<pS){ms.sc[a]+=3;ms.pn[a]++;k.s.pts+=3;ms.dead=true;ms.next={k:'kickoff',team:d};evt(ms,a,'pen',`Pénalité réussie par ${k.p.name} (${nm(ms,a)}, ${Math.round(dist)} m).`,2);return 60}
    ms.dead=true;setPa(ms,d,22);ms.next={k:'play',team:d};
    evt(ms,a,'miss',`Pénalité manquée par ${k.p.name} (${nm(ms,a)}, ${Math.round(dist)} m).`,1);return 50;
  }
  if(ch==='melee'){ms.next={k:'scrum',team:a};evt(ms,a,'info',`${nm(ms,a)} choisit la mêlée.`,1);return 30}
  if(ch==='vite'){ms.tap=true;ms.next={k:'play',team:a};evt(ms,a,'info',`${nm(ms,a)} joue vite la pénalité !`,1);return 5}
  // pénaltouche : on tape en touche et on garde le lancer
  const gain=clamp(R.n(22+((k?A(ms,k,'pie'):10)-10)*1.5,6),8,40);
  setPa(ms,a,Math.min(p+gain,95));ms.y=R.f()<.5?0:70;ms.next={k:'lineout',team:a};
  evt(ms,a,'info',`${nm(ms,a)} joue la pénaltouche (${Math.round(Math.min(p+gain,95)-p)} m).`,1);return 45;
}
// ---- Mêlée ----
function scrumPow(ms,i){
  const on=ms.T[i].on;let f=0,b=0;
  for(let k=0;k<8;k++){const d=on[k];if(!d||d.sin)continue;if(k<3)f+=.65*A(ms,d,'mel')+.35*A(ms,d,'pui');else b+=.55*A(ms,d,'pui')+.45*A(ms,d,'mel')}
  return f/3*.6+b/5*.4;
}
function doScrum(ms,a){
  const d=1-a,S=ms.T[a],D=ms.T[d],p=paOf(ms,a);
  setPa(ms,a,clamp(p,5,95));ms.y=clamp(ms.y,15,55);ms.view={k:'scrum',a};ms.phase=0;ms.tap=false;
  const dif=scrumPow(ms,a)-scrumPow(ms,d);
  S.st.mel++;
  let dt=50;if(R.f()<.35)dt+=35;
  for(const T of[S,D])for(let k=0;k<8;k++)if(T.on[k]&&!T.on[k].sin)contact(ms,T.on[k],.4);
  if(R.f()<.24*Math.sqrt(refK(ms))){
    const w=R.f()<1/(1+Math.exp(-dif*1.1))?a:d,l=1-w;
    if(w===a)S.st.melW++;
    return foul(ms,l,pickW(active(ms.T[l]).filter(x=>x.slot<3),()=>1),'faute en mêlée',dt);
  }
  if(R.f()<clamp(.93+dif*.025,.75,.985)){
    S.st.melW++;
    if(paOf(ms,a)>=94&&dif>1.2&&R.f()<.2){const at=active(S);return scoreTry(ms,a,byNo(at,8)||byNo(at,2)||at[0],'en force sur une mêlée',false)}
    ms.next={k:'play',team:a};ms.fromSet=true;evt(ms,a,'info',`Mêlée gagnée par ${nm(ms,a)}.`,0);return dt;
  }
  ms.next={k:'play',team:d};evt(ms,d,'info',`Mêlée perdue par ${nm(ms,a)} : ballon pour ${nm(ms,d)} !`,1);return dt;
}
// ---- Touche et ballon porté ----
function doLineout(ms,a){
  const d=1-a,S=ms.T[a],D=ms.T[d],p=paOf(ms,a),att=active(S),def=active(D);
  setPa(ms,a,clamp(p,5,95));ms.y=ms.y<35?0:70;ms.view={k:'lineout',a};ms.phase=0;ms.tap=false;
  const th=byNo(att,2)||best(att.filter(x=>x.slot<8),'tou');
  const jw=x=>x.p.tou*(x.slot<5?1.5:1);
  const jum=pickW(att.filter(x=>x.slot>=3&&x.slot<8),jw),stl=pickW(def.filter(x=>x.slot>=3&&x.slot<8),jw);
  const q=(th?A(ms,th,'tou'):8)*.45+(jum?A(ms,jum,'tou'):8)*.55,qd=stl?A(ms,stl,'tou'):8;
  S.st.tou++;
  if(R.f()>=clamp(.88+(q-qd)*.025,.62,.97)){
    if(stl)stl.s.tw++;
    ms.next={k:'play',team:d};evt(ms,d,'info',`Touche volée par ${stl?stl.p.name:nm(ms,d)} (${nm(ms,d)}) !`,1);return 30;
  }
  S.st.touW++;if(jum)jum.s.tw++;
  const pMaul=p<68?0:(S.tac.style==='conquete'?.7:S.tac.style==='mouvement'?.25:.45)*(p>=85?1.3:1);
  if(R.f()<pMaul)return doMaul(ms,a,th);
  ms.next={k:'play',team:a};ms.fromSet=true;evt(ms,a,'info',`Touche gagnée par ${nm(ms,a)}${jum?' ('+jum.p.name+')':''}.`,0);return 30;
}
function doMaul(ms,a,th){
  const d=1-a,S=ms.T[a],D=ms.T[d],p=paOf(ms,a);
  const mp=i=>{let s=0;for(let k=0;k<8;k++){const x=ms.T[i].on[k];if(x&&!x.sin)s+=.55*A(ms,x,'pui')+.25*A(ms,x,'mel')+.2*A(ms,x,'rck')}return s/8};
  const dif=mp(a)-mp(d);ms.view={k:'maul',a};
  for(const T of[S,D])for(let k=0;k<8;k++)if(T.on[k]&&!T.on[k].sin)contact(ms,T.on[k],.3);
  // tout près de la ligne, la défense est plus compacte
  const gain=clamp(R.n(2.8+dif*1.3,3),-2,18)*(p>=90?.75:1);
  if(p+gain>=100){const fw=active(S).filter(x=>x.slot<8);const sc=th&&!th.sin&&th.slot>=0&&R.f()<.55?th:pickW(fw,()=>1);S.st.m+=100-p;return scoreTry(ms,a,sc,'au bout d\'un ballon porté',false)}
  setPa(ms,a,p+Math.max(0,gain));S.st.m+=Math.max(0,gain);
  const u=R.f(),pD=clamp(.1+dif*.03,.03,.25);
  if(u<pD)return foul(ms,d,pickW(active(D).filter(x=>x.slot<8),()=>1),'écroulement du ballon porté',25);
  if(u<pD+.05)return foul(ms,a,pickW(active(S).filter(x=>x.slot<8),()=>1),'obstruction dans le ballon porté',25);
  if(u<pD+.14){ms.next={k:'scrum',team:d};evt(ms,a,'info',`Ballon porté de ${nm(ms,a)} arrêté : mêlée pour ${nm(ms,d)}.`,1);return 25}
  ms.next={k:'play',team:a};
  evt(ms,a,'info',`Ballon porté de ${nm(ms,a)} : ${Math.max(0,Math.round(gain))} m.`,gain>=6?1:0);return 25;
}
// ---- Essai et transformation ----
function scoreTry(ms,a,sc,how,wide){
  const d=1-a;ms.sc[a]+=5;ms.tr[a]++;if(sc){sc.s.es++;sc.s.pts+=5}
  setPa(ms,a,100);ms.view={k:'try',a,c:sc&&sc.p.id};
  evt(ms,a,'try',`ESSAI ${nm(ms,a)} ! ${sc?sc.p.name:'?'} aplatit ${how}.`,2);
  const k=kickerOf(ms,a),lat=wide?R.i(10,33):R.i(0,15);
  ms.y=35+(R.f()<.5?-1:1)*lat;
  if(R.f()<(k?clamp(.95-lat*.016-(20-A(ms,k,'but'))*.022+WX[ms.wx].goal,.1,.96):.5)){ms.sc[a]+=2;ms.cv[a]++;if(k)k.s.pts+=2;evt(ms,a,'conv',`Transformation réussie par ${k?k.p.name:'?'}.`,1)}
  else evt(ms,a,'miss',`Transformation manquée (${k?k.p.name:'?'}).`,1);
  ms.dead=true;ms.next={k:'kickoff',team:d};ms.phase=0;
  return 100;
}

// ---- Notes des joueurs (sur 10, comme FM) ----
function rateOf(ms,d){
  const s=d.s,S=ms.T[d.side],O=ms.T[1-d.side],mins=d.secs/60;
  if(mins<1)return 6;
  let r=6+s.es*.8+s.tac*.04-s.mt*.15+s.m*.012+s.cle*.35+s.to*.45-s.pen*.3-s.err*.25+(s.pts-5*s.es)*.05+s.tw*.12+s.off*.1-s.yc*.6;
  if(d.ls>=0&&d.ls<3)r+=(S.st.melW/Math.max(1,S.st.mel)-O.st.melW/Math.max(1,O.st.mel))*.8;
  r+=clamp((ms.sc[d.side]-ms.sc[1-d.side])/40,-.4,.4);
  r=6+(r-6)*Math.min(1,Math.sqrt(mins/60));
  if(r>8.5)r=8.5+(r-8.5)*.5;
  return Math.round(clamp(r,3,10)*10)/10;
}
// ---- Résultat final (même format qu'avant, plus les statistiques et les notes) ----
function matchResult(ms){
  const [h,a]=ms.clubs;
  const winner=ms.sc[0]>ms.sc[1]?h.id:ms.sc[1]>ms.sc[0]?a.id:ms.winner!==null?ms.clubs[ms.winner].id:null;
  // Règles LNR (Top 14 / Pro D2) : bonus offensif = au moins 3 essais de plus que l'adversaire, bonus défensif = défaite de 5 points ou moins
  const bh=(ms.tr[0]-ms.tr[1]>=3?1:0)+(ms.sc[0]<ms.sc[1]&&ms.sc[1]-ms.sc[0]<=5?1:0);
  const ba=(ms.tr[1]-ms.tr[0]>=3?1:0)+(ms.sc[1]<ms.sc[0]&&ms.sc[0]-ms.sc[1]<=5?1:0);
  const ps=[];
  for(const id in ms.P){const d=ms.P[id];if(!d.start&&!d.used)continue;ps.push({id:d.p.id,n:d.p.name,s:d.side,no:d.no,g:d.p.g,min:Math.round(d.secs/60),r:rateOf(ms,d),...d.s,m:Math.round(d.s.m),inj:d.inj,st:d.start})}
  ps.sort((x,y)=>x.s-y.s||x.no-y.no);
  const wi=winner===h.id?0:winner===a.id?1:-1;
  const motm=ps.reduce((b,x)=>!b||x.r+(x.s===wi?.3:0)>b.r+(b.s===wi?.3:0)?x:b,null);
  const pos=ms.T[0].st.pos+ms.T[1].st.pos||1,ter=ms.terr[0]+ms.terr[1]||1;
  return{sh:ms.sc[0],sa:ms.sc[1],th:ms.tr[0],ta:ms.tr[1],ph:Math.round(ms.T[0].st.pos/pos*100),tp:Math.round(ms.terr[0]/ter*100),
    pn:ms.pn,dr:ms.dr,cv:ms.cv,wx:ms.wx,ref:ms.ref?{n:ms.ref.n,sev:ms.ref.sev}:null,cap:ms.T.map(S=>S.capId),yc:[ms.T[0].st.yc,ms.T[1].st.yc],ev:ms.ev,bo:[bh,ba],winner,so:ms.so,
    stats:[{...ms.T[0].st,m:Math.round(ms.T[0].st.m)},{...ms.T[1].st,m:Math.round(ms.T[1].st.m)}],ps,motm:motm?motm.id:null};
}
// ---- Match simulé d'un coup (clubs IA, ou résultat immédiat) ----
function simMatch(hc,ac,opt={}){
  const ms=newMatch(hc,ac,opt);let g=0;
  while(!ms.done&&g++<4000)matchStep(ms);
  ms.done=true;
  return matchResult(ms);
}
