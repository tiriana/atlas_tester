'use strict';

const {PIXI, Container, sprite, MovieClip, translatePosition, random, tweens, Polygon, features} = require('@omnigame/core');

const WILD_PATH = Polygon.fromSVG('M 48 6 L 56 20 L 56 28 L 68 47 L 62 53 L 62 67 L 52 44 L 48 28 L 45 23 L 48 17 L 48 6 Z');

const Credits = require('../../gui/scripts/credits');
const Shatter = require('../../../scripts/shatter');

const SCATTERED_FRAMES = [[], [], []];

for (let i = 0; i < 29; i++) {
    SCATTERED_FRAMES[0].push(`main/effects/scattered_highlights/cat_left/${i}.png`);
    SCATTERED_FRAMES[1].push(`main/effects/scattered_highlights/cat_right/${i}.png`);
    SCATTERED_FRAMES[2].push(`main/effects/scattered_highlights/nefertiti/${i}.png`);
}

const SMOKE_TEXTURES = [
    'main/particles/smoke/1.png',
    'main/particles/smoke/2.png',
    'main/particles/smoke/3.png'
];

class Symbol extends Container {
    constructor(feature) {
        super();

        this.game = require('../../../scripts/main');

        this.type = '';

        this.frame = sprite('main/symbols/frame_black.png').addTo(this).hide().sprite;

        this.sprite = new PIXI.Sprite();
        this.addChild(this.sprite);

        this.glow = new PIXI.Sprite();
        this.glow.visible = false;
        this.addChild(this.glow);

        this.background = sprite('main/effects/symbol_background.png').addTo(this).blending('ADD').layer('mainParticlesAdd').hide().sprite;

        this.winAmount = new Credits();
        this.winAmount.visible = false;
        this.winAmount.alpha = 0;
        this.winAmount.layer = 'guiParticlesAdd';
        this.addChild(this.winAmount);

        this.shatter = new Shatter();
        this.shatter.visible = false;
        this.addChild(this.shatter);

        this.highlight = new MovieClip(SCATTERED_FRAMES[0]);
        this.highlight.anchor.set(0.5);
        this.highlight.animationSpeed = 30;
        this.highlight.blendMode = PIXI.BLEND_MODES.ADD;
        this.highlight.layer = 'mainParticlesAdd';
        this.highlight.visible = false;
        this.addChild(this.highlight);

        this.wildSmokeSpawner = feature.particleContainer.emitter.createSpawner(this.onWildSmokeSpawned, this, false, 5);

        this.dimSprites = [this.sprite, this.frame];
    }

    dim() {
        for (let i = 0; i < this.dimSprites.length; i++)
            tweens.tint(this.dimSprites[i]).start().to(0x555555, 0.5, 'cubic');
    }

    undim() {
        for (let i = 0; i < this.dimSprites.length; i++)
            tweens.tint(this.dimSprites[i]).start().to(0xffffff, 0.5, 'cubic');
    }

    setType(symbolId) {
        this.type = symbolId;

        switch (symbolId) {
            case 'scattered':
                this.glow.texture = PIXI.Texture.fromFrame(settings.SYMBOL_DEFINITIONS[symbolId].normalTextureGlow);
                this.sprite.texture = PIXI.Texture.fromFrame(settings.SYMBOL_DEFINITIONS[symbolId].normalTextureBig);

                this.highlight.textures = SCATTERED_FRAMES[features.main.scatteredCollected[features.gui.betPanel.rawBetRate]];
                break;
            case 'purple':
                this.frame.texture = 'main/symbols/frame_purple.png';
                this.sprite.texture = PIXI.Texture.fromFrame(settings.SYMBOL_DEFINITIONS[symbolId].normalTexture);
                break;
            case 'white':
                this.frame.texture = 'main/symbols/frame_white.png';
                this.sprite.texture = PIXI.Texture.fromFrame(settings.SYMBOL_DEFINITIONS[symbolId].normalTexture);
                break;
            case 'black':
                this.frame.texture = 'main/symbols/frame_black.png';
                this.sprite.texture = PIXI.Texture.fromFrame(settings.SYMBOL_DEFINITIONS[symbolId].normalTexture);
                break;
            default:
                this.sprite.texture = PIXI.Texture.fromFrame(settings.SYMBOL_DEFINITIONS[symbolId].normalTexture);
        }

        this.setShatterType(symbolId);

        this.sprite.autoAnchor();
        this.glow.autoAnchor();
    }

    setShatterType(symbolId) {
        if (symbolId === 'scattered')
            this.shatter.texture = PIXI.Texture.fromFrame(settings.SYMBOL_DEFINITIONS[symbolId].normalTextureBig);
        else
            this.shatter.texture = PIXI.Texture.fromFrame(settings.SYMBOL_DEFINITIONS[symbolId].normalTexture);

        this.shatter.updateVertices();
        this.shatter.updateUVs();
        this.shatter.scale.set(1);
        this.shatter.pivot.set(0.5 * this.shatter.texture.width, 0.5 * this.shatter.texture.height);
    }

    reset() {
        this.sprite.texture = PIXI.Texture.EMPTY;
        this.sprite.scale.set(1);
        this.shatter.scale.set(1);
        this.winAmount.scale.set(1);
        this.winAmount.position.set(0, 0);
        this.sprite.alpha = 1;
        this.glow.alpha = 0;
        this.winAmount.alpha = 0;
        this.winAmount.visible = false;
        this.shatter.visible = false;
        this.background.visible = false;
    }

    onWildSmokeSpawned(spawner, particle) {
        particle.life = random.uniform(2, 3);
        particle.texture = random.choice(SMOKE_TEXTURES);
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        WILD_PATH.getRandomPosition(particle.position);

        particle.position.x -= 50;
        particle.position.y -= 35;

        translatePosition(this, particle.parent, particle.position);

        var angle = random.uniform(0, 2) * Math.PI;
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var speed = random.uniform(5, 10);

        particle.velocity.x = cos * speed;
        particle.velocity.y = sin * speed;

        particle.usePhysics = true;

        particle.gravity.y = -10;

        particle.rotation = random.uniform(0, 2) * Math.PI;

        particle.tint = 0x39a6a6;

        tweens.alpha(particle).start(0).to(1, particle.life / 2).to(0, particle.life / 2);

        tweens.scale(particle).start(0).to(random.uniform(0.5, 1), particle.life);
    }
}

module.exports = Symbol;
