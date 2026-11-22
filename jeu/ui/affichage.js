// Interface : petits éléments d'affichage (potentiel, attributs, liens)
// ---- potentiel : affichage selon les réglages ----
const potMode=()=>{const v=(G.settings&&G.settings.pot)||'exact';return v==='stars'?'exact':v};
// potentiel des autres joueurs : estimé par le recruteur (écart de ±1 à ±7 selon sa qualité)
function potEst(p){const f=findPlayer(p.id);if(f.club&&f.club.id===G.meId)return p.pot;const k=knowOf(p);if(k>=3)return p.pot;return clamp(Math.round(p.pot+(hashN(p.name+G.meId)-.5)*(14-staffQ(ME(),'rec')*.6)*[1,.7,.4][k]),Math.round(noteEst(p)),99)}
// Note telle que tu la connais : exacte pour tes joueurs, fourchette pour les autres (voir knowOf / noteRange)
const noteTxt=(p,club)=>{const[a,b]=noteRange(p,club);return a===b?String(a):a+'-'+b};
const noteCell=(p,club)=>{const r=noteRange(p,club),e=(r[0]+r[1])/2;return `<td class="n ${oc(e)}" title="${r[0]===r[1]?'Note':'Note estimée par ton recruteur'}"><b>${r[0]===r[1]?r[0]:r[0]+'-'+r[1]}</b></td>`};
function starsTxt(v){const s=clamp(Math.round((v-45)/10*2)/2,.5,5);return '★'.repeat(Math.floor(s))+(s%1?'½':'')}
function potCell(p){const v=potEst(p),own=(findPlayer(p.id).club||{}).id===G.meId;const gap=v-Math.round(ovr(p));return potMode()==='exact'?`<td class="n ${gap>=8?'ok':'mut'}" title="${gap>=8?'Grosse marge de progression ('+gap+' points)':'Potentiel'}">${own?'':'≈'}${v}</td>`:`<td class="mut" title="Potentiel estimé">${starsTxt(v)}</td>`}
const potTh=()=>potMode()==='hide'?'':'<th>Pot.</th>';
const potTd=p=>potMode()==='hide'?'':potCell(p);
function progTxt(p){const d=Math.round(ovr(p))-(p.o0||Math.round(ovr(p)));return d>0?`<span class="ok" title="En progression depuis le début de saison">▲ +${d}</span>`:d<0?`<span class="ko" title="En baisse depuis le début de saison">▼ ${d}</span>`:'<span class="mut" title="Stable">=</span>'}
// Légende des couleurs, affichée sous les listes de joueurs
const legendHTML=()=>'<p class="mut" style="font-size:12px"><span class="o1">■</span> très bon · <span class="o2">■</span> bon · <span class="o3">■</span> moyen · <span class="o4">■</span> faible &nbsp;|&nbsp; <span class="ok">▲</span> progresse · <span class="ko">▼</span> baisse &nbsp;|&nbsp; <span class="warn">⏳</span> contrat qui se termine</p>';
// Nom de club cliquable (page du club) ; les clubs « légers » (divisions simulées) n'ont pas de page
const clubLink=(id,label)=>C(id)?`<a class="clink" data-a="club" data-id="${id}">${label}</a>`:label;
const plink=p=>`<a style="cursor:pointer;color:var(--blue)" data-a="player" data-id="${p.id}">${p.name}</a>`;
function winBanner(){const w=windowOpen();return w?`<p class="ok"><b>Mercato ${w==='été'?"d'été":"d'hiver"} ouvert.</b> Tu peux acheter, vendre et recevoir des offres.</p>`:`<p class="mut">Fenêtre de transferts fermée (elle ouvre à l'intersaison et de la 10e à la 13e journée). Restent possibles : les joueurs libres (jokers) et les pré-contrats avec les joueurs en dernière année.</p>`}

const ac=v=>v>=16?'o1':v>=11?'o2':v>=6?'o3':'o4';
// moyenne d'un groupe d'attributs, pondérée par l'importance au poste
function grpAvg(p,gr){let s=0,w=0;for(const [k,,g] of ATTRS)if(g===gr){const x=W[p.g][k]||.02;s+=p[k]*x;w+=x}return s/w}
const grpTh=()=>'<th class="n hm" title="Technique (pondérée selon le poste)">Tec</th><th class="n hm" title="Mental">Men</th><th class="n hm" title="Physique">Phy</th>'; // hm : colonne masquée sur téléphone
const grpTd=(p,club)=>knowOf(p,club)<2?'<td class="n hm mut">?</td>'.repeat(3):['T','M','P'].map(g=>{const v=grpAvg(p,g);return `<td class="n hm ${ac(v)}">${v.toFixed(1)}</td>`}).join('');
// Fiche simplifiée (réglage « Fiche joueur ») : les 6 attributs qui comptent le plus à son poste, en barres colorées
const sheetSimple=()=>((G.settings&&G.settings.sheet)||'full')==='simple';
function attrSimple(p){
  const kn=knowOf(p);if(kn===0)return '<p class="mut">Attributs inconnus : fais observer ce joueur par ton recruteur.</p>';
  const top=ATTRS.map(a=>[a,W[p.g][a[0]]||0]).sort((x,y)=>y[1]-x[1]).slice(0,6).map(x=>x[0]);
  return `<h3 style="margin:10px 0 4px">Ce qui compte à son poste</h3>${top.map(([k,l])=>{const v=p[k],t=kn>=2?Math.round(v):Math.max(1,Math.floor(v-1))+'-'+Math.min(20,Math.ceil(v+1));return `<div class="sbar"><span>${l}</span><div class="bar"><i style="width:${v*5}%;background:var(--${v>=16?'acc':v>=11?'acc2':'bad'})"></i></div><b class="${ac(v)}">${t}</b></div>`}).join('')}<p class="mut">Sur 20. Les attributs les plus importants pour son poste ; la note sur 99 en tient déjà compte.</p>`;
}
function attrTable(p){
  const kn=knowOf(p);if(kn===0)return '<p class="mut">Attributs inconnus : fais observer ce joueur par ton recruteur.</p>';
  const av=(k)=>kn>=2?null:[Math.max(1,Math.floor(p[k]-1)),Math.min(20,Math.ceil(p[k]+1))]; // connaissance 1 : fourchette de 2 points
  return `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">${['T','M','P'].map(g=>`<div><h3 style="margin:4px 0">${AGRP[g]}</h3><table>${ATTRS.filter(a=>a[2]===g).map(([k,l])=>`<tr><td>${(W[p.g][k]||0)>=.1?'<b>'+l+'</b>':l}</td><td class="n ${ac(p[k])}"><b>${av(k)?av(k).join('-'):Math.round(p[k])}</b></td></tr>`).join('')}</table></div>`).join('')}</div><p class="mut">Attributs sur 20. En gras : les plus importants pour son poste. Ils forment sa note sur 99.</p>`;
}

// Bulles d'aide : « ? » cliquable (toucher sur téléphone) qui explique un terme ; le texte s'affiche en bas de l'écran
const GLOSS={
  note:['Note','Niveau global du joueur sur 99, calculé selon son poste à partir de ses 17 attributs. Repères : 85 et plus = international titulaire, 72-77 = bon titulaire de Top 14.'],
  pot:['Potentiel','La note maximale que le joueur peut atteindre. Pour tes joueurs il est exact ; pour les autres, tes recruteurs l’estiment (« ≈ »). En vert : grosse marge de progression.'],
  prog:['Progression','Écart de note depuis le début de la saison. ▲ en hausse, ▼ en baisse.'],
  forme:['Forme','Fraîcheur physique du joueur. Elle baisse avec les matchs et remonte au repos. Sous 75 %, le risque de blessure augmente.'],
  ctr:['Contrat','Nombre d’années restantes. ⏳ = dernière année : prolonge-le, sinon il part libre (ou signe un pré-contrat ailleurs).'],
  bonus:['Points de bonus','Bonus offensif : marquer au moins 3 essais de plus que l’adversaire (+1 point). Bonus défensif : perdre de 5 points ou moins (+1 point).'],
  pp:['PP / PC','Points pour (marqués) et points contre (encaissés) depuis le début de la saison.'],
  diff:['Différence','Points marqués moins points encaissés. Elle départage les équipes à égalité de points.'],
  pts:['Points','Victoire 4, nul 2, défaite 0, plus les points de bonus.'],
  cap:['Salary cap','Plafond de masse salariale : le total des salaires de tes joueurs ne doit pas le dépasser. En Top 14, 11 M€ plus un crédit pour les internationaux.'],
  masse:['Masse salariale','Somme des salaires annuels de tes joueurs. Elle doit rester sous le plafond.'],
  pre:['Pré-contrat','Accord signé en cours de saison avec un joueur dont le contrat finit : il te rejoint gratuitement à la saison suivante.'],
  loan:['Prêt','Un joueur est confié à un autre club jusqu’à la fin de la saison, pour jouer. Un joueur prêté ne peut être ni vendu ni prolongé.'],
  pers:['Personnalité','Professionnalisme (sérieux à l’entraînement), ambition (envie de grands clubs) et détermination. Ils influencent sa progression et ses demandes.']};
const hp=k=>GLOSS[k]?`<span class="hlp" data-a="hlp" data-k="${k}" title="${GLOSS[k][1].replace(/"/g,'&quot;')}">?</span>`:'';
function helpBubble(){const g=UI.hlp&&GLOSS[UI.hlp];return g?`<div id="hbub"><b>${g[0]}</b><p>${g[1]}</p><button class="btn sm" data-a="hlp" data-k="${UI.hlp}">Compris</button></div>`:''}
