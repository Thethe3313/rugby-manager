// Interface : onglet Staff et marché des techniciens libres
const sgn=v=>(v>0?'+':'')+v;
// Effet actuel d'un membre du staff, en clair
function staffEffect(r,q){
  if(r==='av'||r==='tq'||r==='but')return `${sgn(Math.round((q-10)*2))} % de progression`;
  if(r==='pp')return `${sgn(Math.round((q-10)*1.5))} % de récupération, déclin après 30 ans ${q>=10?'ralenti':'accéléré'}`;
  if(r==='med')return `${sgn(Math.round(-(q-10)*1.5))} % de blessures${q>10?', retours plus rapides':''}`;
  return `potentiel des autres joueurs estimé à ±${Math.max(1,Math.round((14-q*.6)/2))}`;
}
// Nom du membre du staff : vrai nom avec sa fonction réelle, ou nom fictif
const sName=s=>`${s.name}${s.f?' <span class="mut" title="Pas de source trouvée pour ce poste : nom inventé par le jeu">(fictif)</span>':''}${s.t?`<br><span class="mut" style="font-size:12px">${s.t}${s.sure?'':' (fonction supposée)'}</span>`:''}`;
const sAge=s=>s.age||'<span class="mut" title="Âge non renseigné">—</span>';
const qCell=q=>`<td class="n ${ac(q)}"><b>${q}</b>/20</td>`;
function viewStaff(){
  const m=ME();
  const rows=SROLES.map(r=>{const s=m.staff&&m.staff[r];
    return `<tr><td class="rc1"><b>${STAFF_ROLES[r].n}</b></td>${s?`<td style="white-space:normal">${sName(s)}</td><td class="hm">${sAge(s)}</td>${qCell(s.q)}<td data-l="Salaire" class="n">${k(s.sal)}</td><td data-l="Contrat" class="n ${s.ctr<=1?'warn':''}">${s.ctr} an${s.ctr>1?'s':''}</td>`:`<td colspan="5" class="ko">Poste vacant (compte comme 4/20)</td>`}
    <td class="mut">${staffEffect(r,s?s.q:4)}</td><td><button class="btn sm ${s?'sec':''}" data-a="staffMarket" data-r="${r}">${s?'Remplacer':'Recruter'}</button></td></tr>`}).join('');
  return `<div class="card"><h2>Staff</h2>
  <p><b>Manager : toi</b>${m.manager?` <span class="mut">(tu prends la place de ${m.manager})</span>`:''}</p>
  <p class="mut">Ton staff fait progresser les joueurs, les garde en forme et en bonne santé, et repère le potentiel des joueurs des autres clubs. Chaque membre est noté sur 20 : 10 est la moyenne, l'effet est nul à 10, positif au-dessus, négatif en dessous.</p>
  <table class="rc"><tr><th>Poste</th><th>Nom</th><th>Âge</th><th class="n">Qualité</th><th class="n">Salaire</th><th class="n">Contrat</th><th>Effet actuel</th><th></th></tr>${rows}</table>
  <p class="mut">Noms réels de la saison 2026-27 quand ils sont connus (sources : recherche/staff). « Fictif » : aucune source trouvée pour ce poste. « Fonction supposée » : la personne fait bien partie du staff, mais son rôle exact n'est pas publié. La qualité sur 20 est une estimation du jeu.</p>
  <p class="mut">Masse salariale du staff : <b>${k(staffMass(m))}</b> par an (payée par la trésorerie du club, hors plafond salarial des joueurs). Remplacer quelqu'un coûte une indemnité de 50 % de son salaire restant.</p></div>
  <div class="card"><h3>Ce que fait chaque poste</h3><ul class="help">${SROLES.map(r=>`<li><b>${STAFF_ROLES[r].n}</b> : ${STAFF_ROLES[r].d}</li>`).join('')}</ul></div>`;
}
function staffModal(){
  const m=ME(),r=UI.srole,cur=m.staff[r],yrs=+(UI.syrs||2);
  const pool=(G.staffPool||[]).filter(s=>s.role===r).sort((a,b)=>b.q-a.q);
  const comp=cur?Math.round(cur.sal*cur.ctr*.5):0;
  return `<div class="overlay"><div class="modal"><h2>Recruter : ${STAFF_ROLES[r].n.toLowerCase()}</h2>
  <p class="mut">${STAFF_ROLES[r].d}</p>
  <p>Actuellement : ${cur?`<b>${cur.name}</b> (${cur.q}/20, ${k(cur.sal)}/an, ${cur.ctr} an${cur.ctr>1?'s':''} de contrat)${comp?` · indemnité de départ : <b>${k(comp)}</b>`:''}`:'<span class="ko">poste vacant</span>'} · Trésorerie : <b>${k(m.budget)}</b></p>
  <p>Durée du contrat <select data-a="flt" data-k="syrs">${[1,2,3].map(v=>`<option value="${v}" ${yrs===v?'selected':''}>${v} an${v>1?'s':''}</option>`).join('')}</select></p>
  ${pool.length?`<table><tr><th>Nom</th><th>Âge</th><th class="n">Qualité</th><th class="n">Salaire demandé</th><th>Effet</th><th></th></tr>${pool.map(s=>`<tr><td style="white-space:normal">${sName(s)}</td><td>${sAge(s)}</td>${qCell(s.q)}<td class="n">${k(staffDemand(s,m))}/an</td><td class="mut">${staffEffect(r,s.q)}</td><td><button class="btn sm" data-a="hireStaff" data-id="${s.id}">Embaucher</button></td></tr>`).join('')}</table>`:'<p class="mut">Aucun technicien libre à ce poste pour le moment. Le marché se renouvelle chaque été.</p>'}
  ${UI.smsg?`<p class="ko">${UI.smsg}</p>`:''}
  <p><button class="btn sec" data-a="closeModal">Fermer</button></p></div></div>`;
}
// Intersaison : staff en fin de contrat
function staffRenewCard(){
  const m=ME(),ex=SROLES.filter(r=>m.staff&&m.staff[r]&&m.staff[r].ctr<=1);
  if(!ex.length)return '';
  return `<div class="card"><h3>Staff en fin de contrat (${ex.length})</h3><p class="mut">Sans prolongation, ils partent quand la nouvelle saison commence et le poste reste vacant.</p>
  <table><tr><th>Poste</th><th>Nom</th><th class="n">Qualité</th><th class="n">Salaire</th><th></th></tr>${ex.map(r=>{const s=m.staff[r];return `<tr><td>${STAFF_ROLES[r].n}</td><td style="white-space:normal">${sName(s)}</td>${qCell(s.q)}<td class="n">${k(s.sal)}</td><td><button class="btn sm" data-a="renewStaff" data-r="${r}">Prolonger 2 ans (${k(Math.round(s.sal*1.05/5)*5)}/an)</button> <button class="btn sec sm" data-a="staffMarket" data-r="${r}">Remplacer</button></td></tr>`}).join('')}</table></div>`;
}
