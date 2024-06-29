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
 * List of {PluginData}. The Keys are the plugins' names
 */
class Plugins {
  constructor() {

  }

  getAllFiles() {
    let files = [];
    for (let pname in this) {
      /**@type PluginData*/
      let plugin = this[pname];
      files.push(plugin.name + '/gedview.json');
      files.push(plugin.name + '/' + plugin.target);
      if (plugin.resources) {
        for (let res of plugin.resources) {
          files.push(plugin.name + '/' + res);
        }
      }
    }
    return files;
  }

  /**
   * @returns {Plugins}
   */
  static loadStored() {
    var storedData = localStorage.getItem("plugins");
    return Plugins.load(storedData);
  }

  static load(storedData) {
    let data = new Plugins();
    if (storedData) {
      let parsed = JSON.parse(storedData);
      let names = Object.getOwnPropertyNames(parsed);
      for (let key of names) {
        data[key] = new PluginData();
        Object.assign(data[key], parsed[key]);
      }
    }
    return data;
  }
}

class PluginData {
  constructor() {
    /**@type String*/
    this.name = null;
    /**@type String*/
    this.target = "index.html";
    /**@type String*/
    this.caption = null;
    /**@type Array*/
    this.resources = [];
  }

  getTarget() {
    return this.isValid() ? this.name + '/' + this.target : false;
  }

  isValid() {
    return this.name && this.target;
  }
}

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
    this.data = null;
    this._initializePlugins();
  }

  _sendStoredData() {
    let stored = localStorage.getItem("plugins");
    if (stored) {
      document.addEventListener("DOMContentLoaded", () => {
        let evt = new CustomEvent("pluginsLoaded", {
          detail: Plugins.load(stored)
        });
        document.dispatchEvent(evt);
      });
    }
  }

  _initializePlugins() {
    this._sendStoredData();
    let manager = this;
    fetch('plugins.json').then(r=>{
      if(r.ok)
        return r.json();
      throw r;
    }).then(names=>{
      manager._loadPlugins(names);
    }).catch(evt => {
      console.error(PluginManager.LOGGER, evt);
      manager.updatePlugins(new Plugins());
    });
  }

  _loadPlugins(names) {
    console.log(PluginManager.LOGGER, "scan for", names);
    let nextPlugins = new Plugins();
    for (let pname of names) {
      nextPlugins[pname] = new PluginData();
    }
    /**@type int*/
    let counter = names.length;
    let decrementCounter = () => {
      --counter;
      if (counter <= 0) {
        this.updatePlugins(nextPlugins);
      }
    };
    let queryPlugin = (pname) => {
      fetch(pname + '/gedview.json').then(r=>{
        if(r.ok)
          return r.json();
      }).then(parsed=>{
        let data = new PluginData();
        Object.assign(data, parsed);
        data.name = pname;
        nextPlugins[pname] = data;
        decrementCounter();        
      }).catch(e=>{
        decrementCounter();
      });
    };
    for (let name of names) {
      queryPlugin(name);
    }
  }

  updateWorker() {
    console.log(PluginManager.LOGGER, "updating worker cache");
    let plugins = Plugins.loadStored();
    var resources = {
      type: "pluginfiles",
      files: plugins.getAllFiles()
    };

    if (resources.files.length > 0) {
      if ("swManager" in window) {
        window.swManager.sendMessage("pluginfiles", resources.files);
      }
      //sw.postMessage(resources);
    }
  }

  /**
   * @param {Plugins} loadedPlugins
   */
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

  _ensureData() {
    if (this.data === null) {
      this.data = Plugins.loadStored();
    }
  }

  getTarget(pluginname) {
    this._ensureData();
    if (pluginname in this.data)
      return this.data[pluginname].getTarget();
    return false;
  }
}

/**
 * Accessor to the Plugins.
 * 
 * @type PluginManager
 */
window.gvplugins = new PluginManager();
