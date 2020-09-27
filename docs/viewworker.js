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
      cache.keys().then(names=>{
        return Promise.all(names.map(name=>{
          cache.delete(name);
          }));
      });      
      return cache.addAll([
        //main-site
        './index.html',
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
        //View "Text"
        './simpletext.html',
        './simpletext.js'
      ]);
    })
  );
});