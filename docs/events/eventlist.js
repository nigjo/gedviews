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
          events.today.push({type: 'BIRT', rec: indi});
        } else if (bdate.getTime() >= lastWeeks.getTime()
                && bdate.getTime() < today.getTime()) {
          events.recent.push(indi);
        } else if (bdate.getTime() > today.getTime()
                && bdate.getTime() <= nextWeeks.getTime()) {
          events.next.push(indi);
        }
      }
      if (ddate) {
        if (ddate.getDate() === today.getDate()
                && ddate.getMonth() === today.getMonth()) {
          events.today.push({type: 'DEAT', rec: indi});
        } else if (ddate.getTime() >= lastWeeks.getTime()
                && ddate.getTime() <= nextWeeks.getTime()) {
          events.deathdates.push(indi);
        }
      }
      let marrdateRec = indi.getPath(["FAMS", "MARR", "DATE"]);
      if (marrdateRec) {
        let mdate = marrdateRec.getDayMonth();
        if (mdate) {
          if (mdate.getDate() === today.getDate()
                  && mdate.getMonth() === today.getMonth()) {
            events.today.push({type: 'MARR', rec: indi.getFamily()});
          } else if (mdate.getTime() >= lastWeeks.getTime()
                  && mdate.getTime() <= nextWeeks.getTime()) {
            let fam = indi.getFamily();
            if (events.marriages.indexOf(fam) < 0) {
              events.marriages.push(indi.getFamily());
            }
          }
        }
      }
    }
    console.log(events);

    this.printTodayEvents("today", events.today, true);
    this.printEvents("recent", events.recent, ["BIRT", "DATE"]);
    this.printEvents("next", events.next, ["BIRT", "DATE"]);
    this.printEvents("marriages", events.marriages, ["MARR", "DATE"]);
    this.printEvents("deathdates", events.deathdates, ["DEAT", "DATE"]);
  }
  printTodayEvents(groupid, items, showType = false)
  {
    let div = document.getElementById(groupid);
    while (div.firstChild)
      div.firstChild.remove();
    if (items.length > 0) {
      let knownIDs=[];
      items = items.filter(item=>{
        if(knownIDs.indexOf(item.rec.id)<0){
          knownIDs.push(item.rec.id);
          return true;
        }
        return false;
      });
      items.sort((item1, item2) => {
        let delta = item1.rec.getPath([item1.type, "DATE"]).getDayMonth()
                - item2.rec.getPath([item2.type, "DATE"]).getDayMonth();
        if (delta === 0) {
          return item1.rec.getPath([item1.type, "DATE"]).getYear()
                  - item2.rec.getPath([item2.type, "DATE"]).getYear();
        }
        return delta;
      });

      let list = div.appendChild(document.createElement("ul"));
      for (let item of items) {
        let listItem = list.appendChild(document.createElement("li"));
        listItem.classList.add("event");
        let date = listItem.appendChild(document.createElement("span"));
        date.classList.add("date");
        date.append(item.rec.getPath([item.type, "DATE"]).toLocaleString());
        listItem.append(" ");
        if (showType) {
          let type = listItem.appendChild(document.createElement("span"));
          switch(item.type){
            case "BIRT":type.append("⚹");break;
            case "DEAT":type.append("⚱");break;
            case "MARR":type.append("⚭");break;
            default:type.append("?");break;
          }
                  //.append(item.type);
          listItem.append(" ");
        }
        if (item.rec instanceof Individual) {
          let indi = item.rec;
          let name = listItem.appendChild(document.createElement("span"));
          name.classList.add("name");
          name.append(indi.getIndiName());
          if (indi.getFirstSubRecord("FAMS")) {
            let allFams = indi.getSubRecords("FAMS");
            for (let f = 0; f < allFams.length; f++) {
              let fam = allFams[f];
              listItem.append(" ");
              let link = listItem.appendChild(document.createElement("a"));
              link.classList.add("fams");
              link.href = "?" + fam.toLocaleString().replace(/@/g, '');
              link.title = "Familie";
              link.append("👫");
            }
          }
          if (indi.getFirstSubRecord("FAMC")) {
            listItem.append(" ");
            let link = listItem.appendChild(document.createElement("a"));
            link.classList.add("famc");
            link.href = "?" + indi.getFirstSubRecord("FAMC")
                    .toLocaleString().replace(/@/g, '');
            link.title = "Elternfamilie";
            link.append("🧒");
          }
        } else if (item.rec instanceof Family) {
          let fam = item.rec;
          listItem.append(" ");
          let husb = fam.getHusband();
          let wife = fam.getWife();
          let fname = listItem.appendChild(document.createElement("span"));
          fname.classList.add("name");
          fname.appendChild(document.createElement("span"))
                  .textContent = (husb ? husb.getIndiName() : "???");
          fname.append(" - ");
          fname.appendChild(document.createElement("span"))
                  .textContent = (wife ? wife.getIndiName() : "???");
          listItem.append(" ");
          let link = listItem.appendChild(document.createElement("a"));
          link.classList.add("fams");
          link.href = "?" + fam.id.replace(/@/g, '');
          link.title = "Familie";
          link.append("👫");
        }
      }
    } else {
      div.append("keine Ereignisse");
  }
  }
  printEvents(type, indis, path)
  {
    if (indis.length > 0) {
      let items = [];
      for (let indi of indis) {
        items.push({rec: indi, type: path[0]});
      }
      this.printTodayEvents(type, items);
    } else {
      this.printTodayEvents(type, []);
    }
  }
}

GedViews.setPage(new GedEventsPage());
