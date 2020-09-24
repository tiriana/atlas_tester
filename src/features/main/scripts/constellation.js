'use strict';

const {numbers, PIXI, sprite, tweens} = require('@omnigame/core');


const constellations = {
    'anubis': {
        'position': {'x': 560, 'y': 818},
        'rotation': -52.8,
        'path': [
            {'x': 71, 'y': 39},
            {'x': 51, 'y': 34},
            {'x': 64, 'y': 55},
            {'x': 91, 'y': 98},
            {'x': 66, 'y': 148},
            {'x': 115, 'y': 167},
            {'x': 145, 'y': 116},
            {'x': 66, 'y': 148}
        ]
    },
    'bird': {
        'position': {'x': 690, 'y': 632},
        'rotation': -30.6,
        'path': [
            {'x': 53, 'y': 51},
            {'x': 84, 'y': 60},
            [{'x': 91, 'y': 51, 'speed': 25}],
            [
                {'x': 98, 'y': 81},
                {'x': 47, 'y': 120},
                {'x': 70, 'y': 136},
                {'x': 155, 'y': 155},
                {'x': 71, 'y': 173},
                {'x': 70, 'y': 136}
            ]
        ]
    },
    'queen': {
        'position': {'x': 1128, 'y': 508},
        'rotation': 26,
        'path': [
            {'x': 146, 'y': 174},
            {'x': 164, 'y': 140},
            [{'x': 177, 'y': 119, 'speed': 25}],
            [
                {'x': 147, 'y': 119, 'speed': 50},
                [{'x': 91, 'y': 174, 'speed': 50}],
                [
                    {'x': 133, 'y': 102, 'speed': 50},
                    [{'x': 124, 'y': 87, 'speed': 25}],
                    [
                        {'x': 150, 'y': 63, 'speed': 50},
                        [{'x': 139, 'y': 49, 'speed': 25}],
                        [{'x': 160, 'y': 41, 'speed': 25}]
                    ]
                ]
            ]
        ]
    },
    'ra': {
        'position': {'x': 1360, 'y': 637},
        'rotation': 49.3,
        'path': [
            {'x': 104, 'y': 36},
            {'x': 93, 'y': 72},
            [{'x': 83, 'y': 60, 'speed': 25}],
            [
                {'x': 97, 'y': 76},
                {'x': 40, 'y': 145},
                [{'x': 31, 'y': 129, 'speed': 25}],
                [
                    {'x': 53, 'y': 165},
                    {'x': 127, 'y': 151},
                    [{'x': 150, 'y': 148, 'speed': 25}],
                    [
                        {'x': 153, 'y': 177},
                        {'x': 60, 'y': 176},
                        {'x': 53, 'y': 165}
                    ]
                ]
            ]
        ]
    }
};

const defaultSpeed = 100;
const fadeTime = 1.5;

class Constellation extends PIXI.Sprite {
    constructor(type) {
        super();

        const data = constellations[type];
        this.texture = `main/background/constellations/${type}.png`;
        this.blendMode = PIXI.BLEND_MODES.ADD;
        this.position.set(data.position.x, data.position.y);
        this.rotation = numbers.radians(data.rotation);
        this.anchor.set(0, 0);
        this.alpha = 0;
        this.visible = false;

        this.tweens = [];
        this.animationTime = 0;

        this.parseChildPath(data.path);

        for (var i = 0; i < this.tweens.length; i += 1) {
            const tween = this.tweens[i];
            tween.delay(this.animationTime - tween.duration).call(tween.pause, tween).repeat();
        }
    }

    parseChildPath(path, lastPoint = null, pathTime = 0) {
        for (var i = 0; i < path.length; i += 1) {
            const pointOrArray = path[i];
            if (Array.isArray(pointOrArray)) {
                this.parseChildPath(pointOrArray, lastPoint, pathTime);
            } else {
                if (lastPoint) {
                    const diffX = pointOrArray.x - lastPoint.x;
                    const diffY = pointOrArray.y - lastPoint.y;
                    const angle = Math.atan2(diffY, diffX);
                    const length = Math.hypot(diffX, diffY);
                    const time = length / (pointOrArray.speed || defaultSpeed) / 2;
                    const line = sprite('main/background/line.png').position(lastPoint).rotation(angle).anchor(0, 0.5).blending('ADD').addTo(this).sprite;
                    const st = tweens.scaleX(line, 0).standalone().delay(pathTime).to(length / 16, time).pause();
                    const at = tweens.alpha(line, 1).standalone().delay(pathTime + time).to(0, fadeTime / 2 ).pause();

                    this.tweens.push(st, at);
                    pathTime += time;
                }

                lastPoint = pointOrArray;
            }
        }

        this.animationTime = Math.max(this.animationTime, pathTime + fadeTime);
    }

    appearForAMoment() {
        if (this.visible) {
            return;
        }
        this.alpha = 0;
        this.visible = true;

        this.appearTween = tweens.alpha(this, 0).to(1, 0.5).call(this.start, this).delay(4).to(0, 4).call(this.onDisappear, this);
    }

    onDisappear() {
        this.visible = false; 
    }

    update(elapsed) {
        if (this.appearTween && !this.appearTween.paused)
            this.appearTween.update(elapsed);
        
        for (var i = 0; i < this.tweens.length; i += 1)
            if (!this.tweens[i].paused)
                this.tweens[i].update(elapsed);
    }

    start() {
        for (var i = 0; i < this.tweens.length; i += 1)
            this.tweens[i].resume();
    }
}

module.exports = Constellation;
