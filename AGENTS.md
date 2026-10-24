# 项目开发约定

适用于本仓库。先阅读 `README.md`、`docs/README.md`，再按任务阅读架构、测试或皮肤工作流；尊重用户当前任务与已有未提交改动。

## 当前产品边界

- 0.7.0 起为白色轻量手机 Toy，不是旧制作室。
- 顶部仅头像、FPS、菜单。睁闭眼只在下方操控面板右侧。
- 四分类横向滑动；整个面板右上角挖空、圆按钮独立且水平对齐。
- 常见手机视口避免整页上下滚动；嵌套布局检查 min-width/min-height 和真实 scroll 尺寸。
- 时间轴、录制、复杂参数编辑、旧键盘工作流仍有历史文件，但当前 App 未导入。不要意外重新接入。

## 运行与修改入口

- 用户界面：`npm run dev`，3000 `/halfne-studio-bilibili-toy/`。
- 皮肤工具：`npm --prefix skin-lab run dev`，3010。
- Toy 模式：`npm run dev:toy`，3020；相对资源路径。
- 经典初音源模型 `src/defaultModel.js` 保持原有行为；鲸鱼娘使用独立工厂与二级运动。
- 两角色默认共用 `GpuCharacter.jsx`、`compiledModel.js`、`frameChannel.js`；DOM/Canvas 是兼容路径。

## 美术规则

- 母版：`skin-lab/art/source/whale-master.svg`；参考图：`public/assets/whale-girl.png`。
- 正常流程：编辑母版 → `npm --prefix skin-lab run art:export` → 截图对照。
- 不直接编辑生成的 resources/data URL；重建/迁移脚本会覆盖美术，先读范围、备份再运行。
- 外观截图锁定初始中性位、yaw=0，左模型右参考紧邻；局部看不清用 focus/crop 放大。
- `hairDebug=front/back` 是调试选择滤镜，不写回素材颜色。
- 先检查锚点、完整矩阵、闭合边和遮挡；不要靠无依据改阻尼掩盖几何问题。
- 不把整个 head 置顶解决一两束头发；前卷发根部与发梢有不同遮挡关系。
- 刘海源坐标 y≤300 为固定带；检查实际网格行和源顶点无位移。
- 头像是 UI 素材：取景/鳍耳裁除只改头像，不改角色本体。

## 性能规则

- 不恢复低 DPR、低清纹理等画质降级来宣称优化。
- 统计实际绘制/commit；RAF 频率另列。
- 保留求值器同步依赖轮次；复用树进入 React 前快照；坐标缓存只在只读轮次使用。
- 角色切换和回退检查 GL 资源释放，避免积累多个画布/上下文。
- 桌面 CPU 限速、浏览器手机视口、实体 Bilibili App 测试分别报告。

## 验证与发布

- 先看 `docs/TESTING.md`：一些旧脚本还硬编码 11 网格、旧按钮/制作室界面，别把旧测试名称当成现行验收。
- 按修改范围做构建、真实浏览器检查与截图；编译通过不等于视觉/动作正确。
- 构建/报告目录 `build/`、`build-toy/`、`release/` 忽略入库；不手改 bundle。
- 发布按 `docs/RELEASE.md`。同一次 `npm run release` 给网站和 Toy 生成共享 releaseID。
- 桌面包必须有清楚版本号，旧包归档；网站上传与 Bilibili 提交分别确认。
- 仅文档更新无需重发应用；不要自动覆盖线上、清理用户改动或提交代码。
- 功能/结构发生变化时同步更新入口 README、对应开发文档与测试断言。
