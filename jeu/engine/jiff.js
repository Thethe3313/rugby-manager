'use strict';
// ==== JIFF : joueurs issus des filières de formation (règle LNR, Top 14 et Pro D2) ====
// Définition (règlement administratif de la LNR, art. 22) : au moins 3 saisons en centre de formation agréé, OU au moins 5 saisons de licence FFR avant 22 ans.
// Elle ne dépend pas de la nationalité. Règle de la saison 2025-26 (sources : LNR, actu.fr juin 2026 « Le Racing 92 menacé d'un retrait de 6 points », actu.fr avril 2024) :
// - moyenne minimale de 16 JIFF sur la feuille de match (23 joueurs), calculée sur toute la saison, phases finales et match d'accession compris ;
//   promu en Top 14 : 13 la 1re saison, 14,5 la 2e ; au plus 13 joueurs non-JIFF dans l'effectif ;
// - sous le minimum : retrait de points au démarrage de la saison suivante (6 / 8 / 10 / 12 points selon l'écart) ;
// - à partir de 17 de moyenne : prime du fonds JIFF de 220 k€ + 500 € par centième de JIFF au-dessus de 17, plafonnée à 320 k€ (atteinte à 19).
// Le jeu ne connaît pas le parcours de chaque joueur : « p.jiff » est une estimation (voir jiffInit), calée sur les moyennes réelles de 2025-26 de chaque club,
// puis tenue à jour : un espoir devient JIFF après 3 saisons au centre de formation (youthSeasonEnd), un joueur étranger recruté adulte ne l'est jamais.
// Données réelles 2026-27 (allrugby.com, dossiers JIFF Top 14 et Pro D2, consultés en novembre 2026) : [moyenne JIFF sur la feuille de match, contrats pro, dont JIFF].
// Le statut JIFF de chaque joueur est réservé aux abonnés d'allrugby : le jeu ne l'a pas joueur par joueur, il l'estime pour que chaque club retombe sur ces chiffres.
const JIFFDATA={bay:[18,37,27],ubb:[19.89,33,23],cas:[17.33,36,25],cle:[18.67,35,27],lar:[18.22,40,26],lou:[18.22,41,28],mon:[16.11,37,24],sfp:[18.22,41,31],pau:[19.67,41,32],per:[18.11,41,28],rac:[16.78,34,23],tln:[16.44,35,23],tou:[19.89,35,29],van:[13.56,49,32],
  age:[17.09,31,23],pro:[16.27,37,26],aur:[18.09,40,32],bez:[17.45,37,29],bia:[17.36,41,31],bri:[18,35,25],col:[18.73,39,31],dax:[18.45,32,24],gre:[17.18,38,27],mtb:[16.73,40,27],nar:[15.18,46,33],nev:[20.18,40,35],nic:[17.55,44,30],oyo:[17,40,26],soy:[19.18,40,33],vro:[19.64,35,29]};
const JIFFMAXNON=13; // joueurs non-JIFF maximum dans l'effectif (promu : 15, promu qui se maintient : 14)
// Limite réellement appliquée : la règle, ou le nombre de non-JIFF de départ si le club en comptait déjà plus (la LNR ne compte pas tous les contrats)
const jiffCapNon=c=>Math.max(jiffMaxNon(c),c.nonBase||0);
const jiffMaxNon=c=>{const R_=jiffRule(c);return R_?{std:13,p1:15,p2:14}[R_.kind]:JIFFMAXNON};
// Règle applicable à un club (null : pas de quota hors Top 14 et Pro D2)
function jiffRule(c){
  if(!c||(c.lg!=='t14'&&c.lg!=='pd2'))return null;
  const py=c.promoSeason!=null?G.season-c.promoSeason:-1,kind=py===0?'p1':py===1?'p2':'std';
  return{kind,min:{std:16,p1:13,p2:14.5}[kind],prime:17,promo:kind!=='std'};
}
// Prime du fonds JIFF (k€) : 220 + 0,5 par centième de JIFF entre 17 et 19, plafond 320
const jiffPrize=avg=>avg<17?0:Math.min(320,Math.round(220+.5*Math.round((Math.min(avg,19)-17)*100)));
// Retrait de points (saison suivante) : 6, 8, 10 ou 12 points selon l'écart au minimum (barème identique pour les promus, décalé de leur seuil)
function jiffPenalty(avg,min){return avg>=min?0:avg>=min-1?6:avg>=min-2?8:avg>=min-3?10:12}
// Estimation pour un joueur sans drapeau (arrivé de l'étranger, jeune généré…)
function jiffOf(p){
  if(p.jiff===undefined){
    if(p.youth&&p.nat!=='France')p.jiff=(p.cf||0)>=3?1:0; // jeune étranger : JIFF seulement après 3 saisons au centre de formation
    else{const h=hashN('jiff'+p.name+(p.by||p.age));p.jiff=p.nat==='France'?(h<.9?1:0):(h<.07?1:0)}
  }
  return p.jiff?1:0;
}
// Cale les drapeaux d'un club sur sa moyenne réelle 2025-26 : les Français d'abord, puis les jeunes étrangers formés en France
function jiffCalibrate(c){
  const d=JIFFDATA[c.id]||[17,40,30],n=c.squad.length,K=Math.round(d[2]/d[1]*n);
  const sc=p=>(p.nat==='France'?1:0)+(p.age<=26?.15:0)+hashN('jf'+p.name)*.35;
  [...c.squad].sort((a,b)=>sc(b)-sc(a)).forEach((p,i)=>{p.jiff=i<K?1:0});
  // ajustement : la feuille de match (les 23 meilleurs) doit afficher la moyenne réelle du club ; on échange des statuts avec les réservistes
  c.nonBase=0;
  const lu=autoLineup(c),inLu=new Set(lu.filter(Boolean)),T=Math.round(d[0]);
  for(let g=0;g<30;g++){
    const cnt=lu.filter(id=>{const p=c.squad.find(x=>x.id===id);return p&&p.jiff}).length;if(cnt===T)break;
    const up=cnt<T,A=c.squad.filter(p=>inLu.has(p.id)&&(up?!p.jiff:p.jiff)),B=c.squad.filter(p=>!inLu.has(p.id)&&(up?p.jiff:!p.jiff));
    if(!A.length)break;
    const a=A.sort((x,y)=>up?sc(y)-sc(x):sc(x)-sc(y))[0];a.jiff=up?1:0;
    if(B.length){const b=B.sort((x,y)=>up?sc(x)-sc(y):sc(y)-sc(x))[0];b.jiff=up?0:1}
  }
  c.nonBase=c.squad.filter(p=>!p.jiff).length;
}
function jiffInit(recal){
  if(recal!==false&&G.season<=1)for(const c of G.clubs)jiffCalibrate(c);
  G.jiffv=3;G.jiffT=G.jiffT||{};
  if(G.season===1)for(const id of ['van','nar','nic']){const c=C(id);if(c&&(c.lg==='t14'||c.lg==='pd2'))c.promoSeason=1}
}
// Nombre de JIFF sur une feuille de match (23 postes)
function jiffCount(c,lineup){return(lineup||c.lineup||[]).slice(0,23).reduce((n,id)=>{const p=c.squad.find(x=>x.id===id);return n+(p&&jiffOf(p)?1:0)},0)}
// Joueurs non-JIFF dans l'effectif (limité à 13)
const jiffNon=c=>c.squad.filter(p=>!jiffOf(p)).length;
// Tous les clubs de Top 14 et Pro D2 ajustent leur feuille de match comme dans la réalité (« opération JIFF ») : échange avec un remplaçant JIFF presque aussi bon
function jiffFix(c){
  const R_=jiffRule(c);if(!R_)return;
  const lu=c.lineup,get=id=>c.squad.find(p=>p.id===id),need=Math.ceil(R_.min);
  for(let guard=0;guard<10&&jiffCount(c,lu)<need;guard++){
    let best=null;
    for(let i=0;i<23;i++){
      const cur=get(lu[i]);if(!cur||jiffOf(cur))continue;
      for(const p of c.squad){
        if(lu.includes(p.id)||!jiffOf(p)||p.inj>0||away(p))continue;
        const loss=effAt(cur,SLOTS[i])-effAt(p,SLOTS[i]);
        if(loss<=6&&(!best||loss<best.loss))best={i,id:p.id,loss};
      }
    }
    if(!best)break;lu[best.i]=best.id;
  }
}
// Suivi de la moyenne de chaque club de Top 14 / Pro D2, après chacun de ses matchs (appelé par afterMatch)
function jiffTrack(c){
  const R_=jiffRule(c);if(!R_)return;
  const T=G.jiffT=G.jiffT||{},S=T[c.id]=T[c.id]||{n:0,s:0};S.n++;S.s+=jiffCount(c);
  const avg=S.s/S.n;
  if(c.id===G.meId&&S.n>=6&&S.n%6===0&&avg<R_.min+.5)mail('Directeur sportif',avg<R_.min?'⚠ Quota JIFF en danger':'Quota JIFF : marge faible',`Sur ${S.n} matchs, tu alignes <b>${avg.toFixed(2)} JIFF</b> en moyenne sur la feuille de match : le minimum est de ${R_.min}. En dessous, la LNR retire de 6 à 12 points au démarrage de la saison suivante. Fais jouer plus de joueurs formés en France (Composition).`,{act:{tab:'lineup'},imp:avg<R_.min});
}
const jiffMine=()=>(G.jiffT||{})[G.meId]||{n:0,s:0};
// Fin de saison : prime du fonds, retrait de points pour la saison suivante, et mise à jour des promus (statut « promu » pour le quota)
function jiffSeasonEnd(){
  const T=G.jiffT||{};G.jiffT={};G.jiffPen=G.jiffPen||{};
  for(const id in G.jiffPen)if(G.jiffPen[id].s<=G.season)delete G.jiffPen[id];
  const m=ME();
  for(const c of G.clubs){
    const R_=jiffRule(c),S=T[c.id];if(!R_||!S||S.n<8)continue;
    const avg=S.s/S.n,prize=jiffPrize(avg),pen=jiffPenalty(avg,R_.min),mine=c===m;
    if(prize){c.budget+=prize;if(mine)G.fin.prize+=prize}
    if(pen)G.jiffPen[c.id]={pts:pen,s:G.season+1};
    if(mine){
      G.summary.jiff={avg:Math.round(avg*100)/100,min:R_.min,prize,pen};
      if(pen){G.coach.board=Math.max(0,G.coach.board-8);mail('La LNR','⚠ Quota JIFF non respecté',`Moyenne de <b>${avg.toFixed(2)} JIFF</b> par feuille de match, sous le minimum de ${R_.min}. Sanction de la LNR : <b>retrait de ${pen} points</b> au démarrage de la saison prochaine (si le club est en Top 14 ou en Pro D2). Le président est très mécontent (confiance −8).`,{imp:true})}
      else if(prize)mail('La LNR',`Fonds JIFF : prime de ${fmtK(prize)}`,`Tu as aligné <b>${avg.toFixed(2)} JIFF</b> en moyenne sur la feuille de match (seuil de la prime : 17). Le club touche <b>${fmtK(prize)}</b> du fonds JIFF (220 k€ + 500 € par centième au-dessus de 17, plafond 320 k€ à 19 de moyenne).`);
      else mail('La LNR','Quota JIFF respecté',`Moyenne de <b>${avg.toFixed(2)} JIFF</b> par feuille de match (minimum ${R_.min}). Pour toucher la prime du fonds JIFF (au moins 220 k€), il faut dépasser 17.`);
    }else if(pen)addNews(`⚖ Quota JIFF : ${c.short} (${avg.toFixed(2)} de moyenne) écope d'un retrait de ${pen} points la saison prochaine.`);
  }
  // clubs promus en Top 14 : 1re saison (quota 13), puis 2e saison (14,5)
  if(G.moves)for(const id of [...(G.moves.up||[]),...(G.moves.natUp||[])]){const c=C(id);if(c)c.promoSeason=G.season+1}
}
// Retrait de points en cours (affiché dans le classement)
const jiffPenOf=id=>{const p=(G.jiffPen||{})[id];return p&&p.s===G.season?p.pts:0};
