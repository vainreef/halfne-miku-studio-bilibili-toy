import './App.less';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import FileSaver from 'file-saver';
import JSZip from "jszip";
import html2canvas from "html2canvas";
import * as asscompiler from "ass-compiler";
import japanese from "japanese";

import defaultConfig from './defaultModel';
import { parseModelJS } from "./Engine/modelUtils";
import Animated_GIF from './Animated_GIF';
import Stage from './components/Stage/Stage';
import QuickPad from './components/QuickPad/QuickPad';
import Controls from './components/Controls/Controls';

const W = 800;
const H = 600;

let waitUntilNextFrame = requestAnimationFrame;
let fpsArr = [];

const query = (new URL(window.location.href)).searchParams;
const isPure = query.get('pure');
const remote = query.get('remote');
const model = query.get('model');

const formatTime = (millis) => Math.floor(millis / 1000 / 60) + ':' + ('00' + Math.floor(millis / 1000 % 60)).slice(-2);
const parseKeyMapping = (keyList, keyMapping) => keyList.map(o => keyMapping.filter(([k, ...v]) => v.includes(o)).map(([k]) => k))
    .reduce((p, c) => [...p, ...c], []);

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

let dmListener;

function requestDeviceMotion(callback) {
    if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) {
        DeviceMotionEvent.requestPermission().then(function (state) {
            if (state === "granted") {
                callback(null);
            } else {
                callback(new Error("用户拒绝了传感器权限"));
            }
        }, function (err) {
            callback(err);
        });
    } else if (window.ondevicemotion !== undefined) {
        callback(null);
    } else {
        callback(new Error("当前设备或浏览器不支持陀螺仪/加速度感应"));
    }
}

export default function App() {
    const stageRef = useRef();
    const latestMousePos = useRef([W / 2, H / 2]);
    const latestMouseDown = useRef(false);
    const audioRef = useRef();
    const editorTimestampOnPlay = useRef(0);
    const [timestamp, setTimestamp] = useState(performance.now());

    const [config, setConfig] = useState(defaultConfig);
    const [control, setControl] = useState(config.parseControl());
    const [keyMapping, setKeyMapping] = useState(config.defaultKeyMapping);

    const [fpsTarget, setFpsTarget] = useState(0);
    const [mouseControlType, setMouseControlType] = useState(0);
    const [renderFps, setRenderFps] = useState(60);
    const [fps, setFps] = useState(0);

    const [playType, setPlayType] = useState(0);
    const [playSpeed, setPlaySpeed] = useState(1);
    const playTypeChangeTime = useRef();
    const [record, setRecord] = useState([]);
    const [mikuResetter, setMikuResetter] = useState(0);
    const [stageBackground, setStageBackground] = useState(
        (config.background && Object.entries(config.background)?.[0]?.[1]) || '#4F4859'
    );
    const [layer, setLayer] = useState();
    const [editorTimestamp, setEditorTimestamp] = useState(0);
    const [runPhysics, setRunPhysics] = useState(true);
    const [audioFile, setAudioFile] = useState();

    const [renderStart, setRenderStart] = useState(undefined);
    const [renderEnd, setRenderEnd] = useState(undefined);
    const [renderScale, setRenderScale] = useState(1);
    const [renderTarget, setRenderTarget] = useState('GIF');

    // 操作模式：'pad' 为触屏快捷表演台，'studio' 为时间轴动作制作室
    const [uiMode, setUiMode] = useState('pad');

    // 虚拟面板选中的按键列表（眼神、口型、情绪等）
    const [activeVirtualKeys, setActiveVirtualKeys] = useState([]);

    const editorTimestampRef = useRef(0);
    useEffect(() => {
        editorTimestampRef.current = editorTimestamp;
    }, [editorTimestamp]);

    const recordRef = useRef([]);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    const resetMiku = useCallback((rawControl = { mouseX: W / 2, mouseY: H / 2, keyInput: [] }) => {
        latestMousePos.current = [rawControl.mouseX, rawControl.mouseY];
        setActiveVirtualKeys([]);
        if (window.keyList) window.keyList = [];
        setControl(config.parseControl(rawControl));
        setMikuResetter(i => i + 1);
    }, [config]);

    // 快速定位视线
    const handleSetGaze = useCallback((targetX, targetY) => {
        latestMousePos.current = [targetX, targetY];
        if (playType === 2) {
            setRecord(prev => {
                for (let l of prev) {
                    for (let c of l.a) {
                        if (c.selected) {
                            c.c.mouseX = targetX;
                            c.c.mouseY = targetY;
                        }
                    }
                }
                return [...prev];
            });
        }
    }, [playType]);

    // 触控表演板按键触发与切换
    const handleTriggerKey = useCallback((keyId, category) => {
        setActiveVirtualKeys(prev => {
            let next = [...prev];
            if (category === 'eye') {
                next = next.filter(k => !k.startsWith('Eye') || k === 'EyeBlink');
                next.push(keyId);
            } else if (category === 'mouthShape') {
                const mouthShapes = ['MouthAA', 'MouthEE', 'MouthOO', 'MouthEH', 'MouthOH', 'MouthTeeth', 'MouthMM'];
                next = next.filter(k => !mouthShapes.includes(k));
                if (keyId !== 'MouthMM') next.push(keyId);
            } else if (category === 'mood') {
                const moods = ['MouthHappy', 'MouthNeutral', 'MouthCat', 'MouthAngry', 'MouthPout', 'MouthDrool', 'MouthDuck', 'MouthTongue'];
                next = next.filter(k => !moods.includes(k));
                next.push(keyId);
            }
            return next;
        });

        // 如果处于录制中，实时同步写入
        if (playType === -1 && layer !== undefined) {
            // 实时录制将在 useEffect[control] 中自动捕获 keyInput
        }

        // 如果处于暂停编辑节点状态，直接将表情写入当前选中的节点
        if (playType === 2) {
            setRecord(prev => {
                for (let l of prev) {
                    for (let c of l.a) {
                        if (c.selected) {
                            let curr = c.c.keyInput || [];
                            if (category === 'eye') {
                                curr = curr.filter(k => !k.startsWith('Eye') || k === 'EyeBlink');
                                curr.push(keyId);
                            } else if (category === 'mouthShape') {
                                const mouthShapes = ['MouthAA', 'MouthEE', 'MouthOO', 'MouthEH', 'MouthOH', 'MouthTeeth', 'MouthMM'];
                                curr = curr.filter(k => !mouthShapes.includes(k));
                                if (keyId !== 'MouthMM') curr.push(keyId);
                            } else if (category === 'mood') {
                                const moods = ['MouthHappy', 'MouthNeutral', 'MouthCat', 'MouthAngry', 'MouthPout', 'MouthDrool', 'MouthDuck', 'MouthTongue'];
                                curr = curr.filter(k => !moods.includes(k));
                                curr.push(keyId);
                            }
                            c.c.keyInput = curr;
                        }
                    }
                }
                return [...prev];
            });
        }
    }, [layer, playType]);

    // 应用一键组合神情
    const handleApplyPreset = useCallback((keysArray) => {
        setActiveVirtualKeys(keysArray);
        if (playType === 2) {
            setRecord(prev => {
                for (let l of prev) {
                    for (let c of l.a) {
                        if (c.selected) {
                            c.c.keyInput = [...keysArray];
                        }
                    }
                }
                return [...prev];
            });
        }
    }, [playType]);

    // 切换眨眼/闭眼状态
    const handleToggleBlink = useCallback(() => {
        setActiveVirtualKeys(prev => {
            const hasBlink = prev.includes('EyeBlink');
            const next = hasBlink ? prev.filter(k => k !== 'EyeBlink') : [...prev, 'EyeBlink'];
            return next;
        });
    }, []);

    const togglePlayType = useCallback((v, fromTimestamp = editorTimestampRef.current) => {
        if (v === -1 && record[layer]?.l) return;
        if ((v === 1 || v === 3) && !record.length) return;

        editorTimestampOnPlay.current = fromTimestamp;
        playTypeChangeTime.current = performance.now();

        if (v === -1) {
            if (layer === undefined) setLayer(record.length);
        }
        if (v === 1 || v === 3) {
            setEditorTimestamp(fromTimestamp);
            resetMiku(getRawControl(recordRef.current, fromTimestamp));
        }

        if (audioRef.current) {
            if (v === -1 || v === 1) {
                audioRef.current.currentTime = fromTimestamp / 1000;
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }

        if (playType === -1 && record[layer]?.a) {
            setRecord(prevRecord => {
                if (!prevRecord[layer]?.a) return prevRecord;
                prevRecord[layer].a.forEach((o, i) => {
                    if (i === prevRecord[layer].a.length - 1 || i === 0) return;
                    if (
                        (prevRecord[layer].a[i - 1].c.mouseX === prevRecord[layer].a[i].c.mouseX) &&
                        (prevRecord[layer].a[i + 1].c.mouseX === prevRecord[layer].a[i].c.mouseX) &&
                        (prevRecord[layer].a[i - 1].c.mouseY === prevRecord[layer].a[i].c.mouseY) &&
                        (prevRecord[layer].a[i + 1].c.mouseY === prevRecord[layer].a[i].c.mouseY) &&
                        (prevRecord[layer].a[i - 1].c.keyInput?.join('||') === prevRecord[layer].a[i].c.keyInput?.join('||'))
                    ) prevRecord[layer].a[i].del = true;
                });
                prevRecord[layer].a = prevRecord[layer].a.filter(o => !o.del);
                prevRecord[layer].a = prevRecord[layer].a.sort((a, b) => a.t - b.t);
                return [...prevRecord];
            });
        }

        setPlayType(v || 0);
    }, [layer, playType, record, resetMiku]);

    // 帧率控制循环
    useEffect(() => {
        let frametime = 0;
        const _waitUntilNextFrame = fpsTarget
            ? (f => setTimeout(f, fpsTarget !== Infinity ? Math.max(0, 1000 / fpsTarget - frametime) : 0))
            : requestAnimationFrame;

        waitUntilNextFrame = cb => {
            _waitUntilNextFrame((...args) => {
                const tic = performance.now();
                cb(...args);
                const now = performance.now();
                frametime = now - tic;
                while (fpsArr.length > 0 && fpsArr[0] <= now - 1000) {
                    fpsArr.shift();
                }
                fpsArr.push(now);
                setFps((fpsArr.length - 1) * 1000 / (now - fpsArr[0]));
            });
        };
    }, [fpsTarget]);

    // 键盘操作响应
    useEffect(() => {
        const gotoNode = (next = true) => {
            let timetarget;
            setRecord(prev => {
                for (let line of prev) {
                    let orig;
                    for (let i = next ? 0 : line.a.length - 1; next ? (i < line.a.length) : i >= 0; next ? i++ : i--) {
                        let c = line.a[i];
                        if (c.selected) {
                            orig = c;
                        } else if (orig && c.c.keyInput) {
                            c.selected = 2;
                            timetarget = c.t;
                            delete orig.selected;
                            break;
                        }
                    }
                }
                return [...prev];
            });
            if (timetarget !== undefined) setEditorTimestamp(timetarget);
        };

        const editorKeyboardHandler = e => {
            if (e.type === 'keydown') {
                switch (e.key) {
                    case ' ':
                        if (!window.keyList || window.keyList[0] !== 'Enter') {
                            if (playType === 0 || playType === 2) {
                                if (e.shiftKey) togglePlayType(-1);
                                else togglePlayType(1);
                            } else {
                                togglePlayType(2);
                            }
                        }
                        break;
                    case 'Escape':
                        setRecord(prev => {
                            for (let l of prev) {
                                for (let c of l.a) {
                                    if (c.selected) delete c.selected;
                                }
                            }
                            return [...prev];
                        });
                        break;
                    case 'Delete':
                    case 'Backspace':
                        setRecord(prev => prev.map(l => ({ ...l, a: l.a.filter(o => !o.selected) })));
                        break;
                    case 'Enter':
                        setRecord(prev => {
                            for (let l of prev) {
                                for (let c of l.a) {
                                    if (c.selected) {
                                        c.c.keyInput = parseKeyMapping(window.keyList, keyMapping);
                                    }
                                }
                            }
                            return [...prev];
                        });
                        break;
                    case '=':
                        setRecord(prev => {
                            if (!prev?.[layer]?.l) {
                                if (layer === undefined) {
                                    setLayer(prev.length);
                                    return [...prev, { a: [{ t: editorTimestampRef.current, c: {} }] }];
                                } else {
                                    if (prev[layer].a.filter(o => o.t === editorTimestampRef.current).length === 0) {
                                        prev[layer].a.push({ t: editorTimestampRef.current, c: {} });
                                        prev[layer].a = prev[layer].a.sort((a, b) => a.t - b.t);
                                    }
                                }
                            }
                            return [...prev];
                        });
                        break;
                    case 'ArrowLeft':
                        setEditorTimestamp(x => Math.max(x - 100, 0));
                        break;
                    case 'ArrowRight':
                        setEditorTimestamp(x => Math.max(x + 100, 0));
                        break;
                    case 'ArrowUp':
                        gotoNode(false);
                        break;
                    case 'ArrowDown':
                        gotoNode(true);
                        break;
                    case '[':
                        setRenderStart(Math.min(editorTimestampRef.current, renderEnd || Infinity));
                        break;
                    case ']':
                        setRenderEnd(Math.max(editorTimestampRef.current, renderStart || 0));
                        break;
                    case 'v':
                        if (e.ctrlKey) {
                            const s = prompt('罗马音/ASS字幕自动对齐:', window.lastRomanjiInput || '');
                            if (s === null) return;
                            window.lastRomanjiInput = s;

                            const parsed = asscompiler.parse(s);
                            if (parsed?.events?.dialogue?.length) {
                                const mouthList = parsed.events.dialogue.map(dialogueLine => {
                                    let timeToStart = dialogueLine.Start * 1000;
                                    return dialogueLine.Text.parsed.map(word => {
                                        word.Start = timeToStart;
                                        if (word?.tags?.[0]?.k) timeToStart += word?.tags?.[0]?.k * 10;
                                        word.End = timeToStart;
                                        return word;
                                    }).filter(word => word.text && word.tags[0].k);
                                }).reduce((p, c) => [...p, ...c], [])
                                    .map(word => ({
                                        ...word,
                                        romanji: japanese.romanize(word.text.replace(/.*\|</, ''))
                                    })).filter(o => o.romanji.match(/[a-z]/)).map(word => ({
                                        ...word,
                                        keyInput: ({
                                            a: ['MouthAA'],
                                            e: ['MouthEH'],
                                            i: ['MouthEE'],
                                            o: ['MouthOH'],
                                            u: ['MouthOO'],
                                        })[word.romanji.replace(/[^a-z]/g, '').slice(-1)] || ['MouthMM']
                                    }));

                                if (layer === undefined) {
                                    setRecord(prev => {
                                        let time0 = mouthList[0].Start;
                                        const selTime0 = editorTimestampRef.current;
                                        setLayer(prev.length);
                                        return [...prev, {
                                            a: mouthList.map(word => ({
                                                t: word.Start - time0 + selTime0,
                                                te: word.End - time0 + selTime0,
                                                c: { keyInput: word.keyInput }
                                            })).reduce((p, c, i, a) =>
                                                (a[i + 1] && c.te !== a[i + 1].t)
                                                    ? [...p, { t: c.t, c: c.c }, { t: c.te, c: {} }]
                                                    : [...p, { t: c.t, c: c.c }], []
                                            )
                                        }];
                                    });
                                }
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        };

        if (!isPure) {
            window.addEventListener('keydown', editorKeyboardHandler);
            window.addEventListener('keyup', editorKeyboardHandler);
        }

        const keyboardHandler = e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.type === 'keydown' && e.key !== 'Alt' && e.key !== 'Control' && e.key !== 'Shift'
                && !e.ctrlKey && !e.altKey
            ) {
                if (!window.keyList) window.keyList = [];
                if (!window.keyList.includes(e.key)) window.keyList.push(e.key);
                if (window.keyList[0] === 'Enter') {
                    setRecord(prev => {
                        for (let l of prev) {
                            for (let c of l.a) {
                                if (c.selected) {
                                    c.c.keyInput = parseKeyMapping(window.keyList.slice(1), keyMapping);
                                }
                            }
                        }
                        return [...prev];
                    });
                }
            } else if (e.type === 'keyup') {
                if (window.keyList) {
                    window.keyList = window.keyList.filter(o => o !== e.key);
                    if (window.keyList[0] === 'Enter' && window.keyList.length === 1) {
                        gotoNode();
                    }
                }
            }
        };

        window.addEventListener('keydown', keyboardHandler);
        window.addEventListener('keyup', keyboardHandler);

        return () => {
            if (!isPure) {
                window.removeEventListener('keydown', editorKeyboardHandler);
                window.removeEventListener('keyup', editorKeyboardHandler);
            }
            window.removeEventListener('keydown', keyboardHandler);
            window.removeEventListener('keyup', keyboardHandler);
        };
    }, [isPure, keyMapping, layer, playType, renderEnd, renderStart, togglePlayType]);

    // 远程控制轮询支持
    useEffect(() => {
        if (remote) {
            let cancelled = false;
            const poll = async () => {
                let _delay = 5;
                while (!cancelled) {
                    try {
                        await fetch(remote).then(res => res.json()).then(({ mouseX, mouseY, keyInput, delay }) => {
                            if (!cancelled) latestMousePos.current = [mouseX, mouseY, keyInput];
                            _delay = delay;
                        });
                    } catch {} finally {
                        await new Promise((resolve) => setTimeout(resolve, _delay));
                    }
                }
            };
            poll();
            return () => { cancelled = true; };
        }
    }, []);

    // 模型 URL 传参加载支持
    useEffect(() => {
        if (model) {
            fetch(model).then(res => res.text()).then(s => {
                let newConfig = parseModelJS(s);
                setConfig(newConfig);
                resetMiku();
            });
        }
    }, [resetMiku]);

    // 主播放与实时循环
    useEffect(() => {
        if (playType === 0 || playType === -1) {
            if (!window.keyList) window.keyList = [];
            let lastTime = performance.now();
            let canceled = false;

            const updateControl = (ts = performance.now()) => {
                if (canceled) return;
                const dt = Math.min(ts - lastTime, 50);
                lastTime = ts;

                const x = latestMousePos.current[0];
                const y = latestMousePos.current[1];
                const physicalKeys = parseKeyMapping(window.keyList, keyMapping);
                // 组合物理键盘与触控虚拟面板的按键
                const combinedKeys = Array.from(new Set([
                    ...physicalKeys,
                    ...(latestMousePos.current[2] || []),
                    ...activeVirtualKeys
                ]));

                setControl(prevControl => {
                    const ratio = Math.min(0.02 * dt, 1);
                    const easeX = prevControl.mouseX * (1 - ratio) + x * ratio;
                    const easeY = prevControl.mouseY * (1 - ratio) + y * ratio;
                    const distance = Math.hypot(easeX - prevControl.mouseX, easeY - prevControl.mouseY);

                    const rawControl = (x === undefined || y === undefined)
                        ? { keyInput: combinedKeys }
                        : (distance < 1)
                            ? { mouseX: x, mouseY: y, keyInput: combinedKeys }
                            : { mouseX: +easeX.toFixed(1), mouseY: +easeY.toFixed(1), keyInput: combinedKeys };

                    return config.parseControl({ ...prevControl, ...rawControl, timestamp: ts });
                });
                setTimestamp(ts);
                waitUntilNextFrame(updateControl);
            };

            waitUntilNextFrame(updateControl);
            return () => { canceled = true; };
        }

        if (playType === 1) {
            let canceled = false;
            const updateControl = (ts = performance.now()) => {
                if (canceled) return;
                const targetTime = (ts - playTypeChangeTime.current) * playSpeed + editorTimestampOnPlay.current;
                setEditorTimestamp(targetTime);
                setTimestamp(targetTime);
                waitUntilNextFrame(updateControl);
            };
            waitUntilNextFrame(updateControl);
            return () => { canceled = true; };
        }

        if (playType === 3) {
            let canceled = false;
            let zip = new JSZip();
            const ag = new Animated_GIF({ repeat: 0, disposal: 2, transparent: true });
            ag.setSize(800 * renderScale, 600 * renderScale);
            ag.setDelay(1000 / renderFps);
            let partCount = 0;
            let size = 0;

            const updateControl = (currentFrame) => {
                if (canceled) return;
                const now = performance.now();
                while (fpsArr.length > 0 && fpsArr[0] <= now - 1000) {
                    fpsArr.shift();
                }
                fpsArr.push(now);
                setFps((fpsArr.length - 1) * 1000 / (now - fpsArr[0]));

                html2canvas(stageRef.current, {
                    backgroundColor: null,
                    removeContainer: false,
                    scale: renderScale
                }).then((canvas) => {
                    document.querySelectorAll('.html2canvas-container').forEach(el => {
                        const iframe = el.contentWindow;
                        if (el && iframe) {
                            el.src = 'about:blank';
                            iframe.document.write('');
                            iframe.document.clear();
                            iframe.close();
                            el.remove();
                        }
                    });

                    if (renderTarget === 'ZIP') {
                        canvas.toBlob(blob => {
                            size += blob.size;
                            if (size > 1024 * 1024 * 1024) {
                                const currentPartCount = partCount;
                                partCount++;
                                zip.generateAsync({ type: 'blob' }).then(b => {
                                    FileSaver.saveAs(b, `Miku-Render-part${currentPartCount}.zip`);
                                });
                                zip = new JSZip();
                                size = 0;
                            }
                            zip.file(`Miku-Frame-${('00000' + currentFrame).slice(-5)}.png`, blob);
                        });
                    } else {
                        ag.addFrameImageData(
                            canvas.getContext('2d').getImageData(0, 0, 800 * renderScale, 600 * renderScale)
                        );
                    }

                    const targetTime = (currentFrame + 1) * 1000 / renderFps + editorTimestampOnPlay.current;
                    if (targetTime <= (renderEnd || 5000)) {
                        setEditorTimestamp(targetTime);
                        setTimestamp(targetTime);
                        setTimeout(() => updateControl(currentFrame + 1));
                    } else {
                        togglePlayType(2);
                    }
                });
            };

            setTimeout(() => updateControl(0));

            return () => {
                canceled = true;
                if (renderTarget === 'ZIP') {
                    zip.generateAsync({ type: 'blob' }).then(b =>
                        FileSaver.saveAs(b, partCount === 0 ? 'Miku-Render.zip' : `Miku-Render-part${partCount}.zip`)
                    );
                } else {
                    ag.getBlobGIF(b =>
                        FileSaver.saveAs(b, partCount === 0 ? 'Miku-Render.gif' : `Miku-Render-part${partCount}.gif`)
                    );
                }
            };
        }
    }, [playType, playSpeed, keyMapping, activeVirtualKeys, config, renderScale, renderFps, renderTarget, renderEnd, togglePlayType]);

    // 录制逻辑
    useEffect(() => {
        if (playType === -1) {
            const { mouseX, mouseY, timestamp: ts, keyInput } = control;
            if (ts === undefined) return;

            setRecord(prev => {
                const nextRecord = [...prev];
                if (!nextRecord[layer]) nextRecord[layer] = { a: [] };
                const i = nextRecord[layer].a.length - 1;
                const con = {
                    mouseX: latestMouseDown.current ? mouseX : undefined,
                    mouseY: latestMouseDown.current ? mouseY : undefined,
                    keyInput: keyInput?.length ? keyInput : undefined
                };
                const t = Math.max(ts - playTypeChangeTime.current, 0) * playSpeed + editorTimestampOnPlay.current;

                if (
                    i > 0 &&
                    (con.mouseX === nextRecord[layer].a[i].c.mouseX) &&
                    (con.mouseX === nextRecord[layer].a[i - 1].c.mouseX) &&
                    (con.mouseY === nextRecord[layer].a[i].c.mouseY) &&
                    (con.mouseY === nextRecord[layer].a[i - 1].c.mouseY) &&
                    (nextRecord[layer].a[i].c.keyInput?.join('||') === nextRecord[layer].a[i - 1].c.keyInput?.join('||'))
                ) {
                    nextRecord[layer].a[i] = { t, c: con };
                } else {
                    nextRecord[layer].a.push({ t, c: con });
                }
                return nextRecord;
            });
            setEditorTimestamp((ts - playTypeChangeTime.current) * playSpeed + editorTimestampOnPlay.current);
        }
    }, [control, layer, playSpeed, playType]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.playbackRate = playSpeed;
    }, [playSpeed]);

    // 时间轴游标更新到画面控制
    useEffect(() => {
        if (playType >= 0 && record?.length) {
            const targetTime = editorTimestamp;
            setControl(prev => {
                const newControl = getRawControl(record, targetTime);
                if (newControl?.mouseX) latestMousePos.current = [newControl.mouseX, newControl.mouseY];
                return config.parseControl({ ...prev, ...newControl });
            });
            if (playType === 2) setTimestamp(editorTimestamp);
        }
    }, [playType, editorTimestamp, record, config]);

    // 处理移动和触控移动
    const handleMouseMove = useCallback((pos) => {
        if (!pos) return;
        const { mouseX, mouseY } = pos;

        if (playType === 0 || playType === -1) {
            latestMousePos.current = [mouseX, mouseY];
        } else if (playType === 2 && latestMouseDown.current) {
            latestMousePos.current = [mouseX, mouseY];
            setRecord(prev => {
                for (let l of prev) {
                    for (let c of l.a) {
                        if (c.selected) {
                            c.c.mouseX = mouseX;
                            c.c.mouseY = mouseY;
                        }
                    }
                }
                return [...prev];
            });
        }
    }, [playType]);

    // 陀螺仪控制配置
    useEffect(() => {
        if (mouseControlType === 1) {
            dmListener = (e) => {
                const gamma = e.gamma || 0; // 左右倾斜 -90 ~ 90
                const beta = e.beta || 0;   // 前后倾斜 -180 ~ 180
                const mouseX = Math.max(0, Math.min(W, (gamma / 45) * 300 + 400));
                const mouseY = Math.max(0, Math.min(H, ((-beta + 45) / 45) * 250 + 300));
                latestMousePos.current = [mouseX, mouseY];
            };
            window.addEventListener("deviceorientation", dmListener);
        } else {
            if (dmListener) window.removeEventListener("deviceorientation", dmListener);
            dmListener = undefined;
        }
        return () => {
            if (dmListener) window.removeEventListener("deviceorientation", dmListener);
        };
    }, [mouseControlType]);

    const controlTypePanel = useMemo(() => (
        <ToggleButtonGroup
            size="small"
            value={mouseControlType}
            exclusive
            onChange={(e, v) => {
                if (v === 1) {
                    requestDeviceMotion((err) => {
                        if (!err) {
                            setMouseControlType(1);
                        } else {
                            alert(err.message);
                        }
                    });
                } else {
                    setMouseControlType(0);
                }
            }}
        >
            <ToggleButton value={0}>触控/鼠标跟随</ToggleButton>
            <ToggleButton value={1}>手机陀螺仪/重力感应</ToggleButton>
        </ToggleButtonGroup>
    ), [mouseControlType]);

    return (
        <div className="App">
            <Stage
                control={control}
                timestamp={timestamp}
                config={config}
                runPhysics={runPhysics}
                setRunPhysics={setRunPhysics}
                mikuResetter={mikuResetter}
                stageBackground={stageBackground}
                stageRef={stageRef}
                isPure={isPure}
                playType={playType}
                fps={fps}
                mouseControlType={mouseControlType}
                setMouseControlType={setMouseControlType}
                requestDeviceMotion={requestDeviceMotion}
                onMouseMove={handleMouseMove}
                latestMouseDown={latestMouseDown}
                resetMiku={resetMiku}
                uiMode={uiMode}
                setUiMode={setUiMode}
            />

            {audioFile && (
                <audio
                    src={audioFile}
                    ref={audioRef}
                    onLoadedMetadata={() => {
                        setRenderEnd(end => end === undefined ? audioRef.current.duration * 1000 : end);
                        setRenderStart(start => start === undefined ? 0 : start);
                        audioRef.current.playbackRate = playSpeed;
                    }}
                />
            )}

            {!isPure && (
                <div className="bottom-workspace">
                    {uiMode === 'pad' ? (
                        <QuickPad
                            activeKeys={activeVirtualKeys}
                            onTriggerKey={handleTriggerKey}
                            onApplyPreset={handleApplyPreset}
                            onSetGaze={handleSetGaze}
                            isBlinking={activeVirtualKeys.includes('EyeBlink')}
                            onToggleBlink={handleToggleBlink}
                            playType={playType}
                            onResetMiku={resetMiku}
                        />
                    ) : (
                        <Controls
                            playType={playType}
                            togglePlayType={togglePlayType}
                            recordRef={recordRef}
                            layer={layer}
                            setEditorTimestamp={setEditorTimestamp}
                            resetMiku={resetMiku}
                            runPhysics={runPhysics}
                            setRunPhysics={setRunPhysics}
                            setAudioFile={setAudioFile}
                            setRecord={setRecord}
                            record={record}
                            setLayer={setLayer}
                            renderStart={renderStart}
                            renderEnd={renderEnd}
                            keyMapping={keyMapping}
                            setKeyMapping={setKeyMapping}
                            editorTimestamp={editorTimestamp}
                            editorTimestampRef={editorTimestampRef}
                            config={config}
                            stageBackground={stageBackground}
                            setStageBackground={setStageBackground}
                            control={control}
                            renderFps={renderFps}
                            setRenderFps={setRenderFps}
                            renderScale={renderScale}
                            setRenderScale={setRenderScale}
                            renderTarget={renderTarget}
                            setRenderTarget={setRenderTarget}
                            fpsTarget={fpsTarget}
                            setFpsTarget={setFpsTarget}
                            setConfig={setConfig}
                            fps={fps}
                            controlTypePanel={controlTypePanel}
                            stageRef={stageRef}
                            playSpeed={playSpeed}
                            setPlaySpeed={setPlaySpeed}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
