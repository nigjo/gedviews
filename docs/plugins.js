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

/**
 * Manageclass for the plugins.
 */
class PluginManager {
  static LOGGER = "PluginsManager";

  constructor() {
    let that = this;
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", function (evt) {
        if (evt.data === "resourcelist") {
          console.log(PluginManager.LOGGER, "message", evt.data);
          that.updateWorker(event.source);
        }
      });
    }
    this._initializePlugins();
  }

  _initializePlugins() {
    let stored = localStorage.getItem("plugins");
    if (stored) {
      document.addEventListener("DOMContentLoaded", () => {
        let evt = new CustomEvent("pluginsLoaded", {
          detail: JSON.parse(stored)
        });
        document.dispatchEvent(evt);
      });
    }
    let manager = this;
    let pluginQuery = new XMLHttpRequest();
    pluginQuery.open('GET', 'plugins.json', true);
    pluginQuery.overrideMimeType('application/json');
    pluginQuery.onerror = evt => {
      console.error(PluginManager.LOGGER, evt);
      manager.updatePlugins({});
    };
    pluginQuery.onload = evt => {
      let names = JSON.parse(pluginQuery.responseText);
      console.log(PluginManager.LOGGER, "scan for", names);
      let nextPlugins = {};
      for (let pname of names) {
        nextPlugins[pname] = {};
      }
      let counter = names.length;
      let decrementCounter = () => {
        --counter;
        if (counter <= 0) {
          manager.updatePlugins(nextPlugins);
        }
      };
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
            nextPlugins[pname] = data;
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
//    manager.updatePlugins();
//  });
    pluginQuery.send();
  }

  updateWorker() {
    console.log(PluginManager.LOGGER, "updating worker cache");
    let data = localStorage.getItem("plugins");
    let plugins = JSON.parse(data);
    var resources = {
      type: "pluginfiles",
      files: []
    };
    for (let pname in plugins) {
      let plugin = plugins[pname];
      resources.files.push(plugin.name + '/gedview.json');
      resources.files.push(plugin.name + '/' + plugin.target);
      if (plugin.resources) {
        for (let res of plugin.resources) {
          resources.files.push(plugin.name + '/' + res);
        }
      }
    }
    if (resources.files.length > 0) {
      if ("swManager" in window) {
        window.swManager.sendMessage("pluginfiles", resources.files);
      }
      //sw.postMessage(resources);
    }
  }

  updatePlugins(loadedPlugins) {
    //localStorage.get
    var loadedData = JSON.stringify(loadedPlugins);
    var storedData = localStorage.getItem("plugins");
    if (storedData !== loadedData) {
      console.log(PluginManager.LOGGER, "updating plugin data", loadedPlugins);
      localStorage.setItem("plugins", loadedData);
      let evt = new CustomEvent("pluginsLoaded", {
        detail: loadedPlugins
      });
      document.dispatchEvent(evt);
    }
    this.updateWorker();
  }
}

/**
 * Accessor to the Plugins.
 * 
 * @type PluginManager
 */
window.gvplugins = new PluginManager();
