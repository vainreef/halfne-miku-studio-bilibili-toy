import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {comparisonView,focusRegions} from '../src/comparisonView.js';
const args=process.argv.slice(2);
if(args.includes('--help')){
 console.log(`Capture: --focus NAME | --crop x,y,width,height; --zoom 1..12; --hide node.path,node.path
Focus: ${Object.keys(focusRegions).join(', ')}
Coordinates: shared 1254×1254 source artboard. --zoom multiplies the crop fit.
--hide affects model layers only, not the flat reference.
Default: exact initial neutral pose, frozen physics, no pointer/keyboard input, yaw 0.
Only explicit --motion or --pose left/right/... enables simulation.
Example: --focus face --yaw 0 --out skin-lab/screenshots/face-detail`);
 process.exit(0);
}
const get=(k,v)=>{const i=args.indexOf(`--${k}`);return i<0?v:args[i+1]};
const root=fileURLToPath(new URL('..',import.meta.url));
const output=path.resolve(get('out',path.join(root,'screenshots')));
await fs.mkdir(output,{recursive:true});
const url=get('url','http://127.0.0.1:3010/');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:args.includes('--mobile')?{width:390,height:844}:{width:1640,height:1100},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const poses=args.includes('--all')?['center','left','right','up','down','nw','ne','sw','se']:[get('pose','center')];
const results=[];
try {
 for(const pose of poses){
  const neutral=!args.includes('--motion')&&pose==='center';
  const params=new URLSearchParams({scenario:get('scenario','sine'),neutral:neutral?'1':'0',yaw:get('yaw',neutral?'0':get('skin','whale')==='whale'?'-12':'0'),skin:get('skin','whale'),view:get('view','split'),pose,physics:get('physics','1'),eye:get('eye','happy'),mouth:get('mouth','happy'),phoneme:get('phoneme','1'),blink:args.includes('--blink')?'1':'0',rig:args.includes('--rig')?'1':'0',clean:args.includes('--ui')?'0':'1',capture:'1',frames:get('frames','90'),motion:args.includes('--motion')?'1':'0'});
  for(const key of ['focus','crop','zoom','hide'])if(get(key,null)!==null)params.set(key,get(key,''));
  if(get('hair-debug',null)!==null)params.set('hairDebug',get('hair-debug',''));
  const detail=comparisonView(params); // Validate before navigating.
  const target=new URL(url);for(const [key,value] of params)target.searchParams.set(key,value);
  await page.goto(target.href,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.documentElement.dataset.captureReady==='1',{timeout:15000});
  await page.waitForFunction(()=>[...document.querySelectorAll('canvas.live-mesh')].every(c=>c.dataset.meshReady==='1'));
  if(!args.includes('--ui'))await page.waitForFunction(()=>document.documentElement.dataset.cleanReady==='1');
  await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
  const mode=await page.evaluate(()=>document.documentElement.dataset.captureMode);
  if(neutral&&mode!=='neutral-initial')throw Error('Neutral screenshot lock missing');
  const suffix=[params.get('hairDebug')?'hair-'+params.get('hairDebug'):'',detail.focus,detail.crop&&!detail.focus?'crop-'+detail.crop.join('-'):'',detail.zoom!==1?'z'+detail.zoom:'',detail.hide.length?'hidden':''].filter(Boolean).join('-');
  const name=`${get('skin','whale')}-${pose}-${get('eye','happy')}-${get('mouth','happy')}${args.includes('--mobile')?'-mobile':''}${args.includes('--rig')?'-rig':''}${args.includes('--motion')?'-'+get('scenario','sine')+'-f'+get('frames','90'):''}${suffix?'-'+suffix:''}`;
  if(args.includes('--ui'))await page.screenshot({path:path.join(output,`${name}.png`),fullPage:true});
  else await page.locator('[data-testid="comparison"]').screenshot({path:path.join(output,`${name}.png`)});
  results.push({captureMode:mode,detail,url:target.href,pose,yaw:Number(params.get('yaw')),screenshot:`${name}.png`,images:await page.locator('.model img').count()});
 }
 if(errors.length)throw new Error(errors.join('\n'));
 await fs.writeFile(path.join(output,'capture-report.json'),JSON.stringify({url,results,errors},null,2));
 console.log(JSON.stringify({output,results},null,2));
}finally{await browser.close()}
