// Interface : avant-match, match en direct (terrain 2D), statistiques et notes d'après-match
// Le match en direct est rendu une fois (render), puis mis à jour élément par élément (liveUpdate)
// pour que les joueurs et le ballon glissent en douceur sur le terrain.
const LSPEED={lent:[1200,'Lent'],normal:[600,'Normal'],rapide:[220,'Rapide'],forts:[40,'Temps forts']};
// Couleurs des maillots (data/couleurs.js ; sinon tirées du nom du club). Si les deux maillots se ressemblent,
// l'équipe à l'extérieur prend sa couleur secondaire (ou blanc / noir).
const KPAL=['#c8102e','#1f4ea1','#007a3d','#f5c400','#7b2d8e','#f07d00','#5fa8dc','#6b1238','#00a3a3','#1a2b5f'];
function clubCols(c){if(!c)return['#4c9be8','#ffffff'];if(COULEURS[c.id])return COULEURS[c.id];const h=hashN(c.name||c.id);return[KPAL[Math.floor(h*KPAL.length)],h*10%1<.5?'#ffffff':'#111111']}
const hexRGB=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const cDist=(a,b)=>{const x=hexRGB(a),y=hexRGB(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])};
const txtOn=c=>{const[r,g,b]=hexRGB(c);return r*.3+g*.59+b*.11>150?'#111111':'#ffffff'};
function kits(clubs){
  const h=clubCols(clubs[0]),a=clubCols(clubs[1]);let ac=a[0];
  if(cDist(h[0],ac)<130)ac=[a[1],'#ffffff','#111111'].find(c=>cDist(h[0],c)>=130)||'#ffffff';
  return[{bg:h[0],fg:txtOn(h[0])},{bg:ac,fg:txtOn(ac)}];
}
const kitTag=(c,k)=>`<b class="kit" style="background:${k.bg};color:${k.fg}">${c.short}</b>`;
let liveTimer=null;
const rc=v=>v>=7.5?'o1':v>=6.8?'o2':v>=6?'o3':'o4';

// ---- Statistiques et notes (après-match et direct) ----
function statsHTML(s0,s1,ph,tp,names){
  const rows=[['Possession',ph+' %',(100-ph)+' %'],['Occupation du terrain',tp+' %',(100-tp)+' %'],['Mètres gagnés',rd(s0.m),rd(s1.m)],['Franchissements',s0.cle,s1.cle],
    ['Plaquages réussis',s0.tac,s1.tac],['Plaquages manqués',s0.mt,s1.mt],['Rucks gagnés',s0.rk,s1.rk],['Ballons grattés',s0.to,s1.to],
    ['Mêlées gagnées',`${s0.melW}/${s0.mel}`,`${s1.melW}/${s1.mel}`],['Touches gagnées',`${s0.touW}/${s0.tou}`,`${s1.touW}/${s1.tou}`],
    ['Pénalités concédées',s0.pc,s1.pc],['En-avant',s0.err,s1.err],['Cartons jaunes',s0.yc,s1.yc]];
  return `<table class="stt"><tr><th class="n">${names[0]}</th><th></th><th>${names[1]}</th></tr>${rows.map(([l,x,y])=>`<tr><td class="n"><b>${x}</b></td><td class="mut" style="text-align:center;width:100%">${l}</td><td><b>${y}</b></td></tr>`).join('')}</table>`;
}
function ratingsHTML(r,names){
  const col=i=>`<div style="overflow-x:auto;min-width:0"><h3>${names[i]}</h3><table><tr><th>N°</th><th>Joueur</th><th class="n">Min</th><th class="n" title="Essais">Ess.</th><th class="n" title="Plaquages réussis">Plaq.</th><th class="n" title="Mètres gagnés">Mètres</th><th class="n">Note</th></tr>${r.ps.filter(x=>x.s===i).map(x=>`<tr class="${x.id===r.motm?'me':''}"><td>${x.no}</td><td>${x.n}${x.id===r.motm?' ⭐':''}${x.inj?' 🚑':''}${x.yc?' 🟨':''}</td><td class="n">${x.min}</td><td class="n">${x.es||''}</td><td class="n">${x.tac}</td><td class="n">${x.m}</td><td class="n ${rc(x.r)}"><b>${x.r.toFixed(1)}</b></td></tr>`).join('')}</table></div>`;
  return `<div class="grid g2r">${col(0)}${col(1)}</div><p class="mut">Note sur 10 (6 = match correct). ⭐ homme du match · 🚑 blessé · 🟨 carton jaune.</p>`;
}

// ---- Avant-match ----
function tacSel(act,key,obj,cur){return `<select data-a="${act}" data-k="${key}">${Object.entries(obj).map(([v,l])=>`<option value="${v}" ${cur===v?'selected':''}>${typeof l==='string'?l:l.n}</option>`).join('')}</select>`}
function viewPrematch(){
  const nx=liveDue();if(!nx)return '';
  const m=ME(),h=C(nx.f.h),a=C(nx.f.a),t=tacOf(m);
  const lu=m.autoXV!==false?autoLineup(m):m.lineup;
  return `<div class="overlay"><div class="modal"><h2>Jour de match · ${fmtD(nx.d)}</h2>
  <div class="vs"><div>${h.short}<small>${nx.f.neutral?'Terrain neutre':'Domicile'}</small></div><div class="mut">vs</div><div>${a.short}<small>&nbsp;</small></div></div>
  <p class="mut" style="text-align:center">${nx.lab||LEAGUES[m.lg].name}${(()=>{const o=h.id===m.id?a:h;return o.manager?` · manager adverse : ${o.manager}`:''})()}</p>
  <div class="grid g2"><div><h3>Consignes</h3>
    <p>Style de jeu<br>${tacSel('tac','style',STY,t.style)}</p><p>Intensité<br>${tacSel('tac','int',INTS,t.int)}</p>
    <p>Jeu au pied<br>${tacSel('tac','kick',KICKS,t.kick)}</p><p>Sur pénalité<br>${tacSel('tac','pen',PENS,t.pen)}</p><p>Défense<br>${tacSel('tac','def',DEFS,t.def)}</p><p>Rythme<br>${tacSel('tac','ry',RYTHMS,t.ry)}</p></div>
  <div><h3>Ton XV${m.autoXV!==false?' <span class="mut">(choisi par l\'adjoint)</span>':''}</h3>${lu.slice(0,15).map((id,i)=>{const p=m.squad.find(x=>x.id===id);return `<div>${i+1}. ${p?p.name+' <span class="mut">'+rd(effAt(p,SLOTS[i]))+'</span>':'<span class="ko">—</span>'}</div>`}).join('')}</div></div>
  <div class="card" style="margin:12px 0 0"><p>Météo prévue : <b>${wxTxt(weatherFor(nx.d,h))}</b> · Arbitre : <b>${refTxt(refFor(nx.d,h))}</b></p>
  <p>Discours d'avant-match<br>${tacSel('talk','pre',TALKS.pre,UI.talk||'motive')}</p>
  <p class="mut">Pluie : plus d'en-avant et de jeu au pied. Vent : buteurs gênés. Arbitre sévère : plus de pénalités et de cartons (la discipline compte). Un discours exigeant réveille une équipe déterminée, mais peut faire craquer une équipe qui se décourage vite.</p></div>
  <p style="margin-top:12px"><button class="btn" data-a="goLive">▶ Suivre le match en direct</button> <button class="btn sec" data-a="quickMatch">⏩ Résultat immédiat</button> <button class="btn sec" data-a="preLineup">Modifier la composition</button> <button class="btn sec" data-a="closeModal">✕ Fermer (revenir au menu)</button></p>
  <p class="mut">Tu peux choisir dans les Réglages de toujours passer directement au résultat.</p></div></div>`;
}

// ---- Terrain 2D ----
// Placement des 15 joueurs de chaque équipe autour du ballon selon la phase de jeu.
// [dx, dy] : dx = mètres dans le sens d'attaque de l'équipe qui a le ballon (négatif = derrière), dy = vers le côté ouvert.
const FORM={
  open:{A:[[-2,-3],[-1.5,1],[-2.5,4],[-4,-6],[-4,6],[-3,-9],[-5,10],[-6,0],[-1.5,0],[-7,8],[-9,-14],[-9,15],[-10,22],[-12,30],[-16,10]],
    D:[[1.5,-3],[1.5,2],[1.5,5],[2,-7],[2,8],[1.5,-11],[2,12],[3,0],[2.5,-1],[2,15],[6,-16],[2,20],[2,27],[3,33],[18,8]]},
  scrum:{A:[[-.8,-1],[-.8,0],[-.8,1],[-1.8,-.5],[-1.8,.5],[-2.6,-1.4],[-2.6,1.4],[-3.4,0],[-.5,2],[-8,9],[-10,-14],[-11,15],[-12,22],[-13,30],[-18,8]],
    D:[[.8,-1],[.8,0],[.8,1],[1.8,-.5],[1.8,.5],[2.6,-1.4],[2.6,1.4],[3.4,0],[.5,-2],[7,9],[6,-14],[6,15],[6,22],[7,30],[20,8]]},
  lineout:{A:[[-.5,6],[0,-1],[-.5,13],[-.5,8],[-.5,10],[-.5,7],[-.5,12],[-.5,14],[-2,17],[-8,22],[-12,50],[-10,28],[-11,34],[-12,62],[-20,30]],
    D:[[.5,6],[.5,-1],[.5,13],[.5,8],[.5,10],[.5,7],[.5,12],[.5,14],[2,17],[8,22],[12,50],[8,28],[9,34],[12,62],[22,30]]},
  ruck:{A:[[-1.2,-1],[-1,0],[-1.2,1],[-2,-1.2],[-2,1.2],[-1.5,-2.4],[-2.5,2.6],[-3.2,0],[-2,1.8],[-7,8],[-9,-14],[-9,15],[-10,22],[-12,30],[-16,10]],
    D:[[1.2,-1],[1,0],[1.2,1],[2,-1.4],[2,1.4],[1.5,-3],[2.2,3],[3,0],[3,-4],[3,12],[5,-16],[3,18],[3,25],[4,32],[18,8]]},
  maul:{A:[[-1,-1],[0,0],[-1,1],[-2,-.5],[-2,.5],[-.5,-1.5],[-.5,1.5],[-3,0],[-3,3],[-8,10],[-10,-14],[-11,15],[-12,22],[-13,30],[-18,8]],
    D:[[1,-1],[1,0],[1,1],[2,-.5],[2,.5],[1,-1.8],[1,1.8],[2.5,0],[3,-3],[7,10],[6,-14],[6,15],[6,22],[7,30],[18,8]]}
};
function formation(ms){
  const v=ms.view||{k:'kickoff',a:0},bx=ms.x,by=ms.y,F=[[],[]];
  const dir=i=>i===0?1:-1,jit=(i,j)=>Math.sin(j*7.3+i*3.1+ms.t*.37)*.6;
  if(v.k==='kickoff'){
    const a=v.a,s=dir(a);
    for(const i of[0,1])for(let j=0;j<15;j++)F[i].push(i===a?[50-s*(j<8?1:3),4+j*4.4]:[50+s*(j<8?12+(j%3)*3:22+(j%4)*8),6+((j*23)%58)]);
    return F;
  }
  let a=v.a,key=v.k,shift=0;
  if(key==='kick'){a=1-a;key='open';shift=6}else if(key==='pen'||key==='goal'){key='open';shift=10}else if(!FORM[key])key='open';
  const T=FORM[key],s=dir(a),open=by<35?1:-1;
  for(const i of[0,1]){const tpl=i===a?T.A:T.D;for(let j=0;j<15;j++){const[dx,dy]=tpl[j];F[i].push([clamp(bx+s*(dx+(i===a?0:shift))+jit(i,j),-9,109),clamp(by+open*dy+jit(j,i),.8,69.2)])}}
  // le porteur du ballon est sur le ballon, son plaqueur vient au contact
  const at=(i,id)=>id?ms.T[i].on.findIndex(d=>d&&d.p.id===id):-1;
  const jc=at(v.a,v.c);if(jc>=0)F[v.a][jc]=[bx,by];
  const jt=at(1-v.a,v.t);if(jt>=0)F[1-v.a][jt]=[clamp(bx+dir(v.a)*1.3,-9,109),clamp(by+.9,.8,69.2)];
  return F;
}
// Porteur du ballon : plus gros, cerclé de jaune
const isCar=(ms,d)=>!!(d&&ms.view&&ms.view.c===d.p.id);
const circA=(L,i,d)=>{const car=isCar(L.ms,d);return `r="${car?2.1:1.6}" stroke="${car?'#ffd84d':i===L.side?'#fff':'#0008'}" stroke-width="${car?.6:i===L.side?.35:.2}"`};
// Trajectoire du ballon depuis l'action précédente (en cloche pour un coup de pied)
function trailD(L){const ms=L.ms,p=L.prev;if(!p)return '';const x0=p[0]+10,y0=p[1],x1=ms.x+10,y1=ms.y;if(Math.abs(x1-x0)+Math.abs(y1-y0)<1.5)return '';
  return ms.view&&ms.view.k==='kick'?`M${x0.toFixed(1)} ${y0.toFixed(1)} Q${((x0+x1)/2).toFixed(1)} ${(Math.min(y0,y1)-14).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`:`M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`}
// Étiquette de l'action en cours, au-dessus du ballon
function actLabel(ms){
  const t=(ms.step||[]).map(e=>e.x).join(' ');
  if(/ESSAI/.test(t))return 'ESSAI !';if(/Percée/.test(t))return 'Percée !';if(/gratté/.test(t))return 'Grattage !';if(/En-avant/.test(t))return 'En-avant';if(/Drop réussi/.test(t))return 'Drop !';if(/Pénalité réussie/.test(t))return 'Pénalité réussie';if(/Pénalité/.test(t))return 'Pénalité';if(/carton/i.test(t))return 'Carton !';
  const v=ms.view||{};return {scrum:'Mêlée',lineout:'Touche',maul:'Ballon porté',kick:'Jeu au pied',ruck:'Ruck',kickoff:'Coup d’envoi',goal:'Tentative au but'}[v.k]||(v.t?'Plaquage':'');
}
const trXY=(x,y)=>`translate(${(x+10).toFixed(1)}px,${y.toFixed(1)}px)`;
function pitchSVG(L){
  const K=kits(L.ms.clubs);
  const ms=L.ms,F=formation(ms),tr=`transition:transform ${L.speed==='forts'?0:Math.min(LSPEED[L.speed][0],650)}ms ease-out,opacity .3s`;
  const ln=(x,dash)=>`<line x1="${x}" y1="0" x2="${x}" y2="70" stroke="#ffffffaa" stroke-width="${dash?.2:.35}" ${dash?'stroke-dasharray="1.5 1.5"':''}/>`;
  let dots='';
  for(const i of[0,1])for(let j=0;j<15;j++){const d=ms.T[i].on[j],[x,y]=F[i][j];
    dots+=`<g id="lv-d${i}-${j}" style="transform:${trXY(x,y)};${tr};opacity:${d&&!d.sin?1:0}"><circle id="lv-c${i}-${j}" fill="${K[i].bg}" ${circA(L,i,d)}/><text id="lv-t${i}-${j}" y=".55" text-anchor="middle" font-size="1.55" font-weight="700" fill="${K[i].fg}">${d?d.no:''}</text></g>`}
  return `<svg class="pitch" viewBox="-1 -1 122 72" role="img" aria-label="Terrain">
  <rect x="0" y="0" width="120" height="70" fill="#2f7d45"/>${[20,40,60,80,100].map(x=>`<rect x="${x}" y="0" width="10" height="70" fill="#ffffff08"/>`).join('')}
  <rect x="0" y="0" width="10" height="70" fill="#276b3b"/><rect x="110" y="0" width="10" height="70" fill="#276b3b"/>
  ${ln(10)}${ln(110)}${ln(32)}${ln(88)}${ln(60)}${ln(50,1)}${ln(70,1)}${ln(15,1)}${ln(105,1)}
  <line x1="10" y1="32.2" x2="10" y2="37.8" stroke="#fff" stroke-width=".8"/><line x1="110" y1="32.2" x2="110" y2="37.8" stroke="#fff" stroke-width=".8"/>
  <text x="5" y="35" font-size="2.6" fill="#fff" text-anchor="middle" transform="rotate(-90 5 35)" font-weight="700">${ms.clubs[0].short}</text>
  <text x="115" y="35" font-size="2.6" fill="#fff" text-anchor="middle" transform="rotate(90 115 35)" font-weight="700">${ms.clubs[1].short}</text>
  <path id="lv-trail" d="${trailD(L)}" fill="none" stroke="#f3e3c3" stroke-width=".35" stroke-dasharray="1 1" opacity=".8"/>
  ${dots}<g id="lv-lab" style="transform:${trXY(ms.x,ms.y-4)};${tr}"><text text-anchor="middle" font-size="2.3" font-weight="800" fill="#fff" stroke="#0009" stroke-width=".5" paint-order="stroke">${actLabel(ms)}</text></g>
  <g id="lv-try" style="opacity:${L.tryN>0?1:0};transition:opacity .4s"><rect x="40" y="1.5" width="40" height="9" rx="2" fill="#000b"/><text x="60" y="8.3" text-anchor="middle" font-size="5.5" font-weight="900" fill="${L.tryC||'#fff'}">${L.tryT||''}</text></g>
  <g id="lv-ball" style="transform:${trXY(ms.x,ms.y)};${tr}"><ellipse rx="1.05" ry=".7" fill="#f3e3c3" stroke="#5a3d1e" stroke-width=".25"/></g></svg>`;
}

// ---- Match en direct ----
function clockTxt(ms){const e=PEND[ms.half],m=ms.t>=e?PMIN[ms.half]+"'+":Math.floor(ms.t/60)+"'";return `${m} · ${['','1re mi-temps','2e mi-temps','Prolongation','Prolongation'][ms.half]}`}
const commHTML=ms=>ms.ev.slice(-14).reverse().map(e=>`<div class="ev ${e.k}"><span class="m">${e.m}'</span><span>${e.x}</span></div>`).join('');
const statsLive=ms=>{const p=ms.T[0].st.pos+ms.T[1].st.pos||1,t=ms.terr[0]+ms.terr[1]||1;return statsHTML(ms.T[0].st,ms.T[1].st,rd(ms.T[0].st.pos/p*100),rd(ms.terr[0]/t*100),[ms.clubs[0].short,ms.clubs[1].short])};
function teamHTML(L){
  const ms=L.ms,S=ms.T[L.side];
  const row=(d,n,act)=>`<tr data-a="${act}" data-id="${d.p.id}" class="lv-row${L.sel===d.p.id?' sel':''}"><td>${n}</td><td>${d.p.name}${ms.T[L.side].capId===d.p.id?' <b title="Capitaine">(C)</b>':''}${kickerOf(ms,L.side)===d?' <b title="Buteur">(B)</b>':''}${d.sin?' 🟨':''} <span class="mut">${posL(d.p)}</span></td><td>${formeBar(d.en)}</td><td class="n ${rc(rateOf(ms,d))}">${rateOf(ms,d).toFixed(1)}</td></tr>`;
  const out=Object.values(ms.P).filter(d=>d.side===L.side&&d.slot<0&&(d.start||d.used));
  return `<table><tr><th>N°</th><th>Sur le terrain</th><th>Énergie</th><th class="n">Note</th></tr>${S.on.map((d,j)=>d?row(d,j+1,'liveSel'):`<tr><td>${j+1}</td><td class="ko">— (place vide)</td><td></td><td></td></tr>`).join('')}
  <tr><th colspan="4">Remplaçants</th></tr>${S.bench.filter(b=>!b.used).map(b=>row(b,b.no,'liveSub')).join('')||'<tr><td colspan="4" class="mut">Plus de remplaçant.</td></tr>'}
  ${out.length?`<tr><th colspan="4">Sortis</th></tr>${out.map(d=>`<tr class="mut"><td>${d.no}</td><td>${d.p.name}${d.inj?' 🚑':''}</td><td></td><td class="n">${rateOf(ms,d).toFixed(1)}</td></tr>`).join('')}`:''}</table>`;
}
function viewLive(){
  const L=UI.live;if(!L)return '';
  const ms=L.ms,S=ms.T[L.side],[h,a]=ms.clubs;
  const ctrl=ms.done?`<b>Coup de sifflet final !</b> <button class="btn" data-a="liveEnd">Voir le résumé du match ▶</button>`
    :`<button class="btn sm" data-a="livePause">${L.paused?'▶ Reprendre':'⏸ Pause'}</button> ${Object.entries(LSPEED).map(([v,s])=>`<button class="btn sm ${L.speed===v?'':'sec'}" data-a="liveSpeed" data-v="${v}">${s[1]}</button>`).join(' ')} <button class="btn sec sm" data-a="liveSkip">⏭ Aller à la fin</button>`;
  return `<div class="overlay"><div class="modal live">
  <div class="lv-head"><div class="lv-sb">${kitTag(h,kits(ms.clubs)[0])}<span id="lv-score" class="score">${ms.sc[0]} - ${ms.sc[1]}</span>${kitTag(a,kits(ms.clubs)[1])}<span id="lv-clock" class="pill">${clockTxt(ms)}</span></div><div class="mut" style="font-size:13px">${wxTxt(ms.wx)} · Arbitre : ${refTxt(ms.ref)}</div><div class="row">${ctrl}</div></div>
  <div id="lv-flash" class="lv-flash">${L.flash?`<div class="flash">${L.flash}</div>`:''}</div>
  <div class="lv-grid"><div>${pitchSVG(L)}<div id="lv-now" class="lv-now">${ms.now}</div><div id="lv-comm" class="lv-comm">${commHTML(ms)}</div></div>
  <div><h3>Consignes</h3><div class="lv-tac">
    <label>Style de jeu ${tacSel('liveTac','style',STY,S.tac.style)}</label><label>Intensité ${tacSel('liveTac','int',INTS,S.tac.int)}</label>
    <label>Jeu au pied ${tacSel('liveTac','kick',KICKS,S.tac.kick)}</label><label>Sur pénalité ${tacSel('liveTac','pen',PENS,S.tac.pen)}</label><label>Défense ${tacSel('liveTac','def',DEFS,S.tac.def)}</label><label>Rythme ${tacSel('liveTac','ry',RYTHMS,S.tac.ry)}</label></div>
    ${L.htTalk&&L.paused&&!ms.done?`<div class="card" style="margin:10px 0"><h3>Discours de la mi-temps</h3><p class="mut">${ms.clubs[L.side].short} ${ms.sc[L.side]} - ${ms.sc[1-L.side]} ${ms.clubs[1-L.side].short}. Que dis-tu aux joueurs ?</p>${Object.entries(TALKS.half).map(([v,t])=>`<p><button class="btn sm sec" data-a="liveTalk" data-v="${v}">${t}</button></p>`).join('')}</div>`:''}
    ${L.talkTxt?`<p class="mut">Réaction au discours : ${L.talkTxt}</p>`:''}
    <h3 style="margin-top:12px">${ms.clubs[L.side].short}</h3>
    <label style="cursor:pointer"><input type="checkbox" data-a="liveAuto" ${S.auto?'checked':''}> L'adjoint gère les remplacements</label>
    <p class="mut" style="margin:4px 0">Remplacement : clique sur un joueur sur le terrain, puis sur un remplaçant.</p>
    <div id="lv-team">${teamHTML(L)}</div></div></div>
  <div class="card" style="margin:12px 0 0"><h3>Statistiques</h3><div id="lv-stats">${statsLive(ms)}</div></div>
  </div></div>`;
}
function liveUpdate(){
  const L=UI.live;if(!L)return;const ms=L.ms;
  const set=(id,h)=>{const e=document.getElementById(id);if(e)e.innerHTML=h};
  set('lv-score',`${ms.sc[0]} - ${ms.sc[1]}`);set('lv-clock',clockTxt(ms));set('lv-now',ms.now);
  set('lv-comm',commHTML(ms));set('lv-team',teamHTML(L));set('lv-stats',statsLive(ms));
  const F=formation(ms);
  for(const i of[0,1])for(let j=0;j<15;j++){
    const e=document.getElementById(`lv-d${i}-${j}`);if(!e)continue;
    const d=ms.T[i].on[j];e.style.transform=trXY(F[i][j][0],F[i][j][1]);e.style.opacity=d&&!d.sin?1:0;
    const t=document.getElementById(`lv-t${i}-${j}`);if(t)t.textContent=d?d.no:'';
  }
  const b=document.getElementById('lv-ball');if(b)b.style.transform=trXY(ms.x,ms.y);
  // porteur mis en avant, trajectoire du ballon, étiquette d'action, essai
  for(const i of[0,1])for(let j=0;j<15;j++){const c=document.getElementById(`lv-c${i}-${j}`),d=ms.T[i].on[j];if(c){const car=isCar(ms,d);c.setAttribute('r',car?2.1:1.6);c.setAttribute('stroke',car?'#ffd84d':i===L.side?'#fff':'#0008');c.setAttribute('stroke-width',car?.6:i===L.side?.35:.2)}}
  const tr_=document.getElementById('lv-trail');if(tr_)tr_.setAttribute('d',trailD(L));
  const lb=document.getElementById('lv-lab');if(lb){lb.style.transform=trXY(ms.x,ms.y-4);lb.innerHTML=`<text text-anchor="middle" font-size="2.3" font-weight="800" fill="#fff" stroke="#0009" stroke-width=".5" paint-order="stroke">${actLabel(ms)}</text>`}
  const ty=ms.step.find(e=>e.k==='try');if(ty){const K=kits(ms.clubs)[ty.ti!=null?ty.ti:ms.view.a];L.tryN=3;L.tryT='ESSAI !';L.tryC=K?K.bg==='#111111'?'#fff':K.bg:'#fff'}else if(L.tryN>0)L.tryN--;
  const tg=document.getElementById('lv-try');if(tg){tg.style.opacity=L.tryN>0?1:0;const t=tg.querySelector&&tg.querySelector('text');if(t){t.textContent=L.tryT||'';t.setAttribute('fill',L.tryC||'#fff')}}
  L.prev=[ms.x,ms.y];
  // bandeau sur les temps forts (essai, pénalité réussie, carton, blessure)
  const key=ms.step.find(e=>e.lv>=2);
  if(key){L.flash=key.x;L.flashN=4}else if(L.flashN>0&&--L.flashN===0)L.flash='';
  set('lv-flash',L.flash?`<div class="flash">${L.flash}</div>`:'');
}
function liveSchedule(delay){
  if(liveTimer)clearTimeout(liveTimer);liveTimer=null;
  const L=UI.live;if(!L||L.paused||L.ms.done)return;
  liveTimer=setTimeout(liveTick,delay===undefined?LSPEED[L.speed][0]:delay);
}
function liveTick(){
  liveTimer=null;const L=UI.live;
  if(!L||!G||!UI.modal||UI.modal.type!=='live'||L.paused||L.ms.done)return;
  matchStep(L.ms);
  if(L.ms.pause){L.ms.pause=false;L.paused=true;L.flash=L.ms.now;L.htTalk=true;L.tryN=0;render();return} // mi-temps : pause pour ajuster la tactique
  if(L.ms.done){render();return}
  liveUpdate();
  liveSchedule(L.speed==='forts'&&L.ms.key?1800:LSPEED[L.speed][0]);
}
function startLive(){
  const nx=liveDue();if(!nx)return;
  const m=ME(),hc=C(nx.f.h),ac=C(nx.f.a);
  setMatchLineup(hc);setMatchLineup(ac);
  const ko=!!nx.ko;
  G.talk=UI.talk||'motive';
  UI.live={ms:newMatch(hc,ac,{ko,neutral:!!nx.f.neutral,date:nx.d}),side:hc.id===m.id?0:1,speed:'normal',paused:false,sel:null,flash:'',flashN:0};
  UI.modal={type:'live'};render();liveSchedule();
}
// Fin du direct : le résultat est enregistré, puis la journée est jouée (les autres matchs sont simulés)
function endLive(){
  const L=UI.live;if(!L)return;
  if(liveTimer)clearTimeout(liveTimer);liveTimer=null;
  let g=0;while(!L.ms.done&&g++<4000)matchStep(L.ms);
  G.liveRes={h:L.ms.clubs[0].id,a:L.ms.clubs[1].id,r:matchResult(L.ms)};
  UI.live=null;
  const r=advance('day',{noLive:true});delete G.liveRes;save();
  UI.modal=r?{type:'match'}:null;render();
}
