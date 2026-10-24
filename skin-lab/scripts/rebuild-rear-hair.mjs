// Rebuild one continuous rear-hair SVG layer with editable semantic strand groups.
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
function trace(name,box,polygon,test,fill,largest=false){const [ox,oy,w,h]=box;const mask=Array.from({length:w*h},(_,i)=>{const x=ox+i%w,y=oy+Math.floor(i/w),o=(y*1254+x)*4;return inside(x,y,polygon)&&test(...pixels.subarray(o,o+4))?1:0});const material=/tone|turn|light/.test(name);let loops=traceContours(mask,w,h,ox,oy,{epsilon:material?1.15:.65,minArea:material?70:10});if(largest)loops=loops.sort((a,b)=>area(b)-area(a)).slice(0,1);report.push({name,loops:loops.length,points:loops.map(p=>p.length)});return `<path data-art="${name}" d="${curvePath(loops,.12)}" fill="${fill}" fill-rule="evenodd"/>`}
let master=await fs.readFile(`${lab}/art/source/whale-master.svg`,'utf8');
const baseline=await fs.readFile(`${lab}/art/backups/before-rear-hair-merge.svg`,'utf8');
const sourceGroup=id=>baseline.match(new RegExp('<g id="'+id+'" data-node="[^"]+">([\\s\\S]*?)</g><!-- /part -->'))[1];
const blue=(r,g,b,a)=>a>100&&r<105&&b>155&&g>70&&b>g*1.12&&b>r*1.6;
const rect=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
// Reference-visible silhouettes. Hidden roots overlap the scalp/central curtain.
// Right tail is a different object: in the lower right, only the cyan hair material is selected.
const leftBox=[115,390,335,640];
const rightBox=[735,390,335,615];
const leftPoly=[[260,390],[450,390],[450,750],[385,910],[365,1015],[230,1030],[115,990],[115,650],[220,585]];
const rightPoly=[[755,390],[945,390],[1070,620],[1070,800],[1015,826],[960,855],[950,915],[920,984],[875,1005],[805,975],[735,850]];
const rightBlue=(r,g,b,a)=>blue(r,g,b,a)&&g>85;
function layer(name,box,poly,predicate,fill,largest=false){return trace(name,box,poly,predicate,fill,largest)}
// Base planes use continuous gradients; lighter turning surfaces follow reference contours.
const leftBase=layer('rear-left-silhouette',leftBox,leftPoly,blue,'url(#rearOuterL)');
const rightBase=layer('rear-right-silhouette',rightBox,rightPoly,rightBlue,'url(#rearOuterR)');
const bright=(r,g,b,a)=>blue(r,g,b,a)&&g>123&&g>r*2.25;
const medium=(r,g,b,a)=>blue(r,g,b,a)&&g>102&&g>r*2;
const innerShade=(r,g,b,a)=>blue(r,g,b,a)&&g<100&&b<225;
function material(side,box,poly,predicate){
 const tones=[[90,'#2c60d7'],[100,'#2e69e1'],[110,'#3072e8'],[120,'#327bef'],[130,'#3585f4'],[140,'#378efa'],[150,'#3998fc'],[160,'#3ba3fd'],[170,'#3eaeff']];
 return '<g filter="url(#rearMaterialSoft)">'+tones.map(([g,c])=>layer('rear-'+side+'-tone-'+g,box,poly,(r,gg,b,a)=>predicate(r,gg,b,a)&&gg>g,c)).join('')+'</g>';
}
const underLBox=[300,550,160,210],underLPoly=[[330,550],[359,610],[433,650],[456,666],[433,681],[407,690],[402,710],[372,710],[346,748],[310,751],[315,665]];
const underRBox=[660,550,170,225],underRPoly=[[797,550],[830,566],[812,640],[787,683],[794,704],[777,752],[760,773],[744,748],[755,705],[711,710],[661,683],[680,670],[735,662],[773,625]];
function under(side,box,poly){
 const base=layer('rear-under-'+side+'-outline',box,poly,blue,'url(#underLock'+side+')');
 // Small under-locks use native continuous gradients, avoiding extra filtered mesh textures.
 return base;
}
const groups=[
 ['rear-central-curtain',sourceGroup('hair-back-center')],
 ['rear-outer-left','<defs><clipPath id="rearLeftContour">'+leftBase+'</clipPath></defs><path d="M318 360 C345 410 384 520 410 650 L380 890 L300 940 L240 820 L225 600Z" fill="url(#rearOuterL)"/>'+leftBase+'<g clip-path="url(#rearLeftContour)">'+material('left',leftBox,leftPoly,blue)+'</g>'],
 ['rear-outer-right','<defs><clipPath id="rearRightContour">'+rightBase+'</clipPath></defs><path d="M819 355 C878 410 920 560 930 700 L900 910 L830 945 L750 805 L730 550Z" fill="url(#rearOuterR)"/>'+rightBase+'<g clip-path="url(#rearRightContour)">'+material('right',rightBox,rightPoly,rightBlue)+'</g>'],
 ['rear-under-left',under('L',underLBox,underLPoly)],
 ['rear-under-right',under('R',underRBox,underRPoly)],
 ['rear-scalp',sourceGroup('hair-cap')],
 ['rear-flyaways-left',sourceGroup('hair-loop-left')],
 ['rear-flyaways-right',(sourceGroup('head-fin-right').match(/<path\b[^>]*\/>/g)||[]).slice(0,2).join('')],
];
const body=groups.map(([id,paths])=>`<g id="${id}" data-hair-section="${id}">${paths}</g>`).join('\n');
// Only one resource-bearing render node for ALL formerly green rear hair.
const merged=`<g id="rear-hair" data-node="hairBackCenter">${body}</g><!-- /part -->`;
for(const id of ['hair-back-left','hair-back-right','hair-under-left','hair-under-right','hair-cap','hair-loop-left'])master=master.replace(new RegExp('<g id="'+id+'" data-node="[^"]+">[\\s\\S]*?</g><!-- /part -->\\s*'),'');
master=master.replace(/<g id="(?:hair-back-center|rear-hair)" data-node="hairBackCenter">[\s\S]*?<\/g><!-- \/part -->/,merged);
// Flyaways no longer share the whale-fin decoration resource.
const oldFin=sourceGroup('head-fin-right');
const finPaths=oldFin.match(/<path\b[^>]*\/>/g).slice(2).join('');
master=master.replace(/(<g id="head-fin-right" data-node="head.phoneR">)[\s\S]*?(<\/g><!-- \/part -->)/,(_,a,b)=>a+finPaths+b);
master=master.replace(/<linearGradient id="rear(?:Outer|Turn|Light)[LR]"[\s\S]*?<\/linearGradient>/g,'');
const gradients=[];
for(const side of ['L','R']){
 const x=side==='L'?260:890;
 for(const [name,stops] of [
  ['Outer',[[0,'#2854c4'],[.38,'#2b64d8'],[.72,'#307ee8'],[1,'#329df3']]],
  ['Turn',[[0,'#2b69d8'],[.45,'#3087e9'],[1,'#329ef3']]],
  ['Light',[[0,'#307ee4'],[.45,'#329af0'],[1,'#36a6f4']]]
 ])gradients.push(`<linearGradient id="rear${name}${side}" gradientUnits="userSpaceOnUse" x1="${x}" y1="390" x2="${x+30}" y2="1000">${stops.map(([o,c])=>`<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`);
}
master=master.replace(/<filter id="rearMaterialSoft"[\s\S]*?<\/filter>/g,'').replace(/<linearGradient id="rearInner[LR]"[\s\S]*?<\/linearGradient>/g,'');
gradients.push('<filter id="rearMaterialSoft" x="-25%" y="-10%" width="150%" height="120%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="4"/></filter>');
for(const [side,x1,x2] of [['L',435,285],['R',740,920]])gradients.push(`<linearGradient id="rearInner${side}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="650" x2="${x2}" y2="690"><stop stop-color="#253d9f" stop-opacity=".85"/><stop offset="1" stop-color="#2959c5" stop-opacity="0"/></linearGradient>`);
master=master.replace('</defs>',gradients.join('')+'</defs>');
await fs.writeFile(`${lab}/art/source/whale-master.svg`,master);
await fs.writeFile(`${lab}/art/rig/rear-hair-sections.json`,JSON.stringify({renderNode:'hairBackCenter',renderLayers:1,majorLongLocks:4,notes:'Two outer continuous curly masses + two cheek-under locks; central curtain/scalp are supporting surfaces, not extra ponytails. Flyaway arcs and highlights are not counted as long locks.',sections:groups.map(([id])=>id),reference:[1254,1254],report},null,2)+'\n');
console.log(report);
