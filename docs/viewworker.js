/* 
 * Copyright 2020 nigjo.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global self, caches, Promise, fetch */

self.addEventListener('fetch', function (event) {
  event.respondWith(caches.open(self.currentCache).then(function (cache) {
    let cacheUrl = event.request.url.replace(/\?.*$/, '');
    console.log("request", self.currentCache, cacheUrl, event.request.url);
    return cache.match(cacheUrl).then(function (response) {
      return response || fetch(event.request).then(function (response) {
        cache.put(cacheUrl, response.clone());
        return response;
      });
    });
  }));
});

//Cache name in format "gedview<year00><dayofyear000>"
//update on file changes
self.currentCache = "gedview20271c";
self.deprecatedCaches = [
  "gedview1",
  "gedview20271",
  "gedview20271b"
];

function loadCacheContent(cache) {
  return cache.addAll([
    //main-site
    './index.html',
    './gedcomjs/gedcom.js',
    './favicon.ico',
    './welcome.html',
    './base.css',
    './base.js',
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
    './adjustspacingjs/adjustSpacing.js',
    //View "Text"
    './simpletext.html',
    './simpletext.js'
  ]);
}

function installCurrentCache(event) {
  console.log('installing', self.currentCache);
  event.waitUntil(
          caches.open(self.currentCache).then(loadCacheContent)
          );
  event.waitUntil(self.deprecatedCaches.forEach((name) => {
    console.log('removing cache ', name);
    caches.delete(name);
  }));
  console.log('ok', self.currentCache);
}

//self.addEventListener('activate', (event) => {
//  console.log('active', event);
//  installCurrentCache(event);
//});
self.addEventListener('install', installCurrentCache);