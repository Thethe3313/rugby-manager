// ==== STOCKAGE DES PARTIES ====
// IndexedDB (base de données du navigateur : des centaines de Mo, contre ~5 Mo pour localStorage), 4 emplacements.
// Si IndexedDB est indisponible (tests Node, navigateur très ancien), on se replie sur localStorage.
// Les fonctions prennent un « rappel » (cb) plutôt qu'une promesse : en repli, tout se fait immédiatement.
const NSLOTS=4,DB_NAME='rugby-manager',DB_STORE='parties',OLD_KEY=SAVE_KEY;
const Store={
  db:null,meta:{},
  // Ouvre la base, lit le résumé des emplacements et reprend l'ancienne sauvegarde (localStorage) dans l'emplacement 1
  init(cb){
    const done=()=>{this.adoptOld(cb)};
    if(typeof indexedDB==='undefined'){this.loadMetaLS();return done()}
    let rq;try{rq=indexedDB.open(DB_NAME,1)}catch(e){this.loadMetaLS();return done()}
    rq.onupgradeneeded=()=>rq.result.createObjectStore(DB_STORE);
    rq.onerror=()=>{this.loadMetaLS();done()};
    rq.onsuccess=()=>{this.db=rq.result;this.get('meta',m=>{this.meta=m?JSON.parse(m):{};done()})};
  },
  // --- accès bas niveau (IndexedDB ou localStorage) ---
  get(key,cb){
    if(!this.db){let v=null;try{v=localStorage.getItem('rugbyManager_'+key)}catch(e){}return cb(v)}
    const rq=this.db.transaction(DB_STORE).objectStore(DB_STORE).get(key);
    rq.onsuccess=()=>cb(rq.result==null?null:rq.result);rq.onerror=()=>cb(null);
  },
  put(key,val,cb){
    cb=cb||(()=>{});
    if(!this.db){try{if(val==null)localStorage.removeItem('rugbyManager_'+key);else localStorage.setItem('rugbyManager_'+key,val);cb(true)}catch(e){cb(false)}return}
    const tx=this.db.transaction(DB_STORE,'readwrite'),st=tx.objectStore(DB_STORE);
    if(val==null)st.delete(key);else st.put(val,key);
    tx.oncomplete=()=>cb(true);tx.onerror=tx.onabort=()=>cb(false);
  },
  loadMetaLS(){try{this.meta=JSON.parse(localStorage.getItem('rugbyManager_meta')||'{}')}catch(e){this.meta={}}},
  // --- emplacements ---
  firstFree(){for(let s=1;s<=NSLOTS;s++)if(!this.meta[s])return s;return null},
  save(slot,json,info,cb){
    this.meta[slot]=info;
    this.put('slot'+slot,json,ok=>{if(!ok){delete this.meta[slot];this.failed=true}this.put('meta',JSON.stringify(this.meta));if(cb)cb(ok)});
  },
  load(slot,cb){this.get('slot'+slot,cb)},
  del(slot,cb){delete this.meta[slot];this.put('slot'+slot,null,()=>this.put('meta',JSON.stringify(this.meta),cb))},
  // Ancienne sauvegarde unique (localStorage) : déplacée dans le premier emplacement libre, puis effacée pour libérer la place
  adoptOld(cb){
    let old=null;try{old=localStorage.getItem(OLD_KEY)}catch(e){}
    if(!old)return cb();
    let g=null;try{g=JSON.parse(old)}catch(e){}
    const slot=this.firstFree();
    if(!g||!slot)return cb();
    const info=slotInfo(g);
    this.save(slot,old,info,ok=>{if(ok)try{localStorage.removeItem(OLD_KEY)}catch(e){}cb()});
  }
};
// Résumé d'une partie pour l'écran d'accueil
function slotInfo(g){
  const c=(g.clubs||[]).find(x=>x.id===g.meId)||{};
  return{club:c.name||'?',lg:c.lg,date:g.date,season:g.season,saved:(d=>`${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`)(new Date())};
}
