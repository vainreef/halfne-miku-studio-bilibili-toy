import React, {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import classic from '../../src/defaultModel.js';
import whale from './model.js';
import Part from './SkinPart.jsx';
import {getInitPhysics,parseConfig,work} from '../../src/Engine/core.js';
import './style.css';
import {comparisonView} from './comparisonView.js';
import resources from './whale/resources.js';
import {createSecondaryMotion} from './whale/secondaryMotion.js';

const query=new URLSearchParams(location.search);
const initial=(key,value)=>query.get(key)??value;
const eyes=['happy','jaded','oo','xx','aa','sideglance','eheh','pumped'];
const eyeKeys=['EyeHappy','EyeJaded','EyeO_O','Eye*_*','Eye@_@','EyeSideGlance','EyeEheh','EyePumped'];
const mouths=['happy','neutral','cat','angry','pout','drool','duck','tongue'];
const mouthKeys=['MouthHappy','MouthNeutral','MouthCat','MouthAngry','MouthPout','MouthDrool','MouthDuck','MouthTongue'];
const phonemes=[null,'MouthAA','MouthEE','MouthOO','MouthEH','MouthOH','MouthTeeth'];
const poses={center:[400,300],left:[0,300],right:[800,300],up:[400,0],down:[400,600],nw:[0,0],ne:[800,0],sw:[0,600],se:[800,600]};
function flatten(root) {
  const nodes=[];
  function walk(n,path,parentMatrix) {
    // Mirror Part.jsx CSS transform order, including parent scale (unlike getAbsolutePos).
    let matrix=parentMatrix.skewX(-(n.skewX||0)).skewY(n.skewY||0).translate(n.x||0,n.y||0).rotate(n.rotation||0).scale(n.scaleX||1,n.scaleY||1);
    const point=new DOMPoint(0,0).matrixTransform(matrix);
    nodes.push({path:path||'root',x:point.x,y:point.y,virtual:n.virtual,resource:!!n.resource});
    n.components?.forEach(c=>walk(c,path?`${path}.${c.id}`:c.id,matrix));
  }
  walk(root,'',new DOMMatrix());return nodes;
}
function App(){
 const skin='whale';
 const neutralLock=initial('neutral','0')==='1'||(query.has('capture')&&initial('motion','0')!=='1'&&initial('pose','center')==='center');
 const config=skin==='miku'?classic:whale;
 const secondary=useMemo(()=>createSecondaryMotion(resources),[skin]);
 const smooth=useRef(null);
 const [view,setView]=useState(initial('view','split'));
 useEffect(()=>{
  const observer=new ResizeObserver(entries=>entries.forEach(({target,contentRect})=>target.style.setProperty('--stage-scale',contentRect.width/800)));
  document.querySelectorAll('.viewport').forEach(e=>observer.observe(e));
  return()=>observer.disconnect();
 },[view]);
 const [physics,setPhysics]=useState(initial('physics','1')!=='0');
 const [paused,setPaused]=useState(initial('paused','0')==='1');
 const [gaze,setGaze]=useState(poses[initial('pose','center')]||poses.center);
 const [follow,setFollow]=useState(false);
 const [auto,setAuto]=useState(initial('motion','0')==='1');
 const [eye,setEye]=useState(initial('eye','happy'));
 const [mouth,setMouth]=useState(initial('mouth','happy'));
 const [phoneme,setPhoneme]=useState(+initial('phoneme','1'));
 const [blink,setBlink]=useState(initial('blink','0')==='1');
 const [rig,setRig]=useState(initial('rig','0')==='1');
 const [labels,setLabels]=useState(false);
 const [flat,setFlat]=useState(false);
 const [overlay,setOverlay]=useState(+initial('opacity','.35'));
 const [refX,setRefX]=useState(150),[refY,setRefY]=useState(35),[refSize,setRefSize]=useState(540);
 const [bg,setBg]=useState(initial('bg','checker'));
 const [state,setState]=useState(null);
 const [fps,setFps]=useState(0);
 const captureFrames=useRef(0);
 const phy=useRef({}),input=useRef({}),rendered=useRef(null),elapsed=useRef(0),last=useRef(null);
 const pauseRef=useRef(paused),settings=useRef({});
 pauseRef.current=paused;
 settings.current={gaze,eye,mouth,phoneme,blink,physics,auto};
 useEffect(()=>{
  secondary.reset();smooth.current=null;phy.current={};elapsed.current=0;last.current=null;captureFrames.current=0;delete document.documentElement.dataset.captureReady;
  const c=config.parseControl({keyInput:[eyeKeys[eyes.indexOf(eye)],mouthKeys[mouths.indexOf(mouth)],phonemes[phoneme-1],blink?'EyeBlink':null].filter(Boolean)});
  phy.current=getInitPhysics(parseConfig(config.model,c));
  input.current=c;
  const rest=parseConfig(config.model,c,phy.current);
  if(neutralLock){secondary.step(rest,0,false);pauseRef.current=true;setPaused(true);}
  rendered.current=rest;setState(rest);
  document.documentElement.dataset.captureMode=neutralLock?'neutral-initial':'simulation';
  if(neutralLock&&query.has('capture'))requestAnimationFrame(()=>document.documentElement.dataset.captureReady='1');
 },[config]);
 useEffect(()=>{
  let id,frames=0,start=performance.now();
  function frame(time){
   const dt=last.current===null?0:Math.min(time-last.current,50);last.current=time;
   if(!neutralLock&&!pauseRef.current){
    elapsed.current+=query.has('capture')?1000/60:dt;
    const s=settings.current;
    const testTime=elapsed.current;
    const abrupt=testTime<800?poses.center:testTime<1600?poses.left:testTime<2400?poses.right:poses.center;
    const testPoses={stop:abrupt,nod:[400,300+220*Math.sin(testTime/700)],look:[400+330*Math.sin(testTime/950),300],circle:[400+310*Math.cos(testTime/1200),300+215*Math.sin(testTime/1200)]};
    const [x,y]=s.auto?(testPoses[query.get('scenario')]||[400+360*Math.sin(testTime/1100),300+265*Math.sin(testTime/1700)]):s.gaze;
    const keyInput=[eyeKeys[eyes.indexOf(s.eye)],mouthKeys[mouths.indexOf(s.mouth)],phonemes[s.phoneme-1],s.blink?'EyeBlink':null].filter(Boolean);
    const stepDt=query.has('capture')?1000/60:dt;
    if(!smooth.current)smooth.current=[x,y];
    const alpha=1-Math.exp(-.02*stepDt);
    smooth.current=smooth.current.map((v,i)=>v+([x,y][i]-v)*alpha);
    const c=config.parseControl({...input.current,mouseX:smooth.current[0],mouseY:smooth.current[1],keyInput});input.current=c;
    work(query.has('capture')?1000/60:dt,config.model,c,phy.current,p=>phy.current=p,r=>{if(skin==='whale')secondary.step(r,stepDt,s.physics);rendered.current=r;setState(r)},s.physics);
    if(query.has('capture')&&++captureFrames.current>=Number(initial('frames','90'))){
     pauseRef.current=true;setPaused(true);
     requestAnimationFrame(()=>document.documentElement.dataset.captureReady='1');
    }
   }
   frames++;if(time-start>700){setFps(Math.round(frames*1000/(time-start)));document.documentElement.dataset.labFps=String(Math.round(frames*1000/(time-start)));frames=0;start=time}
   id=requestAnimationFrame(frame);
  }
  id=requestAnimationFrame(frame);return()=>cancelAnimationFrame(id);
 },[config]);
 const nodes=useMemo(()=>state&&rig?flatten(state):[],[state,rig]);
 const sameArtwork=whale.model.components.find(n=>n.id==='tailL')?.resource===classic.model.components.find(n=>n.id==='tailL')?.resource;
 const reset=()=>{secondary.reset();smooth.current=null;setGaze(poses.center);setEye('happy');setMouth('happy');setPhoneme(1);setBlink(false);setAuto(false);setPaused(false);phy.current=getInitPhysics(parseConfig(config.model,config.parseControl()));elapsed.current=0};
 const mouseMove=e=>{if(neutralLock||!follow)return;const rect=e.currentTarget.getBoundingClientRect();setGaze([Math.round((e.clientX-rect.left)*800/rect.width),Math.round((e.clientY-rect.top)*600/rect.height)])};
 const saveSVG=()=>{
  if(!state)return;
  const blob=new Blob([serializeModel(state)],{type:'image/svg+xml'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${skin}-pose.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 if(query.get('clean')==='1')return <CleanComparison state={state} skin={skin} paused={paused} onGaze={setGaze}/>;
 return <>
 <header><div><small>HALFNE / SKIN LAB</small><h1>皮肤工作台 <span>鲸鱼娘</span></h1></div><div className="header-info"><i/>{fps} FPS · 800 × 600 <a href="/" onClick={e=>{e.preventDefault();reset()}}>重置姿态 ↺</a></div></header>
 <main><aside>
 <section><h2>01 / 模型与视图</h2><p className="note">鲸鱼娘 · 完整眼神 / 口型</p>
 <div className="tabs">{[['split','并排'],['model','模型'],['overlay','叠图']].map(([v,t])=><button key={v} className={view===v?'active':''} onClick={()=>setView(v)}>{t}</button>)}</div>
 <label>舞台背景<select aria-label="舞台背景" value={bg} onChange={e=>setBg(e.target.value)}><option value="checker">透明棋盘</option><option value="dark">深色</option><option value="light">浅色</option><option value="green">绿幕</option></select></label>
 <p className="note">{skin==='whale'&&sameArtwork?'当前鲸鱼娘入口仍为初音骨架占位。后续修改鲸鱼娘模型和 SVG，这里会实时更新。':'独立加载原生模型，不经过正式项目的操作界面。'}</p></section>
 <section><h2>02 / 姿态与运动</h2><div className="pose-grid">{[['nw','↖'],['up','↑'],['ne','↗'],['left','←'],['center','居中'],['right','→'],['sw','↙'],['down','↓'],['se','↘']].map(([k,t])=><button key={k} onClick={()=>{setGaze(poses[k]);setAuto(false);setPaused(false)}}>{t}</button>)}</div>
 <div className="coords">X {gaze[0]} <span>Y {gaze[1]}</span></div>
 <Check text="鼠标跟随" value={follow} set={setFollow}/><Check text="循环运动压力测试" value={auto} set={setAuto}/><Check text="物理模拟" value={physics} set={setPhysics}/><Check text="暂停 / 定格" value={paused} set={setPaused}/></section>

 <section><h2>03 / 眼神与口型</h2>
 <label>眼神<select aria-label="眼神" value={eye} onChange={e=>{setEye(e.target.value);setPaused(false)}}>{eyes.map((v,i)=><option key={v} value={v}>{['开心','半睁','惊讶','星光','晕眩','侧视','泪眼','认真'][i]}</option>)}</select></label>
 <Check text="闭眼" value={blink} set={v=>{setBlink(v);setPaused(false)}}/>
 <label>嘴部风格<select aria-label="嘴部风格" value={mouth} onChange={e=>{setMouth(e.target.value);setPaused(false)}}>{mouths.map((v,i)=><option key={v} value={v}>{['开心','平静','猫嘴','生气','撇嘴','流口水','嘟嘴','吐舌'][i]}</option>)}</select></label>
 <label>口型<select aria-label="口型" value={phoneme} onChange={e=>{setPhoneme(+e.target.value);setPaused(false)}}>{['闭合 / MM','AA','EE','OO','EH','OH','露齿'].map((v,i)=><option key={v} value={i+1}>{v}</option>)}</select></label>
 <a href="/expressions.html" target="_blank" rel="noreferrer">打开 72 状态原版对照表 ↗</a></section>
 <section><h2>04 / 检查工具</h2><Check text="显示关节（含虚拟节点）" value={rig} set={setRig}/><Check text="显示节点路径" value={labels} set={setLabels}/><Check text="图层着色" value={flat} set={setFlat}/><button className="wide" onClick={saveSVG}>下载当前静态 SVG</button>
 {view==='overlay'&&<><label>参考图透明度 {Math.round(overlay*100)}%<input aria-label="参考图透明度" type="range" min="0" max="1" step=".01" value={overlay} onChange={e=>setOverlay(+e.target.value)}/></label><label>参考图 X<input type="number" value={refX} onChange={e=>setRefX(+e.target.value)}/></label><label>参考图 Y<input type="number" value={refY} onChange={e=>setRefY(+e.target.value)}/></label><label>参考图尺寸<input type="number" value={refSize} onChange={e=>setRefSize(+e.target.value)}/></label></>}
 </section></aside>
 <article><div className="workspace-title"><div><h2>形态预览</h2><p>美术 → 锚点 → 原生骨架 · 保存后自动刷新</p></div><span className="badge">{physics?'动态物理':'静态组装'} / {paused?'定格':'运行'}</span></div>
 <div className={`canvases ${view}`}>
 <div className="panel"><div className="panel-label">LIVE MODEL <span>{skin==='whale'?'鲸鱼娘':'经典初音'}</span></div>
 <div className={`viewport ${bg}`} onMouseMove={mouseMove}><div className="stage" data-testid="model-stage"><div className={`model ${flat?'flat':''}`}><Part renderState={state}/></div>
 {view==='overlay'&&<img className="reference-overlay" src="/assets/whale-girl.png" style={{left:refX,top:refY,width:refSize,height:refSize,opacity:overlay}}/>}
 {rig&&<svg className="rig" viewBox="0 0 800 600">{skin==='whale'&&secondary.diagnostics.meshLines?.map((line,i)=><polyline key={`mesh-${i}`} points={line.map(p=>p.join(',')).join(' ')} fill="none" stroke="#f472b6" strokeWidth=".8"/>)}{nodes.map(n=><g key={n.path}><circle cx={n.x} cy={n.y} r={n.virtual?3:2} fill={n.virtual?'#fbbf24':'#34d399'}/>{labels&&<text x={n.x+5} y={n.y-4}>{n.path}</text>}</g>)}</svg>}
 </div></div></div>
 {view==='split'&&<div className="panel"><div className="panel-label">REFERENCE <span>原始参考 · 1254 × 1254</span></div><div className={`viewport ${bg}`}><div className="reference-stage"><img src="/assets/whale-girl.png" alt="鲸鱼娘原始参考图"/></div></div></div>}
 </div>
 <details><summary>节点与关节 <span>{nodes.length} 个节点 · 舞台逻辑坐标</span></summary><div className="node-table"><table><thead><tr><th>路径</th><th>X</th><th>Y</th><th>类型</th></tr></thead><tbody>{nodes.map(n=><tr key={n.path}><td>{n.path}</td><td>{n.x.toFixed(1)}</td><td>{n.y.toFixed(1)}</td><td>{n.virtual?'虚拟锚点':n.resource?'图层':'容器'}</td></tr>)}</tbody></table></div></details>
 <footer>入口：<code>skin-lab/src/model.js</code> · 工具与正式演播室隔离 · 截图命令见 README</footer>
 </article></main>
 </>;
}
function serializeModel(state){
 const draw=n=>{
  if(n.virtual)return '';
  const transform=`skewX(${-(n.skewX||0)}) skewY(${n.skewY||0}) translate(${n.x||0} ${n.y||0}) rotate(${n.rotation||0}) scale(${n.scaleX||1} ${n.scaleY||1})`;
  const resource=n.resource?`<image href="${n.resource.replaceAll('&','&amp;').replaceAll('"','&quot;')}" x="${-(n.resourceCenterX||0)}" y="${-(n.resourceCenterY||0)}" width="${n.width||800}" height="${n.height||600}"/>`:'';
  const mesh=n.mesh?`<g transform="translate(${-n.resourceCenterX} ${-n.resourceCenterY})">${n.mesh.markup.replace(/(<polygon data-mesh-clip="(\d+)" points=")[^"]*/g,(_,prefix,i)=>prefix+n.mesh.triangles[i].points).replace(/(<use data-mesh-use="(\d+)" href="[^"]*" transform=")[^"]*/g,(_,prefix,i)=>prefix+n.mesh.triangles[i].transform)}</g>`:'';
  return `<g transform="${transform}" opacity="${n.opacity??1}" visibility="${n.visibility??'visible'}">${mesh||resource}${n.components?.map(draw).join('')||''}</g>`;
 };
 return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">${draw(state)}</svg>`;
}
function CleanComparison({state,skin,paused,onGaze}){
 const detail=useMemo(()=>comparisonView(query),[]);
 // Preview-only planar yaw; leaves rig and physics untouched.
 const requestedYaw=Number(initial('yaw',skin==='whale'?'-12':'0'));
 const yaw=Number.isFinite(requestedYaw)?Math.max(-30,Math.min(30,requestedYaw)):0;
 const [screenScale,setScreenScale]=useState(()=>Math.min(1,window.innerWidth/1200));
 useEffect(()=>{const resize=()=>setScreenScale(Math.min(1,window.innerWidth/1200));window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[]);
 const [fit,setFit]=useState({scale:1,x:0,y:0});
 useEffect(()=>{
  if(!state)return;
  let stale=false;
  delete document.documentElement.dataset.cleanReady;
  const neutralConfig=skin==='miku'?classic:whale;
  const neutralControl=neutralConfig.parseControl();
  const neutral=parseConfig(neutralConfig.model,neutralControl,getInitPhysics(parseConfig(neutralConfig.model,neutralControl)));
  if(skin==='whale'){
   // Both columns use the same 1254px artboard, not independently fitted silhouettes.
   // Source→root: .22*(p-[540,1220]); root display: translate(x,y)*scale(1.62).
   const artScale=544/1254, scale=artScale/(.22*neutral.scaleX);
   setFit({scale,x:28-(neutral.x-540*.22*neutral.scaleX)*scale,
    y:28-(neutral.y-1220*.22*neutral.scaleY)*scale});
   requestAnimationFrame(()=>document.documentElement.dataset.cleanReady='1');
   return()=>{stale=true};
  }
  const image=new Image();
  image.onload=()=>{
   if(stale)return;
   const canvas=document.createElement('canvas');canvas.width=800;canvas.height=600;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
   const data=ctx.getImageData(0,0,800,600).data;
   let x0=800,y0=600,x1=0,y1=0;
   for(let y=0;y<600;y++)for(let x=0;x<800;x++)if(data[(y*800+x)*4+3]>8){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
   if(x1>x0&&y1>y0){const scale=Math.min(544/(x1-x0+1),544/(y1-y0+1));setFit({scale,x:300-(x0+x1+1)/2*scale,y:300-(y0+y1+1)/2*scale})}
   requestAnimationFrame(()=>document.documentElement.dataset.cleanReady='1');
  };
  image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(serializeModel(neutral));
  return()=>{stale=true};
 },[skin,!!state]);
 return <div className="clean-shell" style={{width:1200*screenScale,height:detail.height*screenScale}}><div className="clean-board" data-testid="comparison" style={{height:detail.height,transform:`scale(${screenScale})`}}><div className="clean-cell" style={{height:detail.height}} onPointerMove={e=>{if(query.has('capture')||initial('neutral','0')==='1')return;const r=e.currentTarget.getBoundingClientRect();onGaze(previous=>{const next=[(e.clientX-r.left)/r.width*800,(e.clientY-r.top)/r.height*600];return Math.hypot(next[0]-previous[0],next[1]-previous[1])<1?previous:next})}}><div className="clean-detail" style={{transform:detail.transform}}><div className="clean-angle" data-yaw={yaw} style={{transform:`perspective(1000px) rotateY(${yaw}deg)`}}><div className="clean-model model" style={{transform:`translate(${fit.x}px,${fit.y}px) scale(${fit.scale})`}}><Part renderState={state} hiddenPaths={detail.hide}/></div></div></div></div><div className="clean-cell" style={{height:detail.height}}><div className="clean-detail" style={{transform:detail.transform}}><img className="clean-reference" src="/assets/whale-girl.png" alt="鲸鱼娘参考图"/></div></div></div></div>;
}
function Check({text,value,set}){return <label className="check"><input type="checkbox" checked={value} onChange={e=>set(e.target.checked)}/>{text}</label>}
createRoot(document.getElementById('root')).render(<App/>);
