# 皮肤工作台 · 当前开发手册

基线：0.7.0 / 2026-10-25。当前鲸鱼娘已接入正式网站和 Toy；此子项目是**美术/运动检查工具**，不是第二套产品 UI。

主入口目前固定鲸鱼娘。`capture --skin miku` 虽然保留参数，`main.jsx` 当前固定 `skin='whale'`，不应据此声称截到了初音；初音/鲸鱼娘运动对照可查看 `physics-compare.html`，正式角色切换用 3000。

## 启动与入口

```sh
# 仓库根目录；父项目依赖也应先安装
npm --prefix skin-lab install
npm --prefix skin-lab run dev
```

- [工具界面](http://127.0.0.1:3010/)
- [纯左右对比](http://127.0.0.1:3010/?clean=1&neutral=1&capture=1&yaw=0)
- [头部放大](http://127.0.0.1:3010/?clean=1&neutral=1&capture=1&yaw=0&focus=head)
- [前发标绿](http://127.0.0.1:3010/?clean=1&neutral=1&capture=1&yaw=0&crop=210,180,690,630&hairDebug=front)
- [后发标绿](http://127.0.0.1:3010/?clean=1&neutral=1&capture=1&yaw=0&hairDebug=back)
- [原版/鲸鱼娘物理对照](http://127.0.0.1:3010/physics-compare.html)
- [表情素材对照](http://127.0.0.1:3010/expressions.html)

绿色是检查滤镜，不写回母版，也不进入正式皮肤颜色。

## 必须分开的两种截图

### 外观：固定初始中性位

左边当前模型，右边原始参考图；紧邻、相同源坐标裁剪，不含工具面板。显式使用 `neutral=1`、`yaw=0`，避免用户鼠标和预览透视干扰。

```sh
# 在仓库根目录运行
node skin-lab/scripts/capture.mjs --focus head --yaw 0 --out skin-lab/screenshots/head-review
node skin-lab/scripts/capture.mjs --crop 210,180,690,630 --out skin-lab/screenshots/front-hair-review
node skin-lab/scripts/capture.mjs --crop 215,460,220,340 --out skin-lab/screenshots/left-lock-review
node skin-lab/scripts/capture.mjs --focus head --hair-debug front --out skin-lab/screenshots/front-selection
node skin-lab/scripts/capture.mjs --focus hair --hair-debug back --out skin-lab/screenshots/back-selection
node skin-lab/scripts/capture.mjs --focus face --hide head.bangs.L,head.bangs.R --out skin-lab/screenshots/face-isolated
node skin-lab/scripts/capture.mjs --help
```

`focus` 预设在 `src/comparisonView.js`：face、head、headdress、ahoge、bow、apron、emblem、hands、leftHand、rightHand、legs、hair、leftHair、rightHair、skirt、tail。

`crop=x,y,w,h` 使用 **1254×1254 母版坐标**；`--zoom` 允许 0～12 内的正数；`--hide` 仅隐藏左侧模型路径。默认中性位截图直接绘制静止 SVG，使局部放大不受 Canvas 低分辨率影响。

### 动作：显式启用模拟

```sh
node skin-lab/scripts/capture.mjs --motion --scenario stop --frames 110 --out skin-lab/screenshots/turn-stop
node skin-lab/scripts/capture.mjs --motion --frames 90 --out skin-lab/screenshots/moving
node skin-lab/scripts/capture.mjs --pose left --out skin-lab/screenshots/look-left
node skin-lab/scripts/capture.mjs --all --out skin-lab/screenshots/nine-directions
```

默认中心截图是冻结初始位；`--motion` 或非中心 `--pose` 才推进模拟。模拟截图按固定 1/60 秒步长运行，`--frames` 决定定格时刻。不要把 `capture=1` 一概解释为“默认模拟 90 帧”。

动态使用 Canvas 网格检查路径；正式 GPU 显示与手机 FPS 要回 3000 检查。

## 美术与骨架生产链

```text
public/assets/whale-girl.png       参考依据
                ↓
art/source/whale-master.svg       可编辑分层母版，1254×1254
                ↓ art:export
art/rig/anchors.json              静态完整矩阵与锚点
art/rig/parts.json                节点 → 图层 → 导出矩阵
art/generated/*.svg              独立矢量图层/表情
src/whale/resources.js            生成的 data URL 资源表
                ↓
src/model.js                     绑定部件与树层级
                ↓
../src/whaleGirlModel.js          正式舞台接入和呈现尺寸
```

```sh
# 常规母版编辑后执行
npm --prefix skin-lab run art:export

# 然后拍中性图、动态图，检查正式页面
node skin-lab/scripts/verify-neutral.mjs
node scripts/verify-pinned-fringe.mjs
```

后一个测试依赖 3000；报告目录首次可执行 `mkdir -p release/toy` 创建。

### 哪些文件负责什么

| 文件 | 职责 |
| --- | --- |
| `src/model.js` | 资源绑定、绘制顺序、虚拟/显示代理 |
| `src/whale/rig.js` | 几何、关节位置、角色动作范围 |
| `src/whale/hairTopology.js` | 后发/侧发根部和变形区域 |
| `src/whale/secondaryMotion.js` | 120Hz 二级运动、网格、手臂约束 |
| `src/SkinPart.jsx` | 标绿、隐藏、静止矢量与动态网格显示 |
| `scripts/export-parts.mjs` | 静态矩阵导出、归一化支点、裁剪 defs 依赖 |
| `scripts/capture.mjs` | 参数化真实浏览器截图 |
| `scripts/redraw-front-hair.mjs` | 本轮前发重绘配方，会替换相关母版图层 |

### 避免重复覆盖美术

正常流程是改母版 → `art:export`。以下脚本是阶段性重建/迁移配方，不作为每次导出的前置步骤：

- `create-master.py`
- `rebuild-rear-hair.mjs`
- `refine-front-details.mjs`、`refine-head-vectors.mjs`
- `apply-hair-layer-pass.py`、`split-rear-hair.mjs`
- `redraw-front-hair.mjs`、其他 `refine-*.mjs`

确需运行时先阅读替换范围、备份当前母版，运行后复查差异。图层名、节点路径与 `<!-- /part -->` 标记是导出协议的一部分；改名后同步导出器和绑定。

## 当前状态与验收边界

见 [STATUS.md](STATUS.md)。旧版“尚未集成正式应用”“仅输出一个表情”“52/54 个节点”等说法已移到历史档案，不作为当前事实。

`model:export` 保留为历史单文件模型导出工具；当前发行包走正式宿主的 `createSecondaryMotion` 钩子。单文件导入结果需单独检查，文件生成成功本身不足以认定与当前 Toy 等价。
