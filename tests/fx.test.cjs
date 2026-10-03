'use strict';
// Weapons track: upgrades, checkpoint survival, hitstop, shake, decals, lights, corpses, crit rules, weapon poses.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const gradient={addColorStop(){}};
const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(t,p)=>t[p]||(()=>{})});
const elements=new Map();
const element=()=>({style:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},addEventListener(){},getContext:()=>context,requestPointerLock:()=>Promise.resolve(),removeAttribute(){},setAttribute(){},textContent:'',innerHTML:'',hidden:false});
const document={querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:element,addEventListener(){},exitPointerLock(){}};
const storage=new Map(),localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))};
const audioMock={resume:()=>({then(fn){fn();return this}}),say:()=>true};
const sandbox={document,window:{addEventListener(){}},localStorage,performance:{now:()=>0},requestAnimationFrame(){},matchMedia:()=>({matches:false}),GameAudio:new Proxy(audioMock,{get:(t,p)=>t[p]||(()=>{})}),ScoreCard:{create:async()=>({url:'blob:score'}),download(){},copyLink:async()=>{},share:async()=>true},setTimeout(){},console,assert,Path2D:class{moveTo(){}lineTo(){}closePath(){}}};
vm.createContext(sandbox);
for(const file of ['weapons-art.js','score.js','settings.js','levels.js','progression.js','scene-art.js','renderer.js','fx.js','enemies.js','ui.js','game.js'])vm.runInContext(readFileSync(file,'utf8'),sandbox);
vm.runInContext(`
const mk=(x,y,hp=1000,type=0)=>({x,y,hp,max:hp,type,attack:0,hit:0,seed:0,alert:false,mode:'hunt',phase:0,chargeCooldown:0,heading:0});
const fresh=ids=>{const w=WEAPON_BASE.map(b=>({...b}));const run=applyLoadout(w,ids);return {w,run};};
// ---- upgrades: each changes exactly what it promises ----
assert.equal(UPGRADES.length,8);for(const u of UPGRADES){assert.ok(u.id&&u.name&&u.text&&typeof u.apply==='function','upgrade shape '+u.id);}
assert.equal(new Set(UPGRADES.map(u=>u.id)).size,8);
let base=fresh([]);assert.equal(base.run.maxHp,100);assert.equal(base.w[0].count,1);assert.equal(base.w[3].count,3);
let r=fresh(['double_bottle']);assert.equal(r.w[0].count,2);assert.ok(r.w[0].spread<.1&&r.w[0].spread>0,'narrow spread');
r=fresh(['shard_can']);assert.equal(r.w[1].split,4);
r=fresh(['pierce_cork']);assert.equal(r.w[2].pierce,1);
r=fresh(['wide_foam']);assert.equal(r.w[3].count,5);assert.ok(r.w[3].life>base.w[3].life,'foam reaches further');
r=fresh(['big_crate']);assert.equal(r.w[1].pick,1.5);
r=fresh(['quick_hand']);for(let i=0;i<4;i++)assert.ok(Math.abs(r.w[i].cool-base.w[i].cool*.8)<1e-9,'cooldown -20% weapon '+i);
r=fresh(['sturdy']);assert.equal(r.run.maxHp,115);
r=fresh(['hop_charge']);assert.equal(r.w[0].crit,.2);
r=fresh(UPGRADES.map(u=>u.id));assert.equal(r.run.maxHp,115);assert.equal(r.w[0].crit,.2);
// rollUpgrades: n distinct choices, never owned ones
for(let k=0;k<20;k++){const c=rollUpgrades(3,['sturdy','double_bottle']);assert.equal(c.length,3);assert.equal(new Set(c.map(x=>x.id)).size,3);assert.ok(!c.some(x=>x.id==='sturdy'||x.id==='double_bottle'));assert.ok(c.every(x=>x.name&&x.text&&'weapon' in x));}
assert.equal(rollUpgrades(3,UPGRADES.slice(1).map(u=>u.id)).length,1,'only unowned remain');
// ---- loadout in game: rebuilt from base each load, saved in checkpoint, survives death ----
reset();assert.deepEqual(runUpgrades,[]);assert.equal(player.maxHp,100);
runUpgrades.push('pierce_cork');pickUpgrade('sturdy');assert.deepEqual(runUpgrades,['pierce_cork','sturdy']);pickUpgrade('sturdy');assert.equal(runUpgrades.length,2,'no duplicates');pickUpgrade(null);assert.equal(runUpgrades.length,2);
kills=levelTotal;enemies=[];running=true;player.x=LEVELS[0].exit[0];player.y=LEVELS[0].exit[1];tick(.01);assert.equal(transition,true);
start();assert.equal(levelIndex,1);assert.equal(player.maxHp,115);assert.equal(weapons[2].pierce,1);assert.deepEqual(checkpoint.upgrades,['pierce_cork','sturdy']);assert.ok(player.hp>=75);
finish(false);start();assert.equal(levelIndex,1,'retry same level');assert.equal(player.maxHp,115,'retry keeps maxHp');assert.equal(weapons[2].pierce,1,'retry keeps upgrades');assert.deepEqual(runUpgrades,['pierce_cork','sturdy']);
loadLevel(1,true);assert.equal(weapons[0].count,1,'weapon stats are rebuilt, not accumulated');
reset();assert.deepEqual(runUpgrades,[]);assert.equal(weapons[2].pierce,undefined,'full reset drops upgrades');assert.equal(player.maxHp,100);
// pickups respect the raised cap and the crate bonus
loadLevel(0);runUpgrades=['sturdy'];loadLevel(0,false);
player.maxHp=115;weapons[1].pick=1.5;running=true;player.hp=110;const hp0=items.find(i=>i.type==='health');player.x=hp0.x;player.y=hp0.y;tick(.01);assert.equal(player.hp,115,'health capped at maxHp');
const crate=items.find(i=>i.type==='ammo');const a0=weapons[1].ammo;player.x=crate.x;player.y=crate.y;tick(.01);assert.equal(weapons[1].ammo,a0+12,'+50% cans per crate');
// ---- shooting uses count / pierce / split ----
reset();running=true;weapons[0].count=2;weapons[0].spread=.07;shoot();assert.equal(shots.length,2);assert.ok(Math.abs(shots[0].dx-shots[1].dx)>0);
reset();running=true;choose(3);weapons[3].count=5;shoot();assert.equal(shots.length,5);
reset();running=true;choose(2);weapons[2].pierce=1;shoot();assert.equal(shots[0].pierce,1);
reset();running=true;choose(1);weapons[1].split=4;shoot();const canShot=shots[0];shots=[];impact({x:3.5,y:3,type:'can',damage:95,split:4});assert.equal(shots.length,4);assert.ok(shots.every(s=>s.type==='cork'&&s.damage>0&&!s.split));
// pierce: one cork damages two enemies in a line, then stops
reset();running=true;enemies=[mk(5.5,1.5),mk(6.4,1.5)];player.x=3;player.y=1.5;player.a=0;choose(2);weapons[2].pierce=1;weapons[2].cool=.01;shoot();for(let i=0;i<12;i++)tick(.02);
assert.ok(enemies[0].hp<1000&&enemies[1].hp<1000,'pierce hits both');assert.equal(shots.length,0);
reset();running=true;enemies=[mk(5.5,1.5),mk(6.4,1.5)];player.x=3;player.y=1.5;player.a=0;choose(2);shoot();for(let i=0;i<12;i++)tick(.02);assert.ok(enemies[0].hp<1000&&enemies[1].hp===1000,'no pierce without upgrade');
// ---- crit only on staggered / slowed enemies ----
const bottleAt=()=>({type:'bottle',damage:42,dx:10,dy:0,x:5,y:5,crit:0});
let e=mk(5,5);hitEnemy(bottleAt(),e);assert.equal(e.hp,1000-42,'plain hit = base damage');
e=mk(5,5);e.stagger=.2;hitEnemy(bottleAt(),e);assert.equal(e.hp,1000-84,'crit on staggered');assert.equal(GameFX.hitCrit,1);
e=mk(5,5);e.slow=1;hitEnemy(bottleAt(),e);assert.equal(e.hp,1000-84,'crit on slowed');
e=mk(5,5);const cork={type:'cork',damage:19,dx:20,dy:0,x:5,y:5,crit:0};e.stagger=.2;hitEnemy(cork,e);assert.equal(e.hp,1000-19,'crit is bottle-only');
e=mk(5,5);const sh2=bottleAt();sh2.crit=.2;const rnd=Math.random;Math.random=()=>.1;hitEnemy(sh2,e);assert.equal(e.hp,1000-84,'hop charge crits');Math.random=()=>.9;e=mk(5,5);hitEnemy(sh2,e);assert.equal(e.hp,1000-42,'hop charge misses');Math.random=rnd;
e=mk(5,5);hitEnemy({type:'foam',damage:11,dx:8,dy:0,x:5,y:5,crit:0},e);assert.ok(e.slow>0,'foam slows');
e=mk(5,5,100);hitEnemy({type:'cork',damage:19,dx:20,dy:0,x:5,y:5,crit:0},e);assert.ok(e.stagger>0,'cork lightly staggers small enemies');
e=mk(5,5,310);hitEnemy({type:'cork',damage:19,dx:20,dy:0,x:5,y:5,crit:0},e);assert.ok(!(e.stagger>0),'big enemies are not staggered by corks');
// can explosions pass a damage source to the enemy module
{reset();const got=[];const orig=EnemyAI.damage;EnemyAI.damage=(en,d,src)=>{got.push(src);return orig(en,d,src);};enemies=[mk(3.6,3.1,500)];impact({x:3.5,y:3,type:'can',damage:95});EnemyAI.damage=orig;assert.equal(got.length,1);assert.equal(got[0].type,'can');assert.ok(got[0].force>0&&got[0].x===3.5);}
// status timers decay
reset();running=true;enemies=[mk(8,8)];enemies[0].stagger=.1;enemies[0].slow=.1;for(let i=0;i<10;i++)tick(.02);assert.equal(enemies[0].stagger,0);assert.equal(enemies[0].slow,0);
// ---- hitstop pauses the simulation, but only briefly ----
reset();running=true;choose(0);shoot();const sx=shots[0].y;GameFX.hitstop=.07;for(let i=0;i<2;i++){tick(.025);assert.equal(shots[0].y,sx,'frozen during hitstop');}
for(let i=0;i<4;i++)tick(.025);assert.ok(shots.length===0||shots[0].y>sx,'simulation resumes');assert.equal(GameFX.hitstop,0,'hitstop is spent');
reset();running=true;enemies=[mk(5.5,5.5,10)];damage(enemies[0],50);assert.equal(GameFX.hitstop,.04,'kill hitstop 40 ms');GameFX.hitstop=0;GameFX.onExplode(5,5);assert.equal(GameFX.hitstop,.07,'explosion hitstop 70 ms');GameFX.onExplode(5,5);assert.ok(GameFX.hitstop<=.07);
// ---- shake: respects the setting, decays ----
GameFX.reset();GameSettings.set('shake',false);GameFX.addShake(1);GameFX.update(.016);assert.equal(GameFX.shake.x,0);assert.equal(GameFX.shake.y,0);assert.equal(GameFX.trauma,0);
GameSettings.set('shake',true);GameFX.addShake(.8);GameFX.update(.016);assert.ok(Math.abs(GameFX.shake.x)+Math.abs(GameFX.shake.y)>0);assert.ok(Math.abs(GameFX.shake.x)<15,'bounded');
for(let i=0;i<80;i++)GameFX.update(.016);assert.equal(GameFX.shake.x,0);assert.equal(GameFX.shake.y,0);
// ---- hit marker, damage direction ----
GameFX.reset();GameFX.onHit(mk(5,5),10);assert.equal(GameFX.hitMarker,1);for(let i=0;i<20;i++)GameFX.update(.016);assert.equal(GameFX.hitMarker,0);assert.equal(GameFX.hitCrit,0);
reset();player.x=5;player.y=5;GameFX.onHurt(10,5,9);assert.ok(Math.abs(GameFX.damageDir-Math.PI/2)<1e-9);hurtPlayer(5,{x:1,y:5});assert.ok(Math.abs(Math.abs(GameFX.damageDir)-Math.PI)<1e-9,'hurtPlayer forwards the source');
enemies=[mk(5,6.5)];GameFX.onHurt(5);assert.ok(Math.abs(GameFX.damageDir-Math.PI/2)<1e-9,'melee falls back to nearest enemy');
// ---- decals and lights are capped and expire ----
reset();loadLevel(0);for(let i=0;i<120;i++)GameFX.onImpact({x:14.85,y:1.5+(i%7)*.2,dx:10,dy:0,type:['bottle','can','foam','cork'][i%4],age:.3},true);
assert.ok(GameFX.decals.length>0&&GameFX.decals.length<=40,'decal cap '+GameFX.decals.length);for(const d of GameFX.decals){assert.ok(d.v>=0&&d.v<=1&&d.size>0&&d.size<.3&&d.alpha>0&&d.alpha<=1&&Array.isArray(d.color)&&d.color.length===3);}
const before=GameFX.decals.length;GameFX.onImpact({x:7.5,y:1.5,dx:10,dy:0,type:'bottle',age:.3},true);assert.equal(GameFX.decals.length,before,'no decal in open air');GameFX.onImpact({x:14.85,y:1.5,dx:10,dy:0,type:'bottle',age:.3},false);assert.equal(GameFX.decals.length,before,'only wall impacts leave decals');
for(let i=0;i<60;i++)GameFX.update(.5);assert.equal(GameFX.decals.length,0,'decals expire');
GameFX.reset();for(let i=0;i<30;i++)GameFX.addLight(1,1,2,1,[255,255,255],.1);assert.ok(GameFX.lights.length<=8);for(let i=0;i<10;i++)GameFX.update(.02);assert.equal(GameFX.lights.length,0,'lights expire');
reset();running=true;choose(2);player.x=3.5;player.y=3.5;GameFX.onShoot(2);assert.equal(GameFX.lights.length,1);assert.ok(GameFX.lights[0].life<=.07&&GameFX.lights[0].color[0]>200,'warm muzzle flash');
GameFX.reset();GameFX.onExplode(5,5);const boom=GameFX.lights[0];assert.equal(boom.radius,3);assert.ok(Math.abs(boom.life-.25)<1e-9&&boom.color[0]>boom.color[2],'orange explosion light');
// particles stay bounded and fall to the floor
GameFX.reset();for(let i=0;i<60;i++)GameFX.burst(5,5,'#fff',14);GameFX.update(.01);assert.ok(GameFX.particles.length<=GameFX.MAX_PARTICLES);for(let i=0;i<10;i++)GameFX.update(.2);assert.equal(GameFX.particles.length,0);
// ---- corpses: pushed on kill, fade over 6 s, billboards for the renderer ----
reset();running=true;enemies=[mk(5.5,5.5,10,0)];damage(enemies[0],50);assert.equal(GameFX.corpses.length,1);let bills=GameFX.sprites();assert.equal(bills.length,1);assert.ok(bills[0].img&&bills[0].alpha===1&&bills[0].x===5.5&&bills[0].size>0);
GameFX.update(3);assert.ok(GameFX.corpses[0].alpha<1&&GameFX.corpses[0].alpha>0);GameFX.update(3.1);assert.equal(GameFX.corpses.length,0);assert.equal(GameFX.sprites().length,0);
for(const t of [3,4,5,6,7,8,9,10]){GameFX.onKill(mk(4,4,0,t));}assert.equal(GameFX.corpses.length,8);for(let i=0;i<30;i++)GameFX.onKill(mk(4,4,0,0));assert.ok(GameFX.corpses.length<=GameFX.MAX_CORPSES);
// ---- spinning projectiles: bottles/cans leave the plain shot list and become rotating billboards ----
GameFX.reset();const spinShots=[{type:'bottle',x:5,y:5,age:0},{type:'can',x:6,y:5,age:.2},{type:'cork',x:7,y:5,age:0},{type:'foam',x:8,y:5,age:0}];
const plain=GameFX.shotView(spinShots);assert.equal(plain.length,2);assert.ok(plain.every(s=>s.type==='cork'||s.type==='foam'));let sp=GameFX.sprites();assert.equal(sp.length,2);const img0=sp[0].img;spinShots[0].age=.1;GameFX.shotView(spinShots);assert.notEqual(GameFX.sprites()[0].img,img0,'bottle frame changes with age');
// ---- weapon poses: swap, three-phase throw, recoil ----
GameFX.reset();reset();choose(0);let pose=GameFX.gunPose(0,0,false,0);assert.equal(pose.item,1);assert.equal(pose.throwing,false);
GameFX.onSwap(0,2);let p=GameFX.gunPose(2,0,false,0);assert.equal(p.shown,0,'old weapon is lowered first');assert.ok(p.y>=0);GameFX.update(.1);p=GameFX.gunPose(2,0,false,0);assert.equal(p.shown,0);assert.ok(p.y>150,'lowered '+p.y);
GameFX.update(.04);p=GameFX.gunPose(2,0,false,0);assert.equal(p.shown,2,'new weapon rises');GameFX.update(.18);p=GameFX.gunPose(2,0,false,0);assert.ok(p.y>=0&&p.y<20,'raised back to rest '+p.y);
GameFX.reset();weapons[0].cool=.5;GameFX.onShoot(0);const ph=(t,wi=0)=>{GameFX.gunT=t;return {...GameFX.gunPose(wi,1,false,0)};};
const windup=ph(.07),release=ph(.12),after=ph(.22),rise=ph(.38),done=ph(.5);
assert.ok(windup.throwing&&windup.item===1&&windup.x>10&&windup.y>20,'phase 1: wind-up back and down');
assert.ok(release.x<windup.x&&release.y<windup.y,'phase 2: release forward');assert.equal(after.item,0,'phase 3: hand returns empty');assert.equal(rise.item,1);assert.ok(rise.itemY>0&&rise.itemY<190,'new bottle rises');assert.equal(done.throwing,false);
GameFX.reset();weapons[1].ammo=0;GameFX.onShoot(1);assert.equal(ph(.4,1).item,0,'empty can: no new can rises');assert.equal(GameFX.gunPose(1,0,false,0).item,0,'idle empty hand');weapons[1].ammo=5;
GameFX.reset();const k0=GameFX.gunPose(2,0,false,0).y,k1=GameFX.gunPose(2,1,false,0).y;assert.ok(k1-k0>15,'cork recoil kick');
GameFX.reset();let vib=new Set();for(let i=0;i<12;i++){GameFX.update(.013);vib.add(Math.round(GameFX.gunPose(3,1,false,0).x*10));}assert.ok(vib.size>3,'foam vibrates');
// muzzle effects run without a canvas transform too
GameFX.reset();GameFX.onShoot(2);GameFX.muzzle(ctx,2);GameFX.screenFx(ctx);GameFX.onShoot(3);GameFX.muzzle(ctx,3);gun();render();
// existing damage wrapper stays compatible
reset();enemies=[mk(5,5,50)];damage(enemies[0],10);assert.equal(enemies[0].hp,40);
console.log('PASS: fx (upgrades, checkpoint, roles, hitstop, shake, decals, lights, corpses, poses)');
`,sandbox);
