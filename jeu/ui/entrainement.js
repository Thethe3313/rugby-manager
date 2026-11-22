// Entraînement de la semaine : axe, intensité et préparation du prochain adversaire
function viewTrain(){
  const m=ME(),tr=m.train=m.train||{int:'normal'},nm=myNextMatch(),nx=nm&&nm.f?nm.f:null,o=nx?C(nx.h===m.id?nx.a:nx.h):null;
  const ik=tr.int||'normal';
  const sel=`<select data-a="tac" data-k="focus">${Object.entries(FOCUS).map(([a,b])=>`<option value="${a}" ${m.focus===a?'selected':''}>${b}</option>`).join('')}</select>`;
  const attrs=FOCUSK[m.focus||'equilibre'].map(k=>ATTRS.find(a=>a[0]===k)[1]).join(', ');
  return `<div class="card"><h2>Entraînement de la semaine</h2><p class="mut">Ces choix s’appliquent chaque semaine, jusqu’à ce que tu les changes. La progression des joueurs se calcule le lundi.</p>
  <h3>Axe de travail</h3><p>${sel}</p><p class="mut">Les joueurs progressent un peu plus vite sur : <b>${m.focus==='equilibre'||!m.focus?'tous les attributs (équilibré)':attrs}</b>.</p>
  <h3>Intensité</h3>${Object.entries(TRAINI).map(([v,t])=>`<p><label style="cursor:pointer"><input type="radio" name="tint" data-a="trainInt" data-v="${v}" ${ik===v?'checked':''}> <b>${t.n}</b> <span class="mut">— ${t.d}</span></label></p>`).join('')}
  <h3>Préparer le prochain adversaire</h3>${o?`<p><label style="cursor:pointer"><input type="checkbox" data-a="prepOpp" ${G.prepOpp===o.id?'checked':''}> Préparer le match contre <b>${o.short}</b>${nm.d?' ('+fmtD(nm.d)+')':''}</label></p><p class="mut">Le staff étudie l’adversaire : l’équipe entre sur le terrain avec un moral un peu meilleur (environ +1,5 %), au prix d’une progression ralentie cette semaine-là. Ça ne vaut que pour ce match.</p>`:'<p class="mut">Pas de match programmé.</p>'}
  </div>`;
}
