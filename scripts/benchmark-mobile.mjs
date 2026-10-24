import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {chromium} from '../skin-lab/node_modules/playwright/index.mjs';
const root=path.resolve('build-toy');const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end()}});await new Promise(r=>server.listen(3033,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});const report={reportedPhoneBaseline:{whaleFps:20,mikuFps:40},environment:'Desktop Chrome mobile viewport 390×844, DPR 3; CPU throttling is a proxy, not physical Bilibili phone FPS',results:[]};
try{
 for(const rate of (process.env.MOBILE_CPU_RATES?.split(',').map(Number)||[6,10,20]))for(const [name,skin,renderer] of [['miku-gpu','miku','auto'],['whale-gpu','whale','auto']]){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});await context.route('**/toy/app/sdk/toy-sdk.js',r=>r.abort());const p=await context.newPage();
  await p.goto(`http://127.0.0.1:3033/index.html?skin=${skin}&renderer=${renderer}`,{waitUntil:'networkidle'});
  if(name.endsWith('-gpu'))await p.waitForSelector('canvas[data-renderer=webgl][data-ready="1"]');
  if(name==='whale-canvas')await p.waitForFunction(()=>document.querySelectorAll('canvas[data-mesh-ready="1"]').length===14);
  const session=await context.newCDPSession(p);await session.send('Emulation.setCPUThrottlingRate',{rate});await session.send('Performance.enable');await p.waitForTimeout(1200);
  const before=(await session.send('Performance.getMetrics')).metrics;
  const sample=await p.evaluate(()=>new Promise(resolve=>{const stage=document.querySelector('.stage'),rect=stage.getBoundingClientRect(),gaps=[];let start,last,startFrames;function frame(t){if(start===undefined){start=last=t;startFrames=document.querySelector('.miku').__renderFrameCount||0;}else{gaps.push(t-last);last=t;}stage.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:rect.left+rect.width*(.5+.3*Math.sin(t/600)),clientY:rect.top+rect.height*(.5+.25*Math.cos(t/430))}));if(t-start<5000)requestAnimationFrame(frame);else resolve({gaps,renderedFrames:(document.querySelector('.miku').__renderFrameCount||0)-startFrames});}requestAnimationFrame(frame);}));
  const after=(await session.send('Performance.getMetrics')).metrics,delta=k=>(after.find(m=>m.name===k).value-before.find(m=>m.name===k).value)*1000;
  const {gaps,renderedFrames}=sample;
  const total=gaps.reduce((a,b)=>a+b,0),sorted=[...gaps].sort((a,b)=>a-b),stats=await p.locator('.miku').evaluate(el=>({nodes:el.querySelectorAll('*').length,canvases:el.querySelectorAll('canvas').length,canvasPixels:[...el.querySelectorAll('canvas')].reduce((n,c)=>n+c.width*c.height,0),gpu:el.querySelector('[data-renderer=webgl]')?.dataset||null}));
  const row={name,cpuRate:rate,fps:+(renderedFrames*1000/total).toFixed(2),rafFps:+(gaps.length*1000/total).toFixed(2),rafP95Ms:+sorted[Math.floor(sorted.length*.95)].toFixed(2),scriptMs:+delta('ScriptDuration').toFixed(1),layoutMs:+delta('LayoutDuration').toFixed(1),taskMs:+delta('TaskDuration').toFixed(1),...stats};report.results.push(row);console.log(row);await context.close();
 }
 await fs.mkdir('release/toy',{recursive:true});await fs.writeFile('release/toy/unified-mobile-performance.json',JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r))}
