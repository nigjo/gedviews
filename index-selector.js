function getIndiName(indi) {
  if (indi)
    return indi.getIndiName();
  return '';
}
function printGedviewFamily(viewfam, ged) {
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
            getIndiName(fam.getHusband()) + "</span> - <span class='fname'>"
            + getIndiName(fam.getWife()) + "</span>";
    if (fam === viewfam) {
      selfam = option;
    }
  }
  if (selfam)
    selfam.selected = true;
  else
    document.querySelector('#view').src = 'about:blank';
}
function updateFamily(event) {
  updateView(event.target.href);
  return false;
}
function updateView(targetLocation) {
  let fam = document.querySelector('#viewselect').dataset.famid;
  let nextLoc = targetLocation.replace(/\?.*/, '')
          + '?' + (fam ? fam : '');
  if (nextLoc !== document.querySelector('#view').contentWindow.location.href) {
    document.querySelector('#view').src = nextLoc;
  }
  //console.log(event.target);
  return false;
}
window.addEventListener('DOMContentLoaded', function () {
  let links = document.querySelectorAll('#viewselect a');
  for (let i = 0; i < links.length; i++) {
    links[i].onclick = updateFamily;
  }
  var selector = document.getElementById('families');
  selector.addEventListener('change', function (evt) {
    //printFamily(allFams[evt.target.selectedIndex]);
    console.log(evt);
    document.querySelector('#viewselect').dataset.famid =
            evt.target[evt.target.selectedIndex].value.replace(/@/g, '');
    let currView = document.querySelector('#view').contentWindow.location.href;
    if (currView !== 'about:blank') {
      updateView(currView);
    }
  });

});
function updateSelection(evt) {
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
function handleDragging(event) {
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
function viewfile(event) {
  console.log(event);
  if (event.target.files.length === 1) {
    resetGedcom();
    loadGedfile(event.target.files[0]);
  }
}
