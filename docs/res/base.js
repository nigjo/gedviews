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

/* global GedViews */

class ServiceManager {
  static LOGGER = "ServiceManager";
  constructor() {
    let self = this;
    navigator.serviceWorker.register('./viewworker.js').then((reg) => {

      // registration worked
      reg.onupdatefound = (evt) => {
        let currentsw = reg.active;
        let nextsw = reg.installing;
        nextsw.onstatechange = () => {
          if (nextsw.state === "installed") {
            //console.log(ServiceManager.LOGGER, nextsw);
            //console.log(ServiceManager.LOGGER, reg.active);
            if (!currentsw) {
              console.log(ServiceManager.LOGGER, "maybe first contact");
            } else {
              self.notifyOfUpdate();
            }
          }
        };
      };
      //console.log('Registration succeeded. Scope is ' + reg.scope);
    }).catch((error) => {
      // registration failed
      console.warn(ServiceManager.LOGGER, 'Registration failed with ' + error);
    });
    navigator.serviceWorker.addEventListener("message", this.handleMessages);
  }
  sendMessage(type, payload = null) {
    console.log(ServiceManager.LOGGER, "sending message", type);
    navigator.serviceWorker.ready.then(registration => {
      registration.active.postMessage({
        version: 1,
        type: type, data: payload
      });
    });
  }

  notifyOfUpdate() {
    console.warn(ServiceManager.LOGGER, "update available");
    let updatenotifier = document.getElementById("updatenotifier");
    if (updatenotifier) {
      updatenotifier.style.display = "block";
    }
  }

  static toggleInfos() {
    let updatenotifier = document.getElementById("updatenotifier");
    if (updatenotifier) {
      updatenotifier.style.display = "none";
    }
    let unabletoclose = document.getElementById("unabletoclose");
    if (unabletoclose) {
      unabletoclose.style.display = "block";
    }
  }

  handleMessages(evt) {
    let message = evt.data;
    if (message && message.type) {
      switch (message.type) {
        case "version":
          document.getElementById("version")
                  .textContent = message.data.toLocaleString();
          break;
        default:
          console.warn(ServiceManager.LOGGER, "unknown message type", message.type);
          break;
      }
    } else {
      console.warn(ServiceManager.LOGGER, "unknown message", evt);
    }
  }

}


if ('serviceWorker' in navigator) {
  window.swManager = new ServiceManager();
}

class IndexPage {
  static LOGGER = "IndexPage";
  constructor() {

    /**@type Gedcom*/
    this.ged = null;

    this.startPage = 'welcome.html';
    this.defaultPlugin = 'events';

    document.addEventListener('pluginsLoaded', this.updateNavLinks);
    window.addEventListener('load', () => {
      window.swManager.sendMessage("getVersion");
    });
  }

  getIndiName(indi) {
    if (indi)
      return indi.getIndiName();
    return '';
  }

  static hideHeader(iframe) {
    let header;
    if (iframe.contentDocument.readyState === 'loading')
      iframe.contentDocument.addEventListener("DOMContentLoaded", () => {
        IndexPage.hideHeader(iframe);
      });
    else {
      header = iframe.contentDocument.querySelector("header");
      if (header) {
        header.style.display = "none";
      }
    }
  }

  /**
   * @param {Family} viewfam 
   * @param {Gedcom} ged 
   */
  printGedviewFamily(viewfam, ged) {
    this.ged = ged;
    let view = document.querySelector('#view');
    IndexPage.hideHeader(view);
    if (viewfam.id) {
      //TODO: get from plugins
      let target = window.gvplugins.getTarget(this.defaultPlugin)
              || 'selection/index.html';
      view.src = target + '?' + viewfam.id.replace(/@/g, '');
      document.querySelector('#famidmarker').dataset.famid = viewfam.id;
    } else {
      view.src = this.startPage;
      delete document.querySelector('#famidmarker').dataset.famid;
    }
  }

  static updateFamily(event) {
    console.log(IndexPage.LOGGER, "updateFamily");
    IndexPage.updateView(event.target.href);
    document.getElementById('menuview').checked = false;
    return false;
  }

  static updateView(target) {
    console.log(IndexPage.LOGGER, "updateView");

    let targetLocation;
    if (target instanceof URL) {
      targetLocation = target;
    } else {
      targetLocation = new URL(target);
    }

    let fam = document.querySelector('#famidmarker').dataset.famid;
    let query = new URLSearchParams();
    if (fam) {
      query.set('fam', fam.replace(/@/g, ''));
    }

    targetLocation.search = query;
    let nextLoc = targetLocation.toString();
    if (nextLoc !== document.querySelector('#view').contentWindow.location.href) {
      console.log(IndexPage.LOGGER, "set next view to", nextLoc);
      document.querySelector('#view').src = nextLoc;
    }
    //console.log(event.target);
    return false;
  }

  updateSelection(evt) {
    //let subloc = evt.target.contentWindow.location;
    IndexPage.hideHeader(evt.target);

    let famid = GedViews.findFamilyId(evt.target.contentWindow.location);
    this.setFamilyName(famid);
  }

  setFamilyName(famid) {
    //console.log(evt.target.contentWindow.location);
    //console.log(subloc.search);
    let famname = document.querySelector("#famname");
    famname.textContent = "Keine Familie gewählt";
    if (famid) {
      //let famid = '@' + subloc.search.substring(1).replace(/@/g, '') + '@';
      document.querySelector('#famidmarker').dataset['famid'] = famid;

      if (this.ged) {
        let famrec = this.ged.getFamily(famid);
        if (famrec) {
          let husb = famrec.getHusband();
          let wife = famrec.getWife();
          famname.textContent = "";
          let fname = famname.appendChild(document.createElement("span"));
          fname.classList.add("name");
          fname.appendChild(document.createElement("span"))
                  .textContent = (husb ? husb.getIndiName() : "???");
          fname.append(" - ");
          fname.appendChild(document.createElement("span"))
                  .textContent = (wife ? wife.getIndiName() : "???");
        }
      }
    }
  }

  handleDragging(event) {
    event.preventDefault();
    if (event.target && event.target.classList) {
      if (event.type === 'dragover') {
        event.target.classList.add("targeted");
        let dt = event.dataTransfer;
        //console.log(dt);
        if (dt && dt.items.length === 1) {
          event.target.classList.remove("invalid");
        } else {
          event.target.classList.add("invalid");
        }
      } else if (event.type === 'drop') {
        event.target.classList.remove("targeted");
        if (event.target.classList.contains("invalid")) {
          event.target.classList.remove("invalid");
        } else {
          GedViews.resetGedcom();
//          console.log(event);
          let dt = event.dataTransfer;
//          console.log(dt);
          GedViews.loadGedfile(dt.files[0]);
        }
      } else {
//        console.log(event);
        event.target.classList.remove("targeted");
        event.target.classList.remove("invalid");
      }
    }
  }

  viewfile(event) {
//    console.log(event);
    if (event.target.files.length === 1) {
      GedViews.resetGedcom();
      GedViews.loadGedfile(event.target.files[0]);
    }
  }

  updateNavLinks(evt) {
    console.log(IndexPage.LOGGER, "updateing navigation");
    var container = document.querySelector('#viewselect');
    while (container.firstElementChild)
      container.firstElementChild.remove();
    let plugins = evt.detail;
    console.log(IndexPage.LOGGER, "links", plugins);
    for (let name in plugins) {
      /**@type PluginData*/
      let plugin = plugins[name];
      if (plugin.isValid()) {
        let a = container
                .appendChild(document.createElement("li"))
                .appendChild(document.createElement("a"));
        a.href = plugin.getTarget();
        a.textContent = plugin.caption ? plugin.caption : plugin.name;
      }
    }
    let params = new URLSearchParams(window.location.search);
    var navLinks = document.querySelectorAll('nav a:not([href="#"])');
    for (let i = 0; i < navLinks.length; i++) {
      navLinks[i].onclick = evt => {
        return IndexPage.updateFamily(evt);
      };
      if (params.has('view')
              && navLinks[i].getAttribute('href')
              .startsWith(params.get('view') + '/')) {
        const viewLoc = navLinks[i].href;
        setTimeout(() => {
          console.debug(IndexPage.LOGGER, 'defaultview', viewLoc);
          IndexPage.updateView(viewLoc);
        }, 0);
      }
    }
    console.log(IndexPage.LOGGER, "update done");
  }

  printFrame() {
    let view = document.getElementById("view");
    document.getElementById('menuview').checked = false;
    if (view && "contentWindow" in view) {
      view.contentWindow.print();
    } else {
      console.warn(IndexPage.LOGGER, "no view frame");
    }
  }

}

GedViews.setPage(new IndexPage());
