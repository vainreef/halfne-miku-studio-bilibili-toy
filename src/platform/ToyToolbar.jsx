import React,{memo,useEffect,useRef,useState} from 'react';
import {supports,saveCanvas,relativeToyPath} from './toy';
import captureStage from '../Miku/captureStage';
import './toy.less';
export default memo(function ToyToolbar({stageRef}){
 const [abilities,setAbilities]=useState({}),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[immersive,setImmersive]=useState(false);
 const pending=useRef(null);
 useEffect(()=>{
  let alive=true,off=null;
  const apply=state=>{if(!alive)return;const r=document.documentElement;if(state.viewport?.height){r.style.setProperty('--toy-height',state.viewport.height+'px');r.dataset.toyViewportHeight=state.viewport.height;}for(const side of ['top','right','bottom','left'])r.style.setProperty('--toy-safe-'+side,(state.safeArea?.[side]||0)+'px');setImmersive(!!state.immersive);window.dispatchEvent(new Event('resize'));if(pending.current!==null&&pending.current===state.immersive){pending.current=null;setMessage(state.immersive?'已进入沉浸模式':'已退出沉浸模式')}};
  const connect=async()=>{
   const names=['share','setContainerMode','getContainerState','onContainerChange'],values=await Promise.all(names.map(supports));if(!alive)return;const a=Object.fromEntries(names.map((n,i)=>[n,values[i]]));setAbilities(a);
   off?.();off=null;
   if(a.onContainerChange)try{off=window.toy.onContainerChange(apply)}catch{}
   if(a.getContainerState)try{apply(await window.toy.getContainerState())}catch{}
  };
  const script=document.querySelector('script[src*="/toy/app/sdk/"]');connect();script?.addEventListener('load',connect);window.addEventListener('toy-sdk-ready',connect);
  return()=>{alive=false;off?.();script?.removeEventListener('load',connect);window.removeEventListener('toy-sdk-ready',connect);delete document.documentElement.dataset.toyViewportHeight;for(const key of ['height','safe-top','safe-bottom','safe-left','safe-right'])document.documentElement.style.removeProperty('--toy-'+key)};
 },[]);
 const action=async fn=>{if(busy)return;setBusy(true);setMessage('');try{const result=await fn();if(result)setMessage(result)}catch(error){setMessage(error?.message||'操作未完成，请稍后重试')}finally{setBusy(false)}};
 const save=()=>action(async()=>{if(!stageRef.current)throw Error('角色还在加载，请稍后');return saveCanvas(await captureStage(stageRef.current,{backgroundColor:null,scale:1}))});
 const share=()=>action(async()=>{await window.toy.share({path:relativeToyPath()});return '已打开分享面板'});
 const fullscreen=()=>action(async()=>{pending.current=!immersive;setMessage('正在请求切换，以容器实际显示为准');try{await window.toy.setContainerMode({orientation:'auto',immersive:pending.current})}catch(e){pending.current=null;throw e}});
 return <div className="toy-tools"><button disabled={busy} onClick={save}>保存图片</button>{abilities.share&&<button disabled={busy} onClick={share}>分享 Toy</button>}{abilities.setContainerMode&&abilities.onContainerChange&&<button disabled={busy} onClick={fullscreen}>{immersive?'退出沉浸':'沉浸模式'}</button>}<span role="status" className="toy-status">{message}</span></div>;
});
