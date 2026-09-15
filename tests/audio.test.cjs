const vm=require('node:vm'),assert=require('node:assert/strict'),fs=require('node:fs');
const played=[],nodes=[],timers=new Map();let timer=0;
const param=()=>({value:0,setTargetAtTime(v){this.value=v},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v}});
class AudioContext{
 constructor(){this.currentTime=0;this.destination={};AudioContext.instance=this;}
 createGain(){return{gain:param(),connect(){}}}
 createStereoPanner(){return{pan:param(),connect(){}}}
 createBufferSource(){const s={playbackRate:param(),connect(){},start(...args){played.push({node:this,args});},stop(){this.stopped=true;this.onended?.()}};nodes.push(s);return s;}
 async resume(){}
 async decodeAudioData(data){return{duration:2,data}}
}
const el={hidden:true,textContent:''};const sandbox={window:{AudioContext},document:{querySelector:()=>el},fetch:async p=>({ok:true,arrayBuffer:async()=>{assert.ok(fs.existsSync(p),'Missing audio '+p);return new ArrayBuffer(8)}}),console,setTimeout:fn=>{timers.set(++timer,fn);return timer},clearTimeout:id=>timers.delete(id)};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('audio.js','utf8'),sandbox);
(async()=>{
 const api=vm.runInContext('GameAudio',sandbox);await api.resume();assert.equal(api.loaded.length,54);
 api.setVolume('music',.15);api.setVolume('effects',0);api.setVolume('voice',.65);assert.equal(api.volumes.music,.15);assert.equal(api.volumes.effects,0);assert.equal(api.volumes.voice,.65);api.setVolume('music',2);assert.equal(api.volumes.music,1);api.setVolume('music',.32);assert.equal(api.say('start'),true);assert.ok(el.textContent.includes('ночная смена'));assert.equal(api.say('hurt'),false,'Voice must not overlap');
 assert.ok(played.some(p=>p.node.loop&&p.node.buffer));api.shot('cork');assert.ok(played.length>=3);api.pause();assert.equal(el.hidden,true);assert.ok(nodes.every(n=>n.stopped),'Pause stops every active source');
 await api.resume();api.setEnabled(false);const count=played.length;assert.equal(api.say('hurt',true),false);api.shot('can');assert.equal(played.length,count,'Mute must silence all channels');
 api.setEnabled(true);assert.equal(api.say('hurt',true),true);let first=el.textContent;AudioContext.instance.currentTime=20;assert.equal(api.say('hurt'),true);assert.notEqual(el.textContent,first,'Avoid immediate repeat');
 api.reset();await api.resume();api.update(14,true,false);assert.ok(el.textContent.includes('Аркадий:'));api.pause();
 api.reset();api.setLevel(1);await api.resume();api.update(14,true,false);assert.ok(/конвейере|брак с характером/.test(el.textContent),'Packaging walking dialogue');
 api.pause();const before=played.length;api.monster(5,1,0,true);assert.equal(played.length,before,'No monster sound while paused');await api.resume();api.monster(5,1,0,true);assert.ok(played.length>before);const attacks=played.length;api.monster(4,1,0,true);assert.equal(played.length,attacks,'Attack sound rate limit');AudioContext.instance.currentTime+=1;api.monster(3,1,0,true);assert.equal(played.length,attacks+1);api.pause();
 api.reset();api.setLevel(2);await api.resume();api.update(14,true,false);assert.ok(/разметке|погрузчик|Начальник склада/.test(el.textContent),'Warehouse walking dialogue');
 assert.ok(!api.lines.some(([,line])=>/Нин[аы]|Стелл/.test(line)),'Rescue identity stays secret');
 api.vehicle('warn',1,0);const warns=played.length;api.vehicle('warn',1,0);assert.equal(played.length,warns,'Vehicle warning rate limit');AudioContext.instance.currentTime+=1;api.vehicle('charge',1,0);assert.equal(played.length,warns+1);api.vehicle('crash',1,0);assert.equal(played.length,warns+2);api.pause();const paused=played.length;api.vehicle('warn');assert.equal(played.length,paused);assert.ok(nodes.every(n=>n.stopped),'Pause stops vehicle sounds too');
 console.log('PASS: 54 audio assets, voice scheduling, no overlap, pause, mute, variation, walking lines');
})().catch(e=>{console.error(e);process.exitCode=1});
