import React,{useLayoutEffect,useRef,useState} from 'react';
// One decoded material per art layer, shared by every triangle and renderer instance.
const textures=new Map();
const mobile=()=>window.innerWidth<=768||window.matchMedia('(pointer: coarse)').matches;
function displayDensity(){
 // Compatibility rendering must not silently soften the mobile model either.
 return Math.max(2,Math.min(4,window.devicePixelRatio||1));
}
function loadTexture(url){
 if(!textures.has(url)){
  const image=new Image();image.src=url;
  const texture={image:null,loaded:false,ready:null};
  texture.ready=image.decode().then(()=>{
   // Rasterize the material once. drawImage(SVG) would repeat vector paint per triangle.
   const bitmap=document.createElement('canvas');bitmap.width=bitmap.height=1254;
   bitmap.getContext('2d').drawImage(image,0,0,bitmap.width,bitmap.height);texture.image=bitmap;texture.loaded=true;
  });
  textures.set(url,texture);
 }
 return textures.get(url);
}
export default function MeshCanvas({mesh,resourceCenterX=400,resourceCenterY=300,highlight=false}){
 const ref=useRef(null),latest=useRef(mesh);latest.current=mesh;
 const [a,b,c,d,e,f]=mesh.matrix,[x0,y0,x1,y1]=mesh.region,pad=160;
 const corners=[[x0-pad,y0-pad],[x1+pad,y0-pad],[x0-pad,y1+pad],[x1+pad,y1+pad]].map(([x,y])=>[a*x+c*y+e,b*x+d*y+f]);
 const left=Math.floor(Math.min(...corners.map(p=>p[0]))),top=Math.floor(Math.min(...corners.map(p=>p[1])));
 const width=Math.ceil(Math.max(...corners.map(p=>p[0])))-left,height=Math.ceil(Math.max(...corners.map(p=>p[1])))-top;
 const [density,setDensity]=useState(displayDensity);
 useLayoutEffect(()=>{const resize=()=>setDensity(displayDensity());window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[]);
 const paint=()=>{
  const canvas=ref.current;if(!canvas)return;
  const m=latest.current,texture=loadTexture(m.texture);if(!texture.loaded)return;
  const ctx=canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  const [a,b,c,d,e,f]=m.matrix;
  ctx.setTransform(density*a,density*b,density*c,density*d,density*(e-left),density*(f-top));
  for(const tri of m.triangles){
   const points=tri.vertices,cx=(points[0][0]+points[1][0]+points[2][0])/3,cy=(points[0][1]+points[1][1]+points[2][1])/3;
   ctx.save();ctx.beginPath();points.forEach(([x,y],i)=>{const r=Math.hypot(x-cx,y-cy),px=x+(x-cx)/r*.35,py=y+(y-cy)/r*.35;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.closePath();ctx.clip();ctx.transform(...tri.affine);ctx.drawImage(texture.image,0,0,1254,1254);ctx.restore();
  }
  canvas.dataset.meshReady='1';
 };
 useLayoutEffect(()=>{
  let active=true;loadTexture(mesh.texture).ready.then(()=>{if(active)paint()});return()=>{active=false};
 },[mesh.texture]);
 useLayoutEffect(paint,[mesh.revision,density]);
 return <canvas ref={ref} className="live-mesh" width={width*density} height={height*density} style={{position:'absolute',width,height,transform:`translate(${left-resourceCenterX}px,${top-resourceCenterY}px)`,filter:highlight?'brightness(0) saturate(100%) invert(74%) sepia(94%) saturate(3842%) hue-rotate(92deg) brightness(114%) contrast(128%)':undefined}}/>;
}
