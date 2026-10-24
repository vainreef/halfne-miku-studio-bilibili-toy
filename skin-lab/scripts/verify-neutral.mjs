import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:700}});
 await page.goto('http://127.0.0.1:3010/?clean=1&capture=1&neutral=1&focus=face&yaw=0',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.documentElement.dataset.captureReady==='1'&&document.documentElement.dataset.cleanReady==='1');
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
 await page.waitForFunction(()=>[...document.querySelectorAll('canvas.live-mesh')].every(c=>c.dataset.meshReady==='1'));
 const snapshot=()=>page.locator('.clean-model').evaluate(e=>e.innerHTML);
 const before=await snapshot(),imageBefore=await page.locator('[data-testid="comparison"]').screenshot();
 for(const [x,y] of [[10,10],[590,400],[300,200],[1150,600]])await page.mouse.move(x,y);
 await page.keyboard.press('ArrowLeft');await page.keyboard.press('Space');
 await page.waitForTimeout(350);
 assert.equal(await snapshot(),before,'Neutral model changed after input');
 assert.deepEqual(await page.locator('[data-testid="comparison"]').screenshot(),imageBefore,'Neutral pixels changed after input');
 await page.reload({waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.documentElement.dataset.captureReady==='1'&&document.documentElement.dataset.cleanReady==='1');
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
 await page.waitForFunction(()=>[...document.querySelectorAll('canvas.live-mesh')].every(c=>c.dataset.meshReady==='1'));
 assert.equal(await snapshot(),before,'Initial neutral state differs between page loads');
 console.log('PASS: neutral initial state, pointer/keyboard immunity, pixel stability and reload determinism');
}finally{await browser.close()}
