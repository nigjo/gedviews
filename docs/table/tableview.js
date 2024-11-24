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
import {GedViews} from '../gedviews.js';

class FamilyTable {

  constructor() {
    this.visited = [];
  }

  /**
   * @param {Family} fam
   * @param {Gedcom} ged 
   */
  printGedviewFamily(fam, ged) {
    const result = document.createDocumentFragment();
    const tab = document.createElement('table');
    result.append(tab);
    tab.class = "familytable";
    tab.id = "fam" + fam.id;
    console.debug('TABLE', fam);
    const head = document.createElement('thead');
    const row = document.createElement('tr');
    const addHead = (caption, width) => {
      let cell = document.createElement('th');
      cell.textContent = caption;
      cell.style.minWidth = width + 'em';
      row.append(cell);
    };

    addHead('#', 2);
    addHead('Vorname', 10);
    addHead('Nachname', 10);
    addHead('Geburtsname', 10);
    addHead('Geburt', 6);
    addHead('Tod', 6);
    addHead('Kind von', 4);
    addHead('Partner', 4);
    head.append(row);
    tab.append(head);

    const body = document.createElement('tbody');
    this.visited = [];
    this.addFamily(body, fam);

    while (body.childElementCount % 22 > 0
            && body.childElementCount % 40 > 0) {
      const row = document.createElement('tr');
      for (var i = 0; i < 8; i++) {
        let cell = document.createElement('td');
        row.append(cell);
      }
      row.children[0].textContent = body.children.length + 1;
      body.append(row);
    }

    tab.append(body);

    /** @type Record */
    const gData = ged.root.getPath(["HEAD", "DATA"]);
    console.debug("DATA", gData);
    if (gData) {
      let footer = document.querySelector('footer');
      if (!footer) {
        footer = document.createElement('footer');
        document.body.append(footer);
      }
      // Info von HEAD.DATA eintragen falls vorhanden.
      footer.append('Datenquelle: ');
      if (gData.value.startsWith('http')) {
        const link = document.createElement('a');
        link.textContent = gData.value;
        link.href = gData.value;
        footer.append(link);
      } else {
        footer.append(gData.value);
      }
    }

    // Info aus SUBM unter die Tabelle
    const gSubm = ged.root.getPath(["HEAD", "SUBM", "NAME"]);
    console.debug("SUBM", gSubm);
    if (gSubm) {
      let footer = document.querySelector('footer');
      if (!footer) {
        footer = document.createElement('footer');
        document.body.append(footer);
      } else {
        footer.append(', ');
      }

      footer.append('Contact: ');
      const mail = gSubm.parent.getFirstSubRecord('EMAIL');
      console.debug("MAIL", mail);
      if (mail) {
        const link = document.createElement('a');
        link.textContent = gSubm.value + ' <'+mail.value+'>';
        link.href = 'mailto:' + mail.value;
        footer.append(link);
      } else {
        footer.append(gSubm.value);
      }
    }

    document.getElementById('content').replaceChildren(result);
  }

  /**
   * @param {Element} parent
   * @param {Individual} indi
   * @returns {Number} ID des Eintrags
   */
  addIndividual(parent, indi) {
    if (!indi) {
      return false;
    }
    const row = document.createElement('tr');
    const id = parent.children.length + 1;

    const colId = document.createElement('td');
    colId.textContent = id;
    row.append(colId);

    const names = this.findNames(indi);
    //console.debug(names);

    const colGivn = document.createElement('td');
    row.append(colGivn);
    const colSurn = document.createElement('td');
    row.append(colSurn);
    const colBirt = document.createElement('td');
    row.append(colBirt);
    if ("birth" in names) {
      colGivn.textContent = names.birth.givn;
      if ("married" in names) {
        colSurn.textContent = names.married.surn;
        colBirt.textContent = names.birth.surn;
      } else {
        colSurn.textContent = names.birth.surn;
      }
    }

    const getDateString = (indi, rec) => {
      const birt = indi.getPath([rec, 'DATE']);
      if (birt) {
        return birt.toLocaleString();
      }
      return '';
    };

    const colDBirt = document.createElement('td');
    colDBirt.textContent = getDateString(indi, "BIRT");
    row.append(colDBirt);
    const colDDeat = document.createElement('td');
    colDDeat.textContent = getDateString(indi, "DEAT");
    row.append(colDDeat);

    const colChildOf = document.createElement('td');
    //colChildOf.textContent = getDateString(indi,"DEAT");
    row.append(colChildOf);

    const colPartner = document.createElement('td');
    //colPartner.textContent = getDateString(indi,"DEAT");
    row.append(colPartner);

    parent.append(row);
    return id;
  }

  /**
   * 
   * @param {Individual} indi
   */
  findNames(indi) {
    let nameRecs = indi.getSubRecords('NAME');
    const names = {};
    /**
     * @type Record
     */
    for (var item of nameRecs) {
      const typeRec = item.getFirstSubRecord('TYPE');
      const nameParts = item.value.match(/(.*?) \/(.*?)\//);
      if (typeRec) {
        names[typeRec.value.toLowerCase()] = {
          givn: item.getSubValue('GIVN', nameParts ? nameParts[1] : '?'),
          surn: item.getSubValue('SURN', nameParts ? nameParts[2] : '?')
        };
      } else {
        names[0] = {
          givn: item.getSubValue('GIVN', nameParts ? nameParts[1] : '?'),
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

    return names;
  }

  /**
   * @param {Element} parent
   * @param {Family} fam
   * @param {Number} husb
   * @param {Number} wife
   */
  addFamily(parent, fam, husb, wife) {
    if (this.visited.includes(fam.id)) {
      return;
    }
    this.visited.push(fam.id);

    if (!husb)
      husb = this.addIndividual(parent, fam.getHusband());
    if (!wife)
      wife = this.addIndividual(parent, fam.getWife());

    if (wife && husb) {
      const addPartner = (rowId, partnerId) => {
        const cell = parent.children[rowId - 1].children[7];
        if (cell.textContent) {
          cell.textContent += ',' + partnerId;
        } else
          cell.textContent = partnerId;
      };
      addPartner(husb, wife);
      addPartner(wife, husb);
    }

    let moreFamilies = [];
    /**
     * @type Idividual
     */
    for (var child of fam.getChildren()) {
      let cId = this.addIndividual(parent, child);
      if (wife && husb) {
        parent.children[cId - 1].children[6].textContent = husb + '+' + wife;
      } else if (wife) {
        parent.children[cId - 1].children[6].textContent = wife;
      } else if (husb) {
        parent.children[cId - 1].children[6].textContent = husb;
      }
      let cfam = child.getFamily();
      if (cfam && !this.visited.includes(cfam.id)) {
        let ch = cfam.getHusband() === child ? cId : null;
        let cw = cfam.getWife() === child ? cId : null;
        moreFamilies.push(() => this.addFamily(parent, cfam, ch, cw));
      }
    }

    if (husb) {
      const h = fam.getHusband();
      for (const myfam of h.getFamilies()) {
        if (!this.visited.includes(myfam.id)) {
          console.log(h.getIndiName(), myfam.id);
          moreFamilies.push(() => this.addFamily(parent, myfam, husb, null));
        }
      }
    }
    if (wife) {
      const w = fam.getWife();
      for (const myfam of w.getFamilies()) {
        if (!this.visited.includes(myfam.id)) {
          console.log(w.getIndiName(), myfam.id);
          moreFamilies.push(() => this.addFamily(parent, myfam, null, wife));
        }
      }
    }

    moreFamilies.forEach(cb => cb());
  }
}

GedViews.setPage(new FamilyTable());