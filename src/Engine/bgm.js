/**
 * 全局背景音乐 (BGM) 控制器
 * - 默认自动播放（支持循环播放）
 * - 智能规避现代移动端与浏览器 Autoplay 拦截：自动挂载单次手势解锁监听
 * - 响应用户设置开关与标签页前后台可见性切换 (Page Visibility)
 */

class BgmController {
    constructor() {
        this.audio = null;
        this.enabled = true;
        this.isPlaying = false;
        this.unlockListenersBound = false;
        this.src = `${import.meta.env.BASE_URL}audio/You_and_Me.mp3`;

        this.handleUserInteraction = this.handleUserInteraction.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    init() {
        if (typeof window === 'undefined' || this.audio) return;

        this.audio = new Audio(this.src);
        this.audio.loop = true;
        this.audio.preload = 'auto';
        this.audio.volume = 0.65; // 舒缓温和的默认音量

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
        const events = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'];
        events.forEach(evt => window.addEventListener(evt, this.handleUserInteraction, { once: true, capture: true }));
        this.unlockListenersBound = true;
    }

    unbindUnlockListeners() {
        if (!this.unlockListenersBound || typeof window === 'undefined') return;
        const events = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'];
        events.forEach(evt => window.removeEventListener(evt, this.handleUserInteraction, { capture: true }));
        this.unlockListenersBound = false;
    }

    handleUserInteraction() {
        this.unbindUnlockListeners();
        if (this.enabled) {
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
                    this.unbindUnlockListeners();
                })
                .catch((err) => {
                    // 浏览器 Autoplay 策略拦截，等待用户首次点击或触摸时自动解锁
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
