'use strict';
// ==== VESTIAIRE, DÉLÉGATION AU STAFF, PRÊTS ====

// ---- Vestiaire : satisfaction (p.sat, 0-100) des joueurs du club du joueur ----
// Chaque joueur attend un rôle selon son rang à son poste (titulaire, rotation, remplaçant) ; s'il joue moins que prévu,
// il perd patience (plus vite s'il est ambitieux). Un mécontent demande à parler : promesse de temps de jeu (vérifiée
// sur les 6 matchs suivants), patience, ou départ. Les leaders (leadership élevé, expérience) influencent le moral du groupe.
const ROLES={tit:'Titulaire',rot:'Rotation',rem:'Remplaçant',jeu:'Jeune à faire progresser'};
function roleOf(p,m){
  if(p.age<=21)return 'jeu';
  const rk=m.squad.filter(x=>x.g===p.g&&ovr(x)>ovr(p)).length,st=STARTERS[p.g];
  return rk<st?'tit':rk<st*2?'rot':'rem';
}
const ROLESHARE={tit:.6,rot:.3,rem:.1,jeu:.1};
const satOf=p=>p.sat==null?65:p.sat;
const satTxt=v=>v>=75?'😀 Épanoui':v>=55?'🙂 Content':v>=35?'😐 Impatient':'😠 Mécontent';
function leadersOf(m){return [...m.squad].filter(p=>p.age>=26).sort((a,b)=>(b.lea+(b.det||10)/2)-(a.lea+(a.det||10)/2)).slice(0,3)}
// humeur du groupe (moyenne des leaders) : de -2 % à +2 % de moral en match
function teamMood(m){const l=leadersOf(m);if(!l.length)return 0;return clamp((l.reduce((s,p)=>s+satOf(p),0)/l.length-60)/20,-2,2)}
function weeklyMorale(){
  const m=ME();if(!m.mp)return;
  for(const p of m.squad){
    if(p.sat==null)p.sat=65;
    const role=roleOf(p,m),share=playShare(p,m),exp=ROLESHARE[role],amb=(p.amb||10)/10;
    let d=(share-exp)*6*(share<exp?amb:1)+(p.inj>0?0:.3);
    // promesse en cours
    if(p.prom){p.prom.n--;if(p.prom.n<=0){const ok=share>=p.prom.share;delete p.prom;
      if(ok){d+=8;mail('Vestiaire',`${p.name} : promesse tenue`,`${p.name} a eu le temps de jeu promis. Il est satisfait et le groupe a confiance en ta parole.`,{act:{player:p.id}})}
      else{d-=25;for(const q of leadersOf(m))q.sat=clamp(satOf(q)-6,0,100);mail('Vestiaire',`${p.name} : promesse non tenue`,`Tu avais promis du temps de jeu à ${p.name}, il ne l'a pas eu. Il est furieux et les cadres du vestiaire n'apprécient pas (satisfaction en baisse).`,{act:{player:p.id},imp:true})}}}
    p.sat=clamp(satOf(p)+d,0,100);
    // un mécontent demande à te voir (une fois tant que ce n'est pas réglé)
    if(p.sat<35&&!p.talk&&!p.prom&&!p.list&&R.f()<.35){p.talk=G.date;mail('Vestiaire',`${p.name} veut te parler`,`${p.name} (${GROUPS[p.g]}, ${Math.round(ovr(p))}) n'est pas content de son temps de jeu (rôle attendu : ${ROLES[role].toLowerCase()}). Réponds-lui dans l'onglet Vestiaire.`,{act:{tab:'vest'},imp:true})}
  }
}
// Réponses possibles à un joueur mécontent
const TALKOPT={prom:'Lui promettre du temps de jeu',pat:'Lui demander d’être patient',dep:'Accepter qu’il parte (liste des transferts)'};
function answerTalk(p,k){
  const m=ME();delete p.talk;
  if(k==='prom'){p.prom={n:6,share:.5};p.sat=clamp(satOf(p)+15,0,100);return `${p.name} te fait confiance : il attend au moins la moitié du temps de jeu sur les 6 prochains matchs.`}
  if(k==='pat'){const ok=(p.det||10)>=12||p.age<=23;p.sat=clamp(satOf(p)+(ok?5:-8),0,100);return ok?`${p.name} accepte d'attendre son tour.`:`${p.name} n'apprécie pas : il veut jouer maintenant.`}
  p.list=true;p.sat=clamp(satOf(p)+10,0,100);return `${p.name} est placé sur la liste des transferts : les clubs intéressés feront des offres.`;
}

// ---- Délégation : tâches confiées au staff (G.deleg) ----
const DELEG={renew:'Prolongations de contrat',youth:'Espoirs (promotions)',offers:'Offres reçues pour tes joueurs',recruit:'Compléter l’effectif (postes manquants)'};
function delegDaily(){
  const d=G.deleg||{},m=ME();
  // offres : le directeur sportif accepte les belles offres pour les joueurs hors des 15 meilleurs, refuse les autres
  if(d.offers&&(G.offers||[]).length){
    const top=[...m.squad].sort((a,b)=>ovr(b)-ovr(a)).slice(0,15).map(p=>p.id);
    for(const o of [...G.offers]){const p=m.squad.find(x=>x.id===o.pid),b=C(o.club);if(!p||!b){G.offers=G.offers.filter(x=>x!==o);continue}
      if(!top.includes(p.id)&&o.fee>=valueOf(p)*1.1&&m.squad.length>30){doTransfer(p,m,b,o.fee,salaryFor(ovr(p),p.age,b.lg),R.i(2,4));mail('Directeur sportif',`Délégation : ${p.name} vendu`,`J'ai accepté l'offre de ${b.short} pour ${p.name} (${fmtK(o.fee)}).`,{act:{tab:'market',mt:'log'}})}
      else mail('Directeur sportif',`Délégation : offre refusée pour ${p.name}`,`J'ai refusé l'offre de ${b.short} (${fmtK(o.fee)}) : ${top.includes(p.id)?'c\'est un joueur clé':'pas assez élevée'}.`);
      G.offers=G.offers.filter(x=>x.pid!==o.pid)}
  }
}
// à l'intersaison (avant de passer à la saison suivante) : prolongations, promotions des espoirs, postes manquants
function delegOffseason(){
  const d=G.deleg||{},m=ME(),log=[];
  if(d.renew){const med=[...m.squad].map(ovr).sort((a,b)=>a-b)[Math.floor(m.squad.length/2)]||60;
    for(const p of m.squad.filter(p=>p.ctr<=1&&!p.fresh&&!p.loan&&p.age<=32&&ovr(p)>=med)){const dem=wageDemand(p,m,'renew');if(mass(m)-p.sal+dem<=capOf(m)){p.sal=dem;p.ctr=p.age>=30?1:2;p.fresh=true;log.push(`${p.name} prolongé (${fmtK(dem)}/an)`)}}}
  if(d.youth)for(const p of [...(m.youth||[])]){const pos=m.squad.filter(x=>x.g===p.g).sort((a,b)=>ovr(a)-ovr(b));if(m.squad.length<50&&(p.age>=20||p.gem)&&ovr(p)>=(pos[0]?ovr(pos[0])-3:0)){promoteYouth(m,p);log.push(`${p.name} (espoir) promu en équipe pro`)}}
  if(d.recruit)for(const g in MINCOMP){let n=m.squad.filter(p=>p.g===g).length;while(n<MINCOMP[g]){const fa=(G.fa||[]).filter(p=>p.g===g).sort((a,b)=>ovr(b)-ovr(a)).find(p=>mass(m)+wageDemand(p,m,'fa')<=capOf(m));if(!fa||m.squad.length>=50)break;doTransfer(fa,null,m,0,wageDemand(fa,m,'fa'),R.i(1,2));log.push(`${fa.name} (${GROUPS[g]}, libre) recruté`);n++}}
  if(log.length)mail('Directeur sportif','Délégation : décisions de l’intersaison',log.join('<br>'),{act:{tab:'squad'}});
}

// ---- Prêts : un joueur part jouer une saison dans un club plus modeste, puis revient ----
// Le club d'accueil paie son salaire ; le joueur y gagne du temps de jeu (donc de la progression).
function loanTargets(p){
  const m=ME(),o=ovr(p);
  const ms=clubStr(m);return G.clubs.filter(c=>c.id!==m.id&&!isAmLg(c.lg)&&c.squad.length<45&&(LEVEL[c.lg]>LEVEL[m.lg]||(LEVEL[c.lg]===LEVEL[m.lg]&&clubStr(c)<ms-2))).map(c=>{const pos=c.squad.filter(x=>x.g===p.g).sort((a,b)=>ovr(b)-ovr(a)),rk=pos.filter(x=>ovr(x)>o).length;return{c,rk}})
    .filter(x=>x.rk<STARTERS[p.g]+1).sort((a,b)=>a.rk-b.rk||LEVEL[a.c.lg]-LEVEL[b.c.lg]).slice(0,4);
}
function loanOut(p,c){
  const m=ME();removeFromClub(p,m);p.loan={from:m.id,s:G.season};p.list=false;c.squad.push(p);
  addNews(`🔁 ${p.name} est prêté à ${c.short} jusqu'à la fin de la saison.`);
}
const loanedOut=()=>G.clubs.concat(G.ext||[]).flatMap(c=>c.squad.filter(p=>p.loan&&p.loan.from===G.meId).map(p=>({p,c})));
// fin de saison : retour des joueurs prêtés (appelé par nextSeason)
function returnLoans(){
  for(const c of G.clubs.concat(G.ext||[]))for(const p of [...c.squad])if(p.loan){const own=C(p.loan.from);removeFromClub(p,c);delete p.loan;
    p.ctr--;if(own&&p.ctr<=0){if(own.id===G.meId)addNews(`${p.name} revient de prêt en fin de contrat et part libre.`);p.faT=0;G.fa.push(p);continue}
    if(own){own.squad.push(p);if(own.id===G.meId)addNews(`🔁 Retour de prêt : ${p.name} (${Math.round(ovr(p))}, ${p.hist&&p.hist.length?p.hist[p.hist.length-1].mj+' matchs':'0 match'} à ${c.short}).`)}else{p.ctr=0;p.faT=0;G.fa.push(p)}}
}

// ---- Liste des prêts (dans les deux sens) ----
// Tes joueurs sur la liste des prêts (p.loanList) reçoivent des demandes de clubs plus modestes (G.loanOffers).
// Les autres clubs proposent en prêt leurs jeunes et remplaçants (loanAvailable) : tu peux les demander ;
// un joueur emprunté porte p.loan = {from: club prêteur} et repart en fin de saison (returnLoans).
const loanWindow=()=>G.phase==='offseason'||windowOpen();
function genLoanOffers(p,n){
  const m=ME();G.loanOffers=G.loanOffers||[];
  const T=loanTargets(p).filter(x=>!G.loanOffers.some(o=>o.pid===p.id&&o.club===x.c.id));
  for(const x of shuffle(T).slice(0,n)){G.loanOffers.push({pid:p.id,club:x.c.id,exp:G.phase==='season'?dAdd(G.date,10):null});mail('Directeur sportif',`Demande de prêt : ${p.name}`,`${x.c.name} (${LEAGUES[x.c.lg]?LEAGUES[x.c.lg].name:''}) aimerait accueillir ${p.name} en prêt jusqu'à la fin de la saison (rôle prévu : ${x.rk<STARTERS[p.g]?'titulaire':'rotation'}). Le club d'accueil paierait son salaire.`,{act:{tab:'market',mt:'loans'},imp:true})}
}
// chaque lundi de mercato : des clubs s'intéressent aux joueurs de ta liste
function loanWeekly(){if(!loanWindow())return;G.loanOffers=(G.loanOffers||[]).filter(o=>!o.exp||o.exp>=G.date);for(const p of ME().squad)if(p.loanList&&!p.loan&&R.f()<.3)genLoanOffers(p,1)}
function acceptLoanOffer(i){
  const o=(G.loanOffers||[])[i];if(!o)return false;const m=ME(),p=m.squad.find(x=>x.id===o.pid),c=C(o.club);
  G.loanOffers=G.loanOffers.filter(x=>x.pid!==o.pid);if(!p||!c||!loanWindow())return false;delete p.loanList;loanOut(p,c);return true;
}
// joueurs proposés en prêt par les autres clubs : jeunes (24 ans au plus) qui ne sont pas titulaires chez eux
function loanAvailable(){
  const m=ME(),out=[];
  for(const c of G.clubs){if(c.id===m.id||isAmLg(c.lg)||LEVEL[c.lg]>LEVEL[m.lg]+1)continue;
    for(const p of c.squad){if(p.loan||p.age>24||p.inj>0)continue;const rk=c.squad.filter(x=>x.g===p.g&&ovr(x)>ovr(p)).length;if(rk>=STARTERS[p.g])out.push({p,c,rk})}}
  return out;
}
// demande de prêt d'un joueur d'un autre club : il accepte s'il jouera chez toi, si ton plafond salarial le permet
function askLoan(p,c){
  const m=ME();if(!loanWindow())return 'La fenêtre de transferts est fermée (prêts : intersaison et mercato d’hiver).';
  if(m.squad.length>=50)return 'Effectif complet (50 joueurs).';
  if(mass(m)+p.sal>capOf(m))return `Ton plafond salarial ne permet pas de payer son salaire (${fmtK(p.sal)}).`;
  const rk=m.squad.filter(x=>x.g===p.g&&ovr(x)>ovr(p)).length;
  if(rk>=STARTERS[p.g]+1)return `${p.name} refuse : il ne jouerait pas assez chez toi.`;
  removeFromClub(p,c);p.loan={from:c.id,s:G.season};p.fresh=false;m.squad.push(p);
  addNews(`🔁 ${p.name} arrive en prêt de ${c.short} jusqu'à la fin de la saison.`);return 'ok';
}
