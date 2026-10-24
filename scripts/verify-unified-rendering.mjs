import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {chromium} from '../skin-lab/node_modules/playwright/index.mjs';
const base=process.env.RENDER_TEST_URL||'http://localhost:3000/halfne-studio-bilibili-toy/';
const b=await chromium.launch({channel:'chrome',headless:true}),report={base,errors:[],screens:[],comparisons:[]};
await fs.mkdir('screenshots/unified-renderer',{recursive:true});
try{
 for(const dpr of [1,2,3,4]){
  const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:dpr,isMobile:true,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  for(const skin of ['miku','whale']){
   await p.goto(base+'?skin='+skin,{waitUntil:'networkidle'});await p.waitForSelector('canvas[data-renderer=webgl][data-ready="1"]');await p.waitForTimeout(400);
   const data=await p.locator('canvas[data-renderer=webgl]').evaluate(c=>({w:c.width,h:c.height,cssW:c.getBoundingClientRect().width,cssH:c.getBoundingClientRect().height,dataset:{...c.dataset}}));
   assert(Math.abs(data.w-data.cssW*dpr)<=1);assert(Math.abs(data.h-data.cssH*dpr)<=1);assert.equal(data.dataset.meshCount,skin==='miku'?'0':'14');assert.equal(data.dataset.runtime,'compiled-v2');assert.equal(data.dataset.drawCalls,'1');assert.equal(data.dataset.resolutionPolicy,'native-screen-hd-tiles');if(dpr>=3)assert(+data.dataset.hdTiles>0);
   report.screens.push({skin,dpr,...data});
   if(dpr===3){await p.locator('.stage-scaler-box').screenshot({path:`screenshots/unified-renderer/${skin}-gpu-dpr3.png`});const gpu=await p.locator('.stage-scaler-box').screenshot();
    await p.goto(base+'?skin='+skin+'&renderer=dom',{waitUntil:'networkidle'});await p.waitForSelector('.miku img');await p.waitForTimeout(1000);const dom=await p.locator('.stage-scaler-box').screenshot();
    const diff=await p.evaluate(async pair=>{const images=await Promise.all(pair.map(async s=>{const i=new Image();i.src='data:image/png;base64,'+s;await i.decode();return i}));let data=[];for(const i of images){const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d');g.drawImage(i,0,0);data.push(g.getImageData(0,0,i.width,i.height).data)}let total=0,bad=0;for(let j=0;j<data[0].length;j+=4){let pixel=0;for(let k=0;k<3;k++)pixel+=Math.abs(data[0][j+k]-data[1][j+k]);total+=pixel;if(pixel>60)bad++}return {meanChannelDifference:total/(data[0].length/4*3),largePixelDifference:bad/(data[0].length/4)}},[gpu.toString('base64'),dom.toString('base64')]);report.comparisons.push({skin,...diff});assert(diff.meanChannelDifference<4,'GPU/DOM mismatch '+skin+': '+JSON.stringify(diff));
   }
  }
  await c.close();
 }
 const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});p.on('pageerror',e=>report.errors.push(e.message));await p.goto(base,{waitUntil:'networkidle'});
 for(let i=0;i<4;i++)for(const name of ['初音','大肥鱼']){await p.getByRole('button',{name:'切换角色',exact:true}).click();await p.getByRole('button',{name,exact:true}).click();await p.waitForSelector('canvas[data-ready="1"]');assert.equal(await p.locator('canvas[data-renderer=webgl]').count(),1)}
 // A lost context still has the common compatibility renderer for both skins.
 await p.locator('canvas[data-renderer=webgl]').evaluate(c=>c.getContext('webgl').getExtension('WEBGL_lose_context').loseContext());await p.waitForSelector('.miku img');assert.equal(await p.locator('canvas[data-renderer=webgl]').count(),0);
 report.switchRoundtrips=4;report.contextFallback=true;assert.deepEqual(report.errors,[]);await fs.writeFile('release/toy/unified-renderer-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await b.close()}
