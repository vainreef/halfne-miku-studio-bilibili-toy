import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {chromium} from '../skin-lab/node_modules/playwright/index.mjs';
const b=await chromium.launch({channel:'chrome',headless:true});
try{
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.goto('https://vainreef.com/halfne-studio-bilibili-toy/?v=runtime04',{waitUntil:'networkidle',timeout:60000});
 await p.waitForSelector('canvas[data-renderer=webgl][data-ready="1"][data-mesh-count="11"]');
 assert((await p.locator('.fps-badge').innerText()).includes('GPU'));
 const live=await p.evaluate(async()=>({release:await(await fetch('release.json?v='+Date.now())).json(),meta:document.querySelector('meta[name="halfne-version"]')?.content,canvas:{...document.querySelector('canvas[data-renderer=webgl]').dataset}}));
 const toy=JSON.parse(await fs.readFile('build-toy/release.json','utf8'));assert.equal(live.release.releaseID,toy.releaseID);assert.equal(live.meta,toy.releaseID);assert.equal(live.canvas.drawCalls,'1');assert.equal(live.canvas.runtime,'compiled-v2');assert.equal(await p.locator('.fps-badge').getAttribute('data-fps-source'),'render');
 await p.getByRole('button',{name:'🎵 切换到初音',exact:true}).click();assert.equal(await p.locator('canvas[data-renderer=webgl]').count(),0);await p.getByRole('button',{name:'🐳 切换到大肥鱼',exact:true}).click();await p.waitForSelector('canvas[data-renderer=webgl][data-ready="1"]');
 await p.getByRole('button',{name:'重置',exact:true}).click();await p.waitForSelector('canvas[data-renderer=webgl][data-ready="1"]');await p.waitForTimeout(500);await p.locator('.stage-scaler-box').screenshot({path:'release/toy/online-mobile-neutral.png'});
 assert.deepEqual(errors,[]);await fs.writeFile('release/toy/online-mobile-verification.json',JSON.stringify({...live,errors},null,2));console.log(live);
}finally{await b.close()}
