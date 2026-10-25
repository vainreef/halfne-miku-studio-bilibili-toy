import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import './App.less';
import defaultConfig from './defaultModel';
import whaleConfig from './whaleGirlModel';
import {createFrameChannel} from './Engine/frameChannel';
import {createGyroController,requestGyroPermission} from './Engine/gyroscope';
import {bgm} from './Engine/bgm';
import Stage from './components/Stage/Stage';
import QuickPad from './components/QuickPad/QuickPad';
import ToyMenu from './components/ToyMenu/ToyMenu';
import {readSkin,rememberSkin} from './platform/toy';

export const PRESET_SKINS=[{id:'miku',name:'初音',config:defaultConfig},{id:'whale',name:'大肥鱼',config:whaleConfig}];
const query=new URLSearchParams(location.search);
const initialSkin=(query.get('skin')||readSkin())==='miku'?'miku':'whale';
const shapes=['MouthAA','MouthEE','MouthOO','MouthEH','MouthOH','MouthTeeth','MouthMM'];
const moods=['MouthHappy','MouthNeutral','MouthCat','MouthAngry','MouthPout','MouthDrool','MouthDuck','MouthTongue'];
function readSettings(){try{return JSON.parse(localStorage.getItem('halfne-toy-settings'))||{}}catch{return {}}}

// The Toy has a single live interaction loop: no editor, timeline, recording or
// parameter-panel state is mounted or imported into this application entry.
export default function App(){
 const [skin,setSkin]=useState(initialSkin),config=skin==='whale'?whaleConfig:defaultConfig;
 const [settings,setSettings]=useState(readSettings);
 const runPhysics=settings.physics!==false,follow=settings.follow!==false,gyroEnabled=settings.gyroscope!==false,bgmEnabled=settings.bgm!==false;
 const [keys,setKeys]=useState([]),[resetter,setResetter]=useState(0),[panel,setPanel]=useState(null);
 const backgrounds=defaultConfig.background;
 const [backgroundId,setBackgroundId]=useState(()=>{try{return localStorage.getItem('halfne-toy-background')||Object.keys(backgrounds)[0]}catch{return Object.keys(backgrounds)[0]}});
 const stageBackground=backgroundId==='plain'?'#e9eef7':backgrounds[backgroundId]||Object.values(backgrounds)[0];
 const stageRef=useRef(null),latestMouseDown=useRef(false),target=useRef([400,300]);
 const touchTarget=useRef([400,300]),gyroOffset=useRef([0,0]),gyroActive=useRef(false),gyroController=useRef(null);
 const channel=useMemo(createFrameChannel,[]),live=useRef(config.parseControl());
 const initial=useMemo(()=>config.parseControl(),[config,resetter]);
 const [view,setView]=useState({control:initial,timestamp:performance.now()});
 const closePanel=useCallback(()=>setPanel(null),[]);
 const updateSetting=useCallback((key,value)=>setSettings(s=>{const next={...s,[key]:value};try{localStorage.setItem('halfne-toy-settings',JSON.stringify(next))}catch{}return next}),[]);
 const reset=useCallback(()=>{
  touchTarget.current=[400,300];target.current=[400,300];gyroOffset.current=[0,0];
  gyroController.current?.resetBaseline();gyroController.current?.notifyTouch(false);
  setKeys([]);live.current=config.parseControl();setResetter(v=>v+1);
 },[config]);
 const switchSkin=useCallback(id=>{if(!PRESET_SKINS.some(s=>s.id===id))return;rememberSkin(id);setSkin(id);touchTarget.current=[400,300];target.current=[400,300];setKeys([]);setResetter(v=>v+1);setPanel(null)},[]);
 useEffect(()=>{live.current=initial;setView({control:initial,timestamp:performance.now()})},[initial]);
 useEffect(()=>{try{localStorage.setItem('halfne-toy-background',backgroundId)}catch{}},[backgroundId]);
 useEffect(()=>{
  const controller=createGyroController({
   onUpdate:({x,y,active})=>{gyroOffset.current=[x,y];gyroActive.current=active;}
  });
  gyroController.current=controller;
  if(gyroEnabled)controller.enable();
  return()=>controller.destroy();
 },[]);
 useEffect(()=>{
  bgm.setEnabled(bgmEnabled);
 },[bgmEnabled]);
 useEffect(()=>{
  return ()=>bgm.destroy();
 },[]);
 useEffect(()=>{
  if(gyroEnabled)gyroController.current?.enable();
  else gyroController.current?.disable();
 },[gyroEnabled]);
 useEffect(()=>{
  const auth=()=>{if(gyroEnabled)requestGyroPermission().catch(()=>{})};
  window.addEventListener('click',auth,{once:true});
  window.addEventListener('touchend',auth,{once:true});
  return()=>{
   window.removeEventListener('click',auth);
   window.removeEventListener('touchend',auth);
  };
 },[gyroEnabled]);
 useEffect(()=>{
  let frame,last=performance.now(),lastUi=0;
  const animate=ts=>{
   frame=requestAnimationFrame(animate);
   if(document.hidden){last=ts;return}
   const ratio=Math.min(.02*Math.max(0,Math.min(ts-last,50)),1);last=ts;
   const isTouching=latestMouseDown.current;
   const [tx,ty]=touchTarget.current,[gx,gy]=gyroOffset.current;
   let destX=tx,destY=ty;
   if(gyroEnabled&&gyroActive.current){
    if(isTouching){
     destX=tx+gx*0.15;destY=ty+gy*0.15;
    }else{
     destX=400+gx;destY=300+gy;
    }
   }
   destX=Math.max(0,Math.min(800,destX));destY=Math.max(0,Math.min(600,destY));
   target.current=[destX,destY];
   const [x,y]=follow?target.current:[400,300],prev=live.current;
   const ease=(a,b)=>Math.abs(a-b)<1?b:+(a+(b-a)*ratio).toFixed(1);
   live.current=config.parseControl({...prev,mouseX:ease(prev.mouseX,x),mouseY:ease(prev.mouseY,y),keyInput:keys,timestamp:ts});
   channel.publish(live.current,ts);
   // Only low-frequency UI snapshots; rendering runs directly on the channel.
   if(ts-lastUi>=250){lastUi=ts;setView({control:live.current,timestamp:ts})}
  };
  frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
 },[config,channel,keys,follow,gyroEnabled]);
 useEffect(()=>{const clear=()=>{latestMouseDown.current=false;touchTarget.current=[400,300];target.current=[400,300];gyroController.current?.notifyTouch(false)};window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);return()=>{window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear)}},[]);
 const trigger=useCallback((id,category)=>setKeys(prev=>{
  if(category==='blink')return prev.includes('EyeBlink')?prev.filter(k=>k!=='EyeBlink'):[...prev,'EyeBlink'];
  const next=prev.filter(k=>category==='eye'?(!k.startsWith('Eye')||k==='EyeBlink'):category==='mouthShape'?!shapes.includes(k):!moods.includes(k));
  if(id!=='MouthMM')next.push(id);return next;
 }),[]);
 const move=useCallback(({mouseX,mouseY})=>{
  if(!panel){
   touchTarget.current=[mouseX,mouseY];
   gyroController.current?.notifyTouch(latestMouseDown.current);
  }
 },[panel]);
 return <main className={'App'+(panel?' menu-open':'')}>
  <Stage realtimeChannel={channel} control={view.control} timestamp={view.timestamp} config={config} runPhysics={runPhysics} mikuResetter={resetter} stageBackground={stageBackground} stageRef={stageRef} isPure={!!query.get('pure')} playType={0} onMouseMove={move} latestMouseDown={latestMouseDown} currentSkinId={skin} onOpenCharacters={()=>setPanel('characters')} onOpenMenu={()=>setPanel('menu')} showTarget={settings.target===true} touchMode={settings.touchMode||'relative'}/>
  {!query.get('pure')&&<div className="bottom-workspace"><QuickPad skin={skin} activeKeys={keys} eyeClosed={keys.includes('EyeBlink')} onToggleEye={()=>trigger('EyeBlink','blink')} onTriggerKey={trigger} onApplyPreset={setKeys}/></div>}
  <ToyMenu panel={panel} onClose={closePanel} skin={skin} onSwitchSkin={switchSkin} backgrounds={backgrounds} backgroundId={backgroundId} onBackgroundChange={setBackgroundId} settings={settings} onSettingChange={updateSetting} onReset={reset} stageRef={stageRef}/>
 </main>;
}
