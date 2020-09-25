
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open('gedview1').then(function(cache) {
      let cacheUrl=event.request.url.replace(/\?.*$/, '');
      console.log("creq", event.request.url, cacheUrl);
      return cache.match(cacheUrl).then(function(response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(cacheUrl, response.clone());
          return response;
        });
      });
    })
  );
});

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open('gedview1').then((cache) => {
      return cache.addAll([
        //main-site
        './index.html',
        './index-selector.js',
        //View "Book"
        './book.html',
        './book.css',
        './book.js',
        //View "Familie"
        './famview.html',
        './famview.css',
        './famview.js',
        //View "Ahnentafel"
        './Ahnentafel.html',
        './Ahnentafel.css',
        './Ahnentafel.js',
        './Ahnentafel.jpg',
        //View "Text"
        './simpletext.html',
        './simpletext.js'
      ]);
    })
  );
});