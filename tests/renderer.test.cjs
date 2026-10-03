'use strict';
// Software renderer: raycast orientation, fog, lightmap occlusion, sprite z-test and enemy rects, framebuffer sampling, quality levels.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const gradient={addColorStop(){}};
const context=new Proxy({createLinearGradient:()=>gradient},{get:(t,p)=>t[p]||(()=>{})});
const element=()=>({style:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},addEventListener(){},getContext:()=>context,setAttribute(){},removeAttribute(){},textContent:'',hidden:false});
const elements=new Map();
const document={querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:element,addEventListener(){}};
const storage=new Map(),localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))};
const sandbox={document,window:{addEventListener(){}},localStorage,performance:{now:()=>0},matchMedia:()=>({matches:false}),console,assert};
vm.createContext(sandbox);
for(const file of ['settings.js','levels.js','scene-art.js','renderer.js'])vm.runInContext(readFileSync(file,'utf8'),sandbox);
vm.runInContext(`
const level0=LEVELS[0],map0=level0.map.map(r=>r.split('').map(Number));
const view=(over={})=>({player:{x:3.5,y:3.5,a:0,hp:100},map:map0,props:[],enemies:[],items:[],shots:[],particles:[],extra:[],lights:[],decals:[],clock:0,levelIndex:0,level:level0,stellaVisible:false,started:true,running:true,weapon:0,kick:0,hurt:0,...over});
Renderer.setLevel(0,level0,map0);

// castRay: texture u grows left-to-right across the screen on all four headings.
for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
 const ray=x=>{const c=(2*x/W-1)*Math.tan(FOV/2);return Renderer.castRay(map0,3.5,3.5,Math.cos(a)-Math.sin(a)*c,Math.sin(a)+Math.cos(a)*c);};
 const l=ray(470),r=ray(510);
 assert.equal(l.mx+','+l.my+','+l.side,r.mx+','+r.my+','+r.side,'same face at '+a);
 assert.ok(r.u>l.u,'u increases left-to-right at heading '+a+': '+l.u+' → '+r.u);
 assert.ok(l.d>0&&l.tile>0&&l.u>=0&&l.u<1,'castRay result fields');
}
// Straight east from (3.5,2.5): the copper wall at x=5 is 1.5 cells away.
{const hit=Renderer.castRay(map0,3.5,2.5,1,0);assert.deepEqual([hit.mx,hit.my,hit.side,hit.tile],[5,2,0,2]);assert.ok(Math.abs(hit.d-1.5)<1e-9);}

// Fog grows with distance and stays bounded.
const fogs=[1,4,8,12,20].map(d=>Renderer.fogAt(d));
for(let i=1;i<fogs.length;i++)assert.ok(fogs[i]>=fogs[i-1],'fog is monotonic: '+fogs);
assert.ok(fogs[0]<.05&&fogs[4]>.5&&fogs[4]<=1,'fog range: '+fogs);

// Lightmap: a lamp lights its own room but not the far side of a wall at the same distance.
const lamp={look:{fog:'#000000',near:3,far:16,ambient:[.3,.3,.3],lights:[[1.5,1.5,6,1,'#ffffff']]},logoWalls:[],props:[]};
const walled=['1111111','1001001','1111111'].map(r=>r.split('').map(Number)),open=['1111111','1000001','1111111'].map(r=>r.split('').map(Number));
Renderer.setLevel(0,lamp,walled);
const near=Renderer.lightAt(2.5,1.5).r,blocked=Renderer.lightAt(4.5,1.5).r;
Renderer.setLevel(0,lamp,open);
const unblocked=Renderer.lightAt(4.5,1.5).r;
assert.ok(near>.6,'lamp lights its room: '+near);
assert.ok(Math.abs(blocked-.3)<.02,'wall blocks the lamp: '+blocked);
assert.ok(unblocked>blocked+.2,'same spot is lit without the wall: '+unblocked);
// Map changes (secret walls) rebuild the lightmap.
Renderer.setLevel(0,lamp,walled);walled[1][3]=0;Renderer.onMapChange();
assert.ok(Renderer.lightAt(4.5,1.5).r>blocked+.2,'onMapChange relights the opened room');
walled[1][3]=1;

// Framebuffer column with shading off: wall texels come straight from the test pattern (red = u, green = v).
Renderer.debug.noShade=true;
Renderer.setLevel(0,level0,map0);
const facing=view({player:{x:3.5,y:3.5,a:0,hp:100}});
Renderer.render(facing);
const {w,h,px}=Renderer.fb,col=w>>1;
const centre=Renderer.castRay(map0,3.5,3.5,Math.cos(0)-Math.sin(0)*((2*(col+.5)/w-1)*Math.tan(FOV/2)),Math.sin(0)+Math.cos(0)*((2*(col+.5)/w-1)*Math.tan(FOV/2)));
const red=px[(h>>1)*w+col]&255;
assert.ok(Math.abs(red-centre.u*255)<6,'column samples u: '+red+' vs '+centre.u*255);
const lineH=h/centre.d,top=Math.ceil((h-lineH)/2+.5);
let prev=-1;for(let y=Math.max(0,top);y<Math.min(h,top+lineH-1);y+=4){const g=px[y*w+col]>>8&255;assert.ok(g>=prev,'v grows down the column at row '+y);prev=g;}
assert.equal(Renderer.depth.length,W,'depth stays per 960 column');
assert.ok(Math.abs(Renderer.depth[480]-centre.d)<.2,'depth mirrors the internal z-buffer');

// Sprite z-test: a billboard hidden behind a wall writes no pixels; the same billboard in the open does.
const card={width:16,height:16,getContext:()=>context};
const snapshot=()=>Array.from(Renderer.fb.px);
const behind=view({player:{x:1.5,y:1.5,a:0,hp:100}});
Renderer.render(behind);const bare=snapshot();
Renderer.render({...behind,extra:[{x:7.5,y:3.5,img:card,size:1}]});
assert.deepEqual(snapshot(),bare,'sprite behind a wall is fully occluded');
Renderer.render({...behind,extra:[{x:3.5,y:1.5,img:card,size:1}]});
assert.notDeepEqual(snapshot(),bare,'visible sprite is drawn');

// Enemy rects in 960×470 space, flagged visible only when not behind a wall.
const enemy={x:4.5,y:3.5,type:0,hp:75,max:75,hit:0,seed:0,attack:0};
let rects=Renderer.render(view({enemies:[enemy]}));
assert.equal(rects.length,1);
const r=rects[0];
assert.equal(r.enemy,enemy);assert.equal(r.visible,true);
assert.ok(Math.abs(r.x-W/2)<1&&Math.abs(r.d-1)<1e-6,'centred one cell ahead');
assert.ok(Math.abs(r.h-VIEW*.85)<1e-6&&Math.abs(r.w-r.h)<1e-6&&r.top<VIEW/2,'rect size follows enemy size');
rects=Renderer.render(view({player:{x:1.5,y:1.5,a:0,hp:100},enemies:[{...enemy,x:7.5,y:3.5}]}));
assert.ok(rects.every(q=>!q.visible),'enemy behind a wall is not visible');
assert.equal(Renderer.render(view({enemies:[{...enemy,hp:0}]})).length,0,'dead enemies have no rect');

// Hit flash pushes the sprite toward warm white.
Renderer.debug.noShade=false;
const plain=view({player:{x:3.5,y:1.5,a:0,hp:100},extra:[{x:5,y:1.5,img:card,size:.6,z:.2}]});
Renderer.render(plain);const cx=w>>1,cy=(h>>1)-2,base=Renderer.fb.px[cy*w+cx];
Renderer.render({...plain,extra:[{...plain.extra[0],flash:1}]});const lit=Renderer.fb.px[cy*w+cx];
assert.ok((lit&255)>(base&255)&&(lit>>16&255)>(base>>16&255)-1,'flash brightens the sprite');
assert.equal(lit&255,255,'full flash is #fff2c0');

// Particles, decals and dynamic lights render without errors.
Renderer.render(view({particles:[{x:5,y:3.5,z:.3,color:'#ffcc66',life:.4,dx:0,dy:0,size:2,fullbright:true}],decals:[{x:6,y:3.5,v:.5,size:.12,color:[200,180,90],alpha:.8,life:3}],lights:[{x:4.5,y:3.5,radius:3,intensity:1,color:[255,200,120],life:.1}]}));

// Quality levels map to internal resolutions; settings changes apply on the next frame.
assert.equal(Renderer.quality,'medium');assert.deepEqual({...Renderer.res},{w:480,h:235});
GameSettings.set('quality','low');Renderer.render(view());assert.deepEqual({...Renderer.res},{w:320,h:157});
GameSettings.set('quality','high');Renderer.render(view());assert.deepEqual({...Renderer.res},{w:640,h:313});
GameSettings.set('quality','auto');Renderer.render(view());assert.equal(Renderer.quality,'medium');
assert.ok(typeof Renderer.stats.avg==='number'&&'rasterMs' in Renderer.stats&&'presentMs' in Renderer.stats);

// Every level's lamps sit in open cells and every level builds.
for(let i=0;i<LEVELS.length;i++){const m=LEVELS[i].map.map(r=>r.split('').map(Number));for(const [x,y] of LEVELS[i].look.lights)assert.equal(m[Math.floor(y)][Math.floor(x)],0,'lamp in a wall on level '+i);Renderer.render(view({map:m,level:LEVELS[i],levelIndex:i,player:{x:LEVELS[i].spawn[0],y:LEVELS[i].spawn[1],a:LEVELS[i].spawn[2],hp:100}}));}
console.log('PASS: renderer castRay orientation, fog, lightmap occlusion, framebuffer column, sprite z-test, enemy rects, flash, quality levels');
`,sandbox);
