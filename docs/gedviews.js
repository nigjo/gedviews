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
/* global printGedviewFamily, Family, HTMLElement */
import {Gedcom, Family} from './gedcomjs/gedcom.js';
export class GedViews {

  constructor() {
  }

  /**
   * Switch to the next family.
   *
   * @param {Family|HTMLElement|String} famRec a reference to the next family.
   *    This can be a Family record or a HTMLElement with a "data-famid" attribute
   *    or the family-id as a string.
   * @param {boolean} softswitch do a normal switch via query string or only
   * by trying to send a new id to the "parent" window.
   * @returns {undefined}
   */
  static switchFamily(famRec, softswitch = false) {
    let famid;
    if (!famRec) {
      return;
    }
    if (famRec instanceof Family) {
      famid = famRec.id;
    } else if (famRec instanceof HTMLElement) {
      if (!"famid" in famRec.dataset)
        return;
      famid = famRec.dataset.famid;
    } else {
      if (!famRec.match(/^@?\w+\d+@?$/))
        return;
      famid = famRec;
    }
    if (softswitch) {
      //Ausnahmsweise direkter Zugriff auf gedviewPage
      if (window.parent
              && "gedviewPage" in window.parent
              && "setFamilyName" in window.parent.gedviewPage) {
        window.parent.gedviewPage.setFamilyName(famid);
        return;
      }
    }
    window.location = '?' + famid.replace(/@/g, '');
  }

  /**
   * Loades a external file as GEDCOM. After loading the file content a
   * "gedcomLoaded" event is fired. On any error that event contains an empty
   * Gedcom structure.
   * 
   * @param {File} file
   */
  static loadGedfile(file) {
    file.text().then(text => {
      var ged = new Gedcom();
      ged.load(text);
      console.log("gedviewer", file.name, ged);
      let storageContent = ged.print();
      window.localStorage.setItem('GEDview.gedfile', storageContent);
      ged.hash = GedViews._getHash(storageContent);
      window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: ged}));
    }).catch(evt => {
      console.error(evt);
      window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: GedViews._getEmptyGedcomData()}));
    });
  }

  /**
   * Clears all stored GEDCOM data. This function will fire a "gedcomLoaded" event
   * with an empty "Gedcom" structure.
   * 
   * @returns {void} 
   */
  static resetGedcom() {
    window.localStorage.removeItem('GEDview.gedfile', null);
    window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: GedViews._getEmptyGedcomData()}));
  }

  static setPage(GedviewPage) {
    window.gedviewPage = GedviewPage;
  }

  static getPage() {
    return window.gedviewPage;
  }

  static _loadStoredData() {
    const loader = () => {
      var storedData = window.localStorage.getItem('GEDview.gedfile');
      if (storedData) {
        var ged = new Gedcom();
        ged.load(storedData);
        ged.hash = GedViews._getHash(storedData);
        console.log("gedviewer", "loaded from storage", ged);
        window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: ged}));
        return;
      }
    };
    window.addEventListener('gedcomLoaded', GedViews._gedcomLoadedHandler);
    if (document.readyState !== 'loaded')
      window.addEventListener('DOMContentLoaded', loader);
    else
      loader();
  }

  static _getHash(message) {
    //(c) https://stackoverflow.com/users/313177/joelpt
    //see https://stackoverflow.com/a/3276730
    var chk = 0x12345678;
    var len = message.length;
    for (var i = 0; i < len; i++) {
      chk += (message.charCodeAt(i) * (i + 1));
    }

    return (chk & 0xffffffff).toString(16);
  }

  static _getEmptyGedcomData() {
    var gedcom = new Gedcom();
    gedcom.hash = -1;
    return gedcom;
  }

  /**
   * Tries to determinate the familiy id from an URL.
   * 
   * @param {Location} docLocation the location of a document
   * @returns {String|false} The familiy id (with @-chars) or false.
   */
  static findFamilyId(docLocation) {
    var famid = false;
    if (docLocation.search) {
      let params = new URLSearchParams(docLocation.search);
      if (params.has("fam")) {
        famid = "@" + params.get("fam") + "@";
      } else {
        for (const[key, value] of params) {
          if (key !== "debug" && key !== "nocache" && value === "") {
            famid = '@' + key + '@';
            break;
          }
        }
      }
    }
    return famid;
  }

  /**
   * handles any change in the loaded Gedcom structure and will call the
   * current "<gedviewPage>.printGedviewFamily()" function.
   * 
   * @param {type} evt
   */
  static _gedcomLoadedHandler(evt) {
    var ged = evt.detail;
    var allfams = ged.getFamilies();

    let famid = GedViews.findFamilyId(location);
    if (famid) {
      fam = ged.getFamily(famid);
    } else {
      fam = allfams[0];
    }
    var fam;
    if (!fam) {
      fam = new Family();
    }

    let currentPage = GedViews.getPage();
    if (currentPage && "printGedviewFamily" in currentPage) {
      currentPage.printGedviewFamily(fam, ged);
//    } else if (typeof printGedviewFamily === 'function') {
//      printGedviewFamily(fam, ged);
    } else {
      let warning = document.body.appendChild(document.createElement("div"));
      warning.textContent = "keine 'printGedviewFamily()' methode definiert.";
      warning.style.width = "50vw";
      warning.style.position = "absolute";
      warning.style.left = "25vw";
      warning.style.top = "33%";
      warning.style.padding = "1em";
      warning.style.color = "red";
      warning.style.border = "4px solid red";
      warning.style.backgroundColor = "gold";
      warning.style.fontSize = "max(1em,min(5vh,5vw))";
    }
  }
}

window.addEventListener('message', (event) => {
  console.log('GedViews', event)
  //GedViews.setPage(event.detail);
},'http://gedviews.nigjo.de/')
console.log('GedViews', 'init');

GedViews._loadStoredData();
