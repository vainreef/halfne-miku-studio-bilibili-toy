// Focused acceptance only: one character, one eye, one mouth, pose and hair/cloth motion.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import resources from '../src/whale/resources.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:1640,height:1100}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3010/',{waitUntil:'networkidle'});
 const stage=page.locator('[data-testid="model-stage"]');await stage.locator('img').first().waitFor();
 await page.waitForFunction(()=>document.querySelectorAll('.live-mesh').length===11);
 assert.equal(await stage.locator('img').count(),Object.keys(resources).filter(k=>!k.includes(':')).length+2-11);
 assert.equal(await stage.locator('[data-id=eyes]>img').getAttribute('src'),resources['head.face.eyes:happyo']);
 assert.equal(await stage.locator('[data-id=mouth]>img').getAttribute('src'),resources['head.face.mouth:happy1']);
 assert.equal(await page.getByLabel('眼神',{exact:true}).count(),1);assert.equal(await page.getByLabel('当前模型',{exact:true}).count(),0);
 results.push('鲸鱼娘完整表情控件，保持单角色工作台');
 const head=stage.locator('[data-id=head]'),before=await head.getAttribute('style');
 await page.getByRole('button',{name:'→',exact:true}).click();
 await page.waitForFunction(previous=>document.querySelector('[data-id=head]').getAttribute('style')!==previous,before);
 results.push('鼠标方向输入驱动头部与身体');
 await page.getByLabel('显示关节（含虚拟节点）',{exact:true}).check();
 assert.equal(await page.locator('.rig circle').count(),JSON.parse(await fs.readFile(new URL('../art/rig/anchors.json',import.meta.url),'utf8')).nodes.length);assert(await page.locator('.rig polyline').count()>0);
 results.push('关节与后发/裙摆控制网格显示');
 await page.getByLabel('暂停 / 定格',{exact:true}).check();await page.waitForTimeout(80);
 const frozen=await head.getAttribute('style');await page.waitForTimeout(150);assert.equal(await head.getAttribute('style'),frozen);
 results.push('暂停保持当前动作');
 for(const pose of ['center','left','right','up','down','nw','ne','sw','se']){
  await page.goto(`http://127.0.0.1:3010/?clean=1&capture=1&pose=${pose}&frames=90`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.captureReady==='1'&&document.documentElement.dataset.cleanReady==='1');
  assert.equal(await page.locator('[data-id=eyes]>img').getAttribute('src'),resources['head.face.eyes:happyo']);
  assert.equal(await page.locator('[data-id=mouth]>img').getAttribute('src'),resources['head.face.mouth:happy1']);
  await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
 }
 results.push('九方向动作均保持同一眼神/嘴型，全部图层正常加载');
 assert.deepEqual(errors,[]);
 await fs.writeFile(new URL('../screenshots/verify-report.json',import.meta.url),JSON.stringify({scope:'single-face-motion',results,errors},null,2));
 console.log(results.map(s=>'✓ '+s).join('\n'));
}finally{await browser.close()}
