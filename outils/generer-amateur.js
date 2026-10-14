// Génère jeu/data/amateur.js (clubs de Fédérale 2, Fédérale 3 et Régionales) depuis recherche/amateur/brut/federales.json.
// Utilisation : node outils/generer-amateur.js
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const B=JSON.parse(fs.readFileSync(path.join(ROOT,'recherche','amateur','brut','federales.json'),'utf8'));
// Fédérale 1 2026-27 (noms complets, pour retirer de la Fédérale 2 2025-26 les clubs montés)
const F1=fs.readFileSync(path.join(ROOT,'jeu','engine','divisions.js'),'utf8');
const f3=B.f3_2026_27.map(p=>p.filter(n=>n!=='Arcachon')); // le RC Bassin d'Arcachon a été liquidé avant la saison
const inF3=new Set(f3.flat());
// Fédérale 2 2026-27 (pas de page) : les clubs de 2025-26 qui ne sont ni montés en Fédérale 1 ni descendus en Fédérale 3
const f2=B.f2_2025_26.map(p=>p.map(n=>n.replace(/\s*\(.*\)/,'')).filter(n=>!inF3.has(n)&&!F1.includes(n)));
// Régionales 1 à 3 : vrais clubs de Nouvelle-Aquitaine et de Provence-Alpes-Côte d'Azur (Mon Club House, FFR)
const RG=JSON.parse(fs.readFileSync(path.join(ROOT,'recherche','amateur','brut','regionales.json'),'utf8'));
const tidy=n=>n.replace(/s+/g,' ').replace(/^Rubgy /,'Rugby ').replace(/ Rug$/,' Rugby').trim();
const regp={};for(const k of['r1','r2','r3'])regp[k]=[['na',RG.na[k]],['paca',RG.paca[k]]].flatMap(([reg,ps])=>ps.map(p=>[reg,p.filter(n=>!/^Club Exempt/.test(n)).map(tidy)]));
// Clubs fictifs de réserve (pour compléter la Régionale 3 si elle manque de clubs) : nommés d'après de vraies communes (une « région type », même nombre de clubs par niveau ; on écarte les communes qui ont déjà un vrai club en Fédérale)
const COMMUNES=['Saint-Affrique','Millau','Rodez','Villefranche-de-Rouergue','Figeac','Gourdon','Souillac','Moissac','Castelsarrasin','Lectoure','Condom','Eauze','Nogaro','Mirande','Vic-Fezensac','Samatan','Lombez','Muret','Carbonne','Saint-Gaudens',
  'Montréjeau','Revel','Villefranche-de-Lauragais','Caraman','Lavaur','Rabastens','Carmaux','Réalmont','Lacaune','Saint-Juéry','Labruguière','Lautrec','Puylaurens','Castelnaudary','Limoux','Quillan','Lézignan','Sigean','Port-la-Nouvelle','Capendu',
  'Trèbes','Bram','Pamiers','Foix','Lavelanet','Mirepoix','Tarascon-sur-Ariège','Saverdun','Mazères','Varilhes','Lannemezan','Tournay','Rabastens-de-Bigorre','Vic-en-Bigorre','Maubourguet','Argelès-Gazost','Lourdes','Bagnères','Trie-sur-Baïse','Castelnau-Magnoac',
  'Orthez','Salies-de-Béarn','Navarrenx','Nay','Morlaàs','Lembeye','Garlin','Arudy','Mourenx','Monein','Hasparren','Saint-Palais','Cambo-les-Bains','Ustaritz','Hendaye','Urrugne','Saint-Pée-sur-Nivelle','Mauléon','Tardets','Saint-Jean-Pied-de-Port',
  'Hagetmau','Saint-Sever','Aire-sur-l\'Adour','Roquefort','Morcenx','Mimizan','Parentis','Pontonx','Tartas','Rion-des-Landes','Castets','Léon','Capbreton','Saint-Martin-de-Seignanx','Labenne','Montfort-en-Chalosse','Amou','Pouillon','Habas','Peyrehorade-Sud',
  'Ploërmel','Pontivy','Loudéac','Lamballe','Guingamp','Landerneau','Morlaix','Carhaix','Quimperlé','Concarneau','Douarnenez','Vitré','Fougères','Redon','Châteaubriant','Ancenis','Clisson','Machecoul','Challans','Luçon',
  'Fontenay-le-Comte','Parthenay','Bressuire','Thouars','Loudun','Chinon','Amboise','Loches','Vendôme','Romorantin','Vierzon','Issoudun','Le Blanc','Argenton-sur-Creuse','Guéret','Aubusson','Ussel','Égletons','Mauriac','Saint-Flour'];
const PREF=['US','RC','AS','SC','Stade','Entente','Rugby Club','Avenir','Union','Rugby'];
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967296};
const taken=[...f2.flat(),...f3.flat()].join('|')+F1;
const free=COMMUNES.filter(c=>!taken.includes(c)),per=30;
const reg=[0,1,2].map(k=>free.slice(k*per,k*per+per).map(c=>PREF[Math.floor(hash(c+'p')*PREF.length)]+' '+c));
fs.writeFileSync(path.join(ROOT,'jeu','data','amateur.js'),`'use strict';
// ==== CLUBS AMATEURS (généré par outils/generer-amateur.js depuis recherche/amateur/brut/) ====
// F2POULES : Fédérale 2 (clubs 2025-26 sans ceux montés en Fédérale 1 ou descendus en Fédérale 3 ; pas de page 2026-27).
// F3POULES : Fédérale 3 2026-27 (16 poules). Noms : ville du club, comme sur Wikipédia.
// REGPOULES : Régionales 1, 2 et 3 de Nouvelle-Aquitaine (na) et de Provence-Alpes-Côte d'Azur (paca), vraies poules 2026-27 : [région, [clubs]].
// REGFICT : clubs FICTIFS (noms de vraies communes) qui servent seulement à compléter la Régionale 3.
const F2POULES=${JSON.stringify(f2)};
const F3POULES=${JSON.stringify(f3)};
const REGPOULES=${JSON.stringify(regp)};
const REGFICT=${JSON.stringify(reg.flat())};
`);
console.log('Fédérale 2 :',f2.flat().length,'clubs ·','Fédérale 3 :',f3.flat().length,'clubs ·','Régionales :',Object.values(regp).map(l=>l.flatMap(p=>p[1]).length).join(' / '),'vrais clubs ·',reg.flat().length,'clubs fictifs de réserve');
