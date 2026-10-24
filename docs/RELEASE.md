# 构建、打包、同步发布

基线：0.7.0 / 2026-10-25。文档修改本身不要求重新发版；涉及应用交付时按以下步骤执行。

## 1. 发布前

- 确认用户要求、当前代码、视觉截图、手机布局和[测试适用范围](TESTING.md)。
- `git status --short` 识别工作区改动，保留已有未提交内容。
- 同步 `package.json`、`package-lock.json` 顶层及 `packages['']` 的版本。
- 头像/表情图片若同名覆盖，更新 UI 中的缓存标识。
- 正式素材保持原色，工作台标绿只作为调试滤镜。

## 2. 同源双目标构建

```sh
npm run release
```

`build-release.mjs` 生成一个共享 `HALFNE_RELEASE_ID`，执行网站构建、Toy 构建和打包。

```text
build/                         网站：base 来自 homepage 路径
build-toy/                     Toy：相对 base ./，注入 Toy SDK
release/toy/halfne-bilibili-toy.zip
```

两套输出的 `release.json` 应有相同 `version/releaseID`，`variant` 分别为 `web/toy`。HTML 同时嵌入 `halfne-version` meta。

单独 `npm run build` / `build:toy` 没有创建共享的新发行 ID 的整套流程；正式双端交付优先用 `release`。

### ZIP 规则

`package-toy.mjs`：只收集 `build-toy/` 内容，忽略点文件，DEFLATE 9 压缩；检查根级 `index.html` 和 50MiB 上限。

```sh
unzip -l release/toy/halfne-bilibili-toy.zip | head
shasum -a 256 release/toy/halfne-bilibili-toy.zip
cat build/release.json
cat build-toy/release.json
```

不要把 `build-toy` 文件夹本身再套一层放进 ZIP。ZIP 不是桌面目录里的截图、说明或报告集合。

## 3. 浏览器生产预览

开发服务正常不等于相对部署路径正常。需要测试生产构建：

- 网站挂在 `/halfne-studio-bilibili-toy/` 子路径。
- Toy 用一个静态服务提供根级 `index.html`，检查相对资源路径。
- 两角色切换、实际 GPU、高清画布、表情、PNG、菜单和无整页滚动。
- SDK 模拟检查与真实手机容器检查分开记录。

`npm run serve` 是 Vite 生产预览，默认提供网站 `build/`。仓库的 `scripts/serve-build.mjs` 也提供 `serveBuild(port, dir)` 供测试导入；仅执行此模块文件不会自动启动服务。

## 4. 复制到当前用户桌面

本机交付目录：`~/Desktop/小初音工作室-Toy上传包/`。

```sh
VERSION=$(node -p "JSON.parse(require('fs').readFileSync('package.json')).version")
UPLOAD_DIR="$HOME/Desktop/小初音工作室-Toy上传包"
mkdir -p "$UPLOAD_DIR/历史版本" "$UPLOAD_DIR/历史报告"
cp release/toy/halfne-bilibili-toy.zip "$UPLOAD_DIR/halfne-bilibili-toy.zip"
cp release/toy/halfne-bilibili-toy.zip "$UPLOAD_DIR/halfne-bilibili-toy-v$VERSION.zip"
cp build-toy/release.json "$UPLOAD_DIR/release.json"
shasum -a 256 "$UPLOAD_DIR/halfne-bilibili-toy"*.zip
```

复制前把旧版本号包归档至“历史版本”，旧验证报告归档至“历史报告”。无版本号 ZIP 与当前版本号 ZIP 内容应完全相同。上传说明首行清楚指向当前版本号文件，避免“到底上传哪个”。

本步骤没有写进 `npm run release`；需要显式执行。Bilibili 上传、审核、替换线上 Toy 由用户在平台完成。

## 5. 同步网站

当前服务器配置（非凭据）：

- SSH 别名：`alicloud`。
- 站点目录：`/var/www/freevian.com/halfne-studio-bilibili-toy/`。
- 访问域名：`https://vainreef.com/halfne-studio-bilibili-toy/`。
- 备份目录：`/root/deploy-backups/halfne-studio/`。

仅在任务包含发布时执行：

```sh
ssh alicloud 'd=/root/deploy-backups/halfne-studio/release-$(date +%Y%m%d-%H%M%S); mkdir -p "$d"; cp /var/www/freevian.com/halfne-studio-bilibili-toy/index.html /var/www/freevian.com/halfne-studio-bilibili-toy/release.json "$d"/'

# 先资源，后 HTML，避免新 HTML 提前引用尚未上传的资源
rsync -az --exclude=index.html build/ alicloud:/var/www/freevian.com/halfne-studio-bilibili-toy/
rsync -az build/index.html alicloud:/var/www/freevian.com/halfne-studio-bilibili-toy/index.html
```

不使用 `--delete`，保留旧哈希资源供已打开的页面继续加载。`release.json` 在第一阶段可能短暂先于 HTML 更新，最终验证应同时核对 HTML meta 与 releaseID。

### 发布后验证

打开带新版本标记的 URL，检查：

1. `release.json`、HTML meta 与本次本地发行 ID 一致。
2. 初音与鲸鱼娘各加载一次，均为当前统一 GPU/高清策略。
3. 手机视口页面和操控卡片没有溢出。
4. 浏览器控制台没有新增页面异常。
5. 网站已更新与 Toy 已提交是两件不同的事情，报告时分别说明。

## 回滚

保留已发布 ZIP、构建和备份。旧哈希资源尚在时，可以恢复备份的 `index.html` 和对应 `release.json`；同名非哈希 UI PNG 如已覆盖，还需从旧构建/ZIP 恢复，单恢复 HTML 不等于完整美术回滚。回滚后重复发行 ID 与角色加载检查。

## CI 边界

`.github/workflows/gh-pages.yml`（以实际文件名为准）的历史工作流构建网站并发布 GitHub Pages。它不自动部署 `vainreef.com`，也不自动生成/上传 Bilibili Toy。不要把 CI 绿色当作两个实际发布目标都已更新。
