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
 }else if(type==='radio'){
 box(g,28,77,72,43,'#5c5140');box(g,24,74,80,6,'#b39259');box(g,38,37,56,36,'#314e54');box(g,43,42,25,17,'#90bb89');for(let y=44;y<57;y+=4)box(g,45,y,19,1,'#34564c');for(let y=43;y<65;y+=4)box(g,73,y,16,1,'#102e37');line(g,[[82,37],[89,7]],'#a8bcb7',3);oval(g,47,65,3,3,'#d9b554');label(g,'РАЦИЯ',64,100,53);if(frame){line(g,[[99,32],[108,25],[111,14]],'#deca78',2);}
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
 function forklift(type,mode='hunt',frame=0){return art('forklift'+type+mode+frame,g=>{
 const elite=type===7,body=elite?'#b94027':'#dca62c',light=elite?'#f08b51':'#ffe07c';
 oval(g,64,119,57,7,'#0008',null,0);
 // Wide treaded tyres and a steel chassis.
 for(const x of [13,94]){box(g,x,82,21,33,'#17242a');for(let y=85;y<113;y+=6)line(g,[[x+2,y],[x+18,y-2]],'#425258',3);oval(g,x+10,104,5,8,'#61777b');}
 box(g,24,67,80,35,body);box(g,27,69,74,7,light);box(g,27,94,74,10,'#6e482c');
 box(g,38,30,52,39,'#152b34');box(g,44,35,40,22,'#35505b');
 for(const x of [31,90]){box(g,x,19,7,65,'#68818a');box(g,x+1,20,2,63,'#c2c9b9');}
 box(g,25,15,78,9,body);box(g,27,15,74,3,light);
 box(g,57,8,15,7,'#64543a');oval(g,64,9,7,6,mode==='windup'&&frame?'#fff7b1':frame?'#ff8d32':'#a94420');
 if(mode==='windup'&&frame){line(g,[[49,5],[40,1]],'#ffd36f',3);line(g,[[79,5],[87,1]],'#ffd36f',3);}
 // Angry headlamps, radiator teeth and hydraulic mast, with projecting forks.
 for(const x of [37,77]){oval(g,x+6,70,10,8,mode==='charge'?'#ff6037':'#f7d779');line(g,[[x-5,59],[x+17,65]],'#202b2b',4);}
 box(g,42,82,44,12,'#18292d');for(let x=46;x<85;x+=8){g.fillStyle='#f4deb6';g.beginPath();g.moveTo(x,82);g.lineTo(x+6,82);g.lineTo(x+3,89);g.fill();}
 for(const x of [32,87]){box(g,x,40,7,69,'#293f46');box(g,x+2,42,2,62,'#b7c8c4');line(g,[[x+3,96],[x-4,119],[x-19,119]],'#aabbb9',6);}
 if(elite){box(g,15,75,11,17,'#75392e');box(g,102,75,11,17,'#75392e');label(g,'НАЧСКЛАД',64,100,52);}else label(g,'ПР-66',64,101,41);
 if(mode==='recover'){for(const [x,y] of [[28,31],[100,48],[75,4]]){line(g,[[x-5,y],[x+5,y]],'#ffe68b',2);line(g,[[x,y-5],[x,y+5]],'#ffe68b',2);}}
 if(mode==='charge'){line(g,[[7,42],[2,68]],'#eee0b66b',3);line(g,[[121,43],[126,69]],'#eee0b66b',3);}
 });}
 const rack=art('warehouse-rack',g=>{
 box(g,0,0,128,128,'#25343d');
 for(let y=9;y<122;y+=38){for(let x=9;x<118;x+=36){box(g,x,y,33,29,'#ac8753');box(g,x+2,y+2,29,3,'#dfb97c');box(g,x+14,y,5,29,'#dec496');box(g,x+5,y+14,9,9,'#e5d5b2');line(g,[[x+8,y+21],[x+8,y+16]],'#674e35',1);}box(g,0,y+29,128,7,'#c57432');box(g,0,y+29,128,2,'#f2b660');}
 for(const x of [0,120]){box(g,x,0,8,128,'#546a72');box(g,x+2,0,2,128,'#a5b6ad');for(let y=3;y<128;y+=11)box(g,x+3,y,2,3,'#1b303b');}
 });
 const warehouseWall=art('warehouse-wall',g=>{
 box(g,0,0,128,128,'#697b80');for(let x=0;x<128;x+=10){box(g,x,0,3,128,'#425962');box(g,x+3,0,1,128,'#9aa9a8');}box(g,0,94,128,34,'#35444c');box(g,0,89,128,8,'#dcb448');for(let x=0;x<128;x+=18)line(g,[[x,90],[x+7,96]],'#2d3434',5);
 });
 const maltDoor=art('malt-door',g=>{
 box(g,0,0,128,128,'#1c313a');for(let x=8;x<128;x+=12)box(g,x,5,3,120,'#506972');box(g,7,6,114,5,'#d8b349');label(g,'СОЛОДОВНЯ',64,47,110);label(g,'СИЛОС 04',64,67,96);g.fillStyle='#ecd78c';g.font='bold 32px monospace';g.textAlign='center';g.fillText('→',64,105);
 });
 return{prop,monster,forklift,wall,packWall,rack,warehouseWall,maltDoor};
})();
