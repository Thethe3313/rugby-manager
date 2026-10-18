'use strict';
// ==== MISSIONS DE RECRUTEMENT ET PÉPITES ====
// Le recruteur part quelques semaines dans une zone du monde. Il revient avec un rapport :
// - les meilleurs jeunes (21 ans au plus) des clubs de la zone, désormais bien connus (fourchette resserrée, attributs visibles) ;
// - parfois des pépites sans club (16-18 ans), qu'on peut faire entrer dans son centre de formation (G.pros).
// Plus le recruteur est bon, plus il trouve de jeunes et plus les pépites sont belles.
const ZONES={
  fra:{n:'France (centres de formation)',nats:['France'],cost:8,days:14},
  nz:{n:'Nouvelle-Zélande',nats:['Nouvelle-Zélande'],cost:45,days:24},
  rsa:{n:'Afrique du Sud',nats:['Afrique du Sud'],cost:40,days:24},
  aus:{n:'Australie',nats:['Australie'],cost:40,days:24},
  pac:{n:'Îles du Pacifique (Fidji, Samoa, Tonga)',nats:['Fidji','FJI','Samoa','Tonga'],cost:35,days:28},
  arg:{n:'Argentine',nats:['Argentine'],cost:35,days:24},
  brit:{n:'Îles britanniques',nats:['Angleterre','Irlande','Écosse','Pays de Galles'],cost:20,days:18},
  est:{n:'Géorgie et Europe de l’Est',nats:['Géorgie','Roumanie','Portugal','Espagne'],cost:20,days:18},
  jpn:{n:'Japon',nats:['Japon'],cost:40,days:24}
};
// nom selon la nationalité (listes de noms de coupes.js)
const NATLANG={'Nouvelle-Zélande':'nz','Afrique du Sud':'za',Australie:'au',Fidji:'fj',Samoa:'fj',Tonga:'fj',Japon:'jp',Géorgie:'ge',Argentine:'es',Roumanie:'it',Portugal:'es',Espagne:'es',Italie:'it'};
// prénoms et noms hispaniques (Argentine, Espagne, Portugal)
NAMES.es=[['Santiago','Mateo','Tomás','Joaquín','Facundo','Juan Cruz','Agustín','Ignacio','Lucas','Franco','Nicolás','Bautista','Gonzalo','Martín','Pedro','Benjamín'],['González','Fernández','Rodríguez','López','Martínez','Pérez','Sánchez','Romero','Álvarez','Torres','Ruiz','Díaz','Herrera','Medina','Castro','Moreno','Vázquez','Ortiz']];
const natName=nat=>{const L=NAMES[NATLANG[nat]||'en'];return R.pick(L[0])+' '+R.pick(L[1])};
// nationalité « française » par défaut pour les joueurs générés des clubs français sans nationalité
const natIn=(p,c,z)=>{const n=p.nat||(c&&!c.ext?'France':null);return ZONES[z].nats.includes(n)};
function startMission(z,g){
  const m=ME();if(G.mission)return 'occupé';if(m.budget<ZONES[z].cost)return 'budget';
  m.budget-=ZONES[z].cost;G.fin.opex=(G.fin.opex||0)+ZONES[z].cost;
  const q=staffQ(m,'rec'),days=Math.round(ZONES[z].days*(1.25-q/40));
  G.mission={z,g:g||'ALL',due:dAdd(G.date,days),start:G.date};
  if(G.phase!=='season')endMission(); // à l'intersaison les jours ne passent pas : rapport immédiat
  return 'ok';
}
function missionDay(){if(G.mission&&G.mission.due<=G.date)endMission()}
function endMission(){
  const M=G.mission;if(!M)return;G.mission=null;
  const m=ME(),q=staffQ(m,'rec'),z=ZONES[M.z],okG=p=>M.g==='ALL'||p.g===M.g;
  // 1) les meilleurs jeunes des clubs de la zone (le recruteur les classe d'après son estimation du potentiel)
  const pool=[];
  for(const c of G.clubs.concat(G.ext||[])){if(c.id===m.id)continue;for(const p of c.squad.concat(c.youth||[]))if(p.age<=21&&okG(p)&&natIn(p,c,M.z))pool.push({p,c})}
  const n=Math.round(4+q/4),found=pool.map(x=>({...x,e:x.p.pot+(hashN(x.p.name+'m'+G.season)-.5)*(16-q*.6)})).sort((a,b)=>b.e-a.e).slice(0,n);
  G.obs=G.obs||{};for(const x of found)G.obs[x.p.id]=Math.max(G.obs[x.p.id]||0,2);
  // 2) des pépites sans club (G.pros) : 0 à 3 selon le recruteur et la zone
  const nP=Math.max(0,Math.min(3,Math.round(R.n(.6+q/10,.7)))),pros=[];
  for(let i=0;i<nP;i++){
    const g=M.g!=='ALL'?M.g:R.pick(GORDER.flatMap(x=>Array(COMP[x]).fill(x))),age=R.i(16,18);
    const p=genPlayer(g,R.n(42+(age-16)*4,4),age);
    p.nat=R.pick(z.nats.filter(x=>x!=='FJI'));p.youth=true;if(p.nat!=='France')p.name=natName(p.nat);p.ctr=0;p.sal=10;
    const r=R.f();p.pot=clamp(Math.round(ovr(p)+R.n(20+q*.6,6)+(r<.04+q*.004?R.i(10,18):0)),Math.round(ovr(p))+6,97);if(p.pot>=85)p.gem=true;
    p.found={z:M.z,until:dAdd(G.date,45)};G.obs[p.id]=3;pros.push(p);
  }
  G.pros=(G.pros||[]).concat(pros);
  G.lastMission={z:M.z,g:M.g,d:G.date,ids:found.map(x=>x.p.id),pros:pros.map(p=>p.id)};
  const li=found.map(x=>`${x.p.name} (${x.p.age} ans, ${GROUPS[x.p.g]}, ${x.c.short}${x.p.youth?' — espoir':''}) · potentiel ≈ ${potEst(x.p)}`).join('<br>');
  mail('Recruteur',`Rapport de mission : ${z.n}`,`De retour de mission (${z.n}${M.g!=='ALL'?', '+GROUPS[M.g].toLowerCase():''}).<br><br><b>Les meilleurs jeunes repérés</b> :<br>${li||'aucun jeune intéressant'}<br><br>${pros.length?`<b>Pépites sans club</b> : ${pros.map(p=>`${p.name} (${p.age} ans, ${GROUPS[p.g]}, potentiel ≈ ${p.pot}${p.gem?' 💎':''})`).join(', ')}. Elles peuvent rejoindre ton centre de formation : décide vite, d'autres clubs rôdent.`:'Pas de pépite sans club cette fois.'}`,{act:{tab:'market',mt:'scout'},imp:true});
}
// faire entrer une pépite sans club dans son centre de formation (ou dans l'effectif si le club n'a pas de centre)
function signProspect(id){
  const m=ME(),i=(G.pros||[]).findIndex(p=>p.id===id);if(i<0)return false;const p=G.pros.splice(i,1)[0];delete p.found;
  const hasAcad=!(m.lg==='n2'||isAmLg(m.lg));
  if(hasAcad){p.youth=true;m.youth=m.youth||[];m.youth.push(p)}else{p.youth=false;p.ctr=2;p.sal=Math.max(1,salaryFor(ovr(p),p.age,m.lg));m.squad.push(p)}
  addNews(`✍ ${p.name} (${p.age} ans, ${GROUPS[p.g]}) rejoint ${hasAcad?'ton centre de formation':'ton effectif'}.`);return true;
}
// les pépites non signées finissent par signer ailleurs
function prosDay(){if(!G.pros||!G.pros.length)return;const gone=G.pros.filter(p=>p.found&&p.found.until<=G.date);if(!gone.length)return;G.pros=G.pros.filter(p=>!gone.includes(p));for(const p of gone){const c=R.pick(G.clubs.filter(c=>c.id!==G.meId&&(c.youth||[]).length&&!isAmLg(c.lg)));if(c){delete p.found;c.youth.push(p);mail('Recruteur',`${p.name} a signé ailleurs`,`La pépite ${p.name} a rejoint le centre de formation de ${c.name}. Tu peux encore faire une offre pour lui.`)}}}
// meilleurs jeunes que tu connais (observés, rapports de mission, internationaux) : la « liste des pépites »
function knownTalents(){
  const out=[],m=ME();
  for(const c of G.clubs.concat(G.ext||[])){if(c.id===m.id)continue;for(const p of c.squad.concat(c.youth||[]))if(p.age<=21&&knowOf(p,c)>=2)out.push({p,c})}
  for(const p of G.pros||[])out.push({p,c:null,pro:true});
  return out.sort((a,b)=>potEst(b.p)-potEst(a.p)).slice(0,40);
}
