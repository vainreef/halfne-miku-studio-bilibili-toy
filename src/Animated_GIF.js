/* eslint-disable */
/**
 * Animated_GIF — Vite-compatible rewrite.
 *
 * Original library: https://github.com/yuyuyzl/Animated_GIF
 * Uses Dean McNamee's omggif library (GifWriter) for GIF assembly, and
 * Anthony Dekker's NeuQuant quantizer + dithering inside a Web Worker.
 *
 * The worker (quantization + dithering) lives in src/AnimatedGIFWorker.js
 * and is loaded as a proper Vite Worker module.
 */

import { GifWriter } from 'omggif';
import AnimatedGIFWorker from './AnimatedGIFWorker.js?worker';

/* ------------------------------------------------------------------ */
/*  Main Animated_GIF class                                           */
/* ------------------------------------------------------------------ */

function Animated_GIF(options) {
    options = options || {};

    var width = options.width || 160;
    var height = options.height || 160;
    var dithering = options.dithering || null;
    var palette = options.palette || null;
    var disposal = options.disposal || 0;
    var transparent = options.transparent || null;
    var delay = options.delay !== undefined ? (options.delay * 0.1) : 250;
    var canvas = null, ctx = null, repeat = 0;
    var frames = [];
    var numRenderedFrames = 0;
    var onRenderCompleteCallback = function () {};
    var onRenderProgressCallback = function () {};
    var sampleInterval;
    var workers = [], availableWorkers = [], numWorkers;
    var generatingGIF = false;
    var eager = !!options.eager, finalizing = false;

    // Palette validation
    if (palette) {
        if (!(palette instanceof Array)) {
            throw 'Palette MUST be an array but it is: ' + palette;
        }
        if (palette.length < 2 || palette.length > 256) {
            console.error('Palette must hold only between 2 and 256 colours');
            while (palette.length < 2) palette.push(0x000000);
            while (palette.length > 256) palette.pop();
        }
        if ((palette.length & (palette.length - 1)) !== 0) {
            console.error('Palette must have a power of two number of colours');
            while ((palette.length & (palette.length - 1)) !== 0) palette.pop();
        }
    }

    sampleInterval = options.sampleInterval || 10;
    numWorkers = options.numWorkers || 2;

    for (var i = 0; i < numWorkers; i++) {
        var w = new AnimatedGIFWorker();
        workers.push(w);
        availableWorkers.push(w);
    }

    function getWorker() {
        if (availableWorkers.length === 0) throw 'No workers left!';
        return availableWorkers.pop();
    }

    function freeWorker(worker) {
        availableWorkers.push(worker);
    }

    var bufferToString = (function () {
        var byteMap = [];
        for (var i = 0; i < 256; i++) byteMap[i] = String.fromCharCode(i);
        return function (buffer) {
            var str = '';
            for (var i = 0; i < buffer.length; i++) str += byteMap[buffer[i]];
            return str;
        };
    })();

    function startRendering(completeCallback) {
        onRenderCompleteCallback = completeCallback;
        finalizing = true;
        if (frames.length && frames.every(frame => frame.done)) {
            generateGIF(frames, onRenderCompleteCallback);
        } else {
            while (processNextFrame()) {}
        }
    }

    function processFrame(position) {
        var frame = frames[position];
        if (frame.beingProcessed || frame.done) {
            console.error('Frame already being processed or done!', frame.position);
            onFrameFinished();
            return;
        }
        frame.sampleInterval = sampleInterval;
        frame.beingProcessed = true;
        var worker = getWorker();
        worker.onmessage = function (ev) {
            var data = ev.data;
            delete frame.data;
            frame.pixels = data.pixels; // Keep compact indexed bytes instead of boxed JS numbers.
            frame.palette = Array.prototype.slice.call(data.palette);
            frame.done = true;
            frame.beingProcessed = false;
            freeWorker(worker);
            onFrameFinished();
        };
        worker.postMessage(frame, [frame.data.buffer]);
    }

    function processNextFrame() {
        if (!availableWorkers.length) return false;
        var position = -1;
        for (var i = 0; i < frames.length; i++) {
            if (!frames[i].done && !frames[i].beingProcessed) {
                position = i;
                break;
            }
        }
        if (position >= 0) { processFrame(position); return true; }
        return false;
    }

    function onFrameFinished() {
        var allDone = frames.every(function (frame) {
            return !frame.beingProcessed && frame.done;
        });
        numRenderedFrames++;
        onRenderProgressCallback(numRenderedFrames * 0.75 / frames.length);
        if (allDone) {
            if (finalizing && !generatingGIF) generateGIF(frames, onRenderCompleteCallback);
        } else {
            while (processNextFrame()) {}
        }
    }

    function generateGIF(frames, callback) {
        var buffer = [];
        var globalPalette;
        var gifOptions = { loop: repeat };
        if (dithering !== null && palette !== null) {
            globalPalette = palette;
            gifOptions.palette = globalPalette;
        }
        var gifWriter = new GifWriter(buffer, width, height, gifOptions);
        generatingGIF = true;
        var elapsedDelay = 0, writtenDelay = 0;
        frames.forEach(function (frame) {
            var framePalette;
            if (!globalPalette) framePalette = frame.palette;
            onRenderProgressCallback(0.75 + 0.25 * frame.position * 1.0 / frames.length);
            elapsedDelay += frame.delay;
            var frameDelay = Math.max(1, Math.round(elapsedDelay) - writtenDelay);
            writtenDelay += frameDelay;
            gifWriter.addFrame(0, 0, width, height, frame.pixels, {
                palette: framePalette,
                delay: frameDelay,
                transparent: transparent ? frame.pixels[0] : undefined,
                disposal: disposal,
            });
        });
        gifWriter.end();
        onRenderProgressCallback(1.0);
        frames = [];
        generatingGIF = false;
        finalizing = false;
        callback(buffer);
    }

    function powerOfTwo(value) {
        return (value !== 0) && ((value & (value - 1)) === 0);
    }

    // Public API
    this.setSize = function (w, h) {
        width = w;
        height = h;
        canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        ctx = canvas.getContext('2d');
    };

    this.setDelay = function (seconds) { delay = seconds * 0.1; };
    this.setRepeat = function (r) { repeat = r; };

    this.addFrame = function (element, opts) {
        if (ctx === null) this.setSize(width, height);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(element, 0, 0, width, height);
        this.addFrameImageData(ctx.getImageData(0, 0, width, height), opts);
    };

    this.addFrameImageData = function (imageData, opts) {
        opts = opts || {};
        frames.push({
            data: new Uint8Array(imageData.data),
            width: imageData.width,
            height: imageData.height,
            delay: opts.delay !== undefined ? (opts.delay * 0.1) : delay,
            palette: palette,
            dithering: dithering,
            done: false,
            beingProcessed: false,
            position: frames.length,
        });
        // Quantize while the next frame is being captured; discard RGBA buffers early.
        if (eager) processNextFrame();
    };

    this.onRenderProgress = function (callback) { onRenderProgressCallback = callback; };
    this.isRendering = function () { return generatingGIF; };

    this.getBase64GIF = function (completeCallback) {
        startRendering(function (buffer) {
            var str = bufferToString(buffer);
            completeCallback('data:image/gif;base64,' + btoa(str));
        });
    };

    this.getBlobGIF = function (completeCallback) {
        startRendering(function (buffer) {
            completeCallback(new Blob([new Uint8Array(buffer)], { type: 'image/gif' }));
        });
    };

    this.destroy = function () {
        workers.forEach(function (w) { w.terminate(); });
    };
}

export default Animated_GIF;
