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

class StammBaum {
  printGedviewFamily(fam, ged) {
    let main = document.querySelector("main");
    while (main.firstChild)
      main.firstChild.remove();
    //fam.getChildren();
    this.addGeneration(main, fam, 2);
  }

  setVal(indi, path) {
    if (indi) {
      let val = indi.getPath(path);
      if (val) {
        return val.toLocaleString();
      }
    }
    return "";
  }

  addIndi(parentDiv, indi, num) {
    let husb = parentDiv.appendChild(document.createElement("div"));
    husb.classList.add("generation");
    //husb.id = "indi" + num;
    let data = husb.appendChild(document.createElement("div"));
    data.dataset.num = num;
    data.classList.add("indi");
    data.appendChild(document.createElement("div"))
            .append(indi ? indi.getIndiName() : "");
    data.appendChild(document.createElement("div"))
            .append("G:", this.setVal(indi, ["BIRT", "DATE"]), "\n");
    if (num < 16) {
      data.appendChild(document.createElement("div"))
              .append("O:", this.setVal(indi, ["BIRT", "PLAC"]), "\n");
    }
    if (num % 2 === 0) {
      data.appendChild(document.createElement("div"))
              .append("H:", this.setVal(indi, ["FAMS", "MARR", "DATE"]), "\n");
      if (num < 16) {
        data.appendChild(document.createElement("div"))
                .append("O:", this.setVal(indi, ["FAMS", "MARR", "PLAC"]), "\n");
      }
    }
    data.appendChild(document.createElement("div"))
            .append("T:", this.setVal(indi, ["DEAT", "DATE"]), "\n");
    if (num < 16) {
      data.appendChild(document.createElement("div"))
              .append("O:", this.setVal(indi, ["DEAT", "PLAC"]), "\n");
    }
    this.addGeneration(husb, indi ? indi.getParentFamily() : false, num * 2);
    return husb;
  }

  addGeneration(parentDiv, fam, husbNum) {
    if (husbNum > 31)
      return;
    this.addIndi(parentDiv, fam ? fam.getHusband() : false, husbNum)
            .classList.add("husb");
    this.addIndi(parentDiv, fam ? fam.getWife() : false, husbNum + 1)
            .classList.add("wife");
  }
}

GedViews.setPage(new StammBaum());
