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
if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener("message", function (evt) {
    console.log("plugins", "message", evt.data);
    if (evt.data === "resourcelist") {
      let plugins = localStorage.getItem("plugins");
      if (!Array.isArray(plugins))
        return;
      var resources = [];
      for (let plugin of plugins) {
        resources.push(plugin.name + '/' + plugin.target);
        if (plugin.resources) {
          for (let res of plugin.resources) {
            resources.push(plugin.name + '/' + res);
          }
        }
      }
      if (resources.length > 0) {
        event.source.postMessage("plugins", resources);
      }
    }
  });
}
(function () {
  let pluginQuery = new XMLHttpRequest();
  pluginQuery.open('GET', 'plugins.json', true);
  pluginQuery.overrideMimeType('application/json');
  pluginQuery.onerror = evt => {
    console.error("plugins", evt);
    localStorage.setItem("plugins", "");
    updatePlugins();
  };
  pluginQuery.onload = evt => {
    let names = JSON.parse(pluginQuery.responseText);
    console.log("plugins", "loading", names);
    localStorage.setItem("plugins", "");
    let counter = names.length;
    let decrementCounter = () => {
      --counter;
      if (counter <= 0) {
        updatePlugins();
      }
    };
    //let plugins = [];
    function getPlugin(pname) {
      let preq = new XMLHttpRequest();
      preq.open('GET', pname + '/gedview.json', true);
      preq.overrideMimeType('application/json');
      preq.onerror = ex => {
        decrementCounter();
      };
      preq.onload = resp => {
        if (resp.target.status === 200) {
          let data = JSON.parse(preq.responseText);
          data.name = pname;
          let sdata = localStorage.getItem("plugins");
          var plugins;
          if (!sdata)
            plugins = [];
          else
            plugins = JSON.parse(sdata);
          plugins.push(data);
          localStorage.setItem("plugins", JSON.stringify(plugins));
        }
        decrementCounter();
      };
      preq.send();
    }
    for (let name of names) {
      getPlugin(name);
    }
  };
//          .catch(ex => {
//    console.error("plugins", ex);
//    localStorage.setItem("plugins", []);
//    updatePlugins();
//  });
  pluginQuery.send();
})();
function updatePlugins() {
  //localStorage.get
  let storedData = localStorage.getItem("plugins");
  let plugins = JSON.parse(storedData);
  console.log("plugins", "loaded", plugins);
  let evt = new CustomEvent("pluginsLoaded", {
    detail: plugins
  });
  document.dispatchEvent(evt);
}