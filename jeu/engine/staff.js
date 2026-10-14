'use strict';
// ==== STAFF ====
// Chaque club a six membres du staff, notés sur 20 (q). Un poste vacant compte comme un staff très faible (4/20).
// La note 10 est la référence : les effets sont neutres à 10, meilleurs au-dessus, moins bons en dessous.
const STAFF_ROLES={
  av:{n:'Entraîneur des avants',d:'Progression des avants : mêlée, touche, jeu au sol, plaquage, mental.'},
  tq:{n:'Entraîneur des trois-quarts',d:'Progression des trois-quarts : passe, évitement, prise de balle, plaquage, mental.'},
  but:{n:'Entraîneur des buteurs',d:'Progression du jeu au pied et des buteurs.'},
  pp:{n:'Préparateur physique',d:'Progression physique, récupération entre les matchs, déclin plus lent après 30 ans.'},
  med:{n:'Médecin',d:'Moins de blessures en match, des blessures plus courtes et des retours plus rapides.'},
  rec:{n:'Recruteur',d:'Précision des estimations de potentiel des joueurs des autres clubs.'}
};
const SROLES=Object.keys(STAFF_ROLES);
const staffQ=(c,r)=>!c||!c.staff?10:c.staff[r]?c.staff[r].q:4;
const staffMass=c=>SROLES.reduce((t,r)=>t+(c.staff&&c.staff[r]?c.staff[r].sal:0),0);
// Salaire annuel (k€) selon la qualité et la division
const staffSal=(q,lg)=>isAmLg(lg)?Math.max(1,Math.round((20+q*q*.9)*.05)):Math.max(15,Math.round((20+q*q*.9)*(lg==='t14'?1:lg==='pd2'?.55:.3)/5)*5); // amateurs : bénévoles défrayés
// Ce qu'un technicien libre demande pour signer dans un club (les meilleurs rechignent à descendre de division)
const staffDemand=(s,c)=>isAmLg(c.lg)?staffSal(s.q,c.lg):Math.round(staffSal(s.q,c.lg)*(s.ask||1)*(s.q>=15&&c.lg!=='t14'?1.3:1)/5)*5;
// Membre du staff fictif (f = nom fictif)
function genStaff(role,q,lg){
  q=clamp(Math.round(q),1,20);
  return{id:G.nid++,name:genName(),role,q,age:clamp(Math.round(R.n(28+q*1.3,6)),28,64),sal:isAmLg(lg)?staffSal(q,lg):Math.round(staffSal(q,lg)*(.9+R.f()*.2)/5)*5,ctr:R.i(1,3),f:true};
}
// Vrai nom (données REALSTAFF) : t = fonction réelle, sure = fonction confirmée (sinon supposée). Âge inconnu.
function setRealStaff(s,x){s.name=x[0];s.t=x[1];s.sure=!!x[2];s.age=null;delete s.f}
// Staff de départ : meilleur dans les clubs riches ; vrais noms quand ils sont connus
function initStaff(c){
  const base=c.lg==='t14'||c.ext?9+(c.bud-23000)/37000*8:c.lg==='pd2'?7+(c.bud-5500)/14500*4:c.lg==='nat'?6:c.lg==='n2'?4.5:isAmLg(c.lg)?4.2-(LEVEL[c.lg]-5)*.25:4.5,rs=(typeof REALSTAFF!=='undefined'&&REALSTAFF[c.id])||{};
  c.staff={};
  for(const r of SROLES){const s=genStaff(r,clamp(base+R.n(0,1.8),3,19),c.lg);if(rs[r])setRealStaff(s,rs[r]);c.staff[r]=s}
  if(rs.man)c.manager=rs.man;
  c.staffRef=staffMass(c); // coût « normal » du staff, déjà compris dans les frais de fonctionnement du club
}
// Anciennes sauvegardes : on donne les vrais noms au staff existant (qualité, salaire et contrat inchangés),
// sauf aux membres que le joueur a lui-même recrutés.
function applyRealStaff(){
  if(typeof REALSTAFF==='undefined')return;
  for(const c of G.clubs){
    const rs=REALSTAFF[c.id];if(!rs||!c.staff)continue;
    if(rs.man&&!c.manager)c.manager=rs.man;
    for(const r of SROLES){const s=c.staff[r];if(s&&rs[r]&&!s.hired&&s.name!==rs[r][0])setRealStaff(s,rs[r])}
  }
}
// Techniciens libres (marché du staff), renouvelé chaque été
function genStaffPool(){
  G.staffPool=[];
  for(const r of SROLES)for(let i=0;i<7;i++){const s=genStaff(r,R.f()<.15?R.i(16,19):R.i(5,15),'t14');s.ctr=0;s.ask=Math.round((.9+R.f()*.25)*100)/100;G.staffPool.push(s)}
}
// Progression : quel entraîneur fait progresser quel attribut
const COACHK={mel:'av',tou:'av',rck:'av',pas:'tq',evi:'tq',mai:'tq',pie:'but',but:'but',vit:'pp',pui:'pp',end:'pp'};
const isFwd=p=>p.g==='PIL'||p.g==='TAL'||p.g==='2L'||p.g==='3L';
const coachK=(c,p,key)=>.8+staffQ(c,COACHK[key]||(isFwd(p)?'av':'tq'))/20*.4;
// Récupération (forme) et blessures
const recoverK=c=>.85+staffQ(c,'pp')/20*.3;
const injRiskK=c=>1.15-staffQ(c,'med')/20*.3;
// Embauche par le joueur (old = membre du staff remplacé, licencié avec 50 % du salaire restant)
function hireStaff(m,s,yrs){
  const r=s.role,old=m.staff[r],comp=old?Math.round(old.sal*old.ctr*.5):0;
  if(comp>m.budget)return `Trésorerie insuffisante pour payer l'indemnité de départ de ${old.name} (${fmtK(comp)}).`;
  m.budget-=comp;G.fin.transfers-=comp;
  G.staffPool=G.staffPool.filter(x=>x.id!==s.id);
  if(old){old.ctr=0;old.ask=1;G.staffPool.push(old)}
  s.sal=staffDemand(s,m);s.ctr=yrs;s.hired=true;delete s.ask;m.staff[r]=s;
  addNews(`✍ ${s.name} devient ${STAFF_ROLES[r].n.toLowerCase()} (${s.q}/20, ${fmtK(s.sal)}/an, ${yrs} an${yrs>1?'s':''})${old?` à la place de ${old.name}${comp?` (indemnité ${fmtK(comp)})`:''}`:''}.`);
  return null;
}
// Fin de saison : contrats, retraites, renouvellement du staff des clubs IA
function staffSeasonEnd(){
  const m=ME();
  for(const c of G.clubs.concat(G.ext||[])){
    if(!c.staff)initStaff(c);
    for(const r of SROLES){
      const s=c.staff[r];if(!s)continue;
      if(s.age)s.age++;s.ctr--;
      const old=s.age&&s.age>=67;
      if(s.ctr>0&&!old)continue;
      if(c===m){
        c.staff[r]=null;
        mail('Le président',`Départ : ${s.name}`,`${s.name} (${STAFF_ROLES[r].n.toLowerCase()}) ${old?'prend sa retraite':'quitte le club en fin de contrat'}. Le poste est vacant : recrute un remplaçant dans l'onglet Staff.`,{act:{tab:'staff'},imp:true});
        if(!old){s.ctr=0;s.ask=1;G.staffPool.push(s)}
      }else if(!old&&R.f()<(s.f?.7:.85)){s.ctr=R.i(1,3)}
      else c.staff[r]=genStaff(r,clamp(s.q+R.n(0,1.5),3,19),c.lg);
    }
  }
}
