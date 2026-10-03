'use strict';
const ScoreCard=(()=>{
 const GAME_URL='https://isalin84.github.io/arkady-last-brew/';
 let currentUrl=null,currentBlob=null,currentName='arkady-result.png';
 const loadImage=src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=src;});
 // Star outline path: 5 points, outer radius R, inner radius r.
 function starPath(ctx,cx,cy,R,r){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,k=i%2?r:R;ctx[i?'lineTo':'moveTo'](cx+Math.cos(a)*k,cy+Math.sin(a)*k);}ctx.closePath();}
 // Difficulty pill next to the title; the veteran pill is filled gold.
 function drawDifficulty(ctx,difficulty,x,baseline){
  const label=GameScore.difficultyLabel(difficulty).toUpperCase(),veteran=difficulty==='veteran';ctx.save();ctx.font='800 17px Montserrat,Arial,sans-serif';const w=ctx.measureText(label).width+28,top=baseline-26;
  ctx.beginPath();ctx.moveTo(x+17,top);ctx.lineTo(x+w-17,top);ctx.arc(x+w-17,top+17,17,-Math.PI/2,Math.PI/2);ctx.lineTo(x+17,top+34);ctx.arc(x+17,top+17,17,Math.PI/2,Math.PI*1.5);ctx.closePath();if(veteran){ctx.fillStyle='#D4AF37';ctx.fill();ctx.fillStyle='#0B1D3A';}else{ctx.strokeStyle='#D4AF37';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#D4AF37';}
  ctx.textBaseline='middle';ctx.fillText(label,x+14,top+18);ctx.restore();
 }
 // Four level medals as stars (gold, silver, bronze, empty), then best combo and secrets.
 function drawMedals(ctx,result,x,cy){
  const colors={gold:'#D4AF37',silver:'#D5DCE6',bronze:'#C98A4B'},medals=result.medals||[];ctx.save();
  for(let i=0;i<4;i++){const cx=x+17+i*52,color=colors[medals[i]];starPath(ctx,cx,cy,18,7.5);if(color){ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='rgba(11,29,58,.55)';ctx.lineWidth=2;ctx.stroke();}else{ctx.strokeStyle='rgba(186,197,213,.55)';ctx.lineWidth=2;ctx.stroke();}}
  ctx.fillStyle='#FAF9F6';ctx.font='600 20px Montserrat,Arial,sans-serif';ctx.textBaseline='middle';
  const extra=[`комбо ×${result.bestCombo||1}`];if(result.secrets)extra.push(`тайники ${result.secrets}`);ctx.fillText(extra.join(' · '),x+4*52+14,cy+1);ctx.restore();
 }
 function fitCover(ctx,image,x,y,w,h){const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight),sw=w/scale,sh=h/scale,sx=(image.naturalWidth-sw)/2,sy=(image.naturalHeight-sh)/2;ctx.drawImage(image,sx,sy,sw,sh,x,y,w,h);}
 async function create(result){
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;const ctx=canvas.getContext('2d');
  const [hero,logo]=await Promise.all([loadImage('assets/art/stella-kisses-arkady.webp'),loadImage('assets/art/brand/logo.png')]);
  ctx.fillStyle='#0B1D3A';ctx.fillRect(0,0,1200,630);
  if(hero){fitCover(ctx,hero,0,0,1200,630);const fade=ctx.createLinearGradient(0,0,790,0);fade.addColorStop(0,'rgba(11,29,58,.99)');fade.addColorStop(.62,'rgba(11,29,58,.88)');fade.addColorStop(1,'rgba(11,29,58,.08)');ctx.fillStyle=fade;ctx.fillRect(0,0,920,630);}
  ctx.fillStyle='#D4AF37';ctx.fillRect(0,0,1200,14);ctx.fillRect(68,116,220,5);
  if(logo)ctx.drawImage(logo,68,38,68,68);
  ctx.fillStyle='#FAF9F6';ctx.font='800 24px Montserrat,Arial,sans-serif';ctx.fillText('BEST PRACTICE AI · ПОСЛЕДНЯЯ ВАРКА',154,80);
  ctx.font='800 28px Montserrat,Arial,sans-serif';ctx.fillText('МОЙ РЕЗУЛЬТАТ',68,168);
  drawDifficulty(ctx,result.difficulty,68+ctx.measureText('МОЙ РЕЗУЛЬТАТ').width+18,168);
  ctx.fillStyle='#D4AF37';ctx.font='900 118px Montserrat,Arial,sans-serif';ctx.fillText(String(result.score),62,282);
  ctx.fillStyle='#FAF9F6';ctx.font='700 24px Montserrat,Arial,sans-serif';ctx.fillText(`Место в локальном рейтинге: ${result.rank||'—'}`,68,330);
  ctx.font='600 21px Montserrat,Arial,sans-serif';ctx.fillText(`${result.kills} монстров · ${GameScore.formatTime(result.time)} · здоровье ${result.health}%`,68,374);
  drawMedals(ctx,result,68,411);
  ctx.fillStyle='#D4AF37';ctx.font='800 31px Montserrat,Arial,sans-serif';ctx.fillText('СМОЖЕШЬ НАБРАТЬ БОЛЬШЕ?',68,472);
  ctx.fillStyle='#DCE2EC';ctx.font='500 21px Montserrat,Arial,sans-serif';ctx.fillText('Сравни результат с коллегами:',68,517);
  ctx.fillStyle='#FAF9F6';ctx.font='700 22px monospace';ctx.fillText(GAME_URL,68,558);
  ctx.fillStyle='#BAC5D5';ctx.font='500 16px Montserrat,Arial,sans-serif';ctx.fillText('Стелла спасена · Arkady is Back · v0.9',68,602);
  currentBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(currentUrl)URL.revokeObjectURL(currentUrl);currentUrl=URL.createObjectURL(currentBlob);currentName=`arkady-${result.score}-points.png`;
  return{url:currentUrl,blob:currentBlob,name:currentName,gameUrl:GAME_URL};
 }
 function download(){if(!currentUrl)return;const link=document.createElement('a');link.href=currentUrl;link.download=currentName;link.click();}
 async function copyLink(){const text=`Я набрал ${GameScore.current} очков в «Последней варке». Сможешь больше? ${GAME_URL}`;if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();document.execCommand('copy');field.remove();}
 async function share(){
  if(!currentBlob)return false;const file=new File([currentBlob],currentName,{type:'image/png'});const data={title:'Последняя варка — мой результат',text:`Я набрал ${GameScore.current} очков. Сможешь больше?`,url:GAME_URL,files:[file]};
  if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share(data);return true;}return false;
 }
 return{create,download,copyLink,share,GAME_URL};
})();
