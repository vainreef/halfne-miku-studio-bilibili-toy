import React, { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import './Stage.less';
import Miku from '../../Miku/Miku';
const W = 800;
const H = 600;

export default function Stage({
    control,
    realtimeChannel,
    timestamp,
    config,
    runPhysics,
    mikuResetter,
    stageBackground,
    stageRef,
    isPure,
    playType,
    onMouseMove,
    latestMouseDown,
    currentSkinId = 'miku',
    onOpenCharacters,
    onOpenMenu,
    showTarget = false,
    touchMode = 'relative'
}) {
    const containerRef = useRef(null), viewportRef = useRef(null);
    const [scale, setScale] = useState(() => {
        const w = window.innerWidth, h = Number(document.documentElement.dataset.toyViewportHeight) || window.innerHeight;
        const maxH = w >= 600 && h <= 500 ? Math.max(120, h - 100) : Math.max(120, h - (w <= 768 ? 325 : 350));
        return Math.max(.1, Math.min(1.25, (w - 24) / W, maxH / H));
    });
    const [renderer, setRenderer] = useState('dom');
    const [renderedFps, setRenderedFps] = useState(0);
    useEffect(() => setRenderedFps(0), [mikuResetter]);
    const targetRef = useRef(null);
    useEffect(() => realtimeChannel?.subscribe(next => {
        if (targetRef.current) {
            targetRef.current.style.left = (next.mouseX ?? 400) + 'px';
            targetRef.current.style.top = (next.mouseY ?? 300) + 'px';
        }
    }), [realtimeChannel]);

    // 放大镜缩放档位：1.0(默认全貌) -> 1.25 -> 1.5 -> 1.75 -> 2.0
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const panRef = useRef({ x: 0, y: 0 });

    // 恢复初始姿态时重置缩放与平移，严格恢复默认居中
    useEffect(() => {
        setZoomLevel(1.0);
        panRef.current = { x: 0, y: 0 };
        setPanOffset({ x: 0, y: 0 });
    }, [mikuResetter]);

    // 限制放大状态下画布平移范围，防止角色移出可视区域
    const clampPan = useCallback((x, y, currentZoom) => {
        if (!viewportRef.current || currentZoom <= 1.0) return { x: 0, y: 0 };
        const vp = viewportRef.current.getBoundingClientRect();
        const stageW = W * scale * currentZoom;
        const stageH = H * scale * currentZoom;
        const maxX = Math.max(100, (stageW - vp.width) * 0.5 + 80);
        const maxY = Math.max(120, (stageH - vp.height) * 0.5 + 160);
        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y))
        };
    }, [scale]);

    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => {
            const next = Math.min(2.0, +(prev + 0.25).toFixed(2));
            const nextPan = clampPan(panRef.current.x, panRef.current.y, next);
            panRef.current = nextPan;
            setPanOffset(nextPan);
            return next;
        });
    }, [clampPan]);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => {
            const next = Math.max(1.0, +(prev - 0.25).toFixed(2));
            if (next <= 1.0) {
                // 缩小至默认大小(1.0)时，严格强制复位 Y 轴与 X 轴，回归默认居中位置
                panRef.current = { x: 0, y: 0 };
                setPanOffset({ x: 0, y: 0 });
            } else {
                // 按比例向中心衰减收敛，并在范围内限制
                const ratio = (next - 1.0) / (prev - 1.0);
                const nextPan = clampPan(+(panRef.current.x * ratio).toFixed(1), +(panRef.current.y * ratio).toFixed(1), next);
                panRef.current = nextPan;
                setPanOffset(nextPan);
            }
            return next;
        });
    }, [clampPan]);

    // 计算根据屏幕自适应的缩放比例
    const updateScale = useCallback(() => {
        if (!containerRef.current) return;
        const viewport = viewportRef.current;
        let maxW = Math.min(viewport?.clientWidth || containerRef.current.clientWidth, 1000);
        let maxH = viewport?.clientHeight || 1;

        let newScale = Math.min(maxW / W, maxH / H);
        if (newScale > 1.25) newScale = 1.25;
        if (newScale < 0.05) newScale = 0.05;
        setScale(newScale);
    }, []);

    useLayoutEffect(() => {
        updateScale();
        const observer = new ResizeObserver(updateScale);
        if (viewportRef.current) observer.observe(viewportRef.current);
        window.addEventListener('resize', updateScale);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateScale);
        };
    }, [updateScale]);

    // 坐标精准换算（考虑缩放与视口位置）
    const handlePointerAction = useCallback((clientX, clientY, isDown = false) => {
        if (!stageRef.current) return;
        const rect = stageRef.current.getBoundingClientRect();
        const mouseX = Math.round(Math.max(0, Math.min(W, ((clientX - rect.left) / rect.width) * W)));
        const mouseY = Math.round(Math.max(0, Math.min(H, ((clientY - rect.top) / rect.height) * H)));
        onMouseMove({ clientX, clientY, mouseX, mouseY });
    }, [onMouseMove, stageRef]);

    const isMultiTouch = useRef(false);
    const multiDragOrigin = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
    const lastMultiEndTime = useRef(0);

    const activeTouchId = useRef(null);
    const touchOrigin = useRef({ clientX: 0, clientY: 0 });

    const handleTouchStart = (e) => {
        if (e.cancelable) e.preventDefault();

        // 双指触控：专门用于移动画布（仅在放大后平移）
        if (e.touches?.length >= 2) {
            isMultiTouch.current = true;
            activeTouchId.current = null;
            latestMouseDown.current = false;
            const t1 = e.touches[0], t2 = e.touches[1];
            const midX = (t1.clientX + t2.clientX) / 2;
            const midY = (t1.clientY + t2.clientY) / 2;
            multiDragOrigin.current = {
                x: midX,
                y: midY,
                panX: panRef.current.x,
                panY: panRef.current.y
            };
            return;
        }

        // 双指刚结束冷却保护，防止残余单指引起视线突跳
        if (performance.now() - lastMultiEndTime.current < 200) return;

        // 单指触控：永远用于触控动作（视线与身体姿态跟踪），绝不用于移动画布
        if (e.changedTouches?.length > 0) {
            const touch = e.changedTouches[0];
            activeTouchId.current = touch.identifier;
            latestMouseDown.current = true;

            if (touchMode === 'absolute') {
                handlePointerAction(touch.clientX, touch.clientY, true);
            } else {
                touchOrigin.current = { clientX: touch.clientX, clientY: touch.clientY };
                onMouseMove({ clientX: touch.clientX, clientY: touch.clientY, mouseX: 400, mouseY: 300 });
            }
        }
    };

    const handleTouchMove = (e) => {
        if (e.cancelable) e.preventDefault();

        // 双指滑动：放大状态下平移画布
        if (e.touches?.length >= 2 && isMultiTouch.current) {
            if (zoomLevel > 1.0) {
                const t1 = e.touches[0], t2 = e.touches[1];
                const midX = (t1.clientX + t2.clientX) / 2;
                const midY = (t1.clientY + t2.clientY) / 2;
                const dx = midX - multiDragOrigin.current.x;
                const dy = midY - multiDragOrigin.current.y;
                const nextPan = clampPan(multiDragOrigin.current.panX + dx, multiDragOrigin.current.panY + dy, zoomLevel);
                panRef.current = nextPan;
                setPanOffset(nextPan);
            }
            return;
        }

        // 单指滑动：触控动作跟踪
        if (activeTouchId.current === null) return;
        for (let i = 0; i < (e.touches?.length || 0); i++) {
            const touch = e.touches[i];
            if (touch.identifier === activeTouchId.current) {
                if (touchMode === 'absolute') {
                    handlePointerAction(touch.clientX, touch.clientY, true);
                } else {
                    const rect = stageRef.current?.getBoundingClientRect();
                    const deltaX = touch.clientX - touchOrigin.current.clientX;
                    const deltaY = touch.clientY - touchOrigin.current.clientY;
                    const scaleX = rect?.width ? (W / rect.width) : 1;
                    const scaleY = rect?.height ? (H / rect.height) : 1;
                    const sensitivity = 1.25;
                    const mouseX = Math.round(Math.max(0, Math.min(W, 400 + deltaX * scaleX * sensitivity)));
                    const mouseY = Math.round(Math.max(0, Math.min(H, 300 + deltaY * scaleY * sensitivity)));
                    onMouseMove({ clientX: touch.clientX, clientY: touch.clientY, mouseX, mouseY });
                }
                return;
            }
        }
    };

    const handleTouchEnd = (e) => {
        if (isMultiTouch.current) {
            if (e.touches?.length < 2) {
                isMultiTouch.current = false;
                lastMultiEndTime.current = performance.now();
            }
            return;
        }
        if (activeTouchId.current === null) return;
        for (let i = 0; i < (e.changedTouches?.length || 0); i++) {
            if (e.changedTouches[i].identifier === activeTouchId.current) {
                activeTouchId.current = null;
                latestMouseDown.current = false;
                if (touchMode === 'relative') {
                    onMouseMove({ clientX: 0, clientY: 0, mouseX: 400, mouseY: 300 });
                }
                break;
            }
        }
    };

    const handleTouchCancel = (e) => {
        isMultiTouch.current = false;
        lastMultiEndTime.current = performance.now();
        if (activeTouchId.current === null) return;
        activeTouchId.current = null;
        latestMouseDown.current = false;
        if (touchMode === 'relative') {
            onMouseMove({ clientX: 0, clientY: 0, mouseX: 400, mouseY: 300 });
        }
    };

    const handleMouseDown = (e) => {
        // 桌面鼠标左键单键拖动：永远是控制触控动作
        latestMouseDown.current = true;
        handlePointerAction(e.clientX, e.clientY, true);
    };

    const handleMouseMoveInner = (e) => {
        if (!latestMouseDown.current) return;
        if (playType === 2 && !e.buttons) return;
        handlePointerAction(e.clientX, e.clientY, !!e.buttons);
    };

    const handleMouseUp = () => {
        latestMouseDown.current = false;
    };

    // 触控板双指滑动在放大状态下平移画面
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        const handleWheel = (e) => {
            if (zoomLevel <= 1.0) return;
            e.preventDefault();
            const nextPan = clampPan(panRef.current.x - e.deltaX, panRef.current.y - e.deltaY, zoomLevel);
            panRef.current = nextPan;
            setPanOffset(nextPan);
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [zoomLevel, clampPan]);

    return (
        <div className="stage-wrapper" ref={containerRef}>
            {!isPure && <header className="stage-topbar">
                <button className="avatar-button" onClick={onOpenCharacters} aria-label="切换角色" title="切换角色">
                    <img src={`${import.meta.env.BASE_URL}assets/ui/${currentSkinId}-avatar.png?v=07`} alt={currentSkinId === 'whale' ? '大肥鱼' : '初音'} draggable={false}/>
                </button>

                <div className="topbar-center">
                    <div className="zoom-controls" role="group" aria-label="画面缩放">
                        <button
                            type="button"
                            className="zoom-btn zoom-out"
                            onClick={handleZoomOut}
                            disabled={zoomLevel <= 1.0}
                            aria-label="缩小画面"
                            title="缩小画面"
                        >
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <circle cx="10.5" cy="10.5" r="6.5" />
                                <line x1="15.5" y1="15.5" x2="21" y2="21" />
                                <line x1="7" y1="10.5" x2="14" y2="10.5" />
                            </svg>
                        </button>
                        <span className="zoom-label">{Math.round(zoomLevel * 100)}%</span>
                        <button
                            type="button"
                            className="zoom-btn zoom-in"
                            onClick={handleZoomIn}
                            disabled={zoomLevel >= 2.0}
                            aria-label="放大画面"
                            title="放大画面"
                        >
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <circle cx="10.5" cy="10.5" r="6.5" />
                                <line x1="15.5" y1="15.5" x2="21" y2="21" />
                                <line x1="7" y1="10.5" x2="14" y2="10.5" />
                                <line x1="10.5" y1="7" x2="10.5" y2="14" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="topbar-right">
                    <span data-fps-source="render" className="fps-badge">
                        <span className="fps-num">{Math.round(renderedFps)}</span>
                        <span className="fps-unit">FPS</span>
                    </span>
                    <button className="menu-button" onClick={onOpenMenu} aria-label="打开菜单">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <path d="M4 6.5h16M4 12h16M4 17.5h16"/>
                        </svg>
                    </button>
                </div>
            </header>}

            <div
                className="stage-viewport"
                ref={viewportRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMoveInner}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                    latestMouseDown.current = false;
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
            >
                <div
                    className="stage-scaler-box"
                    style={{
                        width: `${Math.round(W * scale)}px`,
                        height: `${Math.round(H * scale)}px`,
                        transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                        transition: isMultiTouch.current ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0, 0, 1)'
                    }}
                >
                    <div
                        className="stage"
                        ref={stageRef}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            transformOrigin: 'center center',
                            backgroundColor: stageBackground || '#4F4859'
                        }}
                    >
                    {useMemo(() => (
                        stageBackground === false ? (
                            <div className="stage-transparent" data-html2canvas-ignore={true} />
                        ) : typeof stageBackground === 'string' && stageBackground.startsWith('#') ? null : (
                            <img draggable={false} className="stage-background" src={stageBackground} alt="背景" />
                        )
                    ), [stageBackground])}

                    {useMemo(() => (
                        <Miku
                            realtimeChannel={realtimeChannel}
                            control={control}
                            timestamp={timestamp}
                            model={config.model}
                            createSecondaryMotion={config.createSecondaryMotion}
                            onRendererChange={setRenderer}
                            onRenderedFps={setRenderedFps}
                            runPhysics={runPhysics}
                            zoomLevel={zoomLevel}
                            key={mikuResetter}
                        />
                    ), [config.model, control, mikuResetter, runPhysics, timestamp, realtimeChannel, zoomLevel])}

                    {!isPure && showTarget && (
                        <div
                            ref={targetRef}
                            className="touch-target"
                            data-html2canvas-ignore={true}
                            style={{
                                left: `${control.mouseX || W / 2}px`,
                                top: `${control.mouseY || H / 2}px`
                            }}
                        />
                    )}
                </div>
            </div></div>
        </div>
    );
}
