import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createWhaleModel} from '../src/model.js';
import resources from '../src/whale/resources.js';
import {createSecondaryMotion} from '../src/whale/secondaryMotion.js';
import classic from '../../src/defaultModel.js';
import {parseConfig,getInitPhysics,work} from '../../src/Engine/core.js';
import {getConfig,getAbsolutePos} from '../../src/Engine/modelUtils.js';
const report=[];
const baseline=JSON.parse(fs.readFileSync('skin-lab/art/rig/baseline.json'));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(baseline.source)).digest('hex'),baseline.sha256);
report.push('经典初音源码 SHA-256 与制作前一致');
const cfg=createWhaleModel(),nodes=[];
function collect(n,p=''){nodes.push([p,n]);const ids=new Set();n.components?.forEach(c=>{assert(!ids.has(c.id),`Duplicate ${p}.${c.id}`);ids.add(c.id);collect(c,p?`${p}.${c.id}`:c.id)})}
collect(cfg.model);
let preserved=0;
const redesigned=new Set(['tailL','tailR','lower.skirt','lower.belt','uppercollar.collar.tie','head.momiL','head.momiR','upper.shirtL','upper.shirtR']);
for(const [path,n] of nodes){
 if(!path||['hairOuterL','hairOuterR','hairInnerL','hairInnerR','hairScalp','hairFlyL','hairFlyR','frontLockL','frontLockR','whaleTail','lower.whaleTailRoot','head.headDress','hairBackCenter','lower.apron','lower.handL','lower.handR','lower.skirtBow','hairUnderL','hairUnderR','head.underHairRootL','head.underHairRootR','head.hairCap'].includes(path))continue;
 if(redesigned.has(path)){assert.equal(n.massY,undefined,`${path}: obsolete point pendulum remains`);assert.equal(n.scaleY,1);continue;}
 const original=getConfig(classic.model,path);
 for(const k of ['massX','massY','gravityX','gravityY','damp','rotationMin','rotationMax'])assert.equal(n[k],original[k],`${path}.${k} changed`);
 if(n.massX!==undefined)preserved++;
}
report.push(`${preserved} 个未重构的原物理节点参数保持；9 个错误拓扑节点已移除旧单点摆锤`);
assert.equal(Object.keys(resources).filter(k=>k.startsWith('head.face.eyes:')).length,16);
assert.equal(Object.keys(resources).filter(k=>k.startsWith('head.face.mouth:')).length,56);
for(const resource of Object.values(resources))assert(resource.startsWith('data:image/svg+xml;')&&!decodeURIComponent(resource).includes('<image'));
report.push('完整 16 眼睛 / 56 嘴型；独立矢量图层，无整图覆盖');
const rear=decodeURIComponent(resources.hairBackCenter);
for(const path of ['tailL','tailR','hairUnderL','hairUnderR','head.clipBL','head.hairCap']){
 assert(!resources[path],`Duplicate rear hair resource: ${path}`);
 assert.equal(getConfig(cfg.model,path).virtual,true,`Obsolete display not disabled: ${path}`);
}
const hairSections=[['rear-central-curtain','hairBackCenter'],['rear-outer-left','hairOuterL'],['rear-outer-right','hairOuterR'],['rear-under-left','hairInnerL'],['rear-under-right','hairInnerR'],['rear-scalp','hairScalp'],['rear-flyaways-left','hairFlyL'],['rear-flyaways-right','hairFlyR']];
for(const [id,path] of hairSections){
 assert(resources[path]&&JSON.parse(fs.readFileSync('skin-lab/art/rig/parts.json')).some(p=>p.id===id&&p.node===path),`Missing section ${id}`);
 assert(cfg.model.components.findIndex(n=>n.id===path)<cfg.model.components.findIndex(n=>n.id==='lower'));
}
for(const side of ['L','R']){
 assert(getConfig(cfg.model,`head.momi${side}`).virtual);
 assert(cfg.model.components.findIndex(n=>n.id===`frontLock${side}`)>cfg.model.components.findIndex(n=>n.id===`arm${side}`),'Front lock below arm');
}
assert(!decodeURIComponent(resources['head.phoneR']).includes('M921 432'),'Flyaway remained in fin decoration');
assert(!decodeURIComponent(resources['head.base']).includes('fill="url(#hair)"'));
assert(cfg.model.components.findIndex(n=>n.id==='hairBackCenter')<cfg.model.components.findIndex(n=>n.id==='lower'));
report.push('后发八分区：五组垂发、两组游丝、刚性发帽；贴脸卷发在手臂上层，旧节点无重复绘制');

const manifest=JSON.parse(fs.readFileSync('skin-lab/art/rig/parts.json'));
const anchors=JSON.parse(fs.readFileSync('skin-lab/art/rig/anchors.json'));
const curl=manifest.find(p=>p.node==='head.ahoge'),[aa,ab,ac,ad,ae,af]=curl.exportMatrix;
const tip=[aa*583+ac*181+ae,ab*583+ad*181+af];
assert(Math.hypot(tip[0]-curl.resourceCenter[0],tip[1]-curl.resourceCenter[1])<1e-8,'Ahoge pointed root differs from rotation center');
const curlSvg=decodeURIComponent(resources['head.ahoge']);
assert(!/<path[^>]*stroke=/.test(curlSvg),'Unexpected curl outline');
const headOrder=getConfig(cfg.model,'head').components.map(n=>n.id);
assert(headOrder.indexOf('ahoge')>headOrder.indexOf('headDress'),'Curl must render in front of lace fan');
assert(headOrder.indexOf('phoneR')>headOrder.indexOf('hairCap')&&headOrder.indexOf('phoneR')<headOrder.indexOf('momiR'),'Fin ear must be in front of rear cap and behind face-framing hair');
for(const id of ['bangs','momiL','momiR'])assert(headOrder.indexOf('headDress')<headOrder.indexOf(id),'Lace must stay behind front hair');
report.push('呆毛下端尖点 (583,181) 精确映射旋转中心 (400,300)，无描边，绘制在头圈前');

let maxError=0;
for(const part of manifest){
 const a=anchors.nodes.find(n=>n.path===part.node).matrix,m=part.exportMatrix;
 for(const [x,y] of [[0,0],[540,680],[1254,1254]]){
  const u=m[0]*x+m[2]*y+m[4]-400,v=m[1]*x+m[3]*y+m[5]-300;
  const wx=a[0]*u+a[2]*v+a[4],wy=a[1]*u+a[3]*v+a[5];
  const err=Math.hypot(wx-(x-540)*.22,wy-(y-1220)*.22);maxError=Math.max(maxError,err);
 }
}
assert(maxError<1e-6);report.push(`母版 → 部件 → 骨架的静态重建误差 ${maxError.toExponential(2)} 逻辑像素`);
function simulate(){
 const config=createWhaleModel(),control0=config.parseControl();
 let physics=getInitPhysics(parseConfig(config.model,control0)),state,control=control0;
 const trace=[];let maxTailRotation=0;
 for(let i=0;i<1500;i++){
  const keys=['EyeJaded','MouthHappy',...((i%51<7)?['EyeBlink']:[]),...((i%30<10)?['MouthAA']:[])];
  control=config.parseControl({...control,mouseX:400+400*Math.sin(i*.045),mouseY:300+300*Math.cos(i*.031),keyInput:keys});
  work(i%3===0?50:1000/60,config.model,control,physics,p=>physics=p,r=>state=r,true);
  const visit=n=>{for(const [k,v] of Object.entries(n))if(typeof v==='number')assert(Number.isFinite(v),`Non-finite ${n.id}.${k}`);n.components?.forEach(visit)};visit(state);
  const tail=getConfig(state,'whaleTail'),anchor=getAbsolutePos(state,'lower.whaleTailRoot');
  assert(Math.hypot(tail.x-anchor.x,tail.y-anchor.y)<1e-8);
  for(const side of ['L','R']){const strand=getConfig(state,`hairUnder${side}`),root=getAbsolutePos(state,`head.underHairRoot${side}`);assert(Math.hypot(strand.x-root.x,strand.y-root.y)<1e-8,'Under-lock detached from virtual scalp');}

  assert(tail.scaleY===undefined,'Tail must not stretch');
  maxTailRotation=Math.max(maxTailRotation,Math.abs(tail.rotation));
  if(i%60===0)trace.push([getConfig(state,'head').rotation,getConfig(state,'tailL').rotation,tail.rotation]);
 }
 assert(maxTailRotation<=15.00001);return {trace,maxTailRotation};
}
const first=simulate(),second=simulate();assert.deepEqual(first.trace,second.trace);
report.push('1,500 帧运动压力测试 × 2：无非有限数值，鲸尾跟随腰部，独立工厂回放一致');
report.push(`鲸尾无拉伸，旋转受 ±15° 约束（测试最大 ${first.maxTailRotation.toFixed(2)}°）`);
// Exercise actual render-time solver, not just the underlying legacy engine.
function secondaryRun(){
 const config=createWhaleModel(),solver=createSecondaryMotion(resources);let maxContact=0,maxBend=0,maxHem=0,maxApron=0,maxBow=[0,0],maxHairDifference=0;
 let physics=getInitPhysics(parseConfig(config.model,config.parseControl()));
 for(let i=0;i<540;i++){
  const moving=i<240,mouseX=moving?400+380*Math.sin(i*.075):400,mouseY=moving?300+260*Math.cos(i*.049):300;
  const c=config.parseControl({mouseX,mouseY});let state;
  work(1000/60,config.model,c,physics,p=>physics=p,r=>state=r,true);
  solver.step(state,1000/60,true);const d=solver.diagnostics;
  assert.equal(d.hairRootDisplacement,0,'Hair strand root detached');
  maxHairDifference=Math.max(maxHairDifference,Math.abs(d.hairJoints[1][1]-d.hairJoints[2][1]),Math.abs(d.hairJoints[0][1]-d.hairJoints[3][1]));
  assert(d.hairJoints.length===7&&d.hairJoints.flat().every(x=>Number.isFinite(x)&&Math.abs(x)<=24));
  assert.equal(d.waistDisplacement,0,'Waist line detached');assert.equal(d.scalpDisplacement,0,'Scalp detached');
  maxHem=Math.max(maxHem,...d.hemOffsets.map(Math.abs));maxApron=Math.max(maxApron,...d.apronOffsets.map(Math.abs));maxBow=maxBow.map((v,i)=>Math.max(v,Math.abs(d.bowAngles[i])));
  maxContact=Math.max(maxContact,d.contactError);maxBend=Math.max(maxBend,...d.hairOffsets.map(Math.abs));
  assert(d.hairOffsets.every(x=>Number.isFinite(x)&&Math.abs(x)<=32));
  assert.equal(d.apronWaistDisplacement,0,'Apron sewn waist detached');
  assert(d.apronOffsets.every(x=>Number.isFinite(x)&&Math.abs(x)<=22));
  assert(d.bowAngles.every(x=>Number.isFinite(x)&&Math.abs(x)<=16));
  for(const path of ['upper.shirtL','upper.shirtR','uppercollar.collar','uppercollar.collar.neck']){const node=getConfig(state,path);assert.equal(node.rotation,0);assert.equal(node.scaleY||1,1);}
  assert(d.verticalTangentJump<.02,'Cloth curve tangent broke at mid-joint');
  assert(d.hemOffsets.every(x=>Number.isFinite(x)&&Math.abs(x)<=28));
 }
 assert(maxContact<1e-6,`Wrist contact error ${maxContact}`);
 assert(solver.diagnostics.apronOffsets.length===6);
 assert(maxHem>1&&maxApron>.5&&maxBow.every(x=>x>.2),'New garment dynamics were not excited');
 assert(maxBend>.1,'Motion test did not excite the secondary solver');
 assert(maxHairDifference>.1,'Rear sections still move as a single synchronized slab');
 assert(Math.max(...solver.diagnostics.hairOffsets.map(Math.abs),...solver.diagnostics.hemOffsets.map(Math.abs),...solver.diagnostics.apronOffsets.map(Math.abs),...solver.diagnostics.bowAngles.map(Math.abs))<.01,'Secondary motion did not settle');
 return {maxContact,maxBend,maxHem,maxApron,maxBow,settled:solver.diagnostics};
}
const secondaryA=secondaryRun(),secondaryB=secondaryRun();assert.deepEqual(secondaryA,secondaryB);
report.push(`540 帧急转/停止测试 × 2：腰线/头皮固定，手腕接触误差 ${secondaryA.maxContact.toExponential(2)}，5 秒内收敛，重复输入一致`);
report.push(`胸口白布刚性固定；裙摆/围裙三列双关节独立运动；摆幅 ${secondaryA.maxHem.toFixed(2)}/${secondaryA.maxApron.toFixed(2)} 源像素，双蝴蝶结 ${secondaryA.maxBow.map(x=>x.toFixed(2)).join('/')}°，静止后收敛`);
fs.writeFileSync('skin-lab/art/rig/validation-report.json',JSON.stringify({checks:report,nodeCount:nodes.length,resourceCount:Object.keys(resources).length,maxStaticError:maxError,secondary:secondaryA},null,2)+'\n');
console.log(report.map(s=>'✓ '+s).join('\n'));
