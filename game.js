'use strict';
const $=s=>document.querySelector(s);
let map,props=[],levelIndex=0,levelTotal=12,transition=false,checkpoint=null,storyHeard=false,storyTimer=0,rescueStage=0,stellaVisible=false,renderRequested=true,finaleSequence=0,finalResult=null;
const weapons=WEAPON_BASE.map(w=>({...w}));
let player,enemies,items,shots=[],running=false,started=false,won=false,dead=false,kills=0,weapon=0,fire=false,showMap=false,clock=0,cooldown=0,kick=0,hurt=0,audioEnabled=true,step=0;
const keys=new Set();
let runUpgrades=[],gunStep=0;
function loadLevel(index,restore=false){
 finaleSequence++;finalResult=null;GameAudio.reset();setFinaleCover(false);storyHeard=false;storyTimer=0;rescueStage=0;stellaVisible=false;$('#radio-message').hidden=true;levelIndex=index;const level=LEVELS[index];map=level.map.map(r=>r.split('').map(Number));
 props=level.props.map(([x,y,type,size,r])=>({x,y,type,size,r,active:false}));
 const [x,y,a]=level.spawn;player={x,y,a,hp:restore&&checkpoint?checkpoint.hp:100};
 enemies=level.enemies.map(([x,y,type],i)=>({x,y,type,hp:ENEMY_TYPES[type].hp,max:ENEMY_TYPES[type].hp,attack:0,hit:0,seed:i*3.1,alert:false,mode:'hunt',phase:0,chargeCooldown:1.5,heading:Math.PI}));levelTotal=enemies.length;
 items=level.items.map(([x,y,type])=>({x,y,type}));shots=[];kills=0;weapon=0;
 runUpgrades=(restore&&checkpoint?.upgrades||[]).slice();weapons.forEach((w,i)=>{for(const k in w)delete w[k];Object.assign(w,WEAPON_BASE[i]);w.ammo=restore&&checkpoint?checkpoint.ammo[i]:WEAPON_BASE[i].ammo;});player.maxHp=applyLoadout(weapons,runUpgrades).maxHp;
 cooldown=0;kick=0;hurt=0;dead=false;won=false;transition=false;clock=0;fire=false;keys.clear();
 Renderer.setLevel(index,level,map);GameFX.reset();EnemyAI.reset(level);GameAudio.setLevel?.(index);$('#level-name').textContent=level.name;renderRequested=true;updateHUD();
}
function reset(){checkpoint=null;GameScore.begin();loadLevel(0);GameScore.checkpoint();}
function solid(x,y){return map[Math.floor(y)]?.[Math.floor(x)]!==0||props.some(p=>Math.hypot(x-p.x,y-p.y)<p.r);}
function move(o,dx,dy,r=.22){if(!solid(o.x+dx+Math.sign(dx)*r,o.y-r)&&!solid(o.x+dx+Math.sign(dx)*r,o.y+r))o.x+=dx;if(!solid(o.x-r,o.y+dy+Math.sign(dy)*r)&&!solid(o.x+r,o.y+dy+Math.sign(dy)*r))o.y+=dy;}
function sight(x,y,tx,ty){let d=Math.hypot(tx-x,ty-y),n=Math.ceil(d/.15);for(let i=1;i<n;i++)if(solid(x+(tx-x)*i/n,y+(ty-y)*i/n))return false;return true;}
// UI and enemy helpers live in ui.js / enemies.js; these globals keep the original call sites and tests working.
function toast(s){GameUI.toast(s);}
function updateHUD(){GameUI.updateHUD();}
function setFinaleCover(finale){GameUI.setFinaleCover(finale);}
function prepareFinalScore(result){return GameUI.prepareFinalScore(result);}
function revealFinalScore(){GameUI.revealFinalScore();}
function damage(e,d,src){EnemyAI.damage(e,d,src);}
function maxHp(){return player.maxHp||100;}
function choose(i){if(i!==weapon)GameFX.onSwap(weapon,i);weapon=i;updateHUD();if(running)toast(weapons[i].name);}
function start(){
 const fresh=!started||dead||won||transition;let event='start';
 if(transition){const completedLevel=levelIndex,nextLevel=completedLevel+1,minimum=[[0,22,140,100],[0,32,190,140],[0,38,220,165]][completedLevel]||[0,22,140,100];checkpoint={hp:Math.max(75,player.hp),ammo:weapons.map((w,i)=>i===0?Infinity:Math.max(w.ammo,minimum[i])),upgrades:[...runUpgrades]};loadLevel(nextLevel,true);GameScore.checkpoint();event=LEVELS[nextLevel].dialogue.start;}
 else if(dead){GameScore.retryLevel();loadLevel(levelIndex,true);event=LEVELS[levelIndex].dialogue.start;}
 else if(!started||won)reset();
 started=true;running=true;renderRequested=true;$('#overlay').hidden=true;$('#hud').hidden=false;$('#crosshair').style.display='block';$('#status').textContent=LEVELS[levelIndex].status;updateHUD();
 canvas.requestPointerLock?.()?.catch(()=>{});toast(LEVELS[levelIndex].name+' · '+levelTotal+' монстров');
 GameAudio.resume().then(()=>{if(running&&fresh)GameAudio.say(event,true);});
}
function pause(){if(!running)return;$('#radio-message').hidden=true;GameAudio.pause();running=false;renderRequested=true;fire=false;keys.clear();$('#overlay').hidden=false;$('.intro h1').innerHTML='ПЕРЕРЫВ<br><span>НА ПЕНУ</span>';$('.intro p').innerHTML='Смена ещё не закончена.<br>Цех ждёт своего пивовара.';$('#start').innerHTML='Продолжить смену <span>↗</span>';document.exitPointerLock?.();}
function finish(win){
 GameAudio.pause();transition=win&&levelIndex<LEVELS.length-1;
 GameAudio.say(win?(transition?LEVELS[levelIndex].dialogue.transition:'stellathanks'):'death',true);
 running=false;won=win&&!transition;dead=!win;renderRequested=true;fire=false;keys.clear();document.exitPointerLock?.();setFinaleCover(won);if(won)GameAudio.kiss?.();$('#overlay').hidden=false;$('#radio-message').hidden=true;
 const next=LEVELS[levelIndex].next;
 $('.intro h1').innerHTML=transition?'ДАЛЬШЕ —<br><span>'+next.title+'</span>':win?'СТЕЛЛА<br><span>СПАСЕНА</span>':'СМЕНА<br><span>ПРОПАЛА</span>';
 $('.intro p').innerHTML=transition?next.text+'<br>Припасы пополнены, здоровье — не ниже 75.':win?'Аспирация работает, шнек остановлен, аварийный люк открыт.<br>Аркадий вывел Стеллу из силоса. Солодовня снова под контролем.<br><b>Четыре цеха очищены. Ночная смена завершена.</b>':`Уничтожено: ${kills} из ${levelTotal}.<br>Попробуй ещё раз с начала этого цеха.`;
 $('#start').innerHTML=(transition?next.button:win?'Попробовать набрать больше':'Повторить цех')+' <span>↗</span>';
 $('#status').textContent=transition?`Уровень ${levelIndex+1} из ${LEVELS.length} пройден`:win?'Глава 04 завершена · Стелла спасена':'Смена прервана';
 if(transition)GameUI.showUpgrades(rollUpgrades(3,runUpgrades),pickUpgrade);
 if(won){
  finalResult=GameScore.finish(player.hp);prepareFinalScore(finalResult);
  const sequence=++finaleSequence,spoken=Number(GameAudio.voiceSeconds?.())||7.9;
  setTimeout(()=>{if(sequence===finaleSequence&&won)revealFinalScore();},Math.max(5600,spoken*1000+650));
 }
}
function shoot(){let w=weapons[weapon];if(cooldown>0)return;if(w.ammo<=0){toast('Припасы закончились. Найди ящик или возьми бутылку: 1');cooldown=.4;return;}w.ammo--;GameScore.shot();cooldown=w.cool;kick=1;let count=w.count||1;for(let i=0;i<count;i++){let a=player.a+(i-(count-1)/2)*(w.spread??.1);shots.push({x:player.x+Math.cos(a)*.25,y:player.y+Math.sin(a)*.25,dx:Math.cos(a)*w.speed,dy:Math.sin(a)*w.speed,type:w.type,damage:w.damage,life:w.life??2.5,age:0,pierce:w.pierce||0,split:w.split||0,crit:w.crit||0,spin:Math.random()*8|0});}GameFX.onShoot(weapon);GameAudio.shot(w.type);GameAudio.say(LEVELS[levelIndex].dialogue.shoot);updateHUD();}
function impact(s,wall){const dx=s.x-player.x,dy=s.y-player.y;GameAudio.impact(s.type,Math.hypot(dx,dy),(-dx*Math.sin(player.a)+dy*Math.cos(player.a))/5);GameFX.burst(s.x,s.y,s.type==='foam'?'#fff1c0':s.type==='can'?'#e5bc64':'#a0bb70',s.type==='can'?35:10);GameFX.onImpact(s,wall);if(s.type==='can'){GameFX.onExplode(s.x,s.y);enemies.forEach(e=>{let d=Math.hypot(e.x-s.x,e.y-s.y);if(d<2.1&&sight(s.x,s.y,e.x,e.y))damage(e,s.damage*(1-d/2.5),{x:s.x,y:s.y,force:.3+1.6*(1-d/2.1),type:'can'});});if(s.split)for(let i=0;i<s.split;i++){const a=i*Math.PI*2/s.split+Math.PI/4;shots.push({x:s.x+Math.cos(a)*.2,y:s.y+Math.sin(a)*.2,dx:Math.cos(a)*9,dy:Math.sin(a)*9,type:'cork',damage:s.damage*.25,life:.4,age:0,pierce:0,split:0,crit:0});}}}
// Direct hit: bottle crits on staggered/slowed enemies, cork lightly staggers small ones, foam slows.
function hitEnemy(sh,e){
 if(sh.type==='can')return;let d=sh.damage,crit=false;
 if(sh.type==='bottle'&&(e.stagger>0||e.slow>0||(sh.crit&&Math.random()<sh.crit))){d*=2;crit=true;}
 damage(e,d,{x:sh.x-sh.dx*.05,y:sh.y-sh.dy*.05,force:0,type:sh.type,crit});if(crit)GameFX.hitCrit=1;
 if(e.hp>0){if(sh.type==='cork'&&e.max<=130&&!(e.stagger>0)&&!(e.sCd>0)){e.stagger=.15;e.sCd=.6;}else if(sh.type==='foam')e.slow=Math.max(e.slow||0,1.2);}
}
function pickUpgrade(id){const u=id&&UPGRADES.find(u=>u.id===id);if(!u||runUpgrades.includes(id))return;runUpgrades.push(id);player.hp+=u.heal||0;GameAudio.synth?.('upgrade');toast('Апгрейд: '+u.name);}
function hurtPlayer(amount,src){
 const before=player.hp;player.hp=Math.max(0,player.hp-amount);GameScore.hurt(before-player.hp);hurt=1;GameFX.onHurt(amount,src?.x,src?.y);GameAudio.hit();GameAudio.say(player.hp<30?'low':LEVELS[levelIndex].dialogue.hurt);updateHUD();
 if(player.hp<=0)finish(false);
}
function warehouseStory(){
 if(levelIndex!==2||storyHeard||kills<levelTotal-3)return;
 storyHeard=true;storyTimer=16;$('#radio-message').hidden=false;
 $('#radio-message').innerHTML='<b>РАДИОГРАММА · СОЛОДОВНЯ / СИЛОС № 4</b><span>Помехи… «Аркадий, я внутри силоса! Монстры замуровали выход. Пожалуйста, найди меня…»</span>';
 $('#status').textContent='В силосе кто-то заперт. Зачисти склад и найди выход.';
 GameAudio.vehicle?.('radio',1,0);GameAudio.say('warehook',true);
}
const rescueSteps=[
 {type:'aspiration',label:'Аспирация',hint:'Включи аспирацию у северной стены',event:'maltcontrol1'},
 {type:'screw',label:'Реверс шнека',hint:'Переведи шнек в реверс у восточной стены',event:'maltcontrol2'},
 {type:'hatch',label:'Аварийный люк',hint:'Открой аварийный люк силоса № 4',event:'maltopen'}
];
function interact(){
 if(!running||levelIndex!==3)return;
 if(stellaVisible){const [sx,sy]=LEVELS[3].stella;if(Math.hypot(player.x-sx,player.y-sy)<1.35)finish(true);else toast('Стелла у открытого люка. Подойди к ней.');return;}
 if(kills<levelTotal){toast('Сначала очисти солодовню: '+kills+' / '+levelTotal);return;}
 const stepInfo=rescueSteps[rescueStage];if(!stepInfo)return;
 const panel=props.find(p=>p.type===stepInfo.type);
 if(!panel||Math.hypot(player.x-panel.x,player.y-panel.y)>1.35){toast(stepInfo.hint+' · E');return;}
 panel.active=true;rescueStage++;GameFX.burst(panel.x,panel.y,rescueStage===3?'#8ee59d':'#edce70',22);storyTimer=5;$('#radio-message').hidden=false;
 $('#radio-message').innerHTML=`<b>СИСТЕМА СПАСЕНИЯ · ${rescueStage} / 3</b><span>${stepInfo.label}: выполнено.</span>`;
 GameAudio.vehicle?.('radio',1,0);GameAudio.say(stepInfo.event,true);
 if(rescueStage===3){stellaVisible=true;$('#status').textContent='Стелла освобождена. Подойди к ней и нажми E.';toast('ЛЮК ОТКРЫТ · НАЙДИ СТЕЛЛУ И НАЖМИ E');}
 else{$('#status').textContent=rescueSteps[rescueStage].hint+' · E';toast(rescueSteps[rescueStage].hint+' · E');}
}
function tick(dt){clock+=dt;cooldown=Math.max(0,cooldown-dt);kick=Math.max(0,kick-dt*4);hurt=Math.max(0,hurt-dt*2);GameUI.frame(dt);$('#radio-message').hidden=!running||storyTimer<=0;if(!running)return;if(GameFX.hitstop>0){GameFX.hitstop=Math.max(0,GameFX.hitstop-dt);GameFX.update(dt);return;}GameScore.tick(dt);storyTimer=Math.max(0,storyTimer-dt);
if(keys.has('ArrowLeft'))player.a-=dt*2;if(keys.has('ArrowRight'))player.a+=dt*2;
let f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),s=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));let len=Math.hypot(f,s)||1,speed=(keys.has('ShiftLeft')?3.8:2.6)*dt;move(player,(Math.cos(player.a)*f-Math.sin(player.a)*s)/len*speed,(Math.sin(player.a)*f+Math.cos(player.a)*s)/len*speed);if(f||s)step+=dt*9;GameAudio.update(dt,Boolean(f||s),keys.has('ShiftLeft'));
if(fire||keys.has('Space'))shoot();
if(!EnemyAI.updateAll(dt))return;EnemyAI.updateShots(dt);
for(const e of enemies){if(e.stagger>0)e.stagger=Math.max(0,e.stagger-dt);if(e.slow>0)e.slow=Math.max(0,e.slow-dt);if(e.sCd>0)e.sCd-=dt;}
for(let sh of shots){sh.life-=dt;sh.age+=dt;let n=Math.ceil(Math.hypot(sh.dx,sh.dy)*dt/.1);for(let j=0;j<n&&sh.life>0;j++){sh.x+=sh.dx*dt/n;sh.y+=sh.dy*dt/n;if(solid(sh.x,sh.y)){sh.x-=sh.dx*dt/n;sh.y-=sh.dy*dt/n;impact(sh,true);sh.life=0;break;}let target=enemies.find(e=>e.hp>0&&Math.hypot(e.x-sh.x,e.y-sh.y)<((e.type===6||e.type===7||e.type===10)?.48:.34)&&!sh.hit?.includes(e));if(target){hitEnemy(sh,target);impact(sh);if(sh.pierce>0){sh.pierce--;(sh.hit||=[]).push(target);}else sh.life=0;}}if(sh.life>0)GameFX.trail(sh);if(sh.life<=0&&sh.type==='can'&&sh.age>=2.5)impact(sh);}
shots=shots.filter(s=>s.life>0);GameFX.update(dt);
items=items.filter(i=>{if(Math.hypot(i.x-player.x,i.y-player.y)<.65){if(i.type==='health'){if(player.hp>=maxHp())return true;player.hp=Math.min(maxHp(),player.hp+35);toast('Перерыв на воду: +35 здоровья');}else{weapons[1].ammo+=Math.round(8*(weapons[1].pick||1));weapons[2].ammo+=45;weapons[3].ammo+=35;toast('Ящик припасов: банки, пробки и пена');}GameScore.pickup();GameAudio.say('pickup');updateHUD();return false;}return true;});
warehouseStory();
if(levelIndex!==3&&kills===levelTotal&&Math.hypot(player.x-LEVELS[levelIndex].exit[0],player.y-LEVELS[levelIndex].exit[1])<.85)finish(true);
}
// Snapshot of the state the renderer needs this frame.
function frameView(){return {player,map,props,enemies,items,shots:GameFX.shotView(shots),particles:GameFX.particles,extra:[...EnemyAI.sprites(),...GameFX.sprites()],lights:GameFX.lights,decals:GameFX.decals,clock,levelIndex,level:LEVELS[levelIndex],stellaVisible,started,running,weapon,kick,hurt};}
function drawWorld(){Renderer.drawWorld(frameView());}
function drawSprites(){Renderer.drawSprites(frameView());}
function gun(){
 const moving=step!==gunStep;gunStep=step;const p=GameFX.gunPose(weapon,kick,moving,step),sh=GameFX.shake;
 ctx.save();ctx.imageSmoothingEnabled=true;
 ctx.translate(W*GameFX.GUN.x+p.x+sh.x*1.5,VIEW+GameFX.GUN.y+p.y+sh.y*1.5);ctx.rotate(p.rot);
 if(p.shown<2&&(p.throwing||!p.item)){const L=WeaponArt.layers(p.shown);ctx.drawImage(L.back,-240,-365,480,400);if(p.item)ctx.drawImage(L.item,-240,-365+p.itemY,480,400);ctx.drawImage(L.front,-240,-365,480,400);}
 else ctx.drawImage(WeaponArt.get(p.shown),-240,-365,480,400);
 GameFX.muzzle(ctx,p.shown);ctx.restore();GameFX.screenFx(ctx);
}
function minimap(){let scale=showMap?15:6,ox=W-16-map[0].length*scale,oy=16;ctx.fillStyle='#10241fe8';ctx.fillRect(ox-7,oy-7,map[0].length*scale+14,map.length*scale+14);map.forEach((row,y)=>row.forEach((t,x)=>{ctx.fillStyle=t===5?'#b59a68':t===2?'#ac8652':t===3?'#d9d883':t?'#63725b':'#233c2f';ctx.fillRect(ox+x*scale,oy+y*scale,scale-1,scale-1);}));if(showMap){for(let e of enemies){if(e.hp<=0)continue;ctx.fillStyle='#d28966';ctx.fillRect(ox+e.x*scale-2,oy+e.y*scale-2,4,4);}for(let i of items){ctx.fillStyle='#c5dca0';ctx.fillRect(ox+i.x*scale-2,oy+i.y*scale-2,4,4);}if(levelIndex===3){for(const p of props.filter(p=>['aspiration','screw','hatch'].includes(p.type)&&!p.active)){ctx.fillStyle='#edce70';ctx.fillRect(ox+p.x*scale-3,oy+p.y*scale-3,6,6);}if(stellaVisible){ctx.fillStyle='#8ee59d';ctx.beginPath();ctx.arc(ox+LEVELS[3].stella[0]*scale,oy+LEVELS[3].stella[1]*scale,4,0,7);ctx.fill();}}}ctx.fillStyle='#ffd778';ctx.beginPath();ctx.arc(ox+player.x*scale,oy+player.y*scale,3,0,7);ctx.fill();ctx.strokeStyle='#ffd778';ctx.beginPath();ctx.moveTo(ox+player.x*scale,oy+player.y*scale);ctx.lineTo(ox+(player.x+Math.cos(player.a)*.7)*scale,oy+(player.y+Math.sin(player.a)*.7)*scale);ctx.stroke();}
function render(){ctx.save();ctx.translate(GameFX.shake.x,GameFX.shake.y);const rects=Renderer.render(frameView());EnemyAI.overlays(rects);ctx.restore();GameUI.overlays(rects);if(started){gun();minimap();}else{ctx.fillStyle='#112c1933';ctx.fillRect(0,0,W,H);}if(hurt>0){ctx.fillStyle=`rgba(172,56,27,${hurt*.3})`;ctx.fillRect(0,0,W,H);}}
GameUI.init();
$('#audio-settings').addEventListener('toggle',()=>{if($('#audio-settings').open&&running)pause();});
$('#start').addEventListener('click',start);$('#sound').addEventListener('click',()=>{audioEnabled=!audioEnabled;GameAudio.setEnabled(audioEnabled);$('#sound').setAttribute('aria-label',audioEnabled?'Выключить звук':'Включить звук');$('#sound').textContent='Звук: '+(audioEnabled?'вкл.':'выкл.');});document.querySelectorAll('.weapon').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.weapon)));
window.addEventListener('keydown',e=>{if(e.target?.matches?.('input,textarea,select'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){pause();return;}if(e.code==='KeyM'&&!e.repeat)showMap=!showMap;if(e.code==='KeyE'&&!e.repeat)interact();if(['Digit1','Digit2','Digit3','Digit4'].includes(e.code))choose(Number(e.code.slice(-1))-1);if(running){keys.add(e.code);if(e.code==='Space'&&!e.repeat)shoot();}});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();GameAudio.pause();}});document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&running&&matchMedia('(pointer:fine)').matches)pause();});document.addEventListener('mousemove',e=>{if(running&&document.pointerLockElement===canvas)player.a+=e.movementX*.0025*GameSettings.get('sensitivity');});canvas.addEventListener('mousedown',e=>{if(e.button!==0||!running)return;fire=true;shoot();if(document.pointerLockElement!==canvas)canvas.requestPointerLock?.()?.catch(()=>{});});window.addEventListener('mouseup',()=>fire=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{if(running){e.preventDefault();choose((weapon+(e.deltaY>0?1:3))%4);}},{passive:false});
for(let b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});for(let name of ['pointerup','pointercancel'])b.addEventListener(name,()=>keys.delete(b.dataset.key));}$('#touchfire').addEventListener('pointerdown',e=>{e.preventDefault();e.target.setPointerCapture(e.pointerId);fire=true;});for(let name of ['pointerup','pointercancel'])$('#touchfire').addEventListener(name,()=>fire=false);$('#touchswap').addEventListener('click',()=>choose((weapon+1)%4));$('#touchuse').addEventListener('click',interact);let touchX=null;canvas.style.touchAction='none';canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touchX=e.clientX;});canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&touchX!==null&&running){player.a+=(e.clientX-touchX)*.009;touchX=e.clientX;}});canvas.addEventListener('pointerup',()=>touchX=null);
reset();let previous=performance.now();function frame(now){let dt=Math.min(.04,(now-previous)/1000);previous=now;tick(dt);if(running||renderRequested){render();renderRequested=false;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
