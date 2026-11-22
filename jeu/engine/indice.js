'use strict';
// ==== Indice de performance par poste (étape 24) ====
// Inspiré du « Performance Index » du P'tit Buro (fantasy de Poney Club / Aymeric Milan, basée sur les stats Opta) : chaque performance est notée sur 100, avec des statistiques
// pondérées selon le poste (un pilier est jugé sur son vrai travail : ruck, conquête, plaquages ; un ailier sur ses mètres, ses essais, ses défenseurs battus), la médiane vaut 63,
// moins de 50 = match insuffisant, 50-69 correct, 70-79 solide, 80-89 excellent, 90 et plus exceptionnel, et il faut jouer au moins 10 minutes pour être noté.
// Le P'tit Buro garde ses pondérations secrètes : les nôtres sont maison, et ne portent que sur ce que notre moteur de match mesure
// (plaquages, plaquages manqués, courses, mètres, nettoyages de ruck, turnovers, touches, passes d'attaque…).
// Calibrage : voir tests/indice.js (médiane 63, ~22 % sous 50, ~1 % à 90 et plus, comme le barème du P'tit Buro en 2025-26).
const IPMIN=10;
// poids par statistique pour 80 minutes : tac plaquages, mt manqués, car courses, m mètres, cle nettoyages, to turnovers gagnés, tw touches gagnées / volées, off offloads, es essais, pts points marqués, err fautes de main, pen pénalités, yc cartons jaunes
const IPW={
  PIL:{tac:.35,mt:-.5,car:.3,m:.05,cle:.55,to:.6,tw:0,off:.4,es:4,pts:.03,err:-.6,pen:-.7,yc:-4},
  TAL:{tac:.35,mt:-.5,car:.25,m:.05,cle:.45,to:.6,tw:.9,off:.4,es:4,pts:.03,err:-.6,pen:-.7,yc:-4},
  '2L':{tac:.35,mt:-.5,car:.3,m:.05,cle:.45,to:.6,tw:1,off:.4,es:4,pts:.03,err:-.6,pen:-.7,yc:-4},
  '3L':{tac:.35,mt:-.5,car:.4,m:.07,cle:.4,to:1,tw:.4,off:.5,es:4,pts:.03,err:-.6,pen:-.7,yc:-4},
  DM:{tac:.3,mt:-.5,car:.3,m:.06,cle:.3,to:.5,tw:0,off:.5,es:3.5,pts:.08,err:-.6,pen:-.7,yc:-4},
  OUV:{tac:.3,mt:-.5,car:.3,m:.07,cle:.25,to:.5,tw:0,off:.6,es:3.5,pts:.1,err:-.6,pen:-.7,yc:-4},
  CEN:{tac:.35,mt:-.5,car:.4,m:.09,cle:.25,to:.5,tw:0,off:.8,es:3.5,pts:.05,err:-.6,pen:-.7,yc:-4},
  AIL:{tac:.25,mt:-.5,car:.4,m:.1,cle:.2,to:.5,tw:.2,off:.6,es:3.5,pts:.05,err:-.6,pen:-.7,yc:-4},
  ARR:{tac:.25,mt:-.5,car:.4,m:.1,cle:.2,to:.5,tw:.2,off:.6,es:3.5,pts:.06,err:-.6,pen:-.7,yc:-4}};
// [moyenne, écart] de la note brute par poste (calibrage tests/indice.js)
const IPCAL={"PIL":[2.8,5.24],"TAL":[3.2,6.18],"2L":[7,5.7],"3L":[8.1,7.43],"DM":[2.2,4.9],"OUV":[3.5,5.29],"AIL":[6.7,7.97],"CEN":[9.9,8.11],"ARR":[5.9,7.14]};
// Note brute : statistiques ramenées à 80 minutes, plus le contexte du match (résultat, écart de points pendant sa présence approché par l'écart final)
function ipRaw(ms,d){
  const mins=d.secs/60,w=IPW[d.p.g]||IPW.CEN,s=d.s,k=80/Math.max(mins,10);
  let r=0;for(const key in w)r+=w[key]*(s[key]||0)*k;
  const df=ms.sc[d.side]-ms.sc[1-d.side];
  r+=(df>0?2:df<0?-2:0)+clamp(df/12,-2,2);
  return r;
}
// Indice sur 100 (null si moins de 10 minutes). Étalé de façon asymétrique comme dans le barème de référence : plus de notes basses que de très hautes.
function perfIdx(ms,d){
  if(d.secs/60<IPMIN)return null;
  const c=IPCAL[d.p.g]||IPCAL.CEN;if(!c)return Math.round(ipRaw(ms,d)*10)/10;
  const z=(ipRaw(ms,d)-c[0])/c[1];
  return Math.round(clamp(63+z*(z<0?21:11),15,100));
}
const ipBand=v=>v==null?'':v>=90?'ip90':v>=80?'ip80':v>=70?'ip70':v>=50?'ip50':'ip0';
const ipTxt=v=>v>=90?'Performance exceptionnelle':v>=80?'Excellent match':v>=70?'Match solide':v>=50?'Match correct':'Match insuffisant';
// Mise à jour des statistiques du joueur après un match (appelé par afterMatch) : somme, nombre, meilleure, pire et les derniers indices
function ipRecord(p,ip){
  if(ip==null)return;const st=p.st;
  st.ip=(st.ip||0)+ip;st.ipn=(st.ipn||0)+1;st.ipx=Math.max(st.ipx||0,ip);st.ipm=Math.min(st.ipm==null?100:st.ipm,ip);
  p.ipl=(p.ipl||[]).concat([ip]).slice(-12);
}
const ipAvg=p=>p.st&&p.st.ipn?Math.round(p.st.ip/p.st.ipn):null;
