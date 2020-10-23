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
"use strict";
import {Gedcom, Family, Individual} from "./gedcomjs/gedcom.js";

/**
 * Switch to the next family.
 *
 * @param {Family|HTMLElement|String} famRec a reference to the next family.
 *    This can be a Family record or a HTMLElement with a "data-famid" attribute
 *    or the family-id as a string.
 * @returns {undefined}
 */
function switchFamily(famRec) {
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
  window.location.href = '?' + famid.replace(/@/g, '');
}

function loadGedviewGedcom() {
  var storedData = window.localStorage.getItem('GEDview.gedfile');
  if (storedData) {
    var ged = new Gedcom();
    ged.load(storedData);
    console.log("from storage", ged);
    window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: ged}));
    return;
  }
}
window.addEventListener('DOMContentLoaded', loadGedviewGedcom);
window.addEventListener('gedcomLoaded', initGedcom);

function loadGedfile(file) {
  file.text().then(text => {
    var ged = new Gedcom();
    ged.load(text);
    console.log("file", file.name, ged);
    window.localStorage.setItem('GEDview.gedfile', ged.print());
    window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: ged}));
  }).catch(evt => {
    console.error(evt);
    window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: new Gedcom()}));
  });
}

function resetGedcom() {
  window.localStorage.removeItem('GEDview.gedfile', null);
  window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: new Gedcom()}));
}

function initGedcom(evt) {
  var ged = evt.detail;
  var allfams = ged.getFamilies();

  if (location.search) {
    let params = new URLSearchParams(location.search.substring(1));
    if (params.has("fam")) {
      fam = ged.getFamily("@" + params.get("fam") + "@");
    } else {
      for (const[key, value] of params) {
        if (key !== "debug" && value === "") {
          fam = ged.getFamily('@' + key + '@');
          break;
        }
      }
    }
  } else {
    fam = allfams[0];
  }
  var fam;
  if (!fam) {
    fam = new Family();
  }

  if (window.gedviewPage) {
    window.gedviewPage.printGedviewFamily(fam, ged);
  } else if (typeof printGedviewFamily === 'function') {
    printGedviewFamily(fam, ged);
  } else {
    let warning = document.body.appendChild(document.createElement("div"));
    warning.textContent = "keine 'gedviewPage.\u200BprintGedviewFamily()' methode definiert.";
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

export {loadGedfile, resetGedcom, switchFamily};