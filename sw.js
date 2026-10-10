/* Streaks service worker: offline cache + reminder notifications. */
importScripts('remind.js');
var V='streaks-v1',CK='streaks-data',CU='./__sched',
FILES=['./','index.html','remind.js','manifest.webmanifest','icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png','icons/badge.png'];

self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V&&k!==CK}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});

/* Stale-while-revalidate for the app's own files: instant launch, quietly refreshed. */
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!=='GET')return;var u=new URL(r.url);if(u.origin!==location.origin)return;
 var key=u.origin+u.pathname;
 e.respondWith(caches.open(V).then(function(c){return c.match(key).then(function(hit){
  var net=fetch(r.mode==='navigate'?key:r).then(function(res){if(res&&res.ok)c.put(key,res.clone());return res}).catch(function(){return hit||(r.mode==='navigate'?c.match('index.html'):Response.error())});
  return hit||net})}))});

function rc(){return caches.open(CK).then(function(c){return c.match(CU)}).then(function(r){return r?r.json():null}).catch(function(){return null})}
function wc(o){return caches.open(CK).then(function(c){return c.put(CU,new Response(JSON.stringify(o),{headers:{'Content-Type':'application/json'}}))}).catch(function(){})}
function show(it){return self.registration.showNotification(it.title,{body:it.body,tag:it.key,renotify:true,icon:'icons/icon-192.png',badge:'icons/badge.png',requireInteraction:!!it.sticky,timestamp:Date.now(),data:{k:it.key},
 actions:it.kind==='d'?[{action:'snooze',title:'Snooze 10 min'}]:[{action:'done',title:'Done'},{action:'snooze',title:'Snooze 10 min'}]})}

/* Best-effort background check (Chrome on Android runs this occasionally for installed apps). */
function check(){return self.clients.matchAll({type:'window'}).then(function(cs){
 if(cs.some(function(c){return c.visibilityState==='visible'}))return;   /* the open app handles its own reminders */
 return rc().then(function(s){if(!s)return;var now=new Date(),l=Remind.due(s,now,180);if(!l.length)return;
  s.fired=s.fired||{};s.snooze=s.snooze||{};
  return Promise.all(l.map(function(it){s.fired[it.key]=Remind.today(now)+'@'+it.time;delete s.snooze[it.key];return show(it)})).then(function(){return wc(s)})})})}
self.addEventListener('periodicsync',function(e){if(e.tag==='streaks-remind')e.waitUntil(check())});

self.addEventListener('notificationclick',function(e){var n=e.notification,k=(n.data&&n.data.k)||n.tag,a=e.action;n.close();
 e.waitUntil(a==='snooze'?rc().then(function(s){s=s||{items:[]};s.snooze=s.snooze||{};s.snooze[k]=Date.now()+10*60000;return wc(s)}):
  self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){var act=a==='done'?'done':'open';
   if(cs.length){var c=cs[0];c.postMessage({t:'act',a:act,k:k});return c.focus()}
   return self.clients.openWindow('./?a='+act+'&k='+encodeURIComponent(k))}))});
