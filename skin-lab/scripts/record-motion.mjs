import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const lab=fileURLToPath(new URL('..',import.meta.url));
const out=path.join(lab,'screenshots/rig-v2/video');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1200,height:600},recordVideo:{dir:out,size:{width:1200,height:600}}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3010/?clean=1&motion=1&scenario=stop&yaw=-12',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.documentElement.dataset.cleanReady==='1');
 await page.waitForTimeout(7800);
 const fps=await page.evaluate(()=>Number(document.documentElement.dataset.labFps));
 const video=page.video();await context.close();await video.saveAs(path.join(out,'whale-turn-stop.webm'));await video.delete();
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({fps,errors,scenario:'center → left → right → center → settle',viewport:[1200,600]},null,2));
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({video:path.join(out,'whale-turn-stop.webm'),fps,errors}));
}finally{await browser.close()}
