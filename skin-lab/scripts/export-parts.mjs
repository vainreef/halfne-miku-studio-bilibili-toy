import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildSync} from 'esbuild';
const lab=fileURLToPath(new URL('..',import.meta.url));
const project=path.dirname(lab);
process.chdir(project);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'whale-rig-'));
try{
 buildSync({entryPoints:[path.join(lab,'scripts/snapshot-rig.js')],bundle:true,platform:'node',format:'esm',outfile:path.join(temp,'snapshot.mjs')});
 execFileSync(process.execPath,[path.join(temp,'snapshot.mjs')],{stdio:'inherit'});
}finally{fs.rmSync(temp,{recursive:true,force:true})}
const source=fs.readFileSync(path.join(lab,'art/source/whale-master.svg'),'utf8');
const defs=source.match(/<defs>[\s\S]*?<\/defs>/)?.[0];
if(!defs)throw Error('Master defs missing');
// Keep only definitions referenced by this layer (including transitive references).
// Unused gradients/clip paths in every image otherwise multiply SVG decoding DOMs.
function requiredDefs(body){
 const inner=defs.slice(6,-7),entries=[];let depth=0,start=0;
 for(const tag of inner.matchAll(/<\/?[\w:-]+\b[^>]*>/g)){
  const closing=tag[0].startsWith('</'),single=tag[0].endsWith('/>');
  if(depth===0&&!closing)start=tag.index;
  if(!closing&&!single)depth++;if(closing)depth--;
  if(depth===0){const text=inner.slice(start,tag.index+tag[0].length),id=text.match(/\bid="([^"]+)"/)?.[1];if(id)entries.push({id,text});}
 }
 const needed=new Set(),scan=text=>{for(const m of text.matchAll(/url\(#([^)]+)\)|(?:xlink:)?href="#([^"]+)"/g))needed.add(m[1]||m[2]);};scan(body);
 let previous=-1;while(previous!==needed.size){previous=needed.size;for(const entry of entries)if(needed.has(entry.id))scan(entry.text);}
 return '<defs>'+entries.filter(p=>needed.has(p.id)).map(p=>p.text).join('')+'</defs>';
}
const anchors=JSON.parse(fs.readFileSync(path.join(lab,'art/rig/anchors.json')));
const get=path=>anchors.nodes.find(n=>n.path===path);
const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const inverse=([a,b,c,d,e,f])=>{const det=a*d-b*c;if(Math.abs(det)<1e-8)throw Error('Degenerate rest transform');return [d/det,-b/det,-c/det,a/det,(c*f-d*e)/det,(b*e-a*f)/det]};
const [ox,oy]=anchors.master.origin,s=anchors.master.scale;
const parts=[],resources={};
for(const match of source.matchAll(/<g id="([^"]+)" data-node="([^"]+)"([^>]*)>([\s\S]*?)<\/g><!-- \/part -->/g)){
 const [,id,node,attrs,body]=match,state=attrs.match(/data-state="([^"]+)"/)?.[1];
 // Export every compatible expression state.
 const joint=get(node);if(!joint)throw Error(`Unmapped node: ${node}`);
 const m=multiply(inverse(joint.matrix),[s,0,0,s,-ox*s,-oy*s]);m[4]+=400;m[5]+=300;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">${requiredDefs(body)}<g transform="matrix(${m.map(v=>+v.toFixed(8)).join(' ')})">${body}</g></svg>`;
 fs.writeFileSync(path.join(lab,`art/generated/${id}.svg`),svg);
 const key=state?`${node}:${state}`:node;
 resources[key]=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
 parts.push({id,node,state:state||null,file:`generated/${id}.svg`,resourceCenter:[400,300],resourceSize:[800,600],exportMatrix:m,restAnchor:joint.anchor});
}
if(parts.length<30)throw Error(`Unexpected layer count ${parts.length}`);
fs.writeFileSync(path.join(lab,'art/rig/parts.json'),JSON.stringify(parts,null,2)+'\n');
fs.writeFileSync(path.join(lab,'src/whale/resources.js'),'// GENERATED from art/source/whale-master.svg. Run npm run art:export.\nexport default '+JSON.stringify(resources,null,2)+';\n');

console.log(`Exported ${parts.length} SVG layers/states. All pivots normalized to (400,300).`);

// Remove superseded merged and pre-split assets; current semantic sections stay.
for(const name of ['rear-hair','hair-back-center','hair-back-left','hair-back-right','hair-under-left','hair-under-right','hair-cap','hair-loop-left']){
 const file=path.join(lab,'art/generated',name+'.svg');if(fs.existsSync(file))fs.unlinkSync(file);
}
