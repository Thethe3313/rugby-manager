'use strict';
// Moteur : simulation d'un match

// ---- Simulation d'un match ----
function simMatch(hc,ac,opt={}){
  const clubs=[hc,ac],T=[teamCalc(hc),teamCalc(ac)];
  const sc=[0,0],tr=[0,0],pn=[0,0],dr=[0,0],cv=[0,0],yc=[0,0],seq=[0,0],ycT=[0,0];
  const ev=[],hb=opt.neutral?0:2.5;
  const sty=i=>STY[clubs[i].tac.style],ib=i=>({basse:-2,normale:0,haute:2})[clubs[i].tac.int];
  const rating=(i,min)=>{
    const t=T[i];let pk=t.pack+ib(i),bk=t.backs+ib(i);
    if(min>55){pk=pk*.78+t.bench*.22;bk=bk*.78+t.bench*.22}
    const f=ycT[i]>0?.93:1,h=i===0?hb:0;
    return{pk:pk*f+h,bk:bk*f+h,kick:t.kick};
  };
  const nm=i=>clubs[i].short;
  const SW=[1,2,1,1,1,2,2,3,2,2,6,4,4,6,4];
  const pickScorer=(i,min)=>{
    const t=T[i],S=sty(i);
    if(min>60&&R.f()<.25){const b=t.L.slice(15).filter(x=>x.p);if(b.length)return R.pick(b).p}
    const ws=SW.map((w,k)=>w*(S===STY.conquete&&k<8?1.8:S===STY.mouvement&&k>=8?1.3:1)*(t.L[k].p?1:0));
    let tot=ws.reduce((a,b)=>a+b,0),r=R.f()*tot;
    for(let k=0;k<15;k++){r-=ws[k];if(r<=0)return t.L[k].p}
    return t.L[14].p||t.L[0].p;
  };
  const push=(min,i,k,x)=>ev.push({m:min,ti:i,k,x:`${x}`+(k==='try'||k==='conv'||k==='pen'||k==='drop'?`  (${sc[0]}-${sc[1]})`:'')});
  for(let min=1;min<=80;min++){
    if(min===41)ev.push({m:40,ti:-1,k:'half',x:`Mi-temps : ${hc.short} ${sc[0]} - ${sc[1]} ${ac.short}`});
    for(const i of[0,1])if(ycT[i]>0)ycT[i]--;
    const rr=[rating(0,min),rating(1,min)];
    const pos=i=>.55*rr[i].pk+.45*rr[i].bk;
    const pH=clamp(.5+(pos(0)-pos(1))/160,.36,.64);
    const a=R.f()<pH?0:1,d=1-a;
    if(R.f()<.011){
      const i=R.f()<.5?0:1;
      if(ycT[i]===0){ycT[i]=10;yc[i]++;const p=T[i].L[R.i(0,14)].p;if(p)push(min,i,'card',`Carton jaune pour ${p.name} (${nm(i)}). ${nm(i)} à 14 pendant 10 minutes.`)}
    }
    seq[a]++;
    const S=sty(a),sw=S.wp+S.wb+S.wk;
    const att=(S.wp*rr[a].pk+S.wb*rr[a].bk+S.wk*rr[a].kick)/sw;
    const def=.5*rr[d].pk+.5*rr[d].bk;
    const r=clamp(Math.exp((att-def)/14),.45,2.4);
    const disc=clamp(1+(70-T[d].men)/120,.8,1.25);
    const pTry=.066*r*S.try,pPen=.058*S.pen*disc*Math.pow(r,.3),pDrop=.004*S.drop*Math.pow(r,.3);
    const u=R.f();
    const kp=T[a].kickerP,kprob=kp?clamp(.55+(to99(kp.but)-60)/110,.35,.95):.5;
    if(u<pTry){
      const p=pickScorer(a,min);sc[a]+=5;tr[a]++;
      if(p){p.st.es++;p.st.pts+=5}
      push(min,a,'try',`ESSAI ${nm(a)} ! ${p?p.name:'?'} aplatit.`);
      if(R.f()<kprob){sc[a]+=2;cv[a]++;if(kp){kp.st.pts+=2}push(min,a,'conv',`Transformation réussie par ${kp?kp.name:'?'}.`)}
      else push(min,a,'miss',`Transformation manquée (${kp?kp.name:'?'}).`);
    }else if(u<pTry+pPen){
      if(R.f()<.85){
        if(R.f()<kprob+.1){sc[a]+=3;pn[a]++;if(kp)kp.st.pts+=3;push(min,a,'pen',`Pénalité réussie pour ${nm(a)} (${kp?kp.name:'?'}).`)}
        else push(min,a,'miss',`Pénalité manquée par ${kp?kp.name:'?'} (${nm(a)}).`);
      }
    }else if(u<pTry+pPen+pDrop){
      if(R.f()<.45){sc[a]+=3;dr[a]++;if(kp)kp.st.pts+=3;push(min,a,'drop',`Drop réussi par ${kp?kp.name:'?'} (${nm(a)}) !`)}
    }
  }
  let winner=sc[0]>sc[1]?hc.id:sc[1]>sc[0]?ac.id:null;
  if(!winner&&opt.ko){
    const w=R.f()<.5+(clubStr(hc)-clubStr(ac))/100?0:1;sc[w]+=3;
    winner=clubs[w].id;ev.push({m:80,ti:w,k:'pen',x:`Prolongation : ${nm(w)} s'impose sur le fil !`});
  }
  // Règles LNR (Top 14 / Pro D2) : bonus offensif = au moins 3 essais de plus que l'adversaire, bonus défensif = défaite de 5 points ou moins
  const bh=(tr[0]-tr[1]>=3?1:0)+(sc[0]<sc[1]&&sc[1]-sc[0]<=5?1:0);
  const ba=(tr[1]-tr[0]>=3?1:0)+(sc[1]<sc[0]&&sc[0]-sc[1]<=5?1:0);
  return{sh:sc[0],sa:sc[1],th:tr[0],ta:tr[1],ph:Math.round(seq[0]/(seq[0]+seq[1])*100),pn,dr,cv,yc,ev,bo:[bh,ba],winner};
}
