'use strict';
// True when the current level's boss is dead or the level has none; interact() gates the silo rescue on it.
let bossDefeated=true;
// Enemy behaviour: flow-field navigation, melee, forklift charges, spitters, the malt-house boss, damage and HP overlays. Reads game.js globals at call time.
const EnemyAI=(()=>{
 let pathField=[],pathAt=-1,boss=null,bossState='none',bossTimer=0,addsLeft=0;
 // Default knockback per projectile kind when the caller passes no explicit force.
 const FORCE={bottle:1.2,can:2.4,cork:.35,foam:.2};
 const NAVY='#0B1D3A',GOLD='#D4AF37',RED='#C8553D';
 function pan(x,y){return Math.max(-1,Math.min(1,(-Math.sin(player.a)*(x-player.x)+Math.cos(player.a)*(y-player.y))/5));}
 function sfx(name,x,y,volume=1){GameAudio.synth?.(name,{pan:pan(x,y),distance:Math.hypot(x-player.x,y-player.y),volume});}
 // Camera shake belongs to the weapon track's GameFX; use whichever API it exposes.
 function shake(v){if(typeof GameFX.addShake==='function')GameFX.addShake(v);else if(typeof GameFX.shake?.intensity==='number')GameFX.shake.intensity=Math.max(GameFX.shake.intensity,v);}
 function radio(title,text,seconds){storyTimer=seconds;const el=document.querySelector('#radio-message');el.hidden=false;el.innerHTML=`<b>${title}</b><span>${text}</span>`;}
 function mass(e){const s=ENEMY_TYPES[e.type];return s.mass??(s.chargeSpeed?6:s.hp>=200?3:s.hp>=110?1.5:1);}
 function make(type,x,y,extra){const hp=ENEMY_TYPES[type].hp;return Object.assign({x,y,type,hp,max:hp,attack:.6,hit:0,seed:Math.random()*9,alert:true,mode:'hunt',phase:0,chargeCooldown:1.5,heading:Math.PI,stagger:0,slow:0,kx:0,ky:0,poise:0,cool:1,lag:hp},extra);}
 // src (optional) = {x,y,force,type}: where the hit came from, knockback strength and projectile kind.
 function damage(e,d,src){
  if(e.hp<=0)return;e.hp-=d;e.hit=.16;GameFX.onHit(e,d);
  if(e.hp<=0){kill(e);return;}
  const kind=src?.type,charging=e.mode==='charge';
  if(kind==='foam')e.slow=Math.max(e.slow||0,e.boss?.9:1.4);
  const m=mass(e);
  if(m<Infinity&&!charging){
   let dx=e.x-(src?.x??player.x),dy=e.y-(src?.y??player.y),l=Math.hypot(dx,dy);
   if(l<.001){dx=e.x-player.x;dy=e.y-player.y;l=Math.hypot(dx,dy)||1;}
   const v=(src?.force??FORCE[kind]??.4+d/60)*2.4/m;e.kx=(e.kx||0)+dx/l*v;e.ky=(e.ky||0)+dy/l*v;
  }
  if(e.boss||charging)return;
  // Heavy hits (30% of max HP) and can blasts always stagger; corks only interrupt small creatures, with a short poise window against stun-lock.
  const small=ENEMY_TYPES[e.type].hp<=110,cork=kind==='cork'&&small&&!(e.poise>0),t=d>=e.max*.3?.55:kind==='can'?.45:cork?.28:0;
  if(t>0){if(!(e.stagger>0))sfx('stagger',e.x,e.y,.8);e.stagger=Math.max(e.stagger||0,t);e.staggerBy=kind;e.attack=Math.max(e.attack||0,.35);if(cork)e.poise=.75;if(e.mode==='spit'||e.mode==='windup'){e.mode='hunt';e.frame=undefined;e.cool=Math.max(e.cool||0,.8);}}
 }
 // The boss and its summoned mites are extra: they never count toward kills / levelTotal.
 function kill(e){
  const counted=!e.boss&&!e.add;if(counted)kills++;
  GameScore.kill(e.type,e.max);GameFX.burst(e.x,e.y,ENEMY_TYPES[e.type].color,25);GameFX.onKill(e);GameAudio.kill();
  if(e.boss){bossDown(e);updateHUD();return;}
  GameAudio.say(e.type===5?'golemkill':LEVELS[levelIndex].dialogue.kill);
  if(counted&&kills===levelTotal&&(!LEVELS[levelIndex].boss||bossDefeated))toast(LEVELS[levelIndex].clear);
  updateHUD();
 }
 // A shared flow field lets awakened creatures navigate around production equipment.
 function routeField(){
  pathField=map.map(row=>row.map(()=>Infinity));const x=Math.floor(player.x),y=Math.floor(player.y),queue=[[x,y]];pathField[y][x]=0;
  for(let i=0;i<queue.length;i++){const [cx,cy]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(pathField[ny]?.[nx]===Infinity&&!solid(nx+.5,ny+.5)){pathField[ny][nx]=pathField[cy][cx]+1;queue.push([nx,ny]);}}}
 }
 function chase(e,dt,d,visible,mul=1,r=.23){
  let tx=player.x,ty=player.y;
  if(!visible){const x=Math.floor(e.x),y=Math.floor(e.y);let best=pathField[y]?.[x]??Infinity;let target=null;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const cost=pathField[y+dy]?.[x+dx]??Infinity;if(cost<best){best=cost;target=[x+dx+.5,y+dy+.5];}}
  if(!target)return;[tx,ty]=target;}
  const distance=Math.hypot(tx-e.x,ty-e.y);if(distance<.05)return;
  const speed=ENEMY_TYPES[e.type].speed*dt*mul*(e.slow>0?(e.boss?.75:.55):1)*(e.type===4&&Math.sin(clock*2+e.seed)>.7?1.55:1);
  move(e,(tx-e.x)/distance*speed,(ty-e.y)/distance*speed,r);
 }
 // Knockback velocity decays quickly; substeps through move() keep bodies out of walls and props.
 function knock(e,dt){
  const steps=Math.ceil(Math.hypot(e.kx,e.ky)*dt/.06)||1;
  for(let i=0;i<steps;i++)move(e,e.kx*dt/steps,e.ky*dt/steps,.23);
  const k=Math.exp(-9*dt);e.kx*=k;e.ky*=k;if(Math.hypot(e.kx,e.ky)<.05)e.kx=e.ky=0;
 }
 function forklift(e,dt,d,visible){
  const spec=ENEMY_TYPES[e.type];e.chargeCooldown=Math.max(0,e.chargeCooldown-dt);e.phase-=dt;
  const pan=(-Math.sin(player.a)*(e.x-player.x)+Math.cos(player.a)*(e.y-player.y))/5;
  if(e.mode==='windup'){
   if(e.phase<=0){e.mode='charge';e.phase=.95;GameAudio.vehicle?.('charge',d,pan);}
   return;
  }
  if(e.mode==='charge'){
   // Substeps prevent a fast forklift from tunnelling through racks or the player.
   const steps=Math.ceil(spec.chargeSpeed*dt/.08);let crash=false;
   for(let i=0;i<steps;i++){
    const dx=Math.cos(e.heading)*spec.chargeSpeed*dt/steps,dy=Math.sin(e.heading)*spec.chargeSpeed*dt/steps;
    const x=e.x,y=e.y;move(e,dx,dy,.34);
    if(Math.hypot(e.x-x,e.y-y)<Math.hypot(dx,dy)*.8){crash=true;break;}
    if(Math.hypot(e.x-player.x,e.y-player.y)<.7){hurtPlayer(spec.damage);e.mode='recover';e.phase=2.1;e.chargeCooldown=3;GameAudio.vehicle?.('crash',d,pan);return;}
   }
   if(crash||e.phase<=0){e.mode='recover';e.phase=crash?2.4:1.6;e.chargeCooldown=3;if(crash){GameFX.burst(e.x,e.y,'#ffe1a0',24);damage(e,45);GameAudio.vehicle?.('crash',d,pan);}}
   return;
  }
  if(e.mode==='recover'){if(e.phase<=0)e.mode='hunt';return;}
  if(visible&&d>1.4&&d<8&&e.chargeCooldown<=0){e.heading=Math.atan2(player.y-e.y,player.x-e.x);e.mode='windup';e.phase=e.type===7?1:.85;toast('ТАРАН! Шаг в сторону — A / D');GameAudio.vehicle?.('warn',d,pan);return;}
  if(d>.8||!visible){e.heading=Math.atan2(player.y-e.y,player.x-e.x);chase(e,dt,d,visible);}
  else if(e.attack<=0){hurtPlayer(Math.round(spec.damage*.55));e.attack=1.6;GameAudio.vehicle?.('crash',d,pan);}
 }
 function glob(x,y,a,dmg,z){ai.enemyShots.push({x:x+Math.cos(a)*.35,y:y+Math.sin(a)*.35,dx:Math.cos(a)*4.5,dy:Math.sin(a)*4.5,damage:dmg,life:4,age:0,z});}
 // Spitter: holds 4–7 cells with line of sight, strafes, inflates for 0.5 s (e.mode 'spit', e.frame 2) and lobs a slow glob.
 function spitter(e,dt,d,visible){
  const spec=ENEMY_TYPES[11];
  if(e.mode==='spit'){e.phase-=dt;e.attack=e.phase+.55;if(e.phase<=0){e.mode='hunt';e.frame=undefined;e.attack=.7;e.cool=spec.reload+(e.seed*.37%1)*1.1;if(visible)glob(e.x,e.y,Math.atan2(player.y-e.y,player.x-e.x),spec.damage,.3);}return;}
  if(!visible){chase(e,dt,d,false);return;}
  const f=d<spec.near?-1:d>spec.far?1:0,side=Math.sin(clock*.8+e.seed*2.3)*.75,s=spec.speed*dt*(e.slow>0?.55:1),ux=(player.x-e.x)/d,uy=(player.y-e.y)/d;
  move(e,(ux*f-uy*side)*s,(uy*f+ux*side)*s,.23);
  if(!(e.cool>0)&&d<spec.far+2.5){e.mode='spit';e.phase=spec.windup;e.frame=2;e.attack=spec.windup+.55;sfx('spit',e.x,e.y,.9);}
 }
 // One awake/asleep enemy step; may end the run through hurtPlayer().
 function update(e,dt){
  if(e.hp<=0)return;e.hit=Math.max(0,e.hit-dt);e.attack-=dt;if(e.slow>0)e.slow-=dt;if(e.poise>0)e.poise-=dt;if(e.cool>0)e.cool-=dt;
  e.lag=Math.max(e.hp,(e.lag??e.max)-e.max*dt*.45);
  if(e.kx||e.ky)knock(e,dt);
  if(e.stagger>0){e.stagger-=dt;return;}
  if(e.boss){king(e,dt);return;}
  let d=Math.hypot(e.x-player.x,e.y-player.y),visible=sight(e.x,e.y,player.x,player.y);
  if((d<8&&visible)||e.alert){if(!e.alert){e.alert=true;toast(ENEMY_TYPES[e.type].name+'!');if(e.type<6||e.type>=8)GameAudio.monster?.(e.type,d,pan(e.x,e.y));}if(e.type===6||e.type===7){forklift(e,dt,d,visible);return;}if(e.type===11){spitter(e,dt,d,visible);return;}if(d>.72||!visible){chase(e,dt,d,visible);}else if(e.attack<=0){e.attack=e.type===5||e.type===10?1.4:.85;GameAudio.monster?.(e.type,d,0,true);hurtPlayer(ENEMY_TYPES[e.type].damage);}}
 }
 // ---- Boss «Солодовый король»: rises after the malt house is cleared, three phases by HP.
 function stageOf(e){const r=e.hp/e.max;return r>.66?1:r>.33?2:3;}
 function king(e,dt){
  const spec=ENEMY_TYPES[12],d=Math.hypot(e.x-player.x,e.y-player.y),visible=sight(e.x,e.y,player.x,player.y),stage=stageOf(e);
  e.slam-=dt;e.volley-=dt;e.summon-=dt;e.fill=Math.min(1,(e.fill||0)+dt*.8);
  if(stage>e.stage){e.stage=stage;sfx('bossRoar',e.x,e.y,1);shake(.7);toast(stage===2?'Король плюётся закваской — прячься за силосы!':'Король взбешён и зовёт клещей!');if(stage===3){e.summon=Math.min(e.summon,.8);}}
  if(e.mode!=='hunt'){
   e.phase-=dt;e.attack=e.mode==='slam'||e.mode==='volley'?e.phase+.55:0;if(e.phase>0)return;
   if(e.mode==='slam')stomp(e,d);else if(e.mode==='volley')fan(e);
   e.mode=e.mode==='slam'||e.mode==='volley'?'recover':'hunt';e.phase=e.mode==='recover'?.45:0;e.frame=undefined;return;
  }
  if(stage===3&&e.summon<=0&&addsLeft>0){summon(e);e.summon=6.5;}
  if(d<spec.slamRange&&e.slam<=0){e.mode='slam';e.phase=.8;e.frame=2;e.slam=stage===3?2.6:3.6;sfx('bossRoar',e.x,e.y,.45);if(!e.warned){e.warned=true;toast('Король заносит кулаки — отходи или прячься!');}return;}
  if(stage>=2&&visible&&d>2.2&&d<11&&e.volley<=0){e.mode='volley';e.phase=.6;e.frame=2;e.volley=stage===3?3.2:4.2;sfx('spit',e.x,e.y,1);return;}
  if(d>1.4||!visible)chase(e,dt,d,visible,stage===3?1.75:1,.45);
 }
 // Ground slam: radial damage unless a wall or equipment blocks the line to the boss.
 function stomp(e,d){
  sfx('bossStomp',e.x,e.y,1);shake(.9);
  for(let i=0;i<28;i++){const a=i/28*Math.PI*2;GameFX.particles.push({x:e.x+Math.cos(a)*.5,y:e.y+Math.sin(a)*.5,dx:Math.cos(a)*3.6,dy:Math.sin(a)*3.6,z:.04,color:i%2?'#d9b25f':'#8b6a3c',life:.5,size:1.6});}
  if(d<ENEMY_TYPES[12].slamRadius&&sight(e.x,e.y,player.x,player.y)){const l=d||1;for(let i=0;i<6;i++)move(player,(player.x-e.x)/l*.09,(player.y-e.y)/l*.09);hurtPlayer(e.stage===3?26:22);}
 }
 function fan(e){const a=Math.atan2(player.y-e.y,player.x-e.x);for(let i=-2;i<=2;i++)glob(e.x+Math.cos(a)*.35,e.y+Math.sin(a)*.35,a+i*.24,ENEMY_TYPES[12].globDamage,.5);sfx('splat',e.x,e.y,.5);}
 function summon(e){
  for(let n=0;n<2&&addsLeft>0;n++)for(let k=0;k<10;k++){const a=Math.random()*Math.PI*2,x=e.x+Math.cos(a)*1.3,y=e.y+Math.sin(a)*1.3;
   if([[0,0],[.3,.3],[-.3,.3],[.3,-.3],[-.3,-.3]].every(([ox,oy])=>!solid(x+ox,y+oy))){enemies.push(make(8,x,y,{add:true,stagger:.5}));addsLeft--;GameFX.burst(x,y,'#d6a94f',16);break;}}
  sfx('bossRoar',e.x,e.y,.35);
 }
 function bossFlow(dt){
  const spec=LEVELS[levelIndex]?.boss;if(!spec||bossDefeated)return;
  if(bossState==='none'&&kills>=levelTotal){bossState='rising';bossTimer=1.6;radio('ТРЕВОГА · СИЛОС № 4','Давление в силосе растёт! Из солода поднимается что-то огромное…',6);toast('Пол дрожит…');sfx('bossRoar',spec.spawn[0],spec.spawn[1],.7);shake(.4);}
  else if(bossState==='rising'&&(bossTimer-=dt)<=0)spawnBoss();
 }
 function spawnBoss(){
  const spec=LEVELS[levelIndex].boss,[x,y]=spec.spawn;if(boss&&boss.hp>0)return boss;
  boss=make(spec.type,x,y,{boss:true,mode:'emerge',phase:1.4,frame:2,stage:1,slam:2.6,volley:3,summon:2,fill:0});enemies.push(boss);
  const d=Math.hypot(player.x-x,player.y-y);if(d<1.4){const a=d>.01?Math.atan2(player.y-y,player.x-x):player.a+Math.PI;for(let i=0;i<10;i++)move(player,Math.cos(a)*.14,Math.sin(a)*.14);}bossState='fight';addsLeft=spec.adds;
  GameFX.burst(x,y,GOLD,60);GameFX.burst(x,y,'#8b6a3c',40);shake(1);sfx('bossStomp',x,y,1);sfx('bossRoar',x,y,1);storyTimer=0;toast('СОЛОДОВЫЙ КОРОЛЬ!');
  return boss;
 }
 function bossDown(e){
  bossState='dead';bossDefeated=true;ai.enemyShots.length=0;
  for(const a of enemies)if(a.add&&a.hp>0){a.hp=0;GameFX.burst(a.x,a.y,ENEMY_TYPES[a.type].color,14);}
  for(let i=0;i<4;i++)GameFX.burst(e.x+(i%2-.5)*.7,e.y+((i>>1)-.5)*.7,i%2?GOLD:'#8b6a3c',40);
  shake(1.3);sfx('bossRoar',e.x,e.y,1.1);sfx('bossStomp',e.x,e.y,1);
  toast('СОЛОДОВЫЙ КОРОЛЬ ПОВЕРЖЕН · Включи аспирацию — E');
  document.querySelector('#status').textContent=LEVELS[levelIndex].clear;GameAudio.say(LEVELS[levelIndex].dialogue.kill,true);
 }
 function bossAlive(){return bossState==='rising'||bossState==='fight';}
 // Enemy globs: substeps, wall/prop splats, one hit on the player.
 function moveShots(dt){
  const list=ai.enemyShots;
  for(let i=list.length-1;i>=0;i--){
   const s=list[i];s.life-=dt;s.age+=dt;let gone=s.life<=0,hit=false;
   const n=Math.ceil(Math.hypot(s.dx,s.dy)*dt/.08)||1;
   for(let j=0;j<n&&!gone;j++){
    s.x+=s.dx*dt/n;s.y+=s.dy*dt/n;
    if(solid(s.x,s.y)){s.x-=s.dx*dt/n;s.y-=s.dy*dt/n;gone=true;}
    else if(Math.hypot(s.x-player.x,s.y-player.y)<.35){gone=hit=true;}
   }
   if(!gone)continue;list.splice(i,1);
   if(s.life>0){GameFX.burst(s.x,s.y,'#c9dc5a',hit?16:12);sfx('splat',s.x,s.y,hit?1:.7);}
   if(hit){hurtPlayer(s.damage);if(!running)return;}
  }
 }
 // Returns false when an enemy or an enemy glob ended the run (caller stops the tick).
 function updateAll(dt){if(clock>pathAt){routeField();pathAt=clock+.4;}for(let i=0;i<enemies.length;i++){update(enemies[i],dt);if(!running)return false;}bossFlow(dt);moveShots(dt);return running;}
 // Player shots vs the boss: its body is far wider than the generic .34 hit radius, so sweep this tick's segment first.
 function updateShots(dt){
  if(!boss||boss.hp<=0)return;const R=ENEMY_TYPES[12].radius;
  for(const sh of shots){
   if(sh.life<=0)continue;const vx=sh.dx*dt,vy=sh.dy*dt,t=Math.max(0,Math.min(1,((boss.x-sh.x)*vx+(boss.y-sh.y)*vy)/(vx*vx+vy*vy||1))),px=sh.x+vx*t,py=sh.y+vy*t;
   if(Math.hypot(boss.x-px,boss.y-py)<R&&sight(sh.x,sh.y,px,py)){sh.x=px;sh.y=py;if(sh.type!=='can')damage(boss,sh.damage,{x:px,y:py,type:sh.type});impact(sh);sh.life=0;sh.age=0;if(boss.hp<=0)return;}
  }
 }
 function reset(level){
  pathAt=-1;pathField=[];ai.enemyShots=[];boss=null;bossState='none';bossTimer=0;addsLeft=level?.boss?.adds||0;bossDefeated=!level?.boss;
  for(const e of enemies)Object.assign(e,{stagger:0,slow:0,kx:0,ky:0,poise:0,cool:1+e.seed%1.4,lag:e.hp});
 }
 // Sprite choice for the new types (renderer integration: use when non-null; e.frame overrides the animation frame).
 function look(e){
  if(e.type===11)return {img:SceneArt.monster(11,e.mode==='spit'?2:Math.floor(clock*4+e.seed)%2),size:ENEMY_TYPES[11].size,aspect:1,z:Math.sin(clock*3+e.seed)*.02};
  if(e.type===12)return {img:SceneArt.monster(12,(e.mode==='slam'||e.mode==='volley'||e.mode==='emerge'?2:Math.floor(clock*2.5)%2)+(e.stage===3?3:0)),size:ENEMY_TYPES[12].size,aspect:ENEMY_TYPES[12].aspect,z:0};
  return null;
 }
 // Billboards for enemy projectiles and spit telegraphs handed to the renderer each frame.
 function sprites(){
  const out=[];
  for(const s of ai.enemyShots)out.push({x:s.x,y:s.y,img:SceneArt.monster(11,Math.floor(s.age*10)%2?'glob1':'glob0'),size:.3,z:s.z,fullbright:true});
  for(const e of enemies){if(e.hp<=0||!(e.mode==='spit'||e.mode==='volley'))continue;
   const span=e.mode==='spit'?ENEMY_TYPES[11].windup:.6,grow=1-Math.max(0,e.phase)/span,a=Math.atan2(player.y-e.y,player.x-e.x),r=e.boss?.75:.3;
   out.push({x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r,img:SceneArt.monster(11,'glob'+(Math.floor(clock*14)%2)),size:(e.boss?.22:.1)+grow*(e.boss?.2:.16),z:e.boss?.5:.3,fullbright:true,alpha:.6+grow*.4});}
  return out;
 }
 function bar(x,y,w,h,ratio,lag,fill){
  ctx.fillStyle=NAVY;ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle='#1E3A5F';ctx.fillRect(x,y,w,h);
  ctx.fillStyle=RED;ctx.fillRect(x,y,w*Math.max(0,Math.min(1,lag)),h);ctx.fillStyle=fill;ctx.fillRect(x,y,w*Math.max(0,ratio),h);
 }
 // Compact HP bars over wounded visible enemies plus the boss bar; rects come from Renderer.render.
 function overlays(rects){
  ctx.save();
  for(const r of rects||[]){
   const e=r.enemy;if(!r.visible||!e||e.boss||e.hp<=0||e.hp>=e.max||r.d>13||!sight(player.x,player.y,e.x,e.y))continue;
   const w=Math.max(26,Math.min(64,r.w*.42)),x=Math.round(r.x-w/2),y=Math.round(Math.max(4,Math.min(VIEW-12,r.top+r.h*.06-9))),ratio=e.hp/e.max;
   ctx.globalAlpha=r.d>9?Math.max(0,1-(r.d-9)/4):1;
   bar(x,y,w,4,ratio,(e.lag??e.hp)/e.max,ratio<.3?'#E0703A':GOLD);
   if(e.stagger>0){ctx.fillStyle='#FAF9F6';ctx.fillRect(x,y-3,w,1);}
  }
  ctx.globalAlpha=1;
  if(boss&&boss.hp>0){
   const w=400,x=W/2-w/2,y=26,ratio=boss.hp/boss.max,fill=boss.fill??1,stage=stageOf(boss);
   ctx.fillStyle='#0B1D3AE6';ctx.fillRect(x-10,6,w+20,32);ctx.fillStyle=GOLD;ctx.fillRect(x-10,6,3,32);
   ctx.font='800 11px Montserrat,Arial,sans-serif';ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle='#EDCE70';ctx.fillText('СОЛОДОВЫЙ КОРОЛЬ',x,20);
   ctx.textAlign='right';ctx.fillStyle='#FAF9F6';ctx.font='600 9px Montserrat,Arial,sans-serif';ctx.fillText('ФАЗА '+stage+' / 3',x+w-38,20);
   for(let i=1;i<=3;i++){const px=x+w-28+i*8,py=16;ctx.fillStyle=i<stage?'#5E687C':i===stage?RED:GOLD;ctx.beginPath();ctx.moveTo(px,py-4);ctx.lineTo(px+3,py);ctx.lineTo(px,py+4);ctx.lineTo(px-3,py);ctx.closePath();ctx.fill();}
   bar(x,y,w,7,Math.min(ratio,fill),Math.min((boss.lag??boss.hp)/boss.max,fill),stage===3?'#E0703A':stage===2?'#D98A3A':GOLD);
   ctx.fillStyle=NAVY;for(const t of [.66,.33])ctx.fillRect(Math.round(x+w*t),y-1,2,9);
  }
  ctx.restore();
 }
 const ai={sprites,overlays,look,update,updateAll,updateShots,reset,damage,chase,forklift,spitter,routeField,spawnBoss,bossAlive,enemyShots:[],get boss(){return boss;},get bossState(){return bossState;},get addsLeft(){return addsLeft;},get pathField(){return pathField;}};
 return ai;
})();
