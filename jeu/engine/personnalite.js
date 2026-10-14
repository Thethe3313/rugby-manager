'use strict';
// ==== PERSONNALITÉ DES JOUEURS ====
// Trois valeurs sur 20, visibles sur la fiche du joueur :
// - pro (professionnalisme) : progression plus rapide, déclin plus lent après 30 ans, moins de fautes, comportement exemplaire ;
// - amb (ambition) : exigences salariales, envie de jouer dans un grand club, plaintes s'il ne joue pas assez ;
// - det (détermination) : se bat jusqu'au bout quand l'équipe est menée, progresse dans le mental, « explose » plus souvent.

// Joueurs réels : valeurs fixes (calculées à partir du nom), un peu plus hautes pour les internationaux et les gros travailleurs
// (on ne devient pas un joueur de classe mondiale sans professionnalisme ni détermination)
function realPers(p,name,caps,rec,tags,rt){
  const star=rt>=88?1:rt>=84?.5:0;
  p.pro=clamp(p.pro+Math.round(star*5)+(caps>30?1:0),1,20);
  p.amb=clamp(Math.round(4+hashN(name+'amb')*12+(caps>20?2:0)+(rt>=85?2:0)),1,20);
  p.det=clamp(Math.round(5+hashN(name+'det')*11+((tags||'').includes('w')?2:0)+(rec?1:0)+star*4),1,20);
}
// Remplit les valeurs manquantes (anciennes sauvegardes)
function ensurePers(p){
  if(p.pro==null)p.pro=clamp(Math.round(5+hashN(p.name+'pro')*12),1,20);
  if(p.amb==null)p.amb=clamp(Math.round(4+hashN(p.name+'amb')*12),1,20);
  if(p.det==null)p.det=clamp(Math.round(5+hashN(p.name+'det')*11),1,20);
}
// Étiquette façon FM
function persLabel(p){
  const pro=p.pro||10,amb=p.amb||10,det=p.det||10;
  if(pro>=17&&det>=15)return 'Modèle de professionnalisme';
  if(pro<=6&&det<=8)return 'Peu fiable';
  if(pro<=6)return 'Peu professionnel';
  if(det>=17)return 'Ultra-déterminé';
  if(pro>=15&&amb>=15)return 'Ambitieux et professionnel';
  if(pro>=15)return 'Très professionnel';
  if(amb>=16)return 'Très ambitieux';
  if(det>=15)return 'Déterminé';
  if(amb<=5)return 'Peu ambitieux';
  if(det<=5)return 'Se décourage vite';
  return 'Équilibré';
}
// Comportement à l'entraînement (chaque lundi) : écarts de conduite des joueurs peu professionnels, exemple donné par les leaders
function weeklyBehaviour(){
  const m=ME(),coach=p=>['PIL','TAL','2L','3L'].includes(p.g)?'Entraîneur des avants':'Entraîneur des trois-quarts';
  for(const p of m.squad){
    if(p.inj>0)continue;
    if((p.pro||10)<=6&&R.f()<.012*(7-(p.pro||10)/1.5)){
      p.forme=clamp(p.forme-10,20,100);
      const t=R.pick(['est arrivé en retard à l\'entraînement','a été aperçu en soirée la veille d\'une séance','a bâclé la séance vidéo','s\'est présenté sans être concentré à l\'entraînement']);
      mail(coach(p),`Écart de conduite : ${p.name}`,`${p.name} ${t}. Il a manqué d'intensité toute la semaine (forme −10).<br><br>Son professionnalisme est faible (${p.pro}/20) : ça freine aussi sa progression.`,{act:{player:p.id}});
    }else if((p.det||10)>=16&&p.lea>=13&&R.f()<.006){
      for(const q of m.squad)if(q.inj===0)q.forme=clamp(q.forme+3,20,100);
      mail(coach(p),`${p.name} tire le groupe vers le haut`,`${p.name} a été exemplaire cette semaine et a entraîné tout le monde avec lui. Le groupe est plus frais (forme +3 pour tout l'effectif).`,{act:{player:p.id}});
    }
  }
}
