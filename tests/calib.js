// Calibrage du moteur de match : moyennes sur beaucoup de matchs de Top 14 et de Pro D2.
// Utilisation : node tests/calib.js [fichier.html] [--n 600]
'use strict';
const path=require('path');
const {load}=require('./harness');
const args=process.argv.slice(2);
const html=args.find(a=>a.endsWith('.html'))||path.join(__dirname,'..','jeu','index.html');
const ni=args.indexOf('--n'),N=ni>=0?+args[ni+1]:600;
const g=load(html,{seed:11});
g.run(`newGame('pau')`);
const res=g.run(`(()=>{
  const out=[];
  for(const lg of ['t14','pd2']){
    const cl=clubsIn(lg);cl.forEach(c=>c.lineup=autoLineup(c));
    const S={n:0,pts:0,tr:0,pen:0,drop:0,yc:0,hw:0,draw:0,bo:0,bd:0,fav:0,big:0,steps:0,tac:0,rk:0,mel:0,tou:0,ms:0};
    for(let i=0;i<${N};i++){
      const h=R.pick(cl);let a=R.pick(cl);while(a===h)a=R.pick(cl);
      h.squad.forEach(p=>p.forme=90);a.squad.forEach(p=>p.forme=90);
      const r=simMatch(h,a,{});
      S.n++;S.pts+=r.sh+r.sa;S.tr+=r.th+r.ta;S.pen+=r.pn[0]+r.pn[1];S.drop+=r.dr[0]+r.dr[1];S.yc+=r.yc[0]+r.yc[1];
      if(r.sh>r.sa)S.hw++;if(r.sh===r.sa)S.draw++;S.bo+=r.bo[0]+r.bo[1];
      S.bd+=(r.sh<r.sa&&r.sa-r.sh<=5?1:0)+(r.sa<r.sh&&r.sh-r.sa<=5?1:0);
      const fh=clubStr(h)>clubStr(a);if((r.sh>r.sa)===fh&&r.sh!==r.sa)S.fav++;
      if(Math.abs(r.sh-r.sa)>=20)S.big++;
      if(r.ps){S.inj=(S.inj||0)+r.ps.filter(x=>x.inj).length;S.mt=(S.mt||0)+r.stats[0].mt+r.stats[1].mt;S.to=(S.to||0)+r.stats[0].to+r.stats[1].to;S.cle=(S.cle||0)+r.stats[0].cle+r.stats[1].cle;S.cv=(S.cv||0)+r.cv[0]+r.cv[1];S.kk=(S.kk||0)+r.stats[0].kick+r.stats[1].kick;S.rt=(S.rt||0)+r.ps.reduce((s,x)=>s+x.r,0)/r.ps.length;S.mx=Math.max(S.mx||0,...r.ps.map(x=>x.r));S.dur=(S.dur||0)+r.ev[r.ev.length-1].m}
      if(r.stats){S.tac+=r.stats[0].tac+r.stats[1].tac;S.rk+=r.stats[0].rk+r.stats[1].rk;S.mel+=r.stats[0].mel+r.stats[1].mel;S.tou+=r.stats[0].tou+r.stats[1].tou;S.ms+=r.stats[0].pc+r.stats[1].pc}
    }
    const f=x=>(x/S.n).toFixed(2),p=x=>(x/S.n*100).toFixed(0)+' %';
    out.push(lg+' : pts/match '+f(S.pts)+' · essais/match '+f(S.tr)+' · pénalités réussies '+f(S.pen)+' · drops '+f(S.drop)+' · jaunes '+f(S.yc)
      +' · victoires domicile '+p(S.hw)+' · nuls '+p(S.draw)+' · bonus off. '+f(S.bo)+' · bonus déf. '+f(S.bd)+' · favori gagne '+p(S.fav)+' · écarts ≥20 '+p(S.big)
      +(S.tac?' · plaquages '+f(S.tac)+' · rucks '+f(S.rk)+' · mêlées '+f(S.mel)+' · touches '+f(S.tou)+' · pén. concédées '+f(S.ms)+' · plaquages manqués '+f(S.mt)+' · grattages '+f(S.to)+' · franchissements '+f(S.cle)+' · transfo. réussies '+(S.cv/S.tr*100).toFixed(0)+' % · coups de pied '+f(S.kk)+' · blessés '+f(S.inj)+' · note moyenne '+f(S.rt)+' (max '+S.mx+')':''));
  }
  return out.join('\\n');
})()`);
console.log(res);
