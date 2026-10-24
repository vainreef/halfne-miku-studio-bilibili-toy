# 小初音工作室 · Bilibili Toy

面向手机的二维角色互动玩具。支持**初音 / 大肥鱼**、触摸跟随、发丝与衣物运动、眼神/口型操作、场景背景、截图保存，以及 Bilibili Toy 容器适配。

**文档基线：0.7.0 / 2026-10-25。** 当前是白色轻量玩具界面；旧制作室、时间轴与录制编辑器留在仓库历史代码中，未接入当前应用入口。

- [在线版本](https://vainreef.com/halfne-studio-bilibili-toy/?v=ui070)
- [开发文档索引](docs/README.md)
- [架构与渲染原理](docs/ARCHITECTURE.md)
- [开发流程与界面约定](docs/DEVELOPMENT.md)
- [皮肤工作台、绘制与截图](skin-lab/README.md)
- [测试命令及适用范围](docs/TESTING.md)
- [打包、同步发布与回滚](docs/RELEASE.md)
- [版本演进](docs/CHANGELOG.md)

## 启动

建议使用 Node.js 20 或更新版本。首次安装：

```sh
npm ci
npm --prefix skin-lab install
```

在两个终端分别启动：

```sh
# 用户界面、真实 GPU 渲染、手机布局
npm run dev
# http://127.0.0.1:3000/halfne-studio-bilibili-toy/
```

```sh
# 美术、锚点、参考图并排对比
npm --prefix skin-lab run dev
# http://127.0.0.1:3010/
```

手机界面开发看 **3000**；角色轮廓和分层检查用 **3010**。两者共享鲸鱼娘模型和素材，但工作台的检查渲染器与正式 GPU 渲染器用途不同。

## 当前操作

- 左上头像：选择初音或大肥鱼。
- 右上：真实绘制 FPS 与菜单；没有额外表情开关。
- 下方操控卡片：表情、眼神、口型、嘴巴，支持横向滑动。
- 睁眼/闭眼：下方卡片右侧的独立圆按钮；整个卡片右上角内凹挖空，露出页面背景。
- 菜单：背景、设置、保存三个页面；设置包含触摸跟随、自然摆动、触摸点与恢复姿态。
- 主页面固定视口布局，常见手机尺寸避免整页上下滚动。

头像是独立 UI 资源：大肥鱼头像移除了鳍耳装饰，按主头部取景，适当裁掉呆毛；角色模型本身保留这些部件。

## 构建与上传

```sh
npm run release
```

同一次命令生成：

| 产物 | 路径 |
| --- | --- |
| 网站静态文件 | `build/` |
| Toy 静态文件 | `build-toy/` |
| Toy 上传 ZIP | `release/toy/halfne-bilibili-toy.zip` |

网站和 Toy 使用同一套源码与相同 `releaseID`。ZIP 根目录直接包含 `index.html`。此命令仅构建和打包，**服务器上传、桌面复制、Bilibili 提交是另外的步骤**，见[发布流程](docs/RELEASE.md)。

## 来源

项目基于 JohnSu 的 Halfne Miku Studio 及 yuyuyzl 的 HTML5 重制版演进。经典初音素材与模型入口保留，鲸鱼娘使用独立骨架适配和分层 SVG 素材。旧模型协议见 [model-docs.md](model-docs.md)，当前宿主接入方式以本项目架构文档为准。
