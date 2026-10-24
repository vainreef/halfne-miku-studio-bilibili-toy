// Browser SVG bounds check: no mesh may crop the original vector artwork.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import resources from '../src/whale/resources.js';
import {hairSpecs,frontSpecs} from '../src/whale/hairTopology.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 const rows=await page.evaluate(({resources,specs})=>specs.map(spec=>{
  const src=resources[spec.path],doc=new DOMParser().parseFromString(decodeURIComponent(src.slice(src.indexOf(',')+1)),'image/svg+xml');
  const svg=document.importNode(doc.documentElement,true);document.body.append(svg);
  const b=svg.querySelector(':scope>g').getBBox();svg.remove();
  return {path:spec.path,bounds:[b.x,b.y,b.x+b.width,b.y+b.height],meshBounds:spec.box,
   covered:b.x>=spec.box[0]&&b.x+b.width<=spec.box[1]&&b.y>=spec.box[2]&&b.y+b.height<=spec.box[3]};
 }),{resources,specs:[...hairSpecs,...frontSpecs]});
 assert(rows.every(r=>r.covered),JSON.stringify(rows.filter(r=>!r.covered)));
 await fs.writeFile(new URL('../art/rig/hair-coverage-report.json',import.meta.url),JSON.stringify(rows,null,2)+'\n');
 console.log(`PASS: all ${rows.length} moving hair meshes contain their complete vector bounds`);
}finally{await browser.close()}
