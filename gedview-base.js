"use strict";

function loadGedviewGedcom() {
  var request = new XMLHttpRequest();
  request.open('GET', 'gedview.ged', true);
  request.overrideMimeType('text/plain');
  request.onload = function () {
    var ged = new Gedcom();

    ged.load(request.responseText);

    console.log(ged);

    window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: ged}));
  };
  request.onerror = function(){
    window.dispatchEvent(new CustomEvent('gedcomLoaded', {detail: new Gedcom()}));
  };
  request.send();
}
window.addEventListener('DOMContentLoaded', loadGedviewGedcom);
window.addEventListener('gedcomLoaded', initGedcom);

function initGedcom(evt){
  var ged = evt.detail;
  var allfams = ged.getFamilies();

  if (location.search) {
    fam = ged.getFamily('@' + location.search.substring(1) + '@');
  } else {
    fam = allfams[0];
  }
  var fam;
  if(!fam){
    fam = new Family();
  }
 
  printGedviewFamily(fam, ged);
}
