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

// set this to true in development mode. DO NOT COMMIT a "true" value!
self.disableCacheDelay = false;

self.addEventListener('fetch', function (event) {
  event.respondWith(caches.open(self.currentCache).then(function (cache) {
    if (event.request.url.includes("?debug")){
      console.log(self.currentCache, "disable cache delay");
      self.disableCacheDelay = true;
    }
    let cacheUrl = event.request.url.replace(/\?.*$/, '');
    //console.log(self.currentCache, "request", cacheUrl, event.request.url);
    return cache.match(cacheUrl).then(function (response) {
      if (response && !self.disableCacheDelay) {
        let datehead = response.headers.get("date");
        if (datehead) {
          let cachedate = new Date(datehead);
          let refdate = new Date();
          refdate.setMinutes(refdate.getMinutes() - 10);
          if (cachedate > refdate) {
            console.log(self.currentCache, "skipped cache update for", cacheUrl);
            // a nearly uptodate resource. to not refresh.
            return response;
          }
        }
      } else {
        console.log(self.currentCache, "no cache item for", cacheUrl);
      }
      const refresh = fetch(cacheUrl).then(function (response) {
        if (response.status === 200) {
          console.log(self.currentCache, "refreshing ", cacheUrl);
          cache.put(cacheUrl, response.clone());
        }
        return response;
      });
      return response || refresh;
    });
  }));
});

//Cache name in format "gedview-<year00><dayofyear000>-<counter>"
//update on file changes
self.currentCache = "gedview-20278-1908";

function loadCacheContent(cache) {
  return cache.addAll([
    //main-site
    './favicon.ico',
    './index.html',
    './base.css',
    './base.js',
    './gedview-base.js',
    './plugins.js',
    './plugins.json',
    './welcome.html',
    //PWA
    './pwa.json',
    './ScetchTree-192.png',
    './ScetchTree-512.png',
    //all known fonts
    './fonts/fonts.css',
    './fonts/Luminari-Regular.woff',
    './fonts/unifrakturmaguntia-v11-latin-regular.woff2',
    //external gists
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
  //sendClientMessage('state', "installed");
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
  //sendClientMessage('state', "activated");
});
//self.addEventListener('activate', (event) => {
//  console.log('active', event);
//  installCurrentCache(event);
//});
self.addEventListener('install', installCurrentCache);
self.addEventListener('message', msgEvt => {
  let message = msgEvt.data;
  if (message && message.type) {
    switch (message.type) {
      case "pluginfiles":
        console.log(self.currentCache, "caching plugin files", message.data);
        caches.open(self.currentCache).then(cache => {
          cache.addAll(message.data);
        });
        break;
      case "getVersion":
        sendClientMessage("version", self.currentCache);
        break;
      default:
        console.warn(self.currentCache, "unknown message type", message.type);
    }
  } else {
    console.warn(self.currentCache, "unknown client message", message);
  }
});

function sendClientMessage(type, payload = null) {
  console.log(self.currentCache, "sending client message", type);
  self.clients.matchAll({type: "all"})
          .then(clientList => {
            console.log(self.currentCache,
                    "client list length:", clientList.length);
            for (var i = 0; i < clientList.length; i++) {
              clientList[i].postMessage({
                type: type, data: payload,
                version: self.currentCache
              });
            }
          });
}