/* eslint-disable */
/**
 * Animated_GIF Worker — Vite-compatible.
 *
 * Receives frame data, performs NeuQuant quantization or dithering,
 * and posts back the indexed pixels + palette.
 */

import NeuQuant from './neuquant.js';

/* ---- Dithering ---- */

function colorClamp(value) {
    if (value < 0) return 0;
    if (value > 255) return 255;
    return value;
}

const bayerMatrix8x8 = [
    [1, 49, 13, 61, 4, 52, 16, 64],
    [33, 17, 45, 29, 36, 20, 48, 32],
    [9, 57, 5, 53, 12, 60, 8, 56],
    [41, 25, 37, 21, 44, 28, 40, 24],
    [3, 51, 15, 63, 2, 50, 14, 62],
    [35, 19, 47, 31, 34, 18, 46, 30],
    [11, 59, 7, 55, 10, 58, 6, 54],
    [43, 27, 39, 23, 42, 26, 38, 22],
];

function getClosestPaletteColorIndex(r, g, b, palette, paletteLength) {
    var minDistance = 195076;
    var bestIndex = 0;
    for (var i = 0; i < paletteLength; i++) {
        var p = palette[i];
        var diffR = r - p[0];
        var diffG = g - p[1];
        var diffB = b - p[2];
        var distanceSquared = diffR * diffR + diffG * diffG + diffB * diffB;
        if (distanceSquared < minDistance) {
            bestIndex = i;
            minDistance = distanceSquared;
        }
    }
    return bestIndex;
}

function BayerDithering(inPixels, width, height, palette) {
    var offset = 0;
    var indexedOffset = 0;
    var paletteLength = palette.length;
    var indexedPixels = new Uint8Array(width * height);
    for (var j = 0; j < height; j++) {
        var modj = j % 8;
        for (var i = 0; i < width; i++) {
            var threshold = bayerMatrix8x8[i % 8][modj];
            var r = colorClamp(inPixels[offset++] + threshold);
            var g = colorClamp(inPixels[offset++] + threshold);
            var b = colorClamp(inPixels[offset++] + threshold);
            indexedPixels[indexedOffset++] = getClosestPaletteColorIndex(r, g, b, palette, paletteLength);
        }
    }
    return indexedPixels;
}

function ClosestDithering(inPixels, width, height, palette) {
    var offset = 0;
    var paletteLength = palette.length;
    var indexedPixels = new Uint8Array(width * height);
    for (var i = 0; i < width * height; i++) {
        var r = inPixels[offset++];
        var g = inPixels[offset++];
        var b = inPixels[offset++];
        indexedPixels[i] = getClosestPaletteColorIndex(r, g, b, palette, paletteLength);
    }
    return indexedPixels;
}

function FloydSteinberg(inPixels, width, height, palette) {
    var paletteLength = palette.length;
    var offset = 0;
    var indexedOffset = 0;
    var widthLimit = width - 1;
    var heightLimit = height - 1;
    var indexedPixels = new Uint8Array(width * height);
    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            var r = colorClamp(inPixels[offset++]);
            var g = colorClamp(inPixels[offset++]);
            var b = colorClamp(inPixels[offset++]);
            var colorIndex = getClosestPaletteColorIndex(r, g, b, palette, paletteLength);
            var paletteColor = palette[colorIndex];
            indexedPixels[indexedOffset] = colorIndex;
            var errorR = r - paletteColor[0];
            var errorG = g - paletteColor[1];
            var errorB = b - paletteColor[2];
            if (i < widthLimit) {
                var offsetNextI = offset;
                inPixels[offsetNextI++] += (errorR * 7) >> 4;
                inPixels[offsetNextI++] += (errorG * 7) >> 4;
                inPixels[offsetNextI++] += (errorB * 7) >> 4;
            }
            if (j < heightLimit) {
                if (i > 0) {
                    var offsetPrevINextJ = offset - 1 + width;
                    inPixels[offsetPrevINextJ++] += (errorR * 3) >> 4;
                    inPixels[offsetPrevINextJ++] += (errorG * 3) >> 4;
                    inPixels[offsetPrevINextJ++] += (errorB * 3) >> 4;
                }
                var offsetNextJ = offset + width;
                inPixels[offsetNextJ++] += (errorR * 5) >> 4;
                inPixels[offsetNextJ++] += (errorG * 5) >> 4;
                inPixels[offsetNextJ++] += (errorB * 5) >> 4;
                if (i < widthLimit) {
                    inPixels[offsetNextJ++] += errorR >> 4;
                    inPixels[offsetNextJ++] += errorG >> 4;
                    inPixels[offsetNextJ++] += errorB >> 4;
                }
            }
            indexedOffset++;
        }
    }
    return indexedPixels;
}

/* ---- Palette / data helpers ---- */

function channelizePalette(palette) {
    var result = [];
    for (var i = 0; i < palette.length; i++) {
        var color = palette[i];
        result.push([
            (color & 0xff0000) >> 16,
            (color & 0x00ff00) >> 8,
            (color & 0x0000ff),
            color,
        ]);
    }
    return result;
}

function dataToRGB(data, width, height) {
    var length = width * height * 4;
    var rgb = [];
    for (var i = 0; i < length; i += 4) {
        rgb.push(data[i]);
        rgb.push(data[i + 1]);
        rgb.push(data[i + 2]);
    }
    return rgb;
}

function componentizedPaletteToArray(paletteRGB) {
    var arr = [];
    for (var i = 0; i < paletteRGB.length; i += 3) {
        arr.push((paletteRGB[i] << 16) | (paletteRGB[i + 1] << 8) | paletteRGB[i + 2]);
    }
    return arr;
}

function processFrameWithQuantizer(imageData, width, height, sampleInterval) {
    var rgbComponents = dataToRGB(imageData, width, height);
    var nq = new NeuQuant(rgbComponents, rgbComponents.length, sampleInterval);
    var paletteRGB = nq.process();
    var paletteArray = new Uint32Array(componentizedPaletteToArray(paletteRGB));
    var numberPixels = width * height;
    var indexedPixels = new Uint8Array(numberPixels);
    var k = 0;
    for (var i = 0; i < numberPixels; i++) {
        var r = rgbComponents[k++];
        var g = rgbComponents[k++];
        var b = rgbComponents[k++];
        indexedPixels[i] = nq.map(r, g, b);
    }
    return { pixels: indexedPixels, palette: paletteArray };
}

function processFrameWithDithering(imageData, width, height, ditheringType, palette) {
    var rgbComponents = dataToRGB(imageData, width, height);
    if (palette === null) {
        var nq = new NeuQuant(rgbComponents, rgbComponents.length, 16);
        var paletteRGB = nq.process();
        palette = componentizedPaletteToArray(paletteRGB);
    }
    var paletteArray = new Uint32Array(palette);
    var paletteChannels = channelizePalette(palette);
    var ditheringFunction;
    if (ditheringType === 'closest') {
        ditheringFunction = ClosestDithering;
    } else if (ditheringType === 'floyd') {
        ditheringFunction = FloydSteinberg;
    } else {
        ditheringFunction = BayerDithering;
    }
    var pixels = ditheringFunction(rgbComponents, width, height, paletteChannels);
    return { pixels: pixels, palette: paletteArray };
}

/* ---- Worker entry point ---- */

self.onmessage = function (ev) {
    var frame = ev.data;
    var width = frame.width;
    var height = frame.height;
    var imageData = frame.data;
    var dithering = frame.dithering;
    var palette = frame.palette;
    var sampleInterval = frame.sampleInterval;

    var response;
    if (dithering) {
        response = processFrameWithDithering(imageData, width, height, dithering, palette);
    } else {
        response = processFrameWithQuantizer(imageData, width, height, sampleInterval);
    }

    self.postMessage(response);
};
