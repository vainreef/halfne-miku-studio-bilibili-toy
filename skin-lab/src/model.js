import classic from '../../src/defaultModel.js';
import {getConfig} from '../../src/Engine/modelUtils.js';
import {makeWhaleRig} from './whale/rig.js';
import resources from './whale/resources.js';
import {createSecondaryMotion} from './whale/secondaryMotion.js';

export function createWhaleModel(){
 const config=makeWhaleRig(),root=config.model;
 config.background=classic.background;
 // Host integration must call step(renderState, dt, physicsEnabled) after work().
 config.createSecondaryMotion=options=>createSecondaryMotion(resources,options);
 for(const [path,resource] of Object.entries(resources)){
  if(path.includes(':'))continue;
  Object.assign(getConfig(root,path),{resource,width:800,height:600,resourceCenterX:400,resourceCenterY:300});
 }
 Object.assign(getConfig(root,'head.face.eyes'),{
  resource:c=>resources[`head.face.eyes:${c.eyeType}${c.eyeOpen}`]||resources['head.face.eyes:happyo'],
  width:800,height:600,resourceCenterX:400,resourceCenterY:300,
 });
 Object.assign(getConfig(root,'head.face.mouth'),{
  resource:c=>resources[`head.face.mouth:${c.mouthType}${c.mouth}`]||resources['head.face.mouth:happy1'],
  width:800,height:600,resourceCenterX:400,resourceCenterY:300,
 });
 // Former rear-hair nodes remain addressable markers, but draw no duplicate assets.
 for(const path of ['tailL','tailR','hairUnderL','hairUnderR','head.clipBL','head.hairCap']){
  const marker=getConfig(root,path);delete marker.resource;delete marker.mesh;marker.virtual=true;
 }
 // Head lace is behind the face-framing locks/bangs, never pasted over them.
 const collar=getConfig(root,'uppercollar.collar');
 const tie=collar.components.splice(collar.components.findIndex(n=>n.id==='tie'),1)[0];
 collar.components.push(tie);
 const head=getConfig(root,'head');
 const frontBow=head.components.splice(head.components.findIndex(n=>n.id==='clipFR'),1)[0];
 const ahoge=head.components.splice(head.components.findIndex(n=>n.id==='ahoge'),1)[0];
 const fin=head.components.splice(head.components.findIndex(n=>n.id==='phoneR'),1)[0];
 head.components.splice(head.components.findIndex(n=>n.id==='hairCap')+1,0,fin);
 const dress=head.components.splice(head.components.findIndex(n=>n.id==='headDress'),1)[0];
 head.components.splice(head.components.findIndex(n=>n.id==='base'),0,dress);
 // The curl is in front of the white lace fan; retain its existing joint/physics.
 head.components.splice(head.components.findIndex(n=>n.id==='headDress')+1,0,ahoge);
 head.components.push(frontBow);
 // Forearms/cuffs are in front; shoulder puffs stay behind the face-framing locks.
 for(const id of ['armL','armR']){
  const index=root.components.findIndex(n=>n.id===id);
  const arm=root.components.splice(index,1)[0];root.components.push(arm);
 }
 // Side curls must cover sleeves, but their roots sit UNDER the face-framing
 // hair/bangs. Proxies retain the original joint and full head transform.
 for(const side of ['L','R']){
  const original=getConfig(root,`head.momi${side}`);
  const proxy=getConfig(root,`frontLock${side}`);
  Object.assign(proxy,{resource:original.resource,width:800,height:600,resourceCenterX:400,resourceCenterY:300});
  root.components.splice(root.components.indexOf(proxy),1);root.components.push(proxy);
  original.virtual=true;
 }
 // Complete temple silhouettes belong to head.bangs. The side-lock textures
 // feather only their hidden upper roots, so their curls may stay above sleeves
 // without painting long root slabs over the forehead or lifting the whole head.
 return config;
}
export default createWhaleModel();
