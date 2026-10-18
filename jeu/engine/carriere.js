'use strict';
// ==== CARRIÈRE D'ENTRAÎNEUR : prestige, confiance, objectifs multiples, offres, licenciement ====
// G.coach = {prest (0-100), board (confiance du président, 0-100), fans (supporters, 0-100), hist[], warned, sacked}
// Le président juge la saison sur trois objectifs pondérés (sportif, finances, formation) : finir 8e avec le plus petit
// budget peut être une réussite, finir 3e avec le meilleur effectif un échec. Le verdict fait bouger confiance et prestige ;
// le prestige ouvre les postes des autres clubs (offres à l'intersaison, ou après un licenciement).

// Prestige qu'il faut pour être pris au sérieux par un club (selon sa division et son budget)
const PREQ={t14:55,pd2:38,nat:30,n2:24,f1:18,f2:14,f3:10,r1:6,r2:3,r3:0};
function clubReq(c){
  const lg=c.lg||'r3';let r=PREQ[lg]!=null?PREQ[lg]:20;
  if(lg==='t14')r+=clamp((c.bud-23000)/37000,0,1)*35;else if(lg==='pd2')r+=clamp((c.bud-5500)/14500,0,1)*12;
  return Math.round(r);
}
function initCoach(){const m=ME();G.coach={prest:Math.max(4,clubReq(m)-4),board:65,fans:60,hist:[],warned:false,sacked:false}}

// Objectifs de la saison : sportif (classement), finances (résultat de la saison), formation (temps de jeu des moins de 24 ans)
function setGoals(){
  const m=ME(),rich=m.lg==='t14'&&m.bud>35000,am=isAmLg(m.lg)||m.lg==='n2';
  const w=rich?{sp:.7,fi:.18,fo:.12}:am?{sp:.5,fi:.3,fo:.2}:{sp:.6,fi:.25,fo:.15};
  const fo=rich?.12:am?.25:.18; // part des titularisations à confier aux moins de 24 ans
  Object.assign(G.obj,{w,fi:0,fo});
}
const GOALTXT=o=>[`<b>Sportif (${Math.round(o.w.sp*100)} %)</b> : ${o.l}`,`<b>Finances (${Math.round(o.w.fi*100)} %)</b> : finir la saison sans perte (recettes au moins égales aux dépenses)`,`<b>Formation (${Math.round(o.w.fo*100)} %)</b> : confier au moins ${Math.round(o.fo*100)} % des titularisations à des joueurs de moins de 24 ans`];

// Part des titularisations des moins de 24 ans cette saison
function youngShare(m){let y=0,t=0;for(const p of m.squad){const n=p.st.tit||0;t+=n;if(p.age<=23)y+=n}return t?y/t:0}
// résultat de la saison : recettes (billetterie, partenaires, primes, transferts) moins dépenses (salaires, staff, fonctionnement)
const finTotal=()=>{const f=G.fin||{};return (f.ticket||0)+(f.sponsor||0)+(f.prize||0)+(f.transfers||0)-(f.wages||0)-(f.staff||0)-(f.opex||0)};

// Après chaque match de championnat du joueur : la confiance suit le résultat par rapport à ce qu'on attendait
function coachAfterMatch(r){
  const C_=G.coach,m=ME();if(!C_||!r||r.ko)return;
  const home=r.h===m.id,o=C(home?r.a:r.h),my=home?r.sh:r.sa,op=home?r.sa:r.sh;
  const p=1/(1+Math.exp(-(clubStr(m)-clubStr(o)+(home?3:-3))/5)),res=my>op?1:my===op?.5:0;
  C_.board=clamp(C_.board+(res-p)*6-(op-my>=25?2:0),0,100);
  C_.fans=clamp(C_.fans+(res-p)*5+(home?(res===1?1:res===0?-1:0):0),0,100);
  if(C_.board<30&&!C_.warned){C_.warned=true;mail('Le président','Ma confiance s’effrite',`Les résultats ne sont pas à la hauteur de nos moyens. Il faut réagir vite : si cela continue, je devrai prendre une décision.`,{imp:true})}
  if(C_.board>=40)C_.warned=false;
  if(C_.board<=10&&G.phase==='season'){sackCoach(true)}
}
// Supporters : vendre une star les fâche, recruter un grand joueur les enthousiasme
function fansTransfer(p,out){const C_=G.coach;if(!C_)return;const m=ME(),best=[...m.squad].sort((a,b)=>ovr(b)-ovr(a))[out?2:4];const big=best&&ovr(p)>=ovr(best);if(big)C_.fans=clamp(C_.fans+(out?-6:4),0,100)}

// Verdict de fin de saison (appelé par finishSeason)
function seasonVerdict(rank,n){
  const C_=G.coach,o=G.obj,m=ME();if(!C_||!o||!o.w)return null;
  const sp=rank<=o.t?.4+.6*Math.min(1,(o.t-rank+1)/3):-Math.min(1,(rank-o.t)/Math.max(2,n*.2));
  const ft=finTotal(),fi=ft>=0?Math.min(1,.4+ft/Math.max(200,m.bud*.05)*.6):Math.max(-1,ft/Math.max(200,m.bud*.06));
  const ys=youngShare(m),fo=ys>=o.fo?Math.min(1,.4+(ys-o.fo)*4):-Math.min(1,(o.fo-ys)/o.fo);
  const tot=o.w.sp*sp+o.w.fi*fi+o.w.fo*fo;
  C_.board=clamp(C_.board+tot*25,0,100);C_.fans=clamp(C_.fans+sp*10,0,100);
  const s=G.summary||{},title=s.champ===m.id,up=s.fate==='promu';
  const dP=tot*6+(title?(m.lg==='t14'?12:6):0)+(up?5:0)+(clubReq(m)>C_.prest?1.5:0);
  C_.prest=clamp(Math.round((C_.prest+dP)*10)/10,0,100);
  const v={sp,fi,fo,ys,ft,tot,dP:Math.round(dP*10)/10};
  C_.hist.push({s:seasonLabel(),club:m.short,lg:m.lg,rank,tot:Math.round(tot*100)/100,title,fate:s.fate});
  if(C_.board<20)sackCoach(false);
  else{const n_=tot>.3?R.i(1,3):tot>-.2?R.i(0,2):R.i(0,1);G.jobOffers=genJobOffers(n_,false)}
  return v;
}
// Licenciement : mi-saison (mid) ou fin de saison
function sackCoach(mid){
  const C_=G.coach,m=ME();C_.sacked=true;C_.prest=clamp(C_.prest-4,0,100);C_.board=0;
  C_.hist.push({s:seasonLabel(),club:m.short,lg:m.lg,rank:rankOf(m.id),sacked:true});
  G.jobOffers=genJobOffers(Math.max(2,R.i(2,4)),mid);G.sackMid=!!mid;G.phase='sacked';
  addNews(`❌ ${m.name} se sépare de toi.`);
}
// Offres de clubs : postes accessibles avec ton prestige (de bien au-dessous à un peu au-dessus), surtout des clubs en difficulté
function genJobOffers(n,mid){
  const P=G.coach.prest,m=ME(),cands=[];
  // en cours de saison : même championnat, ou un championnat professionnel si on y est déjà (le calendrier continue)
  const okMid=c=>c.lg===m.lg||(LGORDER.includes(c.lg)&&LGORDER.includes(m.lg));
  for(const c of G.clubs)if(c.id!==m.id&&(!mid||okMid(c))){const q=clubReq(c);if(q<=P+6&&q>=P-22)cands.push({id:c.id,q})}
  if(!mid&&G.AMD)for(const k of AMORDER)for(const a of G.AMD[k].clubs){const q=clubReq({lg:k});if(q<=P+6&&q>=P-22)cands.push({id:a.id,q,k})}
  const out=[];
  for(let i=0;i<n&&cands.length;i++){
    // les clubs mal classés et ceux du niveau de ton prestige sont plus souvent candidats
    const wt=cands.map(x=>{const c=C(x.id),rk=c&&G.L&&G.L[c.lg]?rankOf(c.id)/Math.max(1,clubsIn(c.lg).length):.5;return Math.max(.05,1-Math.abs(P-x.q)/30)*(.5+rk)});
    let t=R.f()*wt.reduce((a,b)=>a+b,0),j=0;while(j<wt.length-1&&t>wt[j]){t-=wt[j];j++}
    const x=cands.splice(j,1)[0],c=amC(x.id);out.push({id:x.id,k:x.k||null,name:c.name,lg:x.k||c.lg,q:x.q});
  }
  if(!out.length){const c=G.clubs.filter(c=>c.id!==m.id&&(!mid||okMid(c))).sort((a,b)=>clubReq(a)-clubReq(b))[0];if(c)out.push({id:c.id,k:null,name:c.name,lg:c.lg,q:clubReq(c)})}
  return out;
}
// Accepter un poste : le club du joueur change (l'ancien redevient un club géré par l'ordinateur)
function takeJob(id){
  const o=(G.jobOffers||[]).find(x=>x.id===id);if(!o)return false;
  const old=ME();old.autoXV=true;
  if(o.k&&!C(id)){const a=takeLight(o.k,id);if(!a)return false;const c=mkClub([a.id,a.name,a.short,a.str],o.k);c.poule=a.poule;c.youth=[];c.amStr=a.str;if(a.f)c.fict=1;if(a.reg)c.reg=a.reg;G.clubs.push(c)}
  G.meId=id;const m=ME();if(!(m.budget>0))m.budget=Math.round(m.bud*.05);m.autoXV=true;
  const C_=G.coach;C_.sacked=false;C_.board=65;C_.fans=60;C_.warned=false;G.jobOffers=[];
  G.fin=zeroFin();G.offers=[];G.bids=[];G.follow=G.follow||[];
  if(G.phase==='sacked')G.phase=G.sackMid?'season':'offseason';
  if(G.phase==='season'){setObjective();m.lineup=autoLineup(m)}
  addNews(`✍ Tu deviens l'entraîneur de ${m.name} (${LEAGUES[m.lg]?LEAGUES[m.lg].name:''}).`);
  mail('Le président',`Bienvenue à ${m.name}`,`Bienvenue au club, coach. Nous comptons sur toi.${G.phase==='season'?' Tes objectifs t\'attendent dans le message suivant.':' Tes objectifs te seront fixés au début de la saison.'}`);
  return true;
}
