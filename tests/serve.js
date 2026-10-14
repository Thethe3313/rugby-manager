// Mini-serveur local pour tester le jeu dans un navigateur : node tests/serve.js puis http://localhost:8080
// (Le jeu s'ouvre aussi très bien avec un simple double-clic sur rugby-manager.html.)
'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),port=+process.env.PORT||8080;
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/rugby-manager.html';
  const f=path.join(root,p);
  if(!f.startsWith(root)){res.writeHead(403);return res.end()}
  fs.readFile(f,(err,data)=>{if(err){res.writeHead(404);return res.end('introuvable')}res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)});
}).listen(port,()=>console.log(`Rugby Manager : http://localhost:${port}`));
