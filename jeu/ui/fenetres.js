// Interface : fenêtres (fiche joueur, négociation, résumé de match)
function playerModal(){
  const f=findPlayer(UI.pid),p=f.p;if(!p)return '';
  const own=f.club&&f.club.id===G.meId,c=f.club;
  const potTxt=potMode()==='hide'?'':` · potentiel ${potMode()==='exact'?(own?'':'≈')+potEst(p):starsTxt(potEst(p))}`;
  const acts=own&&p.youth?`<button class="btn sm" data-a="promote" data-id="${p.id}">Promouvoir en équipe pro</button>`:own?`<button class="btn sm" data-a="neg" data-id="${p.id}" data-mode="renew">Négocier son contrat</button> <button class="btn sec sm" data-a="listP" data-id="${p.id}">${p.list?'Retirer de la liste des transferts':'Placer sur la liste des transferts'}</button> <button class="btn bad sm" data-a="release" data-id="${p.id}">Libérer</button>`
    :c?`${followBtn(p,true)} <button class="btn sm" data-a="neg" data-id="${p.id}" data-mode="buy">Faire une offre</button>${p.ctr<=1&&G.phase==='season'?` <button class="btn sec sm" data-a="neg" data-id="${p.id}" data-mode="pre">Pré-contrat</button>`:''}`
    :`${followBtn(p,true)} <button class="btn sm" data-a="neg" data-id="${p.id}" data-mode="fa">Faire signer</button>`;
  return `<div class="overlay"><div class="modal"><h2>${p.name}</h2><p>${posL(p)}${p.pos2&&p.pos2.length?` <span class="mut">(peut aussi jouer ${p.pos2.map(g=>GROUPS[g].toLowerCase()).join(', ')}${p.p2e?' — estimé':''})</span>`:''}${p.nat?' · '+p.nat:''}${p.caps?' · '+p.caps+' sélection'+(p.caps>1?'s':''):p.intl?' · international':''} · ${p.age} ans · ${c?c.name:'<span class="ok">sans club</span>'}</p>
  <p>Note <b class="${oc(ovr(p))}">${rd(ovr(p))}</b>${potTxt} · valeur ${k(valueOf(p))} · salaire ${k(p.sal)}/an${c?` · contrat ${p.ctr} an(s)`:''}</p>
  <p>Personnalité : <b>${persLabel(p)}</b> <span class="mut">· professionnalisme ${p.pro??'?'}/20 · ambition ${p.amb??'?'}/20 · détermination ${p.det??'?'}/20</span></p>
  ${attrTable(p)}
  ${p.ev?`<p class="mut">${p.ev}</p>`:''}<p>Cette saison : ${p.st.mj} match(s) dont ${p.st.tit||0} titularisation(s), ${p.st.es} essai(s), ${p.st.pts} points${p.st.nn?`, ${p.st.tac||0} plaquages, ${p.st.m||0} mètres gagnés · note moyenne <b class="${rc(p.st.nt/p.st.nn)}">${(p.st.nt/p.st.nn).toFixed(1)}</b>${p.st.motm?` · ${p.st.motm} fois homme du match ⭐`:''}`:''}.</p>
  ${(p.hist||[]).length?`<h3>Carrière</h3><table><tr><th>Saison</th><th>Club</th><th class="n">Note</th><th class="n">Matchs</th><th class="n">Essais</th></tr>${p.hist.map(h=>`<tr><td>${h.s}</td><td>${h.c}</td><td class="n">${h.o}</td><td class="n">${h.mj}</td><td class="n">${h.es}</td></tr>`).join('')}</table>`:''}
  <p>${acts} <button class="btn sec sm" data-a="closeModal">Fermer</button></p></div></div>`;
}
function negModal(){
  const N=UI.neg,f=findPlayer(N.pid),p=f.p,m=ME();if(!p)return '';
  const c=f.club,mode=N.mode;
  const dem=mode==='renew'?wageDemand(p,m,'renew'):wageDemand(p,m,mode==='pre'?'pre':'move');
  const ask=mode==='buy'?askFee(p,c):0;
  const title={renew:'Prolongation de contrat',buy:'Offre de transfert',fa:'Signature d\'un joueur libre',pre:'Pré-contrat (arrivée la saison prochaine)'}[mode];
  const defY=p.age>=32?1:p.age>=29?2:3;
  return `<div class="overlay"><div class="modal"><h2>${title}</h2>
  <p><b>${p.name}</b> · ${posL(p)} · ${p.age} ans · note <b class="${oc(ovr(p))}">${rd(ovr(p))}</b>${potMode()==='hide'?'':' · potentiel '+(potMode()==='exact'?potEst(p):starsTxt(potEst(p)))} · ${c?c.short+', contrat '+p.ctr+' an(s)':'libre'} · salaire actuel ${k(p.sal)}</p>
  ${mode==='buy'?`<p>Indemnité demandée par ${c.short} : <b>environ ${k(ask)}</b> (valeur ${k(valueOf(p))}).</p>`:''}
  <p>Ses exigences salariales : <b>environ ${k(dem)} par an</b>.</p>
  <p class="mut">Trésorerie ${k(m.budget)} · marge salariale ${k(Math.max(0,capOf(m)-mass(m)+(mode==='renew'?p.sal:0)))}</p>
  <div class="row">${mode==='buy'?`<label>Indemnité (k€)<br><input id="ng-fee" type="number" min="0" step="10" value="${N.fee??ask}" style="width:110px"></label>`:''}
  <label>Salaire annuel (k€)<br><input id="ng-sal" type="number" min="0" step="5" value="${N.sal??dem}" style="width:110px"></label>
  <label>Durée (ans)<br><input id="ng-yrs" type="number" min="1" max="5" value="${N.yrs??defY}" style="width:70px"></label></div>
  ${UI.negMsg?`<div class="card" style="margin-top:10px">${UI.negMsg}</div>`:''}
  ${mode==='buy'?'<p class="mut">Ton offre part par message au club, qui répondra '+(G.phase==='season'?'dans 1 à 3 jours':'aussitôt')+' (et le joueur doit aussi accepter le salaire et la durée).</p>':''}<p style="margin-top:10px"><button class="btn" data-a="sendNeg">${mode==='buy'?'Envoyer l’offre':'Proposer'}</button> <button class="btn sec" data-a="closeModal">Fermer</button></p></div></div>`;
}

function modalView(){
  const m=UI.modal;
  if(m.type==='match'){
    const r=G.lastMatch;if(!r)return '';
    const h=C(r.h),a=C(r.a);
    const done=r.others||[];
    const names=[h.short,a.short],mo=r.ps&&r.ps.find(x=>x.id===r.motm);
    const tab=UI.mtab||'resume',tb=(v,l)=>`<button class="btn sm ${tab===v?'':'sec'}" data-a="mtab" data-v="${v}">${l}</button>`;
    const body=!r.ps||tab==='resume'?`<div style="max-height:340px;overflow:auto">${r.ev.map(e=>`<div class="ev ${e.k}"><span class="m">${e.m}'</span><span>${e.x}</span></div>`).join('')||'<p class="mut">Match fermé, peu d\'événements.</p>'}</div>`
      :tab==='stats'?statsHTML(r.stats[0],r.stats[1],r.ph,r.tp,names):ratingsHTML(r,names);
    return `<div class="overlay"><div class="modal wide"><div class="vs"><div>${kitTag(h,kits([h,a])[0])}</div><div class="score">${r.sh} - ${r.sa}</div><div>${kitTag(a,kits([h,a])[1])}</div></div>
    <p class="mut" style="text-align:center">Essais ${r.th}-${r.ta} · Pénalités ${r.pn[0]}-${r.pn[1]} · Drops ${r.dr[0]}-${r.dr[1]} · Possession ${r.ph}%-${100-r.ph}% · Cartons jaunes ${r.yc[0]}-${r.yc[1]}${r.att?` · Affluence ${r.att}`:''}</p>
    <p class="mut" style="text-align:center">Points de classement : ${!r.ko?`${h.short} ${(r.sh>r.sa?4:r.sh===r.sa?2:0)+r.bo[0]} · ${a.short} ${(r.sa>r.sh?4:r.sh===r.sa?2:0)+r.bo[1]}`:'match à élimination directe'}${r.so?' · qualification aux tirs au but':''}</p>
    ${r.wx?`<p class="mut" style="text-align:center">${wxTxt(r.wx)}${r.ref?' · Arbitre : '+refTxt(r.ref):''}</p>`:''}
    ${(r.h===G.meId||r.a===G.meId)&&r===G.lastMatch?`<div class="card" style="text-align:center;margin:10px 0"><b>Causerie d'après-match</b> ${r.talk?`<p>Tu as choisi : <b>${POSTTALK[r.talk]}</b>. ${r.talkTxt}</p>`:`<p class="mut">Ce que tu dis au vestiaire compte pour le moral du prochain match.</p><div class="row" style="justify-content:center">${Object.entries(POSTTALK).map(([v,l])=>`<button class="btn sec sm" data-a="postTalk" data-v="${v}">${l}</button>`).join('')}</div>`}</div>`:''}
    ${mo?`<p style="text-align:center">⭐ Homme du match : <b>${mo.n}</b> (${names[mo.s]}) · note <b class="${rc(mo.r)}">${mo.r.toFixed(1)}</b></p>`:''}
    ${r.ps?`<div class="row" style="justify-content:center;margin-bottom:8px">${tb('resume','Temps forts')}${tb('stats','Statistiques')}${tb('notes','Notes des joueurs')}</div>`:''}
    ${body}
    <h3 style="margin-top:12px">Autres résultats</h3>${done.filter(x=>!(x.h===r.h&&x.a===r.a)).map(x=>`<div>${C(x.h).short} <b>${x.sh} - ${x.sa}</b> ${C(x.a).short}</div>`).join('')}
    <p><button class="btn" data-a="closeModal">Continuer</button></p></div></div>`;
  }
  if(m.type==='prematch')return viewPrematch();
  if(m.type==='live')return viewLive();
  if(m.type==='staff')return staffModal();
  if(m.type==='player')return playerModal();
  if(m.type==='neg')return negModal();
  return '';
}
