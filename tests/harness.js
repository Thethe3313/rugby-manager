// Outil de test : charge le jeu dans Node avec un faux navigateur (document, localStorage).
// Les scripts sont exécutés un par un dans le même « contexte », exactement comme dans un navigateur.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');

// Générateur aléatoire « à graine » : la même graine donne toujours la même partie (utile pour comparer deux versions)
function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

// Liste des scripts de la page, dans l'ordre : {name, code}
function scriptsOf(htmlPath){
  const html=fs.readFileSync(htmlPath,'utf8'),dir=path.dirname(htmlPath),out=[];
  const re=/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;let m;
  while((m=re.exec(html))){
    const src=/src="([^"]+)"/.exec(m[1]||'');
    if(src)out.push({name:src[1],code:fs.readFileSync(path.join(dir,src[1]),'utf8')});
    else out.push({name:'inline#'+out.length,code:m[2]});
  }
  return out;
}

function load(htmlPath,opt={}){
  const store={},app={innerHTML:''};
  // faux éléments HTML créés à la demande (le match en direct met à jour des éléments par leur id)
  const elems={},mkEl=id=>({id,innerHTML:'',textContent:'',style:{},value:undefined,setAttribute(){},classList:{add(){},remove(){},toggle(){}}});
  const document={
    getElementById:id=>id==='app'?app:(elems[id]||(elems[id]=mkEl(id))),
    addEventListener(){},
    querySelector:()=>null,querySelectorAll:()=>[]
  };
  const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
  // les minuteries ne se déclenchent pas toutes seules : le test appelle lui-même liveTick()
  let nt=0;const timers=[];
  const ctx={document,localStorage,console,confirm:()=>true,alert:()=>{},
    setTimeout:()=>++nt,clearTimeout(){},setInterval:()=>++nt,clearInterval(){},
    requestAnimationFrame:()=>++nt,cancelAnimationFrame(){}};
  ctx.window=ctx;
  vm.createContext(ctx);
  if(opt.seed!==undefined)vm.runInContext(`Math.random=(${seeded.toString()})(${opt.seed});`,ctx);
  for(const s of scriptsOf(htmlPath))vm.runInContext(s.code,ctx,{filename:s.name});
  const run=code=>vm.runInContext(code,ctx);
  return{ctx,run,app,store,elems,timers};
}

// Cherche « undefined » ou « NaN » dans du HTML produit
function badBits(html){
  const out=[];
  for(const w of ['undefined','NaN','[object Object]']){let i=html.indexOf(w);if(i>=0)out.push(w+' … '+html.slice(Math.max(0,i-80),i+40).replace(/\s+/g,' '))}
  return out;
}

module.exports={load,scriptsOf,badBits,seeded};
