import './Miku.less';
import Part from './Part';
import GpuCharacter,{preferGpu} from './GpuCharacter';
import {useEffect,useLayoutEffect,useRef,useState,useMemo,useCallback} from 'react';
import {getInitPhysics,parseConfig,work} from '../Engine/core';
import {compileModel,snapshotRenderTree} from '../Engine/compiledModel';

export default function Miku({control,timestamp,model,runPhysics,createSecondaryMotion,onRendererChange,onRenderedFps,realtimeChannel,zoomLevel=1.0}){
 const secondary=useMemo(()=>createSecondaryMotion?.({diagnostics:false}),[model,createSecondaryMotion]);
 const lastTime=useRef(timestamp),physics=useRef(),gpu=useRef(null),latest=useRef(null);
 const [useGpu,setUseGpu]=useState(preferGpu);
 const legacy=new URLSearchParams(location.search).get('runtime')==='legacy';
 const compiled=useMemo(()=>(useGpu||realtimeChannel)&&!legacy?compileModel(model):null,[model,useGpu,legacy,realtimeChannel]);
 if(!physics.current)physics.current=getInitPhysics(parseConfig(model,control));
 const [renderState,setRenderState]=useState();
 const element=useRef(null),meter=useRef({start:performance.now(),frames:0});
 const rendered=useCallback(()=>{if(element.current)element.current.__renderFrameCount=(element.current.__renderFrameCount||0)+1;const m=meter.current,now=performance.now();m.frames++;if(now-m.start>=500){onRenderedFps?.(m.frames*1000/(now-m.start));m.start=now;m.frames=0;}},[onRenderedFps]);
 useLayoutEffect(()=>{if(!useGpu&&renderState)rendered()},[renderState,useGpu,rendered]);
 useEffect(()=>{onRendererChange?.(useGpu?'gpu':'dom')},[useGpu,onRendererChange]);
 const advance=useCallback((next,time)=>{
  const dt=Math.max(0,Math.min(time-lastTime.current,50));lastTime.current=time;
  work(dt,model,next,physics.current,value=>{physics.current=value},state=>{
   secondary?.step(state,dt,runPhysics);latest.current=state;
   if(useGpu){if(gpu.current?.render(state))rendered();}else setRenderState(compiled?snapshotRenderTree(state):state);
  },runPhysics,compiled?(_,c,p)=>compiled.evaluate(c,p):parseConfig);
 },[model,secondary,runPhysics,useGpu,compiled,rendered]);
 useEffect(()=>realtimeChannel?.subscribe(advance),[realtimeChannel,advance]);
 useEffect(()=>{if(!realtimeChannel||!latest.current)advance(control,timestamp)},[control,timestamp,advance,realtimeChannel]);
 return <div ref={element} className="miku">{useGpu?<GpuCharacter runtime={compiled?'compiled-v2':'legacy'} zoomLevel={zoomLevel} ref={gpu} onFailure={()=>{setRenderState(latest.current?snapshotRenderTree(latest.current):null);setUseGpu(false)}}/>:<Part renderState={renderState}/>}</div>;
}
