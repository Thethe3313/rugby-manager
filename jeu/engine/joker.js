'use strict';
// ==== Joker médical (Top 14) ====
// Règle réelle (LNR ; sources : actu.fr mars 2025, LNR février 2026) : un club peut recruter un remplaçant temporaire pour un joueur blessé au moins 3 mois,
// avec l'autorisation de la commission médicale de la LNR, avant une date butoir (fin mars). Le salaire du joker doit tenir dans le salary cap alors que celui du blessé
// y reste compté ; en revanche le blessé n'est plus payé par le club (sécurité sociale, avec plafond) : son salaire sort du budget.
// (Depuis 2026-27, un joker pour un joueur blessé en équipe nationale est même exclu de l'assiette du cap : non reproduit, les sélections ne causent pas de blessures dans le jeu.)
const JOKER_DAYS=90;
// Fenêtre de demande : d'août à fin mars
const jokerWindow=()=>{const mo=+G.date.slice(5,7);return mo>=8||mo<=3};
// Le joueur blessé de ton club peut-il être remplacé par un joker ?
function jokerOK(p){
  const m=ME();
  return !!(m&&m.lg==='t14'&&G.phase==='season'&&jokerWindow()&&!p.joker&&p.inj>=JOKER_DAYS&&!p.loan&&!away(p)&&m.squad.some(x=>x.id===p.id)&&!m.squad.some(x=>x.joker&&x.joker.for===p.id));
}
// Joueurs libres du même poste, les meilleurs d'abord
function jokerCandidates(inj){
  return(G.fa||[]).filter(p=>p.g===inj.g).sort((a,b)=>ovr(b)-ovr(a)).slice(0,8);
}
const jokerSalary=p=>Math.round(wageDemand(p,ME(),'move')/5)*5;
function jokerSign(injId,pid){
  const m=ME(),inj=m.squad.find(x=>x.id===injId),p=(G.fa||[]).find(x=>x.id===pid);
  if(!inj||!p||!jokerOK(inj))return'Ce joker n\'est plus possible.';
  const sal=jokerSalary(p),r=evalOffer(p,null,0,sal,1,false,true);
  if(r&&r.msg)return r.msg;
  G.fa=G.fa.filter(x=>x.id!==pid);
  p.sal=sal;p.ctr=1;p.list=false;p.joker={for:injId};delete p.faT;p.forme=Math.min(p.forme,85);
  m.squad.push(p);
  G.fin.transfers+=0;
  const txt=`Joker médical : ${p.name} (${posL(p)}, ${Math.round(ovr(p))}) remplace ${inj.name}, blessé ${injDur(inj.inj)}`;
  tlog(txt);addNews('🩹 '+txt+'.');
  mail('Directeur sportif',`Joker médical : ${p.name}`,`La LNR a validé le recrutement de <b>${p.name}</b> (${posL(p)}, ${Math.round(ovr(p))}) comme joker médical de <b>${inj.name}</b>, absent ${injDur(inj.inj)}. Son salaire (${fmtK(sal)}/an) compte dans le salary cap. Tant que le joker est là, ${inj.name} n'est plus payé par le club (sécurité sociale). Le contrat du joker s'arrête au retour du blessé.`,{act:{player:p.id}});
  return null;
}
// Chaque jour : fin du contrat du joker quand le blessé est de retour
function jokerDaily(){
  const m=ME();if(!m)return;
  for(const p of [...m.squad]){
    if(!p.joker)continue;
    const inj=m.squad.find(x=>x.id===p.joker.for);
    if(!inj||inj.inj<=0)jokerEnd(p,inj?`${inj.name} est de retour.`:'Le joueur remplacé a quitté le club.');
  }
}
function jokerEnd(p,why){
  const m=ME();
  m.squad=m.squad.filter(x=>x.id!==p.id);m.lineup=m.lineup.map(id=>id===p.id?null:id);
  delete p.joker;p.ctr=0;p.faT=0;G.fa.push(p);
  mail('Directeur sportif',`Fin du contrat de ton joker : ${p.name}`,`${why} Le contrat de joker médical de <b>${p.name}</b> prend fin : il retourne sur le marché des joueurs libres.`);
  fixLineup(m);
}
// Fin de saison : tous les jokers repartent
function jokerSeasonEnd(){const m=ME();if(!m)return;for(const p of [...m.squad])if(p.joker)jokerEnd(p,'La saison est terminée.')}
// Masse salariale réellement payée par le club : le blessé remplacé par un joker est pris en charge par la sécurité sociale
const wageMass=m=>m.squad.reduce((s,p)=>s+(m.squad.some(j=>j.joker&&j.joker.for===p.id)?0:p.sal),0);
