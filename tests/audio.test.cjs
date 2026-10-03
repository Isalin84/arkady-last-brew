const vm=require('node:vm'),assert=require('node:assert/strict'),fs=require('node:fs');
const played=[],nodes=[],timers=new Map();let timer=0;
const param=()=>({value:0,setTargetAtTime(v){this.value=v},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},exponentialRampToValueAtTime(v){this.value=v}});
class AudioContext{
 constructor(){this.currentTime=0;this.destination={};AudioContext.instance=this;}
 createGain(){return{gain:param(),connect(to){this.to=to}}}
 createMediaElementSource(el){return{connect(g){el.gain=g}}}
 createStereoPanner(){return{pan:param(),connect(){}}}
 createBufferSource(){const s={playbackRate:param(),connect(){},start(...args){played.push({node:this,args});},stop(){this.stopped=true;this.onended?.()}};nodes.push(s);return s;}
 createOscillator(){const o={frequency:param(),connect(){},start(){},stop(){this.stopped=true;}};nodes.push(o);return o;}
 createBiquadFilter(){return{frequency:param(),Q:param(),connect(){}}}
 createBuffer(c,n){return{getChannelData:()=>new Float32Array(n)}}
 get sampleRate(){return 8000}
 async resume(){}
 async decodeAudioData(data){return{duration:2,data}}
}
// Streaming music elements: play() resolves unless autoplay is blocked; canPlayType answers per sandbox.
const audios=[];class Audio{constructor(){Object.assign(this,{paused:true,ended:false,readyState:0,t:0,duration:240,loop:false,preload:'',src:'',listeners:{}});audios.push(this);}get currentTime(){return this.t}set currentTime(v){this.t=v;if(v<this.duration)this.ended=false;}canPlayType(type){return /webm/.test(type)?Audio.support:'maybe'}addEventListener(n,f){(this.listeners[n]||=[]).push(f)}play(){if(Audio.block)return Promise.reject(new Error('NotAllowedError'));this.paused=false;this.ended=false;this.readyState=4;return Promise.resolve()}pause(){this.paused=true}}Audio.support='probably';
const el={hidden:true,textContent:''},failOnce=new Set(),testConsole={...console,warn(){}};const sandbox={Audio,window:{AudioContext},document:{querySelector:()=>el},fetch:async p=>{assert.ok(fs.existsSync(p),'Missing audio '+p);if(failOnce.delete(p))return{ok:false,status:503};return{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}},console:testConsole,setTimeout:fn=>{timers.set(++timer,fn);return timer},clearTimeout:id=>timers.delete(id)};
vm.createContext(sandbox);for(const file of ['audio-manifest.js','audio.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox);
(async()=>{
 const api=vm.runInContext('GameAudio',sandbox);failOnce.add('assets/audio/sfx/kiss.mp3');await api.resume();await new Promise(setImmediate);assert.ok(api.loaded.includes('voice-01.mp3'));assert.ok(!api.loaded.includes('voice-31.mp3'),'Later chapters are lazy-loaded');assert.ok(!api.loaded.includes('kiss'),'Failed assets are not marked as loaded');assert.equal(new Set(api.lines.map(line=>line.file)).size,api.lines.length,'Every spoken line has an explicit unique file');api.pause();await api.resume();await new Promise(setImmediate);assert.ok(api.loaded.includes('kiss'),'A later resume retries transient failures');
 api.setVolume('music',.15);api.setVolume('effects',0);api.setVolume('voice',.65);assert.equal(api.volumes.music,.15);assert.equal(api.volumes.effects,0);assert.equal(api.volumes.voice,.65);api.setVolume('music',2);assert.equal(api.volumes.music,1);api.setVolume('music',.32);assert.equal(api.say('start'),true);assert.ok(el.textContent.includes('ночная смена'));assert.equal(api.say('hurt'),false,'Voice must not overlap');
 assert.ok(played.some(p=>p.node.loop&&p.node.buffer));api.shot('cork');assert.ok(played.length>=3);api.pause();assert.equal(el.hidden,true);assert.ok(nodes.every(n=>n.stopped),'Pause stops every active source');
 await api.resume();api.setEnabled(false);const count=played.length;assert.equal(api.say('hurt',true),false);api.shot('can');assert.equal(played.length,count,'Mute must silence all channels');
 api.setEnabled(true);assert.equal(api.say('hurt',true),true);let first=el.textContent;AudioContext.instance.currentTime=20;assert.equal(api.say('hurt'),true);assert.notEqual(el.textContent,first,'Avoid immediate repeat');
 api.reset();await api.resume();api.update(14,true,false);assert.ok(el.textContent.includes('Аркадий:'));api.pause();
 api.reset();api.setLevel(1);await api.resume();api.update(14,true,false);assert.ok(/конвейере|брак с характером/.test(el.textContent),'Packaging walking dialogue');
 api.pause();const before=played.length;api.monster(5,1,0,true);assert.equal(played.length,before,'No monster sound while paused');await api.resume();api.monster(5,1,0,true);assert.ok(played.length>before);const attacks=played.length;api.monster(4,1,0,true);assert.equal(played.length,attacks,'Attack sound rate limit');AudioContext.instance.currentTime+=1;api.monster(3,1,0,true);assert.equal(played.length,attacks+1);api.pause();
 api.reset();api.setLevel(2);await api.resume();api.update(14,true,false);assert.ok(/разметке|погрузчик|Начальник склада/.test(el.textContent),'Warehouse walking dialogue');
 assert.ok(!api.lines.filter(line=>Number(line.file.slice(0,2))<44).some(line=>/Нин[аы]|Стелл/.test(line.text)),'Rescue identity stays secret before level four');
 api.vehicle('warn',1,0);const warns=played.length;api.vehicle('warn',1,0);assert.equal(played.length,warns,'Vehicle warning rate limit');AudioContext.instance.currentTime+=1;api.vehicle('charge',1,0);assert.equal(played.length,warns+1);api.vehicle('crash',1,0);assert.equal(played.length,warns+2);api.pause();const paused=played.length;api.vehicle('warn');assert.equal(played.length,paused);assert.ok(nodes.every(n=>n.stopped),'Pause stops vehicle sounds too');
 api.reset();api.setLevel(3);await api.resume();api.update(14,true,false);assert.ok(/Солод любит|Нория|Запах солода/.test(el.textContent),'Malt house walking dialogue');api.pause();await api.resume();assert.equal(api.say('stellathanks',true),true);assert.ok(el.textContent.startsWith('Стелла:'),'Stella has her own subtitle speaker');const beforeKiss=played.length;api.kiss();assert.equal(played.length,beforeKiss+1,'Finale kiss uses its own effect');
 // UI one-shots (upgrade jingle) play on overlays while the game is paused, but stay silent when muted.
 api.pause();AudioContext.instance.currentTime+=5;assert.equal(api.synth('upgrade'),true,'Synth works while paused');api.setEnabled(false);AudioContext.instance.currentTime+=5;assert.equal(api.synth('upgrade'),false,'Muted synth is silent');api.setEnabled(true);
 // ---- streamed music ----
 const flush=()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}};
 const track=name=>{const e=api.musicElement(name);assert.ok(e,'music element '+name);return e;},playing=name=>api.musicElement(name)&&!api.musicElement(name).paused;
 assert.equal(api.track,null,'No music before the first gesture');
 api.music('menu');assert.equal(api.track,'menu');assert.ok(playing('menu'),'First gesture starts the menu track');assert.match(track('menu').src,/music\/menu-arkady-is-back\.webm$/);assert.equal(track('menu').loop,true);assert.equal(track('menu').preload,'auto');assert.equal(track('menu').gain.gain.value,.81,'Loudness-matched menu gain');
 assert.equal(track('game').preload,'metadata','Game track header is prefetched under the menu');assert.equal(track('game').paused,true);
 const musicBus=track('menu').gain.to;assert.equal(track('game').gain.to,musicBus,'Every track feeds the music bus');
 api.music('game');assert.ok(playing('game'),'Start switches to the game track');assert.equal(track('game').preload,'auto');assert.equal(track('game').gain.gain.value,1);assert.equal(track('menu').gain.gain.value,0,'Menu fades out');assert.ok(playing('menu'),'Crossfade: the old track plays out its fade');flush();assert.equal(track('menu').paused,true,'Faded track stops');
 track('game').currentTime=42;track('menu').currentTime=10;api.pause();api.music('menu');assert.ok(playing('menu'),'Pause plays the menu track');assert.equal(track('menu').currentTime,10,'Menu continues across repeated pauses');flush();assert.equal(track('game').paused,true);
 api.music('game');assert.ok(playing('game'));assert.equal(track('game').currentTime,42,'Resume keeps the game track position');flush();assert.equal(track('menu').paused,true);
 api.reset();api.music('game');assert.equal(track('game').currentTime,0,'A new shift restarts the game track');
 api.music('victory');assert.ok(playing('victory'),'Win plays the victory track');assert.equal(track('victory').loop,false,'Victory plays once');assert.equal(track('victory').gain.gain.value,.85);assert.match(track('victory').src,/victory-arkady\.webm$/);flush();assert.equal(track('game').paused,true);
 track('victory').currentTime=149;Object.assign(track('victory'),{paused:true,ended:true});api.music('victory');assert.equal(track('victory').paused,true,'An ended one-shot stays silent');
 api.music('game');track('game').currentTime=30;api.music('defeat');assert.ok(playing('defeat'),'Death plays the defeat track');assert.equal(track('defeat').loop,false);assert.equal(track('defeat').gain.gain.value,.89);flush();
 api.music('victory');assert.equal(track('victory').currentTime,0,'A new win replays the victory track from the start');assert.ok(playing('victory'));flush();assert.equal(track('defeat').paused,true);
 for(const e of audios.filter(a=>a.src))assert.ok(fs.existsSync(e.src),'Missing music '+e.src);
 // mute, volume, ducking
 api.music('menu');api.setEnabled(false);assert.ok(audios.every(a=>a.paused),'Mute pauses every music track');api.music('game');assert.equal(api.track,'game');assert.equal(track('game').paused,true,'Muted music stays silent');
 api.setEnabled(true);assert.ok(playing('game'),'Unmute resumes the current track');flush();assert.ok(!playing('menu'));
 api.setVolume('music',.5);assert.equal(musicBus.gain.value,.5,'Music slider drives the music bus');AudioContext.instance.currentTime+=30;assert.equal(api.say('pickup',true),true);assert.ok(Math.abs(musicBus.gain.value-.5*.35)<1e-9,'Speech ducks the music');api.pause();api.setVolume('music',.32);
 // autoplay refusal is quiet and the next gesture retries
 Audio.block=true;api.music(null);flush();api.music('menu');await new Promise(setImmediate);assert.equal(track('menu').paused,true);Audio.block=false;api.music('menu');assert.ok(playing('menu'),'A later gesture retries a refused play()');
 // a webm the browser cannot decode falls back to m4a
 track('menu').listeners.error.forEach(f=>f());assert.match(track('menu').src,/menu-arkady-is-back\.m4a$/);assert.ok(playing('menu'));
 // effects and speech load only after the current track can play (or a 1.5 s cap)
 api.music('defeat');api.pause();const waiting=track('defeat');waiting.readyState=1;api.reset();let resumed=false;api.resume().then(()=>resumed=true);await new Promise(setImmediate);assert.equal(resumed,false,'Clips wait for the music to start');waiting.readyState=4;waiting.listeners.canplay.at(-1)();await new Promise(setImmediate);await new Promise(setImmediate);assert.equal(resumed,true,'canplay releases the clip loading');api.pause();
 api.music(null);assert.equal(api.track,null);flush();assert.ok(audios.every(a=>a.paused),'music(null) fades everything out');
 assert.ok(!api.loaded.some(id=>/music/.test(id)),'Music is streamed, not decoded into buffers');
 // format choice per browser
 for(const [support,ext] of [['probably','webm'],['maybe','webm'],['','m4a']]){Audio.support=support;const box={Audio,window:{AudioContext},document:{querySelector:()=>el},fetch:sandbox.fetch,console:testConsole,setTimeout:()=>0,clearTimeout(){}};vm.createContext(box);for(const file of ['audio-manifest.js','audio.js'])vm.runInContext(fs.readFileSync(file,'utf8'),box);const other=vm.runInContext('GameAudio',box);other.music('game');assert.ok(other.musicElement('game').src.endsWith('arkady-hunting.'+ext),support+' → '+ext);}
 console.log('PASS: explicit voice manifest, lazy chapter loading, four-level dialogue, Stella speaker and kiss, scheduling, pause and mute; streamed music per state, crossfade, positions, mute, ducking, format fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
