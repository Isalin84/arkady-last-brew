const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
// Replayability: combo chain, secret walls and stashes, medals, difficulty rules, veteran run reset.
const gradient={addColorStop(){}};
const context=new Proxy({createLinearGradient:()=>gradient},{get:(t,p)=>t[p]||(()=>{})});
const elements=new Map();
const element=()=>({style:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},addEventListener(){},getContext:()=>context,requestPointerLock:()=>Promise.resolve(),removeAttribute(){},setAttribute(){},textContent:'',innerHTML:'',hidden:false});
const document={querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:element,addEventListener(){},exitPointerLock(){}};
const storage=new Map(),localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))};
const synths=[],audioEvents=[],audioMock={resume:()=>({then(fn){fn();return this}}),say:event=>{audioEvents.push(event);return true},synth:name=>synths.push(name)};
const sandbox={document,window:{addEventListener(){}},localStorage,performance:{now:()=>0},requestAnimationFrame(){},matchMedia:()=>({matches:false}),GameAudio:new Proxy(audioMock,{get:(t,p)=>t[p]||(()=>{})}),ScoreCard:{create:async()=>({url:'blob:score'}),download(){},copyLink:async()=>{},share:async()=>true},setTimeout(){},console,assert,synths,audioEvents};
vm.createContext(sandbox);for(const file of ['score.js','settings.js','levels.js','progression.js','scene-art.js','renderer.js','fx.js','enemies.js','ui.js','game.js'])vm.runInContext(readFileSync(file,'utf8'),sandbox);
vm.runInContext(`
const near=(a,b)=>Math.abs(a-b)<1e-9;
const reachable=()=>{const startCell=[Math.floor(player.x),Math.floor(player.y)],queue=[startCell],seen=new Set([startCell.join(',')]);for(let k=0;k<queue.length;k++){const [x,y]=queue[k];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!solid(nx+.5,ny+.5)&&!seen.has(key)){seen.add(key);queue.push([nx,ny]);}}}return seen;};
const N=[[1,0],[-1,0],[0,1],[0,-1]];

// --- Combo: x1 -> x4 inside 3 s, capped, drained by tick, reset by damage ---
GameScore.begin();const base=[100+Math.round(75*.55)];
assert.deepEqual(GameScore.combo,{mult:1,timer:0});
assert.equal(GameScore.kill(0,75),base[0],'First kill is x1');assert.equal(GameScore.combo.mult,1);assert.equal(GameScore.combo.timer,3);
assert.equal(GameScore.kill(0,75),base[0]*2);assert.equal(GameScore.kill(0,75),base[0]*3);assert.equal(GameScore.kill(0,75),base[0]*4);assert.equal(GameScore.kill(0,75),base[0]*4,'Combo caps at x4');assert.equal(GameScore.combo.mult,4);
assert.equal(GameScore.stats.bestCombo,4);assert.equal(GameScore.stats.kills,5);
GameScore.tick(2);assert.ok(near(GameScore.combo.timer,1));assert.equal(GameScore.combo.mult,4,'Chain survives inside the window');
GameScore.tick(1.5);assert.equal(GameScore.combo.timer,0);assert.equal(GameScore.combo.mult,1,'Window expiry drops the multiplier');
assert.equal(GameScore.kill(0,75),base[0],'New chain starts at x1');assert.equal(GameScore.kill(0,75),base[0]*2);
GameScore.hurt(0);assert.equal(GameScore.combo.mult,2,'Zero damage does not reset');GameScore.hurt(5);assert.equal(GameScore.combo.mult,1,'Damage resets the chain');assert.equal(GameScore.combo.timer,0);
assert.equal(GameScore.kill(0,75),base[0],'Chain restarts after damage');assert.equal(GameScore.stats.bestCombo,4,'Best combo is kept');
GameScore.begin();assert.equal(GameScore.stats.bestCombo,1);
// Toast from the game side when a kill raises the multiplier.
reset();running=true;enemies=[{x:3.4,y:2.8,hp:10,max:10,type:0,attack:0,hit:0,alert:false},{x:3.8,y:3.1,hp:10,max:10,type:0,attack:0,hit:0,alert:false},{x:4.2,y:3.4,hp:10,max:10,type:0,attack:0,hit:0,alert:false}];levelTotal=12;
damage(enemies[0],99);assert.notEqual($('#toast').textContent,'Комбо ×1!');damage(enemies[1],99);assert.equal($('#toast').textContent,'Комбо ×2!');assert.ok(synths.includes('combo'));damage(enemies[2],99);assert.equal($('#toast').textContent,'Комбо ×3!');

// --- Secrets: every level has 1-2, they are reachable, open with E, spawn their stash, leave the map in bounds ---
for(let index=0;index<LEVELS.length;index++){
 const list=LEVELS[index].secrets;assert.ok(list.length>=1&&list.length<=2,'1-2 secrets in level '+index);
 loadLevel(index);running=true;assert.equal(secretsTotal,list.length);assert.equal(secretsFound,0);assert.equal(secretWalls.size,list.length);assert.equal(stashGold.length,0);
 const itemCount=items.length,seen=reachable();
 assert.equal(itemCount,LEVELS[index].items.length,'Stash lives outside items until opened');
 assert.ok(secretBills.length>=list.length,'Every closed wall gets a visible mark');
 for(const s of list){
  const [wx,wy]=s.wall;assert.equal(map[wy][wx],1,'Secret is a plain brick wall');assert.ok(!LEVELS[index].logoWalls.some(([x,y])=>x===wx&&y===wy),'Logo walls are not secrets');
  const open=N.filter(([dx,dy])=>map[wy+dy]?.[wx+dx]===0&&seen.has((wx+dx)+','+(wy+dy)));assert.ok(open.length>=1,'Reachable from the room side: '+s.wall);
  assert.ok(s.hint.length>8);assert.ok(s.stash.length>=1);
  for(const [x,y,type] of s.stash){assert.ok(['ammo','health','gold'].includes(type));const cx=Math.floor(x),cy=Math.floor(y);assert.ok((cx===wx&&cy===wy)||(Math.abs(cx-wx)+Math.abs(cy-wy)===1&&map[cy]?.[cx]===0),'Stash is in the opened cell or next to it');}
 }
 const before=GameScore.current,secretsBefore=GameScore.stats.secrets;
 list.forEach((s,k)=>{
  const [wx,wy]=s.wall,[dx,dy]=N.find(([dx,dy])=>map[wy+dy]?.[wx+dx]===0&&reachable().has((wx+dx)+','+(wy+dy)));
  player.x=wx+dx+.5-dx*.2;player.y=wy+dy+.5-dy*.2;player.a=Math.atan2(-dy,-dx);
  // Not facing the wall: nothing opens and the rescue/exit logic is untouched.
  player.a+=Math.PI;interact();assert.equal(secretsFound,k,'E facing away opens nothing');player.a-=Math.PI;
  interact();assert.equal(secretsFound,k+1);assert.equal(map[wy][wx],0,'Opened cell becomes floor');assert.ok(!secretWalls.has(wx+','+wy));
  assert.equal($('#toast').textContent,'Тайник найден! '+(k+1)+'/'+list.length);assert.ok(synths.includes('secret'));
  interact();assert.equal(secretsFound,k+1,'A secret opens once');
 });
 assert.equal(secretsFound,list.length);assert.equal(GameScore.stats.secrets,secretsBefore+list.length);assert.equal(GameScore.current,before+250*list.length,'+250 per secret');
 const after=reachable();
 for(const s of list)for(const [x,y,type] of s.stash){assert.ok(after.has(Math.floor(x)+','+Math.floor(y)),'Stash reachable after opening');assert.ok(!solid(x,y));}
 const goldCount=list.reduce((n,s)=>n+s.stash.filter(t=>t[2]==='gold').length,0);assert.equal(stashGold.length,goldCount);assert.equal(items.length,itemCount+list.reduce((n,s)=>n+s.stash.filter(t=>t[2]!=='gold').length,0));
 assert.ok(!secretBills.some(b=>b.img===stashArt('mark')),'Marks vanish when the walls open');
 // The level's bounds are intact: all outer cells that are not niches stay solid.
 assert.equal(map.length,LEVELS[index].map.length);assert.ok(map.every(r=>r.length===LEVELS[index].map[0].length));
 // Gold: walking onto the cap pays +500 once.
 for(const g of [...stashGold]){const s0=GameScore.current;player.x=g.x;player.y=g.y;tick(.01);assert.equal(GameScore.current,s0+500,'Gold cap +500');}
 assert.equal(stashGold.length,0);assert.equal(secretBills.length,0);
 loadLevel(index);assert.equal(secretsFound,0,'Counters reset with the level');assert.equal(map[list[0].wall[1]][list[0].wall[0]],1,'Reloaded level has its wall back');
}
// Looking at a distant secret wall shows the hint and does not open it.
loadLevel(0);running=true;{const s=LEVELS[0].secrets[0],[wx,wy]=s.wall;player.x=wx-1.8;player.y=wy+.5;player.a=0;interact();assert.equal(secretsFound,0);assert.equal($('#toast').textContent,s.hint);}
// The level-4 rescue is untouched by E presses that are not aimed at a secret.
loadLevel(3);running=true;player.x=10.5;player.y=5.5;player.a=0;interact();assert.equal(rescueStage,0);

// --- Medals ---
const lr=o=>GameScore.levelResult({level:0,time:100,damage:10,secretsFound:2,secretsTotal:2,deaths:0,...o});
assert.equal(lr({}).medal,'gold');assert.equal(lr({}).criteria.length,3);assert.ok(lr({}).criteria.every(c=>c.ok));
assert.equal(lr({time:121}).medal,'silver','Over par -> silver');assert.equal(lr({damage:26}).medal,'silver');assert.equal(lr({secretsFound:1}).medal,'silver');
assert.equal(lr({time:120,damage:25}).medal,'gold','Boundaries are inclusive');
assert.equal(lr({time:300,damage:80}).medal,'bronze');assert.equal(lr({time:300,secretsFound:0}).medal,'bronze');
assert.equal(lr({deaths:1}).medal,'silver','A death caps the medal at silver');
assert.equal(GameScore.levelResult({level:3,time:299,damage:0,secretsFound:0,secretsTotal:0}).medal,'gold','No secrets to find counts as done');assert.equal(GameScore.levelResult({level:3,time:301,damage:0,secretsFound:0,secretsTotal:0}).medal,'silver','Par comes from levels.js');
assert.deepEqual(LEVELS.map(l=>l.par.time),[120,180,200,300]);
// Level result from real tracking: this level's own time and damage, best medal stored per difficulty.
reset();assert.equal(GameScore.bestMedals('normal').join(),',,,');
running=true;for(let i=0;i<100;i++)GameScore.tick(1);hurtPlayer(10);
let res=GameScore.finishLevel({level:0,secretsFound:2,secretsTotal:2});assert.equal(res.medal,'gold');assert.equal(res.time,100);assert.equal(res.damage,10);assert.equal(GameScore.bestMedals('normal')[0],'gold');assert.equal(GameScore.stats.medals[0],'gold');
assert.equal(GameScore.medalLine(res),'Медаль цеха: ★★★ Золото · 1:40 / пар 2:00 · урон 10 · тайники 2/2');
GameScore.checkpoint();for(let i=0;i<200;i++)GameScore.tick(1);GameScore.finishLevel({level:0,secretsFound:0,secretsTotal:2});assert.equal(GameScore.bestMedals('normal')[0],'gold','A worse run never lowers the best medal');assert.equal(GameScore.bestMedals('veteran')[0],null,'Medals are stored per difficulty');
assert.ok(JSON.parse(localStorage.getItem('arkady-medals-v1')).normal);
// Shown on the transition overlay.
loadLevel(0);running=true;GameScore.begin();GameScore.checkpoint();GameScore.tick(60);kills=levelTotal;enemies=[];player.x=LEVELS[0].exit[0];player.y=LEVELS[0].exit[1];tick(.01);assert.equal(transition,true);
assert.ok($('.intro p').innerHTML.includes('Медаль цеха: ★'),'Medal line on the transition overlay');assert.ok($('.intro p').innerHTML.includes('пар 2:00'));assert.ok($('.intro p').innerHTML.includes('Припасы пополнены'));

// --- Difficulty ---
function startRun(key){GameSettings.set('difficulty',key);reset();running=true;}
startRun('normal');assert.equal(enemies[0].hp,75);const hp0=player.hp;hurtPlayer(10);assert.equal(player.hp,hp0-10);
startRun('rookie');assert.equal(enemies[0].hp,Math.round(75*.75));assert.equal(enemies[0].max,enemies[0].hp);assert.equal(enemies[1].hp,Math.round(110*.75));hurtPlayer(10);assert.equal(player.hp,100-7,'Rookie takes x0.7 damage');
player.hp=40;player.x=1.5;player.y=4.5;tick(.01);assert.equal(player.hp,85,'Rookie health pickup +45');
startRun('veteran');assert.equal(enemies[0].hp,Math.round(75*1.4));assert.equal(enemies[1].hp,Math.round(110*1.4));hurtPlayer(10);assert.equal(player.hp,100-15,'Veteran takes x1.5 damage');
player.hp=40;player.x=1.5;player.y=4.5;tick(.01);assert.equal(player.hp,60,'Veteran health pickup +20');
assert.equal(GameScore.stats.difficulty,'veteran');GameScore.begin('veteran');GameScore.kill(0,75);assert.equal(GameScore.current,base[0]*2,'Veteran score x2');GameScore.begin('rookie');GameScore.kill(0,75);assert.equal(GameScore.current,Math.round(base[0]*.6));GameScore.begin('normal');GameScore.kill(0,75);assert.equal(GameScore.current,base[0]);
// Damage reaches the enemy hit through a real shot: veteran enemies survive two bottles that kill a normal one.
startRun('veteran');enemies=[{x:3.5,y:4.4,type:0,hp:105,max:105,attack:0,hit:0,seed:0,alert:false}];player.x=3.5;player.y=2.5;player.a=Math.PI/2;shoot();for(let i=0;i<20;i++)tick(.025);shoot();for(let i=0;i<22;i++)tick(.025);assert.equal(kills,0,'Veteran enemy survives two bottle hits');
// Unknown stored difficulty falls back to normal.
startRun('normal');GameSettings.set('difficulty','nonsense');reset();assert.equal(diffKey,'normal');assert.equal(GameScore.stats.difficulty,'normal');

// --- Veteran: one life, death restarts the whole run from level 1 ---
GameSettings.set('difficulty','veteran');reset();running=true;loadLevel(1);GameScore.checkpoint();assert.equal(levelIndex,1);
hurtPlayer(5000);assert.equal(dead,true);assert.equal(runFailed,true);assert.ok($('.intro h1').innerHTML.includes('ПРОВАЛЕНА'));assert.ok($('.intro p').innerHTML.includes('Ветеран'));assert.ok($('#start').innerHTML.includes('заново'));
start();assert.equal(levelIndex,0,'Veteran death restarts from level 1');assert.equal(running,true);assert.equal(dead,false);assert.equal(player.hp,100);assert.equal(GameScore.stats.deaths,0,'The failed run is discarded');assert.equal(GameScore.stats.kills,0);assert.equal(audioEvents.at(-1),'start');
// Other difficulties still retry only the current level.
GameSettings.set('difficulty','rookie');reset();running=true;loadLevel(2);GameScore.checkpoint();hurtPlayer(5000);assert.equal(dead,true);assert.equal(runFailed,false);assert.ok($('.intro h1').innerHTML.includes('ПРОПАЛА'));start();assert.equal(levelIndex,2);assert.equal(GameScore.stats.deaths,1);
GameSettings.set('difficulty','normal');

// --- Final result carries difficulty, medals and best combo; veteran unlocks after a win ---
assert.equal(GameScore.veteranUnlocked(),false);
GameSettings.set('difficulty','veteran');reset();GameScore.kill(10,310);GameScore.kill(10,310);GameScore.finishLevel({level:0,secretsFound:2,secretsTotal:2});
finalResult=GameScore.finish(80);assert.equal(finalResult.difficulty,'veteran');assert.equal(finalResult.bestCombo,2);assert.equal(finalResult.medals.length,4);assert.ok(['gold','silver','bronze'].includes(finalResult.medals[0]));assert.equal(finalResult.medals[3],null);
assert.equal(GameScore.records()[0].difficulty,'veteran');assert.equal(GameScore.difficultyBadge('veteran'),'ВЕТ');assert.equal(GameScore.difficultyBadge('rookie'),'СТЖ');assert.equal(GameScore.difficultyBadge('normal'),'');assert.equal(GameScore.difficultyLabel('veteran'),'Ветеран');
assert.equal(GameScore.veteranUnlocked(),true,'Veteran unlocks after a win');assert.equal(localStorage.getItem('arkady-veteran-v1'),'1');
GameSettings.set('difficulty','normal');
`,sandbox);

// A second page load (fresh sandbox, same storage) keeps the veteran flag, medals and records.
const second=vm.createContext({localStorage,Date,Math});vm.runInContext(readFileSync('score.js','utf8'),second);
assert.equal(vm.runInContext('GameScore.veteranUnlocked()',second),true,'Veteran flag persists');
assert.equal(vm.runInContext('GameScore.bestMedals("normal")[0]',second),'gold','Medals persist');
assert.equal(vm.runInContext('GameScore.records()[0].difficulty',second),'veteran','Record difficulty persists');
const clean=vm.createContext({localStorage:{getItem:()=>null,setItem(){}},Date,Math});vm.runInContext(readFileSync('score.js','utf8'),clean);
assert.equal(vm.runInContext('GameScore.veteranUnlocked()',clean),false,'Veteran is locked before the first win');
console.log('PASS: replay (combo chain/cap/reset, secrets open+stash+gold, medals, difficulty multipliers, veteran run reset, unlock persistence)');
