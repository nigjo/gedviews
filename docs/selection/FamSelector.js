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
class FamSelector {

  static LOGGER = "FamSelector";

  getListOption(fam, type) {
    let indi = fam.getPath([type]);
    return this.getIndiOption(fam, indi, type);
  }

  getIndiOption(fam, indi, type) {
    //let listoption = document.createElement("option");
    //listoption.value = fam.id + "-" + type.toLowerCase();
    let description = indi.getPath(["NAME"]).toLocaleString()
            .replace(/\//g, '').trim();
    let bdate = indi.getPath(["BIRT", "DATE"]);
    let ddate = indi.getPath(["DEAT", "DATE"]);
    if (bdate && !ddate) {
      description += ", *";
      description += bdate.getYear();
    } else if (!bdate && ddate) {
      description += ", +";
      description += ddate.getYear();
    } else if (bdate && ddate) {
      description += ", ";
      description += bdate.getYear();
      description += "-";
      description += ddate.getYear();
    }
    return {
      value: fam.id + "-" + type.toLowerCase(),
      text: description
    };
  }

  printGedviewFamily(fam, ged) {
    console.log(fam);
    let oldselect = document.getElementById("families");
    let select = document.createElement(oldselect.tagName);
    select.id = oldselect.id;

    let oldnames = document.getElementById("names");
    let names = document.createElement(oldnames.tagName);
    names.id = oldnames.id;

    let list = this.collectFamilies(ged);
    console.log(FamSelector.LOGGER, list.length, "Families");
    if (list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        let option = document.createElement("div");
        option.classList.add("family");
        option.dataset['famid'] = list[i].id;
        if (list[i].id === fam.id) {
          option.classList.add("selected");
        }
        option.onclick = function (evt) {
          sessionStorage.setItem('gedviewer.selection.scolltop',
                  document.querySelector(".famcontainer").scrollTop);
          switchFamily(evt.currentTarget);
          return false;
        };

        let husbspan = document.createElement("span");
        husbspan.append(list[i].husb);
        husbspan.classList.add("indiname");
        husbspan.classList.add("husb");
        option.append(husbspan);

        option.append(" - ");

        let wifespan = document.createElement("span");
        wifespan.append(list[i].wife);
        wifespan.classList.add("indiname");
        wifespan.classList.add("wife");
        option.append(wifespan);

        select.append(option);

        for (let value in list[i].names) {
          let listoption = document.createElement("option");
          listoption.value = value;
          listoption.append(list[i].names[value]);
          names.append(listoption);
        }
      }
    }

    oldselect.parentNode.replaceChild(select, oldselect);
    oldnames.parentNode.replaceChild(names, oldnames);

    if (list.length > 0) {
      let sel = document.querySelector("div.selected");
      if (sel) {
        let top = sessionStorage.getItem('gedviewer.selection.scolltop');
        if (top) {
          document.querySelector(".famcontainer").scrollTop = top;
        } else {
          sel.scrollIntoView();
        }
      }
    }
  }

  collectFamilies(ged) {
    //console.log(fam, ged);
    let storedhash = window.sessionStorage.getItem("gedviewer.selection.hash");
    if (storedhash && ged.hash === storedhash) {
      let list = window.sessionStorage.getItem("gedviewer.selection.list");
      if (list) {
        console.log(FamSelector.LOGGER, "using stored list");
        return JSON.parse(list);
      }
    }

    let storageData = [];

    let allfams = ged.getFamilies();
    if (allfams.length > 0) {
      //var listoption;
      for (var i = 0; i < allfams.length; i++) {
        //ID
        let item = {
          id: allfams[i].id,
          husb: null,
          wife: null,
          names: {}
        };
        storageData.push(item);

        if (allfams[i].getHusband()) {
          item.husb = allfams[i].getPath(["HUSB", "NAME"]).toLocaleString();
          let listoption = this.getIndiOption(allfams[i], allfams[i].getHusband(), "Father");
          item.names[listoption.value] = listoption.text;
        } else {
          item.husb = '???';
        }

        if (allfams[i].getWife()) {
          //let wifespan = document.createElement("span");
          item.wife = allfams[i].getPath(["WIFE", "NAME"]).toLocaleString();
          let listoption = this.getIndiOption(allfams[i], allfams[i].getWife(), "Mother");
          item.names[listoption.value] = listoption.text;
        } else {
          item.wife = '???';
        }

        let children = allfams[i].getChildren();
        for (let c = 0; c < children.length; c++) {
          let listoption = this.getIndiOption(allfams[i], children[c], "Child");
          item.names[listoption.value + c] = listoption.text;
        }
      }
      //select.value = fam.id;
    }

    window.sessionStorage.setItem("gedviewer.selection.list", JSON.stringify(storageData));
    window.sessionStorage.setItem("gedviewer.selection.hash", ged.hash);

    return storageData;
  }
}
