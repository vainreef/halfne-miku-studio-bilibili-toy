// Head contours share the reference coordinate frame; each remains an independent rig layer.
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
function trace(name,box,polygon,test,fill,largest=false){const [ox,oy,w,h]=box;const mask=Array.from({length:w*h},(_,i)=>{const x=ox+i%w,y=oy+Math.floor(i/w),o=(y*1254+x)*4;return inside(x,y,polygon)&&test(...pixels.subarray(o,o+4))?1:0});let loops=traceContours(mask,w,h,ox,oy,{epsilon:.9,minArea:6});if(largest)loops=loops.sort((a,b)=>area(b)-area(a)).slice(0,1);report.push({name,loops:loops.length,points:loops.map(p=>p.length)});return `<path data-art="${name}" d="${curvePath(loops,.12)}" fill="${fill}" fill-rule="evenodd"/>`}
let master=await fs.readFile(`${lab}/art/source/whale-master.svg`,'utf8');
function group(id,body){const re=new RegExp(`(<g id="${id}" data-node="[^"]+"[^>]*>)[\\s\\S]*?(</g><!-- /part -->)`);if(!re.test(master))throw Error(id);master=master.replace(re,(_,a,b)=>a+body+b)}
const blue=(r,g,b,a)=>a>100&&b>150&&b>r*1.3&&b>g*1.1;
const cyan=(r,g,b,a)=>a>100&&r>60&&g>145&&b>210&&g>r*1.5;
const navy=(r,g,b,a)=>a>100&&r>25&&r<110&&g>30&&g<125&&b>65&&b<165&&b>g*1.15;
const parts=[
 ['sleeve-left',[393,700,91,126],[[433,700],[471,707],[477,744],[448,783],[420,812],[394,782],[398,737]],'<path d="M420 755 L438 776 L408 817 L388 801Z" fill="url(#navy)"/>'],
 ['sleeve-right',[625,700,117,126],[[634,700],[680,705],[711,741],[735,783],[710,819],[678,801],[644,775],[625,742]],'<path d="M679 748 L710 762 L738 790 L716 814 L681 789Z" fill="url(#navy)"/>'],
 ['forearm-left',[360,758,113,115],[[400,758],[432,777],[464,827],[459,840],[421,865],[372,823],[360,795]],'<path d="M388 782 L410 784 L438 821 L417 843 L385 815Z" fill="url(#navy)"/>'],
 ['forearm-right',[635,755,130,125],[[695,755],[737,771],[762,789],[762,816],[701,861],[677,867],[635,838],[677,800]],'<path d="M715 779 L740 790 L734 813 L699 846 L676 828Z" fill="url(#navy)"/>'],
];
for(const [id,box,poly,hidden] of parts){
 let extra='';
 if(id.startsWith('forearm')){
  const m=master.match(new RegExp('<g id="'+id+'"[\\s\\S]*?<!-- /part -->'))[0];
  extra=(m.match(/<path data-art="[^"]+-cuff"[^>]+\/>/)||[])[0]||'';
 }
 group(id,hidden+trace(id+'-reference-edge',box,poly,navy,'url(#navy)',true)+extra);
}
// Cuff mask is constrained to the wrist band, explicitly excluding the apron back tie.
const cuff=(r,g,b,a)=>a>100&&r>95&&r<202&&g>110&&g<207&&b>145&&b<238&&b>g*1.06&&b-r<80;
const cuffPoly=[[655,815],[704,846],[679,872],[631,842]];
const rightCuff=trace('right-cuff',[630,812,80,65],cuffPoly,cuff,'#a5aed5',true);
const current=master.match(/<g id="forearm-right"[\s\S]*?<!-- \/part -->/)[0];
master=master.replace(current,current.replace(/<path data-art="right-cuff"[^>]+\/>/,rightCuff));
master=master.replace('<stop stop-color="#2544b5"/>','<stop stop-color="#253fa8"/>').replace('<stop offset=".53" stop-color="#3168df"/>','<stop offset=".53" stop-color="#2b5bca"/>').replace('<stop offset="1" stop-color="#2f9af6"/>','<stop offset="1" stop-color="#2f94ef"/>');
await fs.writeFile(`${lab}/art/source/whale-master.svg`,master);
await fs.writeFile(`${lab}/art/rig/arm-art-review.json`,JSON.stringify({source:'public/assets/whale-girl.png',coordinateSpace:[1254,1254],embeddedRaster:false,separatePalms:true,report},null,2)+'\n');console.log(report);
