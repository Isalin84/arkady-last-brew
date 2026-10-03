const {test,expect}=require('@playwright/test');
// Game scripts run before DOMContentLoaded; the load event may wait on optional Google Fonts.
const READY={waitUntil:'domcontentloaded'};

test('real page starts, updates damage portrait and builds a persistent share card',async({page},testInfo)=>{
 const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/',READY);
 await expect(page.locator('footer')).toContainText('v1.0');
 await page.getByRole('button',{name:/Начать смену/}).click();
 await expect(page.locator('#hud')).toBeVisible();
 await expect(page.locator('#arkady-health-portrait')).toHaveAttribute('src','assets/art/arkady-health-100.webp');
 await page.evaluate(()=>{player.hp=24;updateHUD();});
 await expect(page.locator('#arkady-health-portrait')).toHaveAttribute('src','assets/art/arkady-health-25.webp');
 await page.evaluate(()=>{GameScore.kill(0,75);updateHUD();});
 await expect(page.locator('#score')).not.toHaveText('0');
 await page.evaluate(()=>{loadLevel(3);running=true;GameScore.kill(10,310);finish(true);});
 await expect(page.locator('.cover-art')).toHaveAttribute('src','assets/art/stella-kisses-arkady.webp');
 await expect(page.locator('#score-panel')).toBeHidden();
 await expect(page.locator('#show-results')).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('finale-kiss-desktop.png'),fullPage:true});
 await page.locator('#show-results').click();
 await expect(page.locator('#score-panel')).toBeVisible();
 await expect(page.locator('#score-records tr')).toHaveCount(1);
 await expect(page.locator('#score-card-preview')).toHaveAttribute('src',/^blob:/,{timeout:10000});
 const dimensions=await page.locator('#score-card-preview').evaluate(image=>({width:image.naturalWidth,height:image.naturalHeight}));
 expect(dimensions).toEqual({width:1200,height:630});
 const downloadPromise=page.waitForEvent('download');await page.locator('#download-score').click();const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/^arkady-\d+-points\.png$/);
 await page.screenshot({path:testInfo.outputPath('finale-desktop.png'),fullPage:true});
 const panelBox=await page.locator('#score-panel').boundingBox(),stageBox=await page.locator('#stage').boundingBox();
 expect(panelBox.x).toBeLessThan(stageBox.x+stageBox.width/2);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:testInfo.outputPath('finale-mobile.png'),fullPage:true});
 await page.reload(READY);
 expect(await page.evaluate(()=>GameScore.records().length)).toBe(1);
 expect(errors).toEqual([]);
});

test('streamed music follows the title, the shift and the pause',async({page})=>{
 const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/',READY);
 expect(await page.evaluate(()=>GameAudio.track)).toBeNull();
 await page.mouse.click(8,8); // any gesture on the title screen
 await expect.poll(()=>page.evaluate(()=>GameAudio.track)).toBe('menu');
 await expect.poll(()=>page.evaluate(()=>GameAudio.musicElement('menu').paused)).toBe(false);
 expect(await page.evaluate(()=>GameAudio.musicElement('menu').src)).toMatch(/assets\/audio\/music\/menu-arkady-is-back\.(webm|m4a)$/);
 await page.getByRole('button',{name:/Начать смену/}).click();
 await expect(page.locator('#hud')).toBeVisible();
 expect(await page.evaluate(()=>GameAudio.track)).toBe('game');
 await expect.poll(()=>page.evaluate(()=>{const e=GameAudio.musicElement('game');return !e.paused&&e.currentTime>0;}),{timeout:10000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>GameAudio.musicElement('menu').paused)).toBe(true);
 await page.keyboard.press('Escape');
 await expect(page.locator('#pause-panel')).toBeVisible();
 expect(await page.evaluate(()=>GameAudio.track)).toBe('menu');
 await expect.poll(()=>page.evaluate(()=>GameAudio.musicElement('menu').paused)).toBe(false);
 await expect.poll(()=>page.evaluate(()=>GameAudio.musicElement('game').paused)).toBe(true);
 const paused=await page.evaluate(()=>GameAudio.musicElement('game').currentTime);
 await page.locator('#resume').click();
 await expect.poll(()=>page.evaluate(()=>GameAudio.musicElement('game').paused)).toBe(false);
 await expect.poll(()=>page.evaluate(()=>GameAudio.musicElement('game').currentTime)).toBeGreaterThan(paused);
 expect(await page.evaluate(()=>GameAudio.musicElement('game').currentTime)).toBeLessThan(paused+5); // continues, not restarted
 expect(errors).toEqual([]);
});

const overlaps=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;

test('Esc opens the pause panel over the live scene and settings persist across reloads',async({page})=>{
 const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/',READY);
 await expect(page.locator('#pause-panel')).toBeHidden();
 await page.getByRole('button',{name:/Начать смену/}).click();
 await expect(page.locator('#hud')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('#pause-panel')).toBeVisible();
 await expect(page.locator('#pause-title')).toContainText('Перерыв');
 await expect(page.locator('#overlay')).toBeHidden();
 await expect(page.locator('#resume')).toBeVisible();
 await expect(page.locator('#restart-level')).toBeVisible();
 // the audio sliders live in the panel and keep their ids
 for(const id of ['volume-music','volume-effects','volume-voice'])await expect(page.locator('#'+id)).toBeVisible();
 await page.locator('#setting-sensitivity').fill('1.8');
 await page.locator('#setting-quality').selectOption('low');
 await page.locator('#setting-shake').uncheck();
 await page.locator('#setting-fps').check();
 await page.locator('#resume').click();
 await expect(page.locator('#pause-panel')).toBeHidden();
 expect(await page.evaluate(()=>running)).toBe(true);
 await page.reload(READY);
 await expect(page.locator('#pause-panel')).toBeHidden();
 await page.getByRole('button',{name:'Настройки'}).click();
 await expect(page.locator('#pause-panel')).toBeVisible();
 await expect(page.locator('#pause-title')).toHaveText('Настройки');
 await expect(page.locator('#resume')).toBeHidden();
 await expect(page.locator('#setting-sensitivity')).toHaveValue('1.8');
 await expect(page.locator('#setting-quality')).toHaveValue('low');
 await expect(page.locator('#setting-shake')).not.toBeChecked();
 await expect(page.locator('#setting-fps')).toBeChecked();
 expect(await page.evaluate(()=>GameSettings.get('sensitivity'))).toBe(1.8);
 await page.keyboard.press('Escape');
 await expect(page.locator('#pause-panel')).toBeHidden();
 await expect(page.getByRole('button',{name:/Начать смену/})).toBeVisible();
 expect(errors).toEqual([]);
});

test('difficulty picker keeps the veteran locked until Stella is rescued',async({page})=>{
 await page.goto('/',READY);
 const veteran=page.locator('[data-difficulty="veteran"]');
 await expect(veteran).toHaveAttribute('aria-disabled','true');
 await page.locator('[data-difficulty="rookie"]').click();
 expect(await page.evaluate(()=>GameSettings.get('difficulty'))).toBe('rookie');
 await veteran.click({force:true}); // aria-disabled buttons are still clickable for real users
 expect(await page.evaluate(()=>GameSettings.get('difficulty'))).toBe('rookie');
 await expect(page.locator('#difficulty-hint')).toContainText('Открывается после спасения Стеллы');
});

test('fullscreen button follows the Fullscreen API and F toggles the stage',async({page})=>{
 await page.goto('/',READY);
 const supported=await page.evaluate(()=>Boolean(document.fullscreenEnabled||document.webkitFullscreenEnabled));
 if(!supported){await expect(page.locator('#fullscreen')).toBeHidden();return;}
 await expect(page.locator('#fullscreen')).toBeVisible();
 await page.getByRole('button',{name:/Начать смену/}).click();
 await page.keyboard.press('f');
 await expect.poll(()=>page.evaluate(()=>document.fullscreenElement&&document.fullscreenElement.id)).toBe('stage');
 const view=await page.locator('#view').boundingBox();
 expect(Math.abs(view.width/view.height-16/9)).toBeLessThan(.02);
 await page.keyboard.press('f');
 await expect.poll(()=>page.evaluate(()=>document.fullscreenElement)).toBeNull();
});

test.describe('touch layouts',()=>{
 for(const [name,size] of [['landscape',{width:844,height:390}],['portrait',{width:390,height:844}]]){
  test.describe(name,()=>{
   test.use({viewport:size,hasTouch:true,isMobile:true});
   test('joystick and action buttons never overlap subtitles',async({page},testInfo)=>{
    const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/',READY);
    expect(await page.evaluate(()=>matchMedia('(pointer:coarse)').matches)).toBe(true);
    await expect(page.locator('#joystick')).toBeHidden();
    await expect(page.locator('.bottomline')).toBeHidden();
    await page.locator('#start').tap();
    await expect(page.locator('#hud')).toBeVisible();
    for(const id of ['#joystick','#touchfire','#touchuse','#touchswap'])await expect(page.locator(id)).toBeVisible();
    await page.evaluate(()=>{const s=document.querySelector('#subtitle');s.hidden=false;s.textContent='Аркадий: Ну что, Аркадий. Ещё одна ночная смена, и снова весь цех против меня одного.';});
    const sub=await page.locator('#subtitle').boundingBox();
    for(const id of ['#joystick','#touchfire','#touchuse','#touchswap','#touchpause']){const box=await page.locator(id).boundingBox();expect(overlaps(sub,box),id+' overlaps the subtitle').toBe(false);}
    const vp=page.viewportSize();
    for(const id of ['#joystick','#touchfire','#touchuse','#touchswap']){const box=await page.locator(id).boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(vp.width+1);}
    // dragging the joystick drives analog movement
    const joy=await page.locator('#joystick').boundingBox();
    await page.evaluate(({x,y,w})=>{const el=document.querySelector('#joystick');const p=(type,cx,cy)=>el.dispatchEvent(new PointerEvent(type,{pointerId:3,clientX:cx,clientY:cy,bubbles:true,pointerType:'touch'}));p('pointerdown',x,y);p('pointermove',x,y-w*.45);},{x:joy.x+joy.width/2,y:joy.y+joy.height/2,w:joy.width});
    expect(await page.evaluate(()=>GameUI.touchMove.y)).toBeGreaterThan(.8);
    await page.evaluate(()=>document.querySelector('#joystick').dispatchEvent(new PointerEvent('pointerup',{pointerId:3,bubbles:true})));
    expect(await page.evaluate(()=>GameUI.touchMove.y)).toBe(0);
    await page.screenshot({path:testInfo.outputPath(`touch-${name}.png`)});
    // pausing hides the controls and opens the panel
    await page.locator('#touchpause').tap();
    await expect(page.locator('#pause-panel')).toBeVisible();
    await expect(page.locator('#joystick')).toBeHidden();
    await page.locator('#resume').tap();
    await expect(page.locator('#pause-panel')).toBeHidden();
    await expect(page.locator('#joystick')).toBeVisible();
    expect(errors).toEqual([]);
   });
  });
 }
});
