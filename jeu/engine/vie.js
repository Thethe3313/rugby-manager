'use strict';
// ==== Vie du club (étapes 16 à 20) : conférences de presse, journal, récompenses, installations, anciens joueurs ====
// Tout ce fichier ne concerne que le club du joueur : les clubs de l'ordinateur et le calibrage des matchs ne changent pas.

// ---- Étape 16 : conférences de presse ----
// Avant un gros match (derby, élimination directe, adversaire du haut de tableau), le journaliste pose une question : trois réponses possibles dans la messagerie.
const PRESSE_PRE=[
  ['hum','Rester humble','« Respect total pour l’adversaire, on prépare ça match après match. »','Moral +0,5 %, confiance du président +1.'],
  ['amb','Afficher de l’ambition','« On est là pour gagner, et on le montrera sur le terrain. »','Moral +1,5 %, mais si tu perds les supporters t’en veulent (−3).'],
  ['pro','Chambrer l’adversaire','« Ils viennent chez nous ? Qu’ils prennent leur temps pour la douche… »','Ton moral +2 %, celui de l’adversaire aussi +2 % ; supporters +2.']];
const PRESSE_POST=[
  ['def','Défendre ses joueurs','« Ils ont tout donné, je ne leur reproche rien. »','Satisfaction du groupe +2.'],
  ['arb','Critiquer l’arbitrage','« Certaines décisions m’interrogent… »','Supporters +3, confiance du président −2.'],
  ['ass','Assumer ses responsabilités','« C’est ma responsabilité, nous allons corriger ça. »','Confiance du président +3, supporters −1.']];
function presseBig(nm){
  const m=ME(),f=nm.f,o=C(f.h===m.id?f.a:f.h);if(!o)return null;
  if(derbyOf(m.id,o.id))return derbyOf(m.id,o.id);
  if(nm.ko)return nm.lab||'Match à élimination directe';
  if(o.lg===m.lg&&G.phase==='season'&&rankOf(o.id)&&rankOf(o.id)<=3)return`Choc contre le ${rankOf(o.id)}e du classement`;
  return null;
}
function presseDay(nx){
  const m=ME();if(!m||G.phase!=='season'||!nx||!nx.f)return;
  if(G.presseLast&&dDiff(G.presseLast,G.date)<6)return;
  const why=presseBig(nx);if(!why)return;
  const o=C(nx.f.h===m.id?nx.f.a:nx.f.h);
  G.presseLast=G.date;G.presse={opp:o.id,big:why,k:null};
  mail('Presse',`🎤 Conférence de presse avant ${o.short}`,`Demain : <b>${why}</b> contre ${o.name}. Les journalistes t’attendent : « Coach, comment abordez-vous ce match ? » Choisis ta réponse.`,{ch:{type:'pre',opts:PRESSE_PRE},imp:true});
}
// Réponse du joueur à une question (avant ou après le match)
function presseAnswer(id,k){
  const x=(G.mail||[]).find(y=>y.id===id);if(!x||!x.ch||x.ans)return;
  const o=x.ch.opts.find(a=>a[0]===k);if(!o)return;
  x.ans=k;const C_=G.coach;
  if(x.ch.type==='pre'){if(G.presse)G.presse.k=k;if(k==='hum'&&C_)C_.board=clamp(C_.board+1,0,100);if(k==='pro'&&C_)C_.fans=clamp(C_.fans+2,0,100)}
  else{
    if(k==='def')for(const p of ME().squad)p.sat=clamp((p.sat==null?60:p.sat)+2,0,100);
    if(k==='arb'&&C_){C_.fans=clamp(C_.fans+3,0,100);C_.board=clamp(C_.board-2,0,100)}
    if(k==='ass'&&C_){C_.board=clamp(C_.board+3,0,100);C_.fans=clamp(C_.fans-1,0,100)}
    addNews(`🎤 Le coach de ${ME().short} : ${o[2]}`);
  }
}
// Moral du match (appelé par newMatch pour le club du joueur) : renvoie le multiplicateur pour toi et pour l'adversaire
function presseMor(oppId){
  const P=G.presse;if(!P||P.opp!==oppId||!P.k)return[1,1];
  return{hum:[1.005,1],amb:[1.015,1],pro:[1.02,1.02]}[P.k]||[1,1];
}
// Après le match : sanction éventuelle de l'ambition, puis question d'après-match
function presseAfter(r){
  const m=ME(),P=G.presse;if(!P)return;
  const home=r.h===m.id,o=C(home?r.a:r.h);if(!o||o.id!==P.opp)return;
  const my=home?r.sh:r.sa,op=home?r.sa:r.sh,C_=G.coach;
  if(P.k==='amb'&&my<op&&C_)C_.fans=clamp(C_.fans-3,0,100);
  delete G.presse;
  mail('Presse',`🎤 Conférence de presse d’après-match : ${o.short}`,`${my>op?'Victoire':my===op?'Match nul':'Défaite'} ${my}-${op}. « Coach, votre réaction à chaud ? » Choisis ta réponse.`,{ch:{type:'post',opts:PRESSE_POST}});
}

// ---- Étape 17 : le journal de la journée (« L’Ovalie Quotidienne », journal inventé) ----
// Après chaque journée de ton championnat : le titre du jour (surprise, carton, festival d’essais), les résultats, une éventuelle polémique et ton club dans la presse.
function gazette(lg){
  const L=G.L[lg],m=ME(),w=L.week-1,res=(L.results[w]||[]);if(!res.length)return;
  const nm=id=>C(id)?C(id).short:'?',sc=r=>`${nm(r.h)} ${r.sh}-${r.sa} ${nm(r.a)}`;
  // classement avant cette journée approché par la force des équipes : la plus grosse surprise
  const str=id=>clubStr(C(id)),win=r=>r.sh>r.sa?r.h:r.sa>r.sh?r.a:null;
  const up=res.filter(r=>win(r)).map(r=>({r,gap:str(r.h===win(r)?r.a:r.h)-str(win(r))})).sort((a,b)=>b.gap-a.gap)[0];
  const big=[...res].sort((a,b)=>Math.abs(b.sh-b.sa)-Math.abs(a.sh-a.sa))[0];
  const fest=[...res].sort((a,b)=>(b.th+b.ta)-(a.th+a.ta))[0];
  const mine=res.find(r=>r.h===m.id||r.a===m.id);
  let head;
  if(up&&up.gap>=4)head=`Surprise : ${nm(win(up.r))} renverse ${nm(up.r.h===win(up.r)?up.r.a:up.r.h)} (${up.r.sh}-${up.r.sa})`;
  else if(Math.abs(big.sh-big.sa)>=25)head=`Démonstration : ${nm(win(big))} écrase ${nm(big.h===win(big)?big.a:big.h)} (${big.sh}-${big.sa})`;
  else if(fest.th+fest.ta>=10)head=`Festival d’essais : ${fest.th+fest.ta} essais dans ${nm(fest.h)}-${nm(fest.a)}`;
  else if(mine)head=`${win(mine)===m.id?'Victoire':win(mine)?'Défaite':'Match nul'} de ${m.short} : ${sc(mine)}`;
  else head=`Journée ${w+1} : ${sc(res[0])}`;
  const cards=[...res].filter(r=>r.yc).sort((a,b)=>(b.yc[0]+b.yc[1])-(a.yc[0]+a.yc[1]))[0],yc=cards?cards.yc[0]+cards.yc[1]:0;
  const pol=yc>=4?`<p><b>Polémique :</b> ${yc} cartons jaunes dans ${nm(cards.h)}-${nm(cards.a)}. Les entraîneurs dénoncent un arbitrage « à la tête du client », la commission de discipline va se pencher sur le dossier.</p>`:'';
  const t=sortedTable(lg,m.poule),rk=t.findIndex(x=>x.id===m.id)+1,lead=t[0]?C(t[0].id).short:'';
  const press=mine?(win(mine)===m.id?`« ${m.short} sait gagner : ${sc(mine)}, et la ${rk}e place au classement. »`:win(mine)?`« ${m.short} tombe d’un cran : ${sc(mine)}, ${rk}e du classement. Le coach sous pression ? »`:`« ${m.short} accroché : ${sc(mine)}. »`):'';
  const date=fmtD(G.date,true);
  const ed=`<div style="border:1px solid var(--line);border-radius:8px;padding:12px"><div class="mut" style="font-variant:small-caps;letter-spacing:1px">L’Ovalie Quotidienne · ${date} · journée ${w+1}</div><h3 style="margin:6px 0">${head}</h3><p><b>Les résultats</b><br>${res.map(sc).join('<br>')}</p>${pol}<p><b>Au classement</b> : ${lead} en tête. ${press}</p></div>`;
  mail('L’Ovalie Quotidienne',`📰 ${head}`,ed);
  G.news=G.news||[];
}

// ---- Étape 18 : récompenses de la saison et records ----
// Nuits du rugby de fin de saison, dans ton championnat : meilleur joueur (note moyenne), révélation (22 ans ou moins), meilleur marqueur d’essais, équipe type, entraîneur de l’année.
function awardsSeasonEnd(){
  const m=ME(),lg=m.lg;if(!G.L[lg])return;
  G.awards=G.awards||[];
  const cl=clubsIn(lg),ent=[];
  for(const c of cl)for(const p of c.squad){if(p.st&&p.st.mj>=8&&p.st.nn)ent.push({p,c,avg:p.st.nt/p.st.nn})}
  if(ent.length<20)return;
  const pl=e=>({id:e.p.id,n:e.p.name,c:e.c.short,pos:posL(e.p),avg:Math.round(e.avg*100)/100,es:e.p.st.es,age:e.p.age,me:e.c.id===m.id});
  const best=[...ent].sort((a,b)=>b.avg-a.avg)[0];
  const rev=[...ent].filter(e=>e.p.age<=22).sort((a,b)=>b.avg-a.avg)[0];
  const tr=[...ent].sort((a,b)=>b.p.st.es-a.p.st.es)[0];
  // équipe type : le meilleur noté à chaque poste du XV
  const used=new Set(),xv=[];
  for(let i=0;i<15;i++){const s=SLOTS[i],c=ent.filter(e=>!used.has(e.p.id)&&s[3].includes(e.p.g)).sort((a,b)=>b.avg-a.avg)[0];if(c){used.add(c.p.id);xv.push({...pl(c),no:s[0]})}}
  // entraîneur de l’année : le club qui finit le plus au-dessus de ce que laissait prévoir sa force
  const byStr=[...cl].sort((a,b)=>clubStr(b)-clubStr(a)).map(c=>c.id),tab=sortedTable(lg,m.poule);
  const coach=[...tab].map((r,i)=>({id:r.id,gain:byStr.indexOf(r.id)-i})).sort((a,b)=>b.gain-a.gain||0)[0];
  const A={s:seasonLabel(),lg,best:pl(best),rev:rev?pl(rev):null,tr:pl(tr),xv,coach:coach?C(coach.id).short:null,coachMe:coach&&coach.id===m.id,gain:coach?coach.gain:0};
  G.awards.unshift(A);if(G.awards.length>20)G.awards.length=20;
  const mine=[best.c.id===m.id&&'Meilleur joueur',rev&&rev.c.id===m.id&&'Révélation',tr.c.id===m.id&&'Meilleur marqueur d’essais',A.coachMe&&'Entraîneur de l’année'].filter(Boolean),inXI=xv.filter(x=>x.me).length;
  addNews(`🏅 Trophées ${A.s} : meilleur joueur ${best.p.name} (${best.c.short}), révélation ${rev?rev.p.name:'—'}.`);
  mail('La Ligue',`🏅 Trophées de la saison ${A.s}`,`Les trophées du ${LEAGUES[lg].name} sont décernés.<br><br>Meilleur joueur : <b>${best.p.name}</b> (${best.c.short}, ${A.best.avg}/10)<br>Révélation : <b>${rev?rev.p.name+' ('+rev.c.short+')':'—'}</b><br>Meilleur marqueur d’essais : <b>${tr.p.name}</b> (${tr.c.short}, ${tr.p.st.es})<br>Entraîneur de l’année : <b>${A.coach||'—'}</b>${A.coachMe?' — c’est toi !':''}<br><br>${mine.length?'🎉 Récompenses pour ton club : <b>'+mine.join(', ')+'</b>. ':''}${inXI?`${inXI} de tes joueur(s) dans l’équipe type.`:'Aucun de tes joueurs dans l’équipe type.'}`,{act:{tab:'histo'}});
  if(A.coachMe&&G.coach)G.coach.prest=(G.coach.prest||0)+2;
}
