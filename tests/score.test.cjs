const {readFileSync}=require('node:fs');
const vm=require('node:vm'),assert=require('node:assert/strict');
const storage=new Map(),localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))};
const sandbox={localStorage,Date,Math};vm.createContext(sandbox);vm.runInContext(readFileSync('score.js','utf8'),sandbox);const score=vm.runInContext('GameScore',sandbox);

score.begin();score.kill(0,75);score.pickup();score.hurt(10);score.tick(30);score.checkpoint();const checkpointScore=score.current;
score.kill(7,390);assert.ok(score.current>checkpointScore);score.retryLevel();assert.equal(score.stats.kills,1,'Retry restores kills at level entry');assert.equal(score.current,Math.max(0,checkpointScore-250),'Death penalty is applied once');
score.tick(90);score.kill(10,310);const result=score.finish(64);assert.ok(result.score>0);assert.equal(result.healthBonus,768);assert.equal(result.clearBonus,2000);assert.equal(result.timeBonus,3520);assert.equal(result.rank,1);assert.equal(score.records().length,1);
assert.equal(score.finish(1).id,result.id,'Finalization is idempotent');assert.equal(score.formatTime(125),'2:05');

for(let i=0;i<9;i++){score.begin();score.kill(i%3,50+i*10);score.tick(20+i);score.finish(100-i);}
const records=score.records();assert.equal(records.length,7);assert.equal(records.map(r=>r.score).join(','),Array.from(records,r=>r.score).sort((a,b)=>b-a).join(','));
console.log('PASS: scoring, checkpoint rollback, death penalty, bonuses and seven local records');
// Combo math, medals and flat bonuses on the bare score module (no game loaded).
score.begin();assert.equal(score.kill(0,75),141);assert.equal(score.kill(0,75),282,'Second kill inside 3 s is x2');score.tick(3.1);assert.equal(score.combo.mult,1);assert.equal(score.kill(0,75),141);score.hurt(1);assert.equal(score.combo.mult,1);score.bonus(500);score.secret();assert.equal(score.stats.secrets,1);assert.equal(score.stats.bestCombo,2);
assert.equal(score.levelResult({level:0,time:90,damage:0,secretsFound:1,secretsTotal:1,par:100}).medal,'gold');assert.equal(score.levelResult({time:101,damage:0,secretsFound:1,secretsTotal:1,par:100}).medal,'silver');assert.equal(score.levelResult({time:500,damage:60,secretsFound:0,secretsTotal:2,par:100}).medal,'bronze');
// Voluntary restart rolls back like a death but without the penalty; uncounted kills (boss, adds) score without counting.
score.begin();score.kill(0,75);score.checkpoint();const before=score.current;score.kill(0,75);score.restartLevel();assert.equal(score.stats.deaths,0,'Restart is not a death');assert.equal(score.current,before);assert.equal(score.stats.kills,1);
assert.equal(score.kill(12,2400,{counted:false})>0,true);assert.equal(score.stats.kills,1,'Boss kill is not counted');assert.equal(score.finish(50).veteranNew,false,'Veteran was already unlocked by an earlier win');
console.log('PASS: combo math, medal thresholds, restart without death, uncounted kills');
