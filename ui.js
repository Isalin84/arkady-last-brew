'use strict';
// DOM interface: HUD, toasts, finale cover and score panel, audio sliders, arsenal thumbnails.
const GameUI=(()=>{
 const $=s=>document.querySelector(s);let toastTime=0;
 function toast(s){$('#toast').textContent=s;$('#toast').style.opacity=1;toastTime=2.6;}
 function updateHUD(){
  const health=Math.max(0,Math.min(100,Math.ceil(player.hp))),portrait=$('#arkady-health-portrait');
  const state=health>=76?'100':health>=51?'75':health>=25?'50':'25';
  const labels={100:'Аркадий здоров',75:'Аркадий получил лёгкие повреждения',50:'Аркадий сильно пострадал',25:'Аркадий критически ранен'};
  $('#health').textContent=health;$('#healthbar').style.width=health+'%';portrait.src='assets/art/arkady-health-'+state+'.webp';portrait.alt=labels[state];
  $('#weaponname').textContent=weapons[weapon].name;$('#ammo').textContent=weapons[weapon].ammo===Infinity?'∞':weapons[weapon].ammo;$('#kills').innerHTML=kills+' <em>/ '+levelTotal+'</em>';$('#score').textContent=Math.round(GameScore.current);document.querySelectorAll('.weapon').forEach((b,i)=>b.classList.toggle('active',i===weapon));
 }
 function setFinaleCover(finale){
  const overlay=$('#overlay'),art=$('.cover-art');overlay.classList.toggle('finale',finale);
  overlay.classList.toggle('finale-moment',finale);overlay.classList.remove('finale-results');
  art.src=finale?'assets/art/stella-kisses-arkady.webp':'assets/art/arkady-cover.webp';
  art.alt=finale?'Стелла целует спасшего её Аркадия в щёку в солодовне':'Аркадий со скрещёнными руками на фоне пивоварни';
  $('#show-results').hidden=!finale;if(!finale)$('#score-panel').hidden=true;
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
 // Per-frame UI work (runs while paused too).
 function frame(dt){toastTime-=dt;if(toastTime<=0)$('#toast').style.opacity=0;}
 // Screen-space overlays on top of the 3D view; rects come from Renderer.render().
 function overlays(rects){}
 // Between-level upgrade choice; until upgrades exist it picks nothing immediately.
 function showUpgrades(choices,onPick){onPick(null);}
 function pausePanel(show){}
 // Wires static controls once; called by game.js after its own globals exist.
 function init(){
  document.querySelectorAll('[data-volume]').forEach(input=>{const channel=input.dataset.volume;input.value=Math.round(GameAudio.volumes[channel]*100);$('#value-'+channel).textContent=input.value+'%';input.addEventListener('input',()=>{GameAudio.setVolume(channel,Number(input.value)/100);$('#value-'+channel).textContent=input.value+'%';});});
  $('#download-score').addEventListener('click',()=>{ScoreCard.download();scoreButtonFeedback($('#download-score'),'Картинка скачана');});
  $('#copy-game-link').addEventListener('click',async()=>{try{await ScoreCard.copyLink();scoreButtonFeedback($('#copy-game-link'),'Ссылка скопирована');}catch{scoreButtonFeedback($('#copy-game-link'),'Не удалось скопировать');}});
  $('#share-score').addEventListener('click',async()=>{try{if(await ScoreCard.share())scoreButtonFeedback($('#share-score'),'Отправлено');else{ScoreCard.download();await ScoreCard.copyLink();scoreButtonFeedback($('#share-score'),'Скачано + ссылка');}}catch(err){if(err?.name!=='AbortError')scoreButtonFeedback($('#share-score'),'Не удалось отправить');}});
  $('#show-results').addEventListener('click',revealFinalScore);$('#replay-score').addEventListener('click',start);
  document.querySelectorAll('.weapon-thumb').forEach((c,i)=>{c.getContext('2d').drawImage(WeaponArt.get(i),110,80,530,550,0,0,c.width,c.height);});
 }
 return {toast,updateHUD,setFinaleCover,prepareFinalScore,revealFinalScore,frame,overlays,showUpgrades,pausePanel,init};
})();
