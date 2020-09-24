'use strict';

const {PIXI, Container, sprite, translatePosition, random, MovieClip, tweens} = require('@omnigame/core');

const HueShader = require('../../../scripts/hue_shader');

const hueShader = new HueShader(0.45);

const SMOKE_TEXTURES = [
    'main/particles/smoke/1.png',
    'main/particles/smoke/2.png',
    'main/particles/smoke/3.png'
];

const SHOCKWAVE_TEXTURES = [];

for (var i = 0; i < 48; i++)
    SHOCKWAVE_TEXTURES[i] = `gui/shockwave/${i}.jpg`;

class TopMultiplier extends Container {
    constructor(feature) {
        super();

        this.game = require('../../../scripts/main');

        this.glow = sprite('main/top_multiplier/background.png').position(-1, 9).alpha(0.75).addTo(this).sprite;

        tweens.alpha(this.glow).start(0.5).to(0.75, 2).to(0.5, 2).repeat();

        this._value = 0;

        this.number = new Container();
        this.addChild(this.number);
        this.number.alpha = 0;

        this.number.digit = new MovieClip(settings.GUI_NUMBER_FRAMES[2]);
        this.number.digit.position.set(-5, 0);
        this.number.addChild(this.number.digit);

        this.number.digit.loop = true;
        this.number.digit.animationSpeed = 20;
        this.number.digit.blendMode = PIXI.BLEND_MODES.ADD;
        this.number.digit.anchor.set(0.5, 0.5);
        this.number.digit.shader = hueShader;
        this.number.digit.play(0);

        this.number.xSprite = new MovieClip(settings.GUI_NUMBER_FRAMES['x']);
        this.number.xSprite.position.set(15, 5);
        this.number.addChild(this.number.xSprite);

        this.number.xSprite.loop = true;
        this.number.xSprite.animationSpeed = 20;
        this.number.xSprite.blendMode = PIXI.BLEND_MODES.ADD;
        this.number.xSprite.anchor.set(0.5, 0.5);
        this.number.xSprite.shader = hueShader;
        this.number.xSprite.play(0);

        this.dustSpawner = feature.particleContainer.emitter.createSpawner(this.onDustSpawned, this, true, 20);
        this.smokeSpawner = feature.particleContainer.emitter.createSpawner(this.onSmokeSpawned, this, true, 10);

        this.shockwaves = [];
        for (var i = 0; i < 10; i++) {
            var shockwave = new MovieClip(SHOCKWAVE_TEXTURES);
            shockwave.blendMode = PIXI.BLEND_MODES.ADD;
            shockwave.scale.set(2);
            shockwave.anchor.set(0.5);
            shockwave.animationSpeed = 30;
            shockwave.tint = 0x1c8085;
            this.addChild(shockwave);
            this.shockwaves.push(shockwave);
        }
    }

    playShockwave() {
        for (var i = 0; i < this.shockwaves.length; i++)
            if (!this.shockwaves[i].playing) {
                this.shockwaves[i].play();
                return this.shockwaves[i];
            }
        return null;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
        this.number.digit.textures = settings.GUI_NUMBER_FRAMES[value];
    }

    add() {
        var index = settings.TOP_MULTIPLIER_VALUES.indexOf(this._value);
        index = Math.min(index + 1, settings.TOP_MULTIPLIER_VALUES.length - 1);
        this.value = settings.TOP_MULTIPLIER_VALUES[index];
    }

    subtract() {
        var index = settings.TOP_MULTIPLIER_VALUES.indexOf(this._value);
        index = Math.max(index - 1, 0);
        this.value = settings.TOP_MULTIPLIER_VALUES[index];
    }

    onDustSpawned(spawner, particle) {
        particle.layer = 'mainParticlesAdd';
        particle.texture = 'main/particles/trails/teal.png';

        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.position.x = random.uniform(-100, 100);
        particle.position.y = random.uniform(-20, 20);

        translatePosition(this, particle.parent, particle.position);

        particle.usePhysics = true;
        particle.gravity.y = -50;

        particle.scaleTimeline.reset(0).to(random.uniform(0.25, 0.75), particle.life / 2).to(0, particle.life);
    }

    onSmokeSpawned(spawner, particle) {
        particle.life = 2;
        particle.layer = 'mainParticlesAdd';
        particle.texture = random.choice(SMOKE_TEXTURES);

        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.tintTimeline.reset(0x5cdcdc);

        particle.position.x = random.uniform(-100, 100);
        particle.position.y = random.uniform(-10, 20);

        particle.rotation = random.uniform(0, 2) * Math.PI;

        translatePosition(this, particle.parent, particle.position);

        particle.usePhysics = true;
        particle.gravity.y = -10;

        particle.rotationSpeedTimeline.reset(random.uniform(0.05, 0.1) * random.sign());
        particle.scaleTimeline.reset(random.uniform(0.25, 0.5));
        particle.alphaTimeline.reset(0).to(0.5, particle.life / 2).to(0, particle.life);
    }
}

module.exports = TopMultiplier;
