// Reference-visible hand/foot contours, plus hidden upper-leg overlap for animation.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {traceContours,curvePath} from './vector-contours.mjs';
const lab=fileURLToPath(new URL('..',import.meta.url));
const src='data:image/png;base64,'+(await fs.readFile(`${lab}/../public/assets/whale-girl.png`)).toString('base64');
const browser=await chromium.launch({channel:'chrome',headless:true});
let pixels;
try{const page=await browser.newPage();pixels=await page.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');c.width=c.height=1254;const a=c.getContext('2d');a.drawImage(i,0,0);const d=a.getImageData(0,0,1254,1254).data;let raw='';for(let k=0;k<d.length;k+=32768)raw+=String.fromCharCode(...d.subarray(k,k+32768));return btoa(raw)},src);pixels=Buffer.from(pixels,'base64')}finally{await browser.close()}
const report=[];
function trace(name,box,predicate,fill,options){
 const [ox,oy,w,h]=box,mask=Array.from({length:w*h},(_,i)=>{const x=ox+i%w,y=oy+Math.floor(i/w),o=(y*1254+x)*4;return predicate(...pixels.slice(o,o+4),x,y)?1:0});
 const loops=traceContours(mask,w,h,ox,oy,options);
 report.push({name,box,loops:loops.length,points:loops.map(p=>p.length)});
 return `<path data-art="${name}" d="${curvePath(loops)}" fill="${fill}" fill-rule="evenodd"/>`;
}
let master=await fs.readFile(`${lab}/art/source/whale-master.svg`,'utf8');
function group(id,body){const re=new RegExp(`(<g id="${id}" data-node="[^"]+"[^>]*>)[\\s\\S]*?(</g><!-- /part -->)`);if(!re.test(master))throw Error(id);master=master.replace(re,(_,a,b)=>a+body+b)}
const skin=(r,g,b,a)=>a>100&&r>215&&g>140&&b<230&&r-g>17;
const shadow=(r,g,b,a)=>skin(r,g,b,a)&&r-g>53;
const white=(r,g,b,a,x,y)=>a>100&&r>187&&g>180&&b>200&&b-r<48&&Math.abs(r-g)<17&&b-r>-9&&y>=1110;
const whiteShade=(r,g,b,a,x,y)=>white(r,g,b,a,x,y)&&r<235&&b-g>12;
const navy=(r,g,b,a,x,y)=>a>100&&r<105&&g<130&&b<190&&b>g*1.15&&y>1140;
for(const [side,box,hidden] of [
 ['left',[367,1025,150,220],'M425 1020 L516 1040 L494 1080 L419 1063Z'],
 ['right',[610,1020,165,225],'M620 1010 L709 1015 L721 1075 L643 1098Z'],
]){
 const body=`<path d="${hidden}" fill="url(#skin)"/>`+
 trace(`${side}-leg-skin`,box,skin,'url(#skin)',{epsilon:1.2,minArea:5})+
 trace(`${side}-leg-shadow`,box,shadow,'#ffbba7',{epsilon:1.1,minArea:10})+
 trace(`${side}-shoe`,box,navy,'url(#navy)',{epsilon:.9,minArea:3})+
 trace(`${side}-sock`,box,white,'url(#white)',{epsilon:.75,minArea:1.8})+
 trace(`${side}-sock-fold`,box,whiteShade,'#dcd7f4',{epsilon:.8,minArea:4});
 group(`leg-${side}`,body);
}
for(const [side,box] of [['left',[408,812,75,70]],['right',[612,810,85,78]]]){
 const cuff=(r,g,b,a)=>a>100&&r>95&&r<202&&g>110&&g<207&&b>145&&b<238&&b>g*1.06&&b-r<80;
 const cuffPath=side==='right'?'<path data-art="right-cuff" d="M649 822 Q668 841 692 853 L675 871 Q651 861 631 839Z" fill="#a5aed5"/>':trace(`${side}-cuff`,box,cuff,'#a5aed5',{epsilon:.8,minArea:7});
 const handPath=trace(`${side}-hand`,box,skin,'url(#skin)',{epsilon:.7,minArea:7});
 const re=new RegExp(`<g id="forearm-${side}"[\\s\\S]*?<!-- /part -->`),m=master.match(re)[0];
 const navyBody=m.match(/<path[^>]+\/>/)[0];
 group(`forearm-${side}`,navyBody+cuffPath);
 group(`palm-${side}`,handPath);
}
// Re-use the motif trace with smooth curves instead of a pixel stair-step outline.
const emblem=trace('whale-emblem',[475,905,100,85],(r,g,b,a)=>a>100&&b>150&&b>r*1.5&&b>g*1.2,'#285cdb',{epsilon:.75,minArea:1.5});
master=master.replace(/<g id="whale-emblem-vector">[\s\S]*?<\/g>/,`<g id="whale-emblem-vector">${emblem}</g>`);
await fs.writeFile(`${lab}/art/source/whale-master.svg`,master);
await fs.writeFile(`${lab}/art/rig/limb-art-review.json`,JSON.stringify({source:'public/assets/whale-girl.png',coordinateSpace:[1254,1254],embeddedRaster:false,report},null,2)+'\n');
console.log(report.map(r=>`${r.name}: ${r.loops} contours`).join('\n'));
