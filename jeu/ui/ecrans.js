// Interface : écrans principaux (accueil, composition, calendrier, classement, aide)
function viewStart(){
  const has=!!localStorage.getItem(SAVE_KEY);
  const card=(c,lg)=>{const ref=lg==='t14'?62:56;return `<div class="c" data-a="start" data-id="${c[0]}"><b>${c[1]}</b><div class="mut">Niveau ${'★'.repeat(clamp(Math.round((c[3]-ref)/4)+1,1,5))}</div></div>`};
  return `<div class="center"><h1>🏉 Rugby Manager</h1><p class="mut">Prends en main un club de Top 14 ou de Pro D2 : compose ton XV, choisis ta tactique, gère ton effectif, ton budget et le plafond salarial. Effectifs réels de la saison 2026-27 (notes estimées).</p>
  <p class="row">${has?`<button class="btn" data-a="continue">▶ Continuer la partie sauvegardée</button>`:''}<label class="btn sec">⬆ Importer une partie (fichier)<input type="file" accept=".json,application/json" data-a="importSave" hidden></label></p>
  <h2>Nouvelle partie : choisis ton club</h2>
  <h3>Top 14</h3><div class="clubs">${CLUBS0.map(c=>card(c,'t14')).join('')}</div>
  <h3 style="margin-top:16px">Pro D2</h3><div class="clubs">${PD2CLUBS.map(c=>card(c,'pd2')).join('')}</div>
  <p class="mut">Conseil si tu débutes : en Top 14, prends un club du milieu de tableau (Pau, Bayonne, Lyon). En Pro D2, l'objectif est de monter en Top 14. Lis l'onglet « Rugby 101 » une fois en jeu.</p></div>`;
}
function viewSacked(){
  return `<div class="center"><h1>Licencié 😢</h1><p>Ton club est relégué en Nationale. Le conseil d'administration met fin à ton contrat.</p><button class="btn" data-a="menu">Nouvelle partie</button></div>`;
}
function ratingRows(t){
  const row=(n,v)=>`<tr><td>${n}</td><td class="n ${oc(v)}"><b>${rd(v)}</b></td></tr>`;
  return row('Conquête (avants)',t.pack)+row('Ligne de trois-quarts',t.backs)+row('Jeu au pied',t.kick)+row('Banc',t.bench);
}
function viewHome(){
  const m=ME(),nm=myNextMatch(),nx=nm&&(G.phase==='access'||nm.d)?nm.f:null;
  let h=`<div class="card row"><button class="btn" data-a="cont">Continuer ▶ <span style="font-weight:400">(jour suivant)</span></button><button class="btn sec" data-a="toMatch">⏩ Jusqu'au prochain match</button>${unread()?`<button class="btn sec" data-a="tab" data-t="mail">✉ ${unread()} message(s) non lu(s)</button>`:''}</div>`;
  if(nx){
    const home=nx.h===m.id,o=C(home?nx.a:nx.h);
    const tm=teamCalc(m),to=teamCalc({...o,lineup:autoLineup(o)});
    const bad=m.lineup.filter((id,i)=>{const p=m.squad.find(x=>x.id===id);return !p||p.inj>0}).length;
    const dd=dDiff(G.date,nm.d);
    h+=`<div class="card"><h3>Prochain match · ${fmtD(nm.d)} ${dd===0?'(aujourd\'hui)':dd===1?'(demain)':'(dans '+dd+' jours)'} · ${LEAGUES[m.lg].name}${nm.w!==undefined?' · Journée '+(nm.w+1):' · '+stageLabel(m)}${G.phase==='access'?(nx.kind==='t14'?' (pour une place en Top 14)':' (pour une place en Pro D2)'):''}</h3>
    <div class="vs"><div>${home?m.short:o.short}<small>${home?'Domicile':''}</small></div><div class="mut">vs</div><div>${home?o.short:m.short}<small>${home?'':'Domicile'}</small></div></div>
    <div class="grid g2"><div><b>${m.short}</b><table>${ratingRows(tm)}</table></div><div><b>${o.short}</b> <span class="mut">${o.lg==='nat'?'(Nationale)':o.lg!==m.lg?'('+LEAGUES[o.lg].name+', '+rankOf(o.id)+'e)':'(classé '+rankOf(o.id)+'e)'}</span><table>${ratingRows(to)}</table></div></div>
    ${bad?`<p class="warn">⚠ ${bad} indisponible(s) dans ta composition. Elle sera corrigée automatiquement ; vérifie l'onglet Composition.</p>`:''}
    <p><button class="btn sec" data-a="tab" data-t="lineup">Composition & tactique</button></p></div>`;
  }
  if(windowOpen()||(G.offers||[]).length)h+=`<div class="card">${winBanner()}${(G.offers||[]).length?`<p><b>${G.offers.length} offre(s) reçue(s)</b> pour tes joueurs. <button class="btn sm" data-a="goOffers">Voir</button></p>`:''}</div>`;
  const tb=sortedTable(m.lg);
  h+=`<div class="grid g2"><div class="card"><h3>Classement ${LEAGUES[m.lg].name}</h3><table><tr><th>#</th><th>Club</th><th class="n">J</th><th class="n">Pts</th></tr>${tb.map((r,i)=>({r,i})).filter(x=>x.i<6||x.r.id===m.id).map(x=>`<tr class="${x.r.id===m.id?'me':''}"><td>${x.i+1}</td><td>${C(x.r.id).short}</td><td class="n">${x.r.j}</td><td class="n"><b>${x.r.pts}</b></td></tr>`).join('')}</table></div>
  <div class="card"><h3>Actualités</h3>${G.news.slice(0,9).map(n=>`<p>• ${n}</p>`).join('')}</div></div>`;
  return h;
}
function viewOffseason(){
  const m=ME(),s=G.summary;
  const exp=m.squad.filter(p=>p.ctr<=1).sort((a,b)=>ovr(b)-ovr(a));
  const fateTxt={promu:'<p class="ok"><b>⬆ Montée en Top 14 !</b></p>','relégué':'<p class="ko"><b>⬇ Descente en Pro D2.</b> Les revenus et le plafond salarial baissent : il faudra peut-être alléger la masse salariale.</p>',nationale:'<p class="ko"><b>Descente en Nationale : le club te licencie.</b></p>',maintenu:''}[s.fate];
  return `<div class="card"><h2>Bilan de la saison ${seasonLabel()}</h2>
  <p>${LEAGUES[s.lg].name} : <b>${s.rank}e</b>. ${s.qualified?'Tu as disputé les phases finales.':'Pas de phases finales pour toi.'}${s.prize?` Prime : <b>${k(s.prize)}</b>.`:''}</p>
  ${fateTxt}
  <p>Champion de France (Top 14) : <b>${C(s.champT14).name}</b> · Champion de Pro D2 : <b>${C(s.champPD2).name}</b></p>
  <p class="mut">Barrages d'accession : ${s.acc.join(' · ')}</p>
  <p class="mut">Montent en Top 14 : ${G.moves.up.map(id=>C(id).short).join(', ')} · Descendent en Pro D2 : ${G.moves.down.map(id=>C(id).short).join(', ')} · Descendent en Nationale : ${G.moves.pd2down.map(id=>C(id).short).join(', ')} · Montent de Nationale : ${G.moves.natUp.map(id=>C(id).short).join(', ')}</p>
  <button class="btn" data-a="nextSeason">${s.fate==='nationale'?'Découvrir mon sort':'Passer à la saison suivante'}</button></div>
  ${staffRenewCard()}
  <div class="card"><h3>Joueurs en fin de contrat (${exp.length})</h3><p class="mut">Prolonge-les avant de passer à la saison suivante, sinon ils partent libres. Le mercato d'été est ouvert : c'est le moment de recruter (onglet Mercato).</p>
  <table><tr><th>Nom</th><th>Poste</th><th>Âge</th><th class="n">Note</th><th class="n">Salaire</th><th class="n">Demande</th><th></th></tr>${exp.map(p=>`<tr><td>${p.name}</td><td>${posL(p)}</td><td>${p.age}</td><td class="n ${oc(ovr(p))}">${rd(ovr(p))}</td><td class="n">${k(p.sal)}</td><td class="n">${k(wageDemand(p,m,'renew'))}</td><td>${p.fresh?'<span class="ok">Prolongé</span>':`<button class="btn sm" data-a="neg" data-id="${p.id}" data-mode="renew">Négocier</button>`}</td></tr>`).join('')}</table></div>`;
}
function viewLineup(){
  const m=ME(),t=teamCalc(m);
  const opt=(p,i)=>`<option value="${p.id}" ${m.lineup[i]===p.id?'selected':''} ${p.inj>0?'disabled':''}>${p.name} (${posL(p)}) · ${rd(effAt(p,SLOTS[i]))}${p.inj>0?' 🚑':''}</option>`;
  const rows=SLOTS.map((s,i)=>{
    const sorted=[...m.squad].sort((a,b)=>effAt(b,s)-effAt(a,s));
    const cur=m.squad.find(p=>p.id===m.lineup[i]);
    return `${i===15?'<tr><th colspan="4">Remplaçants</th></tr>':''}<tr><td><b>${s[0]}</b></td><td>${s[2]}</td><td><select data-a="slot" data-i="${i}"><option value="">—</option>${sorted.slice(0,22).map(p=>opt(p,i)).join('')}${cur&&!sorted.slice(0,22).includes(cur)?opt(cur,i):''}</select></td><td class="n ${cur?oc(effAt(cur,s)):''}">${cur?rd(effAt(cur,s)):'-'}</td></tr>`;
  }).join('');
  return `<div class="grid g2"><div class="card"><h2>Tactique & entraînement</h2>
  <p>Style de jeu<br><select data-a="tac" data-k="style">${Object.entries(STY).map(([a,b])=>`<option value="${a}" ${m.tac.style===a?'selected':''}>${b.n}</option>`).join('')}</select></p>
  <p>Intensité<br><select data-a="tac" data-k="int">${Object.entries(INTS).map(([a,b])=>`<option value="${a}" ${m.tac.int===a?'selected':''}>${b}</option>`).join('')}</select></p>
  <p>Jeu au pied<br>${tacSel('tac','kick',KICKS,tacOf(m).kick)}</p>
  <p>Sur pénalité<br>${tacSel('tac','pen',PENS,tacOf(m).pen)}</p>
  <p>Axe d'entraînement<br><select data-a="tac" data-k="focus">${Object.entries(FOCUS).map(([a,b])=>`<option value="${a}" ${m.focus===a?'selected':''}>${b}</option>`).join('')}</select></p>
  <h3>Notes de l'équipe</h3><table>${ratingRows(t)}</table>
  <p><label style="cursor:pointer"><input type="checkbox" data-a="autoXV" ${m.autoXV!==false?'checked':''}> <b>L'adjoint choisit la composition</b></label><br><span class="mut">Il aligne avant chaque match les meilleurs joueurs disponibles, à leur poste, en tenant compte de la forme. Dès que tu modifies un poste à la main, tu reprends la main (case décochée).</span></p>
  <p><button class="btn" data-a="auto">⚙ Composition automatique maintenant</button></p>
  <p class="mut">La note d'un joueur à un poste tient compte de ses stats, de sa forme et de sa position naturelle (jouer hors poste coûte 10 à 28 %).</p></div>
  <div class="card"><h2>Composition (XV + banc)</h2><table><tr><th>N°</th><th>Poste</th><th>Joueur</th><th class="n">Note</th></tr>${rows}</table></div></div>`;
}
function viewCal(){
  const m=ME(),L=G.L[m.lg];
  let h=`<div class="card"><h2>Calendrier & résultats · ${LEAGUES[m.lg].name}</h2>`;
  const mine=L.fixtures.map((r,i)=>{const f=r.find(x=>x[0]===m.id||x[1]===m.id);return{i,f,res:L.results[i]}});
  h+=`<table><tr><th>J</th><th>Date</th><th>Domicile</th><th class="n">Score</th><th>Extérieur</th></tr>${mine.map(x=>{
    const rs=x.res&&x.res.find(r=>r.h===x.f[0]);
    return `<tr class="${x.i===L.week&&L.phase==='regular'?'me':''}"><td>${x.i+1}</td><td>${fmtD(L.dates[x.i])}</td><td>${C(x.f[0]).short}</td><td class="n"><b>${rs?rs.sh+' - '+rs.sa:'—'}</b></td><td>${C(x.f[1]).short}</td></tr>`}).join('')}</table></div>`;
  for(const lg of LGORDER){const po=G.L[lg].po;if(po&&po.res.length)h+=`<div class="card"><h2>Phases finales · ${LEAGUES[lg].name}</h2>`+po.res.map(r=>`<h3>${PONAME[r.stage]} · ${fmtD(G.L[lg].poDates[r.stage])}</h3>`+r.m.map(x=>`<p>${C(x.h).short} <b>${x.sh} - ${x.sa}</b> ${C(x.a).short}</p>`).join('')).join('')+(po.champ?`<p>🏆 <b>${C(po.champ).name}</b></p>`:'')+'</div>'}
  const done=L.results.map((r,i)=>({r,i})).filter(x=>x.r).slice(-1)[0];
  if(done)h+=`<div class="card"><h3>Tous les résultats de la journée ${done.i+1}</h3>${done.r.map(x=>`<p>${C(x.h).short} <b>${x.sh} - ${x.sa}</b> ${C(x.a).short}</p>`).join('')}</div>`;
  return h;
}
function viewTable(){
  const m=ME(),lg=UI.lg&&G.L[UI.lg]?UI.lg:m.lg,tb=sortedTable(lg),n=tb.length;
  const rule=lg==='t14'?"Les 6 premiers sont qualifiés pour les phases finales. Le 13e joue un barrage d'accession, le 14e descend en Pro D2.":"Les 6 premiers sont qualifiés pour les phases finales (le champion monte en Top 14). Le 15e joue un barrage, le 16e descend en Nationale.";
  return `<div class="card"><div class="row"><h2 style="margin:0">Classement</h2>${LGORDER.map(l=>`<button class="btn ${l===lg?'':'sec'} sm" data-a="lgsel" data-lg="${l}">${LEAGUES[l].name}</button>`).join('')}</div>
  <p class="mut">Victoire 4 pts · nul 2 · bonus offensif (3 essais de plus que l'adversaire) +1 · bonus défensif (défaite de 5 pts ou moins) +1. ${rule}</p>
  <table><tr><th>#</th><th>Club</th><th class="n">J</th><th class="n">G</th><th class="n">N</th><th class="n">P</th><th class="n">PP</th><th class="n">PC</th><th class="n">Diff</th><th class="n">Bonus</th><th class="n">Pts</th></tr>
  ${tb.map((r,i)=>`<tr class="${r.id===m.id?'me':''} ${i<6?'q':''}"><td>${i+1}${i>=n-2?(i===n-1?' ⬇':' ⚠'):''}</td><td>${C(r.id).name}</td><td class="n">${r.j}</td><td class="n">${r.g}</td><td class="n">${r.n}</td><td class="n">${r.p}</td><td class="n">${r.pf}</td><td class="n">${r.pa}</td><td class="n">${r.pf-r.pa}</td><td class="n">${r.bo}</td><td class="n"><b>${r.pts}</b></td></tr>`).join('')}</table></div>
  ${G.hist.length?`<div class="card"><h3>Palmarès</h3>${G.hist.map(h=>`<p>${h.s} : Top 14 ${h.champ} · Pro D2 ${h.champ2} · toi : ${h.rank}e de ${LEAGUES[h.lg].name}${h.fate!=='maintenu'?' ('+h.fate+')':''}</p>`).join('')}</div>`:''}`;
}
function viewHelp(){
  return `<div class="card help"><h2>Rugby 101 : comprendre le jeu</h2>
  <h3>Le but</h3><p>Deux équipes de 15 joueurs s'affrontent pendant 80 minutes (2 mi-temps de 40). On marque en portant le ballon dans l'en-but adverse ou en tapant dans les poteaux.</p>
  <ul><li><b>Essai : 5 points</b> (on aplatit le ballon dans l'en-but).</li><li><b>Transformation : 2 points</b> (coup de pied après l'essai, facultatif mais toujours tenté).</li><li><b>Pénalité : 3 points</b> (coup de pied entre les poteaux après une faute adverse).</li><li><b>Drop : 3 points</b> (coup de pied en cours de jeu, ballon qui touche le sol juste avant).</li></ul>
  <h3>Les 15 joueurs</h3>
  <p><b>Les avants (n°1 à 8)</b> : les costauds, qui gagnent le ballon.</p>
  <ul><li>1 et 3 <b>Piliers</b> + 2 <b>Talonneur</b> : première ligne, poussent en mêlée, le talonneur lance en touche.</li><li>4 et 5 <b>Deuxièmes lignes</b> : les grands, sauteurs en touche.</li><li>6, 7 <b>Flankers</b> et 8 <b>Numéro 8</b> : troisièmes lignes, plaquent et portent le ballon, très endurants.</li></ul>
  <p><b>Les trois-quarts (n°9 à 15)</b> : plus rapides, ils animent le jeu et marquent.</p>
  <ul><li>9 <b>Demi de mêlée</b> : relais entre avants et trois-quarts.</li><li>10 <b>Ouvreur</b> : le « cerveau », distribue, tape et souvent botteur.</li><li>12 et 13 <b>Centres</b> : percutent et passent.</li><li>11 et 14 <b>Ailiers</b> : les plus rapides, finisseurs.</li><li>15 <b>Arrière</b> : dernier rempart, relance et jeu au pied.</li></ul>
  <p>Il y a aussi <b>8 remplaçants</b> (16 à 23) : tu peux les faire entrer en cours de match.</p>
  <h3>Les phases de jeu</h3><ul><li><b>Mêlée</b> : les avants s'opposent et poussent pour récupérer le ballon après une faute légère.</li><li><b>Touche</b> : remise en jeu quand le ballon sort sur les côtés ; les joueurs sont soulevés pour attraper le ballon.</li><li><b>Ruck / maul</b> : regroupements autour du ballon au sol / porté.</li><li><b>Plaquage</b> : on stoppe l'adversaire en le faisant tomber.</li></ul>
  <h3>Dans ce jeu</h3>
  <ul><li><b>Attributs et note</b> : comme dans Football Manager, chaque joueur a 17 attributs notés sur 20 (technique : plaquage, prise de balle, passe, évitement, jeu au pied, buteur, mêlée, touche, jeu au sol ; mental : placement, décisions, sang-froid, leadership, engagement ; physique : vitesse, puissance, endurance). Sa note sur 99 est une moyenne pondérée selon le poste : la mêlée compte énormément pour un pilier, la vitesse pour un ailier, les décisions et le jeu au pied pour un ouvreur. Le buteur du match est le meilleur « Buteur » parmi le 9, le 10 et le 15.</li><li><b>Forme</b> : baisse après un match, remonte en semaine. Un joueur fatigué joue moins bien. Fais tourner l'effectif.</li><li><b>Match en direct</b> : la veille de chaque match, tu choisis de le suivre en direct ou d'avoir le résultat tout de suite. En direct, le match se joue action par action sur un terrain vu de dessus (un rond = un joueur, avec son numéro), à la vitesse que tu veux, avec pause. Le moteur joue de vraies phases : coup d'envoi, temps de jeu (le porteur est plaqué, puis un ruck se forme), jeu au pied, touche, mêlée, ballon porté et pénalités. Chaque action dépend des attributs des joueurs concernés et de leur énergie.</li><li><b>Énergie et remplacements</b> : l'énergie baisse à chaque contact et avec le temps (plus vite pour les avants, moins vite avec une bonne endurance). Un joueur fatigué joue moins bien : fais entrer tes remplaçants (8 sur le banc, chacun entre une seule fois). L'adjoint peut s'en charger. Un joueur blessé sort et est remplacé.</li><li><b>Style de jeu</b> : conquête = les avants portent davantage le ballon et on joue plus souvent le ballon porté ; mouvement = le ballon va plus vite aux trois-quarts, plus de passes après contact, mais plus d'en-avant ; pied = plus de coups de pied d'occupation et de drops.</li><li><b>Jeu au pied ou à la main</b> : à la main, on garde le ballon même dans son camp (risqué) ; au pied, on dégage plus souvent pour gagner du terrain.</li><li><b>Sur pénalité</b> : l'équipe décide (les points si le buteur est à portée, sinon la touche), ou tu imposes un choix : prendre les points (3 points au pied), jouer la touche (on tape en touche, on garde le lancer : idéal pour un ballon porté), choisir la mêlée, ou jouer vite à la main pour surprendre la défense.</li><li><b>Personnalité</b> : chaque joueur a un professionnalisme, une ambition et une détermination sur 20 (fiche du joueur). Un joueur professionnel progresse plus vite, décline moins vite après 30 ans et fait moins de fautes ; un joueur peu professionnel peut avoir des écarts de conduite. Un ambitieux demande plus d'argent, refuse plus facilement un club plus faible et se plaint vite s'il ne joue pas. Un joueur déterminé se bat jusqu'au bout quand son équipe est menée.</li><li><b>Staff</b> (onglet Staff) : entraîneurs des avants, des trois-quarts et des buteurs (progression), préparateur physique (physique, récupération, déclin), médecin (blessures) et recruteur (précision du potentiel estimé). Chacun est noté sur 20 et a un salaire et un contrat : tu peux le remplacer en recrutant sur le marché du staff.</li><li><b>Notes des joueurs</b> : après chaque match, chaque joueur reçoit une note sur 10 (6 = correct) selon ses essais, plaquages, mètres, ballons grattés, fautes… Le meilleur est l'homme du match.</li><li><b>Plafond salarial</b> : un club ne peut pas dépasser une masse salariale fixée (ici ${k(LEAGUES.t14.cap)} en Top 14 et ${k(LEAGUES.pd2.cap)} en Pro D2).</li><li><b>Bonus (règles LNR, Top 14 et Pro D2)</b> : 1 point de classement pour avoir marqué au moins 3 essais de plus que l'adversaire, et 1 point pour une défaite de 5 points ou moins.</li><li><b>Top 14</b> : 14 clubs, 26 journées, puis phases finales pour les 6 premiers (barrages 3e-6e et 4e-5e, demi-finales contre le 1er et le 2e, finale). Le 14e descend en Pro D2 ; le 13e joue un barrage d'accession chez le finaliste perdant de Pro D2.</li><li><b>Pro D2</b> : 16 clubs, 30 journées, même format de phases finales. Le champion monte en Top 14, le finaliste perdant joue le barrage d'accession. Le 16e descend en Nationale et le 15e joue un barrage chez le finaliste de Nationale.</li><li><b>Potentiel</b> : chaque joueur a une note actuelle et un potentiel (note maximale). Les jeunes progressent chaque semaine vers leur potentiel, d'autant plus vite qu'ils sont titulaires, professionnels et jouent en Top 14. Après 30 ans, les qualités physiques déclinent. Affichage réglable dans Réglages.</li><li><b>Mercato</b> : fenêtres en intersaison et de la 10e à la 13e journée. Une offre = une indemnité pour le club (souvent plus chère pour un cadre ou un joueur avec un long contrat) + un salaire et une durée pour le joueur. Les joueurs libres (jokers) se signent toute l'année, et un joueur en dernière année de contrat peut signer un pré-contrat gratuit pour la saison suivante.</li><li><b>Salary cap</b> : en Top 14, 11 M€ de base + 180 k€ par international français de 2025 (13,8 M€ pour Toulouse). En Pro D2, c'est le budget qui limite la masse salariale.</li><li><b>Descendre en Nationale</b> met fin à ta carrière (partie terminée). Descendre du Top 14 en Pro D2 ne te coûte pas ta place, mais tes revenus baissent fortement.</li></ul></div>`;
}
