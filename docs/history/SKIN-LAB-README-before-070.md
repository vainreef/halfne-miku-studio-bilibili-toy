# 皮肤工作台

独立的 Vite 子项目，只加载 Halfne 原生模型、物理和部件渲染器，不加载正式 App、时间轴或制作室 UI。

## 启动

在仓库根目录：

```sh
npm --prefix skin-lab install
npm --prefix skin-lab run dev
```

浏览器打开 http://127.0.0.1:3010/ 。修改模型和 SVG 后即时刷新。父项目依赖也需已安装（仓库根目录 `npm install`）。

## 纯对比截图

保持预览服务运行，在仓库根目录执行：

```sh
npm --prefix skin-lab run capture
```

默认图片：**左边当前模型，右边鲸鱼娘参考图**。相邻画布、同一背景、按人物内容等高，不含任何标题、控件或调试信息。结果放在本目录 `screenshots/`。

```sh
# 九个固定视线姿态
npm --prefix skin-lab run capture -- --all
# 右看、闭眼、指定表情
npm --prefix skin-lab run capture -- --pose right --eye jaded --mouth tongue --phoneme 2 --blink
# 静态物理 / 经典初音基线
npm --prefix skin-lab run capture -- --physics 0 --skin miku
# 只有主动指定 --ui 才截整个工作台
npm --prefix skin-lab run capture -- --ui --view overlay --rig
# 浏览器自动检查
npm --prefix skin-lab run verify
```

截图脚本使用已安装的 Google Chrome，无需额外下载浏览器。默认固定 90 个 1/60 秒模拟步之后定格；等待 SVG 和参考图加载完成后截图，方便比较前后变化。它截取真实浏览器渲染结果，不覆盖或伪造模型素材。

纯对比浏览器地址：http://127.0.0.1:3010/?clean=1 。可附加 `pose=left`、`physics=0`、`eye=jaded`、`mouth=cat`、`phoneme=2` 等参数；`capture=1` 会在固定模拟步后定格。

## 开发入口

- `src/model.js`：独立鲸鱼娘开发模型入口，验收后再接正式演播室。
- `src/main.jsx`：预览循环、方向、8 种眼神 × 睁闭眼、8 种嘴部 × 7 口型、关节显示、参考叠图和静态 SVG 下载。
- `src/style.css`：工作台与纯对比画布样式。
- `scripts/capture.mjs`：可重复截图。
- `scripts/verify.mjs`：模型加载、姿态、表情、切换、定格、叠图、下载、移动视口检查。
- `../src/Engine/`、`../src/Miku/Part.jsx`：直接复用正式项目的物理和渲染实现，没有复制或修改引擎。
- `../public/assets/whale-girl.png`：原始参考图。

当前已制作鲸鱼娘独立分层首版；正式演播室维持原状态。工作台测试全部 16 个眼睛与 56 个嘴部状态，素材细节继续按纯对比截图验收。

`npm --prefix skin-lab run build` 的输出仅在本目录 `dist/`，不覆盖正式项目构建。

## 当前鲸鱼娘模型（已实现）

开发入口已切换为本子项目独立鲸鱼娘模型。

- `src/model.js`：鲸鱼娘工厂与资源绑定，未替换正式演播室的模型入口。
- `src/whale/rig.js`：几何适配与独立鲸尾；既有物理参数保留。
- `src/whale/baseRig.js`：从初音提取的独立骨架工厂；每次创建模型都有独立闭包。
- `art/source/whale-master.svg`：1254 × 1254 的可编辑矢量母版，对齐原始参考坐标。
- `art/rig/anchors.json`：52 个节点的静态完整仿射矩阵与关节坐标。
- `art/rig/parts.json`：102 个部件/状态的映射与导出矩阵。
- `art/generated/`：独立 SVG；包含 16 个眼睛状态、56 个嘴部状态。
- `art/generated/whale-model.js`：可通过原版模型导入器加载的单文件模型，已测试原 `parseModelJS()`。
- `screenshots/current/`：九个视线姿态的纯对比图。
- `screenshots/motion/`：连续运动中间帧对比。

```sh
# 母版编辑后：自动更新锚点、导出每个 SVG、更新资源表
npm --prefix skin-lab run art:export
# 骨架参数 / 几何重建 / 1500 帧压力测试 / SVG XML 校验
npm --prefix skin-lab run rig:validate
# 完整浏览器功能检查
npm --prefix skin-lab run verify
# 单文件模型发行版
npm --prefix skin-lab run model:export
# 九方向纯对比图
npm --prefix skin-lab run capture -- --all --out screenshots/current
# 动态中间帧，固定时间步以便重复比较
npm --prefix skin-lab run capture -- --motion --frames 45 --out screenshots/motion
```

母版使用原始参考图坐标。导出时先将其缩放到模型坐标，再乘以节点静态完整变换的逆矩阵，最后移至资源中心 `(400,300)`。这样同时消除静态旋转、缩放与父子变换，而非逐张手动试坐标。`create-master.py` 只用于重建最初的矢量绘稿；正常编辑应改 SVG 母版并执行 `art:export`，避免覆盖手工修改。

视觉验收状态和已知差异见 `STATUS.md`。当前首版验证的是独立皮肤模型，正式 App 的录制界面与 GIF/PNG ZIP 导出尚未进行这版角色的集成验收。

### 轻微侧向透视试验
纯对比页默认鲸鱼娘使用 `yaw=-12`（预览层 CSS perspective/rotateY），仅用于检查朝向，不改骨骼、锚点或阻尼，也不代表真正三维转头。
- 对比：`http://127.0.0.1:3010/?clean=1&yaw=-12`
- 原始平面：`http://127.0.0.1:3010/?clean=1&yaw=0`
- 截图：`npm run capture -- --yaw -12 --out screenshots/yaw-left12`
参考图的右侧耳部暴露、面部偏左与发量不对称仍需各图层单独适配，整体平面透视仅是可撤销试验。

## 第二轮运动结构（以 STATUS.md 为当前事实）
此前“所有原物理参数保留”的记录属于第一版历史。当前已针对鲸鱼娘移除七个不适配的单点摆锤，经典初音源码仍未改变。

- 急转测试：`http://127.0.0.1:3010/?clean=1&motion=1&scenario=stop`
- 连续摆动：`http://127.0.0.1:3010/?clean=1&motion=1`
- 网格检查：`http://127.0.0.1:3010/?rig=1&motion=1`
- 重复测试：`npm run rig:validate && npm run verify`
- 动作视频：`npm run record:motion`
- 急转截图：`npm run capture -- --motion --scenario stop --frames 110 --out screenshots/rig-v2/abrupt`
- 停止截图：`npm run capture -- --motion --scenario stop --frames 420 --out screenshots/rig-v2/settled`

母版已有手工结构修改，`create-master.py` 是早期草稿生成器，重新运行会覆盖这些修改。请直接修改 `art/source/whale-master.svg`，然后 `npm run art:export`。

新求解器的宿主接入要求见 STATUS.md；模型导入检查与完整动态验收分开统计。

## 局部放大对照截图

两侧共用 1254×1254 母版坐标，同一区域、同一倍率；左模型、右原图，紧邻且无 UI。
裁剪区域决定截图高度，脸部截图不会把整个人和大片空白一起带上。

```sh
# 在项目根目录运行。放大检查时 yaw 0 避免预览透视干扰形状对齐。
node skin-lab/scripts/capture.mjs --focus face --yaw 0
node skin-lab/scripts/capture.mjs --focus headdress --yaw 0
node skin-lab/scripts/capture.mjs --focus emblem --zoom 1.3 --yaw 0
node skin-lab/scripts/capture.mjs --focus legs --yaw 0
# 自定义区域：母版像素 x,y,宽,高；不是浏览器屏幕坐标。
node skin-lab/scripts/capture.mjs --crop 390,805,330,100 --yaw 0
# 隐藏模型图层，物理照常运行；静态参考 PNG 保持原图。
node skin-lab/scripts/capture.mjs --focus face --hide head.bangs,head.momiL,head.momiR --yaw 0
# 也可叠加既有运动截图参数。
node skin-lab/scripts/capture.mjs --focus hair --motion --scenario circle --frames 90
node skin-lab/scripts/capture.mjs --help
```

`--focus`：`face`、`head`、`headdress`、`ahoge`、`bow`、`apron`、`emblem`、
`hands`、`leftHand`、`rightHand`、`legs`、`hair`、`leftHair`、`rightHair`、`skirt`、`tail`。
`--crop` 优先于预设区域。`--zoom` 是在区域自动放大基础上继续乘的倍率。
`--hide` 使用模型完整节点路径（逗号分隔），隐藏父节点会连同子节点隐藏。
文件名自动附加区域与倍率；报告记录完整 URL、裁剪坐标、倍率、隐藏路径。

浏览器直接预览：
- `http://127.0.0.1:3010/?clean=1&focus=face&yaw=0`
- `http://127.0.0.1:3010/?clean=1&focus=headdress&yaw=0`
- `http://127.0.0.1:3010/?clean=1&crop=390,805,330,100&yaw=0`

正式形状检查先保持 `--zoom 1 --yaw 0`；检查细节再增大倍率，观察空间效果再恢复 yaw。

### 截图中性位锁定

默认外观截图现在直接使用 `parseConfig + getInitPhysics` 的初始姿态，冻结物理时间，
并锁定输入；不再先模拟 90 帧作为外观基准。默认截图 yaw 为 0，两侧便于几何对齐。
报告中的 `captureMode: neutral-initial` 表示锁定生效。
仅显式 `--motion` 或 `--pose left/right/...` 才运行姿态/动态测试。
浏览器可用 `?clean=1&neutral=1&focus=face&yaw=0` 查看同样的固定中性位。
验证：`node skin-lab/scripts/verify-neutral.mjs`，检查鼠标/键盘前后像素、节点和刷新一致性。
