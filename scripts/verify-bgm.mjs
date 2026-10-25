import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '../skin-lab/node_modules/playwright/index.mjs';

const base = process.env.UI_TEST_URL || 'http://localhost:3000/halfne-studio-bilibili-toy/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });

try {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForSelector('canvas[data-ready="1"]');
    await page.waitForTimeout(500);

    console.log('--- 1. Testing BGM Initialization & Setting Toggle ---');
    // Open ToyMenu
    await page.getByRole('button', { name: '打开菜单', exact: true }).click();
    await page.getByRole('tab', { name: '设置', exact: true }).click();

    const bgmCheckbox = page.getByLabel('背景音乐', { exact: true });
    assert.equal(await bgmCheckbox.count(), 1, 'BGM checkbox must exist');
    assert.equal(await bgmCheckbox.isChecked(), false, 'BGM must be unchecked by default');

    // Check audio src in window
    const audioState = await page.evaluate(async () => {
        const settings = JSON.parse(localStorage.getItem('halfne-toy-settings') || '{}');
        return {
            bgmSetting: settings.bgm
        };
    });
    console.log('Initial BGM setting:', audioState);

    // Check BGM
    await bgmCheckbox.check();
    await page.waitForTimeout(200);
    assert.equal(await bgmCheckbox.isChecked(), true, 'BGM should be checked');

    const checkedState = await page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('halfne-toy-settings') || '{}');
        return settings.bgm;
    });
    assert.equal(checkedState, true, 'localStorage should persist bgm: true');

    // Re-uncheck BGM
    await bgmCheckbox.uncheck();
    await page.waitForTimeout(200);
    assert.equal(await bgmCheckbox.isChecked(), false, 'BGM should be unchecked again');

    const uncheckedState = await page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('halfne-toy-settings') || '{}');
        return settings.bgm;
    });
    assert.equal(uncheckedState, false, 'localStorage should persist bgm: false');

    // Close menu
    await page.getByRole('button', { name: '关闭菜单', exact: true }).click();

    console.log('✅ BGM settings and toggle test PASSED!');
    await context.close();
} finally {
    await browser.close();
}
