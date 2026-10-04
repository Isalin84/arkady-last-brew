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
 }else if(type==='maltSilo'){
 box(g,29,27,70,79,metal(g));oval(g,64,27,35,15,'#dce2d7');oval(g,64,105,35,10,'#526b70');line(g,[[29,48],[99,48]],'#faf1ce',3);line(g,[[29,88],[99,88]],'#31484f',4);line(g,[[64,12],[64,2],[109,2],[109,39]],'#8fa4a5',6);for(const x of [37,88])box(g,x,101,8,20,'#42575c');label(g,'СОЛОД · СИЛОС',64,71,92);gauge(g,83,91);
 }else if(type==='bucket'){
 box(g,41,8,47,109,'#405963');box(g,47,14,35,97,'#1e343d');for(let y=18;y<108;y+=13){box(g,50,y+(frame?3:0),29,8,'#a9854f');line(g,[[51,y+7+(frame?3:0)],[78,y+7+(frame?3:0)]],'#e1bd78',2);}box(g,34,6,62,9,'#d4ae46');box(g,35,113,60,8,'#263d45');label(g,'НОРИЯ',64,68,45);
 }else if(type==='maltBags'){
 for(let y=42;y<111;y+=32)for(let x=17+(y%64?0:9);x<103;x+=45){oval(g,x+19,y+14,22,17,'#c8ab70','#6b5639',2);line(g,[[x+3,y+14],[x+35,y+14]],'#8b724b',2);g.fillStyle='#4c412d';g.font='bold 7px monospace';g.textAlign='center';g.fillText('СОЛОД',x+19,y+17);}box(g,10,111,108,9,'#805e3a');
 }else if(['aspiration','screw'].includes(type)){
 box(g,26,34,76,82,'#304850');box(g,32,40,64,43,'#172b34');box(g,39,47,24,19,frame?'#2f7a62':'#6b3d32');oval(g,78,56,8,8,frame?'#8ee59d':'#db8b35');for(let y=90;y<108;y+=8)line(g,[[37,y],[91,y]],'#9db0aa',2);label(g,type==='aspiration'?'АСПИРАЦИЯ':'ШНЕК · РЕВЕРС',64,29,type==='aspiration'?76:90);if(!frame){g.fillStyle='#f0ce73';g.font='bold 14px monospace';g.fillText('E',76,61);}
 }else if(type==='hatch'){
 box(g,15,12,98,107,'#253d47');oval(g,64,66,43,43,metal(g),'#1b3038',5);oval(g,64,66,30,30,frame?'#2d735a':'#3d5053','#d6bd70',3);for(let a=0;a<Math.PI*2;a+=Math.PI/4)oval(g,64+Math.cos(a)*36,66+Math.sin(a)*36,3,3,'#ebddb5');valve(g,64,66);label(g,frame?'ЛЮК ОТКРЫТ':'АВАРИЙНЫЙ ЛЮК',64,116,98);
 }
 });}
 function monster(type,frame=0){return art('monster'+type+frame,g=>{
 // Radial gradients fall back to a flat colour where the 2D context has none (node test stub).
 const rad=(x,y,r,stops,fallback)=>{const d=g.createRadialGradient(x,y,0,x,y,r);if(!d?.addColorStop)return fallback;for(const [p,c] of stops)d.addColorStop(p,c);return d;};
 if(type===11&&String(frame).startsWith('glob')){
 // Spitter glob: glowing yeast blob with a drip tail, two wobble frames.
 const w=frame==='glob1'?1:0;
 oval(g,64,64,44,40,'#d8f06a1c',null,0);oval(g,64,64,33,30,'#d8f06a3a',null,0);
 oval(g,64,66,22+w*2,19-w*2,rad(57,58,26,[[0,'#fbffd8'],[.4,'#d4ec5a'],[1,'#6f8f22']],'#c6e04c'),'#3f5a16',3);
 oval(g,56,58,8,5,'#fbffe6',null,0);oval(g,75,73,4,3,'#effFb0',null,0);oval(g,49,75,3,3,'#effFb0',null,0);oval(g,70,57,2,2,'#ffffff',null,0);
 oval(g,64,90+w*4,5,6+w,'#b5d23e','#3f5a16',2);oval(g,64,102+w*6,3,3,'#b5d23e',null,0);
 return;
 }
 if(type===11){
 // Yeast spitter: bulbous sac with budding cells, three eyes and a puckered nozzle. Frame 2 = inflated telegraph.
 const inf=frame===2?1:0,p=frame===1?1:0,cy=68-inf*5,rx=33+inf*10+p*2,ry=35+inf*8-p;
 oval(g,64,119,42+inf*6,7,'#0006',null,0);oval(g,64,113,34,7,'#7e9132','#3e4a18',2);oval(g,48,112,5,2,'#c3d86a',null,0);
 for(const s of [-1,1])line(g,[[64+s*16,cy+ry-10],[64+s*(28+p*3),108],[64+s*40,114]],'#55632a',7);
 oval(g,64-rx+3+inf*4,cy+20,12,11,rad(60-rx,cy+16,14,[[0,'#ece6a0'],[1,'#a29a46']],'#c3bb62'),'#4a5220',2);
 oval(g,64+rx-3-inf*3,cy+24,10,9,rad(62+rx,cy+20,12,[[0,'#ece6a0'],[1,'#a29a46']],'#c3bb62'),'#4a5220',2);
 oval(g,64-rx*.5,cy-ry+5,8,7,'#d4cc78','#4a5220',2);oval(g,64+rx*.62,cy-ry+9,6,5,'#d4cc78','#4a5220',2);
 oval(g,64,cy,rx,ry,rad(52,cy-16,rx+16,[[0,inf?'#fffbd0':'#f4eea6'],[.5,inf?'#e6e486':'#cbc65c'],[1,'#7a772a']],'#c9c45a'),'#3d4a1a',3);
 for(const [a,b] of [[-1,.2],[-.6,.85],[.55,-.5],[1,.35],[.25,.95]])line(g,[[64+rx*.18*a,cy+ry*.12*b],[64+rx*.55*a+3,cy+ry*.48*b-2],[64+rx*.86*a,cy+ry*.74*b]],inf?'#d9774c':'#958f3e',2);
 for(const [x,y,r] of [[-.55,.15,4],[.45,.45,3],[.62,-.2,3],[-.3,.62,3]])oval(g,64+rx*x,cy+ry*y,r,r*.8,'#a29c4a88',null,0);
 oval(g,64-rx*.38,cy-ry*.52,rx*.26,ry*.15,'#ffffff66',null,0);
 if(inf)for(const [x,y] of [[-.8,-.45],[.84,-.3],[.7,.6]])oval(g,64+rx*x,cy+ry*y,2,3,'#e9f6ff',null,0);
 for(const [x,y,r] of [[50,cy-15,6],[64,cy-21,7],[78,cy-15,6]]){oval(g,x,y,r,r-1,'#f3eaa4','#2c3313',2);oval(g,x,y+1,inf?1.5:2,inf?2:r-3,inf?'#d0442a':'#1f1a0c',null,0);if(inf)line(g,[[x-r,y-3],[x+r,y-3]],'#3d4a1a',3);}
 if(inf)oval(g,64,cy+16,26,22,'#e9ff7a44',null,0);
 oval(g,64,cy+15,16+inf*4,13+inf*3,'#aaa24a','#3d4a1a',3);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;line(g,[[64+Math.cos(a)*(11+inf*3),cy+15+Math.sin(a)*(9+inf*2)],[64+Math.cos(a)*(15+inf*4),cy+15+Math.sin(a)*(12+inf*3)]],'#6f6a2c',2);}
 oval(g,64,cy+16,10+inf*3,8+inf*2,'#26260f',null,0);oval(g,64,cy+18,6+inf*4,4+inf*3,inf?'#f0ff8a':'#9bbb34',null,0);
 if(p)oval(g,71,cy+31,2,4,'#a9c83a',null,0);
 return;
 }
 if(type===12){
 // «Солодовый король»: hulking malt sack with grain-auger arms and a crown of copper funnels. Frames 0–1 walk, 2 attack; +3 = enraged.
 const f=frame%3,rage=frame>=3,up=f===2,sw=f===1?3:0,eye=rage?'#ff6a2a':'#ffd36a',glow=rage?'#ff3b1f55':'#ffc24a40';
 oval(g,64,122,60,6,'#0007',null,0);
 for(const x of [42,86]){box(g,x-10,98,20,18,'#6d4f2c');box(g,x-13,114,26,6,'#3b2a18');line(g,[[x-10,104],[x+10,104]],'#3b2a18',2);line(g,[[x-6,99],[x-6,113]],'#8a6a3e',1);}
 const arm=(sx,sy,ex,ey)=>{line(g,[[sx,sy],[ex,ey]],'#1e2a2e',14);line(g,[[sx,sy],[ex,ey]],'#7f979b',9);line(g,[[sx-1,sy-1],[ex-1,ey-1]],'#c9d8d4',2);for(let i=1;i<8;i++){const t=i/8,x=sx+(ex-sx)*t,y=sy+(ey-sy)*t;line(g,[[x-5,y-3],[x+5,y+3]],'#d88f45',3);}
  oval(g,ex,ey,9,8,metal(g,true),'#3b2414',2);for(const k of [-1,0,1])line(g,[[ex+k*5,ey+(up?-4:4)],[ex+k*8,ey+(up?-12:12)]],'#efdca4',3);};
 if(up){arm(34,56,14,12);arm(94,56,114,12);}else{arm(34,58,12-sw,92+sw);arm(94,58,116+sw,92-sw);}
 g.beginPath();g.moveTo(45,30);g.bezierCurveTo(24,36,19,70,24,95);g.bezierCurveTo(29,113,99,113,104,95);g.bezierCurveTo(109,70,104,36,83,30);g.closePath();
 const sack=g.createLinearGradient(20,0,108,0);[[0,'#4e351c'],[.28,'#b08850'],[.5,'#cfa86a'],[.74,'#9c7642'],[1,'#4a301a']].forEach(([p,c])=>sack.addColorStop(p,c));
 g.fillStyle=sack;g.fill();g.strokeStyle='#2a1c0e';g.lineWidth=3;g.stroke();
 g.save();g.clip();for(let y=32;y<112;y+=4)box(g,18,y,92,1,'#00000016');for(let x=20;x<108;x+=5)box(g,x,30,1,82,'#ffffff0d');g.restore();
 box(g,82,80,16,13,'#8a6a3e');for(let x=83;x<98;x+=4){line(g,[[x,79],[x+2,82]],'#ecd9a4',1);line(g,[[x,91],[x+2,94]],'#ecd9a4',1);}
 g.fillStyle='#3a2814';g.font='bold 9px monospace';g.textAlign='center';g.fillText('СОЛОД',58,101);g.font='bold 7px monospace';g.fillText('№4',90,89);
 for(const [x,y] of [[28,90],[26,97],[30,103],[100,92],[103,99]])oval(g,x,y+sw,2,3,'#e8c86e',null,0);
 if(f===1)for(const [x,y] of [[30,112],[96,110],[64,114]])oval(g,x,y,1.5,2.5,'#e8c86e',null,0);
 if(rage)for(const pts of [[[33,60],[39,69],[35,80],[41,88]],[[95,58],[89,70],[94,80]],[[70,96],[76,104]]])line(g,pts,'#ff7a2a',2);
 line(g,[[42,34],[86,34]],'#d9c08a',4);oval(g,52,36,3,3,'#d9c08a',null,0);line(g,[[52,38],[49,46]],'#d9c08a',2);
 box(g,38,22,52,10,'#d4af37');box(g,38,22,52,2,'#fff0b0');box(g,38,30,52,2,'#7a5a1a');for(let x=42;x<90;x+=8)oval(g,x,27,1.5,1.5,'#7a5a1a',null,0);
 for(const [x,h] of [[47,13],[64,19],[81,13]]){const top=22-h,cu=g.createLinearGradient(x-10,0,x+10,0);[[0,'#55301e'],[.35,'#efbe77'],[.6,'#cb854c'],[1,'#4e2f22']].forEach(([p,c])=>cu.addColorStop(p,c));
  g.beginPath();g.moveTo(x-10,top);g.lineTo(x+10,top);g.lineTo(x+3,22);g.lineTo(x-3,22);g.closePath();g.fillStyle=cu;g.fill();g.strokeStyle='#3b2414';g.lineWidth=1.5;g.stroke();
  oval(g,x,top,10,3,'#f0c483','#3b2414',1.5);oval(g,x,top,7,1.8,rage?'#ff7a2a':'#2a160c',null,0);if(f===1||rage)oval(g,x+2,top-5,5,3,rage?'#ff9a4a55':'#e8d8b070',null,0);}
 for(const x of [48,80]){oval(g,x,52,15,12,glow,null,0);oval(g,x,52,9,8,eye,'#2a1c0e',2);oval(g,x-2,50,3,2,'#fffbe0',null,0);line(g,[[x,47],[x,57]],'#3a1206',3);}
 line(g,[[34,40],[58,47]],'#2a1c0e',6);line(g,[[94,40],[70,47]],'#2a1c0e',6);
 oval(g,64,76,25,up?14:8,'#1b0f08','#2a1c0e',2);if(up){oval(g,64,79,17,8,rage?'#ff5a1acc':'#ffb43acc',null,0);oval(g,64,80,9,4,rage?'#ffd0a0':'#fff0b0',null,0);}
 for(let x=45;x<85;x+=7){oval(g,x,71,2.5,4,'#f0dc9a','#5a4320',1);if(up)oval(g,x+3,88,2.5,4,'#f0dc9a','#5a4320',1);}
 return;
 }
 const dy=frame?2:0;oval(g,64,118,46,7,'#0006',null,0);
 line(g,[[42,96],[30-frame*5,115],[16,116]],'#35504e',9);line(g,[[84,96],[99+frame*4,114],[111,115]],'#35504e',9);
 if(type===3){
 box(g,30,28,68,74,metal(g));oval(g,64,28,34,10,'#dbe1d5');oval(g,64,24,10,5,'#4e6e74');box(g,31,48,66,42,'#b76036');label(g,'БЕС / 0.5',64,90,58);
 line(g,[[37,31],[48,43],[39,59]],'#e0e6d3',3);line(g,[[96,50],[105,44-dy],[120,64-dy]],'#a9c4be',7);line(g,[[31,55],[18,49+dy],[5,69+dy]],'#a9c4be',7);
 for(let x of [36,79]){line(g,[[x,21],[x-4,9],[x+12,24]],'#cbd9ce',5);}
 }else if(type===4){
 box(g,51,8,26,12,'#ccab5a');box(g,52,20,24,21,'#559361');oval(g,64,74,32,35,'#32724b');box(g,45,80,39,20,'#cfbb7f');line(g,[[43,52],[36,71],[38,90]],'#a4cd7c',4);
 line(g,[[36,70],[15,85-dy],[6,65]],'#7ba75b',7);line(g,[[91,70],[114,84+dy],[121,65]],'#7ba75b',7);
 }else if(type===8){
 oval(g,64,75,37,31,'#a97935');for(let i=0;i<8;i++){const a=i*Math.PI/4;line(g,[[64+Math.cos(a)*24,75+Math.sin(a)*20],[64+Math.cos(a)*52,75+Math.sin(a)*43+(frame?2:-2)]],'#5b452d',6);oval(g,64+Math.cos(a)*52,75+Math.sin(a)*43+(frame?2:-2),5,5,'#d5aa55');}for(let y=52;y<96;y+=9)line(g,[[37,y],[91,y]],'#e1bd70',2);line(g,[[42,48],[28,26],[38,34]],'#604932',5);line(g,[[86,48],[100,26],[90,34]],'#604932',5);
 }else if(type===9){
 for(let i=0;i<7;i++)oval(g,64+(i%2?10:-8),92-i*10,30-i*2,17,'#bfb295aa',null,0);line(g,[[38,83],[14,68-dy],[5,80]],'#9c927b',9);line(g,[[90,83],[114,68+dy],[123,80]],'#9c927b',9);for(let i=0;i<18;i++)oval(g,24+(i*29)%82,25+(i*17)%84,2+(i%3),2+(i%2),'#dbcba76e',null,0);
 }else if(type===10){
 for(let y=28;y<103;y+=22){oval(g,64,y,42,17,'#98713e','#4f3c29',3);line(g,[[28,y],[100,y]],'#d0a964',2);}line(g,[[31,49],[12,69-dy],[7,99]],'#755630',15);line(g,[[97,49],[116,69+dy],[121,99]],'#755630',15);for(let x=35;x<97;x+=14)line(g,[[x,30],[x+(frame?4:-4),10]],'#9eae57',4);box(g,17,22,94,9,'#d4af37');line(g,[[28,32],[97,99]],'#344a43',6);
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
 const maltWall=art('malt-wall',g=>{
 box(g,0,0,128,128,'#9b8c72');for(let y=0;y<128;y+=22){box(g,0,y,128,2,'#61584d');for(let x=(y/22%2)*25;x<128;x+=50)box(g,x,y,2,22,'#746858');}box(g,0,91,128,37,'#263f48');box(g,0,88,128,5,'#d4af37');for(let x=5;x<128;x+=23)line(g,[[x,91],[x+9,99]],'#151f24',6);for(let i=0;i<80;i++)oval(g,(i*47)%128,(i*31)%87,1,1,'#e6d4aa42',null,0);
 });
 const siloWall=art('silo-wall',g=>{
 box(g,0,0,128,128,metal(g));for(let x=6;x<128;x+=13){box(g,x,0,2,128,'#536b70');box(g,x+2,0,1,128,'#d7dfd7');}for(let y of [9,111]){box(g,0,y,128,6,'#263d45');for(let x=7;x<128;x+=18)oval(g,x,y+3,2,2,'#d9c47f');}label(g,'СОЛОД · ЛИНИЯ 04',64,66,108);
 });
 const maltDoor=art('malt-door',g=>{
 box(g,0,0,128,128,'#1c313a');for(let x=8;x<128;x+=12)box(g,x,5,3,120,'#506972');box(g,7,6,114,5,'#d8b349');label(g,'СОЛОДОВНЯ',64,47,110);label(g,'СИЛОС 04',64,67,96);g.fillStyle='#ecd78c';g.font='bold 32px monospace';g.textAlign='center';g.fillText('→',64,105);
 });
 // ---- painted art (assets/art/monster-*.webp, prop-*.webp, item-*.webp and hall surfaces) ----
 // Each file loads on first request or preload into its own canvas; until then callers get the Canvas art above.
 const paintedCache={};
 function load(file){
  let p=paintedCache[file];
  if(!p){p=paintedCache[file]={c:null,wait:[]};if(typeof Image!=='undefined'){const im=new Image();im.decoding='async';im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);p.c=c;for(const fn of p.wait)fn(c);p.wait=null;};im.src=`assets/art/${file}.webp`;}}
  return p;
 }
 const SLUG=['yeast','foam-mold','sour','can-imp','bottle-biter','pallet-golem','forklift','reach-truck','malt-tick','dust-ghost','clump-guard','spitter','malt-king'];
 const FRAMES={11:['a','b','spit'],12:['a','b','slam','rage-a','rage-b','rage-slam']},MODES={hunt:'hunt',windup:'charge',charge:'charge',recover:'recover'};
 const frameName=(type,frame)=>type===6||type===7?MODES[frame]||'hunt':(FRAMES[type]||['a','b'])[frame];
 function painted(type,frame=0){const name=frameName(type,frame);return name&&SLUG[type]?load(`monster-${SLUG[type]}-${name}`).c:null;}
 function preload(types){for(const t of types){if(t===6||t===7)for(const m of ['hunt','charge','recover'])painted(t,m);else (FRAMES[t]||['a','b']).forEach((_,f)=>painted(t,f));}}
 // Props: [file, animated] — animated props alternate -a/-b, control panels show -off/-on by their active frame.
 const PROPS={tank:['tank'],kettle:['kettle'],filter:['filter'],keg:['keg'],bottles:['bottle-line',1],cans:['can-line',1],filler:['filler',1],seamer:['seamer',1],radio:['radio',1],pallet:['pallet'],maltSilo:['malt-silo'],bucket:['bucket-elevator',1],maltBags:['malt-bags'],aspiration:['aspiration',2],screw:['screw',2],hatch:['hatch',2]};
 const propFile=(type,frame)=>{const d=PROPS[type];return d&&'prop-'+d[0]+(d[1]===1?(frame?'-b':'-a'):d[1]===2?(frame?'-on':'-off'):'');};
 function paintedProp(type,frame=0){const f=propFile(type,frame);return f?load(f).c:null;}
 const item=kind=>['health','ammo','gold','mark'].includes(kind)?load('item-'+kind).c:null;
 function preloadProps(types){for(const t of types){paintedProp(t,0);paintedProp(t,1);}for(const k of ['health','ammo','gold','mark'])item(k);}
 // Repaints a Canvas-art canvas in place with item-<kind>.webp once it loads, for sprites whose canvas is held long-term.
 function paintOver(c,kind){const p=load('item-'+kind),put=src=>{c.width=src.width;c.height=src.height;c.getContext('2d').drawImage(src,0,0);if(typeof Renderer!=='undefined')Renderer.invalidate?.(c);};if(p.c)put(p.c);else p.wait?.push(put);return c;}
 // Hall surfaces (wall-*, door-*, floor-*, ceiling-*): a hall switches to painted art only once its whole set is in, so its floor and ceiling textures always share one size.
 const HALLS=['brew','pack','warehouse','malt'],FLOORS=[4,5,3,3],DOORS=['door-exit','door-exit','door-malt','door-malt'],EXTRA=[['wall-brew-panel-a','wall-brew-panel-b','wall-brew-panel-c'],[],['wall-rack'],['wall-silo']];
 function surfaceFiles(i){const s=HALLS[i];if(!s)return [];const f=[`wall-${s}`,DOORS[i],...EXTRA[i]];for(let v=0;v<FLOORS[i];v++)f.push(`floor-${s}-${v}`);for(let v=0;v<3;v++)f.push(`ceiling-${s}-${v}`);return f;}
 // Returns the hall's painted set, or null while it loads; onReady fires once the last missing file arrives.
 function surfaces(i,onReady){
  const files=surfaceFiles(i);if(!files.length)return null;const missing=files.map(load).filter(p=>!p.c);
  if(missing.length){if(onReady){let left=missing.length;for(const p of missing)p.wait?.push(()=>{if(--left===0)onReady();});}return null;}
  const s=HALLS[i],c=f=>paintedCache[f].c;
  return{wall:c(`wall-${s}`),door:c(DOORS[i]),panels:i===0?['a','b','c'].map(k=>c('wall-brew-panel-'+k)):null,rack:i===2?c('wall-rack'):null,silo:i===3?c('wall-silo'):null,
   floor:[0,1,2,3,4].map(v=>c(`floor-${s}-${v<FLOORS[i]?v:0}`)),ceiling:[0,1,2].map(v=>c(`ceiling-${s}-${v}`))};
 }
 return{prop:(type,frame=0)=>paintedProp(type,frame)||prop(type,frame),item,paintOver,preloadProps,surfaces,monster:(type,frame=0)=>painted(type,frame)||monster(type,frame),forklift:(type,mode='hunt',frame=0)=>painted(type,mode)||forklift(type,mode,frame),painted,preload,wall,packWall,rack,warehouseWall,maltWall,siloWall,maltDoor};
})();
// Floor and ceiling surfaces per hall: 128px canvases tiled once per map cell; the renderer picks a variant per cell.
(()=>{
 const cache={};
 function surface(key,paint){if(cache[key])return cache[key];const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');let s=key.split('').reduce((a,ch)=>a*31+ch.charCodeAt(0)|0,7)>>>0||1;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;paint(g,rnd);return cache[key]=c;}
 const box=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
 const speck=(g,rnd,n,colors,w=1,h=1)=>{for(let i=0;i<n;i++){g.fillStyle=colors[i%colors.length];g.fillRect(rnd()*128|0,rnd()*128|0,w,h);}};
 const blob=(g,x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();};
 // Draw a shape at all 9 wrapped offsets so it tiles seamlessly across cell edges.
 const wrap=fn=>{for(const dx of [-128,0,128])for(const dy of [-128,0,128])fn(dx,dy);};
 function tray(g,x){box(g,x,0,22,128,'#3f4a4c');box(g,x+2,0,18,128,'#1d2526');for(let y=6;y<128;y+=16)box(g,x,y,22,2,'#5f6b6c');for(const [o,c] of [[5,'#2d3a3c'],[9,'#4e2a22'],[13,'#203a52'],[16,'#2d3a3c']])box(g,x+o,0,2,128,c);}
 function pipe(g,y,h,dark,mid,light){box(g,0,y-1,128,h+2,'#00000055');box(g,0,y,128,h,mid);box(g,0,y+1,128,Math.max(1,h/4|0),light);box(g,0,y+h-2,128,2,dark);for(const x of [24,88]){box(g,x,y-3,5,h+6,'#151b1c');box(g,x,0,2,y-3,'#151b1c');}}
 function floor(level,variant=0){return surface('floor'+level+'-'+variant,(g,rnd)=>{
  if(level===0){
   // Brewhouse: worn quarry tiles, 2×2 per cell, dark grout on the cell grid; drain grates and wort stains.
   box(g,0,0,128,128,'#3a3225');
   for(const ty of [0,64])for(const tx of [0,64]){const base=variant===1?(tx===ty?'#6e5f43':'#76664a'):(tx===ty?'#7a6a4c':'#716246');box(g,tx+2,ty+2,61,61,base);box(g,tx+2,ty+2,61,1,'#8f7d59');box(g,tx+2,ty+2,1,61,'#8a7855');box(g,tx+2,ty+62,61,1,'#56492f');box(g,tx+62,ty+2,1,61,'#56492f');
    for(let i=0;i<5;i++)blob(g,tx+10+rnd()*44,ty+10+rnd()*44,4+rnd()*9,3+rnd()*6,rnd()<.5?'#8d7c5a30':'#4a3e2a26');}
   box(g,0,0,128,2,'#262117');box(g,0,0,2,128,'#262117');
   speck(g,rnd,320,['#00000026','#ffffff12','#5a4c33','#8b7a58']);
   if(variant===2){for(let r=44;r>20;r-=4)blob(g,64,64,r,r,'#00000012');
    box(g,44,44,40,40,'#59625e');box(g,46,46,36,36,'#141a19');for(let x=49;x<80;x+=6){box(g,x,47,3,34,'#5f6b66');box(g,x,47,1,34,'#93a09a');}box(g,44,44,40,2,'#8c9893');box(g,44,82,40,2,'#2f3634');for(const [x,y] of [[47,47],[79,47],[47,79],[79,79]])box(g,x,y,2,2,'#c1c8bf');}
   if(variant===3){wrap((dx,dy)=>{blob(g,40+dx,78+dy,26,14,'#4b3520aa');blob(g,62+dx,70+dy,16,10,'#5b4227a0');blob(g,90+dx,86+dy,10,6,'#4b352090');});speck(g,rnd,40,['#c08a4a55','#2a1d1260']);}
  }else if(level===1){
   // Packing hall: blue-grey epoxy with seams; yellow safety lines and hatched zones around the conveyor lines.
   box(g,0,0,128,128,variant===1?'#566e7b':'#5b7380');
   for(let i=0;i<26;i++){const x=rnd()*128,y=rnd()*128,rx=8+rnd()*22,ry=6+rnd()*16,c=rnd()<.5?'#ffffff08':'#00000010';wrap((dx,dy)=>blob(g,x+dx,y+dy,rx,ry,c));}
   speck(g,rnd,420,['#4c626e','#6b8490','#ffffff14','#3e525d']);
   box(g,0,0,128,1,'#3b505c');box(g,0,0,1,128,'#3b505c');box(g,0,1,128,1,'#76909b');box(g,1,0,1,128,'#76909b');
   const line=y=>{box(g,0,y-1,128,12,'#25333a');box(g,0,y,128,10,'#d8b63c');box(g,0,y,128,2,'#f0d468');speck(g,rnd,60,['#8a7a3a80','#5b738080'],2,1);};
   if(variant===2)line(112);
   if(variant===3)line(6);
   if(variant===4){box(g,0,0,128,128,'#39403f');g.fillStyle='#8f7f3e';for(let k=-128;k<256;k+=32){g.beginPath();g.moveTo(k,0);g.lineTo(k+14,0);g.lineTo(k+142,128);g.lineTo(k+128,128);g.fill();}speck(g,rnd,260,['#39403f','#00000040','#6c6340'],2,1);box(g,0,0,128,3,'#d8b63c');box(g,0,125,128,3,'#d8b63c');}
  }else if(level===2){
   // Warehouse: concrete with expansion joints, oil stains and yellow lane lines on cells x = 2, 8, 14, 20.
   box(g,0,0,128,128,'#686660');
   for(let i=0;i<30;i++){const x=rnd()*128,y=rnd()*128,rx=6+rnd()*20,ry=5+rnd()*14,c=rnd()<.5?'#ffffff09':'#00000012';wrap((dx,dy)=>blob(g,x+dx,y+dy,rx,ry,c));}
   speck(g,rnd,700,['#5b5952','#77756d','#4f4d47','#83817a']);
   g.strokeStyle='#4c4a4566';g.lineWidth=1;g.beginPath();let cx=20+rnd()*88,cy=0;g.moveTo(cx,cy);while(cy<128){cx+=(rnd()-.5)*14;cy+=6+rnd()*10;g.lineTo(cx,cy);}g.stroke();
   box(g,0,0,128,2,'#42413c');box(g,0,0,2,128,'#42413c');box(g,0,2,128,1,'#7b7972');box(g,2,0,1,128,'#7b7972');box(g,64,0,1,128,'#5a5852');
   if(variant===1)wrap((dx,dy)=>{blob(g,72+dx,52+dy,24,16,'#26262470');blob(g,60+dx,62+dy,12,9,'#1e1e1c60');});
   if(variant===2)for(const lx of [1,120])for(const y0 of [6,70]){box(g,lx,y0,7,52,'#e2b53b');box(g,lx,y0,7,2,'#f5d067');for(let i=0;i<18;i++)box(g,lx+(rnd()*7|0),y0+(rnd()*52|0),1+(rnd()*2|0),1,'#8d7a4a');}
  }else{
   // Malt house: wooden planks with staggered joints, nails and malt dust in the seams.
   const tones=['#8e7a56','#857150','#96815b','#7f6c4a'];
   for(let p=0;p<4;p++){const y=p*32,j=(p*45+17)%128;box(g,0,y,128,32,tones[(p+variant)%4]);for(let i=0;i<7;i++)box(g,0,y+3+(rnd()*27|0),128,1,rnd()<.5?'#00000014':'#ffffff0d');box(g,j,y,2,32,'#4a3d2b');for(const nx of [j-5,j+6])for(const ny of [y+7,y+24])box(g,(nx+128)%128,ny,2,2,'#3a3024');box(g,0,y,128,2,'#4a3d2b');box(g,0,y+2,128,1,'#a8946a');}
   speck(g,rnd,240,['#d8c48f55','#4a3d2b40','#b39a6a50']);
   if(variant===1){box(g,0,0,128,4,'#d9bd7a');speck(g,rnd,40,['#e9d295'],2,1);}
   if(variant===2){blob(g,64,66,40,20,'#b8944d50');blob(g,58,62,26,12,'#d0ad6260');for(let i=0;i<70;i++){const a=rnd()*6.28,r=rnd()*34;blob(g,64+Math.cos(a)*r*1.3,66+Math.sin(a)*r*.6,1.5,1,rnd()<.5?'#d8b66c':'#a88544');}}
  }
 });}
 function ceiling(level,variant=0){return surface('ceiling'+level+'-'+variant,(g,rnd)=>{
  if(level===0){
   // Brewhouse: concrete slab between dark joists; copper pipe runs and cable trays.
   box(g,0,0,128,128,'#33463f');speck(g,rnd,300,['#2a3a35','#3f554d','#00000020']);
   box(g,0,0,128,14,'#1b2826');box(g,0,14,128,2,'#41574f');box(g,0,12,128,2,'#111917');for(let x=8;x<128;x+=24)box(g,x,5,2,2,'#5d746b');
   if(variant===1)pipe(g,64,10,'#5a3218','#a8632f','#e5a265');
   if(variant===2)tray(g,40);
  }else if(level===1){
   // Packing: acoustic ceiling grid and galvanized duct runs.
   box(g,0,0,128,128,'#1f3440');for(let y=0;y<128;y+=32)for(let x=0;x<128;x+=32){box(g,x+2,y+2,29,29,'#30495a');box(g,x+2,y+2,29,1,'#3f5a6c');}speck(g,rnd,220,['#27404e','#3a5568']);
   if(variant===1){box(g,0,42,128,40,'#7e9099');box(g,0,42,128,4,'#a9b9bf');box(g,0,78,128,4,'#55666e');for(let x=0;x<128;x+=32)box(g,x,42,2,40,'#5f717a');}
   if(variant===2)tray(g,52);
  }else if(level===2){
   // Warehouse: corrugated steel deck on I-beams; red sprinkler mains.
   for(let x=0;x<128;x+=16){box(g,x,0,8,128,'#2b343d');box(g,x+8,0,8,128,'#222a32');box(g,x,0,1,128,'#3c4853');}
   box(g,0,0,128,13,'#171c21');box(g,0,13,128,2,'#3b4652');box(g,0,0,128,2,'#3b4652');
   if(variant===1){pipe(g,70,7,'#5e1a12','#9b2f22','#d4583f');box(g,62,77,5,6,'#c9b27a');}
   if(variant===2)tray(g,46);
  }else{
   // Malt house: dusty board ceiling with heavy timber beams.
   for(let x=0;x<128;x+=16){box(g,x,0,16,128,x%32?'#3b342b':'#363026');box(g,x,0,1,128,'#231e18');}
   speck(g,rnd,260,['#6e624c66','#231e1860']);
   box(g,0,0,128,18,'#2a231b');box(g,0,18,128,2,'#4a3f31');box(g,0,1,128,2,'#3d3328');
   if(variant===1)pipe(g,66,8,'#3a3f3f','#727b78','#a8b0a9');
   if(variant===2){box(g,60,0,3,128,'#1a1612');box(g,63,0,1,128,'#4a3f31');}
  }
 });}
 SceneArt.floor=floor;SceneArt.ceiling=ceiling;
})();
