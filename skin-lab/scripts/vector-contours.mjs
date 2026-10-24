// Convert binary artwork masks to editable closed SVG curves; no raster embedding.
export function traceContours(mask,w,h,ox=0,oy=0,{epsilon=.9,minArea=1.5}={}){
// Gaussian prefilter suppresses the reference's edge noise before subpixel contouring.
const scalar=new Float64Array(w*h),tmp=new Float64Array(w*h),kernel=[1,4,6,4,1];
for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=0;for(let k=-2;k<=2;k++)v+=(x+k>=0&&x+k<w?mask[y*w+x+k]:0)*kernel[k+2];tmp[y*w+x]=v/16}
for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=0;for(let k=-2;k<=2;k++)v+=(y+k>=0&&y+k<h?tmp[(y+k)*w+x]:0)*kernel[k+2];scalar[y*w+x]=v/16}
const at=(x,y)=>x>=0&&x<w&&y>=0&&y<h?scalar[y*w+x]:0;
const table={1:[[3,0]],2:[[0,1]],3:[[3,1]],4:[[1,2]],5:[[3,0],[1,2]],6:[[0,2]],7:[[3,2]],8:[[2,3]],9:[[2,0]],10:[[0,1],[2,3]],11:[[2,1]],12:[[1,3]],13:[[1,0]],14:[[0,3]]};
const key=p=>p.map(v=>v.toFixed(8)).join(','),graph=new Map(),positions=new Map();
function link(a,b){const ka=key(a),kb=key(b);if(ka===kb)return;positions.set(ka,a);positions.set(kb,b);if(!graph.has(ka))graph.set(ka,new Set());if(!graph.has(kb))graph.set(kb,new Set());graph.get(ka).add(kb);graph.get(kb).add(ka)}
for(let y=-1;y<h;y++)for(let x=-1;x<w;x++){
 const values=[at(x,y),at(x+1,y),at(x+1,y+1),at(x,y+1)],corners=[[x+.5,y+.5],[x+1.5,y+.5],[x+1.5,y+1.5],[x+.5,y+1.5]];
 // Offset iso-value from exact half-grid saddles to avoid degenerate graph vertices.
 const iso=.50001;
 const code=values.reduce((c,v,i)=>c+(v>=iso?1<<i:0),0);
 for(const pair of table[code]||[]){const points=pair.map(e=>{const j=(e+1)%4,t=(iso-values[e])/(values[j]-values[e]);return [ox+corners[e][0]+t*(corners[j][0]-corners[e][0]),oy+corners[e][1]+t*(corners[j][1]-corners[e][1])]});link(...points)}
}
const loops=[];
while(graph.size){const start=graph.keys().next().value;let current=start,loop=[];
 for(let i=0;i<100000;i++){loop.push(positions.get(current));const next=graph.get(current)?.values().next().value;if(!next)throw Error('Open subpixel contour');graph.get(current).delete(next);graph.get(next).delete(current);if(!graph.get(current).size)graph.delete(current);if(!graph.get(next).size)graph.delete(next);current=next;if(current===start)break}
 loops.push(loop);
}
function distance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
function rdp(p,eps=epsilon){if(p.length<3)return p;let d=0,at=0;for(let i=1;i<p.length-1;i++){const v=distance(p[i],p[0],p.at(-1));if(v>d){d=v;at=i}}return d>eps?[...rdp(p.slice(0,at+1),eps).slice(0,-1),...rdp(p.slice(at),eps)]:[p[0],p.at(-1)]}
function closed(p){let k=1;for(let i=1;i<p.length;i++)if(Math.hypot(p[i][0]-p[0][0],p[i][1]-p[0][1])>Math.hypot(p[k][0]-p[0][0],p[k][1]-p[0][1]))k=i;return [...rdp(p.slice(0,k+1)).slice(0,-1),...rdp([...p.slice(k),p[0]]).slice(0,-1)]}
const area=p=>Math.abs(p.reduce((a,v,i)=>{const q=p[(i+1)%p.length];return a+v[0]*q[1]-q[0]*v[1]},0)/2);
return loops.filter(p=>area(p)>minArea).map(closed);

}
export function curvePath(loops,tension=.13){
 const fmt=v=>Number(v.toFixed(2));
 return loops.map(p=>{
  if(p.length<3)return '';
  let d='M'+p[0].map(fmt).join(' ');
  for(let i=0;i<p.length;i++){
   const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length],e=p[(i+2)%p.length];
   const c1=[b[0]+(c[0]-a[0])*tension,b[1]+(c[1]-a[1])*tension];
   const c2=[c[0]-(e[0]-b[0])*tension,c[1]-(e[1]-b[1])*tension];
   d+='C'+[...c1,...c2,...c].map(fmt).join(' ');
  }
  return d+'Z';
 }).join('');
}
