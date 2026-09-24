const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const gradient={addColorStop(){}};
const context=new Proxy({createLinearGradient:()=>gradient},{get:(t,p)=>t[p]||(()=>{})});
const elements=new Map();
const element=()=>({style:{},classList:{toggle(){}},addEventListener(){},getContext:()=>context,requestPointerLock:()=>Promise.resolve(),removeAttribute(){},setAttribute(){},textContent:'',innerHTML:'',hidden:false});
const document={querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:element,addEventListener(){},exitPointerLock(){}};
const storage=new Map(),localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))};
const audioEvents=[],audioMock={resume:()=>({then(fn){fn();return this}}),say:event=>{audioEvents.push(event);return true},kiss:()=>audioEvents.push('kiss')};
const sandbox={document,window:{addEventListener(){}},localStorage,performance:{now:()=>0},requestAnimationFrame(){},matchMedia:()=>({matches:false}),GameAudio:new Proxy(audioMock,{get:(t,p)=>t[p]||(()=>{})}),ScoreCard:{create:async()=>({url:'blob:score'}),download(){},copyLink:async()=>{},share:async()=>true},setTimeout(){},console,assert,audioEvents};
vm.createContext(sandbox);for(const file of ['score.js','levels.js','scene-art.js','game.js'])vm.runInContext(readFileSync(file,'utf8'),sandbox);
vm.runInContext(`
reset();
assert.equal($('#arkady-health-portrait').src,'assets/art/arkady-health-100.webp');
player.hp=75;updateHUD();assert.equal($('#arkady-health-portrait').src,'assets/art/arkady-health-75.webp');
player.hp=50;updateHUD();assert.equal($('#arkady-health-portrait').src,'assets/art/arkady-health-50.webp');
player.hp=25;updateHUD();assert.equal($('#arkady-health-portrait').src,'assets/art/arkady-health-50.webp','Critical portrait starts below 25%');
player.hp=24;updateHUD();assert.equal($('#arkady-health-portrait').src,'assets/art/arkady-health-25.webp');
player.hp=76;updateHUD();assert.equal($('#arkady-health-portrait').src,'assets/art/arkady-health-100.webp');
player.hp=100;updateHUD();
// Real raycasting must read wall lettering left-to-right on all four faces.
const originalDrawImage=ctx.drawImage;
for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
 player={x:3.5,y:3.5,a:angle,hp:100};
 const columns=[];
 ctx.drawImage=(...args)=>{if(args[5]===480||args[5]===500)columns.push(args[1]);};
 drawWorld();
 assert.equal(columns.length,2);
 assert.ok(columns[1]>columns[0],'Mirrored wall at heading '+angle+': '+columns);
}
ctx.drawImage=originalDrawImage;
reset();
// Every enemy, pickup and exit approach is reachable from spawn.
let queue=[[3,2]], seen=new Set(['3,2']);
for(let k=0;k<queue.length;k++){let [x,y]=queue[k];for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=x+dx,ny=y+dy,key=nx+','+ny;if(map[ny]?.[nx]===0&&!seen.has(key)){seen.add(key);queue.push([nx,ny]);}}}
for(let e of [...enemies,...items,{x:13.5,y:14.5}])assert.ok(seen.has(Math.floor(e.x)+','+Math.floor(e.y)),'Unreachable entity');
let wallProbe={x:1.3,y:1.3};move(wallProbe,-.2,0);assert.equal(wallProbe.x,1.3,'Wall collision');
// Throw bottles through the real projectile loop at the opening enemy.
running=true;shoot();for(let i=0;i<20;i++)tick(.025);shoot();for(let i=0;i<22;i++)tick(.025);
assert.equal(kills,1,'Two bottle hits kill the first enemy');assert.equal(weapons[0].ammo,Infinity);
assert.ok(GameScore.current>0,'Kills add to the visible run score');
reset();running=true;choose(1);shoot();assert.equal(weapons[1].ammo,17);assert.equal(shots[0].type,'can');
reset();running=true;choose(2);shoot();assert.equal(weapons[2].ammo,119);
reset();running=true;choose(3);shoot();assert.equal(weapons[3].ammo,79);assert.equal(shots.length,3);
// Splash damage reaches multiple enemies but respects walls.
reset();enemies=[{x:3.4,y:2.8,hp:70,max:70,type:0},{x:3.8,y:3.1,hp:70,max:70,type:0}];impact({x:3.5,y:3,type:'can',damage:95});assert.equal(kills,2);
// Health pickup and both terminal states.
reset();running=true;player.hp=50;player.x=1.5;player.y=4.5;tick(.01);assert.equal(player.hp,85);
finish(false);assert.equal(dead,true);start();assert.equal(player.hp,100);assert.equal(kills,0);assert.equal(running,true);assert.equal(audioEvents.at(-1),'start');
kills=12;enemies=[];player.x=13.5;player.y=14.5;tick(.01);assert.equal(transition,true);assert.equal(won,false);assert.equal(running,false);
start();assert.equal(levelIndex,1);assert.equal(enemies.length,16);assert.ok(player.hp>=75);assert.equal(audioEvents.at(-1),'packstart','Packaging only plays packaging intro');
finish(false);start();assert.equal(levelIndex,1,'Death retries second level');assert.equal(kills,0);assert.equal(audioEvents.at(-1),'packstart');
kills=levelTotal;enemies=[];player.x=18.2;player.y=16.5;tick(.01);assert.equal(won,false);assert.equal(transition,true);
start();assert.equal(levelIndex,2);assert.equal(enemies.length,14);assert.equal(weapons[1].ammo,32);assert.equal(audioEvents.at(-1),'warestart','Warehouse only plays warehouse intro');
finish(false);start();assert.equal(levelIndex,2,'Death retries warehouse');assert.equal(storyHeard,false);assert.equal(audioEvents.at(-1),'warestart');
kills=levelTotal;enemies=[];player.x=20.2;player.y=18.5;tick(.01);assert.equal(won,false);assert.equal(transition,true);
assert.ok($('.intro p').innerHTML.includes('Кто-то заперт'));assert.ok(!/Нин[аы]|Стелл/.test($('.intro p').innerHTML),'Warehouse transition keeps rescue identity secret');
start();assert.equal(levelIndex,3);assert.equal(enemies.length,17);assert.equal(weapons[1].ammo,38);assert.equal(rescueStage,0);assert.equal(audioEvents.at(-1),'maltstart','Malt house only plays malt-house intro');
finish(false);start();assert.equal(levelIndex,3,'Death retries malt house');assert.equal(rescueStage,0);assert.equal(stellaVisible,false);assert.equal(audioEvents.at(-1),'maltstart');
kills=levelTotal;enemies=[];player.x=LEVELS[3].exit[0];player.y=LEVELS[3].exit[1];tick(.01);assert.equal(won,false,'Exit cannot bypass the silo rescue');
interact();assert.equal(rescueStage,0,'Controls must be used in order and at close range');
for(const [stage,type] of [[1,'aspiration'],[2,'screw'],[3,'hatch']]){const panel=props.find(p=>p.type===type);player.x=panel.x;player.y=panel.y;interact();assert.equal(rescueStage,stage);assert.equal(panel.active,true);}
assert.equal(stellaVisible,true);assert.equal(won,false);player.x=LEVELS[3].stella[0];player.y=LEVELS[3].stella[1];tick(.01);assert.equal(won,false,'Stella remains visible until the player interacts');const beforeFinaleAudio=audioEvents.length;interact();assert.equal(won,true);assert.equal(transition,false);assert.ok($('#overlay').classList.toggle,'Finale overlay is available');assert.equal($('.cover-art').src,'assets/art/stella-kisses-arkady.webp');assert.ok(audioEvents.includes('kiss')&&audioEvents.length>beforeFinaleAudio,'Finale triggers voice and kiss audio');assert.equal(GameScore.records().length,1);assert.ok(Number($('#final-score').textContent)>0);assert.equal($('#score-panel').hidden,false);
assert.ok($('.intro p').innerHTML.includes('Стеллу'));assert.ok($('.intro p').innerHTML.includes('Четыре цеха'));assert.equal(LEVELS.length,4);
start();assert.equal(kills,0);assert.equal(enemies.length,12);pause();assert.equal(running,false);start();assert.equal(running,true);
// Both layouts: traversable spawn, every enemy and pickup, exit; props block movement.
for(let index=0;index<LEVELS.length;index++){
 loadLevel(index);const startCell=[Math.floor(player.x),Math.floor(player.y)];const queue=[startCell],seen=new Set([startCell.join(',')]);
 for(let k=0;k<queue.length;k++){const [x,y]=queue[k];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!solid(nx+.5,ny+.5)&&!seen.has(key)){seen.add(key);queue.push([nx,ny]);}}}
 for(const e of [...enemies,...items,{x:LEVELS[index].exit[0],y:LEVELS[index].exit[1]}])assert.ok(seen.has(Math.floor(e.x)+','+Math.floor(e.y)),'Unreachable in level '+index+': '+e.x+','+e.y);
 for(const p of props)assert.ok(solid(p.x,p.y),'Equipment collision');
 if(index===3)for(const type of ['aspiration','screw','hatch']){const p=props.find(p=>p.type===type);assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has(Math.floor(p.x+dx)+','+Math.floor(p.y+dy))),'Unreachable rescue control '+type);}
 running=true;kills=0;player.x=LEVELS[index].exit[0];player.y=LEVELS[index].exit[1];tick(.01);assert.equal(running,true,'Exit stays locked until clear');
 drawWorld();drawSprites();
}
loadLevel(1);running=true;player.hp=10000;
enemies=[{x:6.5,y:5.5,type:3,hp:100,max:100,attack:0,hit:0,seed:0,alert:true}];
for(let i=0;i<1000;i++)tick(.04);
assert.ok(Math.hypot(enemies[0].x-player.x,enemies[0].y-player.y)<.85,'Awakened monster navigates around bottle conveyor');
// Warehouse charge: visible warning, locked heading, speed, single hit, and rack stun.
function truckAt(x,y,type=6){return {x,y,type,hp:ENEMY_TYPES[type].hp,max:ENEMY_TYPES[type].hp,attack:0,hit:0,seed:0,alert:true,mode:'hunt',phase:0,chargeCooldown:0,heading:0};}
loadLevel(2);running=true;player.x=2.5;player.y=2.5;enemies=[truckAt(7.5,2.5)];
let truck=enemies[0];tick(.01);assert.equal(truck.mode,'windup');const lockedHeading=truck.heading;
player.y=3.4;for(let i=0;i<24;i++)tick(.04);assert.equal(truck.mode,'charge');assert.equal(truck.heading,lockedHeading,'Charge direction is locked');
const beforeX=truck.x;for(let i=0;i<10;i++)tick(.04);assert.ok(beforeX-truck.x>2.5,'High speed charge');assert.equal(player.hp,100,'Sidestep avoids charge');
loadLevel(2);running=true;player.x=2.5;player.y=2.5;enemies=[truckAt(5.5,2.5)];
for(let i=0;i<40;i++)tick(.04);assert.equal(player.hp,72,'Exactly one ram hit');
loadLevel(2);running=true;player.x=2.5;player.y=2.5;enemies=[truckAt(7.5,5.5)];truck=enemies[0];truck.mode='charge';truck.phase=.95;truck.heading=Math.PI;
for(let i=0;i<10;i++)tick(.04);assert.equal(truck.mode,'recover');assert.equal(truck.hp,235);assert.ok(truck.x>=6.3,'No tunnelling through racks');
loadLevel(2);running=true;kills=levelTotal-4;warehouseStory();assert.equal(storyHeard,false);kills++;warehouseStory();assert.equal(storyHeard,true);assert.ok($('#radio-message').innerHTML.includes('замуровали'));storyTimer=7;warehouseStory();assert.equal(storyTimer,7,'Story only plays once');pause();assert.equal($('#radio-message').hidden,true);
console.log('PASS: four levels, wall orientation, reachability, collisions, combat, warehouse charges, ordered silo rescue, Stella finale, restart, pause');
`,sandbox);
