import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import './Stage.less';
import Miku from '../../Miku/Miku';
import ScreenRotation from '@mui/icons-material/ScreenRotation';
import TouchApp from '@mui/icons-material/TouchApp';
import Lock from '@mui/icons-material/Lock';
import LockOpen from '@mui/icons-material/LockOpen';
import Refresh from '@mui/icons-material/Refresh';
import EditNote from '@mui/icons-material/EditNote';
import SportsEsports from '@mui/icons-material/SportsEsports';

const W = 800;
const H = 600;

export default function Stage({
    control,
    timestamp,
    config,
    runPhysics,
    setRunPhysics,
    mikuResetter,
    stageBackground,
    stageRef,
    isPure,
    playType,
    fps,
    mouseControlType,
    setMouseControlType,
    requestDeviceMotion,
    onMouseMove,
    latestMouseDown,
    resetMiku,
    uiMode,
    setUiMode
}) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    // 计算根据屏幕自适应的缩放比例
    const updateScale = useCallback(() => {
        if (!containerRef.current) return;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // 计算可用于舞台的最大宽度和高度
        let maxW = Math.min(screenW - 16, 920);
        let maxH = screenH * (screenW <= 768 ? 0.52 : 0.62);

        let newScale = Math.min(maxW / W, maxH / H);
        if (newScale > 1.25) newScale = 1.25;
        if (newScale < 0.35) newScale = 0.35;
        setScale(newScale);
    }, []);

    useEffect(() => {
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [updateScale]);

    // 坐标精准换算（考虑缩放与视口位置）
    const handlePointerAction = useCallback((clientX, clientY, isDown = false) => {
        if (!stageRef.current) return;
        const rect = stageRef.current.getBoundingClientRect();
        const mouseX = Math.round(Math.max(0, Math.min(W, ((clientX - rect.left) / rect.width) * W)));
        const mouseY = Math.round(Math.max(0, Math.min(H, ((clientY - rect.top) / rect.height) * H)));
        onMouseMove({ clientX, clientY, mouseX, mouseY });
    }, [onMouseMove, stageRef]);

    const handleTouchStart = (e) => {
        latestMouseDown.current = true;
        if (e.touches?.[0]) {
            handlePointerAction(e.touches[0].clientX, e.touches[0].clientY, true);
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches?.[0]) {
            handlePointerAction(e.touches[0].clientX, e.touches[0].clientY, true);
        }
    };

    const handleTouchEnd = () => {
        latestMouseDown.current = false;
    };

    const handleMouseDown = (e) => {
        latestMouseDown.current = true;
        handlePointerAction(e.clientX, e.clientY, true);
    };

    const handleMouseMoveInner = (e) => {
        if (playType === 2 && !e.buttons) return;
        handlePointerAction(e.clientX, e.clientY, !!e.buttons);
    };

    const handleMouseUp = () => {
        latestMouseDown.current = false;
    };

    return (
        <div className="stage-wrapper" ref={containerRef}>
            {!isPure && (
                <div className="stage-topbar">
                    <div className="topbar-left">
                        <button
                            className="mode-switch-btn"
                            onClick={() => setUiMode(uiMode === 'pad' ? 'studio' : 'pad')}
                            title="切换操作模式"
                        >
                            {uiMode === 'pad' ? (
                                <><EditNote style={{ fontSize: 15, verticalAlign: 'middle' }} /> 制作室模式</>
                            ) : (
                                <><SportsEsports style={{ fontSize: 15, verticalAlign: 'middle' }} /> 表演板模式</>
                            )}
                        </button>

                        <button
                            className={`icon-tool-btn ${mouseControlType === 1 ? 'active' : ''}`}
                            onClick={() => {
                                if (mouseControlType === 0) {
                                    requestDeviceMotion((err) => {
                                        if (!err) {
                                            setMouseControlType(1);
                                        } else {
                                            alert("无法开启陀螺仪: " + err.message);
                                        }
                                    });
                                } else {
                                    setMouseControlType(0);
                                }
                            }}
                            title="开启手机陀螺仪/重力感应"
                        >
                            {mouseControlType === 1 ? <ScreenRotation style={{ fontSize: 14 }} /> : <TouchApp style={{ fontSize: 14 }} />}
                            {mouseControlType === 1 ? '陀螺仪开' : '触控跟随'}
                        </button>
                    </div>

                    <div className="topbar-right">
                        <button
                            className="icon-tool-btn"
                            onClick={() => setRunPhysics(p => !p)}
                            title={runPhysics ? "物理模拟已开启（头发摆动）" : "物理模拟已锁定"}
                        >
                            {runPhysics ? <LockOpen style={{ fontSize: 14 }} /> : <Lock style={{ fontSize: 14 }} />}
                            {runPhysics ? '物理开' : '物理锁'}
                        </button>

                        <button
                            className="icon-tool-btn"
                            onClick={() => resetMiku()}
                            title="重置视线与姿态"
                        >
                            <Refresh style={{ fontSize: 14 }} /> 重置
                        </button>

                        <span className="fps-badge">
                            {Math.round(fps)} FPS
                        </span>
                    </div>
                </div>
            )}

            <div
                className="stage-scaler-box"
                style={{
                    width: `${W * scale}px`,
                    height: `${H * scale}px`,
                }}
            >
                <div
                    className="stage"
                    ref={stageRef}
                    style={{
                        transform: `scale(${scale})`,
                        backgroundColor: stageBackground || '#4F4859'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMoveInner}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                        latestMouseDown.current = false;
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                >
                    {useMemo(() => (
                        stageBackground === false ? (
                            <div className="stage-transparent" data-html2canvas-ignore={true} />
                        ) : typeof stageBackground === 'string' && stageBackground.startsWith('#') ? null : (
                            <img className="stage-background" src={stageBackground} alt="背景" />
                        )
                    ), [stageBackground])}

                    {useMemo(() => (
                        <Miku
                            control={control}
                            timestamp={timestamp}
                            model={config.model}
                            runPhysics={runPhysics}
                            key={mikuResetter}
                        />
                    ), [config.model, control, mikuResetter, runPhysics, timestamp])}

                    {!isPure && playType !== 1 && (
                        <div
                            className="touch-target"
                            data-html2canvas-ignore={true}
                            style={{
                                left: `${control.mouseX || W / 2}px`,
                                top: `${control.mouseY || H / 2}px`
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
