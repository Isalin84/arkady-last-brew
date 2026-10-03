'use strict';
// Enemy behaviour: flow-field navigation, melee, forklift charges and damage. Reads game.js globals at call time.
const EnemyAI=(()=>{
 let pathField=[],pathAt=-1;
 function damage(e,d){if(e.hp<=0)return;e.hp-=d;e.hit=.16;GameFX.onHit(e,d);if(e.hp<=0){kills++;GameScore.kill(e.type,e.max);GameFX.burst(e.x,e.y,ENEMY_TYPES[e.type].color,25);GameFX.onKill(e);GameAudio.kill();GameAudio.say(e.type===5?'golemkill':LEVELS[levelIndex].dialogue.kill);if(kills===levelTotal)toast(LEVELS[levelIndex].clear);updateHUD();}}
 // A shared flow field lets awakened creatures navigate around production equipment.
 function routeField(){
  pathField=map.map(row=>row.map(()=>Infinity));const x=Math.floor(player.x),y=Math.floor(player.y),queue=[[x,y]];pathField[y][x]=0;
  for(let i=0;i<queue.length;i++){const [cx,cy]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(pathField[ny]?.[nx]===Infinity&&!solid(nx+.5,ny+.5)){pathField[ny][nx]=pathField[cy][cx]+1;queue.push([nx,ny]);}}}
 }
 function chase(e,dt,d,visible){
  let tx=player.x,ty=player.y;
  if(!visible){const x=Math.floor(e.x),y=Math.floor(e.y);let best=pathField[y]?.[x]??Infinity;let target=null;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const cost=pathField[y+dy]?.[x+dx]??Infinity;if(cost<best){best=cost;target=[x+dx+.5,y+dy+.5];}}
  if(!target)return;[tx,ty]=target;}
  const distance=Math.hypot(tx-e.x,ty-e.y);if(distance<.05)return;
  const speed=ENEMY_TYPES[e.type].speed*dt*(e.type===4&&Math.sin(clock*2+e.seed)>.7?1.55:1);
  move(e,(tx-e.x)/distance*speed,(ty-e.y)/distance*speed,.23);
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
 // One awake/asleep enemy step; may end the run through hurtPlayer().
 function update(e,dt){if(e.hp<=0)return;e.hit=Math.max(0,e.hit-dt);e.attack-=dt;let d=Math.hypot(e.x-player.x,e.y-player.y),visible=sight(e.x,e.y,player.x,player.y);if((d<8&&visible)||e.alert){if(!e.alert){e.alert=true;toast(ENEMY_TYPES[e.type].name+'!');if(e.type<6||e.type>=8)GameAudio.monster?.(e.type,d,(-Math.sin(player.a)*(e.x-player.x)+Math.cos(player.a)*(e.y-player.y))/5);}if(e.type===6||e.type===7){forklift(e,dt,d,visible);return;}if(d>.72||!visible){chase(e,dt,d,visible);}else if(e.attack<=0){e.attack=e.type===5||e.type===10?1.4:.85;GameAudio.monster?.(e.type,d,0,true);hurtPlayer(ENEMY_TYPES[e.type].damage);}}}
 // Returns false when an enemy ended the run (caller stops the tick).
 function updateAll(dt){if(clock>pathAt){routeField();pathAt=clock+.4;}for(let e of enemies){update(e,dt);if(!running)return false;}return true;}
 // Enemy projectiles (spitters, boss) are added by a later track.
 function updateShots(dt){}
 function reset(level){pathAt=-1;pathField=[];ai.enemyShots=[];}
 const ai={update,updateAll,updateShots,reset,damage,chase,forklift,routeField,enemyShots:[],get pathField(){return pathField;}};
 return ai;
})();
