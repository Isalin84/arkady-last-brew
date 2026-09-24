const {test,expect}=require('@playwright/test');

test('real page starts, updates damage portrait and builds a persistent share card',async({page},testInfo)=>{
 const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.locator('footer')).toContainText('v0.8');
 await page.getByRole('button',{name:/Начать смену/}).click();
 await expect(page.locator('#hud')).toBeVisible();
 await expect(page.locator('#arkady-health-portrait')).toHaveAttribute('src','assets/art/arkady-health-100.webp');
 await page.evaluate(()=>{player.hp=24;updateHUD();});
 await expect(page.locator('#arkady-health-portrait')).toHaveAttribute('src','assets/art/arkady-health-25.webp');
 await page.evaluate(()=>{GameScore.kill(0,75);updateHUD();});
 await expect(page.locator('#score')).not.toHaveText('0');
 await page.evaluate(()=>{loadLevel(3);running=true;GameScore.kill(10,310);finish(true);});
 await expect(page.locator('#score-panel')).toBeVisible();
 await expect(page.locator('#score-records tr')).toHaveCount(1);
 await expect(page.locator('#score-card-preview')).toHaveAttribute('src',/^blob:/,{timeout:10000});
 const dimensions=await page.locator('#score-card-preview').evaluate(image=>({width:image.naturalWidth,height:image.naturalHeight}));
 expect(dimensions).toEqual({width:1200,height:630});
 const downloadPromise=page.waitForEvent('download');await page.locator('#download-score').click();const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/^arkady-\d+-points\.png$/);
 await page.screenshot({path:testInfo.outputPath('finale-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:testInfo.outputPath('finale-mobile.png'),fullPage:true});
 await page.reload();
 expect(await page.evaluate(()=>GameScore.records().length)).toBe(1);
 expect(errors).toEqual([]);
});
