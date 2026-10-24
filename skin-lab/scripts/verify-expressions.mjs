import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];const out=new URL('../screenshots/expressions/',import.meta.url);await fs.mkdir(out,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3010/expressions.html',{waitUntil:'networkidle'});
 const report=await page.evaluate(async()=>{
 const {default:whale}=await import('/src/model.js'),{default:classic}=await import('/@fs/Users/freevian/Developer/halfne-miku-studio-reborn/src/defaultModel.js'),{default:resources}=await import('/src/whale/resources.js'),{getConfig}=await import('/@fs/Users/freevian/Developer/halfne-miku-studio-reborn/src/Engine/modelUtils.js'),{parseConfig}=await import('/@fs/Users/freevian/Developer/halfne-miku-studio-reborn/src/Engine/core.js');
 const eyes=['happy','jaded','oo','xx','aa','sideglance','eheh','pumped'],eyeKeys=['EyeHappy','EyeJaded','EyeO_O','Eye*_*','Eye@_@','EyeSideGlance','EyeEheh','EyePumped'],mouths=['happy','neutral','cat','angry','pout','drool','duck','tongue'],mouthKeys=['MouthHappy','MouthNeutral','MouthCat','MouthAngry','MouthPout','MouthDrool','MouthDuck','MouthTongue'],phonemes=['MouthMM','MouthAA','MouthEE','MouthOO','MouthEH','MouthOH','MouthTeeth'];
 let combinations=0;const failures=[];
 for(let e=0;e<8;e++)for(const closed of [false,true])for(let m=0;m<8;m++)for(let p=0;p<7;p++){
  const keyInput=[eyeKeys[e],mouthKeys[m],phonemes[p],...(closed?['EyeBlink']:[])],control=whale.parseControl({keyInput}),original=classic.parseControl({keyInput});
  for(const k of ['eyeType','eyeOpen','mouthType','mouth'])if(control[k]!==original[k])failures.push('Protocol '+k);
  const state=parseConfig(whale.model,control),eye=eyes[e]+(closed?'c':'o'),mouth=mouths[m]+(p+1);
  if(getConfig(state,'head.face.eyes').resource!==resources['head.face.eyes:'+eye])failures.push(eye);
  if(getConfig(state,'head.face.mouth').resource!==resources['head.face.mouth:'+mouth])failures.push(mouth);
  combinations++;
 }
 // Ensure SVG resources actually decode in the browser, not just dictionary keys.
 for(const [key,url] of Object.entries(resources).filter(([k])=>k.includes(':'))){const img=new Image();img.src=url;try{await img.decode()}catch{failures.push('Decode '+key)}}
 return {combinations,eyeStates:Object.keys(resources).filter(k=>k.startsWith('head.face.eyes:')).length,mouthStates:Object.keys(resources).filter(k=>k.startsWith('head.face.mouth:')).length,uniqueMouths:new Set(Object.entries(resources).filter(([k])=>k.startsWith('head.face.mouth:')).map(([,v])=>v)).size,failures};
 });
 assert.equal(report.eyeStates,16);assert.equal(report.mouthStates,56);assert.equal(report.uniqueMouths,56);assert.deepEqual(report.failures,[]);
 assert.equal(await page.locator('.card').count(),72);await page.screenshot({path:new URL('classic-whale-atlas.png',out).pathname,fullPage:true});
 await page.goto('http://127.0.0.1:3010/',{waitUntil:'networkidle'});
 await page.getByLabel('眼神',{exact:true}).selectOption('xx');await page.getByLabel('嘴部风格',{exact:true}).selectOption('tongue');await page.getByLabel('口型',{exact:true}).selectOption('2');await page.waitForTimeout(180);
 assert.match(decodeURIComponent(await page.locator('[data-testid=model-stage] [data-id=mouth]>img').getAttribute('src')),/ff909b/);
 await page.getByLabel('闭眼',{exact:true}).check();await page.waitForTimeout(100);
 assert.deepEqual(errors,[]);report.errors=errors;report.uiControls=true;
 await fs.writeFile(new URL('report.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close()}
