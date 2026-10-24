import {chromium} from 'playwright';
const b=await chromium.launch({channel:'chrome',headless:true});try{
const p=await b.newPage({viewport:{width:1200,height:600}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:3010/?clean=1&motion=1&scenario=circle',{waitUntil:'networkidle'});
await p.waitForFunction(()=>document.documentElement.dataset.cleanReady==='1');
const report=await p.evaluate(()=>new Promise(resolve=>{const gaps=[];let last=performance.now(),start=last;const observer=new PerformanceObserver(list=>list.getEntries().forEach(e=>longTasks.push(e.duration)));const longTasks=[];observer.observe({entryTypes:['longtask']});function tick(now){gaps.push(now-last);last=now;if(now-start<4000)requestAnimationFrame(tick);else{observer.disconnect();gaps.sort((a,b)=>a-b);resolve({frames:gaps.length,fps:gaps.length*1000/(now-start),p95:gaps[Math.floor(gaps.length*.95)],max:Math.max(...gaps),longTasks:longTasks.length,images:document.images.length,meshSvg:document.querySelectorAll('.live-mesh').length})}}requestAnimationFrame(tick)}));console.log(JSON.stringify({report,errors}));
}finally{await b.close()}
