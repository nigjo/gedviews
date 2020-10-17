/* global gedviewData */
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

function applyAttributes(copy, viewdata) {
  for (var key in viewdata) {
    var attr = copy.querySelector('*[data-key="' + key + '"]');
    if (attr) {
      var contentElement = attr;
      if (attr.getAttribute('data-linkto')) {
        var famid = viewdata[attr.getAttribute('data-linkto')];
        if (famid) {
          var link = attr.appendChild(document.createElement('a'));
          link.href = '?' + famid.replace(/@/g, '');
          contentElement = link;
        }
      }
      if (viewdata[key]) {
        contentElement.appendChild(document.createTextNode(viewdata[key]));
      }
      if (viewdata['hints'] && viewdata['hints'][key]) {
        attr.setAttribute('data-hint', viewdata['hints'][key]);
      }
    }
  }
}

function removeAttribute(copy, attrkey) {
  //ES2020: copy.querySelector('.gedview-attr[data-key="'+attrkey+'"]')?.remove();
  //ES6:
  var attr = copy.querySelector('*[data-key="' + attrkey + '"]');
  if (attr) {
    attr.remove();
  }
}

function getCleanId(idvalue) {
  //ES2020:return idvalue?.replace(/@/g,'');
  if (idvalue) {
    return idvalue.replace(/@/g, '');
  }
  return idvalue;
}

function createParent(indi2, type, caption, hints) {
  var copy = getTemplate('gedview-parent');
  copy.firstElementChild.setAttribute('data-type', type);
  if (type !== 'wife') {
    removeAttribute(copy, 'fams-marr-date');
    removeAttribute(copy, 'fams-marr-plac');
  }
  var viewdata = flattenIndividual(indi2);
  //console.log(viewdata);
  if (!viewdata['hints']) {
    viewdata['hints'] = {
      name: getCleanId(indi2.id),
      'famc-wife-name': getCleanId(viewdata['famc'])
    };
  }

  applyAttributes(copy, viewdata);

  var acaption = copy.querySelector('*[data-key="name"]>.attrCaption');
  acaption.innerHTML = caption + ': ';

  return copy;
}

function getTemplate(templatename) {
  var template = document.getElementById(templatename);
  return template.content.cloneNode(true);
}

function createChild(indi, num) {
  var copy = getTemplate('gedview-child');
  var viewdata = flattenIndividual(indi);
  console.log(viewdata);
  if (!viewdata['hints']) {
    viewdata['hints'] = {
      sex: getCleanId(indi.id),
      'fams-spou-name': getCleanId(viewdata['fams'])
    };
  }

  copy.firstElementChild.setAttribute('data-num', num);

  applyAttributes(copy, viewdata);

  var acaption = copy.querySelector('*[data-key="name"]>.attrCaption');
  acaption.innerHTML = num + '. Kind: ';

  return copy;
}

function flattenRecord(rec, result = {}, prefix = '') {
  if (rec.children) {
    for (var sub of rec.children) {
      var key = prefix + sub.tag.toLowerCase();
      if(result.hasOwnProperty(key)){
        continue;
      }
      if (sub.value) {
        result[key] = sub.toLocaleString();
      }
      flattenRecord(sub, result, key + '-');
    }
  }
  return result;
}

function flattenIndividual(indi) {
  var result = flattenRecord(indi, {});
  if (result['fams']) {
    flattenRecord(indi.getFamily(), result, 'fams-');
    if (result['fams-husb'] === indi.id) {
      if (result['fams-wife'])
        flattenRecord(indi.getFamily().getWife(), result, 'fams-spou-');
    } else if (result['fams-wife'] === indi.id) {
      if (result['fams-husb'])
        flattenRecord(indi.getFamily().getHusband(), result, 'fams-spou-');
    } else {
      if (result['fams-husb'])
        flattenRecord(indi.getFamily().getHusband(), result, 'fams-husb-');
      if (result['fams-wife'])
        flattenRecord(indi.getFamily().getWife(), result, 'fams-wife-');
    }
  }
  if (result['famc']) {
    flattenRecord(indi.getParentFamily(), result, 'famc-');
    if (result['famc-husb'])
      flattenRecord(indi.getParentFamily().getHusband(), result, 'famc-husb-');
    if (result['famc-wife'])
      flattenRecord(indi.getParentFamily().getWife(), result, 'famc-wife-');
  }
  return result;
}

function getIndidata(indiId) {
  var indi = updateIndi(gedviewData[indiId]);
  if (indi['hints']) {
    indi['hints']['sex'] = indiId;
  }
  return indi;
}

function updateIndi(indi) {
  if (!indi) {
    return {};
  }
  indi['hints'] = {};
  if (indi['famc'] && !(indi['famc-husb'] || indi['famc-wife'])) {
    var famc = gedviewData[indi['famc']];
    indi['famc-husb'] = gedviewData[famc['husb']]['name'];
    indi['famc-wife'] = gedviewData[famc['wife']]['name'];
    indi['hints']['famc-wife'] = indi['famc'];
  }
  if (indi['fams'] && !(indi['marr-spoc'])) {
    var fams = gedviewData[indi['fams']];
    var husb = gedviewData[fams['husb']];
    var wife = gedviewData[fams['wife']];
    if (indi === husb) {
      if (wife)
        indi['marr-spoc'] = wife['name'];
    } else {
      if (husb)
        indi['marr-spoc'] = husb['name'];
    }
    if (fams) {
      indi['marr-date'] = fams['date'];
      indi['marr-plac'] = fams['plac'];
      indi['hints']['marr-spoc'] = indi['fams'];
    }
  }
  //console.log(indi);
  return indi;
}

function printChildrenOfFam(page, children, offset, max) {
  var counter = offset - 1;
  var index = 0;
  if (children) {
    for (var child of children) {
      if (++index < offset)
        continue;
      ++counter;
      //console.log(cid);
      page.appendChild(createChild(child, counter));
      if (counter >= max) {
        break;
      }
    }
  }
  while (++counter < max) {
    page.appendChild(createChild(new Individual(), counter));
  }
  return counter;
}

function printFamily(fam) {
  var main = document.querySelector('main');
  var page = main.appendChild(document.createElement('div'));
  page.classList.add('gedview-page');
  page.setAttribute('data-num', 1);

  var parentdiv = page.appendChild(document.createElement('div'));
  if (!fam) {
    fam = new Family();
    page.removeAttribute('famid');
    delete document.querySelector('header>h1').dataset['famid'];
  } else {
    page.setAttribute('data-famid', getCleanId(fam.id));
  }

  parentdiv.appendChild(createParent(fam.getHusband(),
          'husb', 'Ehemann'));
  parentdiv.appendChild(createParent(fam.getWife(),
          'wife', 'Ehefrau'));

  var childdiv = page.appendChild(document.createElement('div'));
  var children = fam.getChildren();
  var pagemax = 3;
  var next = printChildrenOfFam(childdiv, children, 1, pagemax);
  if (children && children.length >= pagemax) {
    var maxChildren = children.length;
    var pagenum = 2;
    console.log(maxChildren);
    while (next === pagemax + 1) {
      var nextpage = main.appendChild(document.createElement('div'));
      nextpage.classList.add('gedview-page');
      nextpage.setAttribute('data-num', pagenum++);
      nextpage.setAttribute('data-famid', (fam && fam.id) ? getCleanId(fam.id) : '');
      pagemax = next + 4;
      next = printChildrenOfFam(nextpage, children, next, pagemax);
    }
  } else {
    while (next <= pagemax) {
      childdiv.appendChild(createChild(new Individual(), next++));
    }

    var nextpage = main.appendChild(document.createElement('div'));
    nextpage.classList.add('gedview-page');
    nextpage.setAttribute('data-num', 2);
    nextpage.setAttribute('data-famid', (fam && fam.id) ? getCleanId(fam.id) : '');
    printChildrenOfFam(nextpage, null, next, next + 4);
  }
  var notediv = page.parentElement.lastElementChild
          .appendChild(document.createElement('div'));
  notediv.classList.add('gedview-attr');
  notediv.classList.add('note');
  var caption = notediv.appendChild(document.createElement('span'));
  caption.classList.add('attrCaption');
  caption.appendChild(document.createTextNode('Sonstige Informationen:'));
}

function printGedviewFamily(fam, ged) {

  var titledata = flattenRecord(fam);
  if (titledata['husb'])
    flattenRecord(fam.getHusband(), titledata, 'husb-');
  else
    titledata['husb-name'] = '_'.repeat(20);
  if (titledata['wife'])
    flattenRecord(fam.getWife(), titledata, 'wife-');
  else
    titledata['wife-name'] = '_'.repeat(20);

  var main = document.querySelector('main');
  while (main.firstElementChild)
    main.firstElementChild.remove();

  var extra = ' - ';//+ fam.id;
  var fh = fam.getHusband();
  extra += ' ' + (fh ? fh.getIndiName().replaceAll('/', '') : '??');
  var fw = fam.getWife();
  extra += ' - ' + (fw ? fw.getIndiName().replaceAll('/', '') : '??');

  document.querySelector('head>title')
          .appendChild(document.createTextNode(extra));
  document.querySelector('header>h1')
          .dataset['famid'] = getCleanId(fam.id);

  var titlepage = getTemplate('gedview-title');
  applyAttributes(titlepage, titledata);
  if (fam && fam.id) {
    titlepage.firstElementChild.setAttribute('data-famid', getCleanId(fam.id));
  }
  main.appendChild(titlepage);

  printFamily(fam);
}
