import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import JSZip from 'jszip';

const build = path.resolve('build-toy');
const out = path.resolve('release/toy');
await fs.mkdir(out, { recursive: true });
const zip = new JSZip();

async function add(dir, prefix = '') {
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
        if (item.name.startsWith('.')) continue;
        const name = prefix + item.name;
        if (item.isDirectory()) {
            await add(path.join(dir, item.name), name + '/');
        } else {
            zip.file(name, await fs.readFile(path.join(dir, item.name)));
        }
    }
}

await add(build);
if (!zip.file('index.html')) throw Error('Missing root index.html');
const data = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
});
if (data.length > 50 * 1024 * 1024) throw Error('Toy ZIP exceeds 50 MB');
const file = path.join(out, 'halfne-bilibili-toy.zip');
await fs.writeFile(file, data);
console.log(`Toy ZIP: ${file} (${(data.length / 1024 / 1024).toFixed(2)} MB)`);

// 自动清空并覆盖桌面上传包目录
const desktopDir = path.join(os.homedir(), 'Desktop', '小初音工作室-Toy上传包');
try {
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const version = pkg.version || '0.7.0';
    await fs.rm(desktopDir, { recursive: true, force: true });
    await fs.mkdir(desktopDir, { recursive: true });
    await fs.writeFile(path.join(desktopDir, 'halfne-bilibili-toy.zip'), data);
    await fs.writeFile(path.join(desktopDir, `halfne-bilibili-toy-v${version}.zip`), data);

    try {
        const releaseJson = await fs.readFile(path.join(build, 'release.json'), 'utf8');
        await fs.writeFile(path.join(desktopDir, 'release.json'), releaseJson);
    } catch {}

    const readme = `# 小初音工作室 Toy 上传包 (v${version})

- 生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
- 文件大小：${(data.length / 1024 / 1024).toFixed(2)} MB
- 包含文件：
  - \`halfne-bilibili-toy.zip\`
  - \`halfne-bilibili-toy-v${version}.zip\` (完全相同)

> 每次打包均已执行清空旧文件覆盖，确保只有最新打包产物。
`;
    await fs.writeFile(path.join(desktopDir, '上传说明.md'), readme, 'utf8');
    console.log(`已彻底清空并覆盖桌面上传包目录: ${desktopDir}`);
} catch (err) {
    console.warn('同步桌面上传包失败:', err.message);
}
