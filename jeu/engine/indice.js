'use strict';
// ==== Note de match selon le poste (étape 24) ====
// Inspirée du « Performance Index » du P'tit Buro (la fantasy de Poney Club / Aymeric Milan, basée sur les stats Opta) : un joueur est noté sur ce qui compte pour son poste.
// Un pilier est jugé sur sa mêlée, son travail au ruck et ses plaquages ; un talonneur et un deuxième ligne sur la touche et la mêlée ; un troisième ligne sur ses plaquages et ses turnovers ;
// un ailier sur ses mètres, ses essais et ses courses. Le P'tit Buro garde ses pondérations secrètes : celles-ci sont maison, et ne portent que sur ce que notre moteur de match mesure.
// La note finale reste sur 10 (6 = match correct) ; elle sert à l'homme du match et à la note moyenne. Calibrage : tests/indice.js (même moyenne et même étalement qu'avant).
// poids par statistique pour 80 minutes : tac plaquages, mt manqués, car courses, m mètres, cle nettoyages de ruck, to turnovers gagnés, tw touches gagnées / volées, off offloads, es essais, pts points marqués, err fautes de main, pen pénalités, yc cartons jaunes
const NOTEW={
  PIL:{tac:.35,mt:-.5,car:.3,m:.05,cle:.55,to:.6,tw:0,off:.4,es:4,pts:.03,err:-.6,pen:-.7,yc:-4},
  TAL:{tac:.35,mt:-.5,car:.25,m:.05,cle:.45,to:.6,tw:.9,off:.4,es:4,pts:.03,err:-.6,pen:-.7,yc:-4},
  '2L':{tac:.35,mt:-.5,car:.3,m:.05,cle:.45,to:.6,tw:1,off:.4,es:4,pts:.03,err:-.6,pen:-.7,yc:-4},
  '3L':{tac:.35,mt:-.5,car:.4,m:.07,cle:.4,to:1,tw:.4,off:.5,es:4,pts:.03,err:-.6,pen:-.7,yc:-4},
  DM:{tac:.3,mt:-.5,car:.3,m:.06,cle:.3,to:.5,tw:0,off:.5,es:3.5,pts:.08,err:-.6,pen:-.7,yc:-4},
  OUV:{tac:.3,mt:-.5,car:.3,m:.07,cle:.25,to:.5,tw:0,off:.6,es:3.5,pts:.1,err:-.6,pen:-.7,yc:-4},
  CEN:{tac:.35,mt:-.5,car:.4,m:.09,cle:.25,to:.5,tw:0,off:.8,es:3.5,pts:.05,err:-.6,pen:-.7,yc:-4},
  AIL:{tac:.25,mt:-.5,car:.4,m:.1,cle:.2,to:.5,tw:.2,off:.6,es:3.5,pts:.05,err:-.6,pen:-.7,yc:-4},
  ARR:{tac:.25,mt:-.5,car:.4,m:.1,cle:.2,to:.5,tw:.2,off:.6,es:3.5,pts:.06,err:-.6,pen:-.7,yc:-4}};
// [médiane, écart] de la note brute par poste (tests/indice.js) et [moyenne, écart] visés pour la note sur 10
const NOTECAL={"ARR":[5.74,6.27],"AIL":[7.02,6.93],"CEN":[10.35,7.5],"OUV":[4.07,4.79],"DM":[2.65,4.6],"3L":[8.08,6.93],"2L":[7.13,5.77],"TAL":[3.11,6.32],"PIL":[2.76,6.02]};
const NOTETGT=[6.5,.98];
const rate=(w,l)=>l?w/l:.5;
// Note brute : statistiques ramenées à 80 minutes, travail collectif propre au poste (mêlée pour la première ligne et les deuxièmes lignes, touche pour les talonneurs et les sauteurs), contexte du match
function noteRaw(ms,d){
  const mins=d.secs/60,g=d.p.g,w=NOTEW[g]||NOTEW.CEN,s=d.s,k=80/Math.max(mins,10);
  let r=0;for(const key in w)r+=w[key]*(s[key]||0)*k;
  const S=ms.T[d.side],O=ms.T[1-d.side];
  const mel=rate(S.st.melW,S.st.mel)-rate(O.st.melW,O.st.mel),tou=rate(S.st.touW,S.st.tou)-rate(O.st.touW,O.st.tou);
  if(g==='PIL')r+=6*mel;else if(g==='TAL')r+=4*mel+3*tou;else if(g==='2L')r+=2.5*mel+4*tou;else if(g==='3L')r+=mel*1.2+tou;
  const df=ms.sc[d.side]-ms.sc[1-d.side];
  r+=(df>0?2:df<0?-2:0)+clamp(df/12,-2,2);
  return r;
}
// Note sur 10 selon le poste (le tassement vers 6 pour les temps de jeu courts est fait par rateOf)
function noteByPos(ms,d){
  const c=NOTECAL[d.p.g]||NOTECAL.CEN;if(!c)return noteRaw(ms,d);
  const z=(noteRaw(ms,d)-c[0])/c[1];
  return NOTETGT[0]+z*NOTETGT[1];
}
