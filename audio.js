'use strict';
// One mixer for positional effects, ambience and Arkady's voice. No overlapping dialogue.
const GameAudio=(()=>{
 const files={glass:'sfx/glass.mp3',can:'sfx/can-open.mp3',steps:'sfx/footsteps.mp3',steam:'sfx/steam.mp3',music:'music/arkady-hunting.mp3'};
 const lines=[
  ['start','Ну что, Аркадий. Ещё одна ночная смена.'],
  ['walk','Тридцать лет варю. Такого брожения ещё не видел.'],
  ['walk','Чую, где-то завелась посторонняя культура.'],
  ['walk','Тихо в цеху. Даже дрожжи притихли.'],
  ['shoot','Лови нефильтрованное!'],
  ['shoot','А вот и контроль качества!'],
  ['shoot','Сейчас я тебя пастеризую!'],
  ['hurt','Не трогай пивовара, зараза!'],
  ['hurt','Ай! Фартук новый, между прочим!'],
  ['low','Рано меня списывать. Я ещё поброжу.'],
  ['kill','Минус одна посторонняя культура.'],
  ['kill','Хороший микроб — правильный микроб. А ты был неправильный.'],
  ['pickup','О, припасы! С этим ещё повоюем.'],
  ['win','Цех чистый. Партия спасена. Аркадий смену сдал.'],
  ['death','Недобродил я, мужики...']
 ];
 let ac,master,effects,voiceGain,buffers={},loading,enabled=true,active=false,voice=null,ambient=null,walking=null,voiceUntil=0,nextVoice=0,walkTime=0,nextWalk=13,foamAt=-1,stepAt=-1,lastLine={},subtitleTimer,loadVersion=0;
 const live=new Set();
 const levels={music:.32,effects:.72,voice:.94};
 try{const saved=JSON.parse(localStorage.getItem('brew-audio-levels')||'{}');for(const key of Object.keys(levels))if(Number.isFinite(saved[key]))levels[key]=Math.max(0,Math.min(1,saved[key]));}catch{}
 let musicGain,music=null,musicOffset=0,musicStarted=0;
 function mix(){if(!ac)return;const talking=voice&&levels.voice>0;effects.gain.setTargetAtTime(levels.effects*(talking?.42:1),ac.currentTime,.1);voiceGain.gain.setTargetAtTime(levels.voice,ac.currentTime,.1);musicGain.gain.setTargetAtTime(levels.music*(talking?.35:1),ac.currentTime,.18);}
 function setVolume(channel,value){if(!(channel in levels)||!Number.isFinite(Number(value)))return;levels[channel]=Math.max(0,Math.min(1,Number(value)));mix();try{localStorage.setItem('brew-audio-levels',JSON.stringify(levels));}catch{}}
 function musicOn(){if(!active||!enabled||music||!buffers.music)return;music=sample('music',{loop:true,offset:musicOffset,channel:musicGain});musicStarted=ac.currentTime;}
 function musicOff(){if(music){musicOffset=(musicOffset+ac.currentTime-musicStarted)%buffers.music.duration;stop(music);music=null;}}

 const subtitle=()=>document.querySelector('#subtitle');
 function init(){if(ac)return;ac=new(window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=enabled?1:0;master.connect(ac.destination);effects=ac.createGain();effects.gain.value=.72;effects.connect(master);voiceGain=ac.createGain();voiceGain.gain.value=.94;voiceGain.connect(master);musicGain=ac.createGain();musicGain.connect(master);mix();}
 async function load(){if(loading)return loading;const version=++loadVersion;loading=(async()=>{const entries=Object.entries(files);for(let i=0;i<lines.length;i++)entries.push(['voice'+i,`voice/${String(i+1).padStart(2,'0')}.mp3`]);await Promise.all(entries.map(async([id,path])=>{try{let r=await fetch('assets/audio/'+path);if(!r.ok)throw Error(r.status);const data=await r.arrayBuffer();const b=await ac.decodeAudioData(data);if(version===loadVersion)buffers[id]=b;}catch(err){console.warn('Audio unavailable:',path,err.message);}}));})();return loading;}
 function sample(id,{volume=1,rate=1,pan=0,offset=0,duration,loop=false,channel=effects}={}){if(!ac||!enabled||!buffers[id])return null;const b=buffers[id];const s=ac.createBufferSource(),g=ac.createGain();s.buffer=b;s.playbackRate.value=rate;s.loop=loop;g.gain.value=volume;s.connect(g);if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);p.connect(channel);}else g.connect(channel);const entry={s,g};live.add(entry);s.onended=()=>live.delete(entry);const start=Math.min(offset,b.duration-.01);if(duration&&!loop){const len=Math.min(duration,b.duration-start);g.gain.setValueAtTime(volume,ac.currentTime);g.gain.setValueAtTime(volume,ac.currentTime+Math.max(0,len/rate-.025));g.gain.linearRampToValueAtTime(0,ac.currentTime+len/rate);s.start(0,start,len);}else s.start(0,start);return entry;}
 function stop(entry){if(!entry)return;try{entry.s.stop();}catch{}live.delete(entry);}
 function ambientOn(){musicOn();if(!active||!enabled||ambient)return;ambient=sample('steam',{loop:true,volume:.022,rate:.6});}
 async function resume(){init();active=true;await ac.resume();await load();if(active)ambientOn();}
 function clearVoice(){stop(voice);voice=null;voiceUntil=0;clearTimeout(subtitleTimer);if(subtitle())subtitle().hidden=true;mix();}
 function pause(){active=false;musicOff();stop(ambient);ambient=null;stop(walking);walking=null;clearVoice();for(const entry of [...live])stop(entry);}
 function reset(){pause();musicOffset=0;nextVoice=0;walkTime=0;nextWalk=13;lastLine={};foamAt=-1;stepAt=-1;}
 function setEnabled(value){enabled=value;if(!ac){if(value)init();return;}master.gain.setTargetAtTime(value?1:0,ac.currentTime,.03);if(!value){musicOff();clearVoice();stop(ambient);ambient=null;}else{ac.resume();load().then(ambientOn);}}
 function say(event,force=false){if(!enabled||!ac)return false;const now=ac.currentTime;if(!force&&(now<voiceUntil||now<nextVoice))return false;let candidates=lines.map((l,i)=>l[0]===event?i:-1).filter(i=>i>=0&&buffers['voice'+i]);if(!candidates.length)return false;if(candidates.length>1)candidates=candidates.filter(i=>i!==lastLine[event]);let id=candidates[Math.floor(Math.random()*candidates.length)];clearVoice();lastLine[event]=id;const duration=buffers['voice'+id].duration;voice=sample('voice'+id,{channel:voiceGain});voiceUntil=now+duration;nextVoice=voiceUntil+(event==='walk'?12:5);mix();const el=subtitle();if(el){el.textContent='Аркадий: '+lines[id][1];el.hidden=false;}subtitleTimer=setTimeout(()=>{if(el)el.hidden=true;voice=null;mix();},duration*1000);return true;}
 function shot(type){if(!active||!ac)return;const now=ac.currentTime;if(type==='bottle')sample('can',{volume:.28,rate:.7,offset:.05,duration:.2});if(type==='can')sample('can',{volume:.6,duration:.7});if(type==='cork')sample('can',{volume:.34,rate:1.9,offset:.05,duration:.16});if(type==='foam'&&now-foamAt>.23){sample('steam',{volume:.4,rate:1.1,offset:1,duration:.36});foamAt=now;}}
 function impact(type,distance=1,pan=0){const volume=Math.max(.06,1/(1+distance*.35));if(type==='bottle')sample('glass',{volume:volume*.62,pan,rate:.92+Math.random()*.16});if(type==='can'){sample('glass',{volume:volume*.6,rate:.48,pan,duration:1});sample('steam',{volume:volume*.5,rate:.6,pan,duration:.65});}}
 function update(dt,moving,sprinting){if(!active||!ac)return;ambientOn();if(moving){walkTime+=dt;const now=ac.currentTime;if(now-stepAt>(sprinting?.3:.44)){sample('steps',{volume:.28,offset:.28,duration:.25,rate:sprinting?1.18:1,pan:Math.sin(now*5)*.14});stepAt=now;}if(walkTime>nextWalk&&say('walk'))nextWalk=walkTime+22;}}
 function hit(){sample('steps',{volume:.5,offset:.28,duration:.18,rate:.55});}
 function kill(){sample('can',{volume:.22,rate:.5,offset:.3,duration:.35});}
 return{resume,pause,reset,setEnabled,setVolume,get volumes(){return {...levels};},say,shot,impact,update,hit,kill,lines,get enabled(){return enabled;},get loaded(){return Object.keys(buffers);}};
})();
