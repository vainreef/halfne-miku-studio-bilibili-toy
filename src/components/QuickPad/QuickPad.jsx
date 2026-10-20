import React, { useState } from 'react';
import './QuickPad.less';
import {
    EYE_TYPES,
    MOUTH_SHAPES,
    MOOD_TYPES,
    PRESET_COMBOS,
    GAZE_POSITIONS
} from '../../constants/emotions';
import Button from '@mui/material/Button';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Refresh from '@mui/icons-material/Refresh';

export default function QuickPad({
    activeKeys = [],
    onTriggerKey,
    onApplyPreset,
    onSetGaze,
    isBlinking = false,
    onToggleBlink,
    playType = 0,
    onResetMiku
}) {
    const [currentTab, setCurrentTab] = useState(0);

    const tabs = [
        { id: 0, label: '🎭 情绪连招' },
        { id: 1, label: '👀 眼神目光' },
        { id: 2, label: '👄 说话口型' },
        { id: 3, label: '🐱 嘴部神态' },
        { id: 4, label: '🧭 快速转头' }
    ];

    const isKeyActive = (keyId) => activeKeys.includes(keyId);

    return (
        <div className="quick-pad">
            <div className="quick-pad-header">
                <div className="title">
                    <span>🎮 触屏表演板</span>
                    {playType === -1 && <span className="badge-rec">🔴 录制中 · 点选即录</span>}
                </div>
                <div className="quick-actions">
                    <Button
                        size="small"
                        variant={isBlinking ? "contained" : "outlined"}
                        color={isBlinking ? "error" : "primary"}
                        onClick={onToggleBlink}
                        startIcon={isBlinking ? <VisibilityOff /> : <Visibility />}
                        style={{ fontSize: 12, padding: '2px 8px', borderRadius: 16 }}
                    >
                        {isBlinking ? '已闭眼' : '眨眼'}
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={onResetMiku}
                        startIcon={<Refresh />}
                        style={{ fontSize: 12, padding: '2px 8px', borderRadius: 16, color: '#666', borderColor: '#ccc' }}
                    >
                        回正
                    </Button>
                </div>
            </div>

            <div className="quick-pad-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${currentTab === tab.id ? 'active' : ''}`}
                        onClick={() => setCurrentTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="quick-pad-body">
                {currentTab === 0 && (
                    <div className="grid-buttons">
                        {PRESET_COMBOS.map((combo) => (
                            <button
                                key={combo.name}
                                className="pad-btn"
                                onClick={() => onApplyPreset(combo.keys)}
                                title={combo.desc}
                            >
                                <span className="emoji">{combo.emoji}</span>
                                <span className="label">{combo.name}</span>
                                <span className="sub">{combo.desc}</span>
                            </button>
                        ))}
                    </div>
                )}

                {currentTab === 1 && (
                    <div className="grid-buttons">
                        {EYE_TYPES.map((eye) => {
                            const active = isKeyActive(eye.id);
                            return (
                                <button
                                    key={eye.id}
                                    className={`pad-btn ${active ? 'active' : ''}`}
                                    onClick={() => onTriggerKey(eye.id, 'eye')}
                                >
                                    <span className="emoji">{eye.emoji}</span>
                                    <span className="label">{eye.name}</span>
                                    <span className="sub">键: {eye.key}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {currentTab === 2 && (
                    <div className="grid-buttons">
                        {MOUTH_SHAPES.map((mouth) => {
                            const active = mouth.id === 'MouthMM'
                                ? !activeKeys.some(k => k.startsWith('Mouth') && k !== 'MouthMM' && !k.startsWith('MouthHappy') && !k.startsWith('MouthNeutral') && !k.startsWith('MouthCat') && !k.startsWith('MouthAngry') && !k.startsWith('MouthPout') && !k.startsWith('MouthDrool') && !k.startsWith('MouthDuck') && !k.startsWith('MouthTongue'))
                                : isKeyActive(mouth.id);
                            return (
                                <button
                                    key={mouth.id}
                                    className={`pad-btn ${active ? 'active' : ''}`}
                                    onClick={() => onTriggerKey(mouth.id, 'mouthShape')}
                                >
                                    <span className="emoji">👄</span>
                                    <span className="label">{mouth.name}</span>
                                    <span className="sub">{mouth.key ? `键: ${mouth.key}` : '默认'}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {currentTab === 3 && (
                    <div className="grid-buttons">
                        {MOOD_TYPES.map((mood) => {
                            const active = isKeyActive(mood.id);
                            return (
                                <button
                                    key={mood.id}
                                    className={`pad-btn ${active ? 'active' : ''}`}
                                    onClick={() => onTriggerKey(mood.id, 'mood')}
                                >
                                    <span className="emoji">{mood.emoji}</span>
                                    <span className="label">{mood.name}</span>
                                    <span className="sub">{mood.key}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {currentTab === 4 && (
                    <div className="gaze-grid">
                        {GAZE_POSITIONS.map((pos) => (
                            <button
                                key={pos.label}
                                className="gaze-btn"
                                onClick={() => onSetGaze(pos.x, pos.y)}
                            >
                                {pos.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="pad-hint">
                💡 提示：在上方舞台直接滑动/点击可自由引导视线；点击按钮即时变表情，录制中同样生效！
            </div>
        </div>
    );
}
