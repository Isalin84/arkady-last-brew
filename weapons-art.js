/* Original layered Canvas artwork. Cached at 2x for crisp outlines; light comes from the upper left.
   Each weapon is split into back (sleeve, forearm, back of hand), item and front (fingers, thumb) so the throw animation can pull the item out of the hand. */
'use strict';
const WeaponArt=(()=>{
 const cache=[],layerCache=[],THUMB=[110,80,530,550];
 const SK={hi:'#f3cba2',lt:'#e1ab7e',md:'#c98e63',sh:'#9b6341',dk:'#6b412c',ol:'#46281c'};
 function rng(seed){return()=>(seed=(seed*16807)%2147483647)/2147483647;}
 function kit(g,flip=false){
  const grad=(x,y,w,h,colors)=>{const a=g.createLinearGradient(flip&&w?x+w:x,y,flip&&w?x:x+w,y+h);colors.forEach((col,i)=>a.addColorStop(i/(colors.length-1),col));return a;};
  const path=(d,color,stroke='#1e281f',width=3)=>{g.fillStyle=color;g.strokeStyle=stroke;g.lineWidth=width;const p=new Path2D(d);if(color!=='none')g.fill(p);if(width)g.stroke(p);};
  const oval=(x,y,rx,ry,color,stroke='#29352b',width=3,rot=0)=>{g.beginPath();g.ellipse(x,y,rx,ry,rot,0,Math.PI*2);g.fillStyle=color;g.fill();if(width){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}};
  const rect=(x,y,w,h,r,color,stroke='#29352b',width=3)=>{g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=color;g.fill();if(width){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}};
  const line=(x1,y1,x2,y2,color,width=1,alpha=1)=>{g.globalAlpha=alpha;g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.globalAlpha=1;};
  const curve=(d,color,width=1,alpha=1)=>{g.globalAlpha=alpha;g.strokeStyle=color;g.lineWidth=width;g.stroke(new Path2D(d));g.globalAlpha=1;};
  const text=(s,x,y,size,color='#f2dfab',font='Georgia')=>{g.font=`bold ${size}px ${font}`;g.fillStyle=color;g.textAlign='center';g.fillText(s,x,y);};
  const metal=(x,y,w,h)=>grad(x,y,w,h,['#33443e','#8fa397','#eef0cf','#9fb0a0','#5c6f66','#2c3b35']);
  const copper=(x,y,w,h)=>grad(x,y,w,h,['#3f2c20','#8d5532','#e0a468','#b9733e','#6c4126','#3a281c']);
  const wood=(x,y,w,h)=>grad(x,y,w,h,['#4b2f1d','#98643a','#c18853','#8a5731','#52331f']);
  const skinG=(x,y,w,h)=>grad(x,y,w,h,[SK.hi,SK.lt,SK.md,SK.sh]);
  return {grad,path,oval,rect,line,curve,text,metal,copper,wood,skinG};
 }
 // Weathered skin: tiny hair groups, pores and sun spots, kept inside the current clip.
 function hairs(g,k,x,y,w,h,count,seed,angle=.7){const r=rng(seed);g.save();g.lineCap='round';for(let i=0;i<count;i++){const px=x+r()*w,py=y+r()*h,len=3+r()*3.5,a=angle+(r()-.5)*.6;k.line(px,py,px+Math.cos(a)*len,py+Math.sin(a)*len,'#4a2c1e',.8,.42);}g.restore();}
 function spots(g,list){for(const [x,y,rx,ry] of list){g.fillStyle='#8c5a3f';g.globalAlpha=.45;g.beginPath();g.ellipse(x,y,rx,ry,.4,0,Math.PI*2);g.fill();g.globalAlpha=1;}}

 // Coat sleeve, rolled canvas cuff and forearm, drawn in a frame rotated along the arm (+x toward the elbow).
 function arm(g,k,flip){
  g.save();g.translate(352,300);g.rotate(.608);
  // coat sleeve
  k.path('M84 -49 Q150 -55 270 -68 L270 78 Q150 68 84 52 Z',k.grad(0,-60,0,125,['#6a7d62','#4d6044','#33432f','#1f2b22']),'#18211a',3);
  g.save();g.clip(new Path2D('M84 -49 Q150 -55 270 -68 L270 78 Q150 68 84 52 Z'));
  for(const [x,y,w] of [[104,-34,.9],[146,-40,.7],[198,-44,.6]])k.curve(`M${x} ${y} Q${x+34} ${y+40} ${x+8} ${y+92}`,'#0e170f',4,.35*w);
  for(const [x,y] of [[96,-30],[138,-36],[190,-40]])k.curve(`M${x-5} ${y} Q${x+28} ${y+36} ${x+4} ${y+88}`,'#b3c4a0',2,.3);
  g.globalAlpha=.2;g.fillStyle='#b97f2d';g.beginPath();g.ellipse(150,30,28,16,.4,0,7);g.fill();g.beginPath();g.ellipse(112,-20,12,7,.2,0,7);g.fill();g.globalAlpha=1;
  const r=rng(7);for(let i=0;i<110;i++){g.fillStyle=i%2?'#ffffff':'#000000';g.globalAlpha=.06;g.fillRect(84+r()*186,-60+r()*130,1.4,1.4);}g.globalAlpha=1;
  g.restore();
  // rolled canvas cuff: three stacked folds with stitching and fraying
  for(let i=0;i<3;i++){const x=46+i*16,sh=i*.06;
   k.rect(x,-47+i,22,95,9,k.grad(x,0,22,0,['#e8dcb0','#c9b987','#a5946a','#6d5e3d']),'#3c3220',2.5);
   k.curve(`M${x+8} -42 Q${x+13} 0 ${x+8} 44`,'#fff6d6',1.6,.45-sh);k.curve(`M${x+17} -40 Q${x+21} 0 ${x+17} 42`,'#40351f',1.4,.4);
   for(let y=-38;y<42;y+=9)k.line(x+4,y,x+7,y+3.5,'#6a5a38',1,.8);
  }
  k.curve('M44 -40 Q40 0 44 44','#2a2214',3,.5);
  k.line(98,-44,104,-40,'#9c8c60',1.2,.7);k.line(99,40,106,44,'#6f6038',1.2,.7);
  // forearm
  g.save();g.beginPath();g.rect(-40,-60,92,130);g.clip();
  k.path('M-40 -33 Q10 -35 54 -37 L54 40 Q10 38 -40 35 Z',k.grad(0,-37,0,76,[SK.hi,SK.lt,SK.md,SK.sh]),SK.ol,2.5);
  g.fillStyle=k.grad(36,0,18,0,['#00000000','#000000a0']);g.fillRect(36,-38,18,80);
  hairs(g,k,-30,-30,80,60,34,11,.15);
  k.curve('M-10 -8 Q22 -12 46 -2','#6d8a86',1.6,.28);k.curve('M0 8 Q24 10 44 18','#6d8a86',1.2,.2);
  spots(g,[[18,-12,2.2,1.5],[30,14,1.7,1.2],[2,19,2,1.4]]);
  g.restore();
  g.restore();
 }
 // Back of the hand: tendons, knuckles, hairs, age spots.
 function dorsum(g,k){
  const d='M304 257 Q320 243 346 252 Q368 258 378 270 L334 332 Q318 331 306 325 Q300 292 304 257 Z';
  k.path(d,k.grad(300,250,80,80,[SK.hi,SK.lt,SK.md,SK.sh]),SK.ol,0);
  g.save();g.clip(new Path2D(d));
  k.curve('M308 266 Q336 262 372 276','#fff2dc',3,.22);
  for(const [a,b,c,e] of [[310,272,356,276],[310,288,352,292],[309,304,348,308],[308,318,340,324]])k.curve(`M${a} ${b} Q${(a+c)/2} ${b-3} ${c} ${e}`,'#744a33',1.5,.4);
  k.curve('M312 280 Q336 284 360 296','#6d8a86',1.4,.22);
  hairs(g,k,310,254,70,76,26,3,.25);
  spots(g,[[332,274,2.4,1.7],[348,288,2,1.4],[326,302,1.8,1.3],[352,306,2.2,1.5]]);
  g.restore();
  g.strokeStyle=SK.ol;g.lineWidth=2.5;g.stroke(new Path2D('M378 270 Q368 258 346 252 Q320 243 304 257 Q300 292 306 325 Q318 331 334 332'));
 }
 // The hand is drawn slightly oversized around the knuckles so the fist reads as gripping, not touching.
 const HS=1.14,scaled=(g,fn)=>{g.save();g.translate(318,290);g.scale(HS,HS);g.translate(-318,-290);fn();g.restore();};
 function back(g,i){
  scaled(g,()=>{const k=kit(g);arm(g,k);dorsum(g,k);});
  if(i>=2){g.save();g.translate(i===2?100:62,i===2?292:298);g.scale(-1,1);g.translate(-306,-286);scaled(g,()=>{const k2=kit(g,true);arm(g,k2,true);dorsum(g,k2);});g.restore();}
 }
 // Four wrapped fingers with joints, nails and dirt plus the thumb across the top.
 function fist(g,k,tips,thumbTip){
  const r=rng(23);
  for(let i=0;i<4;i++){
   const yc=272+i*14.5,t=19-i*.8,tip=tips[i],x=tip,w=324-tip;
   g.save();g.shadowColor='#2a150c88';g.shadowBlur=5;g.shadowOffsetY=2;
   k.rect(x,yc-t/2,w,t,t/2,k.grad(0,yc-t/2,0,t,[SK.hi,SK.lt,SK.md,SK.sh]),SK.ol,2.2);g.restore();
   g.save();g.beginPath();g.roundRect(x,yc-t/2,w,t,t/2);g.clip();
   const pip=tip+26,dip=tip+12;
   for(const jx of [pip,pip+3])k.curve(`M${jx} ${yc-t/2} Q${jx-2.5} ${yc} ${jx} ${yc+t/2}`,'#6b422d',1.3,.7);
   k.curve(`M${pip-6} ${yc-t/2+2} Q${pip-8} ${yc} ${pip-6} ${yc+t/2-2}`,'#fff0d6',1.2,.35);
   k.curve(`M${dip} ${yc-t/2+3} Q${dip-1.5} ${yc} ${dip} ${yc+t/2-3}`,'#7d523a',1,.4);
   k.curve(`M${x+10} ${yc-t/2+3.5} L${x+w-8} ${yc-t/2+3.5}`,'#fff2dc',1.8,.4);
   hairs(g,k,pip+4,yc-t/2+1,28,t-3,6,31+i,.1);
   g.restore();
   // knuckle bump where the finger meets the hand
   k.oval(304,yc,7.5,t/2-.5,k.grad(297,yc-8,14,16,[SK.lt,SK.md,SK.sh]),SK.sh,.9);k.curve(`M299.5 ${yc-4.5} Q304 ${yc-7} 308.5 ${yc-4.5}`,'#fff2dc',1.2,.45);
   // nail: pale, thick, with a rim of grime
   k.rect(x+2,yc-t/2+3.5,12-i*.5,t-7,3.5,'#e9c4a8','#8f5a40',1.2);k.line(x+5,yc-t/2+5.5,x+11,yc-t/2+5.5,'#fff7ea',1.4,.8);k.line(x+3,yc+t/2-5.2,x+3,yc-t/2+5,'#4e3626',1.3,.9);
  }
  // thumb: a brush of overlapping discs gives a rounded, tapering digit with soft light and shade
  const [tx,ty]=thumbTip,cx=(338+tx)/2+6,cy=Math.min(ty,262)-12,N=30,pts=[];
  for(let n=0;n<=N;n++){const t=n/N,u=1-t;pts.push({x:u*u*338+2*u*t*cx+t*t*tx,y:u*u*268+2*u*t*cy+t*t*ty,r:16-5.5*t+Math.sin(t*3.14)*1.6});}
  const stamp=(dx,dy,rk,color,alpha)=>{g.globalAlpha=alpha;g.fillStyle=color;for(const q of pts){g.beginPath();g.arc(q.x+dx,q.y+dy,q.r*rk,0,7);g.fill();}g.globalAlpha=1;};
  g.save();g.shadowColor='#2a150c99';g.shadowBlur=6;g.shadowOffsetY=2.5;stamp(0,0,1.1,SK.ol,1);g.restore();
  stamp(0,0,1,SK.md,1);stamp(1.5,4,.8,SK.sh,.1);stamp(-.5,-3.5,.72,SK.lt,.18);stamp(-1.5,-5,.45,SK.hi,.2);stamp(-2,-6,.2,'#fff4e0',.16);
  const mx=(338+tx)/2+10,my=(ty+262)/2-4,tip=pts[N],ang=Math.atan2(ty-cy,tx-cx);
  for(const jx of [mx,mx+3])k.curve(`M${jx} ${my-9} Q${jx-3} ${my} ${jx} ${my+9}`,'#6b422d',1.3,.7);
  g.save();g.translate(tip.x+2,tip.y);g.rotate(ang);k.rect(-9,-6.5,15,13,5.5,'#ecc9ae','#8f5a40',1.3);k.line(-6,-3.5,2,-3.5,'#fff7ea',1.5,.8);k.line(-8,5,4,5,'#4e3626',1.2,.9);g.restore();
  hairs(g,k,mx+4,my-12,34,10,9,57,.1);
 }
 function front(g,i){
  scaled(g,()=>fist(g,kit(g),[256,252,258,266],[266,248]));
  if(i>=2){g.save();g.translate(i===2?100:62,i===2?292:298);g.scale(-1,1);g.translate(-306,-286);scaled(g,()=>fist(g,kit(g,true),[262,258,264,272],[272,254]));g.restore();}
 }

 // ---- held items ----
 function bottle(g,k){
  g.save();g.translate(252,270);g.rotate(-.17);g.translate(-228,-278);
  const body='M201 55 L237 55 L239 115 Q242 130 256 143 Q271 155 270 177 L270 286 Q269 304 251 307 L191 307 Q174 306 173 289 L173 177 Q173 156 188 143 Q201 133 200 115 Z';
  // soft contact shadow behind the glass
  g.save();g.globalAlpha=.25;g.translate(5,7);k.path(body,'#000','#000',0);g.restore();
  k.path(body,k.grad(172,0,101,0,['#0e2218','#2d5430','#6f9548','#2a5232','#0b1f16']),'#10201a',3);
  g.save();g.clip(new Path2D(body));
  // beer through the glass: amber column with a creamy meniscus
  k.path('M181 150 L262 150 L262 300 L181 300 Z',k.grad(180,0,86,0,['#5a4a12','#c9a03c','#e0b955','#92701f','#3f3410']),'#0000',0);
  k.path('M178 148 Q221 140 266 148 L266 160 Q221 152 178 160 Z','#f3ecc4','#0000',0);
  g.globalAlpha=.55;for(let b=0;b<16;b++){const bx=186+((b*37)%70),by=170+((b*53)%120);k.oval(bx,by,1.3+(b%3)*.5,1.3+(b%3)*.5,'#f6e7a0','#0000',0);}g.globalAlpha=1;
  // glass shading: dark rims, bright specular strips on the lit left side
  k.path('M174 160 L190 160 L190 306 L174 306 Z',k.grad(172,0,18,0,['#06120c88','#06120c00']),'#0000',0);
  k.path('M252 160 L270 160 L270 306 L252 306 Z',k.grad(250,0,22,0,['#06120c00','#06120caa']),'#0000',0);
  k.path('M181 175 Q179 230 182 288 L189 289 Q186 230 189 176 Z','#e7f6dc66','#0000',0);
  k.path('M207 66 L213 66 L213 124 Q211 138 196 152 L192 175 L188 174 L192 150 Q205 138 207 122 Z','#dff2d488','#0000',0);
  k.path('M258 178 L262 178 L262 280 L258 280 Z','#c9ecb133','#0000',0);
  g.restore();
  k.path(body,'none','#10201a',3);
  // neck label and crown cap
  k.rect(197,92,46,30,2,k.grad(0,92,0,30,['#e8d594','#cdb26a','#a98f4d']),'#6d5a2b',1.5);k.text('№ 7',220,113,13,'#2a3f2a');
  k.path('M199 52 L241 52 L243 62 L197 62 Z',k.grad(196,0,48,0,['#7a4a22','#d9a05a','#f3cf8c','#a56a32','#5e3a1c']),'#3b2412',2);
  for(let x=200;x<241;x+=3.4)k.line(x,52,x+.4,62,'#4c2e17',1,.55);
  k.oval(220,52,21,4,k.grad(199,0,42,0,['#a56a32','#f3cf8c','#9a6130']),'#3b2412',1.5);
  // paper label with printed border, slightly curved
  const lab='M176 168 Q221 175 268 167 L268 238 Q221 247 176 238 Z';
  k.path(lab,'#efdfae','#8e7b45',1.5);
  k.path('M180 174 Q221 180 264 173 L264 232 Q221 240 180 232 Z',k.grad(0,174,0,60,['#2c5a40','#244a35','#1d3d2b']),'#c6ad6c',1.4);
  g.fillStyle='#ffffff';g.globalAlpha=.07;g.beginPath();g.moveTo(180,174);g.quadraticCurveTo(221,180,264,173);g.lineTo(264,190);g.quadraticCurveTo(221,197,180,190);g.fill();g.globalAlpha=1;
  k.text('ХМЕЛЬНОЙ ДОЗОР',221,189,6.6,'#ead9a5');k.text('СМЕНА №7',221,210,12.5,'#f6e6b0');k.text('IPA',221,229,17,'#f6e6b0');
  k.line(186,193,256,193,'#ead9a5',.8,.7);
  for(const [x,y] of [[244,158],[253,172],[191,284],[195,164]])k.oval(x,y,2,3,'#e8edbf88','#0000',0);
  g.restore();
 }
 function can(g,k){
  g.save();g.translate(250,266);g.rotate(-.12);g.translate(-228,-274);
  g.save();g.globalAlpha=.25;k.rect(168,136,119,170,15,'#000','#000',0);g.restore();
  const body=()=>{g.beginPath();g.roundRect(163,129,119,170,15);};
  body();g.fillStyle=k.metal(163,0,119,0);g.fill();g.strokeStyle='#202a26';g.lineWidth=3;g.stroke();
  g.save();body();g.clip();
  // printed wrap: dark stout with golden foil band
  k.path('M163 150 L282 150 L282 278 L163 278 Z',k.grad(163,0,119,0,['#17120f','#6a4330','#7d5238','#3c2a1e','#150f0c']),'#0000',0);
  k.path('M163 150 L282 150 L282 156 L163 156 Z','#d9ad62','#0000',0);k.path('M163 272 L282 272 L282 278 L163 278 Z','#d9ad62','#0000',0);
  k.path('M163 156 L282 156 L282 160 L163 160 Z','#3a2a1e','#0000',0);
  g.globalAlpha=.16;g.fillStyle='#ffe9b0';for(let a=0;a<12;a++){g.beginPath();g.moveTo(223,214);g.arc(223,214,100,a*Math.PI/6,a*Math.PI/6+.13);g.fill();}g.globalAlpha=1;
  k.text('ХМЕЛЬНОЙ ДОЗОР',223,172,8,'#f0dca4');k.text('КОТЁЛ',223,200,24,'#f6e3a8');k.text('13',223,236,38,'#f2c96b');k.text('ТЁМНЫЙ СТАУТ',223,252,8,'#e3cf9a');k.text('0,5 Л • НОЧНАЯ ВАРКА',223,265,6,'#d9c68e');
  // condensation and dents
  k.path('M169 146 L181 147 L181 278 L170 276 Z','#f1e8c333','#0000',0);
  k.path('M262 160 L278 160 L278 272 L262 272 Z',k.grad(260,0,20,0,['#00000000','#000000aa']),'#0000',0);
  g.globalAlpha=.5;for(const [x,y,r] of [[253,188,2],[266,228,2.4],[183,218,2],[252,262,2.2],[186,168,1.8],[240,205,1.6]])k.oval(x,y,r*.7,r*1.5,'#e6efe0','#0000',0);g.globalAlpha=1;
  g.restore();
  // lid: stepped rim, countersunk centre, pull ring and tab
  k.oval(223,131,57,14,k.grad(165,0,116,0,['#4a5b54','#b4c3b3','#f0f2d2','#8b9d90','#44564d']),'#202a26',2.5);
  k.oval(223,132,48,9.5,'#a0aa9a','#d4d8b8',1);k.oval(223,133,40,6.5,'#7f8c80','#4a574f',1);
  k.path('M200 129 Q223 120 246 129 Q250 134 244 136 L204 136 Q197 134 200 129 Z',k.grad(200,0,50,0,['#9aa597','#e8ecce','#8a988b']),'#3f4d46',1.2);
  k.oval(213,129,10,4.4,'#2b3a33','#e7ead0',1.2);k.oval(237,135,7,3,'#1e2a25','#6e7b69',1);
  k.oval(223,298,53,9,k.grad(165,0,116,0,['#4a5b54','#b4c3b3','#8b9d90','#44564d']),'#202a26',2.5);
  g.restore();
 }
 // Cork launcher: compact copper receiver, wooden grip, short flared barrel and a drum of corks.
 function corker(g,k){
  const shade=(x,y,w,h,a=.3)=>{g.globalAlpha=a;g.fillStyle='#000';g.fillRect(x,y,w,h);g.globalAlpha=1;};
  // wooden grip and fore-end
  k.path('M232 244 L292 234 Q304 290 308 340 L252 352 Q246 296 232 244 Z',k.wood(232,0,76,0),'#2a1810',3);
  for(let y=258;y<342;y+=9)k.curve(`M${240+ (y-258)*.1} ${y} Q${266} ${y-4} ${296+(y-258)*.12} ${y-8}`,'#2d1a0f',1,.45);
  k.rect(108,214,66,92,10,k.wood(108,0,66,0),'#2a1810',3);for(let y=226;y<300;y+=11)k.curve(`M114 ${y} Q140 ${y-3} 168 ${y}`,'#2d1a0f',1,.45);
  g.save();g.translate(0,-22);
  // barrel with wire-wound spring and flared brass muzzle
  k.rect(192,92,50,86,5,k.metal(192,0,50,0),'#1f2a26',2.8);
  for(let y=104;y<170;y+=8)k.curve(`M192 ${y} Q217 ${y+5} 242 ${y}`,'#26332d',2.2,.8);
  k.path('M186 94 L248 94 L254 70 L180 70 Z',k.copper(180,0,74,0),'#2e1d12',2.8);
  k.oval(217,70,37,12,k.copper(180,0,74,0),'#2e1d12',2.6);k.oval(217,71,28,8.5,'#150d09','#d9b87a',1.6);
  k.oval(217,73,15,5,'#d2a468','#6b4426',1.4);k.oval(214,72,7,2.3,'#efd096','#0000',0);
  k.rect(212,58,10,14,2,k.metal(212,0,10,0),'#1f2a26',2);
  // receiver block with rivets, plate and cocking lever
  k.rect(150,168,128,86,14,k.copper(150,0,128,0),'#2e1d12',3);
  k.path('M158 176 L270 176','none','#f0cf95',1.6);
  k.rect(168,206,92,32,4,'#22402f','#d8bd78',2);k.text('ПРОБКОМЁТ',214,228,12.5,'#f0dfa8');
  for(const [x,y] of [[160,182],[268,182],[160,246],[268,246]]){k.oval(x,y,4.2,4.2,'#e7c98a','#4a3a20',1.2);k.line(x-2.5,y,x+2.5,y,'#5a4527',1.1);}
  k.line(279,198,300,198,'#2f2a22',4);k.oval(304,198,7,7,k.metal(297,191,14,14),'#1f2a26',2);
  // drum magazine: brass-rimmed disc with a ring of corks
  g.save();g.globalAlpha=.3;k.oval(138,186,53,53,'#000','#000',0);g.restore();
  k.oval(134,180,53,53,k.grad(80,127,106,106,['#f2d398','#b9843f','#6c4524']),'#2e1d12',3);
  k.oval(134,180,45,45,k.grad(90,135,90,90,['#3a4a43','#1c2824']),'#0b1411',2);
  for(let n=0;n<7;n++){const a=n*Math.PI*2/7-.4,cx=134+Math.cos(a)*29,cy=180+Math.sin(a)*29;k.oval(cx,cy,10.5,10.5,'#1a2420','#5a6a60',1.5);k.oval(cx-.5,cy-.5,8,8,k.grad(cx-8,cy-8,16,16,['#e6c389','#c39a5e','#8a6338']),'#5c3f20',1.2);k.oval(cx-2.5,cy-2.5,2,1.4,'#f6dfb0','#0000',0);k.oval(cx+2,cy+2,.9,.9,'#7a5632','#0000',0);}
  k.oval(134,180,11,11,k.metal(123,170,22,22),'#1b2420',2);k.line(129,180,139,180,'#2a352f',2);k.line(134,175,134,185,'#2a352f',2);
  k.curve('M92 156 Q104 138 126 133','#fff4d2',2.6,.5);
  // bracket joining the drum to the receiver
  k.rect(172,176,24,18,3,k.metal(172,0,24,0),'#1f2a26',2);
  g.restore();
 }
 // Foam cannon: wide copper trumpet, steel body, hose and a tall pressure tank.
 function foamer(g,k){
  // tank
  g.save();g.globalAlpha=.3;k.rect(66,126,66,184,26,'#000','#000',0);g.restore();
  k.rect(60,118,66,184,26,k.grad(60,0,66,0,['#0f2c21','#2d6a4f','#8cc6a2','#3b7c5c','#0e2a1f']),'#0b1a14',3);
  k.oval(93,121,31,11,k.metal(62,0,62,0),'#1b2420',2.4);
  k.rect(83,96,21,26,4,k.copper(83,0,21,0),'#2e1d12',2.4);k.oval(93,95,13,5,k.copper(80,0,26,0),'#2e1d12',2);
  k.path('M64 144 L122 144 L122 150 L64 150 Z','#243a2f','#0b1a14',1);k.path('M64 262 L122 262 L122 268 L64 268 Z','#243a2f','#0b1a14',1);
  k.rect(66,176,54,58,3,k.grad(0,176,0,58,['#efe3b3','#d7c996']),'#6a5d34',1.4);k.text('ПЕНА',93,198,12.5,'#2c4838');k.text('ПОД',93,212,7,'#2c4838');k.text('ДАВЛЕНИЕМ',93,224,6.4,'#2c4838');
  k.path('M68 128 L77 128 L77 292 L70 290 Z','#e9f6e255','#0000',0);
  // hose from the valve into the body, plus a loop that hangs in front
  g.save();g.lineCap='round';for(const [d,w] of [['M93 96 C92 40 160 40 186 126',13],['M180 236 C160 296 128 330 96 316',13]]){g.strokeStyle='#0b1411';g.lineWidth=w+4;g.stroke(new Path2D(d));g.strokeStyle='#27362d';g.lineWidth=w;g.stroke(new Path2D(d));g.strokeStyle='#59705f';g.lineWidth=3;g.save();g.translate(-2,-2);g.stroke(new Path2D(d));g.restore();}g.restore();
  for(const [x,y,a] of [[103,64,-.5],[160,72,.6],[184,246,2.1]]){g.save();g.translate(x,y);g.rotate(a);k.rect(-9,-8,18,16,3,k.copper(-9,0,18,0),'#2e1d12',1.8);g.restore();}
  // wooden-handled grip
  k.path('M232 246 L292 236 Q304 292 308 340 L252 352 Q246 298 232 246 Z',k.grad(232,0,76,0,['#0d1814','#2e4a3c','#456b57','#1d3329']),'#0a130f',3);
  for(let y=262;y<340;y+=12)k.curve(`M${240+(y-262)*.1} ${y} L${300+(y-262)*.1} ${y-10}`,'#0a130f',1.6,.55);
  g.save();g.translate(0,-16);
  // main steel body with copper bands
  k.rect(172,150,80,108,12,k.metal(172,0,80,0),'#1f2a26',3);
  for(const y of [166,226])k.rect(170,y,84,13,3,k.copper(170,0,84,0),'#2e1d12',2);
  // big flared nozzle with a foam plug in the mouth
  k.path('M182 154 L146 80 Q215 60 284 80 L248 154 Z',k.copper(142,0,146,0),'#2e1d12',3);
  for(const [y,w] of [[108,.5],[130,.78]]){const f=1-(y-80)/74,l=182-36*f,rr=248+36*f;k.curve(`M${l} ${y} Q215 ${y+7} ${rr} ${y}`,'#2e1d12',2,.8);k.curve(`M${l+2} ${y-3} Q215 ${y+4} ${rr-2} ${y-3}`,'#f4cf98',1.4,.55);}
  k.oval(215,80,70,17.5,k.copper(142,0,146,0),'#2e1d12',3);k.oval(215,82,59,12.5,'#1a110b','#e0b678',2);
  for(const [x,y,r] of [[192,84,10],[215,81,12],[238,84,10],[204,78,7.5],[227,78,7.5],[215,75,5.5]])k.oval(x,y,r,r*.7,k.grad(x-r,y-r,r*2,r*2,['#fffaea','#efe3c2']),'#cfc09a',1);
  // gauge and valve wheel
  k.oval(266,172,22,22,'#b8905a','#2e1d12',2.4);k.oval(266,172,17.5,17.5,'#e9e1b8','#6d5a34',1.2);
  for(let a=-2.7;a<.7;a+=.5){const x=266+Math.cos(a)*13.5,y=172+Math.sin(a)*13.5;k.line(x,y,x-Math.cos(a)*3.6,y-Math.sin(a)*3.6,'#344738',1.6);}
  k.line(266,172,277,162,'#a7563d',2);k.oval(266,172,2.6,2.6,'#354638','#0000',0);
  k.oval(150,208,15,15,k.copper(135,193,30,30),'#2e1d12',2.4);for(let a=0;a<6;a++)k.line(150,208,150+Math.cos(a*1.047)*14,208+Math.sin(a*1.047)*14,'#2e1d12',2);
  g.restore();
 }
 function item(g,i){const k=kit(g);[bottle,can,corker,foamer][i](g,k);}
 function make(){const c=document.createElement('canvas');c.width=960;c.height=800;const g=c.getContext('2d');g.scale(2,2);g.lineJoin='round';g.lineCap='round';return {c,g};}
 function full(i){const {c,g}=make();back(g,i);item(g,i);front(g,i);return c;}
 function layerSet(i){const b=make(),m=make(),f=make();back(b.g,i);item(m.g,i);front(f.g,i);return {back:b.c,item:m.c,front:f.c};}
 return {
  get(i){return cache[i]??=full(i);},
  // Separate hand and item canvases (same 960x800 frame) for the throw animation.
  layers(i){return layerCache[i]??=layerSet(i);},
  thumbRect(i){return THUMB;}
 };
})();
