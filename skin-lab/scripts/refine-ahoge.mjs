import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {traceContours} from './vector-contours.mjs';
const lab=fileURLToPath(new URL('..',import.meta.url));
const browser=await chromium.launch({channel:'chrome',headless:true});
let mask;
try{const page=await browser.newPage();const src='data:image/png;base64,'+(await fs.readFile(`${lab}/../public/assets/whale-girl.png`)).toString('base64');mask=await page.evaluate(async src=>{const im=new Image();im.src=src;await im.decode();const c=document.createElement('canvas');c.width=255;c.height=185;const x=c.getContext('2d');x.drawImage(im,405,5,255,185,0,0,255,185);const p=x.getImageData(0,0,255,185).data;return Array.from({length:255*185},(_,i)=>p[i*4+3]>100&&p[i*4+2]>150&&p[i*4+2]>p[i*4]*1.4&&p[i*4+2]>p[i*4+1]*1.2?1:0)},src)}finally{await browser.close()}
const area=p=>Math.abs(p.reduce((s,v,i)=>{const q=p[(i+1)%p.length];return s+v[0]*q[1]-q[0]*v[1]},0)/2);
const contour=traceContours(mask,255,185,405,5,{epsilon:.65,minArea:10}).sort((a,b)=>area(b)-area(a))[0];
const anchor=[583,181];let tip=0;for(let i=1;i<contour.length;i++)if(Math.hypot(contour[i][0]-anchor[0],contour[i][1]-anchor[1])<Math.hypot(contour[tip][0]-anchor[0],contour[tip][1]-anchor[1]))tip=i;
contour[tip]=anchor;
// Keep a sharp fixed root; the remaining contour is a smooth editable cubic path.
let d='M'+contour[0].join(' '),fmt=v=>Number(v.toFixed(2));
for(let i=0;i<contour.length;i++){const a=contour[(i+contour.length-1)%contour.length],b=contour[i],c=contour[(i+1)%contour.length],e=contour[(i+2)%contour.length],t1=i===tip?0:.13,t2=(i+1)%contour.length===tip?0:.13;d+='C'+[b[0]+(c[0]-a[0])*t1,b[1]+(c[1]-a[1])*t1,c[0]-(e[0]-b[0])*t2,c[1]-(e[1]-b[1])*t2,...c].map(fmt).join(' ')}
d+='Z';
const file=`${lab}/art/source/whale-master.svg`;let master=await fs.readFile(file,'utf8');
if(!master.includes('id="ahogeBlue"'))master=master.replace('</defs>','<linearGradient id="ahogeBlue" x1="470" y1="20" x2="620" y2="180" gradientUnits="userSpaceOnUse"><stop stop-color="#285fe1"/><stop offset="1" stop-color="#2454d1"/></linearGradient></defs>');
master=master.replace(/(<g id="ahoge" data-node="head.ahoge">)[\s\S]*?(<\/g><!-- \/part -->)/,(_,a,b)=>a+`<path data-anchor="583,181" d="${d}" fill="url(#ahogeBlue)"/>`+b);
await fs.writeFile(file,master);
await fs.writeFile(`${lab}/art/rig/ahoge-anchor.json`,JSON.stringify({sourceAnchor:anchor,node:'head.ahoge',resourceCenter:[400,300],shape:'cubic vector contour',outline:false,anchorIsSharpTip:true,points:contour.length},null,2)+'\n');
console.log('Curl: sharp root (583,181), smooth source contour, no outline.');
