import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {chromium} from '../skin-lab/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:820,height:900},deviceScaleFactor:2});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:3000/halfne-studio-bilibili-toy/?skin=whale&renderer=dom',{waitUntil:'networkidle'});
 const result=await p.evaluate(async()=>{
  const base='/halfne-studio-bilibili-toy/src/';const {default:config}=await import(base+'whaleGirlModel.js');
  const {parseConfig,getInitPhysics,work}=await import(base+'Engine/core.js');
  const root=config.model,order=root.components.map(n=>n.id),head=root.components.find(n=>n.id==='head');
  // Reconstruct the previous painting order only: all authored functions/geometry
  // and coefficients are shared. Verify order changes did not change motion.
  const previous={...root,components:root.components.filter(n=>n!==head)};
  previous.components.push(head);
  const init=config.parseControl();let a=getInitPhysics(parseConfig(root,init)),b=getInitPhysics(parseConfig(previous,init));
  const secondaryA=config.createSecondaryMotion({diagnostics:false}),secondaryB=config.createSecondaryMotion({diagnostics:false});
  let maxDifference=0,comparisons=0;
  function compare(x,y){if(typeof x==='number'){const d=Math.abs(x-y);if(!Number.isFinite(d)||d>1e-8)throw Error('Motion changed '+x+' / '+y);maxDifference=Math.max(maxDifference,d);comparisons++}else if(x&&typeof x==='object'){if(Array.isArray(x)&&x[0]?.id){for(const n of x)compare(n,y.find(m=>m.id===n.id))}else for(const k of Object.keys(x)){if(k!=='markup')compare(x[k],y[k])}}else if(x!==y)throw Error('State changed')}
  for(let i=0;i<100;i++){
   const c=config.parseControl({mouseX:400+390*Math.sin(i*.15),mouseY:300+290*Math.cos(i*.13),keyInput:[]});let sa,sb;
   work(16.6667,root,c,a,v=>a=v,v=>{secondaryA.step(v,16.6667,true);sa=v},true);
   work(16.6667,previous,c,b,v=>b=v,v=>{secondaryB.step(v,16.6667,true);sb=v},true);compare(sa,sb);compare(a,b);
  }
  return {order,frames:100,comparisons,maxDifference};
 });
 const idx=id=>result.order.indexOf(id);for(const side of ['L','R']){assert(idx('arm'+side)<idx('frontLock'+side));assert(idx('head')<idx('frontLock'+side))}
 for(const mode of ['dom','gpu']){
  await p.goto('http://localhost:3000/halfne-studio-bilibili-toy/?skin=whale&renderer='+mode,{waitUntil:'networkidle'});if(mode==='gpu')await p.waitForSelector('canvas[data-ready="1"]');await p.waitForTimeout(600);await p.locator('.stage-scaler-box').screenshot({path:`screenshots/ui/hair-fixed-${mode}-neutral.png`});
  const r=await p.locator('.stage').boundingBox();for(const [x,y] of [[.05,.1],[.95,.1],[.95,.9],[.05,.9]]){await p.mouse.move(r.x+r.width*x,r.y+r.height*y);await p.waitForTimeout(150)}
  await p.getByRole('button',{name:'打开菜单',exact:true}).click();await p.getByRole('button',{name:'恢复初始姿态',exact:true}).click();await p.waitForTimeout(700);
 }
 assert.deepEqual(errors,[]);result.renderers=['dom','gpu'];result.errors=errors;await fs.writeFile('release/toy/hair-order-verification.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close()}
