/* global GedViews */

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
class FamilyTreePoster {

  printGedviewFamily(fam) {
    console.log(fam);

    this.setNextFamily(fam, 2);

    this.printFamilyChildren(fam);

    let hname = fam.getPath(['HUSB', 'NAME', 'SURN']);
    let wname = fam.getPath(['WIFE', 'NAME', 'SURN']);
    if (hname && wname) {
      famname = hname.toLocaleString() + ' / ' + wname.toLocaleString();
    } else {
      famname = this.getFirstOf(fam, [
        ['HUSB', 'NAME', 'MARN'],
        ['WIFE', 'NAME', 'MARN'],
        ['CHIL', 'NAME', 'SURN'],
        ['HUSB', 'NAME', 'SURN'],
        ['HUSB', 'NAME'],
        ['WIFE', 'NAME', 'SURN'],
        ['WIFE', 'NAME']
      ])
    }
    var famname = famname ? famname : '';
    document.getElementById('famnam').innerHTML = '';
    let namespan = document.getElementById('famnam')
            .appendChild(document.createElement('span'));
    namespan.innerHTML = famname;
    namespan.style.display = 'inline-block';
    if (famname.length > 0) {
      adjustSpacing(namespan);
    }
  }

  printFamilyChild(div, indi) {
    this.appendLine(div, indi ? indi.getIndiName().replace(/\/.*\//, '') : '');
    this.appendLine(div, '⚹ ', this.getPathOrDefault(indi, ['BIRT', 'DATE'], ''));
    this.appendLine(div, '⚱ ', this.getPathOrDefault(indi, ['DEAT', 'DATE'], ''));
  }

  printFamilyChildren(fam) {
    var chils = fam.getChildren();
    if (chils.length === 0) {
      return;
    } else if (chils.length === 1) {
      var d = document.getElementById('atI1-1');
      this.printIndividuum(d, chils[0]);
    } else if (chils.length <= 3) {
      var d = document.getElementById('atI1-0');
      this.printIndividuum(d, chils[0]);
      d = document.getElementById('atI1-1');
      this.printIndividuum(d, chils[1]);
      if (chils.length > 2) {
        d = document.getElementById('atI1-2');
        this.printIndividuum(d, chils[2]);
      }
    } else {
      this.printTwoPerPanel(chils);
    }
  }

  /** @deprecated */
  printUpToNine(chils) {
    for (var i = 0; i < chils.length; i++) {
      var col = parseInt(i / 3);
      var d = document.getElementById('atI1-' + col);
      if (col > 2) {
        d.parentNode.style.display = 'block';
      }
      if (d) {
        var indi = chils[i];
        var n = indi.getIndiName();
        var nf = n.replace(/\/.*\//, '');
        this.appendLine(d, nf);
        var bdate = indi.getPath(['BIRT', 'DATE']);
        var ddate = indi.getPath(['DEAT', 'DATE']);
        if (ddate)
          this.appendLine(d, '⚱ ', ddate);
        else if (bdate)
          this.appendLine(d, '⚹ ', bdate);
        else
          this.appendLine(d, '');
      }
    }
  }

  printTwoPerPanel(chils) {
    var indi;
    var d = document.getElementById('atI1-0');
    d.innerHTML = '';
    this.printFamilyChild(d, chils[0]);
    this.printFamilyChild(d, chils[1]);
    var d = document.getElementById('atI1-1');
    d.innerHTML = '';
    this.printFamilyChild(d, chils[2]);
    this.printFamilyChild(d, chils[3]);
    var d = document.getElementById('atI1-2');
    d.innerHTML = '';
    if (chils.length > 4) {
      this.printFamilyChild(d, chils[4]);
    }
    if (chils.length > 5) {
      this.printFamilyChild(d, chils[5]);
    }
    if (chils.length > 6) {
      document.getElementById('smallLicense').style.display = 'block';
      let divid = 4;
      for (let i = 6; i < 12 && i < chils.length; i++) {
        let col = parseInt(i / 2);
        var d = document.getElementById('atI1-' + col);
        d.parentNode.style.display = 'block';
        this.printFamilyChild(d, chils[i]);
      }
    }
  }

  getFirstOf(fam, paths) {
    for (var path of paths) {
      var rec = fam.getPath(path);
      if (rec) {
        return rec.toLocaleString();
      }
    }
  }

  appendLine(div, prefix, record = null) {
    let span =
            div.appendChild(document.createElement('span'));
    span.appendChild(document.createTextNode(
            prefix + (record ? record.toLocaleString() : '')));
    span.classList.add('line');
    //if(record instanceof GedDate)
    //  span.classList.add('date');
  }

  getPathOrDefault(rec, path, defval) {
    if (rec) {
      var val = rec.getPath(path);
      if (val) {
        return val;
      }
    }
    return defval;
  }

  printIndividuum(div, indi) {
    div.innerHTML = '';
    this.appendLine(div, indi ? indi.getIndiName() : '');
    this.appendLine(div, '⚹ ', this.getPathOrDefault(indi, ['BIRT', 'DATE'], ''));
    this.appendLine(div, '⚱ ', this.getPathOrDefault(indi, ['DEAT', 'DATE'], ''));
    if (this.getPathOrDefault(indi, ['FAMS', 'HUSB'], '') === indi.id)
      this.appendLine(div, '⚭ ', this.getPathOrDefault(indi, ['FAMS', 'MARR', 'DATE'], ''));
  }

  setNextFamily(fam, index) {
    var fh = fam ? fam.getHusband() : false;
    var fw = fam ? fam.getWife() : false;

    var hDiv = 'atI' + (index).toString();
    var husb = document.getElementById(hDiv);
    this.printIndividuum(husb, fh);
    var wife = document.getElementById('atI' + (index + 1));
    this.printIndividuum(wife, fw);

    if (index <= 15) {
      this.setNextFamily(fh ? fh.getParentFamily() : null, index * 2);
      this.setNextFamily(fw ? fw.getParentFamily() : null, (index + 1) * 2);
    }
  }
}

GedViews.setPage(new FamilyTreePoster());