// Bake real model expressions into lightweight, hair-free button thumbnails.
import fs from 'node:fs/promises';
import {chromium} from '../skin-lab/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const p=await browser.newPage();await p.goto('http://localhost:3000/halfne-studio-bilibili-toy/');
 const images=await p.evaluate(async()=>{
  const base='/halfne-studio-bilibili-toy/src/';
  const {parseConfig}=await import(base+'Engine/core.js');const {getConfig}=await import(base+'Engine/modelUtils.js');
  const {EYE_TYPES,MOUTH_SHAPES,MOOD_TYPES,PRESET_COMBOS}=await import(base+'constants/emotions.js');
  const load=async src=>{const i=new Image();i.src=src;await i.decode();return i};
  const crop=async src=>{const i=await load(src),c=document.createElement('canvas');c.width=800;c.height=600;const g=c.getContext('2d');g.drawImage(i,0,0,800,600);const d=g.getImageData(0,0,800,600).data;let x=800,y=600,r=0,b=0;for(let j=0;j<600;j++)for(let k=0;k<800;k++)if(d[(j*800+k)*4+3]>8){x=Math.min(x,k);y=Math.min(y,j);r=Math.max(r,k);b=Math.max(b,j)}return {i,x,y,w:r-x+1,h:b-y+1}};
  const out={};
  for(const [skin,file] of [['miku','defaultModel'],['whale','whaleGirlModel']]){
   const {default:config}=await import(base+file+'.js');
   const list=[['default',[]],['blink',['EyeBlink']],...EYE_TYPES.map(o=>[o.id,[o.id]]),...MOUTH_SHAPES.map(o=>[o.id,[o.id]]),...MOOD_TYPES.map(o=>[o.id,[o.id]]),...PRESET_COMBOS.map((o,i)=>['preset'+i,o.keys])];
   for(const [id,keys] of list){
    const m=parseConfig(config.model,config.parseControl({keyInput:keys})),c=document.createElement('canvas');c.width=c.height=288;const g=c.getContext('2d');g.scale(2,2);
    const gradient=g.createLinearGradient(0,20,0,130);gradient.addColorStop(0,'#ffe9d8');gradient.addColorStop(1,'#ffceb6');g.fillStyle=gradient;g.beginPath();g.ellipse(72,73,65,59,0,0,Math.PI*2);g.fill();
    g.fillStyle='#ff8c9a';for(const x of [28,116]){g.beginPath();g.ellipse(x,88,9,5,0,0,Math.PI*2);g.fill()}
    for(const [path,cx,cy,maxW,maxH] of [['head.face.eyes',72,61,96,41],['head.face.mouth',72,102,35,29]]){
     const a=await crop(getConfig(m,path).resource);const s=Math.min(maxW/a.w,maxH/a.h);g.drawImage(a.i,a.x,a.y,a.w,a.h,cx-a.w*s/2,cy-a.h*s/2,a.w*s,a.h*s);
    }
    out[skin+'-'+id]=c.toDataURL('image/png').split(',')[1];
   }
   // Render the actual neutral head tree for the character selector avatar.
   const m=parseConfig(config.model,config.parseControl()),c=document.createElement('canvas');c.width=c.height=384;const g=c.getContext('2d');g.translate(192,252);g.scale(1.32,1.32);
   let measuring=false;
   async function draw(n){if((measuring&&n.id==='ahoge')||n.virtual||(skin==='whale'&&['phoneL','phoneR'].includes(n.id)))return;g.save();g.translate(n.x||0,n.y||0);g.rotate((n.rotation||0)*Math.PI/180);g.scale(n.scaleX||1,n.scaleY||1);if(n.resource){const i=await load(n.resource);g.drawImage(i,-n.resourceCenterX,-n.resourceCenterY,n.width,n.height)}for(const ch of n.components||[])await draw(ch);g.restore()}
   const h=getConfig(m,'head');measuring=true;await draw({...h,x:0,y:0});const d=g.getImageData(0,0,384,384).data;let ax=384,ay=384,ar=0,ab=0;for(let y=0;y<384;y++)for(let x=0;x<384;x++)if(d[(y*384+x)*4+3]>8){ax=Math.min(ax,x);ay=Math.min(ay,y);ar=Math.max(ar,x);ab=Math.max(ab,y)}
   // Fit the main head, not the ahoge. Repaint the complete head afterwards so
   // the protruding curl is naturally cropped by the portrait/circular viewport.
   g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,384,384);g.restore();measuring=false;await draw({...h,x:0,y:0});
   const avatar=document.createElement('canvas');avatar.width=avatar.height=384;const ag=avatar.getContext('2d'),size=Math.max(ar-ax+1,ab-ay+1)*1.01;ag.drawImage(c,(ax+ar-size)/2,(ay+ab-size)/2,size,size,0,0,384,384);out[skin+'-avatar']=avatar.toDataURL('image/png').split(',')[1];
  }
  return out;
 });
 await fs.mkdir('public/assets/ui',{recursive:true});for(const [name,data] of Object.entries(images))await fs.writeFile('public/assets/ui/'+name+'.png',Buffer.from(data,'base64'));console.log('Generated',Object.keys(images).length,'model-derived thumbnails');
} finally {await browser.close()}
