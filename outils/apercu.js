// Page « avant / après » avec images intégrées (l'aperçu de l'appli n'ouvre pas les fichiers voisins).
// Utilisation (depuis apercus/) : node ../outils/apercu.js <config.js>
// La config exporte ({tel,ordi,sec}) => ({out, title, intro, body}) ; les chemins d'images sont relatifs à apercus/.
'use strict';
const fs=require('fs'),path=require('path');
const img=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
const tel=(f,c)=>`<figure><div class="tel"><img src="${img(f)}"></div><figcaption>${c}</figcaption></figure>`;
const ordi=(f,c)=>`<figure class="ordi"><img src="${img(f)}"><figcaption>${c}</figcaption></figure>`;
const sec=(t,txt,shots)=>`<div class="p"><h2>${t}</h2><p>${txt}</p>${shots?`<div class="shots">${shots}</div>`:''}</div>`;
const cfg=require(path.resolve(process.argv[2]))({tel,ordi,sec});
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${cfg.title}</title><style>
:root{--bg:#0f1720;--panel:#17212c;--line:#2a3a4c;--txt:#e6edf3;--mut:#8b9bb0}
body{margin:0;background:var(--bg);color:var(--txt);font:15px/1.5 system-ui,Segoe UI,sans-serif}main{max-width:1200px;margin:0 auto;padding:24px 16px}
h1{margin:0 0 6px}h2{margin:0 0 6px;font-size:19px}.mut{color:var(--mut)}
.p{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px;margin:18px 0}
.shots{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-top:10px}figure{margin:0}figcaption{font-size:13px;color:var(--mut);margin-top:4px}
figcaption b{color:var(--txt)}.tel{width:300px;height:649px;overflow:hidden;border-radius:14px;border:2px solid #333}.tel img{width:400px;display:block}
.ordi img{width:560px;max-width:100%;border-radius:8px;border:1px solid var(--line);display:block}</style></head><body><main>
<h1>${cfg.title}</h1><p class="mut">${cfg.intro}</p>${cfg.body}</main></body></html>`;
fs.writeFileSync(cfg.out,html);console.log(cfg.out,Math.round(html.length/1024)+' Ko');
