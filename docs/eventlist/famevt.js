console.log("Hallo");
let events = null;
const loader = fetch('events.json').then(r => {
  if (r.ok)
    return r.json();
  throw r;
}).then(data => {
  console.debug(data);
  events = data;
  return data;
});

class FamilyEvents {
  printGedviewFamily(fam, ged) {
    //document.body.append(fam.id);
    console.log("update");

    this.visited = [];
    this.indis = new Map();
    console.log(events);
    if (!events) {
      loader.then(() => this.addFamily(fam));
    } else
      this.addFamily(fam);
  }

  addFamily(fam) {
    if (!fam)
      return;
    if (this.visited.includes(fam.id))
      return;
    this.visited.push(fam.id);
    const hid = this.#register(fam.getHusband());
    const wid = this.#register(fam.getWife());
    fam.getChildren().forEach(c => this.#register(c));
    console.debug(fam.id, hid, wid);
    /** @type Record */
    for (var rec of fam.children) {
      let recdate = rec.getFirstSubRecord("DATE");
      if (recdate && rec.tag !== 'CHAN') {
        //document.body.append(document.createElement("br"));
        let eventname;
        if (rec.tag in events)
          eventname=events[rec.tag];
        else
          eventname=rec.tag;
        //document.body.append(eventname);
        let row = document.createElement("tr");
        let cellEvt = document.createElement("td");
        cellEvt.textContent = eventname;
        row.append(cellEvt);
        let cellDate = document.createElement("td");
        cellDate.textContent = recdate.toLocaleString();
        row.append(cellDate);
        let cellIndis = document.createElement("td");
        let list = '?';
        if (hid > 0) {
          list = hid;
          if (wid > 0) {
            list += '+' + wid;
          }
        } else if (wid > 0)
          list = wid;
        cellIndis.textContent = list;
        row.append(cellIndis);
        let cellPlace = document.createElement("td");
        cellPlace.className = 'place';
        let plac = rec.getFirstSubRecord("PLAC");
        if(plac){
          cellPlace.textContent = plac.value;
        }
        row.append(cellPlace);

        document.getElementById('events').append(row);
      }
    }

    fam.getChildren().forEach(c => this.addFamily(c.getFamily()));
  }

  #register(indi) {
    if (!indi)
      return -1;
    console.debug('INDI', indi.id, this.indis.size + 1);
    if (!this.indis.has(indi.id)) {
      this.indis.set(indi.id, this.indis.size + 1);
    }
    return this.indis.get(indi.id);
  }

  #getNum(indi) {
    if (!indi)
      return -1;
    if (!this.indis.has(indi.id)) {
      return -1;
    }
    return this.indis.get(indi.id);
  }
}

GedViews.setPage(new FamilyEvents());