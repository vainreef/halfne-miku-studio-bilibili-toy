// 表情、口型与动作的常量定义及中文对照

export const EYE_TYPES = [
    { id: 'EyeHappy', key: '1', name: '开心', emoji: '😊', desc: '弯弯眯眼微笑' },
    { id: 'EyeJaded', key: '2', name: '鄙视', emoji: '😒', desc: '半睁冷淡鄙夷' },
    { id: 'EyeO_O', key: '3', name: '呆萌', emoji: '😳', desc: '圆圆睁大眼睛' },
    { id: 'Eye*_*', key: '4', name: '星星眼', emoji: '🤩', desc: '闪亮高光眨眼' },
    { id: 'Eye@_@', key: '5', name: '晕晕眼', emoji: '😵‍💫', desc: '蚊香圈螺旋晕厥' },
    { id: 'EyeSideGlance', key: '6', name: '斜睨', emoji: '😏', desc: '侧目偷看瞥视' },
    { id: 'EyeEheh', key: '7', name: '坏笑', emoji: '😈', desc: '小恶魔狡黠使坏' },
    { id: 'EyePumped', key: '8', name: '热血', emoji: '😤', desc: '眼神坚定斗志燃' },
];

export const MOUTH_SHAPES = [
    { id: 'MouthMM', key: '', name: '闭嘴', phonetic: 'M/自然', desc: '自然闭合' },
    { id: 'MouthAA', key: 'a', name: '啊 (A)', phonetic: '啊~', desc: '大开口元音' },
    { id: 'MouthEE', key: 'd', name: '一 (E)', phonetic: '一~', desc: '横向咧开' },
    { id: 'MouthOO', key: 'w', name: '呜 (U)', phonetic: '呜~', desc: '圆拢小口' },
    { id: 'MouthEH', key: 's', name: '诶 (EH)', phonetic: '诶~', desc: '半开元音' },
    { id: 'MouthOH', key: 'e', name: '喔 (O)', phonetic: '喔~', desc: '圆形大张口' },
    { id: 'MouthTeeth', key: 'q', name: '咬牙', phonetic: '龇牙', desc: '露出牙齿' },
];

export const MOOD_TYPES = [
    { id: 'MouthHappy', key: 'F1', name: '微笑', emoji: '😄', desc: '开心扬角' },
    { id: 'MouthNeutral', key: 'F2', name: '平静', emoji: '😐', desc: '平直自然' },
    { id: 'MouthCat', key: 'F3', name: '猫咪嘴', emoji: '🐱', desc: ':3 萌系三阶嘴' },
    { id: 'MouthAngry', key: 'F4', name: '生气', emoji: '😠', desc: '嘴角下弯气愤' },
    { id: 'MouthPout', key: 'F5', name: '嘟嘴', emoji: '😚', desc: '嘟嘴傲娇委屈' },
    { id: 'MouthDrool', key: 'F6', name: '流口水', emoji: '🤤', desc: '馋嘴滴口水' },
    { id: 'MouthDuck', key: 'F7', name: '鸭子嘴', emoji: '🦆', desc: '扁扁鸭嘴' },
    { id: 'MouthTongue', key: 'F8', name: '吐舌头', emoji: '😝', desc: '调皮吐舌卖萌' },
];

export const PRESET_COMBOS = [
    {
        name: '超开心',
        emoji: '🌟',
        keys: ['EyeHappy', 'MouthHappy', 'MouthAA'],
        desc: '笑颜开怀大唱'
    },
    {
        name: '猫猫卖萌',
        emoji: '🐾',
        keys: ['EyeO_O', 'MouthCat', 'MouthOO'],
        desc: '睁圆大眼猫猫嘴'
    },
    {
        name: '傲娇气鼓',
        emoji: '💢',
        keys: ['EyeJaded', 'MouthAngry', 'MouthPout'],
        desc: '不理你的鄙视嘟嘴'
    },
    {
        name: '使坏搞怪',
        emoji: '😜',
        keys: ['EyeEheh', 'MouthTongue'],
        desc: '恶作剧狡黠吐舌'
    },
    {
        name: '晕头转向',
        emoji: '🌀',
        keys: ['Eye@_@', 'MouthDrool'],
        desc: '眼冒金星流口水'
    },
    {
        name: '热血高燃',
        emoji: '🔥',
        keys: ['EyePumped', 'MouthAngry', 'MouthAA'],
        desc: '燃起斗志大声呐喊'
    },
    {
        name: '俏皮眨眼',
        emoji: '😉',
        keys: ['EyeBlink', 'MouthHappy', 'MouthEE'],
        desc: '闭眼抿嘴微笑'
    },
    {
        name: '呆萌发呆',
        emoji: '💭',
        keys: ['EyeO_O', 'MouthNeutral', 'MouthOO'],
        desc: '圆圆眼睛发呆'
    },
];

export const BACKGROUND_NAMES = {
    bg1: '霓虹舞台 (粉紫)',
    bg2: '深邃落日 (晚霞)',
    bg3: '晴空万里 (蓝天)',
    bg4: '粉樱花语 (梦幻)',
    bg5: '经典复古 (怀旧)',
    bg6: '暖阳黄昏 (夕照)',
    bg7: '碧蓝光芒 (青空)',
};

export const GAZE_POSITIONS = [
    { label: '↖ 左上', x: 200, y: 150 },
    { label: '↑ 向上', x: 400, y: 120 },
    { label: '↗ 右上', x: 600, y: 150 },
    { label: '← 左看', x: 180, y: 300 },
    { label: '● 正视', x: 400, y: 300 },
    { label: '→ 右看', x: 620, y: 300 },
    { label: '↙ 左下', x: 220, y: 460 },
    { label: '↓ 俯视', x: 400, y: 480 },
    { label: '↘ 右下', x: 580, y: 460 },
];
