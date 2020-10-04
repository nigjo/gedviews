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
    console.log(self.currentCache, "request", cacheUrl, event.request.url);
    return cache.match(cacheUrl).then(function (response) {
      const refresh = fetch(cacheUrl).then(function (response) {
        console.log(self.currentCache, "update cache for ", cacheUrl);
        cache.put(cacheUrl, response.clone());
        return response;
      });
      return response || refresh;
    });
  }));
});

//Cache name in format "gedview<year00><dayofyear000>"
//update on file changes
self.currentCache = "gedview-20278-3";

function loadCacheContent(cache) {
  self.clients.matchAll({type: "window"})
          .then(clientList => {
            console.log(self.currentCache,
                    "reslist", "client list length:", clientList.length);
            for (var i = 0; i < clientList.length; i++) {
              clientList[i].postMessage("resourcelist");
            }
          });
  return cache.addAll([
    //main-site
    './index.html',
    './favicon.ico',
    './pwa.json',
    './ScetchTree-192.png',
    './ScetchTree-512.png',
    './gedview-base.js',
    './welcome.html',
    './base.css',
    './base.js',
    './plugins.js',
    './plugins.json',
    './fonts/fonts.css',
    './fonts/Luminari-Regular.woff',
    './fonts/unifrakturmaguntia-v11-latin-regular.woff2',
    './gedcomjs/gedcom.js',
    './adjustspacingjs/adjustSpacing.js'
  ]);
}

function installCurrentCache(event) {
  console.log(self.currentCache, 'installing');
  event.waitUntil(
          caches.open(self.currentCache).then(loadCacheContent)
          );
  console.log(self.currentCache, 'install done');
}
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(keyList => {
    return Promise.all(keyList.map(key => {
      if (key !== self.currentCache) {
        console.log(self.currentCache, "remove old cache", key);
        return caches.delete(key);
      }
    }));
  }));
});
//self.addEventListener('activate', (event) => {
//  console.log('active', event);
//  installCurrentCache(event);
//});
self.addEventListener('install', installCurrentCache);
self.addEventListener('message', msgEvt => {
  let resources = msgEvt.data;
  if (resources && resources.type && resources.type === "pluginfiles") {
    console.log("plugin files", self.currentCache, resources);
    caches.open(self.currentCache).then(cache => {
      cache.addAll(resources.files);
    });
  }
});