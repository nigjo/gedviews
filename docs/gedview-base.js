"use strict";

function loadGedviewGedcom() {

  var storedData = window.localStorage.getItem('GEDview.gedfile');
  if (storedData) {
    var ged = new Gedcom();
    ged.load(storedData);
    console.log("from storage", ged);
    window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: ged}));
    return;
  }

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
  } else {
    printGedviewFamily(fam, ged);
  }
}
