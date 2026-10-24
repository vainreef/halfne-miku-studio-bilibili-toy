# 开发文档导航

基线：**0.7.0，2026-10-25**。当前事实来自源码与构建产物；历史阶段记录集中在 [history/](history/)。

## 按任务阅读

| 要做什么 | 先读 | 主要编辑位置 |
| --- | --- | --- |
| 启动并接手项目 | [根 README](../README.md)、[开发流程](DEVELOPMENT.md) | `src/App.js` |
| 改手机界面 | [开发流程 / UI](DEVELOPMENT.md#界面约定) | `App.less`、`QuickPad`、`Stage`、`ToyMenu` |
| 修复卡顿或模糊 | [架构 / 渲染](ARCHITECTURE.md#统一渲染与高清策略)、[测试](TESTING.md) | `GpuCharacter.jsx`、`compiledModel.js` |
| 改头发、脸型、衣服 | [皮肤工作台](../skin-lab/README.md) | `whale-master.svg`、`model.js` |
| 改锚点、局部运动 | [架构 / 坐标与物理](ARCHITECTURE.md#模型坐标与物理) | `rig.js`、`secondaryMotion.js` |
| 更新角色头像/表情按钮图 | [开发流程 / UI 素材](DEVELOPMENT.md#头像与表情按钮素材) | `scripts/generate-ui-faces.mjs` |
| 发网站和 Toy 包 | [发布流程](RELEASE.md) | `package.json`、`build-release.mjs` |
| 判断旧脚本还能否使用 | [测试适用范围](TESTING.md#历史脚本与过时断言) | `scripts/` |

## 接手时先确认

1. `package.json` 版本和本次工作目标。
2. `src/App.js` 是当前简化 Toy 入口；`Controls` 文件存在不代表它仍是产品功能。
3. 正式页面 3000、皮肤工作台 3010、Toy 开发模式 3020，各有不同用途。
4. 参考图是 `public/assets/whale-girl.png`；视觉对比固定中性位、统一裁剪、左模型右原图。
5. `build*`、`release/` 与测试截图属于产物；源码改动应落在 `src/`、母版或生成脚本。
6. 发布前以最新 `release.json` 和实际 ZIP 为准，旧报告有自己的版本/环境边界。

工程协作约定另见根目录 [AGENTS.md](../AGENTS.md)。
