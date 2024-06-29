class FamilyTable {
  /**
   * @param {Family} fam
   * @param {Gedcom} ged 
   */
  printGedviewFamily(fam, ged) {
    const tab = document.createElement('table');
    tab.class = "familytable";
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
    this.addFamily(body, fam);
    
    while(body.childElementCount<20){
      const row = document.createElement('tr');
      for (var i = 0; i < 8; i++) {
        let cell = document.createElement('td');
        row.append(cell);
      }
      row.children[0].textContent = body.children.length+1;
      body.append(row);
    }
    
    tab.append(body);

    document.getElementById('content').replaceChildren(tab);
  }

  /**
   * @param {Element} parent
   * @param {Individual} indi
   * @returns {Number} ID des Eintrags
   */
  addIndividual(parent, indi) {
    const row = document.createElement('tr');
    const id = parent.children.length + 1;

    const colId = document.createElement('td');
    colId.textContent = id;
    row.append(colId);

    const names = this.findNames(indi);
    console.debug(names);

    const colGivn = document.createElement('td');
    row.append(colGivn);
    const colSurn = document.createElement('td');
    row.append(colSurn);
    const colBirt = document.createElement('td');
    row.append(colBirt);
    if ("birth" in names) {
      colGivn.textContent = names.birth.givn;
      if ("married" in names){
        colSurn.textContent = names.married.surn;
        colBirt.textContent = names.birth.surn;
      }else{
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
    if (!husb)
      husb = this.addIndividual(parent, fam.getHusband());
    if (!wife)
      wife = this.addIndividual(parent, fam.getWife());

    if (wife && husb) {
      parent.children[husb - 1].children[7].textContent = wife;
      parent.children[wife - 1].children[7].textContent = husb;
    }

    let childFams = [];
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
      if (cfam) {
        let ch = cfam.getHusband() === child ? cId : null;
        let cw = cfam.getWife() === child ? cId : null;
        childFams.push(() => this.addFamily(parent, cfam, ch, cw));
      }
    }

    childFams.forEach(cb => cb());
  }
}

GedViews.setPage(new FamilyTable());