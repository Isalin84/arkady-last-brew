const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const gradient={addColorStop(){}};
const context=new Proxy({createLinearGradient:()=>gradient},{get:(t,p)=>t[p]||(()=>{})});
const elements=new Map();
const element=()=>({style:{},classList:{toggle(){}},addEventListener(){},getContext:()=>context,requestPointerLock:()=>Promise.resolve(),textContent:'',innerHTML:'',hidden:false});
const document={querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:element,addEventListener(){},exitPointerLock(){}};
const sandbox={document,window:{addEventListener(){}},performance:{now:()=>0},requestAnimationFrame(){},matchMedia:()=>({matches:false}),GameAudio:new Proxy({resume:()=>Promise.resolve()},{get:(t,p)=>t[p]||(()=>{})}),console,assert};
vm.createContext(sandbox);for(const file of ['levels.js','scene-art.js','game.js'])vm.runInContext(readFileSync(file,'utf8'),sandbox);
vm.runInContext(`
reset();
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
reset();running=true;choose(1);shoot();assert.equal(weapons[1].ammo,17);assert.equal(shots[0].type,'can');
reset();running=true;choose(2);shoot();assert.equal(weapons[2].ammo,119);
reset();running=true;choose(3);shoot();assert.equal(weapons[3].ammo,79);assert.equal(shots.length,3);
// Splash damage reaches multiple enemies but respects walls.
reset();enemies=[{x:3.4,y:2.8,hp:70,max:70,type:0},{x:3.8,y:3.1,hp:70,max:70,type:0}];impact({x:3.5,y:3,type:'can',damage:95});assert.equal(kills,2);
// Health pickup and both terminal states.
reset();running=true;player.hp=50;player.x=1.5;player.y=4.5;tick(.01);assert.equal(player.hp,85);
finish(false);assert.equal(dead,true);start();assert.equal(player.hp,100);assert.equal(kills,0);assert.equal(running,true);
kills=12;enemies=[];player.x=13.5;player.y=14.5;tick(.01);assert.equal(transition,true);assert.equal(won,false);assert.equal(running,false);
start();assert.equal(levelIndex,1);assert.equal(enemies.length,16);assert.ok(player.hp>=75);
finish(false);start();assert.equal(levelIndex,1,'Death retries second level');assert.equal(kills,0);
kills=levelTotal;enemies=[];player.x=18.2;player.y=16.5;tick(.01);assert.equal(won,true);assert.equal(transition,false);
start();assert.equal(kills,0);assert.equal(enemies.length,12);pause();assert.equal(running,false);start();assert.equal(running,true);
// Both layouts: traversable spawn, every enemy and pickup, exit; props block movement.
for(let index=0;index<LEVELS.length;index++){
 loadLevel(index);const startCell=[Math.floor(player.x),Math.floor(player.y)];const queue=[startCell],seen=new Set([startCell.join(',')]);
 for(let k=0;k<queue.length;k++){const [x,y]=queue[k];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!solid(nx+.5,ny+.5)&&!seen.has(key)){seen.add(key);queue.push([nx,ny]);}}}
 for(const e of [...enemies,...items,{x:LEVELS[index].exit[0],y:LEVELS[index].exit[1]}])assert.ok(seen.has(Math.floor(e.x)+','+Math.floor(e.y)),'Unreachable in level '+index+': '+e.x+','+e.y);
 for(const p of props)assert.ok(solid(p.x,p.y),'Equipment collision');
 running=true;kills=0;player.x=LEVELS[index].exit[0];player.y=LEVELS[index].exit[1];tick(.01);assert.equal(running,true,'Exit stays locked until clear');
 drawWorld();drawSprites();
}
loadLevel(1);running=true;player.hp=10000;
enemies=[{x:6.5,y:5.5,type:3,hp:100,max:100,attack:0,hit:0,seed:0,alert:true}];
for(let i=0;i<1000;i++)tick(.04);
assert.ok(Math.hypot(enemies[0].x-player.x,enemies[0].y-player.y)<.85,'Awakened monster navigates around bottle conveyor');
console.log('PASS: wall orientation on all four faces, reachability, collisions, projectile hits, all weapons, splash, pickups, death, victory, restart, pause');
`,sandbox);
