'use strict';

const {PIXI, Signal, tweens, Container, sprite, ClippedTexture, numbers, easings} = require('@omnigame/core');
const GemBag = require('./gem_bag');

const weights = [];
const values = [];

const SYMBOL_HEIGHT = 70;

for (var i in settings.SYMBOL_DEFINITIONS)
    if (settings.SYMBOL_DEFINITIONS[i].probability) {
        weights.push(settings.SYMBOL_DEFINITIONS[i].probability);
        values.push(i);
    }

class Reel extends Container {
    constructor(index, column, row) {
        super();

        this.index = index;
        this.column = column;
        this.row = row;

        this.game = require('../../../scripts/main');

        this.gemBag = new GemBag(1, weights, values);

        this.tween = tweens.create(0);
        this.blurTween = tweens.create(0);

        this.type = 'red';

        this.sprites = [];
        this.sprites[0] = sprite(settings.SYMBOL_DEFINITIONS[this.type].normalTexture).addTo(this).sprite;
        this.sprites[1] = sprite(settings.SYMBOL_DEFINITIONS[this.type].normalTexture).addTo(this).sprite;

        this.sprites[0].anchor.set(0, 0);
        this.sprites[1].anchor.set(0, 0);

        this.createClipTexture(this.sprites[0]);
        this.createClipTexture(this.sprites[1]);

        this.blurred = [];
        this.blurred[0] = sprite(settings.SYMBOL_DEFINITIONS[this.type].blurredTexture).addTo(this).sprite;
        this.blurred[1] = sprite(settings.SYMBOL_DEFINITIONS[this.type].blurredTexture).addTo(this).sprite;

        this.blurred[0].anchor.set(0, 0);
        this.blurred[1].anchor.set(0, 0);

        this.createClipTexture(this.blurred[0]);
        this.createClipTexture(this.blurred[1]);

        this.overlay = sprite('main/overlay.png').anchor(0, 0).position(-1, -1).alpha(0).addTo(this).sprite;

        this.nextSymbolId = null;

        this.onLoop = new Signal();
        this.onLastLoop = new Signal();
        this.onEnd = new Signal();
        this.onLand = new Signal();

        this.updateTextures();

        this.dimSprites = [...this.sprites, ...this.blurred];
    }

    dim() {
        for (let i = 0; i < this.dimSprites.length; i++)
            tweens.tint(this.dimSprites[i]).start().to(0x999999, 0.5, 'cubic');
    }

    undim() {
        for (let i = 0; i < this.dimSprites.length; i++)
            tweens.tint(this.dimSprites[i]).start().to(0xffffff, 0.5, 'cubic');
    }

    createClipTexture(sprite) {
        var texture = new ClippedTexture(sprite.texture);
        texture.originalTexture = sprite.texture;
        sprite.texture = texture;
    }

    setType(symbolId) {
        this.type = symbolId;

        this.tween.stop(0);

        var symbol = settings.SYMBOL_DEFINITIONS[this.type];
        this.setOriginalTexture(this.sprites[0], PIXI.Texture.fromFrame(symbol.normalTexture));
        this.setOriginalTexture(this.blurred[0], PIXI.Texture.fromFrame(symbol.blurredTexture));

        symbol = settings.SYMBOL_DEFINITIONS[this.gemBag.pick()];
        this.setOriginalTexture(this.sprites[1], PIXI.Texture.fromFrame(symbol.normalTexture));
        this.setOriginalTexture(this.blurred[1], PIXI.Texture.fromFrame(symbol.blurredTexture));

        this.updateTextures();
    }

    setOriginalTexture(sprite, texture) {
        sprite.texture.originalTexture = texture;
        this.copyFrameParams(sprite.texture.originalTexture, sprite.texture);
    }

    updateTextures() {
        this.sprites[0].texture.crop.height = this.sprites[0].height = Math.min(SYMBOL_HEIGHT, SYMBOL_HEIGHT + this.tween.value);
        this.sprites[0].texture._updateUvs();
        this.sprites[0].position.y = -this.tween.value;

        this.sprites[1].texture.crop.y = this.sprites[1].texture.originalTexture.crop.y + this.tween.value + SYMBOL_HEIGHT;
        this.sprites[1].texture.crop.height = this.sprites[1].height = numbers.clamp(-this.tween.value, 0, SYMBOL_HEIGHT);
        this.sprites[1].texture._updateUvs();

        this.blurred[0].texture.crop.height = this.blurred[0].height = numbers.clamp(SYMBOL_HEIGHT + this.tween.value, 0, SYMBOL_HEIGHT);
        this.blurred[0].texture._updateUvs();
        this.blurred[0].position.y = SYMBOL_HEIGHT - this.blurred[0].height;

        this.blurred[1].texture.crop.y = this.blurred[1].texture.originalTexture.crop.y + this.tween.value + SYMBOL_HEIGHT;
        this.blurred[1].texture.crop.height = this.blurred[1].height = numbers.clamp(-this.tween.value, 0, SYMBOL_HEIGHT);
        this.blurred[1].texture._updateUvs();
    }

    pickRandomSymbol() {
        this.nextSymbolId = this.gemBag.pick();
    }

    start(delay) {
        if (this.tween.value < 0)
            this.swap();

        var time = 0.1;

        this.tween.start(0)
                  .delay(delay)
                  .to(10, 0.25, 'cubic')
                  .to(0, time, 'cubicIn')
                  .to(-SYMBOL_HEIGHT, time, null)
                  .to(0, 0, null, 'loop')
                  .call(this.sendOnLoop, this)
                  .to(-SYMBOL_HEIGHT, time, null, 'loopEnd')
                  .repeat(1, 'loop')
                  .to(0, 0, null)
                  .call(this.sendOnLastLoop, this)
                  .to(-SYMBOL_HEIGHT, time, null)
                  .call(this.hideBlur, this)
                  .signal(this.onEnd);

        this.blurTween.start(0)
                      .delay(delay + 0.25)
                      .to(1, 0.125, 'cubicIn');
    }

    respin(delay) {
        if (this.tween.value < 0)
            this.swap();

        var time = 0.1;

        this.tween.start(0)
                  .delay(delay)
                  .call(this.sendOnLastLoop, this)
                  .to(-SYMBOL_HEIGHT, time, null)
                  .call(this.hideBlur, this)
                  .signal(this.onEnd);

        this.alpha = 0;
        this.nextSymbolId = 'empty';
        this.swap();
    }

    hideBlur() {
        this.onLand.send(this);
        this.blurTween.stop(0);
        this.overlay.alpha = 0;
    }

    update(...args) {
        this.containerUpdate(...args);
        this.updateTextures();

        this.sprites[0].alpha = this.sprites[1].alpha = easings.cubicOut(1 - this.blurTween.value);

        this.blurred[0].alpha = this.blurred[1].alpha = this.blurTween.value;
    }

    copyFrameParams(from, to) {
        to.frame.x = from.frame.x;
        to.frame.y = from.frame.y;
        to.frame.width = from.frame.width;
        to.frame.height = from.frame.height;

        to.crop.x = from.crop.x;
        to.crop.y = from.crop.y;
        to.crop.width = from.crop.width;
        to.crop.height = from.crop.height;
    }

    swap() {
        if (!this.nextSymbolId)
            this.pickRandomSymbol();

        this.setOriginalTexture(this.sprites[0], this.sprites[1].texture.originalTexture);
        this.setOriginalTexture(this.sprites[1], PIXI.Texture.fromFrame(settings.SYMBOL_DEFINITIONS[this.nextSymbolId].normalTexture));

        this.setOriginalTexture(this.blurred[0], this.blurred[1].texture.originalTexture);
        this.setOriginalTexture(this.blurred[1], PIXI.Texture.fromFrame(settings.SYMBOL_DEFINITIONS[this.nextSymbolId].blurredTexture));

        this.updateTextures();

        this.type = this.nextSymbolId;

        this.nextSymbolId = null;
    }

    sendOnLoop() {
        this.onLoop.send(this);
        this.overlay.alpha = 1;
        this.swap();
    }

    sendOnLastLoop() {
        this.onLastLoop.send(this);
        this.overlay.alpha = 1;
        this.swap();
        this.alpha = 1;
    }
}

module.exports = Reel;
