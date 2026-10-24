import fs from 'node:fs';
import {makeWhaleRig,master} from '../src/whale/rig.js';
import {parseConfig,getInitPhysics} from '../../src/Engine/core.js';
const cfg=makeWhaleRig(),control=cfg.parseControl();
const pose=parseConfig(cfg.model,control);
const rest=parseConfig(cfg.model,control,getInitPhysics(pose));
// Affine matrices include all ancestors' scale. Root display transform is excluded.
const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const nodes=[];
function walk(n,path='',parent=[1,0,0,1,0,0]){
 const a=(n.rotation||0)*Math.PI/180,sx=n.scaleX||1,sy=n.scaleY||1;
 const matrix=path?multiply(parent,[Math.cos(a)*sx,Math.sin(a)*sx,-Math.sin(a)*sy,Math.cos(a)*sy,n.x||0,n.y||0]):parent;
 nodes.push({path,id:n.id,virtual:!!n.virtual,matrix,anchor:[400+matrix[4],540+matrix[5]],physics:Object.fromEntries(['massX','massY','gravityX','gravityY','damp','rotationMin','rotationMax'].filter(k=>n[k]!==undefined).map(k=>[k,n[k]]))});
 n.components?.forEach(c=>walk(c,path?`${path}.${c.id}`:c.id,matrix));
}
walk(rest);
fs.writeFileSync('skin-lab/art/rig/anchors.json',JSON.stringify({master,nodes},null,2)+'\n');
console.log(`Exported ${nodes.length} node anchors.`);
