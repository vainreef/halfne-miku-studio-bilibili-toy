import fs from 'node:fs/promises';import {chromium} from '../skin-lab/node_modules/playwright/index.mjs';
const b=await chromium.launch({channel:'chrome',headless:true});
try{const p=await b.newPage();await p.goto('http://127.0.0.1:3000/halfne-studio-bilibili-toy/?skin=miku',{waitUntil:'networkidle'});
 const report=await p.evaluate(async()=>{
  const base='/halfne-studio-bilibili-toy/src/',{compileModel}=await import(base+'Engine/compiledModel.js'),{parseConfig,getInitPhysics,work}=await import(base+'Engine/core.js'),{default:config}=await import(base+'whaleGirlModel.js');
  const compiled=compileModel(config.model),secondary=config.createSecondaryMotion({diagnostics:false});let physics=getInitPhysics(parseConfig(config.model,config.parseControl()));const timings=[];
  for(let i=0;i<400;i++){const c=config.parseControl({mouseX:400+300*Math.sin(i*.1),mouseY:300+200*Math.cos(i*.1),keyInput:[]}),t=performance.now();work(1000/60,config.model,c,physics,v=>physics=v,state=>secondary.step(state,1000/60,true),true,(_,c,p)=>compiled.evaluate(c,p));if(i>30)timings.push(performance.now()-t);}
  const url=URL.createObjectURL(new Blob(['onmessage=e=>postMessage(e.data,[e.data.buffer])'],{type:'text/javascript'})),worker=new Worker(url),roundTrips=[];let payload=new Float32Array(1152*9);
  try{for(let i=0;i<160;i++){const start=performance.now();payload=await new Promise((resolve,reject)=>{worker.onmessage=e=>resolve(e.data);worker.onerror=reject;worker.postMessage(payload,[payload.buffer]);});if(i>10)roundTrips.push(performance.now()-start);}}finally{worker.terminate();URL.revokeObjectURL(url)}
  const stats=a=>{a.sort((x,y)=>x-y);return {medianMs:a[Math.floor(a.length*.5)],p95Ms:a[Math.floor(a.length*.95)]}};
  return {environment:'Unthrottled desktop Chrome microprobe; not a complete Worker renderer or physical phone test',engine:stats(timings),emptyWorkerRoundTrip41KB:stats(roundTrips)};
 });await fs.writeFile('release/toy/worker-overhead-probe.json',JSON.stringify(report,null,2));console.log(report);
}finally{await b.close()}
