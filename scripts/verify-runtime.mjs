import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {chromium} from '../skin-lab/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage();await p.goto('http://127.0.0.1:3000/halfne-studio-bilibili-toy/?skin=miku',{waitUntil:'networkidle'});
 const report=await p.evaluate(async()=>{
  const base='/halfne-studio-bilibili-toy/src/';
  const {compileModel,snapshotRenderTree}=await import(base+'Engine/compiledModel.js'),{parseConfig,getInitPhysics,work}=await import(base+'Engine/core.js');
  const {default:classic}=await import(base+'defaultModel.js'),{default:whale}=await import(base+'whaleGirlModel.js');
  // Compare the original evaluator with the compiled evaluator using the same
  // current skin motion; historical art/physics fixtures remain archived.
  const {default:resources}=await import('/halfne-studio-bilibili-toy/skin-lab/src/whale/resources.js');
  const reports=[];
  for(const [name,config] of [['miku',classic],['whale',whale]]){
   const evaluator=compileModel(config.model),initial=config.parseControl({mouseX:400,mouseY:300,keyInput:[]});
   let pa=getInitPhysics(parseConfig(config.model,initial)),pb=getInitPhysics(parseConfig(config.model,initial)),maxDifference=0,comparisons=0;
   const sa=config.createSecondaryMotion?.({diagnostics:false}),sb=config.createSecondaryMotion?.({diagnostics:false});
   function compare(a,b,path=''){
    if(typeof a==='number'&&typeof b==='number'){if(Number.isNaN(a)&&Number.isNaN(b))return;const d=Math.abs(a-b);if(!Number.isFinite(d)||d>1e-8)throw Error(name+' mismatch '+path+': '+a+' / '+b);maxDifference=Math.max(d,maxDifference);comparisons++;return;}
    if(a&&typeof a==='object'){
     if(!b||typeof b!=='object')throw Error('Different object '+path);
     const ka=Object.keys(a).sort(),kb=Object.keys(b).sort();if(ka.join('|')!==kb.join('|'))throw Error('Different keys '+path+': '+ka+' / '+kb);
     for(const k of ka){if(k==='markup')continue;compare(a[k],b[k],path+'.'+k);}return;
    }
    if(a!==b)throw Error('Different value '+path);
   }
   for(let i=0;i<150;i++){
    const c=config.parseControl({mouseX:400+350*Math.sin(i*.17),mouseY:300+290*Math.cos(i*.13),keyInput:[['EyeHappy','EyeJaded','EyeO_O','Eye*_*','Eye@_@','EyeSideGlance','EyeEheh','EyePumped'][i%8],['MouthAA','MouthEE','MouthOO','MouthMM'][i%4]]}),dt=[0,8.333333,16.666667,33.333333,50][i%5];
    const enabled=i%23!==0;
    let a,b;work(dt,config.model,c,pa,v=>pa=v,state=>{sa?.step(state,dt,enabled);a=state},enabled);
    work(dt,config.model,c,pb,v=>pb=v,state=>{sb?.step(state,dt,enabled);b=state},enabled,(_,control,physics)=>evaluator.evaluate(control,physics));
    compare(a,b);compare(pa,pb,'physics');
   }
   const snapshot=snapshotRenderTree(evaluator.evaluate(initial,pa)),saved=JSON.stringify(snapshot);
   evaluator.evaluate(config.parseControl({mouseX:790,mouseY:10,keyInput:[]}),pb);
   if(JSON.stringify(snapshot)!==saved)throw Error('Mutable React snapshot '+name);
   reports.push({name,snapshotImmutable:true,frames:150,nodeCount:evaluator.nodeCount,functionCount:evaluator.functionCount,comparisons,maxDifference});
  }
  return reports;
 });
 assert(report.every(r=>r.maxDifference<1e-8));await fs.writeFile('release/toy/runtime-parity.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close()}
