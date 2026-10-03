'use strict';
const GameScore=(()=>{
 const STORAGE_KEY='arkady-last-brew-scores-v1',MEDAL_KEY='arkady-medals-v1',VETERAN_KEY='arkady-veteran-v1',MAX_RECORDS=7,COMBO_WINDOW=3,COMBO_MAX=4,LEVEL_COUNT=4;
 const MEDAL_RANK={bronze:1,silver:2,gold:3},MEDAL_NAME={gold:'Золото',silver:'Серебро',bronze:'Бронза'},MEDAL_STARS={gold:'★★★',silver:'★★☆',bronze:'★☆☆'};
 const DIFFICULTIES=['rookie','normal','veteran'],DIFFICULTY_LABEL={rookie:'Стажёр',normal:'Пивовар',veteran:'Ветеран'},DIFFICULTY_BADGE={rookie:'СТЖ',normal:'',veteran:'ВЕТ'};
 let run,checkpoint,finalResult,combo,levelSeconds,levelDeaths;
 const fresh=difficulty=>({score:0,kills:0,pickups:0,damage:0,deaths:0,shots:0,seconds:0,secrets:0,bestCombo:1,difficulty:DIFFICULTIES.includes(difficulty)?difficulty:'normal',medals:Array(LEVEL_COUNT).fill(null)});
 const scoreMul=()=>typeof DIFFICULTY!=='undefined'?DIFFICULTY[run.difficulty]?.scoreMul??1:1;
 const current=()=>Math.round(Math.max(0,run.score-run.deaths*250)*scoreMul());
 const resetLevelTracking=()=>{combo={mult:1,timer:0};levelSeconds=0;levelDeaths=0;};
 function begin(difficulty){run=fresh(difficulty);checkpoint={score:0,kills:0,pickups:0,damage:0,shots:0,secrets:0};finalResult=null;resetLevelTracking();return snapshot();}
 function snapshot(){return {...run,medals:[...run.medals]};}
 function checkpointLevel(){checkpoint={score:run.score,kills:run.kills,pickups:run.pickups,damage:run.damage,shots:run.shots,secrets:run.secrets};resetLevelTracking();}
 // Back to the level-entry checkpoint. A death counts against the run (-250, medal capped); a voluntary restart does not.
 function rollback(death){if(death)run.deaths++;run.score=checkpoint.score;run.kills=checkpoint.kills;run.pickups=checkpoint.pickups;run.damage=checkpoint.damage;run.shots=checkpoint.shots;run.secrets=checkpoint.secrets;const deaths=levelDeaths+(death?1:0);resetLevelTracking();levelDeaths=deaths;}
 function retryLevel(){rollback(true);}
 function restartLevel(){rollback(false);}
 function tick(dt){if(!run)return;const d=Math.max(0,dt);run.seconds+=d;levelSeconds+=d;if(combo.timer>0){combo.timer=Math.max(0,combo.timer-d);if(!combo.timer)combo.mult=1;}}
 function shot(){if(run)run.shots++;}
 // Kills inside the 3 s window chain x1 -> x4; the first kill of a chain is always x1.
 // counted:false (boss, summoned mites) still scores and chains the combo but is not a kill toward the level count.
 function kill(type,hp,{counted=true}={}){if(!run)return 0;combo.mult=combo.timer>0?Math.min(COMBO_MAX,combo.mult+1):1;combo.timer=COMBO_WINDOW;run.bestCombo=Math.max(run.bestCombo,combo.mult);const gained=(100+Math.round(hp*.55)+(type>=6?125:0))*combo.mult;if(counted)run.kills++;run.score+=gained;return gained;}
 function pickup(){if(!run)return;run.pickups++;run.score+=25;}
 // Flat bonus without a kill (gold cap, secret found).
 function bonus(points){if(run)run.score+=Math.max(0,Math.round(points));}
 function secret(points=250){if(!run)return;run.secrets++;bonus(points);}
 function hurt(amount){if(!run)return;const taken=Math.max(0,Math.round(amount));run.damage+=taken;run.score=Math.max(0,run.score-taken*2);if(taken>0){combo.mult=1;combo.timer=0;}}
 function formatTime(seconds){const total=Math.max(0,Math.round(seconds)),minutes=Math.floor(total/60);return `${minutes}:${String(total%60).padStart(2,'0')}`;}
 // Gold: under par, <=25 damage, every secret, no deaths on the level. Silver: two of the three. Bronze: cleared.
 function levelResult({level=0,time=0,damage=0,secretsFound=0,secretsTotal=0,deaths=0,par}={}){
  if(par===undefined)par=typeof LEVELS!=='undefined'?LEVELS[level]?.par?.time:undefined;
  const hasPar=Number.isFinite(par),criteria=[
   {id:'time',ok:hasPar&&time<=par,text:hasPar?`Время ${formatTime(time)} / пар ${formatTime(par)}`:`Время ${formatTime(time)}`},
   {id:'damage',ok:damage<=25,text:`Урон ${damage} / не больше 25`},
   {id:'secrets',ok:secretsFound>=secretsTotal,text:`Тайники ${secretsFound}/${secretsTotal}`}
  ],passed=criteria.filter(c=>c.ok).length;
  return {level,medal:passed===3&&deaths===0?'gold':passed>=2?'silver':'bronze',criteria,passed,time,par:hasPar?par:null,damage,secretsFound,secretsTotal,deaths};
 }
 function readMedals(){try{const value=JSON.parse(localStorage.getItem(MEDAL_KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
 function bestMedals(difficulty='normal'){const list=readMedals()[difficulty];return Array.from({length:LEVEL_COUNT},(_,i)=>MEDAL_RANK[list?.[i]]?list[i]:null);}
 function saveMedal(difficulty,level,medal){
  const all=readMedals(),best=bestMedals(difficulty);if((MEDAL_RANK[medal]||0)>(MEDAL_RANK[best[level]]||0))best[level]=medal;
  all[difficulty]=best;try{localStorage.setItem(MEDAL_KEY,JSON.stringify(all));}catch{}return best[level];
 }
 // Called when a level is cleared: medal from this level's own time, damage and deaths; the best one per difficulty is stored.
 function finishLevel({level=0,secretsFound=0,secretsTotal=0}={}){
  if(!run)return null;
  const result=levelResult({level,time:levelSeconds,damage:run.damage-checkpoint.damage,secretsFound,secretsTotal,deaths:levelDeaths});
  result.difficulty=run.difficulty;if(level>=0&&level<LEVEL_COUNT){result.best=saveMedal(run.difficulty,level,result.medal);run.medals[level]=result.medal;}return result;
 }
 function medalLine(result){
  if(!result)return '';const parts=[`Медаль цеха: ${MEDAL_STARS[result.medal]} ${MEDAL_NAME[result.medal]}`,result.par!=null?`${formatTime(result.time)} / пар ${formatTime(result.par)}`:formatTime(result.time),`урон ${result.damage}`];
  if(result.secretsTotal>0)parts.push(`тайники ${result.secretsFound}/${result.secretsTotal}`);return parts.join(' · ');
 }
 function veteranUnlocked(){try{return localStorage.getItem(VETERAN_KEY)==='1';}catch{return false;}}
 const cleanMedals=list=>Array.from({length:LEVEL_COUNT},(_,i)=>MEDAL_RANK[list?.[i]]?list[i]:null);
 function readRecords(){try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');if(!Array.isArray(value))return[];return value.filter(r=>Number.isFinite(Number(r?.score))).map(r=>({id:String(r.id||''),score:Math.max(0,Math.round(Number(r.score))),date:String(r.date||''),time:Math.max(0,Math.round(Number(r.time)||0)),health:Math.max(0,Math.min(100,Math.round(Number(r.health)||0))),kills:Math.max(0,Math.round(Number(r.kills)||0)),deaths:Math.max(0,Math.round(Number(r.deaths)||0)),difficulty:DIFFICULTIES.includes(r.difficulty)?r.difficulty:'normal',medals:cleanMedals(r.medals),bestCombo:Math.max(1,Math.min(COMBO_MAX,Math.round(Number(r.bestCombo)||1))),secrets:Math.max(0,Math.round(Number(r.secrets)||0))})).slice(0,MAX_RECORDS);}catch{return [];}}
 function writeRecords(records){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(records));}catch{}}
 function finish(health){
  if(finalResult)return finalResult;const veteranNew=!veteranUnlocked();
  const healthBonus=Math.max(0,Math.round(health))*12;
  const timeBonus=Math.max(0,4000-Math.round(run.seconds*4));
  const clearBonus=2000;
  run.score+=healthBonus+timeBonus+clearBonus;
  const id=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const record={id,score:current(),date:new Date().toISOString(),time:Math.round(run.seconds),health:Math.max(0,Math.round(health)),kills:run.kills,deaths:run.deaths,difficulty:run.difficulty,medals:[...run.medals],bestCombo:run.bestCombo,secrets:run.secrets};
  const records=[...readRecords(),record].sort((a,b)=>b.score-a.score||a.time-b.time).slice(0,MAX_RECORDS);
  writeRecords(records);try{localStorage.setItem(VETERAN_KEY,'1');}catch{}
  finalResult={...record,healthBonus,timeBonus,clearBonus,veteranNew,scoreMul:scoreMul(),records,rank:records.findIndex(r=>r.id===id)+1};return finalResult;
 }
 begin();
 return{begin,checkpoint:checkpointLevel,retryLevel,restartLevel,tick,shot,kill,pickup,bonus,secret,hurt,finish,finishLevel,levelResult,medalLine,medalStars:m=>MEDAL_STARS[m]||'☆☆☆',bestMedals,veteranUnlocked,records:readRecords,formatTime,difficultyLabel:d=>DIFFICULTY_LABEL[d]||DIFFICULTY_LABEL.normal,difficultyBadge:d=>DIFFICULTY_BADGE[d]||'',COMBO_WINDOW,COMBO_MAX,get combo(){return {mult:combo.mult,timer:combo.timer};},get current(){return current();},get stats(){return snapshot();}};
})();
