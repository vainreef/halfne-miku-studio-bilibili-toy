import { validateRecording } from '../../Engine/recording';
import React, { useMemo } from 'react';
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Pause from "@mui/icons-material/Pause";
import FastForward from "@mui/icons-material/FastForward";
import FastRewind from "@mui/icons-material/FastRewind";
import Refresh from "@mui/icons-material/Refresh";
import FileOpen from "@mui/icons-material/FileOpen";
import Save from "@mui/icons-material/Save";
import Lock from "@mui/icons-material/Lock";
import LockOpen from "@mui/icons-material/LockOpen";
import MusicNote from "@mui/icons-material/MusicNote";
import FirstPage from "@mui/icons-material/FirstPage";
import FileSaver from 'file-saver';

export default function TimeLineButtons({
    playType,
    togglePlayType,
    recordRef,
    canRecord,
    canPlay,
    setEditorTimestamp,
    resetMiku,
    runPhysics,
    setRunPhysics,
    setAudioFile,
    setRecord,
    playSpeed,
    setPlaySpeed
}) {
    return (
        <div className="timeline-toolbar-group">
            {useMemo(() => (
                <ToggleButtonGroup
                    size="small"
                    value={playType}
                    exclusive
                    onChange={(e, v) => togglePlayType(v)}
                >
                    <ToggleButton value={-1} disabled={canRecord} title='录制动作 (Shift + 空格)'>
                        <FiberManualRecord style={{ color: '#ff4757', fontSize: 18 }} />
                    </ToggleButton>
                    <ToggleButton value={1} disabled={canPlay} title='播放动作 (空格键)'>
                        <PlayArrow style={{ color: '#2ed573', fontSize: 18 }} />
                    </ToggleButton>
                    <ToggleButton value={2} title='暂停动作 (空格键)'>
                        <Pause style={{ color: '#ffa502', fontSize: 18 }} />
                    </ToggleButton>
                </ToggleButtonGroup>
            ), [canPlay, canRecord, playType, togglePlayType])}

            &nbsp;

            {useMemo(() => (
                <ToggleButtonGroup size="small">
                    <ToggleButton value={-1} onClick={() => setEditorTimestamp(0)} title='回到首帧 (0:00)'>
                        <FirstPage style={{ fontSize: 18 }} />
                    </ToggleButton>
                    <ToggleButton value={-1} onClick={() => setEditorTimestamp(x => Math.max(x - 100, 0))} title='后退 100ms'>
                        <FastRewind style={{ fontSize: 18 }} />
                    </ToggleButton>
                    <ToggleButton value={1} onClick={() => setEditorTimestamp(x => x + 100)} title='前进 100ms'>
                        <FastForward style={{ fontSize: 18 }} />
                    </ToggleButton>
                </ToggleButtonGroup>
            ), [setEditorTimestamp])}

            &nbsp;

            {useMemo(() => (
                <ToggleButtonGroup
                    size="small"
                    value={playSpeed}
                    exclusive
                    onChange={(e, v) => v && setPlaySpeed(v)}
                >
                    <ToggleButton value={0.5} disabled={playType === 1 || playType === -1} title='0.5 倍速播放'>
                        0.5x
                    </ToggleButton>
                    <ToggleButton value={0.75} disabled={playType === 1 || playType === -1} title='0.75 倍速播放'>
                        0.75x
                    </ToggleButton>
                    <ToggleButton value={1} disabled={playType === 1 || playType === -1} title='原速播放'>
                        1x
                    </ToggleButton>
                </ToggleButtonGroup>
            ), [playSpeed, playType, setPlaySpeed])}

            &nbsp;

            {useMemo(() => (
                <ToggleButtonGroup size="small">
                    <ToggleButton value={1} onClick={() => resetMiku()} title='重置姿态到中心'>
                        <Refresh style={{ fontSize: 18 }} />
                    </ToggleButton>
                </ToggleButtonGroup>
            ), [resetMiku])}

            &nbsp;

            {useMemo(() => (
                <ToggleButtonGroup
                    size="small"
                    value={runPhysics}
                    exclusive
                    onChange={() => setRunPhysics(x => !x)}
                >
                    <ToggleButton value={false} title={runPhysics ? '锁定物理模拟' : '开启物理模拟'}>
                        {runPhysics ? <LockOpen style={{ fontSize: 18 }} /> : <Lock style={{ fontSize: 18 }} />}
                    </ToggleButton>
                </ToggleButtonGroup>
            ), [runPhysics, setRunPhysics])}

            &nbsp;

            {useMemo(() => (
                <ToggleButtonGroup size="small">
                    <ToggleButton
                        value={1}
                        title='导入背景音乐 (MP3 / WAV / OGG)'
                        onClick={() => {
                            try {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'audio/*';
                                input.onchange = (e) => {
                                    if (!e.target.files?.[0]) return;
                                    const fr = new FileReader();
                                    fr.onload = () => setAudioFile(fr.result);
                                    fr.readAsDataURL(e.target.files[0]);
                                };
                                input.click();
                            } catch {}
                        }}
                    >
                        <MusicNote style={{ fontSize: 18 }} />
                    </ToggleButton>

                    <ToggleButton
                        value={1}
                        title='导入动作文件 (.json)'
                        onClick={() => {
                            try {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.json,text/plain';
                                input.onchange = (e) => {
                                    if (!e.target.files?.[0]) return;
                                    const fr = new FileReader();
                                    fr.onload = () => {
                                        try {
                                            setRecord(validateRecording(JSON.parse(fr.result)));
                                        } catch (err) {
                                            alert("动作文件解析失败: " + err.message);
                                        }
                                    };
                                    fr.readAsText(e.target.files[0]);
                                };
                                input.click();
                            } catch {}
                        }}
                    >
                        <FileOpen style={{ fontSize: 18 }} />
                    </ToggleButton>

                    <ToggleButton
                        value={1}
                        title='导出保存动作文件 (.json)'
                        disabled={canPlay}
                        onClick={() => {
                            const blob = new Blob([JSON.stringify(recordRef.current, null, 2)], {
                                type: "application/json;charset=utf-8"
                            });
                            FileSaver.saveAs(blob, "Miku-Motion.json");
                        }}
                    >
                        <Save style={{ fontSize: 18 }} />
                    </ToggleButton>
                </ToggleButtonGroup>
            ), [canPlay, recordRef, setAudioFile, setRecord])}
        </div>
    );
}
