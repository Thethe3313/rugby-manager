// Appli installable : le manifeste et le service worker ne fonctionnent que sur un site web (http/https),
// pas quand on ouvre le fichier directement (file://) : dans ce cas on ne les charge pas, pour éviter des erreurs inutiles.
if(/^https?:$/.test(location.protocol)){
  const l=document.createElement('link');l.rel='manifest';l.href='manifest.webmanifest';document.head.appendChild(l);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
}
