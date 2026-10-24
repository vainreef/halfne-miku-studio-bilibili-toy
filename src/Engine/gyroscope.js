/**
 * 现代高精度陀螺仪与重力感应姿态控制器
 * - 自动检测硬件支持与 iOS 权限机制 (DeviceOrientation + DeviceMotion 双重保障)
 * - 动态平滑零点基准 (Soft Baseline Calibration)
 * - 屏幕朝向自适应 (Screen Orientation Adapter: 竖屏 / 横屏)
 * - EWMA 低通滤波与微抖动抑制
 * - 触屏冲突仲裁：触屏时触控拥有最高优先级，松手无缝平滑回接
 */

export function isGyroSupported() {
    return typeof window !== 'undefined' && (
        ('DeviceOrientationEvent' in window) || ('DeviceMotionEvent' in window)
    );
}

export async function requestGyroPermission() {
    let granted = false;

    // 1. iOS DeviceOrientationEvent 权限申请
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const res = await DeviceOrientationEvent.requestPermission();
            if (res === 'granted') granted = true;
        } catch (err) {
            console.warn('[Gyro] DeviceOrientation permission error:', err);
        }
    }

    // 2. iOS DeviceMotionEvent 权限申请
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const res = await DeviceMotionEvent.requestPermission();
            if (res === 'granted') granted = true;
        } catch (err) {
            console.warn('[Gyro] DeviceMotion permission error:', err);
        }
    }

    if (granted) return true;
    return isGyroSupported();
}

export function createGyroController({
    onUpdate,
    sensitivityX = 9.5, // 角度到像素偏移的映射灵敏度
    sensitivityY = 8.5,
    maxOffsetX = 260,   // 最大水平偏转像素
    maxOffsetY = 200,   // 最大垂直偏转像素
} = {}) {
    let enabled = false;
    let listening = false;
    let hasReceivedData = false;
    let orientationMode = false;

    // 零点基准（用户当前的握持平衡角度/加速度）
    let baseBeta = null;
    let baseGamma = null;
    let baseMotionX = null;
    let baseMotionY = null;

    // 滤波输出状态
    let smoothX = 0;
    let smoothY = 0;

    // 触控交互仲裁状态
    let touching = false;
    let touchFade = 1.0; // 1.0 为纯陀螺仪驱动，0.0 为完全触控主导

    function getScreenOrientation() {
        return (typeof window.screen !== 'undefined' && window.screen.orientation?.angle) ??
            (typeof window.orientation === 'number' ? window.orientation : 0);
    }

    // 方案 1: DeviceOrientationEvent
    function handleOrientation(e) {
        if (!enabled) return;
        const rawBeta = e.beta;   // [-180, 180] 前后倾斜
        const rawGamma = e.gamma; // [-90, 90] 左右倾斜
        if (rawBeta == null || rawGamma == null) return;

        hasReceivedData = true;
        orientationMode = true;

        if (baseBeta === null || baseGamma === null) {
            baseBeta = rawBeta;
            baseGamma = rawGamma;
            return;
        }

        const driftSpeed = touching ? 0.12 : 0.003;
        baseBeta += (rawBeta - baseBeta) * driftSpeed;
        baseGamma += (rawGamma - baseGamma) * driftSpeed;

        let deltaBeta = rawBeta - baseBeta;
        let deltaGamma = rawGamma - baseGamma;

        if (Math.abs(deltaBeta) < 0.6) deltaBeta = 0;
        if (Math.abs(deltaGamma) < 0.6) deltaGamma = 0;

        const orientation = getScreenOrientation();
        let screenX = 0;
        let screenY = 0;

        switch (orientation) {
            case 90:
                screenX = deltaBeta * sensitivityX;
                screenY = deltaGamma * sensitivityY;
                break;
            case -90:
            case 270:
                screenX = -deltaBeta * sensitivityX;
                screenY = -deltaGamma * sensitivityY;
                break;
            case 180:
                screenX = -deltaGamma * sensitivityX;
                screenY = deltaBeta * sensitivityY;
                break;
            case 0:
            default:
                screenX = deltaGamma * sensitivityX;
                screenY = -deltaBeta * sensitivityY;
                break;
        }

        screenX = Math.max(-maxOffsetX, Math.min(maxOffsetX, screenX));
        screenY = Math.max(-maxOffsetY, Math.min(maxOffsetY, screenY));

        smoothX += (screenX - smoothX) * 0.25;
        smoothY += (screenY - smoothY) * 0.25;

        const targetFade = touching ? 0.12 : 1.0;
        touchFade += (targetFade - touchFade) * 0.15;

        onUpdate?.({
            x: smoothX * touchFade,
            y: smoothY * touchFade,
            rawX: smoothX,
            rawY: smoothY,
            active: true
        });
    }

    // 方案 2: DeviceMotionEvent 重力加速度备份方案 (针对 WebView / 限制环境)
    function handleMotion(e) {
        if (!enabled || orientationMode) return; // 若 orientation 有数据则优先使用 orientation
        const acc = e.accelerationIncludingGravity;
        if (!acc || acc.x == null || acc.y == null) return;

        hasReceivedData = true;

        if (baseMotionX === null || baseMotionY === null) {
            baseMotionX = acc.x;
            baseMotionY = acc.y;
            return;
        }

        const driftSpeed = touching ? 0.12 : 0.005;
        baseMotionX += (acc.x - baseMotionX) * driftSpeed;
        baseMotionY += (acc.y - baseMotionY) * driftSpeed;

        let deltaX = acc.x - baseMotionX;
        let deltaY = acc.y - baseMotionY;

        if (Math.abs(deltaX) < 0.15) deltaX = 0;
        if (Math.abs(deltaY) < 0.15) deltaY = 0;

        const orientation = getScreenOrientation();
        let screenX = 0;
        let screenY = 0;

        // 重力加速度映射为像素偏移
        const motionSensitivity = 38.0;
        switch (orientation) {
            case 90:
                screenX = deltaY * motionSensitivity;
                screenY = deltaX * motionSensitivity;
                break;
            case -90:
            case 270:
                screenX = -deltaY * motionSensitivity;
                screenY = -deltaX * motionSensitivity;
                break;
            case 180:
                screenX = deltaX * motionSensitivity;
                screenY = -deltaY * motionSensitivity;
                break;
            case 0:
            default:
                screenX = -deltaX * motionSensitivity;
                screenY = deltaY * motionSensitivity;
                break;
        }

        screenX = Math.max(-maxOffsetX, Math.min(maxOffsetX, screenX));
        screenY = Math.max(-maxOffsetY, Math.min(maxOffsetY, screenY));

        smoothX += (screenX - smoothX) * 0.22;
        smoothY += (screenY - smoothY) * 0.22;

        const targetFade = touching ? 0.12 : 1.0;
        touchFade += (targetFade - touchFade) * 0.15;

        onUpdate?.({
            x: smoothX * touchFade,
            y: smoothY * touchFade,
            rawX: smoothX,
            rawY: smoothY,
            active: true
        });
    }

    function start() {
        if (listening || typeof window === 'undefined') return;
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
        window.addEventListener('devicemotion', handleMotion, { passive: true });
        listening = true;
    }

    function stop() {
        if (!listening || typeof window === 'undefined') return;
        window.removeEventListener('deviceorientation', handleOrientation);
        window.removeEventListener('devicemotion', handleMotion);
        listening = false;
        hasReceivedData = false;
        orientationMode = false;
        smoothX = 0;
        smoothY = 0;
        baseBeta = null;
        baseGamma = null;
        baseMotionX = null;
        baseMotionY = null;
        onUpdate?.({ x: 0, y: 0, rawX: 0, rawY: 0, active: false });
    }

    return {
        enable() {
            enabled = true;
            start();
        },
        disable() {
            enabled = false;
            stop();
        },
        resetBaseline() {
            baseBeta = null;
            baseGamma = null;
            baseMotionX = null;
            baseMotionY = null;
            smoothX = 0;
            smoothY = 0;
        },
        notifyTouch(isInteracting) {
            touching = !!isInteracting;
        },
        hasHardware() {
            return hasReceivedData;
        },
        destroy() {
            stop();
        }
    };
}
