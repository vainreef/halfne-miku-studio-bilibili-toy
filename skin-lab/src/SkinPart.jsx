import LiveMesh from '../../src/Miku/MeshCanvas.jsx';
import React,{useLayoutEffect,useRef} from 'react';
import {rearHairPaths,frontHairPaths,rearHairGreenFilter,highlightMixedHair} from './whale/hairGroups.js';
// Frozen art comparisons must stay vector-sharp at arbitrary crop zoom.
// Simulation continues to use the same Canvas meshes as the runtime.
const vectorNeutral=new URLSearchParams(location.search).get('neutral')==='1';
const hairDebug=new URLSearchParams(location.search).get('hairDebug');
const backHairDebug=hairDebug==='back';
export default function SkinPart({renderState:n,hiddenPaths=[],path=''}){
 if(!n||n.virtual||hiddenPaths.includes(path))return null;
 const rear=rearHairPaths.has(path),group=rear?'back':frontHairPaths.has(path)?'front':path==='head.phoneR'?'mixed-hair-and-fin':undefined;
 const highlight=backHairDebug?rear:hairDebug==='front'&&frontHairPaths.has(path);
 const resource=backHairDebug?highlightMixedHair(path,n.resource):n.resource;
 const transform=`${n.skewX?`skewX(${-n.skewX}deg) `:''}${n.skewY?`skewY(${n.skewY}deg) `:''}translate(${n.x||0}px,${n.y||0}px) rotate(${n.rotation||0}deg) scale(${n.scaleX||1},${n.scaleY||1})`;
 return <div data-id={n.id} data-hair-group={group} style={{position:'absolute',transform,opacity:n.opacity,visibility:n.visibility}}>
 {n.mesh&&!vectorNeutral?<LiveMesh highlight={highlight} mesh={n.mesh} width={n.width} height={n.height} resourceCenterX={n.resourceCenterX||0} resourceCenterY={n.resourceCenterY||0}/>:n.resource?<img src={resource} style={{transform:`translate(${-n.resourceCenterX}px,${-n.resourceCenterY}px)`,width:n.width,height:n.height,filter:highlight?rearHairGreenFilter:undefined}}/>:null}
 {n.components?.map((child,i)=><SkinPart key={child.id||i} renderState={child} hiddenPaths={hiddenPaths} path={path?`${path}.${child.id}`:child.id}/>)}
 </div>;
}
