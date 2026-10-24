# 当前架构

基线：0.7.0 / 2026-10-25。

## 技术栈与目录

React 18 + Vite 6 + Less；角色默认使用原生 WebGL 1。美术源文件是 SVG，局部变形是共享顶点的二维三角网格。没有接入 Live2D、Three.js 或新的通用骨骼框架。

```text
仓库
├── src/
│   ├── App.js                    # 单一实时交互循环、角色、设置、背景
│   ├── App.less                  # 白色主题、固定视口、菜单卡片
│   ├── defaultModel.js           # 经典初音模型与资源
│   ├── whaleGirlModel.js         # 鲸鱼娘接入 + 正式舞台呈现尺寸
│   ├── Engine/
│   │   ├── core.js               # 原模型求值、基础物理、work()
│   │   ├── compiledModel.js      # 预编译求值、复用树、DOM 快照
│   │   ├── modelUtils.js         # 路径、坐标、基础物理辅助
│   │   └── frameChannel.js       # 动画时钟 → 渲染器的同步通道
│   ├── Miku/
│   │   ├── Miku.jsx              # 调度基础物理 + 角色二级运动
│   │   ├── GpuCharacter.jsx      # 两套角色共用的默认渲染器
│   │   ├── Part.jsx              # DOM 兼容渲染
│   │   ├── MeshCanvas.jsx        # 兼容路径的变形图层
│   │   ├── captureStage.js       # GPU / DOM 舞台截图
│   │   └── LiveMesh.jsx          # 历史 SVG 网格实现
│   ├── components/
│   │   ├── Stage/                # 视口测量、顶部头像/FPS/菜单、触摸映射
│   │   ├── QuickPad/             # 四分类横向翻页 + 独立闭眼按钮
│   │   ├── ToyMenu/              # 背景 / 设置 / 保存
│   │   └── Controls/             # 历史编辑器；当前 App 未导入
│   └── platform/
│       ├── toy.js                # SDK 能力检查、相册/下载、持久化
│       └── ToyToolbar.jsx        # 保存/分享/容器状态，菜单隐藏时仍挂载
├── public/assets/
│   ├── whale-girl.png            # 角色参考图
│   └── ui/                       # 生成的无头发表情脸图与头像 PNG
├── skin-lab/
│   ├── art/source/whale-master.svg
│   ├── art/rig/                  # 锚点、部件导出矩阵、检查记录
│   ├── art/generated/            # 生成的独立 SVG
│   ├── src/model.js              # 角色资源、树顺序与代理节点绑定
│   ├── src/whale/
│   │   ├── baseRig.js            # 独立初音骨架工厂
│   │   ├── rig.js                # 鲸鱼娘几何适配
│   │   ├── resources.js          # 生成的 data URL 资源表
│   │   ├── secondaryMotion.js    # 发束/布料/手臂/刘海局部运动
│   │   └── hairTopology.js       # 发束区域和根部定义
│   ├── src/SkinPart.jsx          # 美术检查渲染器
│   └── scripts/                 # 素材导出、截图、检查
├── scripts/                     # 生产构建、打包、测试、性能测量
├── build/                       # 网站输出，忽略入库
├── build-toy/                   # Toy 输出，忽略入库
└── release/toy/                 # ZIP、release 元数据、测试结果
```

## 一帧怎样运行

```text
舞台触摸 → 800×600 逻辑鼠标坐标
                       ↓
App requestAnimationFrame
  输入缓动 + 虚拟按键 → config.parseControl()
                       ↓
frameChannel.publish(control, timestamp)
                       ↓
Miku.advance()
  dt 钳制 → work() 基础物理/预编译求值
           → createSecondaryMotion?.step()
                       ↓
GpuCharacter.render(state)
  完整仿射遍历 → 有序顶点 → 图集批量提交
                       ↓
实际渲染计数 → 每约 500ms 更新 FPS UI
```

`App` 仅每约 250ms 写一次 React 控制快照；动画不是靠每帧重建整个 React 页面推进。初音和鲸鱼娘共享此路径。初音没有 `createSecondaryMotion`，仍直接使用其原始模型物理；鲸鱼娘在基础求值后增加独立局部变形。

### 求值与缓存约束

- `compiledModel.evaluate()` 返回可复用、可变的树。每帧恢复原始字段，再求值。
- 保留旧 `parseConfig()` 的同步依赖轮次：一轮全部函数读取同一轮输入，结果一起写回。随意改成逐个即时写回会改变动画数值。
- DOM 回退使用 `snapshotRenderTree()`，避免 React 持有正在被下一帧改写的节点属性。
- `modelUtils` 的路径索引只对注册的模型启用；绝对位置缓存仅限 `beginModelRead/endModelRead` 的只读轮次。
- 二级运动会改写渲染树，跨轮次复用绝对位置缓存容易读到旧坐标。

## 统一渲染与高清策略

两套角色默认均走 `GpuCharacter.jsx`，不再按“有无鲸鱼娘二级运动”决定渲染器。

1. **裁剪一次**：扫描原始 SVG 的透明边界，保留透明保护边。
2. **高清图块**：按部件完整变换 × 当前画布密度确定所需倍率，向上取 1～4 倍档；直接把矢量画到裁剪图块，避免先画低清图片再放大。
3. **缓存**：解码/边界缓存与不同倍率图块分离，缓存数量受限。
4. **图集**：通常使用 2048×2048 RGBA 图集（16 MiB），max-rect 打包减少空洞。图集装满或精度条件不足时使用独立纹理；因此“一次提交”是常见测试结果，不是所有场景的硬保证。
5. **原生屏幕像素**：画布尺寸依据舞台实际 CSS 大小 × `devicePixelRatio`，再受设备的 renderbuffer 上限约束。不要恢复旧的 DPR=2 或低画布密度上限来换 FPS。
6. **UV 与混合**：采样限制在单图块保护边内，避免图集串色；纹理与混合采用预乘 alpha。
7. **启动尺寸**：舞台初始估计、布局测量与 ResizeObserver 配合，尽早得到实际尺寸，避免先生成一套大纹理又重复生成。
8. **释放**：角色重置/切换卸载时释放 GL 纹理、缓冲、程序、上下文与观察器。

检查画布上的 `data-*`：

| 字段 | 用途 |
| --- | --- |
| `data-renderer=webgl` | 当前确实在 GPU 路径 |
| `data-runtime=compiled-v2` | 预编译求值路径 |
| `data-ready=1` | 当前请求的纹理准备完成 |
| `data-resolution-policy=native-screen-hd-tiles` | 高清策略 |
| `data-pixel-ratio` / `data-render-density` | 屏幕倍率与逻辑画布密度 |
| `data-draw-calls` / `data-texture-bytes` | 提交次数与 GL 纹理占用统计 |
| `data-mesh-count` | 初音通常 0，鲸鱼娘当前 14 |
| `data-hd-tiles` | 已加载的高于 1 倍图块数量 |

调试参数：`?skin=miku`、`?skin=whale`、`?renderer=dom`、`?atlas=0`、`?runtime=legacy`。这些用于对照，不是正式设置入口。WebGL 失败或丢失上下文会切到共同的 DOM/Canvas 兼容路径。

FPS 统计来自实际提交/DOM commit，`.miku.__renderFrameCount` 可用于测试。RAF 回调次数与真实绘制次数分开报告。

## 模型坐标与物理

需要区分五种坐标：

1. **母版坐标**：1254×1254，参考图、部件轮廓、网格区域在此定义。
2. **资源坐标**：独立 SVG 通常 800×600，资源中心 `(400,300)`。
3. **父级局部坐标**：节点 `x/y/rotation/scale`。
4. **舞台逻辑坐标**：800×600，控制输入与截图输出的基础尺寸。
5. **屏幕物理像素**：CSS 缩放后的逻辑尺寸乘 DPR，和模型锚点不是同一个量。

导出链路：母版 → 统一源到根变换 → 逆静态完整父级矩阵 → 资源中心偏移。完整矩阵在 `art/rig/parts.json`；只平移到 `(400,300)` 并不足以适配父级旋转和缩放。

`getAbsolutePos()` 保留历史语义，未累计父级 scale。需要完整仿射矩阵时参考 `secondaryMotion.js` 或 GPU 遍历，不要把它直接当屏幕位置。

### 鲸鱼娘当前结构

- 71 个锚点节点；111 个导出资源项，其中眼睛 16、嘴部 56。资源项数不等于可见部件数。
- 后发 8 组美术，其中 7 组活动网格 + 1 组刚性头皮。
- 2 组前侧卷发、3 组刘海、裙摆与围裙：合计 14 个活动网格。
- 胸前白色领口/蕾丝随身体；胸前领结与裙侧结有局部运动。
- 手臂采用肩/肘/腕约束；裙摆和围裙固定腰线，沿下缘渐进变形。
- 二级运动固定 120Hz 子步长，输入 dt 来自毫秒。

刘海上部（母版 y≤300）固定。保留原弹簧作为驱动信号，移除渲染时整片刚体转动/拉伸，弯曲权重在下半段平滑增加，防止冠部顶出头顶。

绘制顺序与关节父子关系分开理解：后发在衣服后方；前侧卷发代理 `frontLockL/R` 位于手臂上方。完整贴脸轮廓在 `head.bangs`；卷发纹理的隐藏上端有羽化衔接。不要通过把整个 `head` 移到最前方修复两条发束，这会暴露素材闭合边、改变耳部遮挡。

`src/whaleGirlModel.js` 额外做正式舞台的呈现缩放/位移，让经典初音与鲸鱼娘的脚底、主头皮高度对齐；呆毛不计入头皮线。Skin Lab 使用母版坐标对比，不用这个正式舞台尺寸作为美术裁剪基准。

## 网站与 Toy 的边界

同一 React App、模型、资源、渲染器；Vite 按模式生成不同部署适配：

- 网站 base 来自 `package.json.homepage` 的路径。
- Toy base 为 `./`，注入 Toy SDK 脚本。
- `src/platform/toy.js` 只在对应能力可用时调用相册等接口，否则使用浏览器下载。
- `ToyToolbar` 同步 SDK 容器高度与安全区；菜单隐藏时仍维持挂载，以保留容器监听。
- 本地保存了 `halfne-toy-skin`、`halfne-toy-settings`、`halfne-toy-background` 三类偏好。
- 模拟 SDK 调用通过不代表实体 Bilibili App 的权限、相册、分享已验证。
