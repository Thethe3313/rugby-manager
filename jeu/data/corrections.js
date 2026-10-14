'use strict';
// ==== CORRECTIONS DE NOTES ====
// Quand une note de REAL est corrigée, on l'ajoute ici pour que les parties déjà commencées en profitent aussi
// (appliqué une seule fois par sauvegarde dans migrateSave ; les nouvelles parties ont directement la bonne note).
// [nom, ancienne note, nouvelle note, date]
const NOTEFIX=[
  ['Marius Domon',71,75,'2026-10-14']
];
