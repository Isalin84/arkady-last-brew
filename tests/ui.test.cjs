'use strict';
// UI track: settings persistence and listeners, difficulty lock, upgrade picker, HUD, pause panel, joystick, overlays.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

function makeEnv(storage=new Map()){
 const registry=new Map(),lists=new Map();let now=1000;
 const element=(sel='')=>{
  const attrs={},listeners={},classes=new Set(),el={sel,attrs,listeners,classes,style:{setProperty(k,v){this[k]=v;}},hidden:false,disabled:false,value:'',checked:false,textContent:'',innerHTML:'',title:'',offsetParent:{},focused:0,
   classList:{toggle(c,f){const on=f===undefined?!classes.has(c):f;on?classes.add(c):classes.delete(c);return on;},add(c){classes.add(c);},remove(c){classes.delete(c);},contains:c=>classes.has(c)},
   addEventListener(t,fn){(listeners[t]||=[]).push(fn);},setAttribute(k,v){attrs[k]=String(v);},getAttribute:k=>attrs[k]??null,removeAttribute(k){delete attrs[k];},
   focus(){el.focused++;},querySelector:s=>registry.get(s)||null,querySelectorAll:()=>[],getContext:()=>ctx,closest:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),setPointerCapture(){},
   dispatch(t,ev={}){for(const fn of listeners[t]||[])fn({preventDefault(){},stopPropagation(){},target:el,...ev});}};
  return el;
 };
 const grad={addColorStop(){}},draws=[];
 const ctx=new Proxy({createLinearGradient:()=>grad,measureText:()=>({width:60}),arc:(...a)=>draws.push(['arc',...a]),moveTo:(...a)=>draws.push(['moveTo',...a])},{get:(t,p)=>t[p]||(()=>{}),set:()=>true});
 const $=s=>{if(!registry.has(s))registry.set(s,element(s));return registry.get(s);};
 const document={querySelector:$,querySelectorAll:s=>lists.get(s)||[],createElement:()=>element(),addEventListener(){},activeElement:null,contains:()=>true,fullscreenEnabled:true,exitPointerLock(){}};
 const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
 const sandbox={document,window:{addEventListener(){}},localStorage,performance:{now:()=>now},matchMedia:()=>({matches:false}),console,assert,ctx,W:960,H:540,VIEW:470,setTimeout(){},
  canvas:element('#game'),GameAudio:{volumes:{music:.32,effects:.72,voice:.94},setVolume(){}},ScoreCard:{},
  WeaponArt:{get:()=>({})},GameFX:{damageDir:null,hitMarker:0,hitCrit:false},Renderer:{stats:{avg:0}},
  GameScore:{current:0,combo:undefined,veteranUnlocked:()=>false,formatTime:s=>String(s)},started:true,running:true,hurt:0,player:{hp:100,a:0},kills:0,levelTotal:12,weapon:0,
  weapons:[{name:'A',ammo:Infinity},{name:'B',ammo:18},{name:'C',ammo:0},{name:'D',ammo:80}],won:false,finalResult:null,
  startCalls:0,start(){sandbox.startCalls++;},choose(){}};
 return {sandbox,$,lists,element,draws,setNow:v=>now=v,storage,registry};
}
function load(env,files){vm.createContext(env.sandbox);for(const f of files)vm.runInContext(readFileSync(f,'utf8'),env.sandbox);}

// ---- settings persistence and listeners ----
{
 const env=makeEnv();load(env,['settings.js']);
 const S=env.sandbox;
 const seen=[];vm.runInContext("GameSettings.on('sensitivity',v=>__seen.push(v))",Object.assign(S,{__seen:seen}));
 vm.runInContext("GameSettings.set('sensitivity',1.7);GameSettings.set('quality','low');GameSettings.set('shake',false);GameSettings.set('showFps',true)",S);
 assert.deepEqual(seen,[1.7],'listener fires once per change');
 const env2=makeEnv(env.storage);load(env2,['settings.js']);
 assert.equal(vm.runInContext("GameSettings.get('sensitivity')",env2.sandbox),1.7,'sensitivity survives reload');
 assert.equal(vm.runInContext("GameSettings.get('quality')",env2.sandbox),'low');
 assert.equal(vm.runInContext("GameSettings.get('shake')",env2.sandbox),false);
 assert.equal(vm.runInContext("GameSettings.get('showFps')",env2.sandbox),true);
}

const FILES=['settings.js','progression.js','ui.js'];
function boot(opts={}){
 const env=makeEnv(opts.storage);const {sandbox:S,$,lists}=env;
 const radios=['rookie','normal','veteran'].map(id=>{const b=env.element();b.setAttribute('data-difficulty',id);return b;});
 lists.set('[data-difficulty]',radios);
 const slots=[0,1,2,3].map(()=>{const b=env.element(),ammo=env.element();b.querySelector=()=>ammo;b.ammo=ammo;return b;});
 lists.set('.slot',slots);
 const chips=['general',0,1,2,3].map(k=>{const c=env.element();c.setAttribute('data-chips',k);return c;});
 lists.set('.chips',chips);
 const cards=[];lists.set('#upgrade-cards .up-card',cards);lists.set('#upgrade-cards [data-weapon]',[]);
 load(env,FILES);
 S.GameScore.veteranUnlocked=()=>Boolean(opts.veteran);
 vm.runInContext('GameUI.init()',S);
 return {...env,radios,slots,chips,cards};
}
const run=(env,code)=>vm.runInContext(code,env.sandbox);

// ---- controls write settings (clamped) ----
{
 const e=boot();
 e.$('#setting-sensitivity').dispatch('input',{target:Object.assign(e.$('#setting-sensitivity'),{value:'9'})});
 assert.equal(run(e,"GameSettings.get('sensitivity')"),2.5,'sensitivity clamps to 2.5');
 e.$('#setting-sensitivity').dispatch('input',{target:Object.assign(e.$('#setting-sensitivity'),{value:'0'})});
 assert.equal(run(e,"GameSettings.get('sensitivity')"),.3,'sensitivity clamps to 0.3');
 e.$('#setting-sensitivity').dispatch('input',{target:Object.assign(e.$('#setting-sensitivity'),{value:'1.23'})});
 assert.equal(run(e,"GameSettings.get('sensitivity')"),1.25,'sensitivity snaps to 0.05 steps');
 assert.equal(e.$('#value-sensitivity').textContent,'1.25×');
 e.$('#setting-quality').dispatch('change',{target:Object.assign(e.$('#setting-quality'),{value:'high'})});
 assert.equal(run(e,"GameSettings.get('quality')"),'high');
 e.$('#setting-quality').dispatch('change',{target:Object.assign(e.$('#setting-quality'),{value:'ultra'})});
 assert.equal(run(e,"GameSettings.get('quality')"),'high','unknown quality is ignored');
 e.$('#setting-shake').dispatch('change',{target:Object.assign(e.$('#setting-shake'),{checked:false})});
 assert.equal(run(e,"GameSettings.get('shake')"),false);
 e.$('#setting-fps').dispatch('change',{target:Object.assign(e.$('#setting-fps'),{checked:true})});
 assert.equal(run(e,"GameSettings.get('showFps')"),true);
 // external changes sync the controls back
 run(e,"GameSettings.set('quality','medium')");assert.equal(e.$('#setting-quality').value,'medium');
 assert.equal(e.$('#setting-shake').checked,false);
 assert.ok(e.$('#fullscreen').hidden===false,'fullscreen button shown when the API exists');
}
{
 const e=makeEnv();e.sandbox.document.fullscreenEnabled=false;e.sandbox.document.webkitFullscreenEnabled=false;
 e.lists.set('[data-difficulty]',[]);load(e,FILES);vm.runInContext('GameUI.init()',e.sandbox);
 assert.equal(e.$('#fullscreen').hidden,true,'fullscreen button hidden without the API');
 assert.equal(vm.runInContext('GameUI.toggleFullscreen()',e.sandbox),false);
}

// ---- difficulty and the locked veteran ----
{
 const e=boot();
 assert.equal(run(e,"GameUI.setDifficulty('rookie')"),true);assert.equal(run(e,"GameSettings.get('difficulty')"),'rookie');
 assert.equal(run(e,"GameUI.setDifficulty('veteran')"),false,'veteran is locked');
 assert.equal(run(e,"GameSettings.get('difficulty')"),'rookie');
 assert.equal(e.$('#difficulty-hint').textContent,'Открывается после спасения Стеллы');
 assert.equal(e.radios[2].getAttribute('aria-disabled'),'true');assert.ok(e.radios[2].classes.has('locked'));
 assert.equal(e.radios[0].getAttribute('aria-checked'),'true');
 assert.equal(run(e,"GameUI.setDifficulty('nope')"),false);
 e.radios[1].dispatch('click');assert.equal(run(e,"GameSettings.get('difficulty')"),'normal','clicking an option selects it');
 e.radios[2].dispatch('click');assert.equal(run(e,"GameSettings.get('difficulty')"),'normal','clicking the locked option does nothing');
}
{
 const e=boot({veteran:true});
 assert.equal(run(e,"GameUI.setDifficulty('veteran')"),true);assert.equal(run(e,"GameSettings.get('difficulty')"),'veteran');
 assert.ok(!e.radios[2].classes.has('locked'));assert.equal(e.radios[2].getAttribute('aria-disabled'),'false');
 run(e,"GameScore.veteranUnlocked=()=>false;GameUI.refreshDifficulty()");
 assert.equal(run(e,"GameSettings.get('difficulty')"),'normal','a saved veteran choice falls back when locked');
}

// ---- upgrade picker ----
{
 const e=boot();const picks=[];e.sandbox.__picks=picks;
 const choices=[{id:'dbl',name:'Двойная бутылка',text:'x',weapon:0},{id:'hp',name:'Крепкая спина',text:'y',weapon:null},{id:'cork',name:'Пробки',text:'z',weapon:2}];
 run(e,"GameUI.showUpgrades(["+choices.map(c=>JSON.stringify(c)).join(',')+"],id=>__picks.push(id))");
 assert.equal(e.$('#upgrade-picker').hidden,false);assert.equal(e.$('#start').disabled,true,'next level waits for a pick');
 assert.equal((e.$('#upgrade-cards').innerHTML.match(/class="up-card"/g)||[]).length,3,'three cards');
 assert.ok(e.$('#overlay').classes.has('upgrading'));
 assert.equal(run(e,"GameUI.pickUpgrade('nope')"),false);assert.equal(picks.length,0,'unknown id is ignored');
 assert.equal(run(e,"GameUI.upgradeKey('KeyA')"),false);
 assert.equal(run(e,"GameUI.upgradeKey('Digit2')"),true);
 assert.deepEqual(picks,['hp'],'key 2 picks the second card');
 assert.equal(e.$('#start').disabled,false,'pick enables start');
 assert.equal(run(e,"GameUI.pickUpgrade('dbl')"),false);assert.equal(run(e,"GameUI.upgradeKey('Digit1')"),false);
 e.$('#upgrade-skip').dispatch('click');assert.deepEqual(picks,['hp'],'onPick runs exactly once');
 // skip path and click delegation
 const picks2=[];e.sandbox.__picks2=picks2;
 run(e,"GameUI.showUpgrades([{id:'a',name:'A',text:'',weapon:1}],id=>__picks2.push(id))");
 e.$('#upgrade-cards').dispatch('click',{target:{closest:()=>({getAttribute:()=>'a'})}});assert.deepEqual(picks2,['a'],'click picks a card');
 const picks3=[];e.sandbox.__picks3=picks3;
 run(e,"GameUI.showUpgrades([{id:'a',name:'A',text:'',weapon:1}],id=>__picks3.push(id))");
 e.$('#upgrade-skip').dispatch('click');assert.deepEqual(picks3,[null],'skip reports null');assert.equal(e.$('#start').disabled,false);
 // nothing to choose from: resolves immediately
 const picks4=[];e.sandbox.__picks4=picks4;run(e,"GameUI.showUpgrades([],id=>__picks4.push(id))");assert.deepEqual(picks4,[null]);
 // starting the next level closes the picker
 run(e,"GameUI.showUpgrades([{id:'a',name:'A',text:'',weapon:1}],()=>{})");run(e,'GameUI.onStart()');
 assert.equal(e.$('#upgrade-picker').hidden,true);assert.equal(e.$('#start').disabled,false);assert.ok(!e.$('#overlay').classes.has('upgrading'));
 // names are escaped
 run(e,"GameUI.showUpgrades([{id:'x',name:'<b>hack</b>',text:'a&b',weapon:null}],()=>{})");
 assert.ok(!e.$('#upgrade-cards').innerHTML.includes('<b>hack'),'card text is escaped');
}

// ---- HUD: weapon slots, secrets, upgrade chips, combo, portrait flash ----
{
 const e=boot();
 run(e,"GameUI.updateHUD()");
 assert.deepEqual(e.slots.map(s=>s.ammo.textContent),['∞','18','0','80'],'slot ammo counts');
 assert.ok(e.slots[0].classes.has('active')&&!e.slots[1].classes.has('active'));assert.ok(e.slots[2].classes.has('empty'));
 assert.equal(e.$('#ammo').textContent,'∞');assert.equal(e.$('#secrets').hidden,true,'no secrets counter without secretsTotal');
 run(e,"weapon=1;secretsFound=1;secretsTotal=2;UPGRADES.push({id:'dbl',name:'Двойная бутылка',weapon:0},{id:'hp',name:'Крепкая спина'});runUpgrades=['dbl','hp','hp']");
 run(e,"GameUI.updateHUD()");
 assert.ok(e.slots[1].classes.has('active'));assert.equal(e.$('#ammo').textContent,'18');
 assert.equal(e.$('#secrets').hidden,false);assert.ok(e.$('#secrets-count').innerHTML.startsWith('1 '));
 assert.ok(e.chips[1].innerHTML.includes('Двойная бутылка'),'weapon chip under its weapon');
 assert.ok(e.chips[0].innerHTML.includes('Крепкая спина ×2'),'general chip with a stack count');
 // combo badge
 run(e,"GameScore.combo={mult:3,timer:1.5,window:3};GameUI.frame(.016)");
 assert.equal(e.$('#combo').hidden,false);assert.equal(e.$('#combo-mult').textContent,'×3');assert.equal(e.$('#combo-ring').style.strokeDashoffset,'50.0');
 run(e,"GameScore.combo={mult:1,timer:0};GameUI.frame(.016)");assert.equal(e.$('#combo').hidden,true,'combo hides at x1');
 // portrait flash follows the game's hurt value and resets
 run(e,"hurt=1;GameUI.frame(.016)");assert.equal(e.$('.portrait').style['--hurt'],'1.00');
 run(e,"hurt=0;GameUI.frame(.016)");assert.equal(e.$('.portrait').style['--hurt'],'0.00');
 assert.ok(e.$('body').classes.has('in-game'),'body marks the running game');
}

// ---- pause panel, Esc and restart confirmation ----
{
 const e=boot();
 e.setNow(5000);run(e,"GameUI.pausePanel(true)");
 assert.equal(e.$('#pause-panel').hidden,false);assert.equal(e.$('#pause-panel').getAttribute('data-mode'),'pause');assert.equal(e.$('#resume').focused>0,true,'focus moves to Continue');
 assert.ok(e.$('#pause-meta').innerHTML.includes('зачищено 0 из 12'));
 e.$('#status').textContent='Открой аварийный люк · E';run(e,"GameUI.pausePanel(true)");assert.ok(e.$('#pause-meta').innerHTML.includes('Открой аварийный люк'),'pause meta shows the objective');
 assert.equal(run(e,"GameUI.escape()"),true);assert.equal(e.sandbox.startCalls,0,'Esc right after pausing does not resume');
 e.setNow(5600);run(e,"GameUI.escape()");assert.equal(e.sandbox.startCalls,1,'Esc resumes the shift');
 e.$('#resume').dispatch('click');assert.equal(e.sandbox.startCalls,2);
 run(e,"GameUI.pausePanel(false)");assert.equal(e.$('#pause-panel').hidden,true);assert.equal(run(e,"GameUI.escape()"),false);
 // settings opened from the cover close on Esc without starting
 run(e,"GameUI.pausePanel(true,'start')");assert.equal(e.$('#pause-title').textContent,'Настройки');
 assert.equal(run(e,"GameUI.escape()"),true);assert.equal(e.$('#pause-panel').hidden,true);assert.equal(e.sandbox.startCalls,2);
 e.$('#open-settings').dispatch('click');assert.equal(e.$('#pause-panel').getAttribute('data-mode'),'start');
 e.$('#settings-done').dispatch('click');assert.equal(e.$('#pause-panel').hidden,true);
 // restart needs a second click
 e.sandbox.restarts=0;run(e,"restartLevel=()=>{restarts++}");
 e.setNow(8000);assert.equal(run(e,"GameUI.restartClick()"),false);assert.equal(e.sandbox.restarts,0);assert.ok(e.$('#restart-level').classes.has('confirm'));
 e.setNow(8500);assert.equal(run(e,"GameUI.restartClick()"),true);assert.equal(e.sandbox.restarts,1);
 e.setNow(9000);run(e,"GameUI.restartClick()");e.setNow(13000);run(e,"GameUI.frame(.016)");assert.ok(!e.$('#restart-level').classes.has('confirm'),'confirmation expires');
 assert.ok(e.$('#restart-level').textContent==='Заново этот цех');e.setNow(14000);run(e,"GameUI.restartClick()");assert.ok(e.$('#restart-level').textContent.includes('Прогресс цеха сбросится'));
 run(e,"var diffKey='veteran'");e.setNow(20000);run(e,"GameUI.frame(.016);GameUI.restartClick()");assert.ok(e.$('#restart-level').textContent.includes('Смена начнётся с первого цеха'),'veteran restart warns about the whole run');
}

// ---- virtual joystick ----
{
 const e=boot();const joy=e.$('#joystick'),m={GameUI:{touchMove:run(e,'GameUI.touchMove')}};
 joy.dispatch('pointerdown',{pointerId:7,clientX:50,clientY:50});
 assert.equal(m.GameUI.touchMove.x,0);assert.equal(m.GameUI.touchMove.y,0,'centre is the dead zone');
 joy.dispatch('pointermove',{pointerId:7,clientX:100,clientY:50});assert.ok(m.GameUI.touchMove.x>.9&&m.GameUI.touchMove.y===0,'right = strafe right');
 joy.dispatch('pointermove',{pointerId:7,clientX:50,clientY:0});assert.ok(m.GameUI.touchMove.y>.9,'up = forward');
 joy.dispatch('pointermove',{pointerId:8,clientX:50,clientY:90});assert.ok(m.GameUI.touchMove.y>.9,'other pointers are ignored');
 joy.dispatch('pointermove',{pointerId:7,clientX:500,clientY:50});assert.ok(Math.hypot(m.GameUI.touchMove.x,m.GameUI.touchMove.y)<=1.0001,'input is clamped to the unit circle');
 joy.dispatch('pointerup',{pointerId:7});assert.equal(m.GameUI.touchMove.x,0);assert.equal(m.GameUI.touchMove.y,0);
}

// ---- canvas overlays run and draw the damage arc, hit marker and FPS ----
{
 const e=boot();
 run(e,"GameFX.damageDir=Math.PI/2;GameFX.hitMarker=.8;GameFX.hitCrit=true;GameSettings.set('showFps',true);Renderer.stats.avg=8;hurt=1");
 run(e,"GameUI.frame(.016);GameUI.overlays([])");
 assert.ok(e.draws.some(d=>d[0]==='arc'),'damage direction arc is drawn');
 e.draws.length=0;run(e,"hurt=0;GameFX.damageDir=null;GameUI.frame(5);GameUI.overlays([])");
 assert.ok(!e.draws.some(d=>d[0]==='arc'),'arc fades out');
 run(e,"started=false");e.draws.length=0;run(e,"GameUI.overlays([])");assert.equal(e.draws.length,0,'nothing is drawn on the cover');
}

console.log('PASS: ui settings, difficulty lock, upgrade picker, HUD slots and chips, combo, pause panel, joystick, overlays');
