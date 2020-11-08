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

class FamilyBookPage {

  applyAttributes(copy, viewdata) {
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

  removeAttribute(copy, attrkey) {
    //ES2020: copy.querySelector('.gedview-attr[data-key="'+attrkey+'"]')?.remove();
    //ES6:
    var attr = copy.querySelector('*[data-key="' + attrkey + '"]');
    if (attr) {
      attr.remove();
    }
  }

  getCleanId(idvalue) {
    //ES2020:return idvalue?.replace(/@/g,'');
    if (idvalue) {
      return idvalue.replace(/@/g, '');
    }
    return idvalue;
  }

  createParent(indi2, type, caption, hints) {
    var copy = this.getTemplate('gedview-parent');
    copy.firstElementChild.setAttribute('data-type', type);
    if (type !== 'wife') {
      this.removeAttribute(copy, 'fams-marr-date');
      this.removeAttribute(copy, 'fams-marr-plac');
    }
    var viewdata = this.flattenIndividual(indi2);
    //console.log(viewdata);
    if (!viewdata['hints']) {
      viewdata['hints'] = {
        name: this.getCleanId(indi2.id),
        'famc-wife-name': this.getCleanId(viewdata['famc'])
      };
    }

    this.applyAttributes(copy, viewdata);

    var acaption = copy.querySelector('*[data-key="name"]>.attrCaption');
    acaption.textContent = caption + ': ';

    return copy;
  }

  getTemplate(templatename) {
    var template = document.getElementById(templatename);
    return template.content.cloneNode(true);
  }

  createChild(indi, num) {
    var copy = this.getTemplate('gedview-child');
    var viewdata = this.flattenIndividual(indi);
    console.log(viewdata);
    if (!viewdata['hints']) {
      viewdata['hints'] = {
        sex: this.getCleanId(indi.id),
        'fams-spou-name': this.getCleanId(viewdata['fams'])
      };
      if ("fams" in viewdata) {
        this.findMarriages(indi, viewdata['fams']);
      }
    }

    copy.firstElementChild.setAttribute('data-num', num);

    this.applyAttributes(copy, viewdata);

    var acaption = copy.querySelector('*[data-key="name"]>.attrCaption');
    acaption.textContent = num + '. Kind: ';

    return copy;
  }

  //this was before rec.getPath() exists.
  flattenRecord(rec, result = {}, prefix = '') {
    if (rec.children) {
      for (var sub of rec.children) {
        var key = prefix + sub.tag.toLowerCase();
        if (result.hasOwnProperty(key)) {
          continue;
        }
        if (sub.value) {
          result[key] = sub.toLocaleString();
        }
        this.flattenRecord(sub, result, key + '-');
      }
    }
    return result;
  }

  //this was before rec.getPath() exists.
  flattenIndividual(indi) {
    var result = this.flattenRecord(indi, {});
    if (result['fams']) {
      this.flattenRecord(indi.getFamily(), result, 'fams-');
      if (result['fams-husb'] === indi.id) {
        if (result['fams-wife'])
          this.flattenRecord(indi.getFamily().getWife(), result, 'fams-spou-');
      } else if (result['fams-wife'] === indi.id) {
        if (result['fams-husb'])
          this.flattenRecord(indi.getFamily().getHusband(), result, 'fams-spou-');
      } else {
        if (result['fams-husb'])
          this.flattenRecord(indi.getFamily().getHusband(), result, 'fams-husb-');
        if (result['fams-wife'])
          this.flattenRecord(indi.getFamily().getWife(), result, 'fams-wife-');
      }
    }
    if (result['famc']) {
      this.flattenRecord(indi.getParentFamily(), result, 'famc-');
      if (result['famc-husb'])
        this.flattenRecord(indi.getParentFamily().getHusband(), result, 'famc-husb-');
      if (result['famc-wife'])
        this.flattenRecord(indi.getParentFamily().getWife(), result, 'famc-wife-');
    }
    return result;
  }

  printChildrenOfFam(page, children, offset, max) {
    var counter = offset - 1;
    var index = 0;
    if (children) {
      for (var child of children) {
        if (++index < offset)
          continue;
        ++counter;
        //console.log(cid);
        page.appendChild(this.createChild(child, counter));
        if (counter >= max) {
          break;
        }
      }
    }
    while (++counter < max) {
      page.appendChild(this.createChild(new Individual(), counter));
    }
    return counter;
  }

  printFamily(fam) {
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
      page.setAttribute('data-famid', this.getCleanId(fam.id));
    }

    this.moreInformations = [];

    parentdiv.appendChild(this.createParent(fam.getHusband(),
            'husb', 'Ehemann'));
    this.findMarriages(fam.getHusband(), fam.id);
    parentdiv.appendChild(this.createParent(fam.getWife(),
            'wife', 'Ehefrau'));
    this.findMarriages(fam.getWife(), fam.id);

    var childdiv = page.appendChild(document.createElement('div'));
    var children = fam.getChildren();
    var pagemax = 3;
    var next = this.printChildrenOfFam(childdiv, children, 1, pagemax);
    if (children && children.length >= pagemax) {
      var maxChildren = children.length;
      var pagenum = 2;
      console.log(maxChildren);
      while (next === pagemax + 1) {
        var nextpage = main.appendChild(document.createElement('div'));
        nextpage.classList.add('gedview-page');
        nextpage.setAttribute('data-num', pagenum++);
        nextpage.setAttribute('data-famid', (fam && fam.id) ? this.getCleanId(fam.id) : '');
        pagemax = next + 4;
        next = this.printChildrenOfFam(nextpage, children, next, pagemax);
      }
    } else {
      while (next <= pagemax) {
        childdiv.appendChild(this.createChild(new Individual(), next++));
      }

      var nextpage = main.appendChild(document.createElement('div'));
      nextpage.classList.add('gedview-page');
      nextpage.setAttribute('data-num', 2);
      nextpage.setAttribute('data-famid', (fam && fam.id) ? this.getCleanId(fam.id) : '');
      this.printChildrenOfFam(nextpage, null, next, next + 4);
    }
    var notediv = page.parentElement.lastElementChild
            .appendChild(document.createElement('div'));
    notediv.classList.add('gedview-attr');
    notediv.classList.add('note');
    var caption = notediv.appendChild(document.createElement('span'));
    caption.classList.add('attrCaption');
    caption.append('Sonstige Informationen:');
    for (let entry of this.moreInformations) {
      let line = notediv.appendChild(document.createElement("p"));
      if ("fam" in entry) {
        let link = line.appendChild(document.createElement("a"));
        link.href = "?" + entry.fam.replace(/@/g, "");
        link.append(entry.text);
      } else {
        line.append(entry.text);
      }
    }
  }

  findMarriages(indi, thisFam) {
    if (indi) {
      for (let fam of indi.getFamilies()) {
        if (fam.id !== thisFam) {
          let item = {indi: indi.id, fam: fam.id,
            text: indi.id + " hat eine weitere Familie " + fam.id};
          if (fam.getHusband() === indi) {
            item.text = indi.getIndiName() + " hat eine weitere Familie mit "
                    + fam.getWife().getIndiName();
          } else if (fam.getWife() === indi) {
            item.text = indi.getIndiName() + " hat eine weitere Familie mit "
                    + fam.getHusband().getIndiName();
          }

          this.moreInformations.push(item);
        }
      }
    }
  }

  printGedviewFamily(fam, ged) {

    var titledata = this.flattenRecord(fam);
    if (titledata['husb'])
      this.flattenRecord(fam.getHusband(), titledata, 'husb-');
    else
      titledata['husb-name'] = '_'.repeat(20);
    if (titledata['wife'])
      this.flattenRecord(fam.getWife(), titledata, 'wife-');
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
            .dataset['famid'] = this.getCleanId(fam.id);

    var titlepage = this.getTemplate('gedview-title');
    this.applyAttributes(titlepage, titledata);
    if (fam && fam.id) {
      titlepage.firstElementChild.setAttribute('data-famid', this.getCleanId(fam.id));
    }
    main.appendChild(titlepage);

    this.printFamily(fam);
  }
}

GedViews.setPage(new FamilyBookPage());