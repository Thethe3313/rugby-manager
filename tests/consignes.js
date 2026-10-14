// Effet des consignes : le même club joue 400 matchs avec chaque consigne, on compare les statistiques.
// Utilisation : node tests/consignes.js [--n 400] [--club pau]
'use strict';
const path=require('path');
const {load}=require('./harness');
const args=process.argv.slice(2),opt=k=>{const i=args.indexOf('--'+k);return i>=0?args[i+1]:null};
const N=+(opt('n')||400),club=opt('club')||'pau';
const g=load(path.join(__dirname,'..','rugby-manager.html'),{seed:21});
g.run(`newGame(${JSON.stringify(club)})`);
const tests=[['style','equilibre'],['style','conquete'],['style','mouvement'],['style','pied'],['kick','main'],['kick','pied'],['pen','points'],['pen','touche'],['pen','melee'],['pen','vite'],['int','basse'],['int','haute']];
console.log(g.run(`(()=>{
  const m=ME(),opp=clubsIn(m.lg).filter(c=>c!==m);opp.forEach(c=>c.lineup=autoLineup(c));m.lineup=autoLineup(m);
  const out=[];
  for(const [k,v] of ${JSON.stringify(tests)}){
    m.tac={style:'equilibre',int:'normale',kick:'mixte',pen:'auto'};m.tac[k]=v;
    const S={w:0,pf:0,pa:0,tr:0,pn:0,mel:0,tou:0,kick:0,car:0,err:0,pc:0,inj:0,min:0};
    for(let i=0;i<${N};i++){
      const o=opp[i%opp.length],home=i%2===0;m.squad.forEach(p=>p.forme=90);o.squad.forEach(p=>p.forme=90);
      const r=home?simMatch(m,o,{}):simMatch(o,m,{}),s=home?0:1,st=r.stats[s];
      if(r.winner===m.id)S.w++;S.pf+=s?r.sa:r.sh;S.pa+=s?r.sh:r.sa;S.tr+=s?r.ta:r.th;S.pn+=r.pn[s];
      S.mel+=st.mel;S.tou+=st.tou;S.kick+=st.kick;S.car+=st.car;S.err+=st.err;S.pc+=st.pc;
      S.inj+=r.ps.filter(x=>x.s===s&&x.inj).length;
    }
    const f=x=>(x/${N}).toFixed(1);
    out.push((k+'='+v).padEnd(16)+' victoires '+(S.w/${N}*100).toFixed(0).padStart(2)+' % · pts '+f(S.pf)+'-'+f(S.pa)+' · essais '+f(S.tr)+' · pén. au but '+f(S.pn)+' · mêlées '+f(S.mel)+' · touches '+f(S.tou)+' · coups de pied '+f(S.kick)+' · en-avant '+f(S.err)+' · fautes '+f(S.pc)+' · blessés '+(S.inj/${N}).toFixed(2));
  }
  return out.join('\\n');
})()`));
