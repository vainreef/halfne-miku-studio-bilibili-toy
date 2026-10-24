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

    console.log('--- 1. Testing Topbar Center & Zoom Controls ---');
    const zoomControls = page.locator('.zoom-controls');
    assert.equal(await zoomControls.count(), 1, 'Zoom controls must exist');
    
    const zoomOutBtn = page.locator('.zoom-btn.zoom-out');
    const zoomInBtn = page.locator('.zoom-btn.zoom-in');
    const zoomText = page.locator('.zoom-label');

    assert.equal(await zoomOutBtn.isDisabled(), true, 'Zoom out must be disabled at 100%');
    assert.equal((await zoomText.textContent()).trim(), '100%');

    // Check topbar horizontal centering
    const topbarBox = await page.locator('.stage-topbar').boundingBox();
    const controlsBox = await zoomControls.boundingBox();
    const topbarCenterX = topbarBox.x + topbarBox.width / 2;
    const controlsCenterX = controlsBox.x + controlsBox.width / 2;
    console.log(`Topbar center X: ${topbarCenterX}, Controls center X: ${controlsCenterX}`);
    assert(Math.abs(topbarCenterX - controlsCenterX) <= 1.0, 'Zoom controls must be horizontally centered within 1px');

    console.log('--- 2. Testing Zoom In & WebGL Canvas Buffer Scaling ---');
    const initialCanvasDims = await page.evaluate(() => {
        const canvas = document.querySelector('canvas[data-renderer="webgl"]');
        return {
            width: canvas.width,
            height: canvas.height,
            styleWidth: canvas.style.width,
            styleHeight: canvas.style.height
        };
    });
    console.log('Initial Canvas buffer:', initialCanvasDims);

    // Click Zoom In -> 125%
    await zoomInBtn.click();
    await page.waitForTimeout(300);
    assert.equal((await zoomText.textContent()).trim(), '125%');
    assert.equal(await zoomOutBtn.isDisabled(), false);

    const zoomed125Dims = await page.evaluate(() => {
        const canvas = document.querySelector('canvas[data-renderer="webgl"]');
        return {
            width: canvas.width,
            height: canvas.height,
            styleWidth: canvas.style.width,
            styleHeight: canvas.style.height
        };
    });
    console.log('125% Canvas buffer:', zoomed125Dims);
    assert.equal(zoomed125Dims.width, Math.round(initialCanvasDims.width * 1.25), 'Canvas buffer width must scale by 1.25x');
    assert.equal(zoomed125Dims.height, Math.round(initialCanvasDims.height * 1.25), 'Canvas buffer height must scale by 1.25x');

    // Click Zoom In twice more -> 150% -> 175% -> 200%
    await zoomInBtn.click(); // 150%
    await page.waitForTimeout(100);
    await zoomInBtn.click(); // 175%
    await page.waitForTimeout(100);
    await zoomInBtn.click(); // 200%
    await page.waitForTimeout(300);
    assert.equal((await zoomText.textContent()).trim(), '200%');
    assert.equal(await zoomInBtn.isDisabled(), true, 'Zoom In should be disabled at max 200%');

    const zoomed200Dims = await page.evaluate(() => {
        const canvas = document.querySelector('canvas[data-renderer="webgl"]');
        return {
            width: canvas.width,
            height: canvas.height
        };
    });
    console.log('200% Canvas buffer:', zoomed200Dims);
    assert.equal(zoomed200Dims.width, Math.round(initialCanvasDims.width * 2.0), 'Canvas buffer width must scale by 2.0x');
    assert.equal(zoomed200Dims.height, Math.round(initialCanvasDims.height * 2.0), 'Canvas buffer height must scale by 2.0x');

    console.log('--- 3. Testing Single-Finger Drag (Touch Action) vs Dual-Finger Drag (Canvas Pan) ---');
    // First, verify single finger drag does NOT change stage pan
    const getStageTransform = () => page.evaluate(() => {
        const el = document.querySelector('.stage-scaler-box');
        return el ? el.style.transform : '';
    });

    const beforeSingleTransform = await getStageTransform();
    console.log('Transform before single touch:', beforeSingleTransform);

    // Simulate single-finger drag on viewport
    const viewport = page.locator('.stage-viewport');
    const vpBox = await viewport.boundingBox();
    const startX = vpBox.x + vpBox.width / 2;
    const startY = vpBox.y + vpBox.height / 2;

    await page.touchscreen.tap(startX, startY);
    await page.waitForTimeout(100);

    // Single touch move
    const client = await context.newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y: startY, id: 0 }]
    });
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + 50, y: startY + 50, id: 0 }]
    });
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: []
    });

    const afterSingleTransform = await getStageTransform();
    console.log('Transform after single touch drag:', afterSingleTransform);
    assert.equal(afterSingleTransform, beforeSingleTransform, 'Single touch must NOT alter panOffset transform!');

    // Now simulate dual-finger drag to pan canvas
    console.log('Testing dual-finger pan...');
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [
            { x: startX - 20, y: startY, id: 0 },
            { x: startX + 20, y: startY, id: 1 }
        ]
    });
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
            { x: startX - 20 + 60, y: startY + 40, id: 0 },
            { x: startX + 20 + 60, y: startY + 40, id: 1 }
        ]
    });
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: []
    });

    const afterDualTransform = await getStageTransform();
    console.log('Transform after dual touch pan:', afterDualTransform);
    assert.notEqual(afterDualTransform, beforeSingleTransform, 'Dual touch MUST pan canvas in zoomed mode!');
    assert(afterDualTransform.includes('translate3d'), 'Transform must contain translate3d');

    console.log('--- 4. Testing Zoom Out Reset Pan to Default (0, 0) ---');
    // Zoom back to 100%
    while (!(await zoomOutBtn.isDisabled())) {
        await zoomOutBtn.click();
        await page.waitForTimeout(100);
    }
    assert.equal((await zoomText.textContent()).trim(), '100%');

    const resetTransform = await getStageTransform();
    console.log('Transform after zoom back to 100%:', resetTransform);
    assert.equal(resetTransform, 'translate3d(0px, 0px, 0px) scale(1)', 'Resetting zoom must restore translation to 0px, 0px');

    const resetCanvasDims = await page.evaluate(() => {
        const canvas = document.querySelector('canvas[data-renderer="webgl"]');
        return {
            width: canvas.width,
            height: canvas.height
        };
    });
    console.log('Reset Canvas buffer:', resetCanvasDims);
    assert.equal(resetCanvasDims.width, initialCanvasDims.width, 'Buffer width must return to 1.0x default');
    assert.equal(resetCanvasDims.height, initialCanvasDims.height, 'Buffer height must return to 1.0x default');

    console.log('--- 5. Checking Eye Button and QuickPad Border Cut Fix ---');
    const eyeBtn = page.locator('.pad-eye-toggle');
    assert.equal(await eyeBtn.count(), 1, 'Eye toggle button must exist');
    const eyeBox = await eyeBtn.boundingBox();
    console.log('Eye toggle bounding box:', eyeBox);
    assert(eyeBox.width >= 44 && eyeBox.height >= 44, 'Eye toggle must satisfy touch size');

    const quickPadMask = await page.locator('.quick-pad').evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
            mask: style.mask || style.webkitMask,
            borderRadius: style.borderRadius,
            border: style.border
        };
    });
    console.log('QuickPad mask & border styling:', quickPadMask);
    assert(!quickPadMask.mask || quickPadMask.mask === 'none', 'QuickPad mask must be none to prevent cutting borders');

    await page.screenshot({ path: 'screenshots/ui/zoom-pan-verified.png' });
    console.log('✅ All zoom, re-rasterize, dual-finger pan, and UI tests PASSED successfully!');
    await context.close();
} finally {
    await browser.close();
}
