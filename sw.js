/* CRS FIGHTER - service worker
   HTML : reseau d abord (une mise a jour est visible au rechargement suivant).
   Musique / icones : cache d abord (lourd et immuable).
   Une seule ligne a modifier pour purger tout le cache : VERSION. */
var VERSION = 84;
var CACHE   = 'crsf-v' + VERSION;
var COQUILLE = ['./crs-fighter.html', './manifest.json', './icon-192.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(COQUILLE); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// les gros fichiers immuables : on garde le cache d abord
function immuable(url){
  return /\.(mp3|ogg|wav|png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname);
}

self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // --- musique, images, icones : cache d abord ---------------------------
  if (immuable(url)){
    e.respondWith(
      caches.match(e.request).then(function(hit){
        if (hit) return hit;
        return fetch(e.request).then(function(res){
          if (res && res.ok){
            var clone = res.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
          }
          return res;
        });
      })
    );
    return;
  }

  // --- HTML, manifeste, reste : reseau d abord, cache en secours ---------
  e.respondWith(
    fetch(e.request).then(function(res){
      if (res && res.ok){
        var clone = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match('./crs-fighter.html');
      });
    })
  );
});
