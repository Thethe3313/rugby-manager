// Interface : effectif, mercato, finances, messagerie, espoirs, réglages
function viewSquad(){
  const m=ME();
  let list=m.squad.filter(p=>UI.ef==='ALL'||p.g===UI.ef).sort((a,b)=>GORDER.indexOf(a.g)-GORDER.indexOf(b.g)||ovr(b)-ovr(a));
  return `<div class="card"><div class="row"><h2 style="margin:0">Effectif (${m.squad.length})</h2><select data-a="ef"><option value="ALL">Tous les postes</option>${GORDER.map(g=>`<option value="${g}" ${UI.ef===g?'selected':''}>${GROUPS[g]}</option>`).join('')}</select><span class="mut">Masse ${k(mass(m))} / ${k(capOf(m))}</span></div>
  <table style="margin-top:10px"><tr><th>Nom</th><th>Poste</th><th class="hm">Âge</th><th class="n">Note</th>${potTh()}<th class="n hm">Prog.</th>${grpTh()}<th class="hm">Forme</th><th class="hm">État</th><th class="n hm">Tit/MJ</th><th class="n hm" title="Note moyenne en match (sur 10)">Moy.</th><th class="n hm">Ctr</th><th class="n hm">Salaire</th><th class="n hm">Valeur</th><th class="hm"></th></tr>
  ${list.map(p=>`<tr><td>${plink(p)}${p.list?' <span class="warn" title="Sur la liste des transferts">€</span>':''}${p.inj>0?' <span class="sm-only ko">🚑</span>':''}</td><td>${posLS(p)}</td><td class="hm">${p.age}</td><td class="n ${oc(ovr(p))}"><b>${rd(ovr(p))}</b></td>${potTd(p).replace("<td","<td data-l=\"Pot.\"")}<td class="n hm">${progTxt(p)}</td>${grpTd(p)}<td class="hm">${formeBar(p.forme)}</td><td class="hm">${injTxt(p)}</td><td class="n hm">${p.st.tit||0}/${p.st.mj}</td><td class="n hm ${p.st.nn?rc(p.st.nt/p.st.nn):'mut'}">${p.st.nn?(p.st.nt/p.st.nn).toFixed(1):'-'}</td><td class="n hm ${p.ctr<=1?'warn':''}">${p.ctr}</td><td class="n hm">${k(p.sal)}</td><td class="n hm">${k(valueOf(p))}</td><td class="hm"><button class="btn sec sm" data-a="neg" data-id="${p.id}" data-mode="renew">Contrat</button></td></tr>`).join('')}</table>
  <p class="mut">Prog. = progression de la note depuis le début de saison. Un jeune qui joue progresse vite vers son potentiel ; un jeune qui ne joue pas stagne et peut voir son potentiel baisser.</p></div>`;
}
function marketPool(){
  const out=[];
  for(const c of G.clubs.concat(G.ext||[])){if(c.id===G.meId)continue;for(const p of c.squad)out.push({p,c})}
  for(const p of G.fa)out.push({p,c:null});
  return out;
}
function viewMarket(){
  const m=ME(),sub=UI.mt||'search';
  const tabs=[['search','Recherche'],['follow',`★ Suivis (${(G.follow||[]).length})`],['offers',`Offres reçues (${(G.offers||[]).length})`],['pre',`Pré-contrats (${(G.pre||[]).length})`],['log','Historique']];
  let h=`<div class="card"><div class="row"><h2 style="margin:0">Mercato</h2>${tabs.map(t=>`<button class="btn ${t[0]===sub?'':'sec'} sm" data-a="mt" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
  ${winBanner()}<p class="mut">Trésorerie : <b>${k(m.budget)}</b> · Masse salariale : <b>${k(mass(m))}</b> / ${k(capOf(m))} (marge ${k(Math.max(0,capOf(m)-mass(m)))}) · Effectif : ${m.squad.length}/50</p>`;
  if(sub==='search'||sub==='follow'){
    const sel=(a,cur,opts)=>`<select data-a="flt" data-k="${a}">${opts.map(o=>`<option value="${o[0]}" ${String(cur)===String(o[0])?'selected':''}>${o[1]}</option>`).join('')}</select>`;
    if(sub==='search')h+=`<div class="row">${sel('mf',UI.mf,[['ALL','Tous postes'],...GORDER.map(g=>[g,GROUPS[g]])])}${sel('ml',UI.ml||'ALL',[['ALL','Tous'],['t14','Top 14'],['pd2','Pro D2'],['etr','Étranger (URC, Premiership, Super Rugby, Japon)'],['fa','Joueurs libres']])}${sel('ms',UI.ms||'ALL',[['ALL','Tous contrats'],['exp','Dernière année (pré-contrat)']])}${sel('mo',UI.mo||60,[50,55,60,65,70,75,80,85].map(v=>[v,'Note ≥ '+v]))}${sel('ma',UI.ma||40,[[40,'Tous âges'],[21,'≤ 21 ans'],[23,'≤ 23 ans'],[26,'≤ 26 ans'],[30,'≤ 30 ans']])}</div>`;
    // joueurs suivis : ceux de G.follow, où qu'ils soient (sauf chez toi)
    let pool=sub==='follow'?(G.follow||[]).map(id=>findPlayer(id)).filter(f=>f.p&&(!f.club||f.club.id!==G.meId)).map(f=>({p:f.p,c:f.club})):marketPool().filter(({p,c})=>(UI.mf==='ALL'||p.g===UI.mf)&&noteEst(p)>=(+UI.mo||60)&&p.age<=(+UI.ma||40)&&((UI.ml||'ALL')==='ALL'||(UI.ml==='fa'?!c:UI.ml==='etr'?c&&c.ext:c&&c.lg===UI.ml))&&((UI.ms||'ALL')==='ALL'||(c&&p.ctr<=1)));
    pool.sort((a,b)=>noteEst(b.p)-noteEst(a.p));
    const n=pool.length;pool=pool.slice(0,100);
    h+=sub==='follow'&&!n?'<p class="mut">Aucun joueur suivi. Clique sur ☆ à côté d’un joueur (ou « Suivre » dans sa fiche) pour le retrouver ici ; tu seras prévenu s’il change de club.</p>':`<p class="mut">${n} joueur(s)${n>100?' · 100 premiers affichés':''}</p>`;
    if(n)h+=`<table><tr><th>Nom</th><th>Poste</th><th class="hm">Âge</th><th class="n">Note</th>${potTh()}${grpTh()}<th class="hm">Club</th><th class="n hm">Ctr</th><th class="n hm">Salaire</th><th class="n hm">Valeur</th><th class="n hm">Indemnité</th><th></th></tr>
    ${pool.map(({p,c})=>`<tr><td>${followBtn(p)}${plink(p)}</td><td>${posLS(p)}</td><td class="hm">${p.age}</td>${noteCell(p)}${potTd(p)}${grpTd(p)}<td class="hm">${c?c.short+' <span class="mut">'+(c.ext?lgName(c):c.lg==='t14'?'T14':c.lg==='pd2'?'PD2':LEAGUES[c.lg]?LEAGUES[c.lg].name:'')+'</span>':'<span class="ok">Libre</span>'}</td><td class="n hm">${c?p.ctr:'-'}</td><td class="n hm">${k(p.sal)}</td><td class="n hm">${k(valueOf(p))}</td><td class="n hm">${c?k(askFee(p,c)):'0'}</td><td><button class="btn sm" data-a="neg" data-id="${p.id}" data-mode="${c?'buy':'fa'}">${c?'Offre':'Signer'}</button>${c&&p.ctr<=1&&G.phase==='season'?` <button class="btn sec sm" data-a="neg" data-id="${p.id}" data-mode="pre">Pré-contrat</button>`:''}</td></tr>`).join('')}</table>`;
  }else if(sub==='offers'){
    const of=G.offers||[];
    h+=of.length?`<table><tr><th>Joueur</th><th>Poste</th><th class="n">Note</th><th>Club acheteur</th><th class="n">Offre</th><th class="n">Valeur</th><th></th></tr>${of.map((o,i)=>{const p=m.squad.find(x=>x.id===o.pid),c=C(o.club);if(!p||!c)return '';return `<tr><td>${plink(p)}</td><td>${posL(p)}</td><td class="n">${rd(ovr(p))}</td><td>${c.short}</td><td class="n"><b>${k(o.fee)}</b></td><td class="n">${k(valueOf(p))}</td><td><button class="btn sm" data-a="acceptOffer" data-i="${i}">Accepter</button> <button class="btn bad sm" data-a="refuseOffer" data-i="${i}">Refuser</button></td></tr>`}).join('')}</table>`:'<p class="mut">Aucune offre pour le moment. Les offres arrivent pendant les fenêtres de transferts ; place un joueur sur la liste des transferts (depuis sa fiche) pour en attirer davantage.</p>';
  }else if(sub==='pre'){
    h+=(G.pre||[]).length?`<table><tr><th>Joueur</th><th>Club actuel</th><th class="n">Salaire</th><th class="n">Durée</th></tr>${G.pre.map(x=>{const f=findPlayer(x.pid);return f.p?`<tr><td>${plink(f.p)}</td><td>${f.club?f.club.short:'-'}</td><td class="n">${k(x.sal)}</td><td class="n">${x.yrs} an(s)</td></tr>`:''}).join('')}</table><p class="mut">Ces joueurs te rejoindront gratuitement au début de la saison prochaine.</p>`:'<p class="mut">Aucun pré-contrat. Pendant la saison, un joueur en dernière année de contrat peut signer chez toi gratuitement pour la saison suivante (filtre « Dernière année »).</p>';
  }else{
    h+=(G.tlog||[]).length?G.tlog.slice(0,60).map(t=>`<p>• ${t}</p>`).join(''):'<p class="mut">Aucun transfert pour le moment.</p>';
  }
  return h+'</div>';
}
function viewFin(){
  const m=ME(),f=G.fin;
  const row=(n,v)=>`<tr><td>${n}</td><td class="n ${v<0?'ko':'ok'}">${v>=0?'+':''}${k(v)}</td></tr>`;
  return `<div class="card"><h2>Finances</h2>
  <table><tr><td>Budget annuel du club</td><td class="n"><b>${k(m.bud)}</b></td></tr><tr><td>Trésorerie disponible (indemnités de transfert)</td><td class="n"><b class="${m.budget<0?'ko':''}">${k(m.budget)}</b></td></tr><tr><td>Masse salariale</td><td class="n">${k(mass(m))}</td></tr><tr><td>${m.lg==='t14'?'Salary cap autorisé (11 M€ + crédit internationaux)':'Masse salariale maximale (25 % du budget, cap légal 11 M€)'}</td><td class="n">${k(capOf(m))}</td></tr></table>
  <h3 style="margin-top:12px">Saison en cours</h3><table>${row('Partenaires et droits TV',f.sponsor)}${row('Billetterie',f.ticket)}${row('Primes de classement',f.prize)}${row('Salaires des joueurs',-f.wages)}${row('Salaires du staff',-(f.staff||0))}${row('Fonctionnement (centre de formation, déplacements, structure…)',-f.opex)}${row('Transferts et indemnités',f.transfers)}${row('Total',f.ticket+f.sponsor+f.prize-f.wages-(f.staff||0)-f.opex+f.transfers)}</table>
  <p class="mut">Les recettes suivent le budget réel du club (Midi Olympique 2026-27). Une masse salariale sous le plafond libère de la trésorerie pour payer des indemnités. Monter en Top 14 multiplie le budget, descendre le divise presque par deux.</p></div>`;
}
function viewMail(){
  const ms=G.mail||[],cur=ms.find(x=>x.id===UI.mid)||ms[0];
  // téléphone : la liste, puis le message choisi en plein écran (bouton Retour)
  if(cur&&!cur.read&&(!isPhone()||UI.mailView)){cur.read=true}
  return `<div class="grid mailg ${UI.mailView?'open':''}" style="grid-template-columns:minmax(240px,1fr) 2fr"><div class="card mlist" style="max-height:75vh;overflow:auto;padding:0"><h2 style="padding:12px 14px 0">Messagerie</h2>${ms.length?ms.map(x=>`<div data-a="openMail" data-id="${x.id}" style="padding:9px 14px;border-top:1px solid var(--line);cursor:pointer;${cur&&x.id===cur.id?'background:var(--panel2);':''}"><div class="row" style="justify-content:space-between"><b style="${x.read?'font-weight:400':''}">${x.read?'':'● '}${x.from}</b><span class="mut">${fmtD(x.d)}</span></div><div class="${x.read?'mut':''}">${x.subj}</div></div>`).join(''):'<p class="mut" style="padding:0 14px">Aucun message.</p>'}</div>
  <div class="card mread">${cur?`<p class="sm-only"><button class="btn sec sm" data-a="mailBack">← Tous les messages</button></p><p class="mut">${fmtD(cur.d,true)} · De : <b>${cur.from}</b></p><h2>${cur.subj}</h2><div style="line-height:1.6">${cur.body}</div>${cur.act?`<p style="margin-top:14px"><button class="btn sm" data-a="mailAct" data-id="${cur.id}">${cur.act.player?'Voir le joueur':'Y aller'}</button></p>`:''}`:''}</div></div>`;
}
function viewYouth(){
  const m=ME(),y=[...(m.youth||[])].sort((a,b)=>b.pot-a.pot);
  return `<div class="card"><h2>Espoirs · centre de formation (${acadOf(m)}/20)</h2>
  <p class="mut">Chaque 15 mars, une nouvelle génération de jeunes de 16-17 ans arrive. La qualité du centre de formation influence leur niveau et la chance de voir éclore un futur crack. Les espoirs progressent à l'entraînement et en matchs espoirs ; promus en équipe pro et titularisés, ils progressent encore plus vite. À 21 ans, un espoir non promu quitte le club.</p>
  ${(()=>{const E=G.ESP,lg=E&&Object.keys(E.poules).find(l=>E.poules[l].includes(m.id));if(!lg)return '<p class="mut">Ton club ne dispute pas de championnat espoirs (pas assez d’espoirs, ou division sans championnat espoirs).</p>';const rk=espSorted(lg).findIndex(r=>r.id===m.id)+1;return `<p><b>Championnat espoirs</b> : ${rk}e de ${ESPLG[lg]} (${E.phase==='regular'?'journée '+(E.week+1)+'/'+E.fixtures.length:'terminé'}) · <button class="btn sec sm" data-a="espTab" data-lg="${lg}">Voir le classement</button></p>`})()}
  ${y.length?`<table class="rc"><tr><th>Nom</th><th>Poste</th><th>Âge</th><th class="n">Note</th>${potTh()}<th class="n" title="Matchs espoirs cette saison">MJ</th><th class="n hm">Prog.</th>${grpTh()}<th></th></tr>${y.map(p=>`<tr><td class="rc1">${plink(p)}${p.gem&&potMode()!=='hide'?' <span class="warn" title="Talent exceptionnel">💎</span>':''}</td><td>${posL(p)}</td><td data-l="Âge">${p.age}</td><td data-l="Note" class="n ${oc(ovr(p))}"><b>${rd(ovr(p))}</b></td>${potTd(p).replace("<td","<td data-l=\"Pot.\"")}<td class="n" data-l="Matchs">${p.yst?p.yst.mj:0}${p.yst&&p.yst.es?' ('+p.yst.es+' essai'+(p.yst.es>1?'s':'')+')':''}</td><td class="n hm">${progTxt(p)}</td>${grpTd(p)}<td><button class="btn sm" data-a="promote" data-id="${p.id}">Promouvoir en pro</button> <button class="btn bad sm" data-a="relYouth" data-id="${p.id}">Libérer</button></td></tr>`).join('')}</table>`:'<p class="mut">Aucun espoir pour le moment.</p>'}</div>`;
}
function viewSettings(){
  const cur=potMode();
  const opt=(v,t,d)=>`<p><label style="cursor:pointer"><input type="radio" name="pot" data-a="setPot" data-v="${v}" ${cur===v?'checked':''}> <b>${t}</b> <span class="mut">— ${d}</span></label></p>`;
  return `<div class="card"><h2>Réglages</h2><h3>Tutoriel</h3><p><button class="btn sec sm" data-a="tutoReset">Revoir le tutoriel</button> <span class="mut">— la visite guidée des écrans principaux, en 5 étapes</span></p><h3>Affichage du potentiel</h3>
  ${opt('hide','Masqué','tu découvres les pépites toi-même, comme un vrai recruteur')}
  ${opt('exact','Affiché','note de potentiel sur 99 : exacte pour tes joueurs, estimée par tes recruteurs (« ≈ », à quelques points près) pour les autres')}
  <p class="mut">Le potentiel est la note maximale qu'un joueur peut atteindre. Il progresse vers ce plafond selon son âge, son temps de jeu, son professionnalisme (caché) et le niveau du championnat. Un jeune qui enchaîne les titularisations peut voir son potentiel grimper ; un jeune qui ne joue jamais peut le voir baisser.</p>
  <p class="mut">Comme dans Football Manager, le potentiel des vrais jeunes joueurs est tiré au hasard dans une fourchette au début de chaque partie (par exemple entre 80 et 90) : d'une partie à l'autre, ce ne sont pas toujours les mêmes qui deviennent des cracks.</p>
  <h3 style="margin-top:14px">Matchs</h3>
  ${[['ask','Proposer le match en direct','la veille de chaque match, tu choisis : direct ou résultat immédiat'],['off','Toujours le résultat immédiat','les matchs sont simulés sans t\'arrêter']].map(([v,t,d])=>`<p><label style="cursor:pointer"><input type="radio" name="live" data-a="setLive" data-v="${v}" ${(G.settings&&G.settings.live||'ask')===v?'checked':''}> <b>${t}</b> <span class="mut">— ${d}</span></label></p>`).join('')}
  <h3 style="margin-top:14px">Sauvegarde</h3>
  <p class="row"><button class="btn sec" data-a="exportSave">⬇ Exporter ma partie dans un fichier</button><label class="btn sec">⬆ Importer une partie<input type="file" accept=".json,application/json" data-a="importSave" hidden></label></p>
  <p class="mut">La partie est enregistrée dans le navigateur utilisé. Pour la retrouver dans un autre navigateur (ou dans l'appli), exporte-la ici puis importe le fichier là-bas. C'est aussi une bonne copie de secours.</p></div>`;
}
