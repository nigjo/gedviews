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
class FamilyView{

}

function printGedviewFamily(fam){
  console.log("Familie", fam);
  let h1 = document.body.querySelector("header>h1");
  let famtext=
  (fam.getPath(["HUSB", "NAME", "SURN"])||"").toLocaleString()
  +" - "+
  (fam.getPath(["WIFE", "NAME", "SURN"])||"").toLocaleString();
  if(famtext!==" - "){
    h1.append(": ", famtext);
  }

  let main = document.body.querySelector("main");

  let husb = fam.getHusband();
  if(husb){
    addIndi(husb, "parents", "Vater");
    let famc = husb.getParentFamily();
    if(famc){
      addIndi(famc.getHusband(), "grandparents", "Großvater", "FAMS");
      addIndi(famc.getWife(), "grandparents", "Großmutter", "FAMS");
    }else{
      addIndi(false, "grandparents", "Großvater");
      addIndi(false, "grandparents", "Großmutter");
    }
  }
  let wife = fam.getWife();
  if(wife){
    addIndi(wife, "parents", "Mutter");
    let famc = wife.getParentFamily();
    if(famc){
      addIndi(famc.getHusband(), "grandparents", "Großvater", "FAMS");
      addIndi(famc.getWife(), "grandparents", "Großmutter", "FAMS");
    }else{
      addIndi(false, "grandparents", "Großvater");
      addIndi(false, "grandparents", "Großmutter");
    }
  }

  let CHILs = fam.getChildren();
  for(let i=0;i<CHILs.length;i++){
    addIndi(CHILs[i], "children", (i+1)+". Kind", "FAMS");
  }
}

function addIndi(indi, container, title, subtype=false){
   let div = document.getElementById("indi").content.cloneNode(true);
   document.getElementById(container).append(div);
   let child = document.getElementById(container).lastElementChild;
   child.querySelector("h2").append(title);
   if(indi){
     let allPaths = child.querySelectorAll("span[data-gedpath]");
     for(var i=0;i<allPaths.length;i++){
       let path = allPaths[i].dataset.gedpath.split('-');
       let content = indi.getPath(path);
       if(content){
         allPaths[i].append(content.toLocaleString());
       }
     }
     if(subtype && indi.getSubValue(subtype, false)){
       child.classList.add(subtype.toLowerCase());
       child.addEventListener('click', function(){
          //var link = attr.appendChild(document.createElement('a'));
          let famid = indi.getSubValue(subtype, false);
          window.location.href= '?' + famid.replace(/@/g, '');
          return false;
       });
     }
   }
   return child;
}

