import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const out=new URL('../screenshots/expressions/',import.meta.url);await fs.mkdir(out,{recursive:true});const b=await chromium.launch({channel:'chrome',headless:true});
try{const p=await b.newPage({viewport:{width:1400,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:3000/halfne-studio-bilibili-toy/',{waitUntil:'networkidle'});
 await p.getByRole('button',{name:'🎵 切换到初音',exact:true}).click();await p.getByRole('button',{name:'🐳 切换到大肥鱼',exact:true}).click();await p.waitForFunction(()=>document.querySelectorAll('.live-mesh').length===11);
 const eyes=p.locator('.miku [data-id=eyes] img'),mouth=p.locator('.miku [data-id=mouth] img');const initial=[await eyes.getAttribute('src'),await mouth.getAttribute('src')];
 let presets=0;for(const label of ['猫猫卖萌','傲娇气鼓','使坏搞怪','晕头转向','热血高燃','俏皮眨眼','呆萌发呆','超开心']){await p.getByRole('button',{name:new RegExp(label)}).click();await p.waitForTimeout(100);assert(await eyes.getAttribute('src'));assert(await mouth.getAttribute('src'));presets++;}
 assert.notEqual(await mouth.getAttribute('src'),initial[1]);
 await p.screenshot({path:new URL('production-whale.png',out).pathname,fullPage:true});
 await p.getByRole('button',{name:'🎵 切换到初音',exact:true}).click();await p.waitForTimeout(150);assert.equal(await p.locator('.live-mesh').count(),0);
 await p.getByRole('button',{name:'🐳 切换到大肥鱼',exact:true}).click();await p.waitForTimeout(150);assert.equal(await p.locator('.live-mesh').count(),11);
 await p.getByRole('button',{name:'制作室模式',exact:true}).click();await p.waitForTimeout(100);
 await p.getByRole('tab',{name:'📹 导出与渲染',exact:true}).click();const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'截图当前帧',exact:true}).click();const download=await downloadPromise;await download.saveAs(new URL('production-export.png',out).pathname);
 const report={presets,switchRoundTrip:true,liveMeshes:11,pngExport:true,errors};assert.deepEqual(errors,[]);await fs.writeFile(new URL('production-report.json',out),JSON.stringify(report,null,2));console.log(report);
}finally{await b.close()}
