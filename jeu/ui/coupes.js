// Interface : onglet Europe (Champions Cup et Challenge Cup)
function poolHTML(pool,i,ko){
  const m=ME(),rows=sortPool(pool);
  return `<div><h3>Poule ${i+1}</h3><table><tr><th>#</th><th>Club</th><th class="n">J</th><th class="n">G</th><th class="n">P</th><th class="n">Diff</th><th class="n">Bonus</th><th class="n">Pts</th></tr>
  ${rows.map((r,k)=>{const c=C(r.id);return `<tr class="${r.id===m.id?'me':''} ${k<4?'q':''}"><td>${k+1}</td><td>${clubLink(c.id,c.short)} <span class="mut">${c.ext?lgName(c):'Top 14'}</span></td><td class="n">${r.j}</td><td class="n">${r.g}</td><td class="n">${r.p}</td><td class="n">${r.pf-r.pa}</td><td class="n">${r.bo}</td><td class="n"><b>${r.pts}</b></td></tr>`}).join('')}</table></div>`;
}
function koHTML(cup){
  const ko=cup.ko;if(!ko)return '';
  const line=x=>`<p>${C(x.h).short} <b>${x.sh} - ${x.sa}</b> ${C(x.a).short}</p>`;
  return `<div class="card"><h3>Phase finale</h3>${ko.res.map(r=>`<h3 style="color:var(--txt)">${KONAME[r.stage]} · ${fmtD(cup.dates[4+r.stage])}</h3>${r.m.map(line).join('')}`).join('')}
  ${ko.next.length?`<h3 style="color:var(--txt)">${KONAME[ko.stage]} · ${fmtD(cup.dates[4+ko.stage])}</h3>${ko.next.map(f=>`<p>${C(f.h).short} - ${C(f.a).short}${f.neutral?' <span class="mut">(terrain neutre)</span>':''}</p>`).join('')}`:''}
  ${cup.champ?`<p>🏆 <b>${C(cup.champ).name}</b> remporte la ${cup.name}.</p>`:''}</div>`;
}
function viewCups(){
  if(!G.cups)return `<div class="card"><h2>Coupes d'Europe</h2><p class="mut">Les coupes d'Europe commencent avec la saison.</p></div>`;
  const m=ME(),k=UI.cup||(G.cups.ch.pools.some(p=>p.teams.includes(m.id))?'ch':'cc'),cup=G.cups[k];
  const mine=G.cups.cc.pools.some(p=>p.teams.includes(m.id))?'cc':G.cups.ch.pools.some(p=>p.teams.includes(m.id))?'ch':null;
  return `<div class="card"><div class="row"><h2 style="margin:0">Coupes d'Europe</h2>${['cc','ch'].map(x=>`<button class="btn sm ${x===k?'':'sec'}" data-a="cupsel" data-k="${x}">${G.cups[x].name}</button>`).join('')}</div>
  <p class="mut">${mine?`${ME().name} dispute la <b>${G.cups[mine].name}</b>. `:'Ton club ne dispute pas de coupe d\'Europe cette saison (il faut finir dans le Top 14 : les 8 premiers jouent la Champions Cup, les autres la Challenge Cup). '}
  ${cup.name} : <b>${cupLabel(cup)}</b>. Poules de 6, 4 matchs par club (pas contre son compatriote). Victoire 4 pts, nul 2, bonus offensif = 3 essais de plus que l'adversaire, bonus défensif = défaite de 7 points ou moins. Les 4 premiers de chaque poule vont en 8es de finale${k==='cc'?' ; le 5e est reversé en Challenge Cup':', rejoints par les 4 cinquièmes de Champions Cup'}.</p>
  <p class="mut">Dates : poules les ${cup.dates.slice(0,4).map(d=>fmtD(d)).join(', ')} · 8es ${fmtD(cup.dates[4])} · quarts ${fmtD(cup.dates[5])} · demies ${fmtD(cup.dates[6])} · finale ${fmtD(cup.dates[7])}.</p></div>
  ${koHTML(cup)}
  <div class="grid g2r">${cup.pools.map((p,i)=>`<div class="card" style="margin:0">${poolHTML(p,i)}</div>`).join('')}</div>`;
}
