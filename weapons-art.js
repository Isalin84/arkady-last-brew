/* Original layered Canvas artwork. Cached at 2x for crisp outlines and glass/metal shading. */
'use strict';
const WeaponArt=(()=>{
 const cache=[];
 function create(index){
  const c=document.createElement('canvas');c.width=960;c.height=800;const g=c.getContext('2d');g.scale(2,2);
  g.lineJoin='round';g.lineCap='round';
  const grad=(x,y,w,h,colors)=>{const a=g.createLinearGradient(x,y,x+w,y+h);colors.forEach((col,i)=>a.addColorStop(i/(colors.length-1),col));return a;};
  const path=(d,color,stroke='#20281f',width=3)=>{g.fillStyle=color;g.strokeStyle=stroke;g.lineWidth=width;const p=new Path2D(d);g.fill(p);if(width)g.stroke(p);};
  const oval=(x,y,rx,ry,color,stroke='#29352b',width=3)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=color;g.fill();if(width){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}};
  const rect=(x,y,w,h,r,color,stroke='#29352b',width=3)=>{g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=color;g.fill();if(width){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}};
  const text=(s,x,y,size,color='#f2dfab',font='Georgia')=>{g.font=`bold ${size}px ${font}`;g.fillStyle=color;g.textAlign='center';g.fillText(s,x,y);};
  const metal=(x,y,w,h)=>grad(x,y,w,h,['#3f514b','#a7b8a5','#eff0c9','#7e9386','#34463e']);
  const copper=(x,y,w,h)=>grad(x,y,w,h,['#493629','#9f653a','#e2aa69','#b77a43','#694329']);
  const skin=grad(230,260,100,60,['#9a6240','#d69c68','#efc491','#ba8056']);
  // Canvas work coat, rolled sleeve, weathered wrist.
  path('M284 307 L350 291 Q389 321 433 400 L277 400 L252 351 Z',grad(260,300,150,70,['#384c3c','#77836a','#293d30']));
  path('M267 307 L333 286 L362 324 L283 354 Z','#b9aa85');
  for(let i=0;i<5;i++)path(`M${278+i*12} 314 l22 29 l5 -2 l-22 -29 Z`,'#d7c8a0','#d7c8a0',0);
  path('M250 305 Q236 282 251 256 L287 247 Q311 248 328 274 L335 295 L278 329 Z',skin);
  if(index===0){
   g.save();g.translate(228,278);g.rotate(-.17);g.translate(-228,-278);
   // Rounded green bottle, thick bottom and amber beer shining through.
   path('M201 55 L237 55 L239 115 Q242 130 256 143 Q271 155 270 177 L270 286 Q269 304 251 307 L191 307 Q174 306 173 289 L173 177 Q173 156 188 143 Q201 133 200 115 Z',grad(172,0,101,0,['#142e22','#3b6335','#658641','#23472d','#10291e']));
   path('M183 177 L183 282 Q185 294 195 295 L249 295 Q260 293 261 282 L261 177 Z',grad(180,0,86,0,['#4c541e','#b29136','#516123','#273d20']),'#0000',0);
   path('M207 70 L214 70 L213 125 Q211 139 194 155 L190 182 L183 183 Q182 156 200 139 Q207 131 207 114 Z','#bcd5a488','#0000',0);
   rect(196,46,47,17,3,copper(196,46,47,0));for(let x=201;x<242;x+=6)rect(x,47,2,14,0,'#f8d895','#0000',0);
   rect(198,79,43,35,2,'#d6b770');text('№ 7',219,102,13,'#30442a');
   path('M176 187 Q221 193 268 186 L268 261 Q221 270 176 261 Z','#ead9a5');
   path('M180 194 Q221 200 264 194 L264 255 Q221 263 180 255 Z','#244a35','#bba167',1);
   text('ХМЕЛЬНОЙ ДОЗОР',221,207,8);text('СМЕНА №7',221,228,14);text('IPA',221,248,19);
   for(let [x,y] of [[244,158],[253,174],[191,272],[252,281],[195,165]]){oval(x,y,2,3,'#e8edbf88','#0000',0);}
   path('M180 276 L180 291 Q188 301 200 299 L247 299','#a0b57588','#0000',0);
   g.restore();
  }else if(index===1){
   g.save();g.translate(228,274);g.rotate(-.12);g.translate(-228,-274);
   rect(163,129,119,170,15,metal(163,0,119,0));
   rect(165,150,115,126,2,grad(165,0,115,0,['#211f20','#644230','#35291f','#1c2420']));
   oval(223,131,57,14,metal(165,0,110,0));oval(223,131,48,9,'#9ba596','#d4d8b8',1);
   oval(228,130,12,7,'#27372e');oval(217,128,12,6,'#d8d9b9','#6e7b69',2);
   text('ХМЕЛЬНОЙ ДОЗОР',223,171,9);text('КОТЁЛ',223,200,24);text('13',223,239,38);text('ТЁМНЫЙ СТАУТ',223,256,8);text('0,5 Л • НОЧНАЯ ВАРКА',223,269,6);
   path('M170 148 L180 149 L180 276 L171 274 Z','#e5d9ad22','#0000',0);
   oval(223,296,53,9,metal(163,0,110,0));
   for(let [x,y] of [[253,188],[263,228],[183,218],[252,263],[185,168]])oval(x,y,2,4,'#e1e5c688','#0000',0);
   g.restore();
  }else{
   // Two-handed pressure tool: heavy copper receiver, steel muzzle, hoses and gauges.
   path('M186 269 Q140 299 129 356 L97 400 L161 400 L203 314 Z',skin);
   path('M108 343 L146 365 L137 400 L61 400 Z','#536b51');
   path('M197 254 L220 309 L272 302 L263 240 Z',grad(194,0,75,0,['#33291f','#7b5837','#422d22']));
   for(let y=261;y<299;y+=9)path(`M218 ${y} l36 -6 l2 3 l-36 6 Z`,'#b18a53','#0000',0);
   path('M255 253 Q296 247 291 282 Q286 294 267 288 L272 279 Q283 281 282 269 Q281 260 258 265 Z',metal(255,250,45,30));
   rect(143,200,169,73,15,copper(140,200,0,75));
   rect(178,156,98,63,9,metal(178,156,98,0));
   path('M176 165 L191 76 L239 76 L271 166 Z',copper(175,76,95,0));
   rect(187,65,58,26,5,metal(187,65,58,0));
   oval(216,64,29,15,metal(188,0,59,0));oval(216,64,19,9,'#172b24','#d3c997',2);oval(216,65,12,5,'#070f0c','#0000',0);
   for(let y=105;y<158;y+=15)path(`M183 ${y} L252 ${y+2} L256 ${y+9} L181 ${y+7} Z`,metal(181,y,74,0));
   rect(167,220,103,31,4,'#274939','#d8bd78',2);text(index===2?'ПРОБКОМЁТ':'ПЕНОГАСИТЕЛЬ',219,239,index===2?11:9);
   for(let [x,y] of [[153,216],[299,216],[154,258],[299,258]]){oval(x,y,4,4,'#ddbf83','#463d2a',1);path(`M${x-2} ${y}h4`,'#6d593a','#6d593a',1);}
   oval(294,180,25,25,'#b48b54');oval(294,180,20,20,'#e4dcb2');
   for(let a=-2.7;a<.7;a+=.5){let x=294+Math.cos(a)*16,y=180+Math.sin(a)*16;path(`M${x} ${y}l${Math.cos(a)*-4} ${Math.sin(a)*-4}`,'#344738','#344738',2);}
   path('M294 180 L305 169','#a7563d','#a7563d',2);oval(294,180,3,3,'#354638');text('BAR',293,192,5,'#40523f');
   if(index===3){
    rect(85,145,57,133,17,grad(85,0,57,0,['#234b3b','#709378','#aac6a0','#315c43']));
    oval(113,146,24,10,metal(85,0,57,0));rect(106,121,15,22,3,copper(106,121,15,0));
    path('M114 124 Q108 95 141 102 Q166 105 172 146 L184 162','transparent','#c0ae76',9);
    rect(87,182,53,57,3,'#e4dbad');text('ПЕНА',113,207,11,'#365341');text('ПОД',113,220,7,'#365341');text('ДАВЛЕНИЕМ',113,230,6,'#365341');
    path('M309 249 Q375 288 347 342 Q333 359 299 332','transparent','#172a21',16);
    path('M309 249 Q375 288 347 342 Q333 359 299 332','transparent','#8b9c77',7);
   }else{
    rect(110,183,43,69,6,copper(110,0,43,0));text('CO₂',131,220,14);
    for(let y=190;y<246;y+=14)rect(111,y,40,3,0,'#e3c38b','#0000',0);
   }
  }
  // Fingers wrap around the object, never hidden behind the label.
  for(let i=0;i<4;i++){
   const y=263+i*14;
   rect(253+i*2,y,53-i*3,18,8,grad(250,y,0,18,['#e4b27e','#c18a59','#915d3e']),'#694931',2);
   path(`M266 ${y+5}l14 0`,'#f4c993','#f4c993',1);
   path(`M289 ${y+7}l4 4`,'#91633f','#91633f',1);
  }
  // Small age spots and wrist creases.
  for(let [x,y] of [[296,322],[306,326],[300,315]])oval(x,y,1.5,1,'#86583e','#0000',0);
  path('M284 325 Q296 338 314 328','transparent','#a3724c',1);
  return c;
 }
 return {get(i){return cache[i]??=create(i);}};
})();
