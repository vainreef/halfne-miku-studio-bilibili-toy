import {saveCanvas} from '../../platform/toy';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    Box, Tab, Tabs, ToggleButton, ToggleButtonGroup, Button
} from "@mui/material";
import Camera from "@mui/icons-material/Camera";
import Videocam from "@mui/icons-material/Videocam";
import Save from "@mui/icons-material/Save";
import FileOpen from "@mui/icons-material/FileOpen";
import html2canvas from "../../Miku/captureStage";
import FileSaver from 'file-saver';
import TimeLineButtons from './TimeLineButtons';
import TimeLine from './TimeLine';
import { BACKGROUND_NAMES } from '../../constants/emotions';
import { deepDiff, parseModelJS } from '../../Engine/modelUtils';
import { getInitPhysics, parseConfig, work } from '../../Engine/core';

const formatTime = (millis) => Math.floor(millis / 1000 / 60) + ':' + ('00' + Math.floor(millis / 1000 % 60)).slice(-2);

const getRawControl = (record, targetTime) => {
    const layerControls = record.map(layer => {
        if (layer.v === false) return {};
        const layerData = layer.a;
        const rawControlIndex = layerData?.reduce?.((p, c, i) => c.t <= targetTime ? i : p, undefined);
        if (rawControlIndex === undefined) return {};
        const rawControl = { ...layerData[rawControlIndex]?.c };
        const rawControlNext = layerData[rawControlIndex + 1]?.c;
        if (rawControlNext && rawControl.mouseX !== undefined && rawControlNext.mouseX !== undefined) {
            const lt = layerData[rawControlIndex]?.t;
            const rt = layerData[rawControlIndex + 1]?.t;
            const kl = (rt - targetTime) / (rt - lt);
            const kr = (targetTime - lt) / (rt - lt);
            rawControl.mouseX = rawControl?.mouseX * kl + rawControlNext?.mouseX * kr;
            rawControl.mouseY = rawControl?.mouseY * kl + rawControlNext?.mouseY * kr;
        }
        if (rawControl?.mouseX === undefined) {
            delete rawControl.mouseX;
            delete rawControl.mouseY;
        }
        return rawControl;
    });

    const newControl = layerControls.reduce((p, c) => ({
        ...p, ...c,
        keyInput: [...(p.keyInput || []), ...(c.keyInput || [])]
    }), {});
    if (newControl?.mouseX === undefined) {
        delete newControl.mouseX;
        delete newControl.mouseY;
    }
    return newControl;
};

export default function Controls({
    playType,
    togglePlayType,
    recordRef,
    layer,
    setEditorTimestamp,
    resetMiku,
    runPhysics,
    setRunPhysics,
    setAudioFile,
    setRecord,
    record,
    setLayer,
    renderStart,
    renderEnd,
    setRenderStart,
    setRenderEnd,
    keyMapping,
    setKeyMapping,
    editorTimestamp,
    editorTimestampRef,
    config,
    stageBackground,
    setStageBackground,
    control,
    renderFps,
    setRenderFps,
    renderScale,
    setRenderScale,
    renderTarget,
    setRenderTarget,
    fpsTarget,
    setFpsTarget,
    setConfig,
    fps,
    controlTypePanel,
    stageRef,
    playSpeed,
    setPlaySpeed,
    currentSkinId = 'miku',
    onSwitchSkin
}) {
    const controlsRef = useRef();
    const [tabPage, setTabPage] = useState(0);

    useEffect(() => {
        const preventWheel = (e) => {
            // 允许时间轴内的横向或特定滚轮
            if (e.target.closest('.timeline-R-content') || e.target.closest('.timeline-R-time')) return;
        };
        const el = controlsRef?.current;
        el?.addEventListener?.('wheel', preventWheel, { passive: true });
        return () => el?.removeEventListener?.('wheel', preventWheel);
    }, []);

    return (
        <div className="controls" ref={controlsRef}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
                <Tabs
                    value={tabPage}
                    onChange={(e, v) => setTabPage(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    aria-label="控制面板标签页"
                >
                    <Tab label="🎬 动作时间轴" />
                    <Tab label="🎨 场景背景" />
                    <Tab label="📹 导出与渲染" />
                    <Tab label="📊 状态参数" />
                    <Tab label="⌨️ 键位设置" />
                    <Tab label="⚙️ 系统设置" />
                </Tabs>
            </Box>

            {/* TAB 0: 动作时间轴 */}
            {tabPage === 0 && (
                <div className='controls-panel controls-panel-control'>
                    <TimeLineButtons {...{
                        playType,
                        togglePlayType,
                        recordRef,
                        layer,
                        setEditorTimestamp,
                        resetMiku,
                        runPhysics,
                        setRunPhysics,
                        setAudioFile,
                        setRecord,
                        canRecord: record[layer]?.l,
                        canPlay: record?.length === 0,
                        playSpeed,
                        setPlaySpeed
                    }} />
                    <TimeLine {...{
                        editorTimestamp,
                        editorTimestampRef,
                        setEditorTimestamp,
                        record,
                        setRecord,
                        layer,
                        setLayer,
                        renderStart,
                        renderEnd,
                        keyMapping,
                        playType
                    }} />
                </div>
            )}

            {/* TAB 1: 场景背景 */}
            {tabPage === 1 && (
                <div className='controls-panel'>
                    <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 'bold', color: '#555' }}>纯色背景抠像：</div>
                    <ToggleButtonGroup
                        size="small"
                        value={stageBackground}
                        exclusive
                        onChange={(e, v) => setStageBackground(v || false)}
                    >
                        <ToggleButton value={false}>透明通道</ToggleButton>
                        <ToggleButton value={'#FFFFFF'}>纯白</ToggleButton>
                        <ToggleButton value={'#0000FF'}>纯蓝抠像</ToggleButton>
                        <ToggleButton value={'#00FF00'}>纯绿抠像</ToggleButton>
                        <ToggleButton value={'#4F4859'}>暗灰 (默认)</ToggleButton>
                    </ToggleButtonGroup>

                    {config.background && (
                        <>
                            <div style={{ margin: '12px 0 8px', fontSize: 13, fontWeight: 'bold', color: '#555' }}>预设主题场景：</div>
                            <ToggleButtonGroup
                                size="small"
                                value={stageBackground}
                                exclusive
                                onChange={(e, v) => v && setStageBackground(v)}
                                style={{ flexWrap: 'wrap' }}
                            >
                                {Object.entries(config.background).map(([k, v]) => (
                                    <ToggleButton value={v} key={k}>
                                        {BACKGROUND_NAMES[k] || k}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                        </>
                    )}
                </div>
            )}

            {/* TAB 2: 导出渲染 */}
            {tabPage === 2 && (
                <div className='controls-panel controls-panel-control'>
                    <ToggleButtonGroup size="small">
                        <ToggleButton
                            value={1}
                            title='截取保存当前画面为 PNG 格式'
                            onClick={() => {
                                html2canvas(stageRef.current, {
                                    backgroundColor: null,
                                    scale: renderScale
                                }).then((canvas) => {
                                    return saveCanvas(canvas);
                                }).catch(error => alert(error?.message || '截图保存失败，请重试')); 
                            }}
                        >
                            <Camera style={{ marginRight: 4, fontSize: 18 }} /> 截图当前帧
                        </ToggleButton>
                    </ToggleButtonGroup>

                    &nbsp;

                    <ToggleButtonGroup
                        size="small"
                        value={playType === 3 ? renderTarget : ''}
                        exclusive
                        onChange={(e, v) => {
                            if (playType !== 3 && v) {
                                setRenderTarget(v);
                                togglePlayType(3, renderStart || 0);
                            } else {
                                togglePlayType(2);
                            }
                        }}
                    >
                        <ToggleButton
                            value={'GIF'}
                            disabled={record?.length === 0}
                            title='录制渲染为 GIF 动图 (支持透明背景)'
                        >
                            <Videocam style={{ marginRight: 4, fontSize: 18 }} /> 渲染为 GIF
                        </ToggleButton>
                        <ToggleButton
                            value={'ZIP'}
                            disabled={record?.length === 0}
                            title='渲染每一帧为 PNG 序列图片压缩包'
                        >
                            <Videocam style={{ marginRight: 4, fontSize: 18 }} /> 渲染为 PNG 序列包 (ZIP)
                        </ToggleButton>
                    </ToggleButtonGroup>

                    &nbsp;

                    <ToggleButtonGroup size="small">
                        <ToggleButton
                            value={1}
                            title='导出动作演算完整状态数据集 (.json)'
                            disabled={record?.length === 0}
                            onClick={async () => {
                                let renderControl = config.parseControl(getRawControl(record, renderStart || 0));
                                let renderPhysics = getInitPhysics(parseConfig(config.model, renderControl));
                                let renderStates = [];
                                const secondary = config.createSecondaryMotion?.({diagnostics:false});
                                const effectiveEnd = renderEnd || 5000;
                                const effectiveStart = renderStart || 0;
                                const totFrame = Math.floor((effectiveEnd - effectiveStart) * renderFps / 1000);
                                let lastReport = 0;
                                for (let frame = 0; frame <= totFrame; frame++) {
                                    renderControl = config.parseControl({
                                        ...renderControl,
                                        ...getRawControl(record, effectiveStart + frame * 1000 / renderFps)
                                    });
                                    work(
                                        frame === 0 ? 0 : (1000 / renderFps),
                                        config.model,
                                        renderControl,
                                        renderPhysics,
                                        p => { renderPhysics = p; },
                                        r => {
                                            secondary?.step(r, frame === 0 ? 0 : 1000 / renderFps, runPhysics);
                                            // Copy now: the solver reuses and mutates mesh buffers each frame.
                                            const snapshot = JSON.parse(JSON.stringify(r));
                                            renderStates.push(frame === 0 ? snapshot : deepDiff(renderStates[0], snapshot));
                                        },
                                        runPhysics,
                                    );
                                    if (performance.now() - lastReport > 100) {
                                        lastReport = performance.now();
                                        const renderEl = document.querySelector('.rendertime');
                                        if (renderEl) renderEl.innerHTML = (100 * frame / totFrame).toFixed(1) + '%';
                                        await new Promise(res => setTimeout(res, 0));
                                    }
                                }
                                const outputData = {
                                    fps: renderFps,
                                    background: stageBackground,
                                    scale: renderScale,
                                    renderStates,
                                };
                                const blob = new Blob([JSON.stringify(outputData)], { type: "application/json;charset=utf-8" });
                                FileSaver.saveAs(blob, "Miku-Render-Data.json");
                                const renderEl = document.querySelector('.rendertime');
                                if (renderEl) renderEl.innerHTML = '';
                            }}
                        >
                            <Save style={{ marginRight: 4, fontSize: 18 }} /> 导出状态数据
                        </ToggleButton>
                    </ToggleButtonGroup>

                    &nbsp;

                    <ToggleButtonGroup
                        size="small"
                        value={renderFps}
                        exclusive
                        onChange={(e, v) => setRenderFps(v || renderFps)}
                    >
                        <ToggleButton value={30}>30 帧</ToggleButton>
                        <ToggleButton value={60}>60 帧</ToggleButton>
                        <ToggleButton value={120}>120 帧</ToggleButton>
                    </ToggleButtonGroup>

                    &nbsp;

                    <ToggleButtonGroup
                        size="small"
                        value={renderScale}
                        exclusive
                        onChange={(e, v) => setRenderScale(v || renderScale)}
                    >
                        <ToggleButton value={1}>1x 标清</ToggleButton>
                        <ToggleButton value={1.8}>1.8x</ToggleButton>
                        <ToggleButton value={2}>2x 高清</ToggleButton>
                    </ToggleButtonGroup>

                    &nbsp;

                    <label>起点（秒）<input aria-label="导出起点秒" type="number" min="0" step="0.1" disabled={playType === 3} value={(renderStart || 0) / 1000} onChange={e => setRenderStart(Math.max(0, Math.min(Number(e.target.value) * 1000, (renderEnd || 5000) - 100)))} style={{width:70}} /></label>
                    <label>终点（秒）<input aria-label="导出终点秒" type="number" min="0.1" step="0.1" disabled={playType === 3} value={(renderEnd || 5000) / 1000} onChange={e => setRenderEnd(Math.max((renderStart || 0) + 100, Number(e.target.value) * 1000))} style={{width:70}} /></label>
                    <div className='timedisplay' style={{ width: 'auto', marginLeft: 12 }}>
                        <b className='rendertime' />
                        {playType === 3 && (
                            <>
                                <b>
                                    {Math.floor((editorTimestamp - (renderStart || 0)) * renderFps / 1000)} / {Math.floor(((renderEnd || 5000) - (renderStart || 0)) * renderFps / 1000)} 帧
                                </b>
                                <span className='small'>
                                    &nbsp;{(((editorTimestamp - (renderStart || 0)) / ((renderEnd || 5000) - (renderStart || 0))) * 100).toFixed(1)}%
                                </span>
                                {fps > 0 && (
                                    <span className='small'>
                                        &nbsp;预估剩余: {formatTime(((renderEnd || 5000) - editorTimestamp) * renderFps / fps)}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: 实时参数 */}
            {tabPage === 3 && (
                <div className='controls-panel' style={{ maxHeight: 200, overflowY: 'auto', fontSize: 13 }}>
                    {Object.entries(control).map(([k, v]) => (
                        <div key={k} style={{ padding: '2px 0' }}>
                            <b style={{ color: '#2b2633' }}>{k}</b>: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 4: 键位映射 */}
            {tabPage === 4 && (
                <div className='controls-panel' style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        💡 电脑端操作提示：按住目标键盘按键，并单击对应的动作项，即可重新绑定键位。
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
                        {keyMapping.map(([k, ...v], i) => (
                            <div key={k} style={{ background: '#f5f5f7', padding: '4px 8px', borderRadius: 6, fontSize: 13 }}>
                                <b
                                    onClick={() => {
                                        setKeyMapping(_keyMapping => {
                                            _keyMapping[i] = [k, ...window.keyList];
                                            return [..._keyMapping];
                                        });
                                    }}
                                    style={{ cursor: 'pointer', color: '#1976d2' }}
                                    title='按住按键并点击以绑定'
                                >
                                    {k}
                                </b>
                                : {v?.length ? v.join(', ') : '无'}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 5: 系统设置 */}
            {tabPage === 5 && (
                <div className='controls-panel controls-panel-control'>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, color: '#555' }}>角色皮肤：</span>
                        <ToggleButtonGroup
                            size="small"
                            value={currentSkinId}
                            exclusive
                            onChange={(e, v) => v && onSwitchSkin && onSwitchSkin(v)}
                        >
                            <ToggleButton value="miku">🎵 经典初音</ToggleButton>
                            <ToggleButton value="whale">🐳 大肥鱼</ToggleButton>
                        </ToggleButtonGroup>
                    </div>

                    &nbsp;&nbsp;

                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileOpen />}
                        onClick={() => {
                            try {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.js';
                                input.onchange = (e) => {
                                    if (!e.target.files?.[0]) return;
                                    const fr = new FileReader();
                                    fr.onload = () => {
                                        try {
                                            let newConfig = parseModelJS(fr.result);
                                            setConfig(newConfig);
                                            resetMiku();
                                        } catch (err) {
                                            alert("模型解析错误: " + err.message);
                                        }
                                    };
                                    fr.readAsText(e.target.files[0]);
                                };
                                input.click();
                            } catch {}
                        }}
                    >
                        导入模型文件
                    </Button>

                    &nbsp;&nbsp;

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, color: '#555' }}>帧率上限：</span>
                        <ToggleButtonGroup
                            size="small"
                            value={fpsTarget}
                            exclusive
                            onChange={(e, v) => setFpsTarget(v || 0)}
                        >
                            <ToggleButton value={0}>跟随屏幕 (RAF)</ToggleButton>
                            <ToggleButton value={Infinity}>不限制</ToggleButton>
                            <ToggleButton value={30}>30 帧</ToggleButton>
                            <ToggleButton value={60}>60 帧</ToggleButton>
                            <ToggleButton value={120}>120 帧</ToggleButton>
                        </ToggleButtonGroup>
                    </div>

                    &nbsp;&nbsp;

                    {controlTypePanel}
                </div>
            )}
        </div>
    );
}
