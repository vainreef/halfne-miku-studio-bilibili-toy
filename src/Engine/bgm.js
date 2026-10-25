/**
 * 全局背景音乐 (BGM) 控制器
 * - 默认自动播放（支持循环播放）
 * - 智能规避现代移动端与 WebView Autoplay 拦截：合规手势解锁 (touchend / click)
 * - 响应用户设置开关与标签页前后台可见性切换 (Page Visibility)
 */

class BgmController {
    constructor() {
        this.audio = null;
        this.enabled = false;
        this.isPlaying = false;
        this.unlockListenersBound = false;
        this.src = `${import.meta.env.BASE_URL}audio/You_and_Me.mp3`;

        this.handleUserInteraction = this.handleUserInteraction.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    init() {
        if (typeof window === 'undefined' || this.audio) return;

        let audioUrl = this.src;
        try {
            audioUrl = new URL(this.src, window.location.href).href;
        } catch {}

        this.audio = new Audio(audioUrl);
        this.audio.loop = true;
        this.audio.preload = 'auto';
        this.audio.volume = 0.65;
        this.audio.setAttribute('playsinline', 'true');
        this.audio.setAttribute('webkit-playsinline', 'true');
        this.audio.playsInline = true;

        this.audio.addEventListener('error', (e) => {
            console.warn('[BGM] Audio error:', e);
        });

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    handleVisibilityChange() {
        if (!this.audio || !this.enabled) return;
        if (document.hidden) {
            if (this.isPlaying) {
                this.audio.pause();
            }
        } else {
            if (this.enabled) {
                this.play();
            }
        }
    }

    bindUnlockListeners() {
        if (this.unlockListenersBound || typeof window === 'undefined') return;
        // 关键：iOS WebKit 与 WebView 仅认可 touchend / click / keydown 为合法手势，严格排除 touchstart/pointerdown
        const events = ['click', 'touchend', 'keydown'];
        events.forEach(evt => window.addEventListener(evt, this.handleUserInteraction, { capture: true, passive: true }));
        this.unlockListenersBound = true;
    }

    unbindUnlockListeners() {
        if (!this.unlockListenersBound || typeof window === 'undefined') return;
        const events = ['click', 'touchend', 'keydown'];
        events.forEach(evt => window.removeEventListener(evt, this.handleUserInteraction, { capture: true }));
        this.unlockListenersBound = false;
    }

    handleUserInteraction() {
        if (this.enabled && !this.isPlaying) {
            this.play();
        }
    }

    play() {
        if (!this.audio) this.init();
        if (!this.audio || !this.enabled) return;

        const promise = this.audio.play();
        if (promise !== undefined) {
            promise
                .then(() => {
                    this.isPlaying = true;
                    // 只有成功起播后才卸载手势监听
                    this.unbindUnlockListeners();
                })
                .catch((err) => {
                    // 若受策略限制未能立即起播，继续保持手势解锁监听，直至用户首触触发
                    this.isPlaying = false;
                    this.bindUnlockListeners();
                });
        }
    }

    pause() {
        this.unbindUnlockListeners();
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
        }
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
        if (this.enabled) {
            this.play();
        } else {
            this.pause();
        }
    }

    destroy() {
        this.unbindUnlockListeners();
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        }
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }
    }
}

export const bgm = new BgmController();
