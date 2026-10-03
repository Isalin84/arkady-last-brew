'use strict';
// World renderer: a software framebuffer (textured walls, floor and ceiling, baked lightmap, fog, billboards, particles) scaled onto the 960×470 view.
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d',{alpha:false});
const W=960,H=540,VIEW=470,FOV=Math.PI/3;
const Renderer=(()=>{
 const PLANE=Math.tan(FOV/2),QUALITY={high:[640,313],medium:[480,235],low:[320,157]},STEPS=['high','medium','low'];
 const depth=new Float32Array(W),stats={rasterMs:0,presentMs:0,avg:0,quality:'',w:0,h:0},current={index:0,level:null,map:null},debug={noShade:false};
 const now=()=>performance.now();let V=null;
 function makeTexture(kind){let c=document.createElement('canvas');c.width=c.height=128;let g=c.getContext('2d');g.fillStyle=kind===2?'#a66436':kind===3?'#335a3c':'#797663';g.fillRect(0,0,128,128);if(kind===1){for(let y=0;y<128;y+=24){g.fillStyle='#3f493d';g.fillRect(0,y,128,3);for(let x=(y/24%2)*32;x<128;x+=64)g.fillRect(x,y,3,24);g.fillStyle='#b5a789';g.fillRect(0,y+3,128,1);}g.fillStyle='#384a3b';g.fillRect(0,88,128,40);g.fillStyle='#d7bb70';g.fillRect(0,87,128,3);}else if(kind===2){let grad=g.createLinearGradient(0,0,128,0);grad.addColorStop(0,'#4d3828');grad.addColorStop(.35,'#c89155');grad.addColorStop(.55,'#dfaa65');grad.addColorStop(1,'#613d28');g.fillStyle=grad;g.fillRect(0,0,128,128);for(let y of [12,98]){g.fillStyle='#423f30';g.fillRect(0,y,128,7);g.fillStyle='#c1b987';g.fillRect(0,y,128,2);for(let x=8;x<128;x+=23){g.fillStyle='#e1c488';g.fillRect(x,y+2,3,3);}}g.fillStyle='#314331';g.fillRect(30,38,68,39);g.strokeStyle='#ddc386';g.strokeRect(33,41,62,33);g.fillStyle='#e9d6a1';g.font='bold 16px monospace';g.textAlign='center';g.font='bold 9px monospace';g.fillText('ХМЕЛЬНОЙ',64,53);g.fillText('ДОЗОР',64,63);g.font='8px monospace';g.fillText('TANK 04',64,71);g.fillStyle='#413e2e';g.fillRect(60,109,12,19);}else{g.fillStyle='#1d3427';g.fillRect(8,5,112,123);g.strokeStyle='#d8c88a';g.strokeRect(12,10,104,114);g.fillStyle='#c8d994';g.font='bold 20px monospace';g.fillText('EXIT',38,52);g.font='30px monospace';g.fillText('→',49,90);}let seed=31;for(let i=0;i<1800;i++){seed=(seed*16807)%2147483647;let x=seed%128;seed=(seed*16807)%2147483647;let y=seed%128;g.fillStyle=i%2?'#ffffff0c':'#00000012';g.fillRect(x,y,1,1);}return c;}
 const textures=[null,makeTexture(1),makeTexture(2),makeTexture(3)];
 // Branded walls are wider than tall (≈226×128) so one texel is square on screen and the round studio logo stays round and sharp.
 const TEXEL_ASPECT=W/(2*PLANE)/VIEW,BRAND_W=Math.round(128*TEXEL_ASPECT);
 function brandWall(src){const c=document.createElement('canvas');c.width=BRAND_W;c.height=128;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,0,0,BRAND_W,128);return c;}
 const studioWall=brandWall(textures[1]),studioPackWall=brandWall(SceneArt.packWall),studioWarehouseWall=brandWall(SceneArt.warehouseWall),studioMaltWall=brandWall(SceneArt.maltWall),studioLogo=document.createElement('img');
 studioLogo.onload=()=>{for(const wall of [studioWall,studioPackWall,studioWarehouseWall,studioMaltWall]){const g=wall.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(studioLogo,BRAND_W/2-42,22,84,84);invalidate(wall);}};
 studioLogo.src='assets/art/brand/logo.png';
 function wallTexture(tile,x,y){
  const levelIndex=current.index,level=current.level||{};
  if(tile===4)return SceneArt.rack;
  if(tile===5)return SceneArt.siloWall;
  if((levelIndex===2||levelIndex===3)&&tile===3)return SceneArt.maltDoor;
  if(tile===2)return SceneArt.wall((x+y)%3);
  if(tile===1){
   const branded=(level.logoWalls||[]).some(([lx,ly])=>x===lx&&y===ly);
   if(levelIndex===1)return branded?studioPackWall:SceneArt.packWall;
   if(levelIndex===2)return branded?studioWarehouseWall:SceneArt.warehouseWall;
   if(levelIndex===3)return branded?studioMaltWall:SceneArt.maltWall;
   if(branded)return studioWall;
  }
  return textures[tile]||textures[1];
 }
 function sprite(type){let c=document.createElement('canvas');c.width=c.height=128;let g=c.getContext('2d');g.lineWidth=4;g.strokeStyle='#25362d';const ellipse=(x,y,rx,ry,col)=>{g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();g.stroke();};if(type.startsWith('enemy')){let t=Number(type.slice(-1)),col=['#9cac44','#c5a453','#9d8bb5'][t];g.fillStyle='#0005';g.beginPath();g.ellipse(64,116,40,8,0,0,7);g.fill();for(let i=0;i<12;i++){let a=i*Math.PI/6,x=64+Math.cos(a)*43,y=61+Math.sin(a)*40;g.strokeStyle='#25362d';g.lineWidth=7;g.beginPath();g.moveTo(64+Math.cos(a)*30,61+Math.sin(a)*30);g.lineTo(x,y);g.stroke();ellipse(x,y,5,5,col);}ellipse(64,64,36,t===1?43:33,col);ellipse(40,106,13,9,col);ellipse(87,106,13,9,col);g.strokeStyle='#25362d';ellipse(49,52,13,15,'#f3df9c');ellipse(80,52,13,15,'#f3df9c');ellipse(53,55,4,7,'#202820');ellipse(76,55,4,7,'#202820');g.fillStyle='#26382a';g.beginPath();g.moveTo(42,76);g.quadraticCurveTo(64,95,88,75);g.lineTo(82,96);g.lineTo(51,98);g.closePath();g.fill();g.fillStyle='#f0deb2';for(let x=49;x<85;x+=10){g.beginPath();g.moveTo(x,80);g.lineTo(x+7,81);g.lineTo(x+3,90);g.fill();}g.fillStyle='#ffffff33';g.fillRect(37,66,6,4);g.fillRect(82,69,8,5);g.fillStyle='#31473066';g.fillRect(58,30,6,5);g.fillRect(33,81,5,8);g.fillRect(90,65,5,9);if(t===1){g.fillStyle='#e9d799';g.fillRect(46,17,38,9);g.fillRect(53,8,24,12);}if(t===2){g.strokeStyle='#b9a3c8';g.lineWidth=6;for(let x of [20,107]){g.beginPath();g.moveTo(x,50);g.lineTo(x-10,23);g.lineTo(x+3,30);g.stroke();}}}else if(type==='health'){g.fillStyle='#0005';g.fillRect(20,104,90,10);g.fillStyle='#d9dab5';g.fillRect(28,40,72,67);g.strokeRect(28,40,72,67);g.fillStyle='#526e42';g.fillRect(54,48,20,48);g.fillRect(40,62,48,19);g.strokeRect(50,29,28,12);}else if(type==='ammo'){g.fillStyle='#976d3d';g.fillRect(15,54,100,57);g.strokeRect(15,54,100,57);for(let x=26;x<110;x+=22){g.fillStyle='#345336';g.fillRect(x,26,13,41);g.fillStyle='#d2b669';g.fillRect(x+3,16,7,14);}g.fillStyle='#ddc98e';g.fillRect(31,72,68,25);g.fillStyle='#3d462b';g.font='bold 12px monospace';g.font='bold 9px monospace';g.fillText('ХМЕЛЬНОЙ',37,83);g.fillText('ДОЗОР',46,93);}else if(type==='bottle'){g.fillStyle='#ddc88b';g.fillRect(54,7,20,9);g.fillStyle='#426d39';g.fillRect(55,16,18,30);g.fillRect(43,45,42,69);g.strokeRect(43,45,42,69);g.fillStyle='#e8d39a';g.fillRect(43,68,42,29);g.fillStyle='#344b2c';g.font='bold 17px monospace';g.fillText('№7',51,88);g.fillStyle='#acc773';g.fillRect(48,49,5,17);}else if(type==='can'){g.fillStyle='#c5b69b';g.fillRect(39,30,50,78);g.strokeRect(39,30,50,78);g.fillStyle='#44342c';g.fillRect(40,44,48,52);g.fillStyle='#efc86d';g.font='bold 12px monospace';g.fillText('КОТЁЛ',44,68);g.fillText('13',57,86);g.fillStyle='#f1dcac';g.fillRect(42,32,44,5);}else{ellipse(64,64,18,18,type==='foam'?'#f4e4b8':'#bba479');}return c;}
 const sprites=Object.fromEntries(['enemy0','enemy1','enemy2','health','ammo','bottle','can','cork','foam'].map(s=>[s,sprite(s)]));
 const stellaSprite=document.createElement('canvas');stellaSprite.width=stellaSprite.height=256;const stellaImage=document.createElement('img');
 stellaImage.onload=()=>{const g=stellaSprite.getContext('2d');g.clearRect(0,0,256,256);g.imageSmoothingEnabled=true;const scale=Math.min(224/stellaImage.naturalWidth,248/stellaImage.naturalHeight),w=stellaImage.naturalWidth*scale,h=stellaImage.naturalHeight*scale;g.drawImage(stellaImage,128-w/2,252-h,w,h);invalidate(stellaSprite);};
 stellaImage.src='assets/art/stella-rescued-full.webp';

 // ---- Textures: canvas → {w,h,px:Uint32Array (ABGR)} with lazily built box-filtered mips. Without ImageData (node tests) a pattern encodes u in red, v in green.
 const texCache=new WeakMap();
 function pixels(c,w,h){try{const d=c.getContext?.('2d')?.getImageData?.(0,0,w,h);if(d&&d.data&&d.data.length===w*h*4)return new Uint32Array(d.data.buffer);}catch{}const px=new Uint32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)px[y*w+x]=0xff000000|(Math.round(y*255/Math.max(1,h-1))<<8)|Math.round(x*255/Math.max(1,w-1));return px;}
 function extract(c,t){const w=c.width||64,h=c.height||64;t.w=w;t.h=h;t.px=pixels(c,w,h);t.mips=[t];return t;}
 function tex(c){let t=texCache.get(c);if(!t){t=extract(c,{});texCache.set(c,t);}return t;}
 function halve(t){const w=t.w>>1,h=t.h>>1,s=t.px,px=new Uint32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let r=0,g=0,b=0,a=0;for(let k=0;k<4;k++){const p=s[(2*y+(k>>1))*t.w+2*x+(k&1)],pa=p>>>24;a+=pa;r+=(p&255)*pa;g+=(p>>8&255)*pa;b+=(p>>16&255)*pa;}px[y*w+x]=a?((a>>2)<<24|Math.round(b/a)<<16|Math.round(g/a)<<8|Math.round(r/a))>>>0:0;}return {w,h,px};}
 function mip(t,level){const m=t.mips;while(m.length<=level){const last=m[m.length-1];if(last.w<16||last.h<16)return last;m.push(halve(last));}return m[level];}
 const mipFor=(t,texelsPerPixel)=>mip(t,texelsPerPixel<1.6?0:texelsPerPixel<3.2?1:texelsPerPixel<6.4?2:3);
 // Re-reads a canvas after async painting (logo, Stella); objects held in level tables update in place.
 function invalidate(source){const t=source&&texCache.get(source);if(t)extract(source,t);}
 function proceduralTex(w,h,fn){const px=new Uint32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)px[y*w+x]=fn(x/(w-1),y/(h-1))>>>0;const t={w,h,px};t.mips=[t];return t;}
 const puffTex=proceduralTex(32,32,(u,v)=>{const r=Math.hypot(u-.5,v-.5)*2,a=r<1?(1-r*r)**2:0;return Math.round(a*255)<<24|0xe6ebe8;});
 const shaftTex=proceduralTex(32,64,(u,v)=>{const half=.16+v*.34,x=Math.abs(u-.5)/half,a=x<1?(1-x*x)*(1-v*.75)*(v<.06?v/.06:1):0;return Math.round(a*255)<<24|0xffffff;});

 // ---- Colours and per-level look.
 const hex=s=>{s=String(s||'#000').replace('#','');if(s.length<6)s=s.split('').map(c=>c+c).join('');const n=parseInt(s.slice(0,6),16)||0;return [n>>16&255,n>>8&255,n&255];};
 const colorCache=new Map();const colorOf=s=>{let c=colorCache.get(s);if(!c){c=hex(s);colorCache.set(s,c);}return c;};
 let LOOK=null,FOG=[0,0,0],fogNear=3,fogFar=16,fogTab=new Float32Array(1024),belowFill='#151b17',fogPacked=0xff000000;
 const fogAt=d=>{const i=(d*16)|0;return fogTab[i<1023?i:1023];};
 const pack=(r,g,b)=>(0xff000000|(b>255?255:b)<<16|(g>255?255:g)<<8|(r>255?255:r))>>>0;
 function setLook(level,index){
  const look=level&&level.look||{};
  LOOK={fog:look.fog||'#1b211d',near:look.near??3,far:look.far??16,ambient:look.ambient||[.85,.85,.85],lights:look.lights||[],lamp:look.lamp||'round',haze:look.haze||0,dust:look.dust||0,fogMax:look.fogMax??.9};
  FOG=hex(LOOK.fog);fogNear=LOOK.near;fogFar=Math.max(fogNear+.1,LOOK.far);
  for(let i=0;i<1024;i++){const d=i/16,t=Math.min(1,Math.max(0,(d-fogNear)/(fogFar-fogNear)));fogTab[i]=t*t*(3-2*t)*LOOK.fogMax;}
  fogPacked=pack(FOG[0],FOG[1],FOG[2]);belowFill=`rgb(${FOG.map(c=>c*.7|0).join(',')})`;
  const ceil=hex(level&&level.ceiling||'#243a36');ceilFlat=[ceil,FOG];
 }
 let ceilFlat=[[36,58,54],[0,0,0]];

 // ---- Level tables: wall textures per cell, floor/ceiling variants, lamps and the 4×4-per-cell lightmap.
 let MW=1,MH=1,wallTex=[],fvar=new Uint8Array(1),cvar=new Uint8Array(1),lampCell=new Int8Array(1),lamps=[],floorPx=[[],[],[]],ceilPx=[[],[],[]];
 let LW=0,LH=0,LM=new Float32Array(3),LF=null,LP=null,LMc=LM;
 const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296;};
 function floorVariant(index,map,x,y){
  const props=current.level&&current.level.props||[],h=hash(x,y);
  if(index===0)return h<.1?2:h<.2?3:(x+y)&1;
  if(index===1){for(const [px,py,type] of props){if(!['bottles','cans','filler','seamer'].includes(type))continue;const cx=Math.floor(px),cy=Math.floor(py);if(cx===x&&cy===y)return 4;if(cx===x&&cy===y+1)return 2;if(cx===x&&cy===y-1)return 3;}return h<.5?0:1;}
  if(index===2)return [2,8,14,20].includes(x)?2:h<.18?1:0;
  if(index===3)return h<.12?2:y%2===0?1:0;
  return 0;
 }
 function los(map,x0,y0,x1,y1){
  let mx=Math.floor(x0),my=Math.floor(y0);const tx=Math.floor(x1),ty=Math.floor(y1),dx=x1-x0,dy=y1-y0,sx=dx<0?-1:1,sy=dy<0?-1:1,ddx=Math.abs(1/dx),ddy=Math.abs(1/dy);
  let ex=(dx<0?x0-mx:mx+1-x0)*ddx,ey=(dy<0?y0-my:my+1-y0)*ddy;
  for(let n=0;n<256;n++){if(mx===tx&&my===ty)return true;if(ex<ey){if(ex>1)return true;ex+=ddx;mx+=sx;}else{if(ey>1)return true;ey+=ddy;my+=sy;}if(map[my]?.[mx]!==0)return false;}
  return true;
 }
 function buildTables(){
  const map=current.map,index=current.index;MH=map.length;MW=map[0].length;
  wallTex=new Array(MW*MH);fvar=new Uint8Array(MW*MH);cvar=new Uint8Array(MW*MH);lampCell=new Int8Array(MW*MH).fill(-1);
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const t=map[y][x];if(t)wallTex[y*MW+x]=tex(wallTexture(t,x,y));fvar[y*MW+x]=floorVariant(index,map,x,y);cvar[y*MW+x]=y%4===2?1:x%5===3?2:0;}
  const shape={round:0,tube:1,box:2}[LOOK.lamp]??0;
  lamps=LOOK.lights.map(([x,y,radius,intensity,color,flag],i)=>{const c=hex(color);const l={x,y,radius,intensity,c,r:c[0]/255,g:c[1]/255,b:c[2]/255,flag:flag||'',shape:flag==='p'?3:shape,k:1,seed:i*1.7};const cx=Math.floor(x),cy=Math.floor(y);if(cx>=0&&cy>=0&&cx<MW&&cy<MH)lampCell[cy*MW+cx]=i;return l;});
  const S=SceneArt.floor&&SceneArt.ceiling;
  const fl=[0,1,2,3,4].map(v=>S?tex(SceneArt.floor(index,v)):tex(textures[1])),cl=[0,1,2].map(v=>S?tex(SceneArt.ceiling(index,v)):tex(textures[1]));
  for(let l=0;l<3;l++){floorPx[l]=fl.map(t=>mip(t,l).px);ceilPx[l]=cl.map(t=>mip(t,l).px);}
  floorSize=fl[0].w;
  buildLightmap();
 }
 let floorSize=128;
 function buildLightmap(){
  const map=current.map,[ar,ag,ab]=LOOK.ambient;LW=MW*4;LH=MH*4;const n=LW*LH*3;
  LM=new Float32Array(n);LF=lamps.some(l=>l.flag==='f')?new Float32Array(n):null;LP=lamps.some(l=>l.flag==='p')?new Float32Array(n):null;LMc=LF||LP?new Float32Array(n):LM;
  for(let j=0;j<LH;j++)for(let i=0;i<LW;i++){
   const x=(i+.5)/4,y=(j+.5)/4,o=(j*LW+i)*3;
   if(map[y|0][x|0]!==0){LM[o]=ar*.5;LM[o+1]=ag*.5;LM[o+2]=ab*.5;continue;}
   LM[o]=ar;LM[o+1]=ag;LM[o+2]=ab;
   for(const L of lamps){const dx=x-L.x,dy=y-L.y,d2=dx*dx+dy*dy,r2=L.radius*L.radius;if(d2>=r2||!los(map,L.x,L.y,x,y))continue;let f=1-d2/r2;f=f*f*L.intensity;const T=L.flag==='f'?LF:L.flag==='p'?LP:LM;T[o]+=L.r*f;T[o+1]+=L.g*f;T[o+2]+=L.b*f;}
  }
 }
 // Called on level load: rebuilds texture tables, lamps and the lightmap.
 function setLevel(index,level,map){current.index=index;current.level=level;current.map=map;setLook(level,index);buildTables();atmoReset();}
 // Called when map cells change at runtime (e.g. a secret wall opens).
 function onMapChange(){if(current.map)buildTables();}

 // ---- Light sampling: bilinear lightmap (+ up to 4 dynamic lights) into SR,SG,SB.
 let SR=0,SG=0,SB=0,nDyn=0;const DYN=new Float32Array(4*6);
 function sampleLight(x,y,dyn){
  let fx=x*4-.5,fy=y*4-.5;if(fx<0)fx=0;else if(fx>LW-1.001)fx=LW-1.001;if(fy<0)fy=0;else if(fy>LH-1.001)fy=LH-1.001;
  const ix=fx|0,iy=fy|0,tx=fx-ix,ty=fy-iy,i=(iy*LW+ix)*3,j=i+LW*3,a=(1-tx)*(1-ty),b=tx*(1-ty),c=(1-tx)*ty,d=tx*ty,L=LMc;
  SR=L[i]*a+L[i+3]*b+L[j]*c+L[j+3]*d;SG=L[i+1]*a+L[i+4]*b+L[j+1]*c+L[j+4]*d;SB=L[i+2]*a+L[i+5]*b+L[j+2]*c+L[j+5]*d;
  if(dyn&&nDyn)addDyn(x,y);
  // Soft knee above 1 keeps pools of light (and muzzle flashes) from washing textures out.
  if(SR>1)SR=1+(SR-1)*.4;if(SG>1)SG=1+(SG-1)*.4;if(SB>1)SB=1+(SB-1)*.4;
 }
 function addDyn(x,y){for(let k=0;k<nDyn;k++){const o=k*6,dx=x-DYN[o],dy=y-DYN[o+1],d2=dx*dx+dy*dy,r2=DYN[o+2];if(d2>=r2)continue;let f=1-d2/r2;f*=f;SR+=DYN[o+3]*f;SG+=DYN[o+4]*f;SB+=DYN[o+5]*f;}}
 const dynSort=[];
 function collectDyn(){
  nDyn=0;const list=V.lights;if(!list||!list.length)return;const P=V.player;dynSort.length=0;for(const l of list)if(l&&l.radius>0)dynSort.push(l);
  dynSort.sort((a,b)=>((a.x-P.x)**2+(a.y-P.y)**2)-((b.x-P.x)**2+(b.y-P.y)**2));
  for(const l of dynSort){if(nDyn>=4)break;const c=l.color||[255,230,180],s=(c[0]>1||c[1]>1||c[2]>1?1/255:1)*(l.intensity??1),o=nDyn*6;DYN[o]=l.x;DYN[o+1]=l.y;DYN[o+2]=l.radius*l.radius;DYN[o+3]=c[0]*s;DYN[o+4]=c[1]*s;DYN[o+5]=c[2]*s;nDyn++;}
 }
 // Lamp flicker (flag 'f') and emergency pulse (flag 'p') are separate lightmap layers mixed per frame.
 function updateFlicker(t){
  let kf=1,kp=1;
  for(const L of lamps){if(L.flag==='f'){const blink=hash(Math.floor(t*9+L.seed*7),3)<.05;L.k=blink?.3:.86+.14*Math.sin(t*23+L.seed)*Math.sin(t*7.3);kf=L.k;}else if(L.flag==='p'){L.k=.55+.45*Math.max(0,Math.sin(t*4.2));kp=L.k;}}
  if(LMc===LM)return;const n=LM.length;
  if(LF&&LP)for(let i=0;i<n;i++)LMc[i]=LM[i]+LF[i]*kf+LP[i]*kp;else if(LF)for(let i=0;i<n;i++)LMc[i]=LM[i]+LF[i]*kf;else for(let i=0;i<n;i++)LMc[i]=LM[i]+LP[i]*kp;
 }

 // ---- Framebuffer and quality.
 const coarse=typeof matchMedia==='function'&&!!matchMedia('(pointer:coarse)')?.matches;
 let autoLevel=coarse?'low':'medium',slowFor=0,lastFrame=0,qName='',RW=0,RH=0,fb=new Uint32Array(1),zbuf=new Float32Array(1),wallTop=new Int16Array(1),wallBot=new Int16Array(1),Lr=null,Lg=null,Lb=null,imageData=null,off=null,offCtx=null;
 const setting=()=>typeof GameSettings!=='undefined'?GameSettings.get('quality'):'auto';
 function ensure(){
  const s=setting(),q=QUALITY[s]?s:autoLevel;if(q===qName)return;qName=q;[RW,RH]=QUALITY[q];
  off=document.createElement('canvas');off.width=RW;off.height=RH;offCtx=off.getContext&&off.getContext('2d');
  let img=null;try{img=offCtx&&offCtx.createImageData?offCtx.createImageData(RW,RH):null;}catch{}
  imageData=img&&img.data&&img.data.length===RW*RH*4?img:null;fb=imageData?new Uint32Array(imageData.data.buffer):new Uint32Array(RW*RH);
  zbuf=new Float32Array(RW);wallTop=new Int16Array(RW);wallBot=new Int16Array(RW);const ns=(RW>>2)+2;Lr=new Float32Array(ns);Lg=new Float32Array(ns);Lb=new Float32Array(ns);
  stats.quality=q;stats.w=RW;stats.h=RH;
 }
 if(typeof GameSettings!=='undefined'&&GameSettings.on)GameSettings.on('quality',()=>{slowFor=0;stats.avg=0;});
 function track(raster,presentMs){
  stats.rasterMs=raster;stats.presentMs=presentMs;const t=raster+presentMs;stats.avg=stats.avg?stats.avg*.92+t*.08:t;
  const nowT=now(),dt=Math.min(250,Math.max(0,nowT-lastFrame));lastFrame=nowT;
  if(setting()==='auto'&&stats.avg>18){slowFor+=dt;if(slowFor>2000){const i=STEPS.indexOf(autoLevel);if(i<STEPS.length-1){autoLevel=STEPS[i+1];stats.avg=0;}slowFor=0;}}else slowFor=0;
 }

 // ---- Raycasting. castRay is pure; the internal cast writes module registers to avoid per-column allocations.
 let hD=0,hSide=0,hTile=0,hMx=0,hMy=0,hU=0,hX=0,hY=0;
 function cast(map,px,py,rx,ry){
  let mx=Math.floor(px),my=Math.floor(py),side=0,tile=0;const ddx=Math.abs(1/rx),ddy=Math.abs(1/ry),sx=rx<0?-1:1,sy=ry<0?-1:1;
  let distx=(rx<0?px-mx:mx+1-px)*ddx,disty=(ry<0?py-my:my+1-py)*ddy;
  for(let j=0;j<64;j++){if(distx<disty){distx+=ddx;mx+=sx;side=0;}else{disty+=ddy;my+=sy;side=1;}tile=map[my]?.[mx]??1;if(tile)break;}
  const d=Math.max(.05,side?disty-ddy:distx-ddx);let wall=side?px+d*rx:py+d*ry;wall-=Math.floor(wall);
  // Mirror so lettering reads left-to-right on every face.
  if((side===0&&rx<0)||(side===1&&ry>0))wall=1-wall;
  hD=d;hSide=side;hTile=tile||1;hMx=mx;hMy=my;hU=wall>=1?.99999:wall;hX=px+d*rx;hY=py+d*ry;
 }
 function castRay(map,px,py,rx,ry){cast(map,px,py,rx,ry);return {d:hD,side:hSide,tile:hTile,mx:hMx,my:hMy,u:hU};}
 const defaultWall=()=>tex(textures[1]);
 function wallTexAt(mx,my,tile){return mx>=0&&my>=0&&mx<MW&&my<MH&&wallTex[my*MW+mx]||(tile>1?tex(wallTexture(tile,mx,my)):defaultWall());}

 // ---- Walls (+ decals).
 let nDecal=0;const DEC=new Float32Array(64*8);
 function collectDecals(){nDecal=0;const list=V.decals;if(!list)return;const P=V.player;for(const d of list){if(nDecal>=64)break;if((d.x-P.x)**2+(d.y-P.y)**2>196)continue;const c=d.color||[90,70,40],k=c[0]>1||c[1]>1||c[2]>1?1:255,o=nDecal*8,s=d.size||.12;DEC[o]=d.x;DEC[o+1]=d.y;DEC[o+2]=s*s;DEC[o+3]=d.v??.5;DEC[o+4]=c[0]*k;DEC[o+5]=c[1]*k;DEC[o+6]=c[2]*k;DEC[o+7]=Math.max(0,Math.min(1,(d.alpha??1)*(d.life===undefined?1:Math.min(1,d.life))));nDecal++;}}
 function rasterWalls(){
  const P=V.player,map=V.map,ca=Math.cos(P.a),sa=Math.sin(P.a),ns=debug.noShade;
  for(let x=0;x<RW;x++){
   const cam=(2*(x+.5)/RW-1)*PLANE,rx=ca-sa*cam,ry=sa+ca*cam;cast(map,P.x,P.y,rx,ry);
   const d=hD,lineH=RH/d,top=(RH-lineH)/2;let y0=Math.ceil(top-.5),y1=Math.ceil(top+lineH-.5);if(y0<0)y0=0;if(y1>RH)y1=RH;
   zbuf[x]=d;wallTop[x]=y0;wallBot[x]=y1;
   const T=mipFor(wallTexAt(hMx,hMy,hTile),128/lineH),tw=T.w,th=T.h,px=T.px;let tx=(hU*tw)|0;if(tx>=tw)tx=tw-1;
   let mr=1,mg=1,mb=1,ar=0,ag=0,ab=0;
   if(!ns){const lx=hSide?hX:hX-(rx<0?-.125:.125),ly=hSide?hY-(ry<0?-.125:.125):hY;sampleLight(lx,ly,true);const f=fogAt(d),k=(1-f)*(hSide?.8:1);mr=SR*k;mg=SG*k;mb=SB*k;ar=FOG[0]*f;ag=FOG[1]*f;ab=FOG[2]*f;}
   const vs=th/lineH;let v=(y0+.5-top)*vs,o=y0*RW+x;
   for(let y=y0;y<y1;y++,o+=RW,v+=vs){let vi=v|0;if(vi>=th)vi=th-1;const p=px[vi*tw+tx],r=(p&255)*mr+ar,g=(p>>8&255)*mg+ag,b=(p>>16&255)*mb+ab;fb[o]=0xff000000|(b>255?255:b)<<16|(g>255?255:g)<<8|(r>255?255:r);}
   for(let k=0;k<nDecal;k++){const q=k*8,dx=hX-DEC[q],dy=hY-DEC[q+1],d2=(dx*dx+dy*dy)*TEXEL_ASPECT*TEXEL_ASPECT,s2=DEC[q+2];if(d2>=s2)continue;const rv=Math.sqrt(s2-d2);let ya=Math.ceil(top+(DEC[q+3]-rv)*lineH-.5),yb=Math.ceil(top+(DEC[q+3]+rv)*lineH-.5);if(ya<y0)ya=y0;if(yb>y1)yb=y1;
    const a=DEC[q+7]*(1-.5*d2/s2),cr=DEC[q+4]*mr+ar,cg=DEC[q+5]*mg+ag,cb=DEC[q+6]*mb+ab;
    for(let y=ya,o2=ya*RW+x;y<yb;y++,o2+=RW){const p=fb[o2],r0=p&255,g0=p>>8&255,b0=p>>16&255,r=r0+((cr>255?255:cr)-r0)*a,g=g0+((cg>255?255:cg)-g0)*a,b=b0+((cb>255?255:cb)-b0)*a;fb[o2]=0xff000000|b<<16|g<<8|r;}}
  }
  for(let x=0;x<W;x++)depth[x]=zbuf[(x*RW/W)|0];
 }

 // ---- Floor and ceiling share each row's world positions (camera at half height); lamps are fullbright fixtures on the ceiling.
 let LAMP_GLOW=0,LAMP_CORE=0;
 function lampAt(L,dx,dy){
  LAMP_CORE=0;LAMP_GLOW=0;const ax=Math.abs(dx),ay=Math.abs(dy);let e;
  if(L.shape===1){if(ax<.4&&ay<.045)LAMP_CORE=1;else if(ax<.44&&ay<.08)LAMP_CORE=2;e=Math.hypot(ax*.55,ay*1.6);}
  else if(L.shape===2){if(ax<.25&&ay<.12)LAMP_CORE=1;else if(ax<.29&&ay<.16)LAMP_CORE=2;e=Math.hypot(ax*.8,ay*1.3);}
  else if(L.shape===3){e=Math.hypot(ax,ay)*.8;if(e<.1)LAMP_CORE=1;else if(e<.13)LAMP_CORE=2;}
  else{e=Math.hypot(ax,ay);if(e<.12)LAMP_CORE=1;else if(e<.16)LAMP_CORE=2;}
  if(!LAMP_CORE&&e<.48){const t=1-e/.48;LAMP_GLOW=t*t*.9*L.k;}
 }
 function rasterFloor(){
  const P=V.player,ca=Math.cos(P.a),sa=Math.sin(P.a),half=RH/2,dcam=2*PLANE/RW,cam0=(1/RW-1)*PLANE,ns=debug.noShade,low=qName==='low',dyn=!low&&nDyn>0,NS=RW>>2;
  const FS=floorSize,CM=.72;
  if(RH&1){const y=(RH-1)/2,o=y*RW;for(let x=0;x<RW;x++)if(y<wallTop[x]||y>=wallBot[x])fb[o+x]=fogPacked;}
  for(let y=Math.ceil(half);y<RH;y++){
   const yc=RH-1-y,rowD=half/(y+.5-half),f=ns?0:fogAt(rowD),nf=1-f,fr=FOG[0]*f,fg=FOG[1]*f,fbb=FOG[2]*f;
   let wx=P.x+rowD*(ca-sa*cam0),wy=P.y+rowD*(sa+ca*cam0);const dwx=-rowD*sa*dcam,dwy=rowD*ca*dcam;
   for(let s=0;s<=NS;s++){if(ns){Lr[s]=Lg[s]=Lb[s]=1;continue;}const sx=wx+dwx*s*4,sy=wy+dwy*s*4;sampleLight(sx,sy,dyn);Lr[s]=SR*nf;Lg[s]=SG*nf;Lb[s]=SB*nf;}
   Lr[NS+1]=Lr[NS];Lg[NS+1]=Lg[NS];Lb[NS+1]=Lb[NS];
   const tpp=rowD*dcam*FS,lvl=tpp<1.6?0:tpp<3.2?1:2,FP=floorPx[lvl],CP=ceilPx[lvl],TS=FS>>lvl,TM=TS-1,fo=y*RW,co=yc*RW;
   let lowCeil=0;if(low){const c=ceilFlat[0],k=.95*nf;lowCeil=pack(c[0]*k+fr,c[1]*k+fg,c[2]*k+fbb);}
   for(let x=0;x<RW;x++,wx+=dwx,wy+=dwy){
    const fl=y>=wallBot[x],ce=yc<wallTop[x];if(!fl&&!ce)continue;
    const s=x>>2,t=(x&3)*.25,lr=Lr[s]+(Lr[s+1]-Lr[s])*t,lg=Lg[s]+(Lg[s+1]-Lg[s])*t,lb=Lb[s]+(Lb[s+1]-Lb[s])*t;
    const cx=wx|0,cy=wy|0,c=cx>=0&&cy>=0&&cx<MW&&cy<MH?cy*MW+cx:0,ti=((wy*TS)&TM)*TS+((wx*TS)&TM);
    if(fl){const p=FP[fvar[c]][ti],r=(p&255)*lr+fr,g=(p>>8&255)*lg+fg,b=(p>>16&255)*lb+fbb;fb[fo+x]=0xff000000|(b>255?255:b)<<16|(g>255?255:g)<<8|(r>255?255:r);}
    if(ce){
     if(low){fb[co+x]=lowCeil;continue;}
     const p=CP[cvar[c]][ti];let r=(p&255)*lr*CM+fr,g=(p>>8&255)*lg*CM+fg,b=(p>>16&255)*lb*CM+fbb;const li=lampCell[c];
     if(li>=0&&!ns){const L=lamps[li];lampAt(L,wx-L.x,wy-L.y);const lf=1-f*.4;
      if(LAMP_CORE===1){const k=L.k*lf;r=(L.c[0]*.55+115)*k+fr*.4;g=(L.c[1]*.55+115)*k+fg*.4;b=(L.c[2]*.55+115)*k+fbb*.4;}
      else if(LAMP_CORE===2){r=r*.35+40*lf;g=g*.35+40*lf;b=b*.35+42*lf;}
      else if(LAMP_GLOW){const k=LAMP_GLOW*lf;r+=L.c[0]*k;g+=L.c[1]*k;b+=L.c[2]*k;}}
     fb[co+x]=0xff000000|(b>255?255:b)<<16|(g>255?255:g)<<8|(r>255?255:r);
    }
   }
  }
 }

 // ---- Ambient atmosphere: steam above vessels, dust motes and soft light shafts (owned here, driven by level look).
 const puffs=[],motes=[],emitters=[];let atmoClock=0;
 function atmoReset(){
  puffs.length=0;motes.length=0;emitters.length=0;atmoClock=-1;const level=current.level||{};
  for(const [x,y,type,size] of level.props||[])if(type==='kettle'||type==='tank'||type==='filter')emitters.push({x,y,rate:type==='kettle'?2.2:type==='tank'?1.1:.8,acc:hash(x*7|0,y*7|0),z:type==='filter'?.92:type==='kettle'?1.18:1.28,size});
  const n=LOOK.dust|0;let k=0;const src=lamps.filter(l=>l.flag!=='p');
  for(let i=0;i<n&&src.length;i++){const L=src[i%src.length],a=hash(i,11)*Math.PI*2,r=Math.sqrt(hash(i,12))*1.4;motes.push({L,x:L.x+Math.cos(a)*r,y:L.y+Math.sin(a)*r,z:hash(i,13),ph:hash(i,14)*6.28,sp:.015+hash(i,15)*.03});k++;}
 }
 function atmoUpdate(clock){
  let dt=atmoClock<0?0:clock-atmoClock;atmoClock=clock;if(!(dt>0))dt=0;if(dt>.1)dt=.1;
  for(const e of emitters){e.acc+=dt*e.rate;while(e.acc>=1){e.acc-=1;if(puffs.length>=48)break;const r=hash((clock*97|0)+puffs.length,(e.x*13|0));puffs.push({x:e.x+(r-.5)*.35,y:e.y+(hash(r*1e4|0,5)-.5)*.35,z:e.z+r*.08,age:0,life:2.2+r*1.2,vx:(r-.5)*.08,vy:(hash(r*1e4|0,7)-.5)*.08,big:e.rate>2?1.3:1});}}
  for(let i=puffs.length-1;i>=0;i--){const p=puffs[i];p.age+=dt;p.z+=dt*.15;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.age>=p.life){puffs[i]=puffs[puffs.length-1];puffs.pop();}}
 }

 // ---- Billboards: pooled records, sorted back-to-front, z-tested per column against walls.
 const pool=[],order=[];let np=0;
 function add(img,x,y,size,z,aspect,enemy){const s=pool[np]||(pool[np]={});np++;s.img=img;s.t=null;s.x=x;s.y=y;s.size=size||1;s.z=z||0;s.aspect=aspect||1;s.enemy=enemy||null;s.isEnemy=!!enemy;s.hit=0;s.flash=0;s.alpha=1;s.fullbright=false;s.stagger=0;s.dying=0;s.seed=0;s.blend=0;s.tr=1;s.tg=1;s.tb=1;return s;}
 const PANELS=['aspiration','screw','hatch'];
 function collect(){
  np=0;const {player:P,props=[],enemies=[],items=[],shots=[],clock=0,levelIndex,level,stellaVisible}=V;
  for(const p of props)add(SceneArt.prop(p.type,PANELS.includes(p.type)?Number(p.active):Math.floor(clock*5)%2),p.x,p.y,p.size,0,(p.type==='bottles'||p.type==='cans')?1.7:1,null);
  for(const e of enemies){
   const alive=e.hp>0;if(!alive&&!(e.dying>0&&e.dying<1))continue;const fork=e.type===6||e.type===7;
   // Spitters and the boss pick their own frame and scale.
   const look=typeof EnemyAI!=='undefined'&&EnemyAI.look?.(e);
   const img=look?look.img:fork?SceneArt.forklift(e.type,e.mode,Math.floor(clock*10)%2):e.type>2?SceneArt.monster(e.type,e.attack>.5?1:Math.floor(clock*6+e.seed)%2):sprites['enemy'+e.type];
   const s=look?add(img,e.x,e.y,look.size,look.z||0,look.aspect||1,alive?e:null):add(img,e.x,e.y,fork?1.25:e.type===10?1.25:e.type===5?1.15:e.type===8?.7:.85,fork?0:e.type===9?.13+Math.sin(clock*4+e.seed)*.04:Math.sin(clock*5+e.seed)*.025,fork?1.25:1,alive?e:null);
   s.isEnemy=true;s.hit=e.hit||0;s.stagger=e.stagger||0;s.dying=e.dying||0;s.seed=e.seed||0;
  }
  if(stellaVisible&&levelIndex===3&&level&&level.stella)add(stellaSprite,level.stella[0],level.stella[1],1.12,Math.sin(clock*2)*.008,1,null);
  for(const i of items)add(sprites[i.type],i.x,i.y,.52,0,1,null);
  for(const s of shots)add(sprites[s.type],s.x,s.y,s.type==='foam'?.2:.24,.35+Math.sin(Math.min(1,s.age||0)*Math.PI)*.2,1,null);
  for(const e of V.extra||[]){if(!e||!e.img)continue;const s=add(e.img,e.x,e.y,e.size,e.z,e.aspect,e.enemy||null);s.hit=e.hit||0;s.flash=e.flash||0;s.alpha=e.alpha??1;s.fullbright=!!e.fullbright;s.isEnemy=!!e.enemy;}
  for(const p of puffs){const t=p.age/p.life,s=add(null,p.x,p.y,(.3+t*.55)*p.big,p.z-(.3+t*.55)*p.big*.5,1,null);s.t=puffTex;s.blend=1;s.alpha=Math.min(1,p.age*2.5)*(1-t)*.6;}
  if(LOOK.haze>0)for(const L of lamps){if(L.flag==='p')continue;const s=add(null,L.x,L.y,1,0,.85,null);s.t=shaftTex;s.blend=2;s.alpha=.14*LOOK.haze*L.intensity*L.k*Math.min(1,Math.max(0,(Math.hypot(L.x-P.x,L.y-P.y)-.6)/1.4));s.tr=L.r;s.tg=L.g;s.tb=L.b;s.fullbright=true;}
  order.length=0;for(let i=0;i<np;i++){const s=pool[i];s.dist=(s.x-P.x)**2+(s.y-P.y)**2;order.push(s);}
  order.sort((a,b)=>b.dist-a.dist);
 }
 let PX=0,PD=0;
 function proj(x,y){const P=V.player,c=Math.cos(P.a),s=Math.sin(P.a),dx=x-P.x,dy=y-P.y;PD=dx*c+dy*s;PX=W/2+(-dx*s+dy*c)*W/(2*PLANE*PD);}
 function project(x,y){proj(x,y);return {d:PD,x:PX};}
 function drawBill(s,rects){
  proj(s.x,s.y);const d=PD;if(d<.15)return;
  let h=VIEW/d*s.size,w=h*s.aspect,left=PX-w/2,top=VIEW/2+VIEW/d*.5-h-s.z*VIEW/d;
  if(left>W||left+w<0)return;
  if(s.enemy&&s.enemy.hp>0&&rects){const c=Math.floor(PX);rects.push({x:PX,top,w,h,d,visible:PX>=0&&PX<W&&d<depth[c],enemy:s.enemy});}
  if(s.dying>0){const k=Math.min(1,s.dying),h2=h*(1-.7*k);top+=h-h2;h=h2;const w2=w*(1+.35*k);left-=(w2-w)/2;w=w2;}
  if(s.stagger>0)left+=Math.sin((V.clock||0)*38+s.seed)*Math.min(1,s.stagger)*w*.06;
  const T=s.t||(s.img?tex(s.img):null);if(!T)return;
  const kx=RW/W,ky=RH/VIEW,li=left*kx,ti=top*ky,wi=w*kx,hi=h*ky;if(wi<.5||hi<.5)return;
  let x0=Math.ceil(li-.5),x1=Math.ceil(li+wi-.5),y0=Math.ceil(ti-.5),y1=Math.ceil(ti+hi-.5);if(x0<0)x0=0;if(x1>RW)x1=RW;if(y0<0)y0=0;if(y1>RH)y1=RH;if(x0>=x1||y0>=y1)return;
  // Shading folded into out = texel*m + a (light, fog, white-hot hit flash).
  let mr=1,mg=1,mb=1,ar=0,ag=0,ab=0;
  if(!debug.noShade){
   let lr=1,lg=1,lb=1;if(!s.fullbright){sampleLight(s.x,s.y,true);lr=SR;lg=SG;lb=SB;if(s.isEnemy){const m=Math.max(lr,lg,lb);if(m<.85){const k=.85/Math.max(.05,m);lr*=k;lg*=k;lb*=k;}}}
   const f=fogAt(d)*(s.fullbright?.4:s.isEnemy?.55:1),fl=Math.min(1,Math.max(s.flash,s.hit>0?Math.min(1,s.hit/.16)*.85:0)),k=(1-f)*(1-fl);
   mr=lr*k*s.tr;mg=lg*k*s.tg;mb=lb*k*s.tb;ar=(FOG[0]*f)*(1-fl)+255*fl;ag=(FOG[1]*f)*(1-fl)+242*fl;ab=(FOG[2]*f)*(1-fl)+192*fl;
  }else if(s.blend===2){mr=s.tr;mg=s.tg;mb=s.tb;}
  const t=mipFor(T,T.h/hi),tw=t.w,th=t.h,px=t.px,us=tw/wi,vs=th/hi,v0=(y0+.5-ti)*vs,blend=s.blend===0&&s.alpha<1?1:s.blend,ga=s.alpha,cut=s.blend===0?128:8;
  if(blend===2){ar=ag=ab=0;}
  for(let x=x0;x<x1;x++){
   if(d>=zbuf[x])continue;let tu=((x+.5-li)*us)|0;if(tu>=tw)tu=tw-1;let v=v0,o=y0*RW+x;
   for(let y=y0;y<y1;y++,o+=RW,v+=vs){
    const p=px[(v|0)*tw+tu],a=p>>>24;if(!p||a<cut)continue;
    let r=(p&255)*mr+ar,g=(p>>8&255)*mg+ag,b=(p>>16&255)*mb+ab;
    if(blend){const q=fb[o],r0=q&255,g0=q>>8&255,b0=q>>16&255,k=blend===1?(s.blend===0?ga:a/255*ga):a/255*ga;
     if(blend===2){r=r0+r*k;g=g0+g*k;b=b0+b*k;}else{if(r>255)r=255;if(g>255)g=255;if(b>255)b=255;r=r0+(r-r0)*k;g=g0+(g-g0)*k;b=b0+(b-b0)*k;}}
    fb[o]=0xff000000|(b>255?255:b)<<16|(g>255?255:g)<<8|(r>255?255:r);
   }
  }
 }
 function rasterParticles(){
  const list=V.particles||[],kx=RW/W,ky=RH/VIEW,ns=debug.noShade;
  for(const q of list){
   proj(q.x,q.y);if(PD<.1)continue;const cx=(PX*kx)|0;if(cx<0||cx>=RW||PD>=zbuf[cx])continue;
   const r=Math.min(20,5/PD)*(q.size||1),sy=VIEW/2+(.4-(q.z||0))*VIEW/PD;let x0=Math.round(PX*kx),y0=Math.round(sy*ky);const x1=Math.min(RW,x0+Math.max(1,Math.round(r*kx))),y1=Math.min(RH,y0+Math.max(1,Math.round(r*ky)));if(x0<0)x0=0;if(y0<0)y0=0;if(x0>=x1||y0>=y1)continue;
   const c=colorOf(q.color);let r0=c[0],g0=c[1],b0=c[2];
   if(!ns){let lr=1,lg=1,lb=1;if(!q.fullbright){sampleLight(q.x,q.y,true);lr=Math.max(.7,SR);lg=Math.max(.7,SG);lb=Math.max(.7,SB);}const f=fogAt(PD)*(q.fullbright?.4:.8);r0=r0*lr*(1-f)+FOG[0]*f;g0=g0*lg*(1-f)+FOG[1]*f;b0=b0*lb*(1-f)+FOG[2]*f;}
   const col=pack(r0,g0,b0);for(let y=y0;y<y1;y++)for(let x=x0,o=y*RW+x0;x<x1;x++,o++)if(PD<zbuf[x])fb[o]=col;
  }
  if(!motes.length||ns)return;const t=V.clock||0,kx2=RW/W,ky2=RH/VIEW;
  for(const m of motes){
   const x=m.x+Math.sin(t*.23+m.ph)*.22,y=m.y+Math.cos(t*.19+m.ph*1.3)*.22,z=.04+((m.z+t*m.sp)%1)*.92;proj(x,y);if(PD<.3||PD>9)continue;
   const cx=(PX*kx2)|0,cy=((VIEW/2+(.5-z)*VIEW/PD)*ky2)|0;if(cx<0||cx>=RW||cy<0||cy>=RH||PD>=zbuf[cx])continue;
   const dl=Math.hypot(x-m.L.x,y-m.L.y),k=(1-Math.min(1,dl/1.6))*(1-fogAt(PD))*.55*m.L.k*(.6+.4*Math.sin(t*1.7+m.ph*3));if(k<.03)continue;
   const o=cy*RW+cx,p=fb[o],r=(p&255)+m.L.c[0]*k,g=(p>>8&255)+m.L.c[1]*k,b=(p>>16&255)+m.L.c[2]*k;fb[o]=0xff000000|(b>255?255:b)<<16|(g>255?255:g)<<8|(r>255?255:r);
  }
 }

 // ---- Frame entry points.
 function prepare(view){
  V=view;ensure();
  if(view.map&&(view.map!==current.map||view.level!==current.level))setLevel(view.levelIndex|0,view.level||{},view.map);
  updateFlicker(view.clock||0);collectDyn();collectDecals();atmoUpdate(view.clock||0);
 }
 function rasterWorld(view){prepare(view);rasterWalls();rasterFloor();}
 function rasterSprites(view){if(V!==view)prepare(view);collect();const rects=[];for(const s of order)drawBill(s,rects);rasterParticles();return rects;}
 function present(){
  if(!imageData)return;offCtx.putImageData(imageData,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(off,0,0,W,VIEW);ctx.fillStyle=belowFill;ctx.fillRect(0,VIEW,W,H-VIEW);
 }
 // Kept for the original call sites: each rasterises its part and presents.
 function drawWorld(view){const t0=now();rasterWorld(view);const t1=now();present();track(t1-t0,now()-t1);}
 function drawSprites(view){const t0=now();const rects=rasterSprites(view);const t1=now();present();track(t1-t0,now()-t1);return rects;}
 // Draws the 3D view and returns screen rects ({x,top,w,h,d,visible,enemy} in 960×470 space) of living enemies for HUD overlays.
 function render(view){const t0=now();rasterWorld(view);const rects=rasterSprites(view);const t1=now();present();track(t1-t0,now()-t1);return rects;}
 // Test/debug helpers.
 function lightAt(x,y){sampleLight(x,y);return {r:SR,g:SG,b:SB};}
 return {render,setLevel,onMapChange,invalidate,drawWorld,drawSprites,project,stats,depth,sprites,textures,wallTexture,tex,castRay,lightAt,fogAt,debug,
  get quality(){return qName;},get res(){return {w:RW,h:RH};},get fb(){return {w:RW,h:RH,px:fb};},get zbuf(){return zbuf;}};
})();
