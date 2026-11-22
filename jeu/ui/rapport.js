// Rapport sur l'adversaire : plus ton staff (entraîneurs des avants et des trois-quarts) est bon, plus il est détaillé
const pts=n=>n+' point'+(n>1?'s':'');
function oppReport(o){
  const m=ME(),q=Math.round((staffQ(m,'av')+staffQ(m,'tq'))/2);
  const lvl=q>=14?3:q>=11?2:q>=8?1:0;
  const oo={...o,lineup:autoLineup(o)},to=teamCalc(oo),tm=teamCalc(m.lineup&&m.lineup.length?m:{...m,lineup:autoLineup(m)});
  const tac=(o.tac&&o.tac.style)||aiTac(oo).style,sty=STY[tac]?STY[tac].n:'Équilibré';
  const rk=o.ext||!G.L[o.lg]?0:rankOf(o.id);
  const li=[];
  li.push(`Style probable : <b>${sty}</b>${rk?` · classé ${rk}${rk===1?'er':'e'}`:''}.`);
  const lab={pack:'mêlée et conquête (avants)',backs:'ligne de trois-quarts',kick:'jeu au pied',bench:'banc'};
  const gaps=Object.keys(lab).map(k=>({k,d:to[k]-tm[k]})).sort((a,b)=>a.d-b.d);
  if(lvl>=1){
    const w=gaps[0],s=gaps[gaps.length-1];
    li.push(`<span class="ok">Point faible :</span> ${lab[w.k]} (${w.d<0?pts(Math.abs(rd(w.d)))+' sous la tienne':'à peu près égale à la tienne'}).`);
    li.push(`<span class="ko">Point fort :</span> ${lab[s.k]} (${s.d>0?pts(rd(s.d))+' au-dessus de la tienne':'pas de vrai avantage sur toi'}).`);
  }
  if(lvl>=2){
    const top=to.L.filter(x=>x.p).sort((a,b)=>ovr(b.p)-ovr(a.p)).slice(0,3);
    li.push(`Joueurs à surveiller : ${top.map(x=>`${plink(x.p)} <span class="mut">(${posS(x.p)}, ${noteTxt(x.p,o)})</span>`).join(', ')}.`);
    if(to.kickerP)li.push(`Buteur : ${plink(to.kickerP)} <span class="mut">(${rd(to.kick)} au pied)</span>.`);
  }
  if(lvl>=3){
    const mine=m.tac&&m.tac.style,w=gaps[0].k;
    const adv=w==='pack'?'conquete':w==='backs'?'mouvement':'equilibre';
    const why={pack:'insister sur les mêlées, les touches et le jeu d’avants',backs:'faire circuler le ballon vers les ailes pour les déborder',kick:'mettre la pression au pied et sur le territoire',bench:'jouer à haute intensité : leur banc est court, la fin de match sera pour toi'}[w];
    li.push(`<b>Conseil du staff :</b> ${why}. Style conseillé : <b>${STY[adv].n}</b>${mine===adv?' (c’est déjà le tien)':''}.`);
  }
  const lv=['rapport sommaire','rapport correct','rapport détaillé','rapport très complet'][lvl];
  return `<div class="card"><h3>Rapport sur ${clubLink(o.id,o.short)} <span class="mut" style="font-weight:400">· ${lv} (staff ${q}/20)</span></h3>${li.map(x=>`<p style="margin:6px 0">${x}</p>`).join('')}${lvl<3?'<p class="mut">Un meilleur staff d’entraîneurs donne un rapport plus complet.</p>':''}</div>`;
}
