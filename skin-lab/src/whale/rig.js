import makeBase from './baseRig.js';
import {getConfig,getAbsolutePos,physicsRotation} from '../../../src/Engine/modelUtils.js';
export const master={origin:[540,1220],scale:.22,rigOrigin:[400,540]};
export function makeWhaleRig(){
 const config=makeBase(),root=config.model;
 root.x=358;root.y=548;root.scaleX=root.scaleY=1.62;
 const n=path=>getConfig(root,path);
 const shift=(path,key,offset)=>{const f=n(path)[key];n(path)[key]=(c,r,p)=>f(c,r,p)+offset};
 // Adjust rest joints to the reference, retain original displacement formulas.
 shift('head','x',-1);shift('head','y',1.2);
 shift('upper','y',-21.2);shift('lower','x',-.5);shift('lower','y',-22.55);
 n('uppercollar.collar').y=-19.8;
 n('uppercollar.collar.markL').x=-19.55;n('uppercollar.collar.markR').x=27.95;
 n('uppercollar.collar.markL').y=n('uppercollar.collar.markR').y=2.4;
 n('uppercollar.collar.neck').x=2.2;
 for(const [path,x,y] of [['feetL',-24.2,-5.5],['feetR',37.4,-5.5],['lower.markL',-19.8,46.2],['lower.markR',28.6,46.2],['head.tailL',-41.8,-61.6],['head.tailR',57.2,-61.6],['head.phoneL',-55,-44],['head.phoneR',68.2,-44]]){
  n(path).x=x;n(path).y=y;
 }
 shift('armL','x',-15.9);shift('armL','y',-10.35);
 shift('armR','x',24.6);shift('armR','y',-9.35);
 n('lower').components.unshift({id:'whaleTailRoot',x:42.9,y:34.1,virtual:true});
 root.components.unshift({id:'whaleTail',
  x:(c,r)=>getAbsolutePos(r,'lower.whaleTailRoot')?.x,
  y:(c,r)=>getAbsolutePos(r,'lower.whaleTailRoot')?.y,
  gravityX:0,gravityY:.003,massX:0,massY:60,damp:.006,
  rotationMin:-15,rotationMax:15,rotation:physicsRotation('whaleTail')});
 // The curl is attached at its lower pointed tip in the source artboard: (583,181).
 // Neutral head origin is (0,-118.8) in root-local coordinates.
 n('head.ahoge').x=(583-master.origin[0])*master.scale;
 n('head.ahoge').y=(181-master.origin[1])*master.scale+118.8;
 n('head').components.push({id:'headDress',x:0,y:-101.2});
 const head=n('head');
 const lock=head.components.splice(head.components.findIndex(p=>p.id==='momiL'),1)[0];
 head.components.splice(head.components.findIndex(p=>p.id==='momiR'),0,lock);
 // Whale-specific gesture envelope; deliberately separate from classic Miku.
 n('head').rotation=({side_sin})=>side_sin*12;
 n('upper').rotation=({side_sin})=>-side_sin*5;
 n('uppercollar.collar').rotation=0;
 n('uppercollar.collar.neck').rotation=0;
 // Bow pin at source (540,723), not the old necktie's hanging root.
 n('uppercollar.collar.tie').x=.25;n('uppercollar.collar.tie').y=.66;
 // Palms sit over the skirt, but under the apron edge. Forearms/cuffs remain in front.
 n('lower').components.push({id:'skirtBow',x:33.88,y:25.3},{id:'handL',x:0,y:0},{id:'handR',x:0,y:0},{id:'apron',x:0,y:0});
 root.components.splice(root.components.findIndex(p=>p.id==='tailL'),0,{
  id:'hairBackCenter',x:(c,r)=>getAbsolutePos(r,'head')?.x,
  y:(c,r)=>getAbsolutePos(r,'head')?.y,
  rotation:(c,r)=>getAbsolutePos(r,'head')?.rotation,
 });
 // Separate rear sections share scalp attachment, not independent ponytail anchors.
 for(const id of ['hairOuterL','hairOuterR','hairInnerL','hairInnerR','hairScalp','hairFlyL','hairFlyR']){
  root.components.splice(root.components.findIndex(n=>n.id==='lower'),0,{id,
   x:(c,r)=>getAbsolutePos(r,'head')?.x,y:(c,r)=>getAbsolutePos(r,'head')?.y,
   rotation:(c,r)=>getAbsolutePos(r,'head')?.rotation});
 }
 // Middle under-locks: head-located but rendered behind clothing and front curls.
 for(const [side,sx,sy] of [['L',333,550],['R',797,550]]){
  const marker=`underHairRoot${side}`;
  head.components.push({id:marker,x:(sx-master.origin[0])*master.scale,
   y:(sy-master.origin[1])*master.scale+118.8,virtual:true});
  const display={id:`hairUnder${side}`,
   x:(c,r)=>getAbsolutePos(r,`head.${marker}`)?.x,
   y:(c,r)=>getAbsolutePos(r,`head.${marker}`)?.y,
   rotation:(c,r)=>getAbsolutePos(r,`head.${marker}`)?.rotation};
  root.components.splice(root.components.findIndex(n=>n.id==='lower'),0,display);
 }
 // Hair cap is a separate paint layer, rigidly attached to the same head.
 head.components.splice(head.components.findIndex(n=>n.id==='base'),0,{id:'hairCap',x:0,y:0});
 // Whale topology: scalp-attached curtain and waist-attached fabric, not pendulums.
 const fixed=path=>{const node=n(path);for(const k of ['massX','massY','gravityX','gravityY','damp','rotationMin','rotationMax'])delete node[k];node.rotation=0;node.scaleX=node.scaleY=1;return node};
 for(const path of ['tailL','tailR','lower.skirt','lower.belt','uppercollar.collar.tie','head.momiL','head.momiR','upper.shirtL','upper.shirtR'])fixed(path);
 for(const side of ['L','R']){
  n(`head.tail${side}`).y=-83.6;
  n(`tail${side}`).rotation=(c,r)=>getAbsolutePos(r,`head.tail${side}`)?.rotation;
 }
 n('head.momiL').x=-45.8;n('head.momiL').y=-83.6;
 n('head.momiR').x=44.2;n('head.momiR').y=-83.6;
 for(const side of ['L','R'])root.components.push({id:`frontLock${side}`,
  x:(c,r)=>getAbsolutePos(r,`head.momi${side}`)?.x,
  y:(c,r)=>getAbsolutePos(r,`head.momi${side}`)?.y,
  rotation:(c,r)=>getAbsolutePos(r,`head.momi${side}`)?.rotation});
 return config;
}
