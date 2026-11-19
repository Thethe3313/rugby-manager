// ==== MUSIQUE : ta playlist personnelle ====
// Tu choisis des fichiers audio de ton appareil (MP3…) : ils sont gardés dans le navigateur (base IndexedDB, comme les parties)
// et joués en boucle pendant que tu joues. Réglages (volume, aléatoire) gardés sur l'appareil.
const MUSIC_KEY='rugbyManager_music';
const Music={
  list:[],i:0,on:false,audio:null,vol:.5,shuffle:false,url:null,
  ok(){return !!(Store.db&&typeof Audio!=='undefined')},
  init(){
    try{const st=JSON.parse(localStorage.getItem(MUSIC_KEY)||'{}');this.vol=st.vol!=null?st.vol:.5;this.shuffle=!!st.shuffle}catch(e){}
    if(!this.ok())return;
    Store.get('musicList',v=>{try{this.list=v?JSON.parse(v):[]}catch(e){this.list=[]}render()});
  },
  prefs(){try{localStorage.setItem(MUSIC_KEY,JSON.stringify({vol:this.vol,shuffle:this.shuffle}))}catch(e){}},
  saveList(){Store.put('musicList',JSON.stringify(this.list))},
  add(files){
    if(!this.ok())return;
    let n=files.length;if(!n)return;
    for(const f of files){
      const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
      Store.put('music:'+id,f,ok=>{if(ok)this.list.push({id,name:f.name.replace(/\.[^.]+$/,'')});if(--n===0){this.saveList();render()}});
    }
  },
  remove(id){const k=this.list.findIndex(t=>t.id===id);if(k<0)return;if(this.on&&k===this.i)this.stop();this.list.splice(k,1);if(this.i>=this.list.length)this.i=0;Store.put('music:'+id,null);this.saveList();render()},
  play(k){
    if(!this.list.length)return;this.i=((k==null?this.i:k)+this.list.length)%this.list.length;const t=this.list[this.i];
    Store.get('music:'+t.id,blob=>{
      if(!blob){this.remove(t.id);return}
      if(!this.audio){this.audio=new Audio();this.audio.onended=()=>this.next()}
      if(this.url)URL.revokeObjectURL(this.url);this.url=URL.createObjectURL(blob);
      this.audio.src=this.url;this.audio.volume=this.vol;this.on=true;
      const p=this.audio.play();if(p&&p.catch)p.catch(()=>{this.on=false;render()});render();
    });
  },
  next(){if(!this.list.length)return;this.play(this.shuffle&&this.list.length>1?(this.i+1+Math.floor(Math.random()*(this.list.length-1)))%this.list.length:this.i+1)},
  stop(){if(this.audio)this.audio.pause();this.on=false;render()},
  toggle(){if(this.on)this.stop();else this.play()},
  setVol(v){this.vol=Math.max(0,Math.min(1,v));if(this.audio)this.audio.volume=this.vol;this.prefs()},
  now(){return this.list[this.i]?this.list[this.i].name:''}
};
// Petit lecteur dans le bandeau du haut (si la playlist n'est pas vide)
function musicBtn(){if(!Music.list.length)return '';return `<button class="btn sec sm" data-a="musicTgl" title="${Music.on?'Pause : '+Music.now():'Lancer la musique'}">${Music.on?'⏸':'🎵'}</button>${Music.on?'<button class="btn sec sm" data-a="musicNext" title="Morceau suivant">⏭</button>':''}`}
// Carte des Réglages
function musicCard(){
  if(!Music.ok())return `<h3>Musique</h3><p class="mut">Ta playlist n'est pas disponible dans ce navigateur.</p>`;
  return `<h3>Musique</h3><p class="mut">Ajoute tes morceaux (fichiers audio de ton appareil : MP3, M4A…). Ils sont gardés dans le navigateur et tournent en boucle pendant que tu joues ; un bouton 🎵 apparaît en haut de l'écran.</p>
  <p><label class="btn sec">➕ Ajouter des morceaux<input type="file" accept="audio/*" multiple data-a="musicAdd" hidden></label>
  ${Music.list.length?`<button class="btn sm" data-a="musicTgl">${Music.on?'⏸ Pause':'▶ Lecture'}</button> <button class="btn sec sm" data-a="musicNext">⏭ Suivant</button>`:''}</p>
  ${Music.list.length?`<p>Volume <input type="range" min="0" max="100" value="${Math.round(Music.vol*100)}" data-a="musicVol" style="vertical-align:middle"> <label style="cursor:pointer"><input type="checkbox" data-a="musicShuf" ${Music.shuffle?'checked':''}> Ordre aléatoire</label></p>
  <table>${Music.list.map((t,k)=>`<tr><td>${Music.on&&k===Music.i?'🔊 ':''}${t.name.replace(/</g,'&lt;')}</td><td><button class="btn sec sm" data-a="musicPlay" data-i="${k}">▶</button> <button class="btn bad sm" data-a="musicDel" data-id="${t.id}">✕</button></td></tr>`).join('')}</table>`:'<p class="mut">Playlist vide.</p>'}`;
}
