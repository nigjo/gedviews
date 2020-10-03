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

/* global Individual, Family */

class GedEventsPage {
  printGedviewFamily(fam, ged) {
    var today = new Date();
    today.setHours(12);
    today.setMinutes(0);
    today.setSeconds(0);
    var lastWeeks = new Date(today.getTime());
    lastWeeks.setDate(lastWeeks.getDate() - 14);
    var nextWeeks = new Date(today.getTime());
    nextWeeks.setDate(nextWeeks.getDate() + 14);
    console.log(today, lastWeeks, nextWeeks);
    let events = {
      today: [],
      recent: [],
      next: [],
      marriages: [],
      deathdates: []
    };
    let indis = ged.getIndividuals();
    if (!indis) {
      return;
    }
    for (let indi of indis) {
      let bdateRec = indi.getPath(["BIRT", "DATE"]);
      let bdate = bdateRec ? bdateRec.getDayMonth() : false;
      let ddateRec = indi.getPath(["DEAT", "DATE"]);
      let ddate = ddateRec ? ddateRec.getDayMonth() : false;
      //console.log(indi.getIndiName(), bdate, ddate);
      if (bdate && !ddate) {
        if ((parseInt(bdateRec.getYear()) + 110) < today.getFullYear()) {
          continue;
        }
        if (bdate.getDate() === today.getDate()
                && bdate.getMonth() === today.getMonth()) {
          events.today.push(indi);
        } else if (bdate.getTime() >= lastWeeks.getTime()
                && bdate.getTime() < today.getTime()) {
          events.recent.push(indi);
        } else if (bdate.getTime() > today.getTime()
                && bdate.getTime() <= nextWeeks.getTime()) {
          events.next.push(indi);
        }
      }
      if (ddate) {
        if (ddate.getTime() >= lastWeeks.getTime()
                && ddate.getTime() <= nextWeeks.getTime()) {
          events.deathdates.push(indi);
        }
      }
      let marrdateRec = indi.getPath(["FAMS", "MARR", "DATE"]);
      if (marrdateRec) {
        let mdate = marrdateRec.getDayMonth();
        if (mdate && mdate.getTime() >= lastWeeks.getTime()
                && mdate.getTime() <= nextWeeks.getTime()) {
          let fam = indi.getFamily();
          if (events.marriages.indexOf(fam) < 0) {
            events.marriages.push(indi.getFamily());
          }
        }
      }
    }
    console.log(events);

    this.printEvents("today", events.today, ["BIRT", "DATE"]);
    this.printEvents("recent", events.recent, ["BIRT", "DATE"]);
    this.printEvents("next", events.next, ["BIRT", "DATE"]);
    this.printEvents("marriages", events.marriages, ["MARR", "DATE"]);
    this.printEvents("deathdates", events.deathdates, ["DEAT", "DATE"]);
  }
  printEvents(type, indis, path)
  {
    let div = document.getElementById(type);
    while (div.firstChild)
      div.firstChild.remove();
    if (indis.length > 0) {
      indis.sort((a, b) => {
        let delta = a.getPath(path).getDayMonth()
                - b.getPath(path).getDayMonth();
        if (delta === 0) {
          return a.getPath(path).getYear() - b.getPath(path).getYear();
        }
        return delta;
      });
      let list = div.appendChild(document.createElement("ul"));
      for (let indi of indis) {
        let item = list.appendChild(document.createElement("li"));
        item.classList.add("event");
        let date = item.appendChild(document.createElement("span"));
        date.classList.add("date");
        date.append(indi.getPath(path).toLocaleString());
        item.append(" ");
        if (indi instanceof Individual) {
          let name = item.appendChild(document.createElement("span"));
          name.classList.add("name");
          name.append(indi.getIndiName());
          if (indi.getFirstSubRecord("FAMS")) {
            let allFams = indi.getSubRecords("FAMS");
            for(let f=0;f<allFams.length;f++){
              let fam = allFams[f];
              item.append(" ");
              let link = item.appendChild(document.createElement("a"));
              link.classList.add("fams");
              link.href = "?" + fam.toLocaleString().replace(/@/g, '');
              link.title = "Familie";
              link.append("👫");
            }
          }
          if (indi.getFirstSubRecord("FAMC")) {
            item.append(" ");
            let link = item.appendChild(document.createElement("a"));
            link.classList.add("famc");
            link.href = "?" + indi.getFirstSubRecord("FAMC")
                    .toLocaleString().replace(/@/g, '');
            link.title = "Elternfamilie";
            link.append("🧒");
          }
        } else if (indi instanceof Family) {
          item.append(" ");
          let husb = indi.getHusband();
          let wife = indi.getWife();
          let fname = item.appendChild(document.createElement("span"));
          fname.classList.add("name");
          fname.appendChild(document.createElement("span"))
            .textContent = (husb ? husb.getIndiName() : "???");
          fname.append(" - ");
          fname.appendChild(document.createElement("span"))
            .textContent = (wife ? wife.getIndiName() : "???");
          item.append(" ");
          let link = item.appendChild(document.createElement("a"));
          link.classList.add("fams");
          link.href = "?" + indi.id.replace(/@/g, '');
          link.title = "Familie";
          link.append("👫");
        }
      }
    } else {
      div.append("keine Ereignisse");
    }
  }
}
window.gedviewPage = new GedEventsPage();
