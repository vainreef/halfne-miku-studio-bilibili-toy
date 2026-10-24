/** Validate the existing recording format before it reaches timeline/physics code. */
export function validateRecording(value) {
    if (!Array.isArray(value) || value.length > 256) throw Error('动作文件应为图层数组（最多 256 层）');
    let total = 0;
    return value.map((entry, index) => {
        const layer = Array.isArray(entry) ? { a: entry } : entry;
        if (!layer || !Array.isArray(layer.a)) throw Error(`第 ${index + 1} 层缺少动作列表`);
        total += layer.a.length;
        if (total > 200000) throw Error('动作节点过多，请拆分文件');
        let previous = -1;
        for (const node of layer.a) {
            if (!node || !Number.isFinite(node.t) || node.t < 0 || node.t < previous) throw Error('动作时间应为递增的非负毫秒数');
            previous = node.t;
            const c = node.c;
            if (!c || typeof c !== 'object' || Array.isArray(c)) throw Error('动作节点缺少控制数据');
            for (const key of ['mouseX', 'mouseY']) {
                if (c[key] !== undefined && !Number.isFinite(c[key])) throw Error('动作坐标格式有误');
            }
            if (c.keyInput !== undefined && (!Array.isArray(c.keyInput) || c.keyInput.some(k => typeof k !== 'string'))) throw Error('动作按键应为文字数组');
        }
        return layer;
    });
}
