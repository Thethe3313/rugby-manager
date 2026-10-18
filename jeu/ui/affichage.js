// Interface : petits éléments d'affichage (potentiel, attributs, liens)
// ---- potentiel : affichage selon les réglages ----
const potMode=()=>{const v=(G.settings&&G.settings.pot)||'exact';return v==='stars'?'exact':v};
// potentiel des autres joueurs : estimé par le recruteur (écart de ±1 à ±7 selon sa qualité)
function potEst(p){const f=findPlayer(p.id);if(f.club&&f.club.id===G.meId)return p.pot;const k=knowOf(p);if(k>=3)return p.pot;return clamp(Math.round(p.pot+(hashN(p.name+G.meId)-.5)*(14-staffQ(ME(),'rec')*.6)*[1,.7,.4][k]),Math.round(noteEst(p)),99)}
// Note telle que tu la connais : exacte pour tes joueurs, fourchette pour les autres (voir knowOf / noteRange)
const noteTxt=(p,club)=>{const[a,b]=noteRange(p,club);return a===b?String(a):a+'-'+b};
const noteCell=(p,club)=>{const r=noteRange(p,club),e=(r[0]+r[1])/2;return `<td class="n ${oc(e)}" title="${r[0]===r[1]?'Note':'Note estimée par ton recruteur'}"><b>${r[0]===r[1]?r[0]:r[0]+'-'+r[1]}</b></td>`};
function starsTxt(v){const s=clamp(Math.round((v-45)/10*2)/2,.5,5);return '★'.repeat(Math.floor(s))+(s%1?'½':'')}
function potCell(p){const v=potEst(p),own=(findPlayer(p.id).club||{}).id===G.meId;return potMode()==='exact'?`<td class="n mut">${own?'':'≈'}${v}</td>`:`<td class="mut" title="Potentiel estimé">${starsTxt(v)}</td>`}
const potTh=()=>potMode()==='hide'?'':'<th>Pot.</th>';
const potTd=p=>potMode()==='hide'?'':potCell(p);
function progTxt(p){const d=Math.round(ovr(p))-(p.o0||Math.round(ovr(p)));return d>0?`<span class="ok">+${d}</span>`:d<0?`<span class="ko">${d}</span>`:'<span class="mut">=</span>'}
// Nom de club cliquable (page du club) ; les clubs « légers » (divisions simulées) n'ont pas de page
const clubLink=(id,label)=>C(id)?`<a class="clink" data-a="club" data-id="${id}">${label}</a>`:label;
const plink=p=>`<a style="cursor:pointer;color:var(--blue)" data-a="player" data-id="${p.id}">${p.name}</a>`;
function winBanner(){const w=windowOpen();return w?`<p class="ok"><b>Mercato ${w==='été'?"d'été":"d'hiver"} ouvert.</b> Tu peux acheter, vendre et recevoir des offres.</p>`:`<p class="mut">Fenêtre de transferts fermée (elle ouvre à l'intersaison et de la 10e à la 13e journée). Restent possibles : les joueurs libres (jokers) et les pré-contrats avec les joueurs en dernière année.</p>`}

const ac=v=>v>=16?'o1':v>=11?'o2':v>=6?'o3':'o4';
// moyenne d'un groupe d'attributs, pondérée par l'importance au poste
function grpAvg(p,gr){let s=0,w=0;for(const [k,,g] of ATTRS)if(g===gr){const x=W[p.g][k]||.02;s+=p[k]*x;w+=x}return s/w}
const grpTh=()=>'<th class="n hm" title="Technique (pondérée selon le poste)">Tec</th><th class="n hm" title="Mental">Men</th><th class="n hm" title="Physique">Phy</th>'; // hm : colonne masquée sur téléphone
const grpTd=(p,club)=>knowOf(p,club)<2?'<td class="n hm mut">?</td>'.repeat(3):['T','M','P'].map(g=>{const v=grpAvg(p,g);return `<td class="n hm ${ac(v)}">${v.toFixed(1)}</td>`}).join('');
function attrTable(p){
  const kn=knowOf(p);if(kn===0)return '<p class="mut">Attributs inconnus : fais observer ce joueur par ton recruteur.</p>';
  const av=(k)=>kn>=2?null:[Math.max(1,Math.floor(p[k]-1)),Math.min(20,Math.ceil(p[k]+1))]; // connaissance 1 : fourchette de 2 points
  return `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">${['T','M','P'].map(g=>`<div><h3 style="margin:4px 0">${AGRP[g]}</h3><table>${ATTRS.filter(a=>a[2]===g).map(([k,l])=>`<tr><td>${(W[p.g][k]||0)>=.1?'<b>'+l+'</b>':l}</td><td class="n ${ac(p[k])}"><b>${av(k)?av(k).join('-'):Math.round(p[k])}</b></td></tr>`).join('')}</table></div>`).join('')}</div><p class="mut">Attributs sur 20. En gras : les plus importants pour son poste. Ils forment sa note sur 99.</p>`;
}
