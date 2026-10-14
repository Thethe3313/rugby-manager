'use strict';
// ==== CONDITIONS DE MATCH : météo, arbitre, capitaine, discours ====

// ---- Météo ----
// err = en-avant, kick = envie de jouer au pied, brk = percées, goal = réussite des buteurs (en plus ou en moins)
const WX={
  beau:{n:'Beau temps',i:'☀️',err:1,kick:1,brk:1,goal:0},
  couvert:{n:'Temps couvert',i:'☁️',err:1,kick:1,brk:1,goal:0},
  pluie:{n:'Pluie',i:'🌧️',err:1.35,kick:1.2,brk:.9,goal:-.03},
  deluge:{n:'Forte pluie',i:'⛈️',err:1.7,kick:1.35,brk:.8,goal:-.06},
  vent:{n:'Vent fort',i:'💨',err:1.1,kick:1.1,brk:1,goal:-.1},
  toit:{n:'Stade couvert (toit fermé)',i:'🏟️',err:1,kick:1,brk:1,goal:.02}
};
const ROOF=['rac']; // Paris La Défense Arena
// Probabilité de pluie selon le mois (plus forte en hiver)
const RAIN=[0,.35,.3,.25,.2,.15,.1,.08,.08,.12,.22,.3,.35];
// Toujours la même météo pour un match donné (même date, même stade) : la prévision d'avant-match est la bonne
function weatherFor(date,c){
  if(c&&ROOF.includes(c.id))return 'toit';
  const h=hashN(date+(c?c.id:'')+'meteo'),r=RAIN[+date.slice(5,7)]||.15;
  return h<r*.3?'deluge':h<r?'pluie':h<r+.08?'vent':h<r+.4?'couvert':'beau';
}
const wxTxt=k=>`${WX[k].i} ${WX[k].n}`;

// ---- Arbitres (noms fictifs : pas de données fiables sur la sévérité des vrais arbitres) ----
// sev = sévérité sur 20 : pénalités sifflées (×0,8 à ×1,2) et cartons (×0,6 à ×1,4) ; 11 = arbitre moyen
function initRefs(){
  G.refs=[];const seen=new Set();
  while(G.refs.length<16){const n=R.pick(FIRST)+' '+R.pick(LAST);if(seen.has(n))continue;seen.add(n);G.refs.push({n,sev:clamp(Math.round(R.n(11,3.5)),3,19)})}
}
function refFor(date,c){
  if(!G.refs)initRefs();
  return G.refs[Math.floor(hashN(date+(c?c.id:'')+'arbitre')*G.refs.length)];
}
const refK=ms=>.78+ms.ref.sev/50;
const refTxt=r=>`${r.n} (${r.sev>=15?'très sévère':r.sev>=12?'plutôt sévère':r.sev<=7?'très permissif':r.sev<=9?'laisse jouer':'arbitre moyen'})`;

// ---- Capitaine ----
// Le capitaine désigné (club.captain) porte le brassard s'il est sur le terrain ; sinon c'est le meilleur leader présent.
// Son leadership (lea) soutient l'équipe (±2 %) et la discipline (±6 % de fautes ; neutre pour un leadership de 14).
function updateCaptain(ms,S){
  const on=active(S);
  let c=(S.capMain&&on.find(d=>d.p.id===S.capMain))||on.find(d=>d.p.id===S.capId);
  if(!c){c=best(on,'lea');if(c&&S.capId!=null&&ms.t>0)evt(ms,S.i,'info',`${c.p.name} récupère le brassard de capitaine (${S.club.short}).`,0)}
  S.capId=c?c.p.id:null;
  S.capK=c?1+(c.p.lea-11)/450:1;
}
function capDisc(ms,S){const c=S.on.find(d=>d&&d.p.id===S.capId&&!d.sin);return c?1+(14-c.p.lea)/100:1}

// ---- Discours ----
const TALKS={
  pre:{motive:'Motivant : « On est capables de tout ce soir »',calme:'Calme : « Jouez votre jeu, sans pression »',exige:'Exigeant : « Je veux de l\'engagement, aucune excuse »',aucun:'Pas de discours'},
  half:{encourager:'Encourager : « On peut le faire »',feliciter:'Féliciter : « Continuez comme ça »',exiger:'Exiger plus : « Ce n\'est pas assez »',calme:'Calme : « Restez concentrés »'}
};
// Applique un discours à l'équipe i : effet sur le moral (S.mor, ±5 % au plus) selon le score, le rapport de force
// et la détermination moyenne des joueurs. Renvoie la réaction des joueurs.
function applyTalk(ms,i,key,pre){
  const S=ms.T[i],O=ms.T[1-i],on=active(S);if(key==='aucun')return 'Pas de discours.';
  const det=avg(on.map(d=>d.p.det||10)),lead=ms.sc[i]-ms.sc[1-i];
  const fav=pre?clubStr(S.club)>clubStr(O.club)+2:lead>0,under=pre?clubStr(S.club)<clubStr(O.club)-2:lead<0;
  let e;
  switch(key){
    case'motive':case'encourager':e=.018+(det-10)*.002+(under?.006:0);break;
    case'calme':e=fav||lead>0?.016:.004;S.disc=.9;break;
    case'exige':case'exiger':e=under||lead<0?.03+(det-10)*.004:lead>14?-.015:.006;if(det<8)e-=.03;break;
    case'feliciter':e=lead>0?.02:lead===0?0:-.025;break;
    default:e=0;
  }
  e=clamp(e+R.n(0,.007),-.04,.05);
  S.mor=clamp(S.mor*(1+e),.94,1.07);
  const txt=e>.02?'Les joueurs sont gonflés à bloc !':e>.008?'Le message passe bien.':e>-.005?'Les joueurs écoutent, sans plus.':'Le discours tombe à plat : certains semblent ailleurs.';
  evt(ms,i,'info',`Discours ${pre?'d\'avant-match':'de la mi-temps'} (${S.club.short}) : ${txt}`,1);
  return txt;
}
