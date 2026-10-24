/** Whale-only secondary motion. Seconds, fixed 120 Hz; no changes to JohnSu's engine. */
import {getConfig} from '../../../src/Engine/modelUtils.js';
import manifest from '../../art/rig/parts.json';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const point=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const inverse=([a,b,c,d,e,f])=>{const q=a*d-b*c;return [d/q,-b/q,-c/q,a/q,(c*f-d*e)/q,(b*e-a*f)/q]};
function matrices(root){
 const result={};
 function walk(n,path,parent){const a=(n.rotation||0)*Math.PI/180;const m=path?mul(parent,[Math.cos(a)*(n.scaleX||1),Math.sin(a)*(n.scaleX||1),-Math.sin(a)*(n.scaleY||1),Math.cos(a)*(n.scaleY||1),n.x||0,n.y||0]):parent;result[path]=m;n.components?.forEach(c=>walk(c,path?`${path}.${c.id}`:c.id,m))}
 walk(root,'',[1,0,0,1,0,0]);return result;
}
// Source SVG remains vectors. Piecewise-affine triangles share their exact edge vertices.
// A tiny expanded clip avoids antialias hairline seams; outer silhouettes remain original.
export function makeMesh(resource,part,{x0,x1,y0,y1,cols=3,rows=5,rowStops}){
 const svg=decodeURIComponent(resource.slice(resource.indexOf(',')+1));
 const defs=svg.match(/<defs>([\s\S]*?)<\/defs>/)[1];
 const body=svg.slice(svg.indexOf('</defs>')+7).replace(/^<g transform="[^"]*">/,'').replace(/<\/g><\/svg>$/,'');
 const m=part.exportMatrix;
 const ys=rowStops||Array.from({length:rows+1},(_,j)=>y0+(y1-y0)*j/rows);
 rows=ys.length-1;
 let cachedKey=null;
 const prefix='mesh-'+part.node.replaceAll('.','-')+'-';
 const scoped=text=>text.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`).replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${prefix}${id})`);
 const mesh={revision:0,markup:'',triangles:[],matrix:m};
 return deform=>{
  const original=[],moved=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const x=x0+(x1-x0)*i/cols,y=ys[j];
   original.push([x,y]);moved.push(deform(x,y,i/cols,j/rows));
  }
  const key=moved.flat().map(v=>v.toFixed(2)).join(',');
  if(key===cachedKey)return mesh;
  cachedKey=key;
  let clips='',draw='';let k=0;const triangles=[];
  const tri=ids=>{
   const src=ids.map(i=>original[i]),dst=ids.map(i=>moved[i]);
   const basis=p=>[p[1][0]-p[0][0],p[1][1]-p[0][1],p[2][0]-p[0][0],p[2][1]-p[0][1],...p[0]];
   const t=mul(basis(dst),inverse(basis(src))),cx=dst.reduce((s,p)=>s+p[0],0)/3,cy=dst.reduce((s,p)=>s+p[1],0)/3;
   const polygon=dst.map(([x,y])=>{const d=Math.hypot(x-cx,y-cy);return `${x+(x-cx)/d*.35},${y+(y-cy)/d*.35}`}).join(' ');
   triangles.push({points:polygon,transform:`matrix(${t.join(' ')})`});
   clips+=`<clipPath id="c${k}" clipPathUnits="userSpaceOnUse"><polygon data-mesh-clip="${k}" points="${polygon}"/></clipPath>`;
   draw+=`<g clip-path="url(#c${k++})"><use data-mesh-use="${k-1}" href="#texture" transform="matrix(${t.join(' ')})"/></g>`;
  };
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;tri([a,b,d]);tri([a,d,c])}
  if(!mesh.markup){
   mesh.markup=scoped(`<defs>${defs}<g id="texture">${body}</g>${clips}</defs><g transform="matrix(${m.join(' ')})">${draw}</g>`).replaceAll('href="#texture"',`href="#${prefix}texture"`);
  }
  mesh.triangles=triangles;mesh.revision++;return mesh;
 };
}
export function createSecondaryMotion(resources){
 const mesh=(path,region)=>makeMesh(resources[path],manifest.find(p=>p.node===path),region);
 const hairCenter=mesh('hairBackCenter',{x0:40,x1:1160,y0:90,y1:1080,rowStops:[90,200,330,500,680,860,1080]});
 const apronMesh=mesh('lower.apron',{x0:200,x1:900,y0:780,y1:1140,cols:4,rowStops:[780,820,900,980,1060,1140]});
 const skirt=mesh('lower.skirt',{x0:200,x1:900,y0:780,y1:1140,cols:4,rowStops:[780,820,900,980,1060,1140]});
 let last=null,accumulator=0,offset=[0,0,0],speed=[0,0,0],hem=[0,0,0],hemSpeed=[0,0,0];
 const reset=()=>{last=null;accumulator=0;offset=[0,0,0];speed=[0,0,0];hem=[0,0,0];hemSpeed=[0,0,0]};
 let diagnostics={};
 return {reset,get diagnostics(){return diagnostics},step(state,dt,enabled=true){
  const head=getConfig(state,'head'),lower=getConfig(state,'lower');
  const current=[head.x,head.y,head.rotation||0,lower.x,lower.y];
  const seconds=clamp(dt/1000,0,.05);
  if(!enabled){reset();last=current;}
  const velocity=last&&seconds>0?current.map((v,i)=>(v-last[i])/seconds):current.map(()=>0);last=current;
  accumulator+=seconds;
  const hairTarget=clamp(-velocity[0]*.6-velocity[2]*.12,-26,26),skirtTarget=clamp(-velocity[3]*.45,-12,12);
  while(accumulator>=1/120){
   const previous=[...offset];
   for(let i=0;i<3;i++){
    // Neighbor coupling keeps one curtain; no pair of independent ponytail pendulums.
    const neighbors=(previous[Math.max(0,i-1)]+previous[Math.min(2,i+1)])/2;
    speed[i]+=((i===1?65:85)*(hairTarget*[1,.65,1.05][i]-offset[i])+24*(neighbors-offset[i])-18*speed[i])/120;
    offset[i]=clamp(offset[i]+speed[i]/120,-32,32);
    hemSpeed[i]+=(135*(skirtTarget*[.85,.5,1][i]-hem[i])-23*hemSpeed[i])/120;
    hem[i]=clamp(hem[i]+hemSpeed[i]/120,-15,15);
   }
   accumulator-=1/120;
  }
  const blend=(a,u)=>{const t=clamp(u,0,1)*2,k=Math.min(1,Math.floor(t));return a[k]*(1-(t-k))+a[k+1]*(t-k)};
  const hair=(x,y,u)=>{
   const t=clamp((y-330)/750,0,1);
   // Loose curtain tips tend toward world-down rather than remaining a rigid head extension.
   const angle=-(head.rotation||0)*Math.PI/180*.65*Math.pow(t,1.5),c=Math.cos(angle),s=Math.sin(angle),dx=x-540,dy=y-330;
   return [540+c*dx-s*dy+blend(offset,u)*t*t,330+s*dx+c*dy+Math.abs(blend(offset,u))*.05*t*t];
  };
  const cloth=(x,y,u)=>{const t=clamp((y-820)/320,0,1);return [x+blend(hem,u)*t*t,y+blend(hem,u)*.13*(u-.5)*t*t]};
  getConfig(state,'hairBackCenter').mesh=hairCenter(hair);
  getConfig(state,'lower.apron').mesh=apronMesh((x,y,u)=>{const p=cloth(x,y,u),t=clamp((y-820)/240,0,1);return [x+(p[0]-x)*.7,y+(p[1]-y)*.7+Math.abs(blend(hem,u))*.07*t*t]});
  getConfig(state,'lower.skirt').mesh=skirt(cloth);
  // Wrist contact follows pelvis, not an unrelated front-of-chest formula.
  // Each authored two-piece arm uses an elbow solve with fixed segment lengths.
  const ms=matrices(state);
  let contactError=0;
  for(const [side,S0,E0,W0] of [['L',[450,731],[395,800],[453,842]],['R',[666,731],[723,798],[649,842]]]){
   const shoulderPath=`shoulder${side}`,armPath=`arm${side}`;
   const restShoulder=manifest.find(p=>p.node===shoulderPath),restArm=manifest.find(p=>p.node===armPath);
   const upperRest=manifest.find(p=>p.node==='upper');
   const upperPoint=point(upperRest.exportMatrix,...S0).map((v,i)=>v-(i?300:400));
   const shoulder=point(ms.upper,...upperPoint);
   const wristRest=point(manifest.find(p=>p.node==='lower.skirt').exportMatrix,...W0).map((v,i)=>v-(i?300:400));
   const wrist=point(ms.lower,...wristRest);
   const l1=Math.hypot(S0[0]-E0[0],S0[1]-E0[1])*.22,l2=Math.hypot(W0[0]-E0[0],W0[1]-E0[1])*.22;
   const dx=wrist[0]-shoulder[0],dy=wrist[1]-shoulder[1],distance=Math.hypot(dx,dy),d=clamp(distance,.001,l1+l2-.001);
   const ux=dx/(distance||1),uy=dy/(distance||1),a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a)),sign=side==='L'?1:-1;
   const elbow=[shoulder[0]+a*ux-sign*uy*h,shoulder[1]+a*uy+sign*ux*h];
   // Map each art segment by a rigid rotation, preserving the authored neutral pose.
   for(const [path,part,A0,B0,A,B] of [[shoulderPath,restShoulder,S0,E0,shoulder,elbow],[armPath,restArm,E0,W0,elbow,wrist]]){
    const p0=point(part.exportMatrix,...A0).map((v,i)=>v-(i?300:400)),p1=point(part.exportMatrix,...B0).map((v,i)=>v-(i?300:400));
    const angle=Math.atan2(B[1]-A[1],B[0]-A[0])-Math.atan2(p1[1]-p0[1],p1[0]-p0[0]);
    const n=getConfig(state,path),c=Math.cos(angle),s=Math.sin(angle);
    n.x=A[0]-c*p0[0]+s*p0[1];n.y=A[1]-s*p0[0]-c*p0[1];n.rotation=angle*180/Math.PI;n.scaleX=n.scaleY=1;
    if(path===armPath)contactError=Math.max(contactError,Math.hypot(n.x+c*p1[0]-s*p1[1]-wrist[0],n.y+s*p1[0]+c*p1[1]-wrist[1]));
   }
   // Hand art is a separate waist-layer node: over skirt, under apron, beneath cuff.
   // Preserve the exact same rigid forearm transform despite different render parents.
   const handPath=`lower.hand${side}`,handPart=manifest.find(p=>p.node===handPath);
   const armNode=getConfig(state,armPath),r=armNode.rotation*Math.PI/180;
   const armMatrix=[Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),armNode.x,armNode.y];
   const centered=m=>[m[0],m[1],m[2],m[3],m[4]-400,m[5]-300];
   const handMatrix=mul(mul(mul(inverse(ms.lower),armMatrix),centered(restArm.exportMatrix)),inverse(centered(handPart.exportMatrix)));
   const hand=getConfig(state,handPath);hand.x=handMatrix[4];hand.y=handMatrix[5];
   hand.rotation=Math.atan2(handMatrix[1],handMatrix[0])*180/Math.PI;
   hand.scaleX=Math.hypot(handMatrix[0],handMatrix[1]);
   hand.scaleY=(handMatrix[0]*handMatrix[3]-handMatrix[1]*handMatrix[2])/hand.scaleX;
  }
  const debugGrid=(path,deform,xs,ys)=>{
   const part=manifest.find(p=>p.node===path),mat=ms[path];
   const screen=(x,y)=>{const q=point(part.exportMatrix,x,y),r=point(mat,q[0]-400,q[1]-300);return [state.x+r[0]*(state.scaleX||1),state.y+r[1]*(state.scaleY||1)]};
   const grid=ys.map(y=>xs.map(x=>screen(...deform(x,y,(x-200)/700))));
   return [...grid,...xs.map((_,i)=>grid.map(row=>row[i]))];
  };
  const meshLines=[...debugGrid('hairBackCenter',hair,[200,550,900],[300,550,800,1020]),...debugGrid('lower.skirt',cloth,[200,375,550,725,900],[820,900,1000,1100])];
  diagnostics={meshLines,hairOffsets:[...offset],hemOffsets:[...hem],waistDisplacement:Math.max(...[0,.25,.5,.75,1].map(u=>{const x=200+700*u,p=cloth(x,820,u);return Math.hypot(p[0]-x,p[1]-820)})),scalpDisplacement:Math.hypot(...hair(540,300,.5).map((v,i)=>v-[540,300][i])),contactError};
  return state;
 }};
}
