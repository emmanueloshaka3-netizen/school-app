// Smart School service worker: makes the app load faster and open even on a weak connection.
// Libraries and fonts are saved after the first visit. The app page itself is always
// fetched fresh when the network is fast enough, so updates still arrive.
var LIB_CACHE = "ss-libs-v1";
var PAGE_CACHE = "ss-page-v1";

self.addEventListener("install", function(){ self.skipWaiting(); });
self.addEventListener("activate", function(e){
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);

  // 1. Libraries and fonts: use the saved copy, otherwise download and save it
  if(url.hostname === "cdn.jsdelivr.net" || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com"){
    e.respondWith(
      caches.open(LIB_CACHE).then(function(cache){
        return cache.match(req).then(function(hit){
          if(hit) return hit;
          return fetch(req).then(function(res){
            if(res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  // 2. The app page: try the network first (3 seconds), then fall back to the saved copy
  if(url.origin === self.location.origin && (req.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/"))){
    e.respondWith(
      Promise.race([
        fetch(req).then(function(res){
          var copy = res.clone();
          caches.open(PAGE_CACHE).then(function(c){ c.put(req, copy); });
          return res;
        }),
        new Promise(function(_, reject){ setTimeout(reject, 3000); })
      ]).catch(function(){
        return caches.match(req).then(function(hit){ return hit || fetch(req); });
      })
    );
  }
});
