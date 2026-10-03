'use strict';
// DOM interface: HUD, toasts, pause/settings panel, difficulty and upgrade pickers, touch controls, fullscreen, finale cover and score panel.
const GameUI=(()=>{
 const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const setText=(el,v)=>{if(el&&el._v!==v){el._v=v;el.textContent=v;}};
 const ammoText=a=>a===Infinity?'∞':String(Math.max(0,a|0));
 const touchMove={x:0,y:0}; // joystick: x strafe right, y forward, both -1..1; read by game.js tick
 const DIFFICULTIES=[['rookie','Стажёр','Враги слабее, аптечки щедрее.'],['normal','Пивовар','Смена как задумана.'],['veteran','Ветеран','Одна жизнь. Враги злее. Очки ×2.']];
 const LOCK_HINT='Открывается после спасения Стеллы';
 const QUALITIES=['auto','high','medium','low'];
 let toastTime=0,panelMode=null,pausedAt=0,fsAt=-1e4,confirmUntil=0,lastFocus=null,up=null,inGame=null,lastChips=null,lastHurtVar=0;
 let dmgT=0,dmgDir=0,seenDir=null,prevHurt=0,lastMult=-1,lastSecrets=null,lastPortrait='';
 function toast(s){$('#toast').textContent=s;$('#toast').style.opacity=1;toastTime=2.6;}
 // ---- HUD ----
 function updateHUD(){
  const health=Math.max(0,Math.min(100,Math.ceil(player.hp))),portrait=$('#arkady-health-portrait');
  const state=health>=76?'100':health>=51?'75':health>=25?'50':'25';
  const labels={100:'Аркадий здоров',75:'Аркадий получил лёгкие повреждения',50:'Аркадий сильно пострадал',25:'Аркадий критически ранен'};
  const bar=$('#healthbar');
  $('#health').textContent=health;bar.style.width=health+'%';bar.classList.toggle('low',health<30);bar.classList.toggle('mid',health>=30&&health<60);portrait.src='assets/art/arkady-health-'+state+'.webp';portrait.alt=labels[state];
  $('#weaponname').textContent=weapons[weapon].name;$('#ammo').textContent=ammoText(weapons[weapon].ammo);$('#kills').innerHTML=kills+' <em>/ '+levelTotal+'</em>';$('#score').textContent=Math.round(GameScore.current);
  $$('.weapon').forEach((b,i)=>b.classList.toggle('active',i===weapon));
  $$('.slot').forEach((b,i)=>{const w=weapons[i];b.classList.toggle('active',i===weapon);b.classList.toggle('empty',w.ammo<=0);setText(b.querySelector('.slot-ammo'),ammoText(w.ammo));});
  const secretsOn=typeof secretsFound!=='undefined'&&typeof secretsTotal!=='undefined'&&secretsTotal>0,sKey=secretsOn?secretsFound+'/'+secretsTotal:'';
  if(sKey!==lastSecrets){lastSecrets=sKey;$('#secrets').hidden=!secretsOn;if(secretsOn)$('#secrets-count').innerHTML=secretsFound+' <em>/ '+secretsTotal+'</em>';}
  renderChips();
 }
 // Acquired upgrades as chips under each weapon (id list from game.js, names from progression.js).
 function renderChips(){
  const ids=typeof runUpgrades!=='undefined'&&Array.isArray(runUpgrades)?runUpgrades:[],key=ids.join(',');
  if(key===lastChips)return;lastChips=key;
  const defs=typeof UPGRADES!=='undefined'&&Array.isArray(UPGRADES)?UPGRADES:[],counts=new Map(),by={general:[]};
  for(const id of ids)counts.set(id,(counts.get(id)||0)+1);
  for(const [id,n] of counts){const u=defs.find(d=>d.id===id)||{id,name:id},slot=Number.isInteger(u.weapon)&&u.weapon>=0&&u.weapon<4?u.weapon:'general';(by[slot]||=[]).push(`<span class="chip" title="${esc(u.text||'')}">${esc(u.name||id)}${n>1?' ×'+n:''}</span>`);}
  $$('.chips').forEach(el=>{el.innerHTML=(by[el.getAttribute('data-chips')]||[]).join('');});
 }
 // ---- cover / finale ----
 function setFinaleCover(finale){
  const overlay=$('#overlay'),art=$('.cover-art');overlay.classList.toggle('finale',finale);
  overlay.classList.toggle('finale-moment',finale);overlay.classList.remove('finale-results');
  art.src=finale?'assets/art/stella-kisses-arkady.webp':'assets/art/arkady-cover.webp';
  art.alt=finale?'Стелла целует спасшего её Аркадия в щёку в солодовне':'Аркадий со скрещёнными руками на фоне пивоварни';
  $('#show-results').hidden=!finale;if(!finale)$('#score-panel').hidden=true;refreshDifficulty();
 }
 async function prepareFinalScore(result){
  $('#final-score').textContent=result.score;$('#score-breakdown').textContent=`Зачистка +${result.clearBonus} · здоровье +${result.healthBonus} · скорость +${result.timeBonus}`;
  $('#score-records').innerHTML=result.records.map((record,index)=>`<tr class="${record.id===result.id?'current':''}"><td>${index+1}</td><td>${record.score}</td><td>${GameScore.formatTime(record.time)}</td><td>${record.health}%</td></tr>`).join('');
  $('#score-card-preview').removeAttribute('src');$('#score-card-preview').alt='Создаётся карточка результата';
  try{const card=await ScoreCard.create(result);$('#score-card-preview').src=card.url;$('#score-card-preview').alt=`Карточка результата: ${result.score} очков`;}catch(err){console.warn('Score card unavailable:',err.message);}
 }
 function revealFinalScore(){
  if(!won||!finalResult)return;const overlay=$('#overlay');overlay.classList.remove('finale-moment');overlay.classList.add('finale-results');$('#show-results').hidden=true;$('#score-panel').hidden=false;
 }
 function scoreButtonFeedback(button,text){const old=button.textContent;button.textContent=text;setTimeout(()=>button.textContent=old,1800);}
 // ---- per-frame work (runs while paused too) ----
 function frame(dt){
  toastTime-=dt;if(toastTime<=0)$('#toast').style.opacity=0;
  if(confirmUntil&&performance.now()>confirmUntil)resetRestartConfirm();
  const live=typeof running!=='undefined'&&running,ig=Boolean(live||panelMode==='pause');
  if(ig!==inGame){inGame=ig;$('body').classList.toggle('in-game',ig);}
  const h=typeof hurt==='number'?hurt:0;
  if(h>0||lastHurtVar>0){lastHurtVar=h;$('.portrait').style.setProperty?.('--hurt',h.toFixed(2));}
  // Damage direction: remember the latest source so the arc stays visible after `hurt` fades.
  const d=typeof GameFX!=='undefined'?GameFX.damageDir:null,rising=h>prevHurt+.25;prevHurt=h;
  if(Number.isFinite(d)&&(d!==seenDir||rising)){dmgDir=d;dmgT=1.6;}
  seenDir=Number.isFinite(d)?d:null;dmgT=Math.max(0,dmgT-dt);
  // Combo badge with a draining ring.
  const c=typeof GameScore!=='undefined'?GameScore.combo:null,mult=c&&c.mult>1?c.mult:0;
  if(mult!==lastMult){const el=$('#combo');el.hidden=!mult;if(mult){setText($('#combo-mult'),'×'+mult);el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}lastMult=mult;}
  if(mult)$('#combo-ring').style.strokeDashoffset=(100*(1-Math.max(0,Math.min(1,c.timer/(c.window||3))))).toFixed(1);
 }
 // Canvas-space overlays (960x540) over the 3D view; rects come from Renderer.render().
 function overlays(rects){
  if(typeof started==='undefined'||!started)return;
  const cx=W/2,cy=VIEW*.5;
  if(dmgT>0){
   const a=Math.min(1,dmgT/.8),ang=-Math.PI/2+dmgDir-player.a;
   ctx.save();ctx.lineCap='round';
   ctx.strokeStyle='rgba(224,52,44,'+(.5*a).toFixed(3)+')';ctx.lineWidth=16;ctx.beginPath();ctx.arc(cx,cy,92,ang-.34,ang+.34);ctx.stroke();
   ctx.strokeStyle='rgba(255,196,178,'+(.95*a).toFixed(3)+')';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,98,ang-.3,ang+.3);ctx.stroke();
   ctx.restore();
  }
  const hm=typeof GameFX!=='undefined'?GameFX.hitMarker:0;
  if(hm>0){
   const crit=Boolean(GameFX.hitCrit),r0=5+(1-hm)*4,r1=r0+(crit?11:8),o=.5+hm*.5;
   ctx.save();ctx.translate(cx,cy);ctx.lineCap='round';ctx.globalAlpha=Math.min(1,o);
   for(const [lw,col] of [[crit?5.5:4.5,'#0b1d3a'],[crit?3:2,crit?'#d4af37':'#faf9f6']]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();for(let i=0;i<4;i++){const sx=i%2?1:-1,sy=i<2?1:-1;ctx.moveTo(sx*r0,sy*r0);ctx.lineTo(sx*r1,sy*r1);}ctx.stroke();}
   ctx.restore();
  }
  if(GameSettings.get('showFps')){
   const avg=typeof Renderer!=='undefined'&&Renderer.stats?Renderer.stats.avg:0;
   if(avg>0){ctx.save();ctx.font='600 12px Montserrat,monospace';ctx.textBaseline='middle';const t=Math.round(1000/avg)+' FPS · '+avg.toFixed(1)+' мс';ctx.fillStyle='rgba(11,29,58,.82)';ctx.fillRect(10,10,ctx.measureText(t).width+16,22);ctx.fillStyle=avg>20?'#f2c94c':'#9fe3b0';ctx.fillText(t,18,21);ctx.restore();}
  }
 }
 // ---- difficulty ----
 function veteranUnlocked(){try{return Boolean(GameScore.veteranUnlocked?.());}catch{return false;}}
 function difficultyHint(id){const d=DIFFICULTIES.find(x=>x[0]===id);return id==='veteran'&&!veteranUnlocked()?LOCK_HINT:d?d[2]:'';}
 function refreshDifficulty(){
  let cur=GameSettings.get('difficulty');
  if(!DIFFICULTIES.some(d=>d[0]===cur)||(cur==='veteran'&&!veteranUnlocked())){cur='normal';GameSettings.set('difficulty',cur);}
  const locked=!veteranUnlocked();
  $$('[data-difficulty]').forEach(b=>{const id=b.getAttribute('data-difficulty'),on=id===cur,lk=id==='veteran'&&locked;b.setAttribute('aria-checked',String(on));b.setAttribute('tabindex',on?'0':'-1');b.classList.toggle('active',on);b.classList.toggle('locked',lk);if(id==='veteran'){b.setAttribute('aria-disabled',String(lk));b.title=lk?LOCK_HINT:'';}});
  setText($('#difficulty-hint'),difficultyHint(cur));
 }
 function setDifficulty(id){
  if(!DIFFICULTIES.some(d=>d[0]===id))return false;
  if(id==='veteran'&&!veteranUnlocked()){setText($('#difficulty-hint'),LOCK_HINT);const box=$('#difficulty');box.classList.remove('nope');void box.offsetWidth;box.classList.add('nope');return false;}
  GameSettings.set('difficulty',id);refreshDifficulty();return true;
 }
 function bindDifficulty(){
  $$('[data-difficulty]').forEach(b=>{
   const id=b.getAttribute('data-difficulty'),show=()=>setText($('#difficulty-hint'),difficultyHint(id)),hide=()=>setText($('#difficulty-hint'),difficultyHint(GameSettings.get('difficulty')));
   b.addEventListener('click',()=>setDifficulty(id));b.addEventListener('pointerenter',show);b.addEventListener('focus',show);b.addEventListener('pointerleave',hide);b.addEventListener('blur',hide);
  });
  $('#difficulty').addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))return;e.preventDefault();e.stopPropagation();
   const ids=DIFFICULTIES.map(d=>d[0]).filter(id=>id!=='veteran'||veteranUnlocked()),i=ids.indexOf(GameSettings.get('difficulty')),step=e.code==='ArrowLeft'||e.code==='ArrowUp'?-1:1,next=ids[(i+step+ids.length)%ids.length];
   if(setDifficulty(next))$$('[data-difficulty]').forEach(b=>{if(b.getAttribute('data-difficulty')===next)b.focus();});
  });
  refreshDifficulty();
 }
 // ---- pause / settings panel ----
 function pausePanel(show,mode='pause'){
  const panel=$('#pause-panel');
  if(show){
   if(panelMode===null)lastFocus=document.activeElement||null;
   panelMode=mode;pausedAt=performance.now();resetTouch();$('body').classList.add('panel-open');
   panel.setAttribute('data-mode',mode);panel.hidden=false;
   if(mode==='pause'){$('#pause-title').innerHTML='Перерыв <br>на пену';setText($('#pause-kicker'),'Смена приостановлена');updatePauseMeta();}
   else{$('#pause-title').textContent='Настройки';setText($('#pause-kicker'),'Best Practice AI · Игра');}
   resetRestartConfirm();refreshDifficulty();
   const first=$(mode==='pause'?'#resume':'#settings-done');first.focus?.({preventScroll:true});
  }else if(panelMode!==null){
   panelMode=null;panel.hidden=true;resetRestartConfirm();$('body').classList.remove('panel-open');
   const f=lastFocus;lastFocus=null;if(f&&f.focus&&document.contains?.(f)&&f!==$('body'))f.focus({preventScroll:true});
  }
 }
 function updatePauseMeta(){
  const level=typeof LEVELS!=='undefined'&&typeof levelIndex==='number'?LEVELS[levelIndex]:null;
  const line='зачищено '+kills+' из '+levelTotal+' · '+Math.round(GameScore.current)+' очков';
  if($('#pause-meta')._v!==line+level?.name){$('#pause-meta')._v=line+level?.name;$('#pause-meta').innerHTML=(level?'<b>'+esc(level.name)+'</b>':'')+esc(line);}
 }
 function resetRestartConfirm(){if(!confirmUntil)return;confirmUntil=0;const b=$('#restart-level');b.classList.remove('confirm');b.textContent='Заново этот цех';}
 function restartClick(){
  if(performance.now()>confirmUntil){const b=$('#restart-level');b.classList.add('confirm');b.textContent='Точно? Прогресс цеха сбросится';confirmUntil=performance.now()+3500;return false;}
  resetRestartConfirm();if(typeof restartLevel==='function')restartLevel();return true;
 }
 // Esc / blur handling for game.js: returns true if the key was consumed by the panel.
 function escape(){
  if(panelMode==='pause'){if(performance.now()-pausedAt>350&&typeof start==='function')start();return true;}
  if(panelMode==='start'){pausePanel(false);return true;}
  return false;
 }
 function trapTab(e){
  if(e.code!=='Tab'||panelMode===null)return;
  const items=[...$('#pause-panel').querySelectorAll('button,input,select')].filter(el=>!el.disabled&&el.offsetParent!==null);
  if(!items.length)return;const first=items[0],last=items[items.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
 // ---- settings controls ----
 // Paints the filled part of a range track (CSS reads --p).
 function fillRange(el){const min=Number(el.min||0),max=Number(el.max||100);el.style.setProperty?.('--p',((Number(el.value)-min)/(max-min)*100).toFixed(1)+'%');}
 const clampSens=v=>Math.min(2.5,Math.max(.3,Math.round((Number.isFinite(v)?v:1)*20)/20));
 function syncSettings(){
  const sens=GameSettings.get('sensitivity');
  $('#setting-sensitivity').value=sens;fillRange($('#setting-sensitivity'));setText($('#value-sensitivity'),sens.toFixed(2).replace(/0$/,'')+'×');
  $('#setting-quality').value=GameSettings.get('quality');$('#setting-shake').checked=GameSettings.get('shake');$('#setting-fps').checked=GameSettings.get('showFps');
 }
 function bindSettings(){
  $('#setting-sensitivity').addEventListener('input',e=>{fillRange(e.target);GameSettings.set('sensitivity',clampSens(Number(e.target.value)));});
  $('#setting-quality').addEventListener('change',e=>{if(QUALITIES.includes(e.target.value))GameSettings.set('quality',e.target.value);});
  $('#setting-shake').addEventListener('change',e=>GameSettings.set('shake',Boolean(e.target.checked)));
  $('#setting-fps').addEventListener('change',e=>GameSettings.set('showFps',Boolean(e.target.checked)));
  for(const key of ['sensitivity','quality','shake','showFps'])GameSettings.on(key,syncSettings);
  syncSettings();
 }
 // ---- fullscreen ----
 const fsElement=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
 const fsSupported=()=>Boolean(document.fullscreenEnabled||document.webkitFullscreenEnabled);
 function toggleFullscreen(){
  if(!fsSupported())return false;
  const stage=$('#stage');
  try{const p=fsElement()?(document.exitFullscreen||document.webkitExitFullscreen).call(document):(stage.requestFullscreen||stage.webkitRequestFullscreen).call(stage);p?.catch?.(()=>{});}catch{}
  return true;
 }
 function bindFullscreen(){
  const btn=$('#fullscreen'),pbtn=$('#pause-fullscreen');btn.hidden=pbtn.hidden=!fsSupported();
  btn.addEventListener('click',toggleFullscreen);pbtn.addEventListener('click',toggleFullscreen);
  const onChange=()=>{
   fsAt=performance.now();const on=Boolean(fsElement());
   btn.setAttribute('aria-pressed',String(on));btn.setAttribute('aria-label',on?'Выйти из полного экрана':'Полный экран');setText($('#fullscreen span'),on?'Выйти':'Полный экран');pbtn.setAttribute('aria-pressed',String(on));setText(pbtn,on?'Выйти из полного экрана':'Полный экран');
   if(on&&typeof running!=='undefined'&&running&&document.pointerLockElement!==canvas)canvas.requestPointerLock?.()?.catch?.(()=>{});
  };
  document.addEventListener('fullscreenchange',onChange);document.addEventListener('webkitfullscreenchange',onChange);
 }
 // ---- touch joystick ----
 function resetTouch(){touchMove.x=touchMove.y=0;const k=$('#joystick-knob');if(k)k.style.transform='';}
 function bindTouch(){
  const joy=$('#joystick'),knob=$('#joystick-knob');let id=null,cx=0,cy=0,rad=1;
  const move=e=>{let dx=(e.clientX-cx)/rad,dy=(e.clientY-cy)/rad;const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}const dead=m<.14;touchMove.x=dead?0:dx;touchMove.y=dead?0:-dy;knob.style.transform=`translate(${(dx*rad).toFixed(1)}px,${(dy*rad).toFixed(1)}px)`;};
  const end=e=>{if(e.pointerId!==id)return;id=null;resetTouch();};
  joy.addEventListener('pointerdown',e=>{if(id!==null)return;e.preventDefault();id=e.pointerId;const r=joy.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;rad=Math.max(1,r.width*.36);try{joy.setPointerCapture?.(e.pointerId);}catch{}move(e);});
  joy.addEventListener('pointermove',e=>{if(e.pointerId===id)move(e);});
  joy.addEventListener('pointerup',end);joy.addEventListener('pointercancel',end);joy.addEventListener('lostpointercapture',end);
 }
 // ---- upgrade picker ----
 function upgradeCard(c,i){
  const w=Number.isInteger(c.weapon)&&c.weapon>=0&&c.weapon<4?c.weapon:-1,tag=w>=0&&typeof WEAPON_BASE!=='undefined'?WEAPON_BASE[w].name:'Для всей смены';
  const art=w>=0?`<canvas class="up-thumb" width="96" height="100" data-weapon="${w}" aria-hidden="true"></canvas>`:'<span class="up-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.4 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg></span>';
  return `<button type="button" class="up-card" data-id="${esc(c.id)}" data-weapon="${w}" aria-pressed="false"><span class="up-key" aria-hidden="true">${i+1}</span>${art}<small>${esc(tag)}</small><b>${esc(c.name||c.id)}</b><span class="up-text">${esc(c.text||'')}</span></button>`;
 }
 function drawThumb(canvas,index){
  if(typeof WeaponArt==='undefined'||!canvas.getContext)return;
  const g=canvas.getContext('2d');g.clearRect(0,0,canvas.width,canvas.height);g.drawImage(WeaponArt.get(index),110,80,530,550,0,0,canvas.width,canvas.height);
 }
 // Between-level upgrade choice: three cards, click or 1-3 picks, onPick(id|null) runs exactly once.
 function showUpgrades(choices,onPick){
  const list=Array.isArray(choices)?choices.filter(c=>c&&c.id!==undefined).slice(0,3):[];
  if(!list.length){if(typeof onPick==='function')onPick(null);return;}
  up={list,done:false,onPick};
  $('#upgrade-cards').innerHTML=list.map(upgradeCard).join('');
  $$('#upgrade-cards [data-weapon]').forEach(el=>{const w=Number(el.getAttribute('data-weapon'));if(w>=0&&el.getContext)drawThumb(el,w);});
  $('#upgrade-picker').hidden=false;$('#upgrade-picker').classList.remove('chosen');$('#overlay').classList.add('upgrading');
  $('#start').disabled=true;$('#start').title='Сначала выбери улучшение';
 }
 function pickUpgrade(id){
  if(!up||up.done)return false;
  if(id!==null&&!up.list.some(c=>String(c.id)===String(id)))return false;
  up.done=true;const cb=up.onPick;
  $$('#upgrade-cards .up-card').forEach(card=>{const on=id!==null&&card.getAttribute('data-id')===String(id);card.classList.toggle('selected',on);card.setAttribute('aria-pressed',String(on));card.disabled=true;});
  $('#upgrade-picker').classList.add('chosen');$('#upgrade-skip').hidden=true;
  $('#start').disabled=false;$('#start').title='';$('#start').focus?.({preventScroll:true});
  if(typeof cb==='function')cb(id===null?null:up.list.find(c=>String(c.id)===String(id)).id);
  return true;
 }
 function upgradeKey(code){
  if(!up||up.done)return false;
  const m=/^(?:Digit|Numpad)([1-3])$/.exec(code);if(!m)return false;
  const c=up.list[Number(m[1])-1];return c?pickUpgrade(c.id):false;
 }
 function hideUpgrades(){
  up=null;$('#upgrade-picker').hidden=true;$('#upgrade-skip').hidden=false;$('#overlay').classList.remove('upgrading');$('#start').disabled=false;$('#start').title='';
 }
 function bindUpgrades(){
  $('#upgrade-cards').addEventListener('click',e=>{const card=e.target?.closest?.('[data-id]');if(card)pickUpgrade(card.getAttribute('data-id'));});
  $('#upgrade-skip').addEventListener('click',()=>pickUpgrade(null));
 }
 // game.js start(): the shift is (re)starting.
 function onStart(){pausePanel(false);hideUpgrades();resetTouch();$('#overlay').classList.add('played');}
 const recentFullscreenChange=()=>performance.now()-fsAt<800;
 // Wires static controls once; called by game.js after its own globals exist.
 function init(){
  $$('[data-volume]').forEach(input=>{const channel=input.getAttribute('data-volume');input.value=Math.round(GameAudio.volumes[channel]*100);fillRange(input);$('#value-'+channel).textContent=input.value+'%';input.addEventListener('input',()=>{GameAudio.setVolume(channel,Number(input.value)/100);fillRange(input);$('#value-'+channel).textContent=input.value+'%';});});
  $('#download-score').addEventListener('click',()=>{ScoreCard.download();scoreButtonFeedback($('#download-score'),'Картинка скачана');});
  $('#copy-game-link').addEventListener('click',async()=>{try{await ScoreCard.copyLink();scoreButtonFeedback($('#copy-game-link'),'Ссылка скопирована');}catch{scoreButtonFeedback($('#copy-game-link'),'Не удалось скопировать');}});
  $('#share-score').addEventListener('click',async()=>{try{if(await ScoreCard.share())scoreButtonFeedback($('#share-score'),'Отправлено');else{ScoreCard.download();await ScoreCard.copyLink();scoreButtonFeedback($('#share-score'),'Скачано + ссылка');}}catch(err){if(err?.name!=='AbortError')scoreButtonFeedback($('#share-score'),'Не удалось отправить');}});
  $('#show-results').addEventListener('click',revealFinalScore);$('#replay-score').addEventListener('click',start);
  $$('.weapon-thumb').forEach((c,i)=>drawThumb(c,i));$$('.slot-thumb').forEach((c,i)=>drawThumb(c,i));
  $$('.slot').forEach((b,i)=>b.addEventListener('click',()=>{if(typeof choose==='function')choose(i);}));
  $('#resume').addEventListener('click',()=>start());$('#settings-done').addEventListener('click',()=>pausePanel(false));$('#open-settings').addEventListener('click',()=>pausePanel(true,'start'));
  $('#restart-level').addEventListener('click',restartClick);$('#pause-panel').addEventListener('keydown',trapTab);
  bindSettings();bindDifficulty();bindFullscreen();bindTouch();bindUpgrades();
 }
 return {toast,updateHUD,setFinaleCover,prepareFinalScore,revealFinalScore,frame,overlays,showUpgrades,pickUpgrade,upgradeKey,pausePanel,escape,onStart,init,touchMove,resetTouch,toggleFullscreen,fullscreenSupported:fsSupported,recentFullscreenChange,setDifficulty,refreshDifficulty,restartClick,LOCK_HINT};
})();
