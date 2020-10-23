/* global Gedcom */

function updateGedcom(form) {
  console.log(form);

  var ged = generateGedcom(form);

  var gedcom = document.getElementById('result');
  while (gedcom.firstChild) {
    gedcom.firstChild.remove();
  }

  gedcom.appendChild(document.createTextNode(ged.print()));
}
function generateGedcom(form) {
  var ged = new Gedcom();
  var head = ged.root.add(Gedcom.parseRec('0 HEAD'));
  head.add(Gedcom.parseRec('1 DEST DISKETTE'));
  head.add(Gedcom.parseRec('1 GEDC')
          .add(Gedcom.parseRec('2 VERS 5.5.1'))
          .add(Gedcom.parseRec('2 FORM Lineage-Linked')));
  head.add(Gedcom.parseRec('1 CHAR UTF-8'));
  head.add(Gedcom.parseRec('1 SOUR Nigjos_Simple_GEDCOM_Editor'));
  //head.add(Gedcom.parseRec('1 SUBM @U0@'));
  let famid = form['FAMS'].value;
  if (!famid) {
    famid = "@F1@";
    form['FAMS'].value = famid;
  }
  var fam = Gedcom.parseRec('0 ' + famid + ' FAM');
  if (isSet(form, 'HUSB')){
    let indiid = form['HUSB'].value;
    if(!indiid){
      indiid="@SGE"+(++window.indiid)+"@";
      form['HUSB'].value = indiid;
    }
    fam.add(Gedcom.parseRec('1 HUSB ' + form['HUSB'].value));
  }
  if (isSet(form, 'WIFE')){
    let indiid = form['WIFE'].value;
    if(!indiid){
      indiid="@SGE"+(++window.indiid)+"@";
      form['WIFE'].value = indiid;
    }
    fam.add(Gedcom.parseRec('1 WIFE ' + form['WIFE'].value));
  }

  if (form['CHIL']) {
    if (form['CHIL'].length) {
      for (var i = 0; i < form['CHIL'].length; i++) {
        if (form['CHIL'][i].value)
          fam.add(Gedcom.parseRec('1 CHIL ' + form['CHIL'][i].value));
      }
    } else if (form['CHIL'].value) {
      fam.add(Gedcom.parseRec('1 CHIL ' + form['CHIL'].value));
    }
  }

  ged.root.add(fam);

  makeParent(form, ged, 'HUSB', famid);
  makeParent(form, ged, 'WIFE', famid);

  if (form['CHIL']) {
    if (form['CHIL'].length) {
      for (var i = 0; i < form['CHIL'].length; i++) {
        if (form['CHIL'][i].value)
          makeChild(form, ged, famid, i);
      }
    } else if (form['CHIL'].value) {
      makeChild(form, ged, famid);
    }
  }

  ged.root.add(Gedcom.parseRec('0 TRLR'));

  return ged;
}
function getChild(form, name, index) {
  var item = form[name];
  if (item && item.length && index >= 0)
    return item[index];
  return item;
}
function makeChild(form, ged, famid, index = - 1) {
  indi = Gedcom.parseRec('0 ' + getChild(form, 'CHIL', index).value + ' INDI');
  ged.root.add(indi);
  indi.add(Gedcom.parseRec('1 FAMC ' + famid));

  var givn = getChild(form, 'CHIL-NAME-GIVN', index).value;
  var surn = getChild(form, 'CHIL-NAME-SURN', index).value;
  if (givn || surn) {
    let name = Gedcom.parseRec('1 NAME ' + givn + ' /' + surn + '/');
    indi.add(name);
    if (givn)
      name.add(Gedcom.parseRec('2 GIVN ' + givn));
    if (surn)
      name.add(Gedcom.parseRec('2 SURN ' + surn));
  }
  var bdate = getChild(form, 'CHIL-BIRT-DATE', index).value;
  var bplac = getChild(form, 'CHIL-BIRT-PLAC', index).value;
  if (bdate || bplac) {
    let name = Gedcom.parseRec('1 BIRT');
    indi.add(name);
    if (bdate)
      name.add(Gedcom.parseRec('2 DATE ' + bdate));
    if (bplac)
      name.add(Gedcom.parseRec('2 PLAC ' + bplac));
  }
  var ddate = getChild(form, 'CHIL-DEAT-DATE', index).value;
  var dplac = getChild(form, 'CHIL-DEAT-PLAC', index).value;
  if (ddate || dplac) {
    let name = Gedcom.parseRec('1 DEAT');
    indi.add(name);
    if (ddate)
      name.add(Gedcom.parseRec('2 DATE ' + ddate));
    if (dplac)
      name.add(Gedcom.parseRec('2 PLAC ' + dplac));
  }

  return indi;
}
indiid=0;
function isSet(form, prefix){
  return form[prefix].value
          || form[prefix + "-NAME-GIVN"].value
          || form[prefix + "-NAME-SURN"].value;
}
function makeParent(form, ged, prefix, famid) {
  var indi;
  if (form[prefix].value) {
    indi = Gedcom.parseRec('0 ' + form[prefix].value +' INDI');
    ged.root.add(indi);
    indi.add(Gedcom.parseRec('1 FAMS ' + famid));

    var givn = form[prefix + '-NAME-GIVN'].value;
    var surn = form[prefix + '-NAME-SURN'].value;
    if (givn || surn) {
      let name = Gedcom.parseRec('1 NAME ' + givn + ' /' + surn + '/');
      indi.add(name);
      if (givn)
        name.add(Gedcom.parseRec('2 GIVN ' + givn));
      if (surn)
        name.add(Gedcom.parseRec('2 SURN ' + surn));
    }
    var bdate = form[prefix + '-BIRT-DATE'].value;
    var bplac = form[prefix + '-BIRT-PLAC'].value;
    if (bdate || bplac) {
      let name = Gedcom.parseRec('1 BIRT');
      indi.add(name);
      if (bdate)
        name.add(Gedcom.parseRec('2 DATE ' + bdate));
      if (bplac)
        name.add(Gedcom.parseRec('2 PLAC ' + bplac));
    }
    var ddate = form[prefix + '-DEAT-DATE'].value;
    var dplac = form[prefix + '-DEAT-PLAC'].value;
    if (ddate || dplac) {
      let name = Gedcom.parseRec('1 DEAT');
      indi.add(name);
      if (ddate)
        name.add(Gedcom.parseRec('2 DATE ' + ddate));
      if (dplac)
        name.add(Gedcom.parseRec('2 PLAC ' + dplac));
    }

    if (form[prefix + '-FAMC'].value) {
      var famc =
              Gedcom.parseRec('0 ' + form[prefix + '-FAMC'].value + ' FAM')
              .add(Gedcom.parseRec('1 CHIL ' + indi.id));
      ged.root.add(famc);
    }
  }
  return indi;
}
function addChild(evt) {
  var copy = document.getElementById('childblock')
          .content.firstElementChild.cloneNode(true);

  var nextid = document.querySelectorAll('.indi').length + 1;
  copy.querySelector('input[name="CHIL"]')
          .setAttribute('placeholder', '@I' + nextid + '@');
  copy.querySelector('input[name="CHIL-FAMS"]')
          .setAttribute('placeholder', '@F' + (nextid + 1) + '@');

  document.getElementById('children')
          .appendChild(copy);
}
window.addEventListener("DOMContentLoaded", () => updateGedcom(document.querySelector("#editor form")));
