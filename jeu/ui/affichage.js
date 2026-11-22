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
  jiff:['JIFF','Joueur Issu des Filières de Formation : au moins 3 saisons en centre de formation agréé, ou 5 saisons de licence FFR avant 22 ans (peu importe la nationalité). En Top 14 et Pro D2, un club doit aligner en moyenne 16 JIFF sur sa feuille de match de 23 joueurs (13 pour un promu la 1re saison, 14,5 la 2e), sinon il perd de 6 à 12 points la saison suivante. À partir de 17 de moyenne : prime de 220 à 320 k€. Il peut y avoir 13 joueurs non-JIFF au maximum dans l’effectif. Ici, le statut de chaque joueur est une estimation.'],
  pers:['Personnalité','Professionnalisme (sérieux à l’entraînement), ambition (envie de grands clubs) et détermination. Ils influencent sa progression et ses demandes.']};
const hp=k=>GLOSS[k]?`<span class="hlp" data-a="hlp" data-k="${k}" title="${GLOSS[k][1].replace(/"/g,'&quot;')}">?</span>`:'';
function helpBubble(){const g=UI.hlp&&GLOSS[UI.hlp];return g?`<div id="hbub"><b>${g[0]}</b><p>${g[1]}</p><button class="btn sm" data-a="hlp" data-k="${UI.hlp}">Compris</button></div>`:''}

// Apparence : thème clair / sombre et taille du texte (réglages gardés dans G.settings et dans le navigateur)
function applyLook(){
  try{const st=(G&&G.settings)||loadSettings(),el=document.documentElement;if(!el||!el.setAttribute)return;
    el.setAttribute('data-theme',st.theme==='light'?'light':'dark');el.setAttribute('data-size',st.size||'normal')}catch(err){}
}
function lookBlock(){
  const st=(G&&G.settings)||{},th=st.theme||'dark',sz=st.size||'normal';
  const rad=(name,act,cur,list)=>list.map(([v,t])=>`<label style="cursor:pointer;margin-right:14px"><input type="radio" name="${name}" data-a="${act}" data-v="${v}" ${cur===v?'checked':''}> <b>${t}</b></label>`).join('');
  return `<h3>Thème</h3><p>${rad('theme','setLook',th,[['dark','🌙 Sombre'],['light','☀️ Clair']])}</p><h3>Taille du texte</h3><p>${rad('size','setSize',sz,[['normal','Normale'],['large','Grande'],['xl','Très grande']])}</p>`;
}

// Niveau de détail, interruptions et vitesse du direct (réglages)
function levelBlock(){
  const cur=isSimple()?'simple':'full';
  return `<h3>Niveau de détail</h3>${[['full','Complet','tous les écrans : vestiaire, espoirs, staff, carrière, histoire, missions, prêts'],['simple','Simple','l’essentiel : effectif, composition, calendrier, classement, mercato, finances (les autres écrans sont masqués, rien n’est perdu)']].map(([v,t,d])=>`<p><label style="cursor:pointer"><input type="radio" name="level" data-a="setOpt" data-o="level" data-v="${v}" ${cur===v?'checked':''}> <b>${t}</b> <span class="mut">— ${d}</span></label></p>`).join('')}`;
}
function flowBlock(){
  const st=(G.settings&&G.settings.stop)||'all',sp=(G.settings&&G.settings.liveSpeed)||'normal';
  const rad=(name,o,cur,list)=>list.map(([v,t,d])=>`<p><label style="cursor:pointer"><input type="radio" name="${name}" data-a="setOpt" data-o="${o}" data-v="${v}" ${cur===v?'checked':''}> <b>${t}</b>${d?` <span class="mut">— ${d}</span>`:''}</label></p>`).join('');
  return `<h3 style="margin-top:14px">Ce qui interrompt « Continuer »</h3>${rad('stop','stop',st,[['all','Matchs et messages importants','le jeu s’arrête dès qu’un message important arrive (offre, blessure grave…)'],['matchs','Seulement les matchs','tu ne reçois les messages que quand tu ouvres la messagerie']])}<h3 style="margin-top:14px">Vitesse du match en direct</h3>${rad('lspeed','liveSpeed',sp,Object.entries(LSPEED).map(([v,x])=>[v,x[1],v==='forts'?'saute les temps faibles, ralentit sur les essais et pénalités':'']))}`;
}

// Pastille JIFF à côté du nom (Top 14 et Pro D2 seulement)
const jiffTag=p=>{const m=G&&ME();return m&&jiffRule(m)&&jiffOf(p)?' <span class="jf" title="Joueur issu des filières de formation (estimé)">J</span>':''};
// Compteur JIFF de la composition (Composition) et carte de suivi de la saison (Effectif)
function jiffChip(){
  const m=ME(),R_=jiffRule(m);if(!R_)return '';
  const n=jiffCount(m),c=n>=17?'ok':n>=R_.min?'warn':'ko';
  return `<span class="${c}" title="JIFF sur la feuille de match de 23 joueurs : minimum ${R_.min} en moyenne, 17 pour la prime">${n} JIFF / ${R_.min} min. ${hp('jiff')}</span>`;
}
function jiffCard(){
  const m=ME(),R_=jiffRule(m);if(!R_)return '';
  const S=jiffMine(),avg=S.n?S.s/S.n:null,c=avg==null?'mut':avg>=R_.prime?'ok':avg>=R_.min?'warn':'ko',pen=jiffPenOf(m.id),non=jiffNon(m);
  const proj=avg==null?'':avg>=R_.min?(avg>=17?` Prime actuelle : <b>${fmtK(jiffPrize(avg))}</b>.`:''):` <span class="ko">Sanction actuelle : retrait de <b>${jiffPenalty(avg,R_.min)} points</b> la saison prochaine.</span>`;
  return `<p>🎓 <b>JIFF</b> ${hp('jiff')} : <span class="${c}"><b>${avg==null?'—':avg.toFixed(2)}</b> en moyenne sur la feuille de match</span> (${S.n} match${S.n>1?'s':''}) · minimum <b>${R_.min}</b>${R_.promo?' (promu)':''} · prime à partir de <b>17</b> (220 à 320 k€).${proj} Non-JIFF dans l'effectif : <b class="${non>=JIFFMAXNON?'ko':non>=JIFFMAXNON-2?'warn':''}">${non}</b> / ${JIFFMAXNON} maximum.${pen?` <span class="ko">⚠ Retrait de ${pen} points en cours cette saison (quota JIFF non respecté la saison dernière).</span>`:''} Pastille <span class="jf">J</span> = joueur formé ; statut estimé.</p>`;
}

// Retrait de points JIFF affiché à côté du club dans le classement
const jiffPenTag=id=>{const p=jiffPenOf(id);return p?` <span class="ko" title="Retrait de points pour non-respect du quota JIFF la saison dernière">(−${p})</span>`:''};
