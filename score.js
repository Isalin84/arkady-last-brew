'use strict';
const GameScore=(()=>{
 const STORAGE_KEY='arkady-last-brew-scores-v1',MAX_RECORDS=7;
 let run,checkpoint,finalResult;
 const fresh=()=>({score:0,kills:0,pickups:0,damage:0,deaths:0,shots:0,seconds:0});
 function begin(){run=fresh();checkpoint={score:0,kills:0,pickups:0,damage:0,shots:0};finalResult=null;return snapshot();}
 function snapshot(){return {...run};}
 function checkpointLevel(){checkpoint={score:run.score,kills:run.kills,pickups:run.pickups,damage:run.damage,shots:run.shots};}
 function retryLevel(){run.deaths++;run.score=checkpoint.score;run.kills=checkpoint.kills;run.pickups=checkpoint.pickups;run.damage=checkpoint.damage;run.shots=checkpoint.shots;}
 function tick(dt){if(run)run.seconds+=Math.max(0,dt);}
 function shot(){if(run)run.shots++;}
 function kill(type,hp){if(!run)return 0;const gained=100+Math.round(hp*.55)+(type>=6?125:0);run.kills++;run.score+=gained;return gained;}
 function pickup(){if(!run)return;run.pickups++;run.score+=25;}
 function hurt(amount){if(!run)return;const taken=Math.max(0,Math.round(amount));run.damage+=taken;run.score=Math.max(0,run.score-taken*2);}
 function formatTime(seconds){const total=Math.max(0,Math.round(seconds)),minutes=Math.floor(total/60);return `${minutes}:${String(total%60).padStart(2,'0')}`;}
 function readRecords(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(!Array.isArray(value))return[];return value.filter(r=>Number.isFinite(Number(r?.score))).map(r=>({id:String(r.id||''),score:Math.max(0,Math.round(Number(r.score))),date:String(r.date||''),time:Math.max(0,Math.round(Number(r.time)||0)),health:Math.max(0,Math.min(100,Math.round(Number(r.health)||0))),kills:Math.max(0,Math.round(Number(r.kills)||0)),deaths:Math.max(0,Math.round(Number(r.deaths)||0))})).slice(0,MAX_RECORDS);}catch{return [];}}
 function writeRecords(records){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(records));}catch{}}
 function finish(health){
  if(finalResult)return finalResult;
  const healthBonus=Math.max(0,Math.round(health))*12;
  const timeBonus=Math.max(0,4000-Math.round(run.seconds*4));
  const clearBonus=2000;
  run.score+=healthBonus+timeBonus+clearBonus;
  const id=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const record={id,score:Math.max(0,Math.round(run.score-run.deaths*250)),date:new Date().toISOString(),time:Math.round(run.seconds),health:Math.max(0,Math.round(health)),kills:run.kills,deaths:run.deaths};
  const records=[...readRecords(),record].sort((a,b)=>b.score-a.score||a.time-b.time).slice(0,MAX_RECORDS);
  writeRecords(records);finalResult={...record,healthBonus,timeBonus,clearBonus,records,rank:records.findIndex(r=>r.id===id)+1};return finalResult;
 }
 begin();
 return{begin,checkpoint:checkpointLevel,retryLevel,tick,shot,kill,pickup,hurt,finish,records:readRecords,formatTime,get current(){return Math.max(0,run.score-run.deaths*250);},get stats(){return snapshot();}};
})();
