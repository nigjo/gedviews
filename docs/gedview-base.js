/* global printGedviewFamily */

"use strict";
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
/**
 *@deprecated do not load any default file
 */
function loadDefaultGedcom(){
  var request = new XMLHttpRequest();
  request.open('GET', 'gedview.ged', true);
  request.overrideMimeType('text/plain');
  request.onload = function () {
    var ged = new Gedcom();

    ged.load(request.responseText);

    console.log("gedview.ged", ged);
    window.localStorage.setItem('GEDview.gedfile', ged.print());

    window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: ged}));
  };
  request.onerror = function (evt) {
    console.error(evt);
    window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: new Gedcom()}));
  };
  request.send();
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
    fam = ged.getFamily('@' + location.search.substring(1) + '@');
  } else {
    fam = allfams[0];
  }
  var fam;
  if (!fam) {
    fam = new Family();
  }

  if (window.gedviewPage) {
    window.gedviewPage.printGedviewFamily(fam, ged);
  } else if(typeof printGedviewFamily === 'function'){
    printGedviewFamily(fam, ged);
  } else{
    let warning = document.body.appendChild(document.createElement("div"));
    warning.textContent="keine 'gedviewPage.\u200BprintGedviewFamily()' methode definiert.";
    warning.style.width="50vw";
    warning.style.position="absolute";
    warning.style.left="25vw";
    warning.style.top="33%";
    warning.style.padding="1em";
    warning.style.color="red";
    warning.style.border="4px solid red";
    warning.style.backgroundColor="gold";
    warning.style.fontSize="max(1em,min(5vh,5vw))";
  }
}
