"use strict";

function printGedviewFamily(fam) {
  console.log(fam);
  
  setNextFamily(fam, 2);
  
  printFamilyChildren(fam);
  
  let hname = fam.getPath(['HUSB','NAME','SURN']);
  let wname = fam.getPath(['WIFE','NAME','SURN']);
  if(hname&&wname){
    famname = hname.toLocaleString()+' / '+wname.toLocaleString();
  }else{
    famname = getFirstOf(fam, [
      ['HUSB','NAME','MARN'],
      ['WIFE','NAME','MARN'],
      ['CHIL','NAME','SURN'],
      ['HUSB','NAME','SURN'],
      ['HUSB','NAME'],
      ['WIFE','NAME','SURN'],
      ['WIFE','NAME']
    ])
  }
  var famname = famname?famname:'';
  document.getElementById('famnam').innerHTML = '';
  let namespan = document.getElementById('famnam')
      .appendChild(document.createElement('span'));
  namespan.innerHTML = famname;
  namespan.style.display = 'inline-block';
  if(famname.length>0){
    adjustSpacing(namespan);
  }
}

function printFamilyChild(div,indi){
  appendLine(div, indi?indi.getIndiName().replace(/\/.*\//,''):'');
  appendLine(div, '⚹ ', getPathOrDefault(indi,['BIRT','DATE'],''));
  appendLine(div, '⚱ ', getPathOrDefault(indi,['DEAT','DATE'],''));
}

function printFamilyChildren(fam){
  var chils = fam.getChildren();
  if(chils.length===0){
    return;
  }
  else if(chils.length===1){
    var d = document.getElementById('atI1-1');
    printIndividuum(d, chils[0]);
  }
  else if(chils.length<=3){
    var d = document.getElementById('atI1-0');
    printIndividuum(d, chils[0]);
    d = document.getElementById('atI1-1');
    printIndividuum(d, chils[1]);
    if(chils.length>2){
      d = document.getElementById('atI1-2');
      printIndividuum(d, chils[2]);
    }
  }
  else {
    printTwoPerPanel(chils);
  }
}

function printUpToNine(chils){
  for(var i=0;i<chils.length;i++){
    var col=parseInt(i/3);
    var d = document.getElementById('atI1-'+col);
    if(col>2){
      d.parentNode.style.display = 'block';
    }
    if(d){
      var indi=chils[i];
      var n=indi.getIndiName();
      var nf=n.replace(/\/.*\//, '');
      appendLine(d, nf);
      var bdate = indi.getPath(['BIRT','DATE'])
      var ddate = indi.getPath(['DEAT','DATE'])
      if(ddate)
        appendLine(d, '⚱ ', ddate);
      else if (bdate)
        appendLine(d, '⚹ ', bdate);
      else
        appendLine(d, '');
    }
  }
}

function printTwoPerPanel(chils) {
  var indi;
  var d = document.getElementById('atI1-0');
  d.innerHTML = '';
  printFamilyChild(d,chils[0]);
  printFamilyChild(d,chils[1]);
  var d = document.getElementById('atI1-1');
  d.innerHTML = '';
  printFamilyChild(d,chils[2]);
  printFamilyChild(d,chils[3]);
  var d = document.getElementById('atI1-2');
  d.innerHTML = '';
  if(chils.length>4){
    printFamilyChild(d,chils[4]);
  }
  if(chils.length>5){
    printFamilyChild(d,chils[5]);
  }
  if(chils.length>6){
    document.getElementById('smallLicense').style.display='block';
    let divid=4;
    for(let i=6;i<12&&i<chils.length;i++){
      let col = parseInt(i/2);
      var d = document.getElementById('atI1-'+col);
      d.parentNode.style.display = 'block';
      printFamilyChild(d,chils[i]);
    }
  }
}

function getFirstOf(fam, paths){
  for(var path of paths){
    var rec = fam.getPath(path);
    if(rec){
      return rec.toLocaleString();
    }
  }
}

function appendLine(div, prefix, record=null){
  let span=
    div.appendChild(document.createElement('span'));
  span.appendChild(document.createTextNode(
      prefix+(record?record.toLocaleString():'')));
  span.classList.add('line');
  //if(record instanceof GedDate)
  //  span.classList.add('date');
}

function getPathOrDefault(rec, path, defval){
  if(rec){
    var val = rec.getPath(path);
    if(val){
      return val;
    }
  }
  return defval;
}

function printIndividuum(div, indi){
  div.innerHTML = '';
  appendLine(div, indi?indi.getIndiName():'');
  appendLine(div, '⚹ ', getPathOrDefault(indi,['BIRT','DATE'],''));
  appendLine(div, '⚱ ', getPathOrDefault(indi,['DEAT','DATE'],''));
  if(getPathOrDefault(indi,['FAMS','HUSB'],'')===indi.id)
    appendLine(div, '⚭ ', getPathOrDefault(indi,['FAMS', 'MARR','DATE'],''));
}

function setNextFamily(fam, index){
  var fh = fam?fam.getHusband():false;
  var fw = fam?fam.getWife():false;
  
  var hDiv='atI'+(index).toString();
  var husb = document.getElementById(hDiv);
  printIndividuum(husb, fh);
  var wife = document.getElementById('atI'+(index+1));
  printIndividuum(wife, fw);
  
  if(index<=15){
    setNextFamily(fh?fh.getParentFamily():null, index*2);
    setNextFamily(fw?fw.getParentFamily():null, (index+1)*2);
  }
}