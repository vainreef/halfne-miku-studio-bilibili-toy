# 验证与性能测量

基线：0.7.0 / 2026-10-25。**通过某个历史报告不代表当前分支已经验收。** 记录命令、源码版本/工作区、构建 releaseID、设备/视口、截图和测试结果。

## 环境

```sh
npm ci
npm --prefix skin-lab install
mkdir -p release/toy
```

浏览器脚本依赖已安装的 Google Chrome。先运行所需开发服务；一些测试使用固定的开发模块路径，改 `homepage` 后需要同步这些路径。

## 当前优先使用的命令

| 命令（仓库根目录） | 前置条件 | 覆盖范围 |
| --- | --- | --- |
| `npm run build` | 根依赖已安装 | 网站构建，不验证 UI/动作 |
| `npm run build:toy` | 根依赖已安装 | Toy 构建，不验证实际容器 |
| `npm run verify:runtime` | 3000 服务、报告目录 | 原求值器/编译求值器数值对照、快照不可变性；使用当前二级运动 |
| `npm run verify:unified` | 默认 3000 服务、报告目录 | 两角色、1～4 倍屏、GPU/DOM 画面、角色切换、上下文回退 |
| `node scripts/verify-pinned-fringe.mjs` | 3000 服务、报告目录 | 刘海固定带无偏移、发梢仍运动 |
| `node scripts/verify-hair-order.mjs` | 3000 服务、报告目录 | 发束/手臂顺序、求值数值、DOM/GPU 加载与转头冒烟 |
| `node skin-lab/scripts/verify-neutral.mjs` | 3010 服务 | 中性位鼠标/键盘免疫、像素与重载一致 |
| `npm --prefix skin-lab run rig:validate` | 根与子项目依赖 | 骨架、素材、数值约束；重构后检查旧硬编码断言是否仍适用 |
| `npm --prefix skin-lab run build` | 根与子项目依赖 | 工作台构建，输出 `skin-lab/dist/` |

常用最小组合：

```sh
# 在其他终端启动 3000；美术工作另启动 3010
mkdir -p release/toy
npm run build
npm run verify:runtime
npm run verify:unified
node scripts/verify-pinned-fringe.mjs
# 改了美术时额外执行
node skin-lab/scripts/verify-neutral.mjs
```

`verify:unified` 可用 `RENDER_TEST_URL` 指向生产预览，例如一个静态服务提供的 `http://127.0.0.1:3038/index.html`。传入地址不要自带查询参数，脚本会追加角色/渲染器参数。

`verify:runtime` 验证“当前物理 + 两种求值器一致”，不是承诺鲸鱼娘仍与 0.3.0 运动拓扑相同。经典初音的源模型参数另外检查 `git diff -- src/defaultModel.js`。

## 0.7.0 UI 验收清单

当前轻量 UI 与 0.4/0.5 的旧测试选择器不同。对照源码与真实浏览器检查：

- [ ] 顶部仅头像、FPS、菜单；没有额外眼睛/嘴巴开关。
- [ ] 闭眼/睁眼按钮全页仅一处，位于 `.bottom-workspace .pad-eye-toggle`。
- [ ] 按钮是操控卡片的兄弟节点，整个卡片右上角透明挖空，不是只裁分类条。
- [ ] 四分类点击、左右手势、选中态同步；眼神页无单独“闭眼”条目。
- [ ] 四页挂载在横向分页器内；统计当前按钮应限定 `aria-hidden=false` 的页面，别把四页全部当当前页。
- [ ] 默认眼睛按钮 aria-label 为“闭眼”，切换后为“睁眼”；组合表情包含 EyeBlink 时状态一致。
- [ ] 两套头像去掉多余取景空白，大肥鱼头像无鳍耳；真实模型仍保留装饰。
- [ ] 280×568、320×568、390×844、430×932，以及手机横屏。
- [ ] `.App.scrollHeight <= clientHeight`、`scrollWidth <= clientWidth`，卡片内容无截断。
- [ ] 菜单背景/设置/保存分页、关闭/点击遮罩、焦点回到原入口。
- [ ] 切换角色/背景、偏好持久化、恢复姿态。
- [ ] PNG 非空；Toy 相册/分享分别检查支持、成功、错误反馈。

UI 结构参考：[开发约定](DEVELOPMENT.md#界面约定)。

## 历史脚本与过时断言

这些脚本留作参考；其存在不表示兼容当前 UI：

| 脚本/别名 | 需要注意 |
| --- | --- |
| `verify-mobile-ui.mjs` | 仍有旧顶部按钮数、144px 缩略图、眼神内闭眼、未分页菜单等断言；0.7 使用 288px 图和分页面板 |
| `verify-mobile-gpu.mjs` / `npm run verify:mobile` | 旧 11 网格、旧按钮名、旧像素预算；当前 14 网格/原生 DPR |
| `verify-toy.mjs` / `npm run verify:toy` | 保留旧编辑器/导出界面的选择器，当前 App 不挂载该界面 |
| `verify-live-mobile.mjs` | 旧线上 URL、皮肤按钮文字和渲染分支假设 |
| `benchmark-runtime.mjs` | 专门与历史 0.3.0 构建做配对比较，依赖本地 baseline，不是任意最新版本的通用性能测试 |
| 历史美术/表达式脚本 | 部分按旧节点数或固定脸阶段编写；先看当前状态与脚本实际断言 |

改测试时保留原测试意图，明确更新的是产品约定还是回归标准；避免为“全绿”删掉画面、性能和动态检查。

0.7.0 发布前的 UI 冒烟是一次性生产浏览器检查，结果在 `release/toy/light-ui-070-verification.json`；该报告不是可重跑脚本。维护成独立当前 UI 测试脚本是后续工程项，别将旧 `verify-mobile-ui.mjs` 写成已完整适配。

## 性能测量

```sh
# 先生成最新 Toy 构建
npm run build:toy
MOBILE_CPU_RATES=6,12 npm run benchmark:mobile
```

脚本启动 3033 静态服务，依次测初音/鲸鱼娘的统一 GPU 路径；390×844、DPR=3、持续相同输入轨迹，每组约 5 秒。结果：`release/toy/unified-mobile-performance.json`。

报告区分：

- `fps`：`.miku.__renderFrameCount` 的实际绘制增量 / 同一个采样时间窗。
- `rafFps` / `rafP95Ms`：输入/RAF 调度频率与间隔，不偷换成实际 FPS。
- `scriptMs` / `layoutMs` / `taskMs`：CDP 性能指标增量。
- 画布像素、提交次数、纹理占用、网格数：判断优化是否靠牺牲清晰度实现。

0.6.0 的桌面 Chrome CPU 限速 6/12 倍记录中，两角色均为 60 FPS。这不是实体手机的 Bilibili App 成绩，0.7 布局更改后也应重新测量。

对比前后版本时保持同一设备、分辨率/DPR、输入轨迹、热状态与测量窗口；不要将某次最高值当总体提升。实体手机还要检查 WebView/GPU、发热、前后台切换和 SDK 容器开销。
