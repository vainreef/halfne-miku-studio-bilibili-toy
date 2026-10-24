// Rebuild the small printed emblem as real vectors. No embedded image/cropped PNG.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const lab=fileURLToPath(new URL('..',import.meta.url));
const reference=await fs.readFile(`${lab}/../public/assets/whale-girl.png`);
const browser=await chromium.launch({channel:'chrome',headless:true});
let mask;
const box=[475,905,100,85];
try{
 const page=await browser.newPage();
 mask=await page.evaluate(async({src,box:[x,y,w,h]})=>{
  const im=new Image();im.src=src;await im.decode();
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d');ctx.drawImage(im,x,y,w,h,0,0,w,h);
  const p=ctx.getImageData(0,0,w,h).data;
  return Array.from({length:w*h},(_,i)=>p[i*4+3]>100&&p[i*4+2]>150&&p[i*4+2]>p[i*4]*1.5&&p[i*4+2]>p[i*4+1]*1.2?1:0);
 },{src:`data:image/png;base64,${reference.toString('base64')}`,box});
}finally{await browser.close()}
const [ox,oy,w,h]=box,key=([x,y])=>`${x},${y}`,edges=new Map();
const filled=(x,y)=>x>=0&&x<w&&y>=0&&y<h&&mask[y*w+x];
function edge(a,b){const k=key(a);if(!edges.has(k))edges.set(k,[]);edges.get(k).push(b)}
for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(filled(x,y)){
 if(!filled(x,y-1))edge([x,y],[x+1,y]);
 if(!filled(x+1,y))edge([x+1,y],[x+1,y+1]);
 if(!filled(x,y+1))edge([x+1,y+1],[x,y+1]);
 if(!filled(x-1,y))edge([x,y+1],[x,y]);
}
const loops=[];
while(edges.size){
 const start=edges.keys().next().value.split(',').map(Number);let p=start,prev=[start[0]-1,start[1]],loop=[];
 for(let n=0;n<10000;n++){
  loop.push(p);const nexts=edges.get(key(p));if(!nexts?.length)throw Error('Open contour');
  // Foreground lies to the right: follow rightmost turn at diagonal contacts.
  const incoming=Math.atan2(p[1]-prev[1],p[0]-prev[0]);
  nexts.sort((a,b)=>{const score=q=>{let v=Math.atan2(q[1]-p[1],q[0]-p[0])-incoming;while(v<=-Math.PI)v+=2*Math.PI;while(v>Math.PI)v-=2*Math.PI;return v};return score(b)-score(a)});
  const q=nexts.shift();if(!nexts.length)edges.delete(key(p));prev=p;p=q;
  if(key(p)===key(start))break;
 }
 loops.push(loop.map(([x,y])=>[x+ox,y+oy]));
}
function distance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
function rdp(p,eps=.55){if(p.length<3)return p;let d=0,at=0;for(let i=1;i<p.length-1;i++){const v=distance(p[i],p[0],p.at(-1));if(v>d){d=v;at=i}}return d>eps?[...rdp(p.slice(0,at+1),eps).slice(0,-1),...rdp(p.slice(at),eps)]:[p[0],p.at(-1)]}
function closed(p){let k=1;for(let i=1;i<p.length;i++)if(Math.hypot(p[i][0]-p[0][0],p[i][1]-p[0][1])>Math.hypot(p[k][0]-p[0][0],p[k][1]-p[0][1]))k=i;return [...rdp(p.slice(0,k+1)).slice(0,-1),...rdp([...p.slice(k),p[0]]).slice(0,-1)]}
const area=p=>Math.abs(p.reduce((a,v,i)=>{const q=p[(i+1)%p.length];return a+v[0]*q[1]-q[0]*v[1]},0)/2);
const paths=loops.filter(p=>area(p)>1.5).map(closed);
const d=paths.map(p=>'M'+p.map(v=>v.join(' ')).join('L')+'Z').join('');
const motif=`<g id="whale-emblem-vector"><path d="${d}" fill="#285dde" fill-rule="evenodd"/></g>`;
const file=`${lab}/art/source/whale-master.svg`;let master=await fs.readFile(file,'utf8');
const regex=/(<g id="apron" data-node="lower.apron">)([\s\S]*?)(<\/g><!-- \/part -->)/;
master=master.replace(regex,(_,open,body,close)=>{
 const prefix=body.includes('<g id="whale-emblem-vector">')?body.slice(0,body.indexOf('<g id="whale-emblem-vector">')):body.slice(0,body.indexOf('<path d="M485 966'));
 if(!prefix)throw Error('Apron emblem marker missing');return open+prefix+motif+close;
});
await fs.writeFile(file,master);
await fs.writeFile(`${lab}/art/rig/emblem-trace.json`,JSON.stringify({reference:'public/assets/whale-girl.png',sourceBox:box,coordinateSpace:[1254,1254],epsilon:.55,loops:paths.length,points:paths.map(p=>p.length),embeddedRaster:false},null,2)+'\n');
console.log(`Emblem: ${paths.length} vector contours, ${paths.reduce((s,p)=>s+p.length,0)} points, no raster.`);
