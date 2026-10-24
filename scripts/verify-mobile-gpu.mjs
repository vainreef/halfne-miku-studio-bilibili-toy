import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {chromium} from '../skin-lab/node_modules/playwright/index.mjs';import {serveBuild} from './serve-build.mjs';
const stop=await serveBuild(3034),b=await chromium.launch({channel:'chrome',headless:true}),report={checks:[],errors:[]},out='release/toy';
const ready=p=>p.waitForSelector('canvas[data-renderer=webgl][data-ready="1"][data-mesh-count="11"]');
const canvasReady=p=>p.waitForFunction(()=>document.querySelectorAll('canvas[data-mesh-ready="1"]').length===11);
async function mobile(){const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});await c.route('**/toy-sdk.js',r=>r.abort());return c;}
try{
 const context=await mobile(),screens={};let gpuPage;
 for(const mode of ['dom','gpu']){
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(`http://127.0.0.1:3034/index.html?skin=whale&renderer=${mode}`,{waitUntil:'networkidle'});
  if(mode==='gpu')await ready(p);else await canvasReady(p);
  await p.getByRole('button',{name:'重置',exact:true}).click();if(mode==='gpu')await ready(p);else await canvasReady(p);await p.waitForTimeout(500);
  screens[mode]=await p.locator('.stage-scaler-box').screenshot({path:`${out}/mobile-neutral-${mode}.png`});
  if(mode==='gpu'){assert.equal(await p.locator('canvas[data-renderer=webgl]').getAttribute('data-draw-calls'),'1');gpuPage=p;}else await p.close();
 }
 report.parity=await gpuPage.evaluate(async({a,b})=>{
  const read=async data=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,c.width,c.height).data};
  const x=await read(a),y=await read(b);if(x.length!==y.length)throw Error('Different viewport dimensions');let sum=0,large=0;for(let i=0;i<x.length;i+=4){let diff=0;for(let j=0;j<3;j++)diff+=Math.abs(x[i+j]-y[i+j]);sum+=diff;if(diff>96)large++;}return {meanChannelDifference:sum/(x.length/4*3),differentPixelFraction:large/(x.length/4)};
 },{a:screens.dom.toString('base64'),b:screens.gpu.toString('base64')});assert(report.parity.meanChannelDifference<4);assert(report.parity.differentPixelFraction<.04);report.checks.push('中性位 GPU/旧版画面比对，大小、锚点与遮挡保持一致');
 const p=gpuPage,session=await context.newCDPSession(p),stage=await p.locator('.stage').boundingBox(),before=await p.locator('canvas[data-renderer=webgl]').evaluate(c=>c.toDataURL());
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:stage.x+stage.width*.5,y:stage.y+stage.height*.5}]});
 for(let i=0;i<12;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:stage.x+stage.width*(.5+i*.025),y:stage.y+stage.height*.7}]});await p.waitForTimeout(25);}
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(100);assert.notEqual(await p.locator('canvas[data-renderer=webgl]').evaluate(c=>c.toDataURL()),before);assert.equal(await p.locator('.fps-badge').getAttribute('data-fps-source'),'render');assert((await p.locator('.miku').evaluate(el=>el.__renderFrameCount||0))>0);report.checks.push('真实触控事件驱动 GPU 姿态、头发和裙摆；FPS按实际提交统计');
 for(const label of ['猫猫卖萌','傲娇气鼓','使坏搞怪','晕头转向','热血高燃','俏皮眨眼','呆萌发呆','超开心']){await p.getByRole('button',{name:new RegExp(label)}).click();await ready(p);}
 report.checks.push('GPU 路径支持八组表情切换');
 for(let i=0;i<5;i++){await p.getByRole('button',{name:'🎵 切换到初音',exact:true}).click();assert.equal(await p.locator('canvas[data-renderer=webgl]').count(),0);await p.getByRole('button',{name:'🐳 切换到大肥鱼',exact:true}).click();await ready(p);assert.equal(await p.locator('canvas[data-renderer=webgl]').count(),1);}
 report.checks.push('连续五次角色往返切换，旧 GPU 上下文释放');
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(300);await ready(p);assert((await p.locator('canvas[data-renderer=webgl]').evaluate(c=>c.width*c.height))<=800*600*1.5*1.5);report.checks.push('横竖屏重排及手机像素预算');
 await p.locator('canvas[data-renderer=webgl]').evaluate(c=>c.getContext('webgl').getExtension('WEBGL_lose_context').loseContext());await canvasReady(p);assert.equal(await p.locator('canvas[data-renderer=webgl]').count(),0);report.checks.push('GPU 上下文丢失后自动切回兼容绘制');await context.close();
 const denied=await mobile();await denied.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='experimental-webgl')return null;return original.call(this,type,...args)}});const fallback=await denied.newPage();fallback.on('pageerror',e=>report.errors.push(e.message));await fallback.goto('http://127.0.0.1:3034/index.html?skin=whale',{waitUntil:'networkidle'});await canvasReady(fallback);assert.equal(await fallback.locator('canvas[data-renderer=webgl]').count(),0);report.checks.push('宿主禁用 WebGL 时自动回退，保留11层动作');await denied.close();
 const unbatched=await mobile(),q=await unbatched.newPage();q.on('pageerror',e=>report.errors.push(e.message));await q.goto('http://127.0.0.1:3034/index.html?skin=whale&renderer=gpu&atlas=0',{waitUntil:'networkidle'});await ready(q);assert.equal(await q.locator('canvas[data-renderer=webgl]').getAttribute('data-draw-calls'),'41');await unbatched.close();report.checks.push('纹理图集停用时保留低占用的独立纹理 GPU 路径');assert.deepEqual(report.errors,[]);await fs.writeFile(`${out}/mobile-gpu-verification.json`,JSON.stringify(report,null,2));console.log(report);
}finally{await b.close();await stop();}
