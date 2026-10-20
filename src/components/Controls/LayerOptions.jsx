import React, { useMemo } from 'react';
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import Close from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CopyAll from "@mui/icons-material/CopyAll";
import Timer from "@mui/icons-material/Timer";
import ContentCut from "@mui/icons-material/ContentCut";
import Lock from "@mui/icons-material/Lock";
import LockOpen from "@mui/icons-material/LockOpen";

export default function LayerOptions({
    layerData,
    i,
    recordLength,
    setRecord,
    editorTimestampRef,
    setLayer
}) {
    const { l = false, v = true } = layerData;

    return useMemo(() => (
        <div className='timeline-L-layer-item-options'>
            {!l && i !== recordLength - 1 ? (
                <ArrowUpward
                    titleAccess="上移图层"
                    onClick={(e) => {
                        e.stopPropagation();
                        setRecord(record => {
                            [record[i], record[i + 1]] = [record[i + 1], record[i]];
                            return [...record];
                        });
                    }}
                    fontSize='inherit'
                />
            ) : null}

            {!l && i !== 0 ? (
                <ArrowDownward
                    titleAccess="下移图层"
                    onClick={(e) => {
                        e.stopPropagation();
                        setRecord(record => {
                            [record[i], record[i - 1]] = [record[i - 1], record[i]];
                            return [...record];
                        });
                    }}
                    fontSize='inherit'
                />
            ) : null}

            {!l && (
                v ? (
                    <Visibility
                        titleAccess="隐藏图层"
                        onClick={(e) => {
                            e.stopPropagation();
                            setRecord(record => {
                                record[i].v = false;
                                return [...record];
                            });
                        }}
                        fontSize='inherit'
                    />
                ) : (
                    <VisibilityOff
                        titleAccess="显示图层"
                        onClick={(e) => {
                            e.stopPropagation();
                            setRecord(record => {
                                record[i].v = true;
                                return [...record];
                            });
                        }}
                        fontSize='inherit'
                    />
                )
            )}

            {!l && (
                <CopyAll
                    titleAccess="复制此图层"
                    onClick={(e) => {
                        e.stopPropagation();
                        setRecord(record =>
                            record.reduce((p, o, ii) =>
                                ii === i ? [...p, o, JSON.parse(JSON.stringify(o))] : [...p, o], []
                            )
                        );
                    }}
                    fontSize='inherit'
                />
            )}

            {!l && (
                <ContentCut
                    titleAccess="在当前播放位置剪切图层"
                    onClick={(e) => {
                        e.stopPropagation();
                        setRecord(record => {
                            const layerLeft = record[i].a.filter(o => o.t <= editorTimestampRef.current);
                            const layerRight = record[i].a.filter(o => o.t >= editorTimestampRef.current);
                            if (layerLeft.length === 0 || layerRight.length === 0) return record;
                            return record.reduce((p, o, ii) =>
                                ii === i ? [
                                    ...p,
                                    { ...JSON.parse(JSON.stringify(o)), a: layerLeft },
                                    { ...JSON.parse(JSON.stringify(o)), a: layerRight }
                                ] : [...p, o], []
                            );
                        });
                    }}
                    fontSize='inherit'
                />
            )}

            {!l && (
                <Timer
                    titleAccess="图层整体时间偏移 (平移毫秒)"
                    onClick={(e) => {
                        e.stopPropagation();
                        const delta = +prompt('请输入图层时间整体平移量 (毫秒，正数往后，负数往前):', 0) || 0;
                        if (!delta) return;
                        setRecord(record => {
                            record[i].a = record[i].a.map(o => ({ ...o, t: Math.max(0, o.t + delta) }));
                            return [...record];
                        });
                    }}
                    fontSize='inherit'
                />
            )}

            {!l && (
                <Close
                    titleAccess="删除图层"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定要删除此图层 (${record[i]?.n || `图层 ${i + 1}`}) 吗？`)) {
                            setRecord(record => record.filter((o, ii) => ii !== i));
                            setLayer(undefined);
                        }
                    }}
                    fontSize='inherit'
                />
            )}

            {l ? (
                <Lock
                    titleAccess="已锁定 (点击解锁)"
                    onClick={(e) => {
                        e.stopPropagation();
                        setRecord(record => {
                            record[i].l = false;
                            return [...record];
                        });
                    }}
                    fontSize='inherit'
                />
            ) : (
                <LockOpen
                    titleAccess="未锁定 (点击锁定防误触)"
                    onClick={(e) => {
                        e.stopPropagation();
                        setRecord(record => {
                            record[i].l = true;
                            return [...record];
                        });
                    }}
                    fontSize='inherit'
                />
            )}
        </div>
    ), [editorTimestampRef, i, l, recordLength, setLayer, setRecord, v]);
}
