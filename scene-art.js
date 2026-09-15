'use strict';
// Original Canvas artwork: cached at texture resolution, with two animation frames.
const SceneArt=(()=>{
 const cache={};
 function art(key,paint){if(cache[key])return cache[key];const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.lineJoin='round';paint(g);return cache[key]=c;}
 function oval(g,x,y,rx,ry,fill,stroke='#182c30',width=2){g.fillStyle=fill;g.strokeStyle=stroke;g.lineWidth=width;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();if(width)g.stroke();}
 function box(g,x,y,w,h,fill){g.fillStyle=fill;g.fillRect(x,y,w,h);}
 function line(g,points,color,width=3){g.strokeStyle=color;g.lineWidth=width;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();}
 function metal(g,copper=false){const d=g.createLinearGradient(20,0,108,0);[[0,copper?'#55301e':'#29464e'],[.18,copper?'#b76b33':'#a0bac0'],[.36,copper?'#efbe77':'#e2e9de'],[.5,copper?'#cb854c':'#9cb5b9'],[.82,copper?'#864422':'#4e717c'],[1,copper?'#4e2f22':'#263e49']].forEach(([p,c])=>d.addColorStop(p,c));return d;}
 function label(g,text,x,y,w=70){box(g,x-w/2,y-9,w,15,'#102d38');box(g,x-w/2,y-10,w,1,'#e0bd65');g.fillStyle='#f4dfab';g.font='bold 7px monospace';g.textAlign='center';g.fillText(text,x,y);}
 function gauge(g,x,y){oval(g,x,y,9,9,'#eee7c8');line(g,[[x,y],[x+4,y-4]],'#aa472c',2);oval(g,x,y,2,2,'#203940',null,0);}
 function valve(g,x,y){line(g,[[x,y-10],[x,y+10]],'#829591',6);oval(g,x,y,7,7,'#943e2a');line(g,[[x-7,y],[x+7,y]],'#e18c53',2);line(g,[[x,y-7],[x,y+7]],'#e18c53',2);}
 function bottle(g,x,y){box(g,x+3,y,5,7,'#dfb755');box(g,x+3,y+6,5,9,'#4c925c');box(g,x,y+14,11,24,'#24563d');box(g,x+2,y+16,2,17,'#90bb7b');box(g,x,y+23,11,10,'#ddc796');}
 function can(g,x,y){box(g,x,y,12,23,'#90a9ad');box(g,x+2,y+2,3,20,'#e3e8d6');box(g,x,y+7,12,11,'#aa5b37');box(g,x,y,12,2,'#e8e5c7');}
 function prop(type,frame=0){return art(type+frame,g=>{
 if(type==='bottles'||type==='cans')box(g,3,114,122,10,'#0005');else oval(g,64,120,51,7,'#0006',null,0);
 if(['tank','kettle','filter','keg'].includes(type)){
 const copper=type==='kettle';const low=type==='filter';const top=low?43:type==='keg'?33:21,bottom=low?99:101;
 box(g,30,bottom,8,18,'#4b6870');box(g,91,bottom,8,18,'#4b6870');
 box(g,23,top,82,bottom-top,metal(g,copper));oval(g,64,top,41,low?12:17,metal(g,copper));oval(g,64,bottom,41,9,metal(g,copper));
 line(g,[[24,top],[24,bottom]],'#263a3a',2);line(g,[[104,top],[104,bottom]],'#263a3a',2);
 for(const y of [top+13,bottom-12]){box(g,24,y,81,3,copper?'#f0c483':'#d0dcda');box(g,24,y+3,81,2,'#344c51');}
 if(type!=='keg'){line(g,[[64,top-12],[64,5],[110,5],[110,35]],copper?'#b87943':'#96adb2',6);gauge(g,86,top+29);valve(g,34,bottom-4);line(g,[[34,bottom+3],[34,115],[17,115]],'#89a4a7',5);}
 if(low){for(let y=57;y<85;y+=5)line(g,[[35,y],[74,y]],'#536c70',2);label(g,'ФИЛЬТР-ЧАН',64,96,78);}else label(g,copper?'СУСЛОВАРОЧНЫЙ':type==='keg'?'ХМЕЛЬ':'ЦКТ · 04',64,top+47,74);
 if(copper)for(let i=0;i<3;i++)oval(g,51+i*13,12-frame*4,6,5,'#dbe8d245',null,0);
 }else if(type==='bottles'||type==='cans'){
 box(g,11,84,8,34,'#385660');box(g,108,84,8,34,'#385660');box(g,5,65,118,23,'#1e343f');box(g,4,65,120,5,'#d0d8c7');box(g,4,85,120,5,'#718f99');
 for(let x=10;x<124;x+=13){oval(g,x,78,5,6,'#9fadb0');line(g,[[x,73],[x+(frame?3:-3),82]],'#415963',2);}
 for(let x=8+frame*5;x<112;x+=22)type==='bottles'?bottle(g,x,29):can(g,x,44);
 box(g,4,92,120,7,'#dcba58');for(let x=5;x<118;x+=15)line(g,[[x,93],[x+6,98]],'#26343d',5);
 }else if(type==='filler'||type==='seamer'){
 box(g,11,16,106,101,'#547582');box(g,18,21,92,66,'#b7c8c5');box(g,23,28,67,51,'#243e47');
 for(let x=31;x<90;x+=18){box(g,x,30,5,20+frame*5,'#cfdfd6');type==='filler'?bottle(g,x-3,45):can(g,x-3,57);}
 box(g,95,28,9,22,'#163b3c');oval(g,99,33,3,3,frame?'#b8ed7c':'#729a52',null,0);oval(g,99,44,3,3,'#dc7645',null,0);
 label(g,type==='filler'?'РОЗЛИВ / СТЕКЛО':'ЗАКАТКА / БАНКА',64,99,102);box(g,9,116,15,6,'#20333b');box(g,104,116,15,6,'#20333b');
 }else if(type==='pallet'){
 for(let y=40;y<107;y+=31)for(let x=17;x<104;x+=45){box(g,x,y,42,29,'#bb925e');box(g,x+2,y+2,38,2,'#e2be85');box(g,x+19,y,5,29,'#dec59a');label(g,'№ 7',x+20,y+20,22);}
 for(let y=106;y<123;y+=7)box(g,9,y,110,5,'#926b43');box(g,16,110,7,12,'#473e31');box(g,103,110,7,12,'#473e31');
 }
 });}
 function monster(type,frame=0){return art('monster'+type+frame,g=>{
 const dy=frame?2:0;oval(g,64,118,46,7,'#0006',null,0);
 line(g,[[42,96],[30-frame*5,115],[16,116]],'#35504e',9);line(g,[[84,96],[99+frame*4,114],[111,115]],'#35504e',9);
 if(type===3){
 box(g,30,28,68,74,metal(g));oval(g,64,28,34,10,'#dbe1d5');oval(g,64,24,10,5,'#4e6e74');box(g,31,48,66,42,'#b76036');label(g,'БЕС / 0.5',64,90,58);
 line(g,[[37,31],[48,43],[39,59]],'#e0e6d3',3);line(g,[[96,50],[105,44-dy],[120,64-dy]],'#a9c4be',7);line(g,[[31,55],[18,49+dy],[5,69+dy]],'#a9c4be',7);
 for(let x of [36,79]){line(g,[[x,21],[x-4,9],[x+12,24]],'#cbd9ce',5);}
 }else if(type===4){
 box(g,51,8,26,12,'#ccab5a');box(g,52,20,24,21,'#559361');oval(g,64,74,32,35,'#32724b');box(g,45,80,39,20,'#cfbb7f');line(g,[[43,52],[36,71],[38,90]],'#a4cd7c',4);
 line(g,[[36,70],[15,85-dy],[6,65]],'#7ba75b',7);line(g,[[91,70],[114,84+dy],[121,65]],'#7ba75b',7);
 }else{
 for(let y=25;y<101;y+=21){box(g,24,y,80,19,'#9b6b3f');box(g,27,y+2,74,3,'#d2a974');for(const x of [32,96])oval(g,x,y+10,2,2,'#343e38',null,0);}
 line(g,[[25,48],[12,64-dy],[6,90-dy]],'#a2784e',16);line(g,[[103,48],[117,64+dy],[122,90+dy]],'#a2784e',16);
 box(g,19,16,90,10,'#dfb746');for(let x=23;x<104;x+=17)line(g,[[x,17],[x+7,25]],'#2b3e3d',6);line(g,[[34,29],[94,95]],'#67735d',5);
 }
 const ey=type===4?58:52;
 for(const x of [48,80]){oval(g,x,ey,12,10,'#f1d579');oval(g,x+(x<64?3:-3),ey+1,4,6,frame?'#e7582e':'#6f2724',null,0);}
 line(g,[[34,ey-13],[59,ey-7]],'#243531',5);line(g,[[70,ey-7],[94,ey-13]],'#243531',5);
 oval(g,64,ey+25,22,frame?15:9,'#172626');for(let x=48;x<85;x+=10){g.fillStyle='#f4e1b7';g.beginPath();g.moveTo(x,ey+18);g.lineTo(x+7,ey+18);g.lineTo(x+4,ey+(frame?31:25));g.fill();}
 });}
 function wall(kind){return art('wall'+kind,g=>{box(g,0,0,128,128,'#38505a');box(g,0,0,128,128,metal(g,kind===0));for(let y of [8,112]){box(g,0,y,128,5,'#ced7cc');box(g,0,y+5,128,3,'#354e57');}label(g,kind===0?'ВАРКА · 98°C':kind===1?'ФИЛЬТРАЦИЯ':'ТАНК · 04',64,63,104);gauge(g,95,87);valve(g,26,91);for(let x of [6,120])for(let y=15;y<113;y+=22)oval(g,x,y,2,2,'#d6dfd1',null,0);});}
 const packWall=art('pack-wall',g=>{box(g,0,0,128,128,'#a1b7b8');for(let y=0;y<128;y+=24){box(g,0,y,128,2,'#536f7b');for(let x=0;x<128;x+=32)box(g,x,y,1,24,'#69828a');}box(g,0,83,128,45,'#294e63');box(g,0,80,128,5,'#e0bf61');line(g,[[0,18],[128,18]],'#203b4a',9);line(g,[[0,15],[128,15]],'#d2d9ce',3);});
 return{prop,monster,wall,packWall};
})();
