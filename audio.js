'use strict';
// One mixer for positional effects, ambience and Arkady's voice. No overlapping dialogue.
const GameAudio=(()=>{
 const files={glass:'sfx/glass.mp3',can:'sfx/can-open.mp3',steps:'sfx/footsteps.mp3',steam:'sfx/steam.mp3',music:'music/arkady-hunting.mp3',monsterLarge:'sfx/monster-large.mp3',monsterSmall:'sfx/monster-small.mp3',monsterCan:'sfx/monster-can.mp3',forklift:'sfx/forklift-engine.mp3',forkliftBeep:'sfx/forklift-beep.mp3',forkliftCrash:'sfx/forklift-crash.mp3',kiss:'sfx/kiss.mp3'};
 const lines=AUDIO_VOICES;
 let ac,master,effects,voiceGain,buffers={},pending={},enabled=true,active=false,voice=null,ambient=null,voiceUntil=0,nextVoice=0,walkTime=0,nextWalk=13,foamAt=-1,stepAt=-1,lastLine={},subtitleTimer;
 const live=new Set();let level=0,monsterAt=-10,vehicleAt={};
 function setLevel(index){level=index;}
 const levels={music:.32,effects:.72,voice:.94};
 try{const saved=JSON.parse(localStorage.getItem('brew-audio-levels')||'{}');for(const key of Object.keys(levels))if(Number.isFinite(saved[key]))levels[key]=Math.max(0,Math.min(1,saved[key]));}catch{}
 let musicGain,music=null,musicOffset=0,musicStarted=0;
 function mix(){if(!ac)return;const talking=voice&&levels.voice>0;effects.gain.setTargetAtTime(levels.effects*(talking?.42:1),ac.currentTime,.1);voiceGain.gain.setTargetAtTime(levels.voice,ac.currentTime,.1);musicGain.gain.setTargetAtTime(levels.music*(talking?.35:1),ac.currentTime,.18);}
 function setVolume(channel,value){if(!(channel in levels)||!Number.isFinite(Number(value)))return;levels[channel]=Math.max(0,Math.min(1,Number(value)));mix();try{localStorage.setItem('brew-audio-levels',JSON.stringify(levels));}catch{}}
 function musicOn(){if(!active||!enabled||music||!buffers.music)return;music=sample('music',{loop:true,offset:musicOffset,channel:musicGain});musicStarted=ac.currentTime;}
 function musicOff(){if(music){musicOffset=(musicOffset+ac.currentTime-musicStarted)%buffers.music.duration;stop(music);music=null;}}

 const subtitle=()=>document.querySelector('#subtitle');
 function init(){if(ac)return;ac=new(window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=enabled?1:0;master.connect(ac.destination);effects=ac.createGain();effects.gain.value=.72;effects.connect(master);voiceGain=ac.createGain();voiceGain.gain.value=.94;voiceGain.connect(master);musicGain=ac.createGain();musicGain.connect(master);mix();}
 async function loadOne(id,path){
  if(buffers[id])return true;if(pending[id])return pending[id];
  pending[id]=(async()=>{try{const response=await fetch('assets/audio/'+path);if(!response.ok)throw Error(response.status);buffers[id]=await ac.decodeAudioData(await response.arrayBuffer());return true;}catch(err){console.warn('Audio unavailable:',path,err.message);delete pending[id];return false;}})();
  return pending[id];
 }
 function loadEffects(){for(const [id,path] of Object.entries(files))loadOne(id,path).then(()=>{if(active&&(id==='music'||id==='steam'||id==='forklift'))ambientOn();});}
 function loadLevelVoices(index){const events=new Set(AUDIO_LEVEL_EVENTS[index]||AUDIO_LEVEL_EVENTS[0]);return Promise.all(lines.filter(line=>events.has(line.event)).map((line,i)=>loadOne('voice-'+line.file,`voice/${line.file}`)));}
 function sample(id,{volume=1,rate=1,pan=0,offset=0,duration,loop=false,channel=effects}={}){if(!ac||!enabled||!buffers[id])return null;const b=buffers[id];const s=ac.createBufferSource(),g=ac.createGain();s.buffer=b;s.playbackRate.value=rate;s.loop=loop;g.gain.value=volume;s.connect(g);if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);p.connect(channel);}else g.connect(channel);const entry={s,g};live.add(entry);s.onended=()=>live.delete(entry);const start=Math.min(offset,b.duration-.01);if(duration&&!loop){const len=Math.min(duration,b.duration-start);g.gain.setValueAtTime(volume,ac.currentTime);g.gain.setValueAtTime(volume,ac.currentTime+Math.max(0,len/rate-.025));g.gain.linearRampToValueAtTime(0,ac.currentTime+len/rate);s.start(0,start,len);}else s.start(0,start);return entry;}
 function stop(entry){if(!entry)return;try{entry.s.stop();}catch{}live.delete(entry);}
 function ambientOn(){musicOn();if(!active||!enabled||ambient)return;ambient=level===2?sample('forklift',{loop:true,volume:.045,rate:.65,offset:4}):sample('steam',{loop:true,volume:level===3?.032:.022,rate:level===3?.48:.6});}
 async function resume(){init();active=true;await ac.resume();loadEffects();await loadLevelVoices(level);if(active)ambientOn();}
 function clearVoice(){stop(voice);voice=null;voiceUntil=0;clearTimeout(subtitleTimer);if(subtitle())subtitle().hidden=true;mix();}
 function pause(){active=false;musicOff();stop(ambient);ambient=null;clearVoice();for(const entry of [...live])stop(entry);}
 function reset(){pause();musicOffset=0;nextVoice=0;walkTime=0;nextWalk=13;monsterAt=-10;vehicleAt={};lastLine={};foamAt=-1;stepAt=-1;}
 function setEnabled(value){enabled=value;if(!ac){if(value)init();return;}master.gain.setTargetAtTime(value?1:0,ac.currentTime,.03);if(!value){musicOff();clearVoice();stop(ambient);ambient=null;for(const entry of [...live])stop(entry);}else{ac.resume();loadEffects();loadLevelVoices(level).then(ambientOn);}}
 function say(event,force=false){if(!enabled||!ac)return false;const now=ac.currentTime;if(!force&&(now<voiceUntil||now<nextVoice))return false;let candidates=lines.filter(line=>line.event===event&&buffers['voice-'+line.file]);if(!candidates.length)return false;if(candidates.length>1)candidates=candidates.filter(line=>line.file!==lastLine[event]);const line=candidates[Math.floor(Math.random()*candidates.length)],id='voice-'+line.file;clearVoice();lastLine[event]=line.file;const duration=buffers[id].duration;voice=sample(id,{channel:voiceGain});voiceUntil=now+duration;nextVoice=voiceUntil+(event.endsWith('walk')?12:5);mix();const el=subtitle();if(el){el.textContent=(line.speaker||'Аркадий')+': '+line.text;el.hidden=false;}subtitleTimer=setTimeout(()=>{if(el)el.hidden=true;voice=null;mix();},duration*1000);return true;}
 function shot(type){if(!active||!ac)return;const now=ac.currentTime;if(type==='bottle')sample('can',{volume:.28,rate:.7,offset:.05,duration:.2});if(type==='can')sample('can',{volume:.6,duration:.7});if(type==='cork')sample('can',{volume:.34,rate:1.9,offset:.05,duration:.16});if(type==='foam'&&now-foamAt>.23){sample('steam',{volume:.4,rate:1.1,offset:1,duration:.36});foamAt=now;}}
 function impact(type,distance=1,pan=0){const volume=Math.max(.06,1/(1+distance*.35));if(type==='bottle')sample('glass',{volume:volume*.62,pan,rate:.92+Math.random()*.16});if(type==='can'){sample('glass',{volume:volume*.6,rate:.48,pan,duration:1});sample('steam',{volume:volume*.5,rate:.6,pan,duration:.65});}}
 function update(dt,moving,sprinting){if(!active||!ac)return;ambientOn();if(moving){walkTime+=dt;const now=ac.currentTime;if(now-stepAt>(sprinting?.3:.44)){sample('steps',{volume:.28,offset:.28,duration:.25,rate:sprinting?1.18:1,pan:Math.sin(now*5)*.14});stepAt=now;}const event=AUDIO_LEVEL_EVENTS[level]?.find(name=>name.endsWith('walk'))||'walk';if(walkTime>nextWalk&&say(event))nextWalk=walkTime+22;}}
 function monster(type,distance=1,pan=0,attack=false){
  if(!active||!ac||ac.currentTime-monsterAt<(attack?.6:1.6))return;
  monsterAt=ac.currentTime;const id=type===5||type===10||type===1||type===12?'monsterLarge':type===3?'monsterCan':'monsterSmall';
  sample(id,{volume:(attack?.72:.45)/(1+distance*.17),pan,rate:(type===12?.55:type===11?1.15:type===10?.72:type===8?1.36:type===9?.86:type===5?.85:type===4?1.2:1)*( .94+Math.random()*.12)});
 }
 function vehicle(event,distance=1,pan=0){
  if(!active||!ac)return;const now=ac.currentTime;
  if(now-(vehicleAt[event]??-10)<(event==='warn'?.22:.35))return;vehicleAt[event]=now;
  const volume=1/(1+distance*.16);
  if(event==='warn')sample('forkliftBeep',{volume:volume*.8,pan,duration:.85});
  if(event==='charge')sample('forklift',{volume:volume*.75,pan,rate:1.35,offset:3,duration:1.3});
  if(event==='crash')sample('forkliftCrash',{volume:volume*.75,pan});
  if(event==='radio')sample('steam',{volume:.18,rate:1.8,offset:2,duration:.35});
 }
 // Synthesised one-shots (no assets): oscillators and filtered noise through the effects bus, so volume and mute apply.
 let noiseBuffer=null;const synthAt={},SYNTH_GAP={hitmarker:.04,splat:.06,stagger:.08,combo:.12,spit:.1};
 function noise(){if(!noiseBuffer){const n=Math.floor(ac.sampleRate*.8);noiseBuffer=ac.createBuffer(1,n,ac.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<n;i++)data[i]=Math.random()*2-1;}return noiseBuffer;}
 function track(node,end){const entry={s:node};live.add(entry);node.onended=()=>live.delete(entry);node.start(end[0]);node.stop(end[1]);}
 function envelope(g,t,attack,peak,length){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+length);}
 function tone(out,type,from,to,t,length,peak,attack=.004){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(from,t);if(to!==from)o.frequency.exponentialRampToValueAtTime(to,t+length);envelope(g,t,attack,peak,length);o.connect(g);g.connect(out);track(o,[t,t+length+.05]);return o;}
 function hiss(out,kind,from,to,q,t,length,peak,attack=.004){const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise();f.type=kind;f.frequency.setValueAtTime(from,t);if(to!==from)f.frequency.exponentialRampToValueAtTime(to,t+length);f.Q.value=q;envelope(g,t,attack,peak,length);s.connect(f);f.connect(g);g.connect(out);track(s,[t,t+length+.05]);}
 const voices={
  spit:(o,t)=>{hiss(o,'bandpass',300,1400,6,t,.42,.35,.3);tone(o,'sine',90,160,t,.4,.12,.3);hiss(o,'bandpass',2200,500,2,t+.44,.16,.8);tone(o,'triangle',520,140,t+.44,.12,.35);},
  splat:(o,t)=>{hiss(o,'lowpass',1400,300,1,t,.22,.75);tone(o,'sine',160,55,t,.18,.5);hiss(o,'bandpass',3000,1500,3,t+.03,.08,.2);},
  bossRoar:(o,t)=>{const v=tone(o,'sawtooth',78,46,t,1.25,.32,.09),lfo=ac.createOscillator(),depth=ac.createGain();lfo.frequency.value=7;depth.gain.value=9;lfo.connect(depth);depth.connect(v.frequency);track(lfo,[t,t+1.3]);tone(o,'square',117,70,t+.05,1.1,.1,.12);hiss(o,'bandpass',420,180,3,t,1.2,.4,.15);},
  bossStomp:(o,t)=>{tone(o,'sine',95,28,t,.55,.95,.003);hiss(o,'lowpass',500,90,1,t,.4,.8);hiss(o,'bandpass',1800,600,1.5,t+.02,.15,.18);},
  secret:(o,t)=>{[523,659,784,1047].forEach((f,i)=>tone(o,'triangle',f,f,t+i*.075,.32,.22));tone(o,'sine',2093,2093,t+.3,.4,.06);},
  combo:(o,t)=>{tone(o,'square',880,880,t,.07,.09);tone(o,'square',1320,1320,t+.06,.1,.09);},
  upgrade:(o,t)=>{tone(o,'triangle',300,900,t,.42,.22,.02);[784,988,1175].forEach((f,i)=>tone(o,'sine',f,f,t+.2+i*.07,.35,.12));},
  hitmarker:(o,t)=>{tone(o,'triangle',1900,1500,t,.045,.16,.001);},
  stagger:(o,t)=>{tone(o,'sine',430,170,t,.14,.4,.002);hiss(o,'bandpass',900,400,4,t,.09,.25);}
 };
 function synth(name,{pan=0,volume=1,distance=0}={}){
  if(!ac||!enabled||!active||!voices[name])return false;const now=ac.currentTime;
  if(now-(synthAt[name]??-1)<(SYNTH_GAP[name]??.03))return false;synthAt[name]=now;
  const out=ac.createGain();out.gain.value=.8*Math.max(0,volume)/(1+Math.max(0,distance)*.18);
  if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));out.connect(p);p.connect(effects);}else out.connect(effects);
  voices[name](out,now);return true;
 }
 function hit(){sample('steps',{volume:.5,offset:.28,duration:.18,rate:.55});}
 function kill(){sample('can',{volume:.22,rate:.5,offset:.3,duration:.35});}
 function kiss(){sample('kiss',{volume:.9});}
 function voiceSeconds(){return ac?Math.max(0,voiceUntil-ac.currentTime):0;}
 return{resume,pause,reset,setLevel,monster,vehicle,synth,setEnabled,setVolume,get volumes(){return {...levels};},say,shot,impact,update,hit,kill,kiss,voiceSeconds,lines,get enabled(){return enabled;},get loaded(){return Object.keys(buffers);}};
})();
