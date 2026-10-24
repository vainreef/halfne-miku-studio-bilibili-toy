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
const parts=[
 ['bangs-left',[220,185,270,425],[[345,190],[488,190],[475,300],[448,369],[419,415],[391,457],[370,493],[348,548],[317,584],[283,604],[230,604],[225,555],[245,455],[275,345]]],
 ['bangs-center',[420,185,235,390],[[420,185],[655,185],[650,330],[630,375],[617,438],[604,482],[596,528],[578,574],[478,574],[440,541],[427,460],[420,390]]],
 ['bangs-right',[553,185,290,390],[[553,185],[801,185],[840,300],[840,574],[733,574],[714,532],[695,512],[673,475],[649,426],[625,373],[610,331],[585,270]]],
];
for(const [id,box,poly] of parts){
 let body=trace(id+'-contour',box,poly,blue,'url(#hair)',true)+trace(id+'-highlight',box,poly,cyan,'#6bc8fa');
 // Dark accents belong to the front cap, not the eyebrows/face layer.
 if(id==='bangs-center')body+='<path d="M437 268 Q490 214 531 233 Q484 242 437 268Z" fill="#244dbd"/>';
 if(id==='bangs-right')body+='<path d="M557 234 Q603 192 670 302 Q613 246 557 234Z" fill="#244dbd"/>';
 group(id,body);
}
const box=[280,105,602,305],poly=[[280,105],[882,105],[882,410],[280,410]];
const white=(r,g,b,a)=>a>100&&r>185&&g>185&&b>210&&b-r<65;
const shade=(r,g,b,a)=>white(r,g,b,a)&&r<234&&b-r>9;
group('maid-headdress',trace('lace-fan',box,poly,white,'url(#white)',true)+trace('lace-folds',box,poly,shade,'#dad6f5'));
await fs.writeFile(`${lab}/art/source/whale-master.svg`,master);
await fs.writeFile(`${lab}/art/rig/head-art-review.json`,JSON.stringify({source:'public/assets/whale-girl.png',coordinateSpace:[1254,1254],embeddedRaster:false,independentBangs:true,report},null,2)+'\n');console.log(report);
