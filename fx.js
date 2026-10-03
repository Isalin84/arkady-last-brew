'use strict';
// Combat feedback: particles, camera shake, hitstop, dynamic lights, wall decals, corpses, weapon poses and muzzle effects.
const GameFX=(()=>{
 const MAX_DECALS=40,MAX_LIGHTS=8,MAX_PARTICLES=420,MAX_CORPSES=20,CORPSE_TIME=6,DECAL_TIME=24,SHAKE_AMP=14;
 const fx={particles:[],shake:{x:0,y:0},lights:[],decals:[],corpses:[],hitstop:0,hitMarker:0,hitCrit:0,damageDir:null,damageT:0,trauma:0,t:0,gunT:9,throwDur:.5,swap:{t:9,from:0,to:0},muzzleT:0,emit:0,GUN:{x:.65,y:34},MAX_DECALS,MAX_LIGHTS,MAX_PARTICLES,MAX_CORPSES,CORPSE_TIME};
 // Screen-space particles (smoke puffs, foam spray) in a small ring buffer; drawn over the gun in absolute canvas coordinates.
 const sp=[];let spHead=0;
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const shakeOn=()=>typeof GameSettings==='undefined'||GameSettings.get('shake')!==false;
 const playerNow=()=>typeof player!=='undefined'?player:null;
 function push(x,y,z,dx,dy,dz,color,life,size,full,g){const p={x,y,z,dx,dy,dz,color,life,size,fullbright:full,g};fx.particles.push(p);return p;}
 function spawnSp(x,y,vx,vy,r,vr,life,kind){const p=sp[spHead]||(sp[spHead]={});spHead=(spHead+1)%90;p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.r=r;p.vr=vr;p.life=life;p.max=life;p.kind=kind;}
 // Particle burst, signature kept from the original module.
 fx.burst=(x,y,color,n=14)=>{for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*1.8;push(x,y,Math.random()*.6,Math.cos(a)*s,Math.sin(a)*s,-.4,color,.35+Math.random()*.3,1,false,0);}};
 fx.reset=()=>{fx.particles=[];fx.lights=[];fx.decals=[];fx.corpses=[];fx.shake.x=fx.shake.y=0;fx.hitstop=0;fx.hitMarker=0;fx.hitCrit=0;fx.damageDir=null;fx.damageT=0;fx.trauma=0;fx.gunT=9;fx.swap.t=9;fx.muzzleT=0;fx.emit=0;for(const p of sp)p.life=0;};
 fx.addShake=amount=>{if(shakeOn())fx.trauma=Math.min(1,fx.trauma+amount);};
 fx.addLight=(x,y,radius,intensity,color,life)=>{if(fx.lights.length>=MAX_LIGHTS)fx.lights.shift();fx.lights.push({x,y,radius,intensity,color,life});};
 fx.addDecal=(x,y,v,size,color,alpha=.8)=>{if(fx.decals.length>=MAX_DECALS)fx.decals.shift();fx.decals.push({x,y,v,size,color,alpha,a0:alpha,life:DECAL_TIME});};
 fx.update=dt=>{
  fx.t+=dt;fx.gunT+=dt;fx.swap.t+=dt;fx.muzzleT=Math.max(0,fx.muzzleT-dt);
  const P=fx.particles;
  for(let i=P.length-1;i>=0;i--){const p=P[i];p.life-=dt;if(p.life<=0){P[i]=P[P.length-1];P.pop();continue;}p.x+=p.dx*dt;p.y+=p.dy*dt;if(p.g)p.dz+=p.g*dt;p.z+=p.dz*dt;if(p.z<0){p.z=0;p.dz=p.g?-p.dz*.3:0;p.dx*=.5;p.dy*=.5;}}
  if(P.length>MAX_PARTICLES)P.splice(0,P.length-MAX_PARTICLES);
  const L=fx.lights;for(let i=L.length-1;i>=0;i--){L[i].life-=dt;if(L[i].life<=0)L.splice(i,1);}
  const D=fx.decals;for(let i=D.length-1;i>=0;i--){const d=D[i];d.life-=dt;d.alpha=d.a0*Math.min(1,d.life/4);if(d.life<=0)D.splice(i,1);}
  const C=fx.corpses;for(let i=C.length-1;i>=0;i--){const c=C[i];c.age+=dt;c.alpha=Math.max(0,1-(c.age/CORPSE_TIME)**2);if(c.age>=CORPSE_TIME)C.splice(i,1);}
  for(const p of sp)if(p.life>0){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;}
  fx.trauma=Math.max(0,fx.trauma-dt*1.8);fx.hitMarker=Math.max(0,fx.hitMarker-dt*6);if(fx.hitMarker===0)fx.hitCrit=0;fx.damageT=Math.max(0,fx.damageT-dt*1.1);
  if(shakeOn()&&fx.trauma>0){const amp=SHAKE_AMP*fx.trauma**1.5,t=fx.t;fx.shake.x=amp*(Math.sin(t*61)+Math.sin(t*37+1.3))*.5;fx.shake.y=amp*(Math.sin(t*53+2.1)+Math.sin(t*29))*.5;}else{fx.shake.x=fx.shake.y=0;}
 };
 // ---- events ----
 fx.onShoot=weaponIndex=>{
  const pl=playerNow(),s=fx.swap;if(s.t<.3){s.t=9;}fx.gunT=0;fx.emit=1;
  if(weaponIndex<2){fx.throwDur=typeof weapons!=='undefined'&&weapons[weaponIndex]?weapons[weaponIndex].cool:.5;fx.addShake(weaponIndex?.22:.1);return;}
  fx.muzzleT=weaponIndex===2?.09:.07;fx.addShake(weaponIndex===2?.1:.05);
  if(pl)fx.addLight(pl.x+Math.cos(pl.a)*.45,pl.y+Math.sin(pl.a)*.45,weaponIndex===2?2.6:2.2,weaponIndex===2?1:.55,weaponIndex===2?[255,206,130]:[255,244,214],.06);
 };
 fx.onSwap=(from,to)=>{const s=fx.swap,shown=s.t<.12?s.from:s.t<.3?s.to:from;s.from=shown;s.to=to;s.t=0;fx.gunT=9;};
 fx.onHit=(enemy,amount)=>{if(fx.hitMarker<.4)GameAudio?.synth?.('hitmarker',{volume:.5});fx.hitMarker=1;fx.hitCrit=0;if(enemy&&typeof ENEMY_TYPES!=='undefined')fx.burst(enemy.x,enemy.y,ENEMY_TYPES[enemy.type]?.color||'#d6c46a',4);};
 fx.onKill=enemy=>{
  fx.hitstop=Math.max(fx.hitstop,.04);fx.addShake(.14);
  if(!enemy)return;
  if(fx.corpses.length>=MAX_CORPSES)fx.corpses.shift();
  const t=enemy.type,big=t===6||t===7||t===10;
  fx.corpses.push({x:enemy.x,y:enemy.y,type:t,img:corpseImage(t),size:big?1.25:t===5?1.15:t===8?.7:.85,aspect:t===6||t===7?1.25:1,z:0,alpha:1,age:0});
 };
 fx.onExplode=(x,y)=>{
  fx.hitstop=Math.max(fx.hitstop,.07);const pl=playerNow(),d=pl?Math.hypot(pl.x-x,pl.y-y):0;fx.addShake(Math.max(.15,.6-d*.06));
  fx.addLight(x,y,3,1.2,[255,160,70],.25);
  for(let i=0;i<14;i++){const a=Math.random()*Math.PI*2,s=rnd(1,3.2);push(x,y,rnd(.2,.5),Math.cos(a)*s,Math.sin(a)*s,rnd(.2,1.2),i%2?'#ffb347':'#ff7a2a',rnd(.25,.5),1,true,-2.4);}
  for(let i=0;i<8;i++){const a=Math.random()*Math.PI*2,s=rnd(.2,.8);push(x,y,rnd(.2,.4),Math.cos(a)*s,Math.sin(a)*s,rnd(.3,.6),i%2?'#4a3b32':'#2f2824',rnd(.6,1),2,false,0);}
 };
 // fromX/fromY: where the damage came from; without them the nearest living enemy is used (melee hits).
 fx.onHurt=(amount,fromX,fromY)=>{
  const pl=playerNow();fx.addShake(Math.min(.65,.22+amount/70));fx.damageT=1;
  if(fromX===undefined&&typeof enemies!=='undefined'&&pl){let best=9;for(const e of enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-pl.x,e.y-pl.y);if(d<best){best=d;fromX=e.x;fromY=e.y;}}}
  fx.damageDir=pl&&fromX!==undefined?Math.atan2(fromY-pl.y,fromX-pl.x):null;
 };
 // Called from impact(); wall=true when the shot stopped against a map wall.
 fx.onImpact=(s,wall)=>{
  const t=s.type,z=.4;
  if(t==='bottle'){
   for(let i=0;i<10;i++){const a=Math.random()*Math.PI*2,v=rnd(.8,3);push(s.x,s.y,z,Math.cos(a)*v,Math.sin(a)*v,rnd(.3,1.4),i%3?'#d8efcb':'#8fbf72',rnd(.4,.8),1,false,-3);}
   for(let i=0;i<6;i++){const a=Math.random()*Math.PI*2,v=rnd(.3,1.4);push(s.x,s.y,z,Math.cos(a)*v,Math.sin(a)*v,rnd(0,.8),i%2?'#e0aa3c':'#f3cd62',rnd(.4,.7),1,false,-2.4);}
  }else if(t==='foam'){
   for(let i=0;i<6;i++){const a=Math.random()*Math.PI*2,v=rnd(.2,.9);push(s.x,s.y,z,Math.cos(a)*v,Math.sin(a)*v,rnd(0,.5),i%2?'#fff6dc':'#f0e4c2',rnd(.5,.9),2,false,-.8);}
  }else if(t==='cork'){
   for(let i=0;i<6;i++){const a=Math.random()*Math.PI*2,v=rnd(1.5,4);push(s.x,s.y,z,Math.cos(a)*v,Math.sin(a)*v,rnd(-.2,.8),i%2?'#ffe08a':'#fff3c4',rnd(.12,.25),1,true,-3);}
  }
  if(wall&&s.dx!==undefined&&typeof map!=='undefined')wallDecals(s);
 };
 // Finds the wall surface along the shot direction and splashes it.
 function wallDecals(s){
  const l=Math.hypot(s.dx,s.dy)||1,ux=s.dx/l,uy=s.dy/l;let x=s.x,y=s.y,hit=false;
  for(let i=0;i<14;i++){x+=ux*.02;y+=uy*.02;if(map[Math.floor(y)]?.[Math.floor(x)]){hit=true;break;}}
  if(!hit)return;
  const z=.35+Math.sin(Math.min(1,s.age||0)*Math.PI)*.2,v=Math.min(.9,Math.max(.1,.5+(.42-z)*.9+rnd(-.05,.05))),t=s.type;
  const col=t==='bottle'?[[205,160,55],[96,142,70]]:t==='can'?[[62,36,24],[88,56,36]]:t==='foam'?[[246,238,208],[232,222,190]]:[[96,74,52],[70,54,40]];
  const main=t==='cork'?.035:t==='can'?.2:t==='foam'?.15:.16,a=t==='foam'?.85:.8;
  fx.addDecal(x,y,v,main,col[0],a);
  if(t!=='cork')for(let i=0;i<2;i++){const side=i?1:-1,sx=x-uy*side*main*rnd(.7,1.3)*.9,sy=y+ux*side*main*rnd(.7,1.3)*.9;fx.addDecal(sx,sy,Math.min(.95,Math.max(.05,v+rnd(-.12,.18))),main*rnd(.35,.55),col[i],a*.85);}
 }
 // Fast projectile trail (corks and foam jets).
 fx.trail=s=>{if(s.type==='cork')push(s.x,s.y,.4,0,0,0,'#ffd27a',.1,1,true,0);else if(s.type==='foam'&&Math.random()<.7)push(s.x,s.y,.38,rnd(-.1,.1),rnd(-.1,.1),rnd(-.05,.2),Math.random()<.5?'#fff6dc':'#f0e4c2',.3,2,false,0);};
 // ---- corpses ----
 const corpseCache={};
 function enemyImage(t){
  const S=typeof SceneArt!=='undefined'?SceneArt:null;
  try{if(t===6||t===7)return S?.forklift?.(t,'recover',0);if(t>2)return S?.monster?.(t,0);return typeof Renderer!=='undefined'?Renderer.sprites?.['enemy'+t]:null;}catch{return null;}
 }
 // Squashed, darkened copy of the enemy sprite lying in a puddle of its own colour, cached per type.
 function corpseImage(t){
  if(corpseCache[t])return corpseCache[t];
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),src=enemyImage(t),col=(typeof ENEMY_TYPES!=='undefined'&&ENEMY_TYPES[t]?.color)||'#8a7a50';
  g.globalAlpha=.55;g.fillStyle=col;g.beginPath();g.ellipse(64,119,58,9,0,0,Math.PI*2);g.fill();g.fillStyle='#000';g.globalAlpha=.25;g.beginPath();g.ellipse(64,120,48,6,0,0,Math.PI*2);g.fill();g.globalAlpha=1;
  if(src){g.drawImage(src,0,0,128,128,8,80,112,42);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(22,12,8,.42)';g.fillRect(0,70,128,58);g.globalCompositeOperation='source-over';}
  g.globalAlpha=.6;g.fillStyle=col;for(const [x,y,r] of [[18,116,3],[108,113,2.5],[92,122,2],[36,122,2.5]]){g.beginPath();g.ellipse(x,y,r*1.6,r*.7,0,0,7);g.fill();}g.globalAlpha=1;
  return corpseCache[t]=c;
 }
 // ---- billboards handed to the renderer ----
 // Thrown bottles and cans spin: pre-rotated copies of the sprite chosen by shot age.
 const SPIN=8,spinCache={},spinList=[],flat=[],spinPool=[];
 function spinFrames(type){
  if(spinCache[type])return spinCache[type];
  const src=typeof Renderer!=='undefined'?Renderer.sprites?.[type]:null;if(!src)return null;
  const frames=[];for(let i=0;i<SPIN;i++){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.translate(64,64);g.rotate(i*Math.PI*2/SPIN);g.drawImage(src,-64,-64);frames.push(c);}
  return spinCache[type]=frames;
 }
 // Splits shots into spinning billboards (bottle, can) and plain ones (cork, foam); call before sprites() each frame.
 fx.shotView=shots=>{
  spinList.length=0;flat.length=0;let n=0;
  const pl=playerNow();
  for(const s of shots){
   if(pl&&(s.x-pl.x)**2+(s.y-pl.y)**2<.4)continue;// hidden while still leaving the hand/muzzle
   const frames=s.type==='bottle'||s.type==='can'?spinFrames(s.type):null;
   if(!frames){flat.push(s);continue;}
   const b=spinPool[n]||(spinPool[n]={size:.24,aspect:1});n++;
   b.x=s.x;b.y=s.y;b.img=frames[Math.floor(s.age*(s.type==='can'?9:13)+(s.spin||0))%SPIN];b.z=.35+Math.sin(Math.min(1,s.age)*Math.PI)*.2;b.size=s.type==='can'?.3:.26;spinList.push(b);
  }
  return flat;
 };
 const out=[];
 fx.sprites=()=>{out.length=0;for(const c of fx.corpses)out.push(c);for(const b of spinList)out.push(b);return out;};
 // ---- weapon pose ----
 const pose={x:0,y:0,rot:0,shown:0,item:1,itemY:0,throwing:false};
 const ease=t=>t<0?0:t>1?1:1-(1-t)*(1-t);
 fx.gunPose=(weapon,kick,moving,step)=>{
  const s=fx.swap;let shown=weapon,off=0;
  if(s.t<.3){if(s.t<.12){shown=s.from;off=(s.t/.12)**2*300;}else{shown=s.to;off=(1-(s.t-.12)/.18)**2*300;}}
  const w=typeof weapons!=='undefined'?weapons[shown]:null,empty=w&&w.ammo<=0;
  let x=0,y=0,rot=shown<2?-.04:-.03,item=empty&&shown===1?0:1,itemY=0,throwing=false;
  if(moving){x+=Math.sin(step*.5)*4;y+=Math.abs(Math.sin(step))*5;}else{x+=Math.sin(fx.t*1.3)*1.4;y+=Math.sin(fx.t*1.9)*1.8;}
  if(shown<2){
   const t=fx.gunT;
   if(t<fx.throwDur&&s.t>=.3){
    throwing=true;
    if(t<.07){const p=ease(t/.07);x+=22*p;y+=34*p;rot+=.28*p;}
    else if(t<.15){const p=ease((t-.07)/.08);x+=22-56*p;y+=34-80*p;rot+=.28-.78*p;if(p>.4)item=0;}
    else if(t<.3){const p=ease((t-.15)/.15);x+=-34*(1-p);y+=-46*(1-p);rot+=-.5*(1-p);item=0;}
    else{const p=ease((t-.3)/.2);item=empty?0:1;itemY=(1-p)*190;}
   }
  }else if(shown===2){const k=kick*kick*kick;y+=24*k+5*kick;x+=3*k;rot+=.07*k;}
  else{const a=Math.min(1,kick*2);x+=Math.sin(fx.t*95)*2.4*a;y+=Math.cos(fx.t*110)*2.2*a+kick*7;rot+=Math.sin(fx.t*70)*.008*a;}
  if(shown>1){x+=44;y+=14;}
  pose.x=x;pose.y=y+off;pose.rot=rot;pose.shown=shown;pose.item=item;pose.itemY=itemY;pose.throwing=throwing;
  return pose;
 };
 // Muzzle flash drawn in gun space (call between the gun transform and restore); also queues screen-space puffs.
 const MUZZLE=[null,null,[-23,-316],[-25,-305]];
 fx.muzzle=(g,weapon)=>{
  const m=MUZZLE[weapon];if(!m)return;
  if(fx.emit){fx.emit=0;const t=g.getTransform?.();if(t){const ax=t.a*m[0]+t.c*m[1]+t.e,ay=t.b*m[0]+t.d*m[1]+t.f;
   if(weapon===2){for(let i=0;i<3;i++)spawnSp(ax+rnd(-4,4),ay,rnd(-30,30),rnd(-70,-30),rnd(9,13),rnd(30,50),rnd(.45,.7),0);for(let i=0;i<5;i++)spawnSp(ax,ay,rnd(-140,100),rnd(-170,-30),rnd(1.5,2.5),0,rnd(.1,.2),2);}
   else for(let i=0;i<8;i++)spawnSp(ax+rnd(-12,12),ay+rnd(-6,6),rnd(-260,-100),rnd(0,90),rnd(7,14),rnd(-30,-8),rnd(.22,.38),1);}}
  if(fx.muzzleT>0){
   const a=fx.muzzleT/(weapon===2?.09:.07);g.save();g.translate(m[0],m[1]);g.globalAlpha=Math.min(1,a*1.4);
   if(weapon===2){
    const gr=g.createRadialGradient(0,0,0,0,0,52);gr.addColorStop(0,'#fffbe8');gr.addColorStop(.35,'#ffd27a');gr.addColorStop(1,'#ff8a2a00');g.fillStyle=gr;g.beginPath();g.arc(0,0,52,0,Math.PI*2);g.fill();
    g.fillStyle='#fff3c4';g.beginPath();g.moveTo(-10,2);g.lineTo(0,-84);g.lineTo(10,2);g.closePath();g.fill();
    g.fillStyle='#ffb347';for(const r of [-.7,-.35,.35,.7]){g.save();g.rotate(r);g.beginPath();g.moveTo(-5,0);g.lineTo(0,-52);g.lineTo(5,0);g.closePath();g.fill();g.restore();}
   }else{const gr=g.createRadialGradient(0,0,0,0,0,46);gr.addColorStop(0,'#fffdf0');gr.addColorStop(1,'#fff1c800');g.fillStyle=gr;g.beginPath();g.arc(0,0,34,0,Math.PI*2);g.fill();}
   g.restore();
  }
 };
 // Smoke puffs, foam spray and sparks in absolute canvas coordinates.
 fx.screenFx=g=>{
  for(const p of sp){if(p.life<=0)continue;const a=Math.max(0,p.life/p.max);
   if(p.kind===0){g.globalAlpha=a*.6;g.fillStyle='#d4cfc2';}else if(p.kind===1){g.globalAlpha=Math.min(1,a*1.6)*.9;g.fillStyle=p.r>9?'#f2e8cc':'#fff8e4';}else{g.globalAlpha=a;g.fillStyle='#ffe08a';}
   g.beginPath();g.arc(p.x,p.y,Math.max(.5,p.r),0,Math.PI*2);g.fill();}
  g.globalAlpha=1;
 };
 return fx;
})();
