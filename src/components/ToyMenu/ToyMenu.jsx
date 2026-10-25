import React,{useEffect,useRef,useState} from 'react';
import ToyToolbar from '../../platform/ToyToolbar';
import {BACKGROUND_NAMES} from '../../constants/emotions';
import {requestGyroPermission} from '../../Engine/gyroscope';
export default function ToyMenu({panel,onClose,skin,onSwitchSkin,backgrounds,backgroundId,onBackgroundChange,settings,onSettingChange,onReset,stageRef}){
 const dialog=useRef(null),[section,setSection]=useState('background');
 useEffect(()=>{
  if(!panel)return;
  const background=[...document.querySelectorAll('.stage-wrapper,.bottom-workspace')];background.forEach(n=>n.inert=true);
  const previous=document.activeElement;dialog.current?.querySelector('button')?.focus();
  const key=e=>{if(e.key==='Escape'){onClose();return}if(e.key==='Tab'){const nodes=[...dialog.current.querySelectorAll('button,input')].filter(n=>!n.disabled&&!n.closest('[hidden]'));const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};
  document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);background.forEach(n=>n.inert=false);previous?.focus()};
 },[panel,onClose]);
 return <div className="menu-backdrop" hidden={!panel} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="toy-menu" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="menu-title">
   <header><h2 id="menu-title">{panel==='characters'?'选择角色':'菜单'}</h2><button className="close-button" onClick={onClose} aria-label="关闭菜单">×</button></header>
   <div className="menu-content">
    <div hidden={panel!=='characters'} className="character-options">{[['miku','初音'],['whale','大肥鱼']].map(([id,name])=><button key={id} aria-label={name} aria-pressed={skin===id} onClick={()=>onSwitchSkin(id)}><img src={`${import.meta.env.BASE_URL}assets/ui/${id}-avatar.png?v=07`} alt=""/><span>{name}</span><small>{skin===id?'使用中':'选择角色'}</small></button>)}</div>
    <div hidden={panel!=='menu'}>
     <div className="menu-tabs" role="tablist" aria-label="菜单分类">{[['background','背景'],['settings','设置'],['save','保存']].map(([id,name])=><button role="tab" key={id} aria-selected={section===id} aria-controls={'menu-'+id} onClick={()=>setSection(id)}>{name}</button>)}</div>
     <div className="menu-page" id="menu-background" hidden={section!=='background'}>
      <div className="background-options">{[...Object.entries(backgrounds),['plain',null]].map(([id,src])=><button key={id} aria-label={BACKGROUND_NAMES[id]||'纯色背景'} aria-pressed={backgroundId===id} onClick={()=>onBackgroundChange(id)}>{src?<img src={src} alt="" loading="lazy"/>:<span className="plain-background"/>}<span>{(BACKGROUND_NAMES[id]||'纯色').split(' ')[0]}</span></button>)}</div>
     </div>
     <div className="menu-page" id="menu-settings" hidden={section!=='settings'}>
      {[['bgm','背景音乐',settings.bgm===true],['gyroscope','陀螺仪感应',settings.gyroscope!==false],['physics','自然摆动',settings.physics!==false],['target','显示触摸点',settings.target===true]].map(([id,name,checked])=><label className="setting-row" key={id}><span>{name}</span><input type="checkbox" checked={checked} onChange={e=>{const val=e.target.checked;if(id==='gyroscope'&&val)requestGyroPermission().catch(()=>{});onSettingChange(id,val)}}/></label>)}
      <div className="setting-row setting-row-mode">
        <span>触屏模式</span>
        <div className="touch-mode-options" role="radiogroup" aria-label="触屏控制模式">
          <button
            type="button"
            role="radio"
            aria-checked={settings.touchMode !== 'absolute'}
            className={settings.touchMode !== 'absolute' ? 'active' : ''}
            onClick={() => onSettingChange('touchMode', 'relative')}
          >
            相对滑动
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={settings.touchMode === 'absolute'}
            className={settings.touchMode === 'absolute' ? 'active' : ''}
            onClick={() => onSettingChange('touchMode', 'absolute')}
          >
            绝对跟随
          </button>
        </div>
      </div>
      <button className="reset-button" onClick={()=>{onReset();onClose()}}>恢复初始姿态</button>
     </div>
     <div className="menu-page save-page" id="menu-save" hidden={section!=='save'}><div className="save-illustration" aria-hidden="true"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="8" cy="8" r="1.5"/><path d="m4 17 5-5 4 3 3-4 5 6"/></svg></div><ToyToolbar stageRef={stageRef}/></div>
    </div>
   </div>
  </section>
 </div>;
}
