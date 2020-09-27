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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./viewworker.js')
          .then((reg) => {
            // registration worked
            console.log('Registration succeeded. Scope is ' + reg.scope);
          }).catch((error) => {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}

class IndexPage {
  constructor(){
    this.self = this;
  }

  getIndiName(indi) {
    if (indi)
      return indi.getIndiName();
    return '';
  }
  printGedviewFamily(viewfam, ged) {
    var allFams = ged.getFamilies();
    var selector = document.getElementById('families');
    while (selector.firstChild) {
      selector.firstChild.remove();
    }
    var selfam;
    for (var fam of allFams) {
      var option = selector.appendChild(document.createElement('option'));
      //option.id = 'famselection';
      option.value = fam.id;
      option.innerHTML = "<span class='fname'>" +
              this.getIndiName(fam.getHusband()) + "</span> - <span class='fname'>"
              + this.getIndiName(fam.getWife()) + "</span>";
      if (fam === viewfam) {
        selfam = option;
      }
    }
    if (selfam)
      selfam.selected = true;
    else
      document.querySelector('#view').src = 'welcome.html';
  }
  updateFamily(event) {
    this.updateView(event.target.href);
    document.getElementById('menuview').checked = false;
    return false;
  }
  updateView(targetLocation) {
    let fam = document.querySelector('#viewselect').dataset.famid;
    let nextLoc = targetLocation.replace(/\?.*/, '')
            + '?' + (fam ? fam : '');
    if (nextLoc !== document.querySelector('#view').contentWindow.location.href) {
      document.querySelector('#view').src = nextLoc;
    }
    //console.log(event.target);
    return false;
  }
  updateSelection(evt) {
    let subloc = evt.target.contentWindow.location;
    console.log(evt.target.contentWindow.location);
    console.log(subloc.search);
    if (subloc.search) {
      let famid = '@' + subloc.search.substring(1) + '@';
      document.getElementById('families')
              .value = famid;
      var event = document.createEvent("HTMLEvents");
      event.initEvent("change", true, false);
      document.getElementById('families').dispatchEvent(event);
    }
  }
  handleDragging(event) {
    event.preventDefault();
    if (event.target && event.target.classList) {
      if (event.type === 'dragover') {
        event.target.classList.add("targeted");
        let dt = event.dataTransfer;
        console.log(dt);
        if (dt && dt.items.length === 1) {
          event.target.classList.remove("invalid");
        } else {
          event.target.classList.add("invalid");
        }
      } else if (event.type === 'drop') {
        event.target.classList.remove("targeted");
        if (event.target.classList.contains("invalid")) {
          event.target.classList.remove("invalid");
        } else {
          resetGedcom();
          console.log(event);
          let dt = event.dataTransfer;
          console.log(dt);
          loadGedfile(dt.files[0]);
        }
      } else {
        console.log(event);
        event.target.classList.remove("targeted");
        event.target.classList.remove("invalid");
      }
    }
  }
  viewfile(event) {
    console.log(event);
    if (event.target.files.length === 1) {
      resetGedcom();
      loadGedfile(event.target.files[0]);
    }
  }
}

this.gedviewPage = new IndexPage();

window.addEventListener('DOMContentLoaded', initIndexSelector);
console.log("bla");
function initIndexSelector() {
  console.log("updateing links");
  var links = document.querySelectorAll('#viewselect a');
  for (var i = 0; i < links.length; i++) {
    links[i].onclick = evt=>window.gedviewPage.updateFamily(evt);
  }
  var selector = document.getElementById('families');
  selector.addEventListener('change', function (evt) {
    //printFamily(allFams[evt.target.selectedIndex]);
    console.log(evt);
    document.querySelector('#viewselect').dataset.famid =
            evt.target[evt.target.selectedIndex].value.replace(/@/g, '');
    let currView = document.querySelector('#view').contentWindow.location.href;
    if (currView !== 'welcome.html') {
      window.gedviewPage.updateView(currView);
    }
  });
  console.log("update done");
}
