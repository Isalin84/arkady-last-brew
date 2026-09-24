'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d',{alpha:false});
const W=960,H=540,VIEW=470,FOV=Math.PI/3;
const $=s=>document.querySelector(s);
let map,props=[],levelIndex=0,levelTotal=12,transition=false,checkpoint=null,pathField=[],pathAt=-1,storyHeard=false,storyTimer=0,rescueStage=0,stellaVisible=false,renderRequested=true;
const weapons=[{name:'Смена №7 · IPA',ammo:Infinity,cool:.5,damage:42,speed:10,type:'bottle'},{name:'Котёл 13 · стаут',ammo:18,cool:.8,damage:95,speed:7,type:'can'},{name:'Пробкомёт',ammo:120,cool:.12,damage:19,speed:24,type:'cork'},{name:'Пенная пушка',ammo:80,cool:.09,damage:11,speed:8,type:'foam'}];
let player,enemies,items,shots=[],particles=[],running=false,started=false,won=false,dead=false,kills=0,weapon=0,fire=false,showMap=false,clock=0,cooldown=0,kick=0,hurt=0,toastTime=0,audioEnabled=true,step=0;
const keys=new Set(),depth=new Float32Array(W);
function loadLevel(index,restore=false){
 GameAudio.reset();setFinaleCover(false);storyHeard=false;storyTimer=0;rescueStage=0;stellaVisible=false;$('#radio-message').hidden=true;pathAt=-1;pathField=[];levelIndex=index;const level=LEVELS[index];map=level.map.map(r=>r.split('').map(Number));
 props=level.props.map(([x,y,type,size,r])=>({x,y,type,size,r,active:false}));
 const [x,y,a]=level.spawn;player={x,y,a,hp:restore&&checkpoint?checkpoint.hp:100};
 enemies=level.enemies.map(([x,y,type],i)=>({x,y,type,hp:ENEMY_TYPES[type].hp,max:ENEMY_TYPES[type].hp,attack:0,hit:0,seed:i*3.1,alert:false,mode:'hunt',phase:0,chargeCooldown:1.5,heading:Math.PI}));levelTotal=enemies.length;
 items=level.items.map(([x,y,type])=>({x,y,type}));shots=[];particles=[];kills=0;weapon=0;
 weapons.forEach((w,i)=>w.ammo=restore&&checkpoint?checkpoint.ammo[i]:[Infinity,18,120,80][i]);
 cooldown=0;kick=0;hurt=0;dead=false;won=false;transition=false;clock=0;fire=false;keys.clear();
 GameAudio.setLevel?.(index);$('#level-name').textContent=level.name;renderRequested=true;updateHUD();
}
function reset(){checkpoint=null;GameScore.begin();loadLevel(0);GameScore.checkpoint();}
function solid(x,y){return map[Math.floor(y)]?.[Math.floor(x)]!==0||props.some(p=>Math.hypot(x-p.x,y-p.y)<p.r);}
function move(o,dx,dy,r=.22){if(!solid(o.x+dx+Math.sign(dx)*r,o.y-r)&&!solid(o.x+dx+Math.sign(dx)*r,o.y+r))o.x+=dx;if(!solid(o.x-r,o.y+dy+Math.sign(dy)*r)&&!solid(o.x+r,o.y+dy+Math.sign(dy)*r))o.y+=dy;}
function sight(x,y,tx,ty){let d=Math.hypot(tx-x,ty-y),n=Math.ceil(d/.15);for(let i=1;i<n;i++)if(solid(x+(tx-x)*i/n,y+(ty-y)*i/n))return false;return true;}
function toast(s){$('#toast').textContent=s;$('#toast').style.opacity=1;toastTime=2.6;}
function updateHUD(){
 const health=Math.max(0,Math.min(100,Math.ceil(player.hp))),portrait=$('#arkady-health-portrait');
 const state=health>=76?'100':health>=51?'75':health>=25?'50':'25';
 const labels={100:'Аркадий здоров',75:'Аркадий получил лёгкие повреждения',50:'Аркадий сильно пострадал',25:'Аркадий критически ранен'};
 $('#health').textContent=health;$('#healthbar').style.width=health+'%';portrait.src='assets/art/arkady-health-'+state+'.webp';portrait.alt=labels[state];
 $('#weaponname').textContent=weapons[weapon].name;$('#ammo').textContent=weapons[weapon].ammo===Infinity?'∞':weapons[weapon].ammo;$('#kills').innerHTML=kills+' <em>/ '+levelTotal+'</em>';$('#score').textContent=Math.round(GameScore.current);document.querySelectorAll('.weapon').forEach((b,i)=>b.classList.toggle('active',i===weapon));
}
function choose(i){weapon=i;kick=.18;updateHUD();if(running)toast(weapons[i].name);}
function start(){
 const fresh=!started||dead||won||transition;let event='start';
 if(transition){const completedLevel=levelIndex,nextLevel=completedLevel+1,minimum=[[0,22,140,100],[0,32,190,140],[0,38,220,165]][completedLevel]||[0,22,140,100];checkpoint={hp:Math.max(75,player.hp),ammo:weapons.map((w,i)=>i===0?Infinity:Math.max(w.ammo,minimum[i]))};loadLevel(nextLevel,true);GameScore.checkpoint();event=LEVELS[nextLevel].dialogue.start;}
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
 if(won)showFinalScore(GameScore.finish(player.hp));
}
function setFinaleCover(finale){
 const overlay=$('#overlay'),art=$('.cover-art');overlay.classList.toggle('finale',finale);
 art.src=finale?'assets/art/stella-kisses-arkady.webp':'assets/art/arkady-cover.webp';
 art.alt=finale?'Стелла целует спасшего её Аркадия в щёку в солодовне':'Аркадий со скрещёнными руками на фоне пивоварни';
 if(!finale)$('#score-panel').hidden=true;
}
async function showFinalScore(result){
 $('#score-panel').hidden=false;$('#final-score').textContent=result.score;$('#score-breakdown').textContent=`Зачистка +${result.clearBonus} · здоровье +${result.healthBonus} · скорость +${result.timeBonus}`;
 $('#score-records').innerHTML=result.records.map((record,index)=>`<tr class="${record.id===result.id?'current':''}"><td>${index+1}</td><td>${record.score}</td><td>${GameScore.formatTime(record.time)}</td><td>${record.health}%</td></tr>`).join('');
 $('#score-card-preview').removeAttribute('src');$('#score-card-preview').alt='Создаётся карточка результата';
 try{const card=await ScoreCard.create(result);$('#score-card-preview').src=card.url;$('#score-card-preview').alt=`Карточка результата: ${result.score} очков`;}catch(err){console.warn('Score card unavailable:',err.message);}
}
function shoot(){let w=weapons[weapon];if(cooldown>0)return;if(w.ammo<=0){toast('Припасы закончились. Найди ящик или возьми бутылку: 1');cooldown=.4;return;}w.ammo--;GameScore.shot();cooldown=w.cool;kick=1;let count=weapon===3?3:1;for(let i=0;i<count;i++){let a=player.a+(i-(count-1)/2)*.1;shots.push({x:player.x+Math.cos(a)*.25,y:player.y+Math.sin(a)*.25,dx:Math.cos(a)*w.speed,dy:Math.sin(a)*w.speed,type:w.type,damage:w.damage,life:weapon===3?.65:2.5,age:0});}GameAudio.shot(w.type);GameAudio.say(LEVELS[levelIndex].dialogue.shoot);updateHUD();}
function burst(x,y,color,n=14){for(let i=0;i<n;i++){let a=Math.random()*Math.PI*2,s=Math.random()*1.8;particles.push({x,y,dx:Math.cos(a)*s,dy:Math.sin(a)*s,z:Math.random()*.6,color,life:.35+Math.random()*.3});}}
function damage(e,d){if(e.hp<=0)return;e.hp-=d;e.hit=.16;if(e.hp<=0){kills++;GameScore.kill(e.type,e.max);burst(e.x,e.y,ENEMY_TYPES[e.type].color,25);GameAudio.kill();GameAudio.say(e.type===5?'golemkill':LEVELS[levelIndex].dialogue.kill);if(kills===levelTotal)toast(LEVELS[levelIndex].clear);updateHUD();}}
function impact(s){const dx=s.x-player.x,dy=s.y-player.y;GameAudio.impact(s.type,Math.hypot(dx,dy),(-dx*Math.sin(player.a)+dy*Math.cos(player.a))/5);burst(s.x,s.y,s.type==='foam'?'#fff1c0':s.type==='can'?'#e5bc64':'#a0bb70',s.type==='can'?35:10);if(s.type==='can'){enemies.forEach(e=>{let d=Math.hypot(e.x-s.x,e.y-s.y);if(d<2.1&&sight(s.x,s.y,e.x,e.y))damage(e,s.damage*(1-d/2.5));});}}
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
function hurtPlayer(amount){
 const before=player.hp;player.hp=Math.max(0,player.hp-amount);GameScore.hurt(before-player.hp);hurt=1;GameAudio.hit();GameAudio.say(player.hp<30?'low':LEVELS[levelIndex].dialogue.hurt);updateHUD();
 if(player.hp<=0)finish(false);
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
  if(crash||e.phase<=0){e.mode='recover';e.phase=crash?2.4:1.6;e.chargeCooldown=3;if(crash){burst(e.x,e.y,'#ffe1a0',24);damage(e,45);GameAudio.vehicle?.('crash',d,pan);}}
  return;
 }
 if(e.mode==='recover'){if(e.phase<=0)e.mode='hunt';return;}
 if(visible&&d>1.4&&d<8&&e.chargeCooldown<=0){e.heading=Math.atan2(player.y-e.y,player.x-e.x);e.mode='windup';e.phase=e.type===7?1:.85;toast('ТАРАН! Шаг в сторону — A / D');GameAudio.vehicle?.('warn',d,pan);return;}
 if(d>.8||!visible){e.heading=Math.atan2(player.y-e.y,player.x-e.x);chase(e,dt,d,visible);}
 else if(e.attack<=0){hurtPlayer(Math.round(spec.damage*.55));e.attack=1.6;GameAudio.vehicle?.('crash',d,pan);}
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
 panel.active=true;rescueStage++;burst(panel.x,panel.y,rescueStage===3?'#8ee59d':'#edce70',22);storyTimer=5;$('#radio-message').hidden=false;
 $('#radio-message').innerHTML=`<b>СИСТЕМА СПАСЕНИЯ · ${rescueStage} / 3</b><span>${stepInfo.label}: выполнено.</span>`;
 GameAudio.vehicle?.('radio',1,0);GameAudio.say(stepInfo.event,true);
 if(rescueStage===3){stellaVisible=true;$('#status').textContent='Стелла освобождена. Подойди к ней и нажми E.';toast('ЛЮК ОТКРЫТ · НАЙДИ СТЕЛЛУ И НАЖМИ E');}
 else{$('#status').textContent=rescueSteps[rescueStage].hint+' · E';toast(rescueSteps[rescueStage].hint+' · E');}
}
function tick(dt){clock+=dt;cooldown=Math.max(0,cooldown-dt);kick=Math.max(0,kick-dt*4);hurt=Math.max(0,hurt-dt*2);toastTime-=dt;if(toastTime<=0)$('#toast').style.opacity=0;$('#radio-message').hidden=!running||storyTimer<=0;if(!running)return;GameScore.tick(dt);storyTimer=Math.max(0,storyTimer-dt);
if(keys.has('ArrowLeft'))player.a-=dt*2;if(keys.has('ArrowRight'))player.a+=dt*2;
let f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),s=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));let len=Math.hypot(f,s)||1,speed=(keys.has('ShiftLeft')?3.8:2.6)*dt;move(player,(Math.cos(player.a)*f-Math.sin(player.a)*s)/len*speed,(Math.sin(player.a)*f+Math.cos(player.a)*s)/len*speed);if(f||s)step+=dt*9;GameAudio.update(dt,Boolean(f||s),keys.has('ShiftLeft'));
if(fire||keys.has('Space'))shoot();if(clock>pathAt){routeField();pathAt=clock+.4;}
for(let e of enemies){if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);e.attack-=dt;let d=Math.hypot(e.x-player.x,e.y-player.y),visible=sight(e.x,e.y,player.x,player.y);if((d<8&&visible)||e.alert){if(!e.alert){e.alert=true;toast(ENEMY_TYPES[e.type].name+'!');if(e.type<6||e.type>=8)GameAudio.monster?.(e.type,d,(-Math.sin(player.a)*(e.x-player.x)+Math.cos(player.a)*(e.y-player.y))/5);}if(e.type===6||e.type===7){forklift(e,dt,d,visible);if(!running)return;continue;}if(d>.72||!visible){chase(e,dt,d,visible);}else if(e.attack<=0){e.attack=e.type===5||e.type===10?1.4:.85;GameAudio.monster?.(e.type,d,0,true);hurtPlayer(ENEMY_TYPES[e.type].damage);if(!running)return;}}}
for(let sh of shots){sh.life-=dt;sh.age+=dt;let n=Math.ceil(Math.hypot(sh.dx,sh.dy)*dt/.1);for(let j=0;j<n&&sh.life>0;j++){sh.x+=sh.dx*dt/n;sh.y+=sh.dy*dt/n;if(solid(sh.x,sh.y)){sh.x-=sh.dx*dt/n;sh.y-=sh.dy*dt/n;impact(sh);sh.life=0;break;}let target=enemies.find(e=>e.hp>0&&Math.hypot(e.x-sh.x,e.y-sh.y)<((e.type===6||e.type===7||e.type===10)?.48:.34));if(target){if(sh.type!=='can')damage(target,sh.damage);impact(sh);sh.life=0;}}if(sh.life<=0&&sh.type==='can'&&sh.age>=2.5)impact(sh);}
shots=shots.filter(s=>s.life>0);particles.forEach(p=>{p.life-=dt;p.x+=p.dx*dt;p.y+=p.dy*dt;p.z-=dt*.4;});particles=particles.filter(p=>p.life>0);
items=items.filter(i=>{if(Math.hypot(i.x-player.x,i.y-player.y)<.65){if(i.type==='health'){if(player.hp>=100)return true;player.hp=Math.min(100,player.hp+35);toast('Перерыв на воду: +35 здоровья');}else{weapons[1].ammo+=8;weapons[2].ammo+=45;weapons[3].ammo+=35;toast('Ящик припасов: банки, пробки и пена');}GameScore.pickup();GameAudio.say('pickup');updateHUD();return false;}return true;});
warehouseStory();
if(levelIndex!==3&&kills===levelTotal&&Math.hypot(player.x-LEVELS[levelIndex].exit[0],player.y-LEVELS[levelIndex].exit[1])<.85)finish(true);
}
function makeTexture(kind){let c=document.createElement('canvas');c.width=c.height=128;let g=c.getContext('2d');g.fillStyle=kind===2?'#a66436':kind===3?'#335a3c':'#797663';g.fillRect(0,0,128,128);if(kind===1){for(let y=0;y<128;y+=24){g.fillStyle='#3f493d';g.fillRect(0,y,128,3);for(let x=(y/24%2)*32;x<128;x+=64)g.fillRect(x,y,3,24);g.fillStyle='#b5a789';g.fillRect(0,y+3,128,1);}g.fillStyle='#384a3b';g.fillRect(0,88,128,40);g.fillStyle='#d7bb70';g.fillRect(0,87,128,3);}else if(kind===2){let grad=g.createLinearGradient(0,0,128,0);grad.addColorStop(0,'#4d3828');grad.addColorStop(.35,'#c89155');grad.addColorStop(.55,'#dfaa65');grad.addColorStop(1,'#613d28');g.fillStyle=grad;g.fillRect(0,0,128,128);for(let y of [12,98]){g.fillStyle='#423f30';g.fillRect(0,y,128,7);g.fillStyle='#c1b987';g.fillRect(0,y,128,2);for(let x=8;x<128;x+=23){g.fillStyle='#e1c488';g.fillRect(x,y+2,3,3);}}g.fillStyle='#314331';g.fillRect(30,38,68,39);g.strokeStyle='#ddc386';g.strokeRect(33,41,62,33);g.fillStyle='#e9d6a1';g.font='bold 16px monospace';g.textAlign='center';g.font='bold 9px monospace';g.fillText('ХМЕЛЬНОЙ',64,53);g.fillText('ДОЗОР',64,63);g.font='8px monospace';g.fillText('TANK 04',64,71);g.fillStyle='#413e2e';g.fillRect(60,109,12,19);}else{g.fillStyle='#1d3427';g.fillRect(8,5,112,123);g.strokeStyle='#d8c88a';g.strokeRect(12,10,104,114);g.fillStyle='#c8d994';g.font='bold 20px monospace';g.fillText('EXIT',38,52);g.font='30px monospace';g.fillText('→',49,90);}let seed=31;for(let i=0;i<1800;i++){seed=(seed*16807)%2147483647;let x=seed%128;seed=(seed*16807)%2147483647;let y=seed%128;g.fillStyle=i%2?'#ffffff0c':'#00000012';g.fillRect(x,y,1,1);}return c;}
const textures=[null,makeTexture(1),makeTexture(2),makeTexture(3)];
// A supplied studio logo on selected brick walls, with the ordinary wall as load fallback.
const studioWarehouseWall=document.createElement('canvas');studioWarehouseWall.width=studioWarehouseWall.height=128;studioWarehouseWall.getContext('2d').drawImage(SceneArt.warehouseWall,0,0);
const studioMaltWall=document.createElement('canvas');studioMaltWall.width=studioMaltWall.height=128;studioMaltWall.getContext('2d').drawImage(SceneArt.maltWall,0,0);
const studioWall=makeTexture(1),studioPackWall=document.createElement('canvas'),studioLogo=document.createElement('img');
studioPackWall.width=studioPackWall.height=128;
studioPackWall.getContext('2d').drawImage(SceneArt.packWall,0,0);
// Compensate for the raycaster’s horizontal/vertical projection ratio so logos appear circular.
studioLogo.onload=()=>{const size=82;const scale=Math.min(size/studioLogo.naturalWidth,size/studioLogo.naturalHeight);const w=studioLogo.naturalWidth*scale*(2*VIEW*Math.tan(FOV/2)/W),h=studioLogo.naturalHeight*scale;for(const wall of [studioWall,studioPackWall,studioWarehouseWall,studioMaltWall])wall.getContext('2d').drawImage(studioLogo,64-w/2,64-h/2,w,h);};
studioLogo.src='assets/art/brand/logo.png';
function wallTexture(tile,x,y){
 if(tile===4)return SceneArt.rack;
 if(tile===5)return SceneArt.siloWall;
 if((levelIndex===2||levelIndex===3)&&tile===3)return SceneArt.maltDoor;
 if(tile===2)return SceneArt.wall((x+y)%3);
 if(tile===1){
  const branded=LEVELS[levelIndex].logoWalls.some(([lx,ly])=>x===lx&&y===ly);
  if(levelIndex===1)return branded?studioPackWall:SceneArt.packWall;
  if(levelIndex===2)return branded?studioWarehouseWall:SceneArt.warehouseWall;
  if(levelIndex===3)return branded?studioMaltWall:SceneArt.maltWall;
  if(branded)return studioWall;
 }
 return textures[tile];
}

function sprite(type){let c=document.createElement('canvas');c.width=c.height=128;let g=c.getContext('2d');g.lineWidth=4;g.strokeStyle='#25362d';const ellipse=(x,y,rx,ry,col)=>{g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();g.stroke();};if(type.startsWith('enemy')){let t=Number(type.slice(-1)),col=['#9cac44','#c5a453','#9d8bb5'][t];g.fillStyle='#0005';g.beginPath();g.ellipse(64,116,40,8,0,0,7);g.fill();for(let i=0;i<12;i++){let a=i*Math.PI/6,x=64+Math.cos(a)*43,y=61+Math.sin(a)*40;g.strokeStyle='#25362d';g.lineWidth=7;g.beginPath();g.moveTo(64+Math.cos(a)*30,61+Math.sin(a)*30);g.lineTo(x,y);g.stroke();ellipse(x,y,5,5,col);}ellipse(64,64,36,t===1?43:33,col);ellipse(40,106,13,9,col);ellipse(87,106,13,9,col);g.strokeStyle='#25362d';ellipse(49,52,13,15,'#f3df9c');ellipse(80,52,13,15,'#f3df9c');ellipse(53,55,4,7,'#202820');ellipse(76,55,4,7,'#202820');g.fillStyle='#26382a';g.beginPath();g.moveTo(42,76);g.quadraticCurveTo(64,95,88,75);g.lineTo(82,96);g.lineTo(51,98);g.closePath();g.fill();g.fillStyle='#f0deb2';for(let x=49;x<85;x+=10){g.beginPath();g.moveTo(x,80);g.lineTo(x+7,81);g.lineTo(x+3,90);g.fill();}g.fillStyle='#ffffff33';g.fillRect(37,66,6,4);g.fillRect(82,69,8,5);g.fillStyle='#31473066';g.fillRect(58,30,6,5);g.fillRect(33,81,5,8);g.fillRect(90,65,5,9);if(t===1){g.fillStyle='#e9d799';g.fillRect(46,17,38,9);g.fillRect(53,8,24,12);}if(t===2){g.strokeStyle='#b9a3c8';g.lineWidth=6;for(let x of [20,107]){g.beginPath();g.moveTo(x,50);g.lineTo(x-10,23);g.lineTo(x+3,30);g.stroke();}}}else if(type==='health'){g.fillStyle='#0005';g.fillRect(20,104,90,10);g.fillStyle='#d9dab5';g.fillRect(28,40,72,67);g.strokeRect(28,40,72,67);g.fillStyle='#526e42';g.fillRect(54,48,20,48);g.fillRect(40,62,48,19);g.strokeRect(50,29,28,12);}else if(type==='ammo'){g.fillStyle='#976d3d';g.fillRect(15,54,100,57);g.strokeRect(15,54,100,57);for(let x=26;x<110;x+=22){g.fillStyle='#345336';g.fillRect(x,26,13,41);g.fillStyle='#d2b669';g.fillRect(x+3,16,7,14);}g.fillStyle='#ddc98e';g.fillRect(31,72,68,25);g.fillStyle='#3d462b';g.font='bold 12px monospace';g.font='bold 9px monospace';g.fillText('ХМЕЛЬНОЙ',37,83);g.fillText('ДОЗОР',46,93);}else if(type==='bottle'){g.fillStyle='#ddc88b';g.fillRect(54,7,20,9);g.fillStyle='#426d39';g.fillRect(55,16,18,30);g.fillRect(43,45,42,69);g.strokeRect(43,45,42,69);g.fillStyle='#e8d39a';g.fillRect(43,68,42,29);g.fillStyle='#344b2c';g.font='bold 17px monospace';g.fillText('№7',51,88);g.fillStyle='#acc773';g.fillRect(48,49,5,17);}else if(type==='can'){g.fillStyle='#c5b69b';g.fillRect(39,30,50,78);g.strokeRect(39,30,50,78);g.fillStyle='#44342c';g.fillRect(40,44,48,52);g.fillStyle='#efc86d';g.font='bold 12px monospace';g.fillText('КОТЁЛ',44,68);g.fillText('13',57,86);g.fillStyle='#f1dcac';g.fillRect(42,32,44,5);}else{ellipse(64,64,18,18,type==='foam'?'#f4e4b8':'#bba479');}return c;}
const sprites=Object.fromEntries(['enemy0','enemy1','enemy2','health','ammo','bottle','can','cork','foam'].map(s=>[s,sprite(s)]));
const stellaSprite=document.createElement('canvas');stellaSprite.width=stellaSprite.height=128;const stellaImage=document.createElement('img');
stellaImage.onload=()=>{const g=stellaSprite.getContext('2d');g.clearRect(0,0,128,128);g.imageSmoothingEnabled=true;const scale=Math.min(112/stellaImage.naturalWidth,124/stellaImage.naturalHeight),w=stellaImage.naturalWidth*scale,h=stellaImage.naturalHeight*scale;g.drawImage(stellaImage,64-w/2,126-h,w,h);};
stellaImage.src='assets/art/stella-rescued-full.webp';
function background(){ctx.fillStyle='#263629';ctx.fillRect(0,0,W,H);let sky=ctx.createLinearGradient(0,0,0,VIEW/2);sky.addColorStop(0,LEVELS[levelIndex].ceiling);sky.addColorStop(1,levelIndex===3?'#9b8a6b':levelIndex===2?'#61685f':levelIndex?'#72909b':'#68745e');ctx.fillStyle=sky;ctx.fillRect(0,0,W,VIEW/2);let floor=ctx.createLinearGradient(0,VIEW/2,0,VIEW);floor.addColorStop(0,LEVELS[levelIndex].floor);floor.addColorStop(1,levelIndex===3?'#403729':'#302f24');ctx.fillStyle=floor;ctx.fillRect(0,VIEW/2,W,H);for(let y=VIEW/2+5;y<VIEW;y+=3){let d=VIEW/(2*(y-VIEW/2));let alpha=Math.min(.17,.8/d);ctx.fillStyle=`rgba(195,171,109,${alpha})`;if(Math.floor(d+player.y)%2===0)ctx.fillRect(0,y,W,1);} }
function floorDetails(){
 const ca=Math.cos(player.a),sa=Math.sin(player.a),plane=Math.tan(FOV/2);
 for(let y=VIEW/2+8;y<VIEW;y+=4){const dist=VIEW/(2*(y-VIEW/2)),alpha=Math.min(.28,1.1/dist);
 for(let x=0;x<W;x+=12){const camera=(2*x/W-1)*plane,wx=player.x+dist*(ca-sa*camera),wy=player.y+dist*(sa+ca*camera);
 const fx=wx-Math.floor(wx),fy=wy-Math.floor(wy);if(levelIndex===2&&(fx<.06||fx>.94)&&[2,8,14,20].includes(Math.floor(wx))&&Math.floor(wy*2)%3!==0){ctx.fillStyle=`rgba(239,190,71,${alpha*2})`;ctx.fillRect(x,y,12,4);}
 else if(levelIndex===3&&((fy<.045&&Math.floor(wy)%2===0)||((Math.floor(wx*3)+Math.floor(wy*5))%17===0&&fx<.12))){ctx.fillStyle=`rgba(226,197,126,${alpha*1.7})`;ctx.fillRect(x,y,12,3);}
 else if(fx<.035||fy<.035){ctx.fillStyle=levelIndex?`rgba(15,39,50,${alpha})`:`rgba(20,32,24,${alpha})`;ctx.fillRect(x,y,12,4);}
 else if((Math.floor(wx)+Math.floor(wy))%2===0){ctx.fillStyle=`rgba(194,211,193,${alpha*.12})`;ctx.fillRect(x,y,12,4);}
 }}
}
function drawWorld(){background();floorDetails();for(let x=0;x<W;x+=2){let camera=(2*x/W-1)*Math.tan(FOV/2),rx=Math.cos(player.a)-Math.sin(player.a)*camera,ry=Math.sin(player.a)+Math.cos(player.a)*camera;let mx=Math.floor(player.x),my=Math.floor(player.y),ddx=Math.abs(1/rx),ddy=Math.abs(1/ry),sx=rx<0?-1:1,sy=ry<0?-1:1,distx=(rx<0?player.x-mx:mx+1-player.x)*ddx,disty=(ry<0?player.y-my:my+1-player.y)*ddy,side=0,tile=0;for(let j=0;j<64;j++){if(distx<disty){distx+=ddx;mx+=sx;side=0;}else{disty+=ddy;my+=sy;side=1;}tile=map[my]?.[mx]??1;if(tile)break;}let d=Math.max(.05,side?disty-ddy:distx-ddx);depth[x]=depth[x+1]=d;let wall=side?player.x+d*rx:player.y+d*ry;wall-=Math.floor(wall);let column=Math.min(127,Math.floor(wall*128));if((side===0&&rx<0)||(side===1&&ry>0))column=127-column;let h=VIEW/d,y=(VIEW-h)/2;ctx.drawImage(wallTexture(tile,mx,my),column,0,1,128,x,y,2,h);ctx.fillStyle=`rgba(9,20,14,${Math.min(.83,d*.058+(side?.16:0))})`;ctx.fillRect(x,y,2,h);}}
function project(x,y){let dx=x-player.x,dy=y-player.y,d=dx*Math.cos(player.a)+dy*Math.sin(player.a);return{d,x:W/2+(-dx*Math.sin(player.a)+dy*Math.cos(player.a))*W/(2*Math.tan(FOV/2)*d)};}
function bill(img,x,y,size=1,z=0,hit=0,aspect=1){let p=project(x,y);if(p.d<.15)return;let h=VIEW/p.d*size,w=h*aspect,left=p.x-w/2,top=VIEW/2+VIEW/p.d*.5-h-z*VIEW/p.d;if(left>W||left+w<0)return;ctx.globalAlpha=1;for(let sx=Math.max(0,Math.floor(left));sx<Math.min(W,left+w);sx+=2){if(p.d>=depth[sx])continue;ctx.drawImage(img,Math.max(0,Math.floor((sx-left)/w*128)),0,1,128,sx,top,2,h);}if(hit>0&&p.x>=0&&p.x<W&&p.d<depth[Math.floor(p.x)]){ctx.fillStyle='#f8df9a';ctx.fillRect(p.x-16,top-9,32*hit/.16,3);} }
function drawSprites(){const forkliftType=e=>e.type===6||e.type===7;let all=[...props.map(p=>({...p,aspect:['bottles','cans'].includes(p.type)?1.7:1,img:SceneArt.prop(p.type,['aspiration','screw','hatch'].includes(p.type)?Number(p.active):Math.floor(clock*5)%2)})),...enemies.filter(e=>e.hp>0).map(e=>({...e,img:(forkliftType(e)?SceneArt.forklift(e.type,e.mode,Math.floor(clock*10)%2):e.type>2?SceneArt.monster(e.type,e.attack>.5?1:Math.floor(clock*6+e.seed)%2):sprites['enemy'+e.type]),size:forkliftType(e)?1.25:e.type===10?1.25:e.type===5?1.15:e.type===8?.7:.85,aspect:forkliftType(e)?1.25:1,z:forkliftType(e)?0:e.type===9?.13+Math.sin(clock*4+e.seed)*.04:Math.sin(clock*5+e.seed)*.025})),...(stellaVisible&&levelIndex===3?[{x:LEVELS[3].stella[0],y:LEVELS[3].stella[1],img:stellaSprite,size:1.12,z:Math.sin(clock*2)*.008}]:[]),...items.map(i=>({...i,img:sprites[i.type],size:.52})),...shots.map(s=>({...s,img:sprites[s.type],size:s.type==='foam'?.2:.24,z:.35+Math.sin(Math.min(1,s.age)*Math.PI)*.2}))];all.sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y));for(let e of all)bill(e.img,e.x,e.y,e.size,e.z||0,e.hit||0,e.aspect||1);for(let q of particles){let p=project(q.x,q.y);if(p.d<.1||p.x<0||p.x>=W||p.d>depth[Math.floor(p.x)])continue;let y=VIEW/2+(.4-q.z)*VIEW/p.d,r=Math.min(20,5/p.d);ctx.fillStyle=q.color;ctx.fillRect(p.x,y,r,r);}}
function gun(){
 const throwing=weapon<2,bob=running?Math.sin(step)*5:0;
 const recoil=throwing?Math.sin(kick*Math.PI)*42:kick*22;
 ctx.save();ctx.imageSmoothingEnabled=true;
 ctx.translate(W*.63+bob,VIEW+18+recoil);
 ctx.rotate(throwing?-.04-kick*.32:-.03-kick*.07);
 const art=WeaponArt.get(weapon);ctx.drawImage(art,-240,-365,480,400);
 if(!throwing&&kick>.55){ctx.globalAlpha=(kick-.55)/.45;ctx.fillStyle=weapon===2?'#ffdfa0':'#fff1d2';
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ctx.beginPath();ctx.ellipse(-24+Math.cos(a)*15,-310+Math.sin(a)*11,weapon===2?7:14,weapon===2?4:11,a,0,Math.PI*2);ctx.fill();}}
 ctx.restore();
}
function minimap(){let scale=showMap?15:6,ox=W-16-map[0].length*scale,oy=16;ctx.fillStyle='#10241fe8';ctx.fillRect(ox-7,oy-7,map[0].length*scale+14,map.length*scale+14);map.forEach((row,y)=>row.forEach((t,x)=>{ctx.fillStyle=t===5?'#b59a68':t===2?'#ac8652':t===3?'#d9d883':t?'#63725b':'#233c2f';ctx.fillRect(ox+x*scale,oy+y*scale,scale-1,scale-1);}));if(showMap){for(let e of enemies){if(e.hp<=0)continue;ctx.fillStyle='#d28966';ctx.fillRect(ox+e.x*scale-2,oy+e.y*scale-2,4,4);}for(let i of items){ctx.fillStyle='#c5dca0';ctx.fillRect(ox+i.x*scale-2,oy+i.y*scale-2,4,4);}if(levelIndex===3){for(const p of props.filter(p=>['aspiration','screw','hatch'].includes(p.type)&&!p.active)){ctx.fillStyle='#edce70';ctx.fillRect(ox+p.x*scale-3,oy+p.y*scale-3,6,6);}if(stellaVisible){ctx.fillStyle='#8ee59d';ctx.beginPath();ctx.arc(ox+LEVELS[3].stella[0]*scale,oy+LEVELS[3].stella[1]*scale,4,0,7);ctx.fill();}}}ctx.fillStyle='#ffd778';ctx.beginPath();ctx.arc(ox+player.x*scale,oy+player.y*scale,3,0,7);ctx.fill();ctx.strokeStyle='#ffd778';ctx.beginPath();ctx.moveTo(ox+player.x*scale,oy+player.y*scale);ctx.lineTo(ox+(player.x+Math.cos(player.a)*.7)*scale,oy+(player.y+Math.sin(player.a)*.7)*scale);ctx.stroke();}
function render(){ctx.imageSmoothingEnabled=false;drawWorld();drawSprites();if(started){gun();minimap();}else{ctx.fillStyle='#112c1933';ctx.fillRect(0,0,W,H);}if(hurt>0){ctx.fillStyle=`rgba(172,56,27,${hurt*.3})`;ctx.fillRect(0,0,W,H);}}
document.querySelectorAll('[data-volume]').forEach(input=>{const channel=input.dataset.volume;input.value=Math.round(GameAudio.volumes[channel]*100);$('#value-'+channel).textContent=input.value+'%';input.addEventListener('input',()=>{GameAudio.setVolume(channel,Number(input.value)/100);$('#value-'+channel).textContent=input.value+'%';});});
$('#audio-settings').addEventListener('toggle',()=>{if($('#audio-settings').open&&running)pause();});
$('#start').addEventListener('click',start);$('#sound').addEventListener('click',()=>{audioEnabled=!audioEnabled;GameAudio.setEnabled(audioEnabled);$('#sound').setAttribute('aria-label',audioEnabled?'Выключить звук':'Включить звук');$('#sound').textContent='Звук: '+(audioEnabled?'вкл.':'выкл.');});document.querySelectorAll('.weapon').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.weapon)));
function scoreButtonFeedback(button,text){const old=button.textContent;button.textContent=text;setTimeout(()=>button.textContent=old,1800);}
$('#download-score').addEventListener('click',()=>{ScoreCard.download();scoreButtonFeedback($('#download-score'),'Картинка скачана');});
$('#copy-game-link').addEventListener('click',async()=>{try{await ScoreCard.copyLink();scoreButtonFeedback($('#copy-game-link'),'Ссылка скопирована');}catch{scoreButtonFeedback($('#copy-game-link'),'Не удалось скопировать');}});
$('#share-score').addEventListener('click',async()=>{try{if(await ScoreCard.share())scoreButtonFeedback($('#share-score'),'Отправлено');else{ScoreCard.download();await ScoreCard.copyLink();scoreButtonFeedback($('#share-score'),'Скачано + ссылка');}}catch(err){if(err?.name!=='AbortError')scoreButtonFeedback($('#share-score'),'Не удалось отправить');}});
window.addEventListener('keydown',e=>{if(e.target?.matches?.('input,textarea,select'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){pause();return;}if(e.code==='KeyM'&&!e.repeat)showMap=!showMap;if(e.code==='KeyE'&&!e.repeat)interact();if(['Digit1','Digit2','Digit3','Digit4'].includes(e.code))choose(Number(e.code.slice(-1))-1);if(running){keys.add(e.code);if(e.code==='Space'&&!e.repeat)shoot();}});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();GameAudio.pause();}});document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&running&&matchMedia('(pointer:fine)').matches)pause();});document.addEventListener('mousemove',e=>{if(running&&document.pointerLockElement===canvas)player.a+=e.movementX*.0025;});canvas.addEventListener('mousedown',e=>{if(e.button!==0||!running)return;fire=true;shoot();if(document.pointerLockElement!==canvas)canvas.requestPointerLock?.()?.catch(()=>{});});window.addEventListener('mouseup',()=>fire=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{if(running){e.preventDefault();choose((weapon+(e.deltaY>0?1:3))%4);}},{passive:false});
for(let b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);});for(let name of ['pointerup','pointercancel'])b.addEventListener(name,()=>keys.delete(b.dataset.key));}$('#touchfire').addEventListener('pointerdown',e=>{e.preventDefault();e.target.setPointerCapture(e.pointerId);fire=true;});for(let name of ['pointerup','pointercancel'])$('#touchfire').addEventListener(name,()=>fire=false);$('#touchswap').addEventListener('click',()=>choose((weapon+1)%4));$('#touchuse').addEventListener('click',interact);let touchX=null;canvas.style.touchAction='none';canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touchX=e.clientX;});canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'&&touchX!==null&&running){player.a+=(e.clientX-touchX)*.009;touchX=e.clientX;}});canvas.addEventListener('pointerup',()=>touchX=null);
document.querySelectorAll('.weapon-thumb').forEach((c,i)=>{c.getContext('2d').drawImage(WeaponArt.get(i),110,80,530,550,0,0,c.width,c.height);});
reset();let previous=performance.now();function frame(now){let dt=Math.min(.04,(now-previous)/1000);previous=now;tick(dt);if(running||renderRequested){render();renderRequested=false;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
