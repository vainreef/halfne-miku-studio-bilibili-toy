/** Whale-only secondary motion. Seconds, fixed 120 Hz; no changes to JohnSu's engine. */
import {getConfig} from '../../../src/Engine/modelUtils.js';
import manifest from '../../art/rig/parts.json';
import {hairSpecs,frontSpecs} from './hairTopology.js';
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
 const prefix='mesh-'+part.node.replaceAll('.','-')+'-';
 const scoped=text=>text.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`).replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${prefix}${id})`);
 const textureSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254"><defs>${defs}</defs>${body}</svg>`;
 const mesh={revision:0,markup:'',triangles:[],matrix:m,texture:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(textureSvg),region:[x0,y0,x1,y1]};
 const original=[],moved=[],rounded=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  original.push([x0+(x1-x0)*i/cols,ys[j],i/cols,j/rows]);moved.push([0,0]);rounded.push([NaN,NaN]);
 }
 const basis=p=>[p[1][0]-p[0][0],p[1][1]-p[0][1],p[2][0]-p[0][0],p[2][1]-p[0][1],...p[0].slice(0,2)];
 const tri=ids=>{
  const src=ids.map(i=>original[i].slice(0,2)),dst=ids.map(i=>moved[i]),inv=inverse(basis(src));
  let version=-1,affine;
  return {vertices:dst,source:src,
   // GPU needs only vertex positions/UVs; calculate Canvas/SVG affine matrices lazily.
   get affine(){if(version!==mesh.revision){affine=mul(basis(dst),inv);version=mesh.revision}return affine},
   get points(){const cx=(dst[0][0]+dst[1][0]+dst[2][0])/3,cy=(dst[0][1]+dst[1][1]+dst[2][1])/3;return dst.map(([x,y])=>{const d=Math.hypot(x-cx,y-cy);return `${x+(x-cx)/d*.35},${y+(y-cy)/d*.35}`}).join(' ')},
   get transform(){return `matrix(${this.affine.join(' ')})`}};
 };
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;mesh.triangles.push(tri([a,b,d]),tri([a,d,c]))}
 return deform=>{
  const next=original.map(p=>deform(...p));
  let changed=false;
  for(let i=0;i<next.length;i++)if(Math.round(next[i][0]*100)!==rounded[i][0]||Math.round(next[i][1]*100)!==rounded[i][1]){changed=true;break}
  if(!changed)return mesh;
  for(let i=0;i<next.length;i++){moved[i][0]=next[i][0];moved[i][1]=next[i][1];rounded[i][0]=Math.round(next[i][0]*100);rounded[i][1]=Math.round(next[i][1]*100)}
  mesh.revision++;
  if(!mesh.markup){
   let clips='',draw='';
   mesh.triangles.forEach((triangle,k)=>{
    clips+=`<clipPath id="c${k}" clipPathUnits="userSpaceOnUse"><polygon data-mesh-clip="${k}" points="${triangle.points}"/></clipPath>`;
    draw+=`<g clip-path="url(#c${k})"><use data-mesh-use="${k}" href="#texture" transform="matrix(${triangle.affine.join(' ')})"/></g>`;
   });
   mesh.markup=scoped(`<defs>${defs}<g id="texture">${body}</g>${clips}</defs><g transform="matrix(${m.join(' ')})">${draw}</g>`).replaceAll('href="#texture"',`href="#${prefix}texture"`);
  }
  return mesh;
 };
}
export function createSecondaryMotion(resources,options={}){
 const mesh=(path,region)=>makeMesh(resources[path],manifest.find(p=>p.node===path),region);
 // Five overlapping hanging masses, two light flyaways, one rigid scalp.
 // Source-space roots: no cutting the drawing into horizontal strips.
 const hairMeshes=hairSpecs.map(p=>mesh(p.path,{x0:p.box[0],x1:p.box[1],y0:p.box[2],y1:p.box[3],cols:2,rowStops:[p.box[2],p.root[1],...[.25,.5,.75,1].map(t=>p.root[1]+(p.box[3]-p.root[1])*t)]}));
 const frontMeshes=frontSpecs.map(p=>mesh(p.path,{x0:p.box[0],x1:p.box[1],y0:p.box[2],y1:p.box[3],cols:2,rowStops:[p.box[2],p.root[1],...[.25,.5,.75,1].map(t=>p.root[1]+(p.box[3]-p.root[1])*t)]}));
 let hairJoints=hairSpecs.map(()=>[0,0]),hairSpeed=hairSpecs.map(()=>[0,0]);
 let curlJoints=frontSpecs.map(()=>[0,0]),curlSpeed=frontSpecs.map(()=>[0,0]);
 const clothRows=[780,820,835,880,925,970,1015,1060,1100,1140];
 const apronMesh=mesh('lower.apron',{x0:200,x1:900,y0:780,y1:1140,cols:4,rowStops:clothRows});
 const skirt=mesh('lower.skirt',{x0:200,x1:900,y0:780,y1:1140,cols:4,rowStops:clothRows});
 // Each cloth panel: three columns × two free joints; the whole waist row is pinned.
 let last=null,accumulator=0,offset=[0,0,0];
 let hem=Array(6).fill(0),hemSpeed=Array(6).fill(0),apron=Array(6).fill(0),apronSpeed=Array(6).fill(0);
 let bows=[0,0],bowSpeed=[0,0],lift=0,liftSpeed=0;
 let filteredVelocity=Array(7).fill(0);
 const reset=()=>{last=null;accumulator=0;offset=[0,0,0];hem.fill(0);hemSpeed.fill(0);apron.fill(0);apronSpeed.fill(0);bows.fill(0);bowSpeed.fill(0);lift=liftSpeed=0;filteredVelocity.fill(0);hairJoints.forEach(a=>a.fill(0));hairSpeed.forEach(a=>a.fill(0));curlJoints.forEach(a=>a.fill(0));curlSpeed.forEach(a=>a.fill(0))};
 let diagnostics={};
 return {reset,get diagnostics(){return diagnostics},step(state,dt,enabled=true){
  const head=getConfig(state,'head'),lower=getConfig(state,'lower'),upper=getConfig(state,'upper');
  const current=[head.x,head.y,head.rotation||0,lower.x,lower.y,upper.rotation||0,upper.x];
  const seconds=clamp(dt/1000,0,.05);
  if(!enabled){reset();last=current;}
  const hadLast=!!last;
  const velocity=last&&seconds>0?current.map((v,i)=>(v-last[i])/seconds):current.map(()=>0);last=current;
  // Smooth the measured base velocity, then differentiate: inertia responds to
  // acceleration, not a permanent velocity-proportional sideways drag target.
  const alpha=1-Math.exp(-seconds/.035),oldVelocity=[...filteredVelocity];
  filteredVelocity=filteredVelocity.map((v,i)=>v+(velocity[i]-v)*alpha);
  const acceleration=filteredVelocity.map((v,i)=>enabled&&hadLast&&seconds>0?(v-oldVelocity[i])/seconds:0);
  accumulator+=enabled?seconds:0;
  const hairForce=clamp(-acceleration[0]/.22*.55-acceleration[2]*.55,-1500,1500);
  const clothForce=clamp(-acceleration[3]/.22*.7-acceleration[5]*.16,-1700,1700);
  while(accumulator>=1/120){
   const oldHair=hairJoints.map(a=>[...a]);
   const integrateHair=(q,v,k,d,force,neighbor)=>{
    const old=[...q];
    for(let j=0;j<2;j++){
     // Reciprocal bending distributes the curve; weaker tips lag and rebound.
     const bend=j?22*(old[0]-.5*old[1]):22*(old[1]-1.8*old[0]);
     v[j]+=(-(j?k*.65:k)*old[j]+bend+force*(j?1:.38)+neighbor*(j?1:.4)-(j?d*.85:d)*v[j])/120;
     q[j]=clamp(q[j]+v[j]/120,-24,24);
    }
   };
   hairSpecs.forEach((p,i)=>{
    // Weak central coupling keeps a loose curtain, without synchronizing all tips.
    const neighbor=i===1||i===2?8*(oldHair[0][1]-oldHair[i][1]):0;
    integrateHair(hairJoints[i],hairSpeed[i],p.k,p.d,hairForce*p.weight,neighbor);
   });
   frontSpecs.forEach((p,i)=>integrateHair(curlJoints[i],curlSpeed[i],170,14,hairForce*.32,0));
   offset=[hairJoints[1][1],hairJoints[0][1],hairJoints[2][1]];
   const oldHem=[...hem],oldApron=[...apron];
   for(let col=0;col<3;col++)for(let row=0;row<2;row++){
    const i=col*2+row,neighbor=(oldHem[Math.max(0,col-1)*2+row]+oldHem[Math.min(2,col+1)*2+row])/2;
    const bend=row?24*(oldHem[i-1]-.45*oldHem[i]):24*(oldHem[i+1]-1.8*oldHem[i]);
    const force=clothForce*[.95,.78,1.05][col]*(row?1:.45);
    hemSpeed[i]+=(-(row?72:110)*hem[i]+force+18*(neighbor-hem[i])+bend-(row?8.5:11)*hemSpeed[i])/120;
    hem[i]=clamp(hem[i]+hemSpeed[i]/120,-28,28);
    // Apron shares base acceleration, not a cascade of two low-pass followers.
    const apronNeighbor=(oldApron[Math.max(0,col-1)*2+row]+oldApron[Math.min(2,col+1)*2+row])/2;
    const apronBend=row?20*(oldApron[i-1]-.45*oldApron[i]):20*(oldApron[i+1]-1.8*oldApron[i]);
    apronSpeed[i]+=(-(row?96:145)*apron[i]+force*.65+14*(apronNeighbor-apron[i])+apronBend+12*(oldHem[i]-apron[i])-(row?9:12)*apronSpeed[i])/120;
    apron[i]=clamp(apron[i]+apronSpeed[i]/120,-22,22);
   }
   liftSpeed+=(-145*lift+clamp(-acceleration[4]/.22*.3,-700,700)-13*liftSpeed)/120;
   lift=clamp(lift+liftSpeed/120,-8,8);
   for(let i=0;i<2;i++){
    const force=i?clamp(-acceleration[3]*.2-acceleration[5]*.55,-1400,1400):clamp(-acceleration[6]*.16-acceleration[5]*.7,-1500,1500);
    bowSpeed[i]+=(-(i?105:180)*bows[i]+force-(i?9:12)*bowSpeed[i])/120;
    bows[i]=clamp(bows[i]+bowSpeed[i]/120,i?-16:-12,i?16:12);
   }
   accumulator-=1/120;
  }
  // Cubic Hermite interpolation: shared tangent at each mid-joint (C1),
  // zero waist tangent, and continuous left/center/right bending.
  const hermite=(a,b,da,db,t)=>{const t2=t*t,t3=t2*t;return (2*t3-3*t2+1)*a+(t3-2*t2+t)*da+(-2*t3+3*t2)*b+(t3-t2)*db};
  const along=(mid,tip,t)=>t<=.5?hermite(0,mid,0,tip*.5,t*2):hermite(mid,tip,tip*.5,tip-mid,(t-.5)*2);
  const hairDeform=(spec,joints,compensation=.65)=>(x,y)=>{
   const [rx,ry]=spec.root,t=clamp((y-ry)/(spec.box[3]-ry),0,1);
   // C1 pinned roots; two joints with independent tip lag; world-down correction.
   const a=-(head.rotation||0)*Math.PI/180*compensation*t*t;
   const c=Math.cos(a),sn=Math.sin(a),dx=x-rx,dy=y-ry;
   const bend=along(joints[0],joints[1],t);
   return [rx+c*dx-sn*dy+bend,ry+sn*dx+c*dy+Math.abs(bend)*.025*t];
  };
  const hairFields=hairSpecs.map((p,i)=>hairDeform(p,hairJoints[i]));
  const hair=hairFields[0];
  hairSpecs.forEach((p,i)=>{getConfig(state,p.path).mesh=hairMeshes[i](hairFields[i])});
  const clothField=(joints,x,y,u,end)=>{
   const t=clamp((y-835)/(end-835),0,1),col=clamp(u,0,1)*2;
   const values=[0,1,2].map(c=>along(joints[c*2],joints[c*2+1],t));
   const tangent=(values[2]-values[0])*.5;
   const dx=col<=1?hermite(values[0],values[1],values[1]-values[0],tangent,col):hermite(values[1],values[2],tangent,values[2]-values[1],col-1);
   return [x+dx,y+lift*t*t+dx*.16*(u-.5)];
  };
  const cloth=(x,y,u)=>clothField(hem,x,y,u,1090);
  const apronCloth=(x,y,u)=>clothField(apron,x,y,u,1030);
  getConfig(state,'lower.apron').mesh=apronMesh(apronCloth);
  getConfig(state,'lower.skirt').mesh=skirt(cloth);
  // The bow knot is sewn to the actual triangulated skirt surface, not the waist origin.
  const sampleSkirt=(x,y)=>{
   const xs=[200,375,550,725,900],ys=clothRows;
   const ix=Math.min(3,Math.max(0,Math.floor((x-200)/175))),iy=Math.min(ys.length-2,Math.max(0,ys.findIndex((v,i)=>i<ys.length-1&&y>=v&&y<=ys[i+1])));
   const fx=(x-xs[ix])/175,fy=(y-ys[iy])/(ys[iy+1]-ys[iy]);
   const a=cloth(xs[ix],ys[iy],(xs[ix]-200)/700),b=cloth(xs[ix+1],ys[iy],(xs[ix+1]-200)/700),c=cloth(xs[ix],ys[iy+1],(xs[ix]-200)/700),d=cloth(xs[ix+1],ys[iy+1],(xs[ix+1]-200)/700);
   return a.map((v,i)=>fy<=fx?v*(1-fx)+b[i]*(fx-fy)+d[i]*fy:v*(1-fy)+d[i]*fx+c[i]*(fy-fx));
  };
  const knot=sampleSkirt(694,935),edge=sampleSkirt(695,935),sideBow=getConfig(state,'lower.skirtBow');
  sideBow.x=33.88+(knot[0]-694)*.22;sideBow.y=25.3+(knot[1]-935)*.22;
  sideBow.rotation=Math.atan2(edge[1]-knot[1],edge[0]-knot[0])*180/Math.PI+bows[1];
  getConfig(state,'uppercollar.collar.tie').rotation=bows[0];
  // Wrist contact follows pelvis, not an unrelated front-of-chest formula.
  // Each authored two-piece arm uses an elbow solve with fixed segment lengths.
  const ms=matrices(state);
  frontSpecs.forEach((p,i)=>{
   const m=ms[p.path],node=getConfig(state,p.display);
   node.x=m[4];node.y=m[5];node.rotation=Math.atan2(m[1],m[0])*180/Math.PI;
   node.scaleX=Math.hypot(m[0],m[1]);node.scaleY=(m[0]*m[3]-m[1]*m[2])/node.scaleX;
   node.mesh=frontMeshes[i](hairDeform(p,curlJoints[i],.15));
  });
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
  if(options.diagnostics!==false){
  const debugGrid=(path,deform,xs,ys)=>{
   const part=manifest.find(p=>p.node===path),mat=ms[path];
   const screen=(x,y)=>{const q=point(part.exportMatrix,x,y),r=point(mat,q[0]-400,q[1]-300);return [state.x+r[0]*(state.scaleX||1),state.y+r[1]*(state.scaleY||1)]};
   const grid=ys.map(y=>xs.map(x=>screen(...deform(x,y,(x-200)/700))));
   return [...grid,...xs.map((_,i)=>grid.map(row=>row[i]))];
  };
  const meshLines=[...hairSpecs.flatMap((p,i)=>debugGrid(p.path,hairFields[i],[p.box[0],p.root[0],p.box[1]],[p.root[1],(p.root[1]+p.box[3])/2,p.box[3]])),...debugGrid('lower.skirt',cloth,[200,375,550,725,900],[820,835,900,980,1060,1140]),...debugGrid('lower.apron',apronCloth,[400,520,640],[820,835,900,980,1030])];
  diagnostics={hairJoints:hairJoints.map(a=>[...a]),hairRootDisplacement:Math.max(...hairSpecs.map((p,i)=>Math.hypot(...hairFields[i](...p.root).map((v,j)=>v-p.root[j])))),meshLines,hairOffsets:[...offset],hemOffsets:[...hem],apronOffsets:[...apron],bowAngles:[...bows],clothForce,verticalTangentJump:Math.max(...[0,1,2].map(c=>{const e=1e-5,m=hem[c*2],p=hem[c*2+1];return Math.abs((along(m,p,.5+e)-along(m,p,.5))/e-(along(m,p,.5)-along(m,p,.5-e))/e)})),skirtKnot:[...knot],apronWaistDisplacement:Math.hypot(...apronCloth(550,820,.5).map((v,i)=>v-[550,820][i])),waistDisplacement:Math.max(...[0,.25,.5,.75,1].map(u=>{const x=200+700*u,p=cloth(x,820,u);return Math.hypot(p[0]-x,p[1]-820)})),scalpDisplacement:Math.hypot(...hair(540,300,.5).map((v,i)=>v-[540,300][i])),contactError};
  }
  return state;
 }};
}
