/* 
 * Copyright 2024 nigjo.
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
import {Gedcom, Individual, Family} from "../gedcomjs/gedcom.js";
import {GedViews} from '../gedviews.js';

function getIndiId(indi) {
  return 'ged_' + indi.id.replaceAll('@', '');
}
/**
 * 
 * @param {Individual} indi
 * @returns {Element}
 */
function createIndividual(indi) {
  /**
   * @type DocumentFragment
   */
  const block = document.getElementById('individual').content.cloneNode(true)
          .firstElementChild;

  if (!indi) {
    return block;
  }

  block.id = getIndiId(indi);

  /**
   * @type Record
   */
  const sex = indi.getFirstSubRecord('SEX');
  if (sex) {
    if (sex.value === 'F') {
      block.classList.add('female');
    } else if (sex.value === 'M') {
      block.classList.add('male');
    }
  }

//  let givn = null;
//  let birth = null;
//  let now = null;

  let nameRecs = indi.getSubRecords('NAME');
  /**
   * @type Record
   */
  const names = {};
  for (var item of nameRecs) {
    const typeRec = item.getFirstSubRecord('TYPE');
    const nameParts = item.value.match(/(.*? ?)\/(.*?)\//);
    if (typeRec) {
      names[typeRec.value.toLowerCase()] = {
        givn: item.getSubValue('GIVN', nameParts ? nameParts[1].trim() : '?'),
        surn: item.getSubValue('SURN', nameParts ? nameParts[2] : '?')
      };
    } else {
      names[0] = {
        givn: item.getSubValue('GIVN', nameParts ? nameParts[1].trim() : '?'),
        surn: item.getSubValue('SURN', nameParts ? nameParts[2] : '?')
      };
    }
    const marriedNameRec = item.getFirstSubRecord('_MARNM');
    if (marriedNameRec && !("married" in names)) {
      const parts = marriedNameRec.value.match(/(.*?) \/(.*?)\//);
      //console.debug('_MARNM', marriedNameRec.value, data);
      if (parts && parts.length > 2 && parts[2]) {
        names.married = {
          givn: item.getSubValue('GIVN', ' '),
          surn: parts[2]
        };
      }
    }
  }
  if (!("birth" in names)) {
    if (names[0])
      names.birth = names[0];
  }

  if ("birth" in names) {
    block.querySelector('.givenName').textContent = names.birth.givn;
    if ("married" in names) {
      block.querySelector('.familyName').textContent = names.married.surn;
      block.querySelector('.birthName').textContent = names.birth.surn;
    } else {
      block.querySelector('.familyName').textContent = names.birth.surn;
    }
  } else {
    console.warn(names);
  }


  const birt = getDateString(indi, 'BIRT');
  if (birt) {
    block.querySelector('.dateOfBirth').textContent = birt;
  }
  const deat = getDateString(indi, 'DEAT');
  if (deat) {
    block.querySelector('.dateOfDeath').textContent = deat;
  }

  return block;
}

function getDateString(indi, rec) {
  const birt = indi.getPath([rec, 'DATE']);
  if (birt) {
    return birt.toLocaleString();
  }
  return false;
}

function createFamily(fam) {

  const content = document.createElement('div');
  content.classList.add('family');

  let parents = document.createElement('div');
  parents.classList.add('parents');
  if (fam.getFirstSubRecord('DIV')) {
    parents.classList.add('divorced');
  } else if (fam.getFirstSubRecord('MARR')) {
    parents.classList.add('married');
  }
  parents.append(createIndividual(fam.getHusband()));
  parents.append(createIndividual(fam.getWife()));
  content.append(parents);

//  h = document.createElement('h2');
//  h.textContent = 'Kinder';
//  content.append(h);

  const children = fam.getChildren();
  if (children.length > 0) {

    let childlist = document.createElement('div');
    childlist.classList.add('children');
    let atLeastOneFamily = false;
    let atLeastOneChild = false;
    /**
     * @type {Individual}
     */
    for (let c of fam.getChildren()) {
      if (c.getFirstSubRecord('_PT_HIDDEN')) {
        continue;
      }
      atLeastOneChild = true;
      if (c.getFirstSubRecord('FAMS')) {
        atLeastOneFamily = true;
        let firstfam = c.getFamilies()[0];
        let famDiv = createFamily(firstfam);
        famDiv.querySelector('#' + getIndiId(c)).classList.add('famc');
        childlist.append(famDiv);
      } else {
        let i = createIndividual(c);
        i.classList.add('famc');
        childlist.append(i);
      }
    }
    if (atLeastOneChild) {
      content.classList.add('withChildren');

      if (!atLeastOneFamily) {
        childlist.classList.add('nopartners');
      }
      content.append(childlist);
    }
  }

  return content;
}

class PedigeePage{
  printGedviewFamily(fam, ged){
    updateFamily(fam);
  }
}

GedViews.setPage(new PedigeePage());

function updateFamily(fam) {
  //let id = evt.target.value;
  /**
   * @type Family
   */
  //const fam = window.treedata.ged.getFamily(id);
  console.log(fam);
  
  const content = document.createDocumentFragment();

  content.append(createFamily(fam));

  const bgimg = document.getElementById('bgimg').content.cloneNode(true);
  content.append(bgimg);

//  let h = document.createElement('h2');
//  h.textContent = 'Eltern';
//  content.append(h);

  const main = document.getElementById('content');
  main.replaceChildren(content);
  setTimeout(() => {
    const allFamsWithPartners =
            main.querySelectorAll('div.children:not(.nopartners)');
    for (const children of allFamsWithPartners) {
      console.debug('UPDATER', children);
      const fullwidth = children.clientWidth;
      let min = fullwidth / 2;
      let max = min;
      for (const famc of children.querySelectorAll('&>.famc')) {
        let offsetCenter = famc.offsetLeft + (famc.offsetWidth / 2);
        console.debug('UPDATER', famc, offsetCenter);
        if (offsetCenter < min)
          min = offsetCenter;
        if (offsetCenter > max)
          max = offsetCenter;
      }
      for (const famc of children.querySelectorAll('&>.family>.parents>.famc')) {
        //TODO: Das ist liefert aktuell nur den Wert innerhalb von "parents"!
        let offsetCenter = (famc.offsetWidth / 2) + 2;
        let current = famc;
        while (current.parentElement !== children) {
          offsetCenter += current.offsetLeft;
          current = current.parentElement;
        }
        console.debug('UPDATER', famc, offsetCenter);
        if (offsetCenter < min)
          min = offsetCenter;
        if (offsetCenter > max)
          max = offsetCenter;
      }
      console.log('UPDATER', fullwidth, min, max);
      children.style.setProperty('--leftstart', min + 'px');
      children.style.setProperty('--rightstart', (fullwidth - max) + 'px');
    }
  }, 0);
}



