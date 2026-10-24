import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Mouse from "@mui/icons-material/MouseOutlined";
import LayerOptions from './LayerOptions';

const formatTime = (millis) => Math.floor(millis / 1000 / 60) + ':' + ('00' + Math.floor(millis / 1000 % 60)).slice(-2);
const parseKeyMapping = (keyList, keyMapping) => keyList.map(o => keyMapping.filter(([k, ...v]) => v.includes(o)).map(([k]) => k))
    .reduce((p, c) => [...p, ...c], []);

function isDOMOverlap(a, b) {
    if (!a || !b) return false;
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();
    return !(
        rectB.right < rectA.left ||
        rectB.left > rectA.right ||
        rectB.bottom < rectA.top ||
        rectB.top > rectA.bottom
    );
}

export default function TimeLine({
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
}) {
    const [scale, setScale] = useState(600);
    const [centerOffset, setCenterOffset] = useState(30000);
    const timelineRef = useRef();
    const selectionDragging = useRef(false);
    const rectSelectStart = useRef();
    const [rectSelectEnd, setRectSelectEnd] = useState(undefined);
    const rectSelect = useRef();

    const t2l = useCallback((timestamp) => ((timestamp - centerOffset) / scale + 50), [centerOffset, scale]);
    const l2t = useCallback((left) => centerOffset + (left - 50) * scale, [centerOffset, scale]);

    const timelineWheel = useCallback((e) => {
        if (e.ctrlKey) {
            setScale(x => Math.min(Math.max(x + x * (10 / e.deltaY), 10), 1e5));
        } else {
            setCenterOffset(x => Math.max(x + e.deltaY * scale / 100, scale * 50));
        }
    }, [scale]);

    const rulerScale = [1e2, 2e2, 5e2, 1e3, 2e3, 5e3, 1e4, 2e4, 6e4, 12e4, 3e5, 6e5].reduce((p, c) => p ? p : c >= scale * 5 ? c : 0, 0) || 6e5;
    const marks = rulerScale ? (new Array(Math.floor(scale * 100 / rulerScale))).fill(0)
        .map((o, i) => ((Math.ceil(l2t(0) / rulerScale) + i) * rulerScale)) : [];

    useEffect(() => {
        if ((editorTimestamp - centerOffset) / scale + 50 < 0) {
            setCenterOffset(Math.max(scale * 50, editorTimestamp - scale * 40));
        }
        if ((editorTimestamp - centerOffset) / scale + 50 > 100) {
            setCenterOffset(editorTimestamp + scale * 40);
        }
    }, [editorTimestamp, scale]);

    useEffect(() => {
        if ((-centerOffset) / scale + 50 > 0) {
            setCenterOffset(scale * 50);
        }
    }, [scale]);

    const handleTimelineMouse = useCallback(e => {
        if (!timelineRef.current) return;
        const { x, width } = timelineRef.current.getBoundingClientRect();
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        if (clientX === undefined) return;
        setEditorTimestamp(Math.max(l2t(100 * (clientX - x) / width), 0));
    }, [l2t, setEditorTimestamp]);

    return (
        <div className='timeline'>
            {rectSelectEnd && (
                <div
                    ref={rectSelect}
                    style={{
                        position: 'fixed',
                        zIndex: 10000,
                        pointerEvents: "none",
                        left: Math.min(rectSelectStart.current.clientX, rectSelectEnd.clientX),
                        width: Math.abs(rectSelectStart.current.clientX - rectSelectEnd.clientX),
                        top: Math.min(rectSelectStart.current.clientY, rectSelectEnd.clientY),
                        height: Math.abs(rectSelectStart.current.clientY - rectSelectEnd.clientY),
                        background: 'rgba(57, 197, 187, 0.25)',
                        border: '1.5px dashed rgba(57, 197, 187, 0.8)'
                    }}
                />
            )}

            <div className='timeline-L'>
                {useMemo(() => (
                    <div className='timeline-L-toolbar'>
                        <div
                            className='timedisplay'
                            onWheel={e => setEditorTimestamp(x => Math.max(x + e.deltaY, 0))}
                            title="当前播放时间 (使用滚轮可微调)"
                        >
                            <b>{formatTime(editorTimestamp)}</b>
                            <span className='small'>&nbsp;{('000' + Math.floor(editorTimestamp % 1000)).slice(-3)}</span>
                        </div>
                    </div>
                ), [editorTimestamp, setEditorTimestamp])}

                {useMemo(() => (
                    <div className='timeline-L-layer'>
                        {record.map((o, i) => {
                            const { n = `图层 ${i + 1}` } = o;
                            return (
                                <div
                                    key={i}
                                    className={'timeline-L-layer-item ' + (i === layer ? 'timeline-L-layer-item-selected' : "")}
                                    onClick={() => setLayer(i)}
                                >
                                    <span
                                        title="双击可修改图层名称"
                                        onDoubleClick={() => {
                                            const newName = prompt('请输入图层名称:', n);
                                            if (newName) {
                                                setRecord(record => {
                                                    record[i].n = newName;
                                                    return [...record];
                                                });
                                            }
                                        }}
                                    >
                                        {n}
                                    </span>
                                    <LayerOptions
                                        layerData={o}
                                        i={i}
                                        recordLength={record.length}
                                        setRecord={setRecord}
                                        editorTimestampRef={editorTimestampRef}
                                        setLayer={setLayer}
                                    />
                                </div>
                            );
                        })}

                        <div
                            className={'timeline-L-layer-item timeline-L-new-layer ' + (undefined === layer ? 'timeline-L-layer-item-selected' : "")}
                            onClick={() => setLayer(undefined)}
                        >
                            ➕ 新建图层
                        </div>
                    </div>
                ), [layer, record, setLayer, setRecord, editorTimestampRef])}
            </div>

            <div className='timeline-R' ref={timelineRef}>
                {useMemo(() => (
                    <div
                        className='timeline-R-time'
                        onWheel={timelineWheel}
                        onClick={handleTimelineMouse}
                        onMouseMove={e => {
                            !e.shiftKey && e.buttons && handleTimelineMouse(e);
                        }}
                    >
                        {marks.map((o, idx) => (
                            <div key={idx} className='timeline-R-time-mark' style={{ left: t2l(o) + '%' }} />
                        ))}
                        {marks.map((o, idx) => o % 1000 === 0 ? (
                            <div key={`t-${idx}`} className='timeline-R-time-time' style={{ left: t2l(o) + '%' }}>
                                {formatTime(o)}
                            </div>
                        ) : null)}

                        {t2l(renderStart) >= 0 && t2l(renderStart) < 100 && (
                            <div className='timeline-R-time-render-L' style={{ left: t2l(renderStart) + '%' }} title="渲染起始点" />
                        )}
                        {t2l(renderEnd) >= 0 && t2l(renderEnd) < 100 && (
                            <div className='timeline-R-time-render-R' style={{ left: t2l(renderEnd) + '%' }} title="渲染终点" />
                        )}
                        {t2l(editorTimestamp) >= 0 && t2l(editorTimestamp) < 100 && (
                            <div className='timeline-R-time-arrow' style={{ left: t2l(editorTimestamp) + '%' }} />
                        )}
                    </div>
                ), [editorTimestamp, handleTimelineMouse, marks, renderEnd, renderStart, t2l, timelineWheel])}

                {useMemo(() => (
                    <div
                        className='timeline-R-content'
                        onWheel={timelineWheel}
                        onMouseMove={e => {
                            if (e.buttons && selectionDragging.current) {
                                const { x, width } = timelineRef.current.getBoundingClientRect();
                                const { clientX } = e;
                                const newTS = Math.max(l2t(100 * (clientX - x) / width), 0);
                                let dTS;
                                setRecord(record => {
                                    for (let l of record) {
                                        let shouldSort = false;
                                        for (let c of l.a) {
                                            if (c.selected === 2) {
                                                shouldSort = true;
                                                dTS = newTS - c.t;
                                                c.t = newTS;
                                            }
                                        }
                                        for (let c of l.a) {
                                            if (c.selected === 1) {
                                                shouldSort = true;
                                                c.t += dTS;
                                            }
                                        }
                                        if (shouldSort) l.a = l.a.sort((a, b) => a.t - b.t);
                                    }
                                    return [...record];
                                });
                            } else if (e.buttons && e.shiftKey) {
                                setRectSelectEnd(e);
                                setRecord(record => {
                                    for (let l of record) {
                                        for (let c of l.a) {
                                            if (c.selected) delete c.selected;
                                        }
                                    }
                                    document.querySelectorAll('.timeline-R-content-layer-control').forEach(el => {
                                        if (isDOMOverlap(el, rectSelect.current)) {
                                            record[el.dataset.layerIndex].a[el.dataset.nodeIndex].selected = 1;
                                        }
                                    });
                                    return [...record];
                                });
                            }
                        }}
                        onMouseDown={e => {
                            if (e.shiftKey) {
                                rectSelectStart.current = e;
                                setRectSelectEnd(e);
                            }
                        }}
                        onMouseUp={() => {
                            selectionDragging.current = false;
                            rectSelectStart.current = undefined;
                            setRectSelectEnd(undefined);
                        }}
                    >
                        {record.map(({ a: layerArr = [], l = false }, layerIndex) => {
                            let renderNodes = layerArr.filter((r) => t2l(r.t) >= 0 && t2l(r.t) < 100);
                            renderNodes = [
                                layerArr[layerArr.indexOf(renderNodes[0]) - 1],
                                ...renderNodes,
                                layerArr[layerArr.indexOf(renderNodes[renderNodes.length - 1]) + 1]
                            ].filter(Boolean);

                            const shouldSimplify = playType === -1 || (renderNodes.length > 100 && scale >= 100);

                            return (
                                <div key={layerIndex} className='timeline-R-content-layer'>
                                    {shouldSimplify && layerArr.length ? (
                                        <div
                                            className='timeline-R-content-layer-block'
                                            style={{
                                                left: t2l(layerArr[0].t) + '%',
                                                right: 'calc( ' + (100 - t2l(layerArr[layerArr.length - 1].t)) + '% - 1px ',
                                                background: layerArr.some(r => r.c.mouseX) ? '#efe' : layerArr.some(r => r.c.keyInput) ? '#eef' : undefined,
                                            }}
                                        />
                                    ) : null}

                                    {!shouldSimplify ? renderNodes.map((r, i, o) => (
                                        <div
                                            key={i}
                                            className={'timeline-R-content-layer-control' + (r.selected ? ' timeline-R-content-layer-control-selected' : '')}
                                            style={{
                                                left: t2l(r.t) + '%',
                                                right: (o?.[i + 1]?.t && (r.c?.mouseX || r.c?.keyInput)) ? 'calc( ' + (100 - t2l(o?.[i + 1]?.t)) + '% ' + (r.selected ? ' + 2px' : '') : undefined,
                                                background: r.c.mouseX ? '#e8f5e9' : r.c.keyInput ? '#e8eaf6' : undefined,
                                            }}
                                            title={JSON.stringify(r.c)}
                                            data-layer-index={layerIndex}
                                            data-node-index={layerArr.indexOf(r)}
                                            onMouseDown={(e) => {
                                                if (r.selected) {
                                                    for (let line of record) {
                                                        for (let c of line.a) {
                                                            if (c.selected) c.selected = 1;
                                                        }
                                                    }
                                                } else {
                                                    r.selected = 2;
                                                    for (let line of record) {
                                                        let multiSelectStart = false;
                                                        for (let c of line.a) {
                                                            if (c.selected) {
                                                                if (e.shiftKey && !l) multiSelectStart = true;
                                                                else if (c !== r && !e.ctrlKey) delete c.selected;
                                                            }
                                                            if (multiSelectStart) c.selected = 1;
                                                            if (c === r) multiSelectStart = false;
                                                        }
                                                        if (multiSelectStart) {
                                                            let state = 0;
                                                            for (let c of line.a) {
                                                                if (c.selected) {
                                                                    if (state === 2) delete c.selected;
                                                                    if (state === 1) state = 2;
                                                                    if (state === 0) state = 1;
                                                                } else {
                                                                    if (state === 1) c.selected = 1;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                r.selected = 2;
                                                setRecord([...record]);
                                            }}
                                            onDoubleClick={() => {
                                                if (r.selected) {
                                                    setRecord(record => {
                                                        for (let l of record) {
                                                            for (let c of l.a) {
                                                                if (c.selected) {
                                                                    c.c.keyInput = parseKeyMapping(window.keyList, keyMapping);
                                                                }
                                                            }
                                                        }
                                                        return [...record];
                                                    });
                                                }
                                            }}
                                            onClick={() => setEditorTimestamp(r.t)}
                                        >
                                            <div
                                                className='timeline-R-content-layer-control-dragger'
                                                onMouseDown={(e) => {
                                                    if (!l && !e.shiftKey && !e.ctrlKey) selectionDragging.current = true;
                                                }}
                                            />
                                            {r.c.mouseX !== undefined && <Mouse className='timeline-R-content-layer-control-icon' />}
                                            {r.c.keyInput !== undefined && r.c.keyInput.map((s, si) => (
                                                <div key={si} className='timeline-R-content-layer-control-key'>
                                                    &nbsp;{s.replace(/[a-z ]/g, '')}
                                                </div>
                                            ))}
                                        </div>
                                    )) : null}
                                </div>
                            );
                        })}
                        <div className='timeline-R-content-layer' />
                    </div>
                ), [timelineWheel, record, l2t, setRecord, playType, scale, t2l, keyMapping, setEditorTimestamp])}
            </div>
        </div>
    );
}
