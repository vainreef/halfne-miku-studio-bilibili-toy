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
// Keep each material attached to its semantic rig node.
const polygonRect=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const pale=(r,g,b,a)=>a>100&&r>185&&g>185&&b>205&&Math.abs(r-g)<18&&b-r<65;
const paleFold=(r,g,b,a)=>pale(r,g,b,a)&&r<237&&b-r>7;
const apronBox=[395,830,248,210],apronPoly=[[475,831],[617,831],[640,910],[640,985],[597,1038],[472,1038],[397,990],[397,922],[448,860]];
const emblem=master.match(/<g id="whale-emblem-vector">[\s\S]*?<\/g>/)[0];
group('apron',trace('apron-cloth-edge',apronBox,apronPoly,pale,'url(#white)',true)+trace('apron-cloth-folds',apronBox,apronPoly,paleFold,'#ddd8f3')+emblem);
const skirtBox=[285,815,537,285],skirtPoly=[[467,815],[621,815],[692,880],[756,920],[815,967],[815,989],[746,1048],[629,1092],[524,1098],[409,1074],[321,1030],[287,978],[350,909],[426,868]];
const navy=(r,g,b,a)=>a>100&&r>15&&r<105&&g>25&&g<120&&b>65&&b<185&&b>g*1.2;
const hemPoly=[[289,938],[352,991],[438,1036],[551,1047],[658,1031],[745,988],[813,941],[820,986],[751,1050],[644,1091],[537,1099],[420,1090],[327,1044],[282,987]];
const skirt= '<path d="M465 811 Q542 798 621 811 L694 903 L755 966 L345 966 L400 881Z" fill="url(#navy)"/>'+trace('skirt-silhouette',skirtBox,skirtPoly,navy,'url(#navy)',true)+trace('hem-pleats',skirtBox,hemPoly,pale,'url(#white)',true)+trace('hem-folds',skirtBox,hemPoly,paleFold,'#e3dff7');
group('skirt-apron',skirt);
const bowBox=[805,380,145,106],bowPoly=polygonRect(bowBox);
const bow=(r,g,b,a)=>a>100&&r<135&&g>140&&b>195&&b>g*1.12;
const bowShade=(r,g,b,a)=>bow(r,g,b,a)&&g<168;
group('blue-hair-bow',trace('hair-bow-contour',bowBox,bowPoly,bow,'#38b6f2',true)+trace('hair-bow-folds',bowBox,bowPoly,bowShade,'#2295df'));
// One fixed expression only. The eye/mouth resource keys and renderer stay unchanged.
const eyeBox=[355,470,350,135],eyePoly=polygonRect(eyeBox);
const ink=(r,g,b,a)=>a>100&&r<100&&g<110&&b<150&&b>65;
const eyebrows='<path d="M428 444 Q437 454 446 458 M604 477 Q625 473 641 462" fill="none" stroke="#2d88e7" stroke-width="3" stroke-linecap="round"/>';
group('eyes-happyo',trace('fixed-eyes',eyeBox,eyePoly,ink,'url(#eyeInk)')+eyebrows);
const mouthBox=[483,593,70,72],mouthPoly=polygonRect(mouthBox);
const lip=(r,g,b,a)=>a>100&&r>180&&g<180&&b<195&&r>g*1.3;
const tongue=(r,g,b,a)=>lip(r,g,b,a)&&g>121;
group('mouth-happy1',trace('fixed-smile',mouthBox,mouthPoly,lip,'#ed696d',true)+trace('smile-inner',mouthBox,mouthPoly,tongue,'#ff8e92'));
await fs.writeFile(`${lab}/art/source/whale-master.svg`,master);
await fs.writeFile(`${lab}/art/rig/cloth-face-art-review.json`,JSON.stringify({source:'public/assets/whale-girl.png',coordinateSpace:[1254,1254],embeddedRaster:false,semanticLayersPreserved:true,report},null,2)+'\n');console.log(report);
