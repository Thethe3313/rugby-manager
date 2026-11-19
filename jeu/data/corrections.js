'use strict';
// ==== CORRECTIONS DE NOTES ====
// Quand une note de REAL est corrigée, on l'ajoute ici pour que les parties déjà commencées en profitent aussi
// (appliqué une seule fois par sauvegarde dans migrateSave ; les nouvelles parties ont directement la bonne note).
// [nom, ancienne note, nouvelle note, date]
const NOTEFIX=[
  ['Marius Domon',71,75,'2026-10-14']
];

// ==== BLEUETS 2025-26 (France U20) ====
// Listes officielles : stage du Tournoi des Six Nations U20 2026 (FFR, 43 joueurs) et Mondial U20 2026 en Géorgie (30 joueurs, MOND).
// Un jeune pro de cette liste tire son potentiel dans le haut de sa fourchette ; un espoir de la liste est international jeunes.
const U20SN=['Lucas Andjisseramatchi','Yanis Basse','Roméo Bonnard Martin','Liam Couturier','Rémi Couty','Mathéo Frisach','Gabin Garault','Lohann Gil','Edouard-Junior Jabea Njocke','Matis Julien','Tana Keletaona','Dany Lamataki','Rémy Lanen','Alexandre Langlois','Marceau Marzullo','Régis Omby','Ruben Pargade','Alban Portat','Nils Punti','Antonio Ratavo','Ethan Tia','Maël Turpin','Baptiste Veschambre','Hugo Avogadro','Martin Blum','Dylan Cazemajou','Paul Cellio Zwiler','Nolhann Couillaud','Adrien Drault','Colin Dupuy','Timéo Frier','Axel Guillaud','Luka Keletaona','Gabin Kretchmann','Joseph Laharrague','Merlin Leflamand','Charly Mignot','Bastien Rasal','Melvyn Rates','Tyreese Robin','Joachim Senga Kouo','Quentin Valentino'];
const U20MOND=['Lucas Andjisseramatchi','Raphaël Audebert','Lilian Baret','Yanis Basse','Bobby Bissu','Roméo Bonnard Martin','Mathéo Frisach','Gabin Garault','Elyjah Ibsaiene','Edouard-Junior Jabea Njocke','Alexandre Langlois','Sacha Lonchampt','Léo Michaux','Alban Portat','Zak Price','Maël Turpin','Baptiste Veschambre','Dylan Cazemajou','Timéo Frier','Axel Guillaud','Valentin Hutteau','Diego Jurd','Luka Keletaona','Tom Levêque','Nathan Llaveria','Diego Mascarenc','Bastien Rasal','Melvyn Rates','Baptiste Tilloles','Quentin Valentino'];
// clé de comparaison : sans accents, tirets ni espaces (« Cazemajou » trouve « Dylan Cazemajou-Noudofinin »)
const u20Key=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z]/g,'');
const U20K=[...new Set(U20SN.concat(U20MOND))].map(n=>[u20Key(n),U20MOND.includes(n)?2:1]);
// 0 = pas dans les listes, 1 = Six Nations U20, 2 = Mondial U20
function bleuet(name){const k=u20Key(name);let b=0;for(const [x,v] of U20K)if(k===x||k.startsWith(x))b=Math.max(b,v);return b}
