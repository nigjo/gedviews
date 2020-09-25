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

var TAB_TITLES = 15;
var TAB_DATES = 12;
var THICKLINE = '='.repeat(80);
var THINLINE = '-'.repeat(80);
var LINE = THINLINE;
var System = {
  out: {
    clear: function () {
      document.getElementById('console').innerHTML = '';
    },
    addPage() {
      var c = document.getElementById('console');
      c.appendChild(document.createElement('div'))
              .classList.add('page');
    },
    print: function (message) {
      var c = document.getElementById('console');
      if (c.lastElementChild) {
        c.lastElementChild.appendChild(document.createTextNode(message));
      } else {
        c.appendChild(document.createTextNode(message));
      }
    },
    println: function (message) {
      this.print((message ? message : '') + '\n');
    }
  }
};
function getIndiName(indi) {
  if (indi)
    return indi.getIndiName();
  return '';
}

function printGedviewFamily(viewfam, ged) {

  if (viewfam && viewfam.id) {
    document.querySelector('h1')
            .dataset['famid'] = viewfam.id;
  }

  System.out.clear();
  System.out.addPage();
  System.out.println(THICKLINE);
  printSpouceOfFamily(viewfam, "HUSB", "Ehemann", true);
  System.out.println(THICKLINE);
  printSpouceOfFamily(viewfam, "WIFE", "Ehefrau", false);
  System.out.println(THICKLINE);
  System.out.println();
  System.out.println(THINLINE);
  System.out.println("    | Kinder");
  System.out.println(THINLINE);
  var counter = 0;
  for (var child of viewfam.getChildren())
  {
    //Kinder-Infos
    if ((counter - 7) % 10 === 0)
    {
      System.out.addPage();
      System.out.println(LINE);
    }

    printChild(child, ++counter);
    System.out.println(LINE);
  }

  while (counter < 7)
  {
    printChild(new Individual("@NONE@"), ++counter);
    System.out.println(LINE);
  }
}

function printChild(child, num)
{
  System.out.print(' ' + num.toString().padStart(2, ' ') + ' | ');
  printFormatted(-TAB_TITLES, "Name: ");
  System.out.println(child.getIndiName());
  System.out.print("    | ");
  printDateAndPlace(child, "BIRT", "Geboren");
  System.out.print("  " + child.getSubValue("SEX", " ") + " | ");
  var fams = child.getReferencedFamily('FAMS');
  printDateAndPlace(fams, "MARR", "Verheiratet");
  System.out.print("    | ");
  printDateAndPlace(child, "DEAT", "Gestorben");
  System.out.print("    | ");
  printFormatted(-TAB_TITLES, "Ehepartner: ");
  if (fams) {
    var spouse = fams.getHusband();
    if (spouse === child)
      spouse = fams.getWife();
    if (spouse)
      System.out.print(spouse.getIndiName());
  }
  System.out.println();
}

function printDateAndPlace(husb, type, title)
{
  printFormatted(-TAB_TITLES, title + ": ");
  var typeref = husb ? husb.getFirstSubRecord(type) : false;
  var date = '';
  var place = '';
  if (typeref)
  {
    var daterec = typeref.getFirstSubRecord('DATE');
    if (daterec)
      date = daterec.toLocaleString();
    var placrec = typeref.getFirstSubRecord('PLAC');
    if (placrec)
      place = placrec.toLocaleString();
  }
  printFormatted(TAB_DATES, date);
  System.out.println(" in: " + place);
}

/**
 * @param {Family} f
 * @param {String} type 
 * @param {String} title
 * @param {Boolean} withMarriage
 */
function printSpouceOfFamily(f, type, title, withMarriage)
{
  var husb = type === 'HUSB' ? f.getHusband(type) : f.getWife(type);
  printFormatted(-TAB_TITLES, title + ": ");
  if (!husb) {
    husb = new Record();
  }
  let surn = '';
  var name = husb.getFirstSubRecord('NAME');
  if (name) {
    System.out.print(name.toLocaleString());
    let surnrec = husb.getPath(['NAME', 'SURN']);
    if (surnrec) {
      surn = surnrec.toLocaleString();
    }
  }
  document.getElementById('textfile').dataset[type.toLowerCase()] = surn;

  System.out.println('');
  System.out.println(THICKLINE);
  printDateAndPlace(husb, "BIRT", "Geboren");
  if (withMarriage)
  {
    var fams = husb.getReferencedFamily('FAMS');
    printDateAndPlace(fams, "MARR", "Verheiratet");
  }
  printDateAndPlace(husb, "DEAT", "Gestorben");
  var famc = husb.getReferencedFamily('FAMC');
  var famchusb = '';
  var famcwife = '';
  if (famc) {
    var ihusb = famc.getReferencedIndividual('HUSB');
    if (ihusb)
      famchusb = ihusb.getIndiName();
    var iwife = famc.getReferencedIndividual('WIFE');
    if (iwife)
      famcwife = iwife.getIndiName();
  }

  printFormatted(-TAB_TITLES, "Vater: ");
  System.out.println(famchusb);
  printFormatted(-TAB_TITLES, "Mutter: ");
  System.out.println(famcwife);
  //*/
}

/**
 * 
 * @param {int} size
 * @param {String} content
 * @returns {undefined}
 */
function printFormatted(size, content)
{
  var padSize = size < 0 ? -size : size;
  if (content.length < padSize)
  {
    var padding = ' '.repeat(padSize - content.length);
    if (size < 0)
    {
      System.out.print(padding);
    }
    System.out.print(content);
    if (size > 0)
    {
      System.out.print(padding);
    }
  } else
  {
    System.out.print(content);
  }
}

function updateData() {

  let famid = document.querySelector('h1').dataset['famid'];
  if (famid) {
    let link = document.getElementById('textfile');
    link.download =
            'familienbogen-' + famid.replace(/@/g, '')
            + '-'+link.dataset.husb
            + '-'+link.dataset.wife
            + '.txt';
  }

  let content = document.getElementById('console').textContent;
  if (content.length > 0) {
    let data = new Blob([content], {type: 'text/plain'});
    let dlfile = window.URL.createObjectURL(data);
    document.getElementById('textfile').href = dlfile;
  } else {
    document.getElementById('textfile').href = '';
  }
}