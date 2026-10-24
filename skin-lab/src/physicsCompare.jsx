// Diagnostic only: no new switches in the character workbench, classic stays untouched.
import React,{useEffect,useState} from 'react';import{createRoot}from'react-dom/client';
import classic from '../../src/defaultModel.js';import{createWhaleModel}from'./model.js';
import{parseConfig,getInitPhysics,work}from'../../src/Engine/core.js';
import ClassicPart from '../../src/Miku/Part.jsx';import SkinPart from './SkinPart.jsx';
function App(){const [states,setStates]=useState([]);const [fit,setFit]=useState(()=>Math.min(window.innerWidth/1200,1));useEffect(()=>{const resize=()=>setFit(Math.min(window.innerWidth/1200,1));window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[]);useEffect(()=>{
 const models=[classic,createWhaleModel()],physics=models.map(m=>getInitPhysics(parseConfig(m.model,m.parseControl()))),solver=models[1].createSecondaryMotion();let id,frame=0;
 const tick=()=>{const t=(frame++/60)%9;let x=400,y=300;
 if(t<1.5)x=400+340*Math.sin(Math.PI*t/1.5);else if(t<3)x=400-340*Math.sin(Math.PI*(t-1.5)/1.5);else if(t<4)x=400+280*Math.sin(Math.PI*2*(t-3));
 const states=models.map((m,i)=>{let s;work(1000/60,m.model,m.parseControl({mouseX:x,mouseY:y}),physics[i],p=>physics[i]=p,r=>s=r,true);if(i)solver.step(s,1000/60,true);return s;});setStates(states);document.documentElement.dataset.frame=String(frame);document.documentElement.dataset.ready='1';id=requestAnimationFrame(tick);};tick();return()=>cancelAnimationFrame(id);
 },[]);return <div style={{display:'flex',width:1200,height:420,zoom:fit}}>{states.map((s,i)=><div key={i} style={{width:600,height:420,overflow:'hidden',position:'relative'}}><div style={{position:'absolute',left:14,top:12,font:'14px sans-serif'}}>{i?'鲸鱼娘：同输入':'初音原版：原参数'}</div><div className="diagnostic-model" style={{position:'absolute',left:i?0:-50,top:i?-35:-109,transform:i?'scale(.75)':'scale(1.05)',transformOrigin:'0 0',width:800,height:600}}>{i?<SkinPart renderState={s}/>:<ClassicPart renderState={s}/>}</div></div>)}</div>}
createRoot(document.getElementById('root')).render(<App/>);
