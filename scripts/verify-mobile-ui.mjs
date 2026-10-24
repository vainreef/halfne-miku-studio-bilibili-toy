import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '../skin-lab/node_modules/playwright/index.mjs';
const base=process.env.UI_TEST_URL||'http://localhost:3000/halfne-studio-bilibili-toy/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={base,widths:[],errors:[]};
await fs.mkdir('screenshots/ui',{recursive:true});
try{
 const c=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,acceptDownloads:true});
 await c.addInitScript(()=>{window.__toySaves=0;window.toy={isSupport:async n=>['saveImageToAlbum','share'].includes(n),saveImageToAlbum:async()=>{window.__toySaves++},share:async()=>{window.__toyShares=(window.__toyShares||0)+1}}});
 const p=await c.newPage();await p.route('**/toy/app/sdk/toy-sdk.js',r=>r.fulfill({contentType:'application/javascript',body:"window.dispatchEvent(new Event('toy-sdk-ready'));"}));p.on('pageerror',e=>report.errors.push(e.message));await p.goto(base,{waitUntil:'networkidle'});
 await p.waitForSelector('canvas[data-ready="1"]');await p.waitForTimeout(600);
 assert.equal(await p.locator('.controls,.timeline,.pad-hint,.mode-switch-btn').count(),0);
 assert.equal(await p.locator('.stage-topbar .avatar-button').count(),1);
 assert.equal(await p.locator('.stage-topbar .menu-button').count(),1);
 assert.equal(await p.locator('.stage-topbar .zoom-btn').count(),2);
 assert.equal(await p.locator('.stage-topbar .avatar-button img').getAttribute('alt'),'大肥鱼');
 assert(await p.locator('.face-button img').count()>=8);
 assert(await p.locator('.face-button img').count()>=8);
 await p.screenshot({path:'screenshots/ui/mobile-home.png'});
 for(const name of ['表情','眼神','口型','嘴巴']){
  await p.getByRole('tab',{name,exact:true}).click();
  for(const b of await p.locator('.face-button').all())await b.click();
 }
 await p.getByRole('tab',{name:'眼神',exact:true}).click();const blinkBtn=p.locator('.pad-eye-toggle');const beforeBlink=await blinkBtn.getAttribute('aria-pressed');await blinkBtn.click();assert.notEqual(await blinkBtn.getAttribute('aria-pressed'),beforeBlink);await blinkBtn.click();
 await p.getByRole('button',{name:'打开菜单',exact:true}).click();
 assert(await p.locator('.stage-wrapper').evaluate(n=>n.inert));
 await p.getByRole('button',{name:'纯色背景',exact:true}).click();
 await p.getByRole('tab',{name:'设置',exact:true}).click();
 await p.getByLabel('陀螺仪感应',{exact:true}).uncheck();await p.getByLabel('自然摆动',{exact:true}).uncheck();await p.getByLabel('显示触摸点',{exact:true}).check();
 // Background updates and FPS snapshots must not steal focus from the settings.
 await p.getByLabel('自然摆动',{exact:true}).focus();await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>document.activeElement.closest('label')?.textContent),'自然摆动');
 await p.screenshot({path:'screenshots/ui/mobile-menu.png'});
 await p.getByRole('tab',{name:'保存',exact:true}).click();
 if(process.env.UI_TOY==='1'){await p.getByRole('button',{name:'保存图片',exact:true}).click();await p.waitForFunction(()=>window.__toySaves===1);await p.getByRole('button',{name:'分享 Toy',exact:true}).click();await p.waitForFunction(()=>window.__toyShares===1);report.toySdkSaveShare=true}else{const download=p.waitForEvent('download');await p.getByRole('button',{name:'保存图片',exact:true}).click();const dl=await download;await dl.saveAs('screenshots/ui/saved.png')}
 await p.getByRole('button',{name:'关闭菜单',exact:true}).click();assert.equal(await p.locator('.stage').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(233, 238, 247)');assert.equal(await p.locator('.touch-target').count(),1);
 await p.reload({waitUntil:'networkidle'});await p.getByRole('button',{name:'打开菜单',exact:true}).click();await p.getByRole('tab',{name:'设置',exact:true}).click();assert.equal(await p.getByLabel('陀螺仪感应',{exact:true}).isChecked(),false);assert.equal(await p.getByLabel('自然摆动',{exact:true}).isChecked(),false);
 await p.getByLabel('陀螺仪感应',{exact:true}).check();await p.getByLabel('自然摆动',{exact:true}).check();await p.getByLabel('显示触摸点',{exact:true}).uncheck();await p.getByRole('button',{name:'恢复初始姿态',exact:true}).click();
 await p.getByRole('button',{name:'切换角色',exact:true}).click();await p.screenshot({path:'screenshots/ui/mobile-characters.png'});await p.getByRole('button',{name:'初音',exact:true}).click();assert.equal(await p.locator('.avatar-button img').getAttribute('alt'),'初音');await p.waitForSelector('canvas[data-renderer=webgl][data-ready="1"][data-mesh-count="0"]');
 await p.getByRole('tab',{name:'表情',exact:true}).click();assert((await p.locator('.face-button img').first().getAttribute('src')).includes('miku-'));
 await p.reload({waitUntil:'networkidle'});assert.equal(await p.locator('.avatar-button img').getAttribute('alt'),'初音');
 await p.getByRole('button',{name:'切换角色',exact:true}).click();await p.getByRole('button',{name:'大肥鱼',exact:true}).click();await p.waitForSelector('canvas[data-ready="1"]');assert((await p.locator('.face-button img').first().getAttribute('src')).includes('whale-'));
 for(const [width,height] of [[280,640],[320,568],[390,844],[430,932],[768,1024],[844,390]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(200);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.App').scrollWidth<=innerWidth),'Horizontal overflow '+width);
  for(const b of await p.locator('.stage-topbar button,.quick-pad-tabs button,.face-button').all()){const box=await b.boundingBox();assert(box.width>=43&&box.height>=43,'Small touch target '+JSON.stringify(box))}
  await p.getByRole('button',{name:'打开菜单',exact:true}).click();const box=await p.locator('.toy-menu').boundingBox();assert(box.x>=0&&box.x+box.width<=width&&box.y>=0&&box.y+box.height<=height,'Menu overflow');await p.getByRole('button',{name:'关闭菜单',exact:true}).click();
  report.widths.push({width,height,passed:true});await p.screenshot({path:`screenshots/ui/layout-${width}.png`});
 }
 assert.deepEqual(report.errors,[]);report.expressionButtons=true;report.skinPersistence=true;report.settingsPersistence=true;report.backgroundSwitch=true;report.pngDownload=process.env.UI_TOY!=='1';report.focusStable=true;report.gpuPreserved=true;
 await fs.writeFile('release/toy/mobile-ui-'+(process.env.UI_TOY==='1'?'toy':'web')+'-verification.json',JSON.stringify(report,null,2));console.log(report);await c.close();
}finally{await browser.close()}
