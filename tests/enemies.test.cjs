'use strict';
// Enemy track: spitter, glob projectiles, knockback, stagger/slow, HP overlays, malt-house boss, spawn safety and synthesized audio.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const gradient={addColorStop(){}};
const context=new Proxy({createLinearGradient:()=>gradient},{get:(t,p)=>t[p]||(()=>{})});
const elements=new Map();
const element=()=>({style:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},addEventListener(){},getContext:()=>context,requestPointerLock:()=>Promise.resolve(),removeAttribute(){},setAttribute(){},textContent:'',innerHTML:'',hidden:false});
const document={querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:element,addEventListener(){},exitPointerLock(){}};
const storage=new Map(),localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))};
const synthCalls=[],audioMock={resume:()=>({then(fn){fn();return this}}),say:()=>true,synth:(name,opts)=>{synthCalls.push(name);return true}};
const sandbox={document,window:{addEventListener(){}},localStorage,performance:{now:()=>0},requestAnimationFrame(){},matchMedia:()=>({matches:false}),GameAudio:new Proxy(audioMock,{get:(t,p)=>t[p]||(()=>{})}),ScoreCard:{create:async()=>({url:'blob:score'}),download(){},copyLink:async()=>{},share:async()=>true},setTimeout(){},console,assert,synthCalls};
vm.createContext(sandbox);for(const file of ['score.js','settings.js','levels.js','progression.js','scene-art.js','renderer.js','fx.js','enemies.js','ui.js','game.js'])vm.runInContext(readFileSync(file,'utf8'),sandbox);
vm.runInContext(`{
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const spitterAt=(x,y)=>Object.assign({x,y,type:11,hp:90,max:90,attack:0,hit:0,seed:1,alert:true,mode:'hunt',phase:0,chargeCooldown:0,heading:0,stagger:0,slow:0,kx:0,ky:0,poise:0,cool:0,lag:90});
const mob=(x,y,type=0)=>({x,y,type,hp:ENEMY_TYPES[type].hp,max:ENEMY_TYPES[type].hp,attack:0,hit:0,seed:0,alert:true,mode:'hunt',phase:0,chargeCooldown:0,heading:0,stagger:0,slow:0,kx:0,ky:0,poise:0,cool:0,lag:ENEMY_TYPES[type].hp});
function run(seconds,god=true,dt=.04){for(let t=0;t<seconds;t+=dt){if(god)player.hp=1e5;tick(dt);}}

// Spawn safety: no enemy within 4 cells of any spawn with a direct line of sight.
for(let index=0;index<LEVELS.length;index++){loadLevel(index);const [sx,sy]=LEVELS[index].spawn;
 for(const e of enemies){const d=Math.hypot(e.x-sx,e.y-sy);assert.ok(!(d<4&&sight(sx,sy,e.x,e.y)),'Enemy too close to spawn in level '+index+': '+e.x+','+e.y);assert.ok(!solid(e.x,e.y),'Enemy inside geometry');}}
// Standing still at the spawn for 3 s costs no health on any level.
for(let index=0;index<LEVELS.length;index++){loadLevel(index);running=true;for(let i=0;i<75;i++)tick(.04);assert.equal(player.hp,100,'Hit while idle at the spawn of level '+index);assert.equal(running,true);}
assert.deepEqual([0,1,3].map(i=>LEVELS[i].enemies.filter(e=>e[2]===11).length),[2,3,3],'Spitters in levels 1, 2 and 4');
assert.ok(LEVELS.every((l,i)=>i===3?l.boss?.type===12:!l.boss),'Only the malt house has a boss');

// Spitter backs off when the player is close and closes in when far, never melee-rushing.
loadLevel(1);running=true;player.x=2.5;player.y=2.5;enemies=[spitterAt(4.5,2.5)];
run(3);let d=Math.hypot(enemies[0].x-player.x,enemies[0].y-player.y);assert.ok(d>3.4,'Spitter retreats to keep distance: '+d.toFixed(2));
enemies=[spitterAt(12.5,2.5)];run(5);d=Math.hypot(enemies[0].x-player.x,enemies[0].y-player.y);assert.ok(d<8&&d>3,'Spitter closes to firing range: '+d.toFixed(2));
// It telegraphs (inflated frame + spit sound) for 0.5 s before a glob appears.
enemies=[spitterAt(7.5,2.5)];EnemyAI.enemyShots.length=0;synthCalls.length=0;player.hp=1e5;tick(.02);
assert.equal(enemies[0].mode,'spit');assert.equal(enemies[0].frame,2);assert.ok(synthCalls.includes('spit'));assert.equal(EnemyAI.enemyShots.length,0,'No glob during the telegraph');
assert.ok(EnemyAI.sprites().some(s=>s.fullbright),'Telegraph shows a forming glob');
for(let i=0;i<14;i++){player.hp=1e5;tick(.04);}assert.equal(EnemyAI.enemyShots.length,1,'Glob fired after the telegraph');
const g=EnemyAI.enemyShots[0];assert.ok(Math.abs(Math.hypot(g.dx,g.dy)-4.5)<1e-9,'Slow, dodgeable glob speed');
const look=EnemyAI.look(enemies[0]);assert.ok(look.img&&look.size>0);assert.equal(EnemyAI.look(mob(1,1,0)),null);
const glob=EnemyAI.sprites().find(s=>s.fullbright&&s.size===.3);assert.ok(glob&&glob.img,'Glob billboard per contract');

// A glob hurts exactly once, then is gone; a dodged glob splats on the wall.
loadLevel(1);running=true;player.x=2.5;player.y=2.5;player.hp=100;enemies=[];
EnemyAI.enemyShots.push({x:6.5,y:2.5,dx:-4.5,dy:0,damage:12,life:4,age:0,z:.3});
for(let i=0;i<60;i++)tick(.04);assert.equal(player.hp,88,'Glob damage applied exactly once');assert.equal(EnemyAI.enemyShots.length,0);
player.hp=100;let bursts=0;const burst=GameFX.burst;GameFX.burst=(...args)=>{bursts++;burst(...args);};synthCalls.length=0;
EnemyAI.enemyShots.push({x:6.5,y:3.2,dx:-4.5,dy:0,damage:12,life:4,age:0,z:.3});
for(let i=0;i<60;i++)tick(.04);assert.equal(player.hp,100,'Sidestep dodges the glob');assert.equal(EnemyAI.enemyShots.length,0,'Glob dies on the wall');
assert.ok(bursts===1&&synthCalls.includes('splat'),'Wall splat makes particles and a sound');GameFX.burst=burst;
player.hp=5;EnemyAI.enemyShots.push({x:3,y:2.5,dx:-4.5,dy:0,damage:12,life:4,age:0,z:.3});tick(.04);assert.equal(dead,true,'Glob can end the run');assert.equal(EnemyAI.enemyShots.length,0);

// Knockback goes through move(): 200 random hits near walls and props never put a body inside geometry.
for(const index of [0,3]){loadLevel(index);running=false;player.x=1.5;player.y=1.5;
 const cells=[];map.forEach((row,y)=>row.forEach((t,x)=>{if(!t&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>map[y+dy]?.[x+dx]))cells.push([x,y]);}));
 for(let i=0;i<200;i++){const [cx,cy]=cells[Math.floor(rnd()*cells.length)];const e=mob(cx+.25+rnd()*.5,cy+.25+rnd()*.5,[0,2,4,8,11][i%5]);e.hp=e.max=1e6;e.alert=false;if(solid(e.x,e.y))continue;
  const a=rnd()*Math.PI*2;EnemyAI.damage(e,1,{x:e.x+Math.cos(a)*.3,y:e.y+Math.sin(a)*.3,force:.5+rnd()*6,type:'can'});
  for(let k=0;k<12;k++){EnemyAI.update(e,.04);assert.ok(!solid(e.x,e.y)&&map[Math.floor(e.y)][Math.floor(e.x)]===0,'Knocked into geometry at '+e.x.toFixed(2)+','+e.y.toFixed(2));}}}
loadLevel(1);let e=mob(10.5,8.5,0);e.hp=e.max=1e4;EnemyAI.damage(e,1,{x:9.5,y:8.5,force:2});for(let k=0;k<20;k++)EnemyAI.update(e,.04);assert.ok(e.x>10.8,'Knockback pushes away from the source');
e=mob(10.5,8.5,7);EnemyAI.damage(e,1,{x:9.5,y:8.5,force:2});for(let k=0;k<20;k++)EnemyAI.update(e,.04);assert.ok(e.x-10.5<.2,'Heavy forklifts barely move');

// Stagger: heavy hits stun and block attacks; corks stun small types only; foam slows.
loadLevel(1);running=true;player.x=2.5;player.y=2.5;player.hp=100;e=mob(3.1,2.5,0);enemies=[e];synthCalls.length=0;
EnemyAI.damage(e,30);assert.ok(e.stagger>0,'40% hit staggers');assert.ok(synthCalls.includes('stagger'));
for(let i=0;i<12;i++)tick(.04);assert.equal(player.hp,100,'Staggered enemy does not attack');
for(let i=0;i<20;i++)tick(.04);assert.ok(player.hp<100,'Attacks resume after the stagger');
e=mob(8.5,8.5,2);EnemyAI.damage(e,5,{x:8,y:8.5,type:'cork'});assert.ok(e.stagger>0,'Cork staggers small types');
e.stagger=0;EnemyAI.damage(e,5,{x:8,y:8.5,type:'cork'});assert.equal(e.stagger,0,'Short poise window prevents cork stun-lock');
e=mob(8.5,8.5,10);EnemyAI.damage(e,19,{x:8,y:8.5,type:'cork'});assert.equal(e.stagger,0,'Cork does not stagger big types');
const step=slowed=>{loadLevel(1);running=true;player.x=2.5;player.y=8.5;const m=mob(9.5,8.5,0);m.hp=m.max=1e4;enemies=[m];if(slowed)EnemyAI.damage(m,1,{x:m.x,y:m.y,type:'foam',force:0});m.kx=m.ky=0;for(let i=0;i<20;i++){player.hp=1e5;tick(.04);}return 9.5-m.x;};
const fast=step(false),slow=step(true);assert.ok(slow<fast*.7&&slow>0,'Foam slows movement: '+slow.toFixed(2)+' vs '+fast.toFixed(2));

// HP overlays draw only for wounded, visible, non-boss enemies.
loadLevel(1);player.x=2.5;player.y=8.5;let fills=0;const fill=ctx.fillRect;ctx.fillRect=(...a)=>{fills++;};const rect=enemy=>({x:300,top:100,w:120,h:200,d:4,visible:true,enemy});
EnemyAI.overlays([rect({...mob(6.5,8.5),hp:75})]);assert.equal(fills,0,'No bar at full HP');
EnemyAI.overlays([{...rect({...mob(6.5,8.5),hp:20}),visible:false}]);assert.equal(fills,0,'No bar when hidden');
EnemyAI.overlays([rect({...mob(6.5,5.5),hp:20})]);assert.equal(fills,0,'No bar through walls');
EnemyAI.overlays([rect({...mob(6.5,8.5),hp:20})]);assert.ok(fills>=3,'Wounded enemy gets a bar');ctx.fillRect=fill;

// Boss: appears only after the malt house is clear, blocks the rescue, three phases, capped adds, then the rescue resumes.
loadLevel(3);running=true;assert.equal(bossDefeated,false);assert.equal(EnemyAI.bossAlive(),false);
enemies=[];kills=levelTotal-1;run(1);assert.equal(EnemyAI.bossState,'none','No boss before the clear');
kills=levelTotal;const total=levelTotal;tick(.01);assert.equal(EnemyAI.bossState,'rising');assert.ok(EnemyAI.bossAlive());assert.ok(synthCalls.includes('bossRoar'));
const panel=props.find(p=>p.type==='aspiration');player.x=panel.x+.8;player.y=panel.y;interact();assert.equal(rescueStage,0,'Rescue blocked while the boss lives');assert.equal($('#toast').textContent,'Сначала Солодовый король!');
run(2);const boss=EnemyAI.boss;assert.ok(boss&&enemies.includes(boss),'Boss bursts out');assert.equal(boss.hp,1400);assert.equal(levelTotal,total,'Boss is not part of levelTotal');
assert.equal(EnemyAI.look(boss).size,ENEMY_TYPES[12].size);
interact();assert.equal(rescueStage,0);
// Slam hits in the open, not through a wall.
boss.mode='hunt';boss.slam=0;boss.x=2.5;boss.y=9.5;player.x=2.5;player.y=7.8;player.hp=100;for(let i=0;i<25;i++)tick(.04);assert.equal(player.hp,78,'Slam hits once in the open');
boss.mode='hunt';boss.slam=0;boss.x=2.5;boss.y=9.5;player.x=2.5;player.y=11.5;player.hp=100;for(let i=0;i<25;i++)tick(.04);assert.equal(player.hp,100,'Wall blocks the slam');
// Phase thresholds.
EnemyAI.damage(boss,400);tick(.01);assert.equal(boss.stage,1);
EnemyAI.damage(boss,100);tick(.01);assert.equal(boss.stage,2,'Phase 2 below 66%');
boss.x=14.5;boss.y=19;player.x=14.5;player.y=12.5;boss.mode='hunt';boss.volley=0;boss.slam=9;EnemyAI.enemyShots.length=0;player.hp=1e5;tick(.04);assert.equal(boss.mode,'volley');
let most=0;for(let i=0;i<16;i++){player.hp=1e5;tick(.04);most=Math.max(most,EnemyAI.enemyShots.length);}assert.equal(most,5,'Phase 2 fires a 5-glob fan volley');
EnemyAI.damage(boss,500);tick(.01);assert.equal(boss.stage,3,'Phase 3 below 33%');
run(60);const adds=enemies.filter(a=>a.add);assert.equal(adds.length,LEVELS[3].boss.adds,'Adds capped');assert.equal(EnemyAI.addsLeft,0);assert.ok(adds.every(a=>a.type===8));
const before=kills;EnemyAI.damage(adds.find(a=>a.hp>0)||adds[0],1e4);assert.equal(kills,before,'Adds do not count as kills');
EnemyAI.damage(boss,1e4);assert.equal(bossDefeated,true);assert.equal(EnemyAI.bossAlive(),false);assert.equal(kills,total,'Boss kill does not change the clear count');
assert.ok(enemies.filter(a=>a.add).every(a=>a.hp<=0),'Remaining adds crumble with the king');
for(const [stage,type] of [[1,'aspiration'],[2,'screw'],[3,'hatch']]){const p=props.find(p=>p.type===type);player.x=p.x;player.y=p.y;interact();assert.equal(rescueStage,stage);}
assert.equal(stellaVisible,true);player.x=LEVELS[3].stella[0];player.y=LEVELS[3].stella[1];interact();assert.equal(won,true);

// Scripted fight through the real projectile loop: god mode, corks at the king until the rescue completes.
start();loadLevel(3);running=true;enemies=[];kills=levelTotal;run(2);assert.ok(EnemyAI.boss);player.x=14.5;player.y=14.5;choose(2);weapons[2].ammo=1e5;
for(let t=0;t<180&&!bossDefeated;t+=.04){player.hp=1e5;const k=EnemyAI.boss;player.a=Math.atan2(k.y-player.y,k.x-player.x);shoot();tick(.04);}
assert.equal(bossDefeated,true,'King falls to sustained fire: '+EnemyAI.boss.hp);assert.equal(running,true);
for(const type of ['aspiration','screw','hatch']){const p=props.find(p=>p.type===type);player.x=p.x;player.y=p.y;interact();}
player.x=LEVELS[3].stella[0];player.y=LEVELS[3].stella[1];interact();assert.equal(won,true,'Rescue flow ends with Stella');
// Death resets the boss for the retry.
loadLevel(3);assert.equal(bossDefeated,false);assert.equal(EnemyAI.boss,null);assert.equal(EnemyAI.bossState,'none');
}`,sandbox);

// GameAudio.synth: Web Audio voices through the effects bus, silent before init and when muted.
const started=[],connections=[];
const param=()=>({value:0,setTargetAtTime(v){this.value=v},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},exponentialRampToValueAtTime(v){assert.ok(v>0,'Exponential ramps need positive targets');this.value=v}});
const node=extra=>Object.assign({connect(target){connections.push([this,target]);return target}},extra);
class AudioContext{
 constructor(){this.currentTime=0;this.sampleRate=8000;this.destination={};}
 createGain(){return node({gain:param()})}
 createStereoPanner(){return node({pan:param()})}
 createBiquadFilter(){return node({frequency:param(),Q:param(),type:''})}
 createOscillator(){return node({frequency:param(),type:'',start(t){started.push(this)},stop(){this.stopped=true}})}
 createBuffer(channels,length){const data=new Float32Array(length);return {getChannelData:()=>data,length}}
 createBufferSource(){return node({playbackRate:param(),start(){started.push(this)},stop(){this.stopped=true;this.onended?.()}})}
 async resume(){}
 async decodeAudioData(){return {duration:2}}
}
const audioBox={window:{AudioContext},document:{querySelector:()=>({hidden:true,textContent:''})},fetch:async()=>({ok:false,status:404}),console:{...console,warn(){}},setTimeout:()=>0,clearTimeout(){},localStorage};
vm.createContext(audioBox);for(const file of ['audio-manifest.js','audio.js'])vm.runInContext(readFileSync(file,'utf8'),audioBox);
(async()=>{
 const api=vm.runInContext('GameAudio',audioBox),names=['spit','splat','bossRoar','bossStomp','secret','combo','upgrade','hitmarker','stagger'];
 assert.equal(api.synth('spit'),false,'No-op before the audio context exists');
 await api.resume();
 for(const name of names){const count=started.length;assert.equal(api.synth(name,{pan:-.4,volume:.8,distance:3}),true,name);assert.ok(started.length>count,name+' starts sources');}
 assert.equal(api.synth('spit'),false,'Per-voice rate limit');assert.equal(api.synth('nonsense'),false);
 const bus=connections.filter(([,target])=>target&&target.gain&&connections.some(([from,to])=>from===target&&to.gain)).length;assert.ok(bus>0,'Voices route through gain stages into the mixer');
 api.pause();assert.ok(started.every(s=>s.stopped),'Pause stops synthesized voices');assert.equal(api.synth('combo'),false,'Silent while paused');
 await api.resume();api.setEnabled(false);assert.equal(api.synth('secret'),false,'Mute silences synth');
 console.log('PASS: enemies — spawn safety, spitter range/telegraph/glob, knockback fuzz, stagger/slow, HP bars, boss phases/adds/rescue gate, scripted boss fight, synth voices');
})().catch(e=>{console.error(e);process.exitCode=1});
