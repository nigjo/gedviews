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
/* global GedViews */

gvlocale.register("famview", null, {
  title: "Familienansicht",
  husb: "Vater",
  wife: "Mutter",
  granddad: "Großvater",
  granny: "Großmutter",
  num_child: "{0}. Kind",
  testtext: "Das {1}. Kind ({0})",
  born:"geboren",
  died:"gestorben"
});
gvlocale.register("famview", "en", {
  title: "Family Overview",
  husb: "Father",
  wife: "Mother",
  granddad: "Grandfather",
  granny: "Grandmother",
  num_child: "Child #{0}",
  born:"born",
  died:"died"
});

class FamilyView {

  static LOGGER = "FamilyView";

  getSurName(fam, type) {
    if (fam) {
      let surnRec = fam.getPath([type, "NAME", "SURN"]);
      if (surnRec)
        return surnRec.toLocaleString();
    }
    return "";
  }

  printGedviewFamily(fam) {
    console.log(FamilyView.LOGGER, fam);
    let h1 = document.body.querySelector("header>h1");
    let famtext =
            this.getSurName(fam, "HUSB")
            + " - " +
            this.getSurName(fam, "WIFE");
    if (famtext !== " - ") {
      h1.append(": ", famtext);
    }

    let main = document.body.querySelector("main");

    let husb = fam.getHusband();
    if (husb) {
      this.addIndi(husb, "parents", gvlocale.get("famview.husb"));
      let famc = husb.getParentFamily();
      if (famc) {
        this.addIndi(famc.getHusband(), "grandparents",
                gvlocale.get("famview.granddad"), true);
        this.addIndi(famc.getWife(), "grandparents",
                gvlocale.get("famview.granny"), true);
      } else {
        this.addIndi(false, "grandparents", gvlocale.get("famview.granddad"));
        this.addIndi(false, "grandparents", gvlocale.get("famview.granny"));
      }
    }
    let wife = fam.getWife();
    if (wife) {
      this.addIndi(wife, "parents", gvlocale.get("famview.wife"));
      let famc = wife.getParentFamily();
      if (famc) {
        this.addIndi(famc.getHusband(), "grandparents", gvlocale.get("famview.granddad"), true);
        this.addIndi(famc.getWife(), "grandparents", gvlocale.get("famview.granny"), true);
      } else {
        this.addIndi(false, "grandparents", gvlocale.get("famview.granddad"));
        this.addIndi(false, "grandparents", gvlocale.get("famview.granny"));
      }
    }

    let CHILs = fam.getChildren();
    for (let i = 0; i < CHILs.length; i++) {
      this.addIndi(CHILs[i], "children",
              gvlocale.get("famview.num_child", i + 1), true);
    }
  }

  addIndi(indi, container, title, findOwnFamily = false) {
    let div = document.getElementById("indi").content.cloneNode(true);
    document.getElementById(container).append(div);
    let child = document.getElementById(container).lastElementChild;
    child.querySelector("h2").append(title);
    if (indi) {
      let allPaths = child.querySelectorAll("span[data-gedpath]");
      for (var i = 0; i < allPaths.length; i++) {
        let path = allPaths[i].dataset.gedpath.split('-');
        let content = indi.getPath(path);
        if (content) {
          allPaths[i].append(content.toLocaleString());
        }
      }
      if (indi.getSubValue("FAMS", false)) {
        let allFams = indi.getFamilies();
        if (allFams.length === 1) {
          if (findOwnFamily) {
            child.classList.add("fams");
            let famid = allFams[0];
            child.addEventListener('click', function () {
              GedViews.switchFamily(famid);
              return false;
            });
          }
        } else {
          child.classList.add("fams");
          child.classList.add("moremarr");
          child.addEventListener('click', function () {
            GedViews.getPage().openFamSelector(indi, allFams);
            return false;
          });
        }
      }
    }
    return child;
  }

  openFamSelector(indi, allFams) {
    let popup = document.createElement("div");
    popup.classList.add("popup");
    let closer = popup.appendChild(document.createElement("div"));
    closer.classList.add("closer");
    closer.textContent = "X";
    closer.onclick = () => popup.remove();

    popup.appendChild(document.createElement("div"))
            .append("Bitte eine Familie wählen");

    for (let fam of allFams) {
      console.log(FamilyView.LOGGER, fam);
      let row = popup.appendChild(document.createElement("div"));
      row.classList.add("popuprow");
      let link = document.createElement("a");
      link.href = "?" + fam.id.replace(/@/g, "");
      link.append(
              (fam.getPath(["HUSB", "NAME"]) || "???").toLocaleString()
              + " - " +
              (fam.getPath(["WIFE", "NAME"]) || "???").toLocaleString());
      row.appendChild(link);
    }

    document.body.appendChild(popup);
  }

}

GedViews.setPage(new FamilyView());
