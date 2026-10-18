'use strict';
// ==== MESSAGERIE ====
function mail(from,subj,body,opt){
  opt=opt||{};G.mail=G.mail||[];
  G.mail.unshift({id:G.nid++,d:G.date,from,subj,body,read:false,act:opt.act||null});
  if(G.mail.length>200)G.mail.length=200;
  if(opt.imp)G.stop=true;
}
const unread=()=>(G.mail||[]).filter(x=>!x.read).length;
// Objectif fixé par le président selon la force de l'effectif dans sa division
function setObjective(){
  const m=ME(),lg=m.lg,ids=clubsIn(lg).filter(c=>lg!=='n2'||c.poule===m.poule).sort((a,b)=>clubStr(b)-clubStr(a)).map(c=>c.id),r=ids.indexOf(m.id)+1,n=ids.length;
  let o;
  if(lg==='t14')o=r<=2?{t:1,l:'jouer le titre'}:r<=6?{t:6,l:'se qualifier pour les phases finales (top 6)'}:r<=10?{t:10,l:'finir dans la première moitié de tableau (top 10)'}:{t:12,l:'assurer le maintien (12e minimum)'};
  else if(lg==='nat')o=r<=2?{t:2,l:'jouer la montée en Pro D2 (finale)'}:r<=6?{t:6,l:'se qualifier pour les phases finales (top 6)'}:r<=10?{t:10,l:'réaliser une saison solide (top 10)'}:{t:n-2,l:'assurer le maintien'};
  else if(lg==='n2')o=r<=2?{t:2,l:'jouer la montée en Nationale (finale)'}:r<=6?{t:6,l:'se qualifier pour les phases finales (top 6 de la poule)'}:{t:n-1,l:'assurer le maintien dans la poule'};
  else if(isAmLg(lg))o=r<=2?{t:1,l:`finir en tête de la poule pour monter en ${LEAGUES[amUp(lg)].name}`}:r<=Math.ceil(n/2)?{t:Math.ceil(n/2),l:'finir dans la première moitié de la poule'}:{t:n-1,l:'éviter la dernière place de la poule'};
  else o=r<=2?{t:2,l:'monter en Top 14'}:r<=6?{t:6,l:'se qualifier pour les phases finales (top 6)'}:r<=12?{t:12,l:'réaliser une saison solide (top 12)'}:{t:14,l:'assurer le maintien (14e minimum)'};
  G.obj={...o,pre:r};setGoals();
  mail('Le président',`Objectifs de la saison ${seasonLabel()}`,`Bonjour coach,<br><br>Notre effectif est estimé ${r}e sur ${n} en ${LEAGUES[lg].name}${lg==='n2'||isAmLg(lg)?' (poule '+(m.poule+1)+')':''}. Pour cette saison, le conseil d'administration fixe trois objectifs :<br>${GOALTXT(G.obj).join('<br>')}<br><br>Ma confiance dépendra de leur ensemble, pas seulement du classement.<br><br>Budget annuel : ${fmtK(m.bud)} · masse salariale autorisée : ${fmtK(capOf(m))} · trésorerie disponible : ${fmtK(m.budget)}.<br><br>Bonne saison !`,{act:{tab:'fin'}});
}
function scoutReport(nx){
  const m=ME(),o=C(nx.f.h===m.id?nx.f.a:nx.f.h),home=nx.f.h===m.id;
  const L=G.L[o.lg];
  const res=[];if(L)for(let w=L.results.length-1;w>=0&&res.length<5;w--){const r=(L.results[w]||[]).find(x=>x.h===o.id||x.a===o.id);if(r){const my=r.h===o.id?r.sh:r.sa,op=r.h===o.id?r.sa:r.sh;res.push(my>op?'V':my<op?'D':'N')}}
  const ol=autoLineup(o),key=[...o.squad].filter(p=>ol.includes(p.id)).sort((a,b)=>ovr(b)-ovr(a)).slice(0,3);
  const to=teamCalc({...o,lineup:ol}),tm=teamCalc(m);
  const cmp=(a,b,l)=>`${l} : ${Math.round(a)} contre ${Math.round(b)} ${a>b+2?'(avantage pour nous)':a<b-2?'(avantage pour eux)':'(équilibré)'}`;
  const inj=o.squad.filter(p=>p.inj>0&&ovr(p)>=72).map(p=>p.name);
  mail('Analyste vidéo',`Rapport d'avant-match : ${o.short}`,`<b>${fmtD(nx.d)} · ${home?'à domicile':'à l\'extérieur'} contre ${o.name}</b>${o.lg===m.lg&&rankOf(o.id)?` (${rankOf(o.id)}e)`:''}.<br><br>Forme récente : ${res.reverse().join(' ')||'—'}<br>Joueurs clés : ${key.map(p=>`${p.name} (${posL(p)}, ${Math.round(ovr(p))})`).join(', ')}<br>${inj.length?'Absents notables : '+inj.join(', ')+'<br>':''}<br>${cmp(tm.pack,to.pack,'Paquet d\'avants')}<br>${cmp(tm.backs,to.backs,'Trois-quarts')}<br>${cmp(tm.kick,to.kick,'Jeu au pied / buteur')}<br><br>${tm.pack>to.pack+3?'Conseil : appuie-toi sur la conquête.':tm.backs>to.backs+3?'Conseil : fais vivre le ballon derrière.':'Conseil : match serré, la discipline fera la différence.'}`,{act:{tab:'lineup'}});
}
function fitnessReport(){
  const m=ME(),tired=m.squad.filter(p=>p.inj===0&&p.forme<72).sort((a,b)=>a.forme-b.forme),inj=m.squad.filter(p=>p.inj>0).sort((a,b)=>b.inj-a.inj);
  if(!tired.length&&!inj.length)return;
  mail('Préparateur physique','Point physique de la semaine',`${tired.length?'<b>Joueurs fatigués</b> (à faire tourner) :<br>'+tired.slice(0,8).map(p=>`${p.name} · ${Math.round(p.forme)} %`).join('<br>')+'<br><br>':''}${inj.length?'<b>Infirmerie</b> :<br>'+inj.map(p=>`${p.name} · retour dans ${injDur(p.inj)}`).join('<br>'):''}`,{act:{tab:'squad'}});
}
const injDur=d=>d<7?`${d} jour${d>1?'s':''}`:`${Math.round(d/7)} semaine${Math.round(d/7)>1?'s':''}`;
function monthlyMails(){
  const m=ME(),L=G.L[m.lg];
  // temps de jeu
  // temps de jeu : un ambitieux réclame plus tôt, un joueur peu ambitieux se contente de son rôle
  if(m.mp>=4){const un=m.squad.filter(p=>{const a=p.amb||10;return p.age<31&&ovr(p)>=(a>=14?66:70)&&playShare(p,m)<(a>=14?.35:a<=6?.1:.25)&&p.inj===0}).sort((a,b)=>ovr(b)-ovr(a))[0];
    if(un)mail(un.name,'Je veux plus de temps de jeu',`Coach,<br><br>je n'ai joué que ${un.st.mj} match(s) depuis le début de saison. ${(un.amb||10)>=14?'Je suis venu ici pour jouer et gagner des titres, pas pour regarder les matchs depuis la tribune.':'Je pense mériter ma place.'} Si ma situation ne change pas, je n'exclus pas de partir.<br><br>${un.name}`,{act:{player:un.id}})}
  // bilan du président
  if(L&&L.phase==='regular'&&L.week>=6&&G.obj){const r=rankOf(m.id),t=G.obj.t;
    mail('Le président','Point sur la saison',r<=t?`Nous sommes ${r}e. C'est conforme à l'objectif (${G.obj.l}). Continue comme ça.`:r<=t+3?`Nous sommes ${r}e, un peu en dessous de l'objectif (${G.obj.l}). Il faut redresser la barre.`:`Nous sommes ${r}e. C'est très loin de l'objectif (${G.obj.l}). Le conseil d'administration s'inquiète.`)}
}
