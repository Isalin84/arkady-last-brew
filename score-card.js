'use strict';
const ScoreCard=(()=>{
 const GAME_URL='https://isalin84.github.io/arkady-last-brew/';
 let currentUrl=null,currentBlob=null,currentName='arkady-result.png';
 const loadImage=src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=src;});
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
  ctx.fillStyle='#D4AF37';ctx.font='900 118px Montserrat,Arial,sans-serif';ctx.fillText(String(result.score),62,282);
  ctx.fillStyle='#FAF9F6';ctx.font='700 24px Montserrat,Arial,sans-serif';ctx.fillText(`Место в локальном рейтинге: ${result.rank||'—'}`,68,330);
  ctx.font='600 21px Montserrat,Arial,sans-serif';ctx.fillText(`${result.kills} монстров · ${GameScore.formatTime(result.time)} · здоровье ${result.health}%`,68,374);
  ctx.fillStyle='#D4AF37';ctx.font='800 31px Montserrat,Arial,sans-serif';ctx.fillText('СМОЖЕШЬ НАБРАТЬ БОЛЬШЕ?',68,456);
  ctx.fillStyle='#DCE2EC';ctx.font='500 21px Montserrat,Arial,sans-serif';ctx.fillText('Сравни результат с коллегами:',68,501);
  ctx.fillStyle='#FAF9F6';ctx.font='700 22px monospace';ctx.fillText(GAME_URL,68,542);
  ctx.fillStyle='#BAC5D5';ctx.font='500 16px Montserrat,Arial,sans-serif';ctx.fillText('Стелла спасена · Arkady is Back · v0.9',68,588);
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
