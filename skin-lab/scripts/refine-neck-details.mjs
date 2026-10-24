// Rebuild only front garment details from reference-visible contours.
// Independent vector nodes and hidden joint overlaps remain intact.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {traceContours,curvePath} from './vector-contours.mjs';
const lab=fileURLToPath(new URL('..',import.meta.url));
const src='data:image/png;base64,'+(await fs.readFile(`${lab}/../public/assets/whale-girl.png`)).toString('base64');
const browser=await chromium.launch({channel:'chrome',headless:true});let pixels;
try{const page=await browser.newPage();const encoded=await page.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');c.width=c.height=1254;const a=c.getContext('2d');a.drawImage(i,0,0);const d=a.getImageData(0,0,1254,1254).data;let raw='';for(let k=0;k<d.length;k+=32768)raw+=String.fromCharCode(...d.subarray(k,k+32768));return btoa(raw)},src);pixels=Buffer.from(encoded,'base64')}finally{await browser.close()}
const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes};
const area=p=>Math.abs(p.reduce((s,v,i)=>{const q=p[(i+1)%p.length];return s+v[0]*q[1]-q[0]*v[1]},0)/2);
const report=[];
function trace(name,box,polygon,test,fill,largest=false){const [ox,oy,w,h]=box;const mask=Array.from({length:w*h},(_,i)=>{const x=ox+i%w,y=oy+Math.floor(i/w),o=(y*1254+x)*4;return inside(x,y,polygon)&&test(...pixels.subarray(o,o+4))?1:0});let loops=traceContours(mask,w,h,ox,oy,{epsilon:.65,minArea:6});if(largest)loops=loops.sort((a,b)=>area(b)-area(a)).slice(0,1);report.push({name,loops:loops.length,points:loops.map(p=>p.length)});return `<path data-art="${name}" d="${curvePath(loops,.12)}" fill="${fill}" fill-rule="evenodd"/>`}
let master=await fs.readFile(`${lab}/art/source/whale-master.svg`,'utf8');
function group(id,body){const re=new RegExp(`(<g id="${id}" data-node="[^"]+"[^>]*>)[\\s\\S]*?(</g><!-- /part -->)`);if(!re.test(master))throw Error(id);master=master.replace(re,(_,a,b)=>a+body+b)}
const rect=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const pale=(r,g,b,a)=>a>100&&r>185&&g>185&&b>205&&Math.abs(r-g)<18&&b-r<65;
const paleFold=(r,g,b,a)=>pale(r,g,b,a)&&r<237&&b-r>7;
// Reference neckline, including hidden extension under the chin.
const skin=(r,g,b,a)=>a>100&&r>235&&g>155&&g<225&&b>130&&b<225&&r-g>25;
const neckBox=[537,669,64,49];
group('neck','<path d="M539 663 L593 663 L592 685 L540 690Z" fill="#ffc0ad"/>'+trace('neck-visible',neckBox,rect(neckBox),skin,'#ffc0ad',true).replace('fill="#ffc0ad" fill-rule','fill="#ffc0ad" stroke="#ffc0ad" stroke-width=".65" fill-rule'));
// The original crop stopped at x608 and turned the right collar into a bulb.
// Preserve a continuous collar shoulder under the separate white frill.
const collarBox=[476,680,148,71],collarPoly=[[476,680],[540,680],[545,706],[579,681],[604,680],[606,698],[624,698],[620,719],[609,722],[605,730],[579,735],[547,729],[523,738],[477,716]];
const old=master.match(/<g id="collar"[\s\S]*?<!-- \/part -->/)[0];
const buttons=(old.match(/<path data-art="bib-buttons"[^>]+\/>/)||[])[0]||'';
group('collar',trace('collar-continuous',collarBox,collarPoly,pale,'#e4dff7')+trace('collar-lavender-fold',collarBox,collarPoly,paleFold,'#d7d1f4')+buttons);
// Remove tracing seams around the pin, keeping all three materials separate.
master=master.replace(/<path data-art="bow-(?:blue-pin|leaf|carrot)"[^>]*\/>/g,g=>g.replace(/ stroke(?:-width|-linejoin)?="[^"]*"/g,''));
master=master.replace(/(<path data-art="bow-(blue-pin|leaf|carrot)"[^>]*fill="([^"]+)")([^>]*\/>)/g,(_,a,b,c,d)=>a+' stroke="'+c+'" stroke-width=".45" stroke-linejoin="round"'+d);
master=master.replace(/<path data-art="bow-outline"[^>]*\/>/g,g=>g.replace(/ stroke(?:-width|-linejoin)?="[^"]*"/g,'').replace('/>',' stroke="#30376a" stroke-width=".4" stroke-linejoin="round"/>'));
await fs.writeFile(`${lab}/art/source/whale-master.svg`,master);
await fs.writeFile(`${lab}/art/rig/neck-detail-review.json`,JSON.stringify({source:'public/assets/whale-girl.png',scope:'neck + collar only; skin and collar remain independent nodes',report},null,2)+'\n');
console.log(report);
