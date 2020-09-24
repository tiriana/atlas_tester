'use strict';

const {PIXI, Container, tweens, random, sprite, container, Emitter, MovieClip, translatePosition, features} = require('@omnigame/core');


const ORB_FRAMES = [];

for (var i = 0; i <= 49; i++)
    ORB_FRAMES.push(`main/orb/${i}.png`);

class Ring extends PIXI.Container {
    constructor(shader) {
        super();

        this.spriteRotationSpeed = random.uniform(0.5, 1);

        this.sprite = sprite('main/prize_orb/ring_rotating.png').addTo(this).anchor(0.5, 0.47).rotation(random.uniform(0, 2) * Math.PI).shader(shader).blending('ADD');
    }

    update(elapsed) {
        this.children[0].rotation -= this.spriteRotationSpeed * elapsed;
    }
}

class PrizeOrb extends Container {
    constructor(ringsCount, feature) {
        super();

        this.game = require('../../../scripts/main');

        this.state = settings.ORB_STATES.IDLE;

        this.flare1 = sprite('main/prize_orb/flare.png').addTo(this).rotation(random.uniform(0, 2 * Math.PI)).shader(feature.hueShader).blending('ADD').scale(0).sprite;
        this.flare2 = sprite('main/prize_orb/flare.png').addTo(this).rotation(random.uniform(0, 2 * Math.PI)).shader(feature.hueShader).blending('ADD').scale(0).sprite;
        this.circle = sprite('main/prize_orb/flare_circle.png').addTo(this).shader(feature.hueShader).blending('ADD').scale(1.5).sprite;

        this.flareEmitter = new Emitter();
        this.flareEmitter.onParticleCreated(this.onFlareCreated, this);

        this.flareBeamSpawner = this.flareEmitter.createSpawner(this.onBeamSpawned, this, false, 5);
        this.outerRingSpawner = features.main.particleContainer.emitter.createSpawner(this.onRingSpawned, this, false, 3);
        this.dustSpawner = features.main.particleContainer.emitter.createSpawner(this.onDustSpawned, this, false, 50);
        this.flameSpawner = features.main.particleContainer.emitter.createSpawner(this.onFlameSpawned, this, true, 5);

        this.clip = sprite(new MovieClip(ORB_FRAMES)).anchor(0.5).blending('ADD').shader(feature.hueShader).addTo(this).sprite;
        this.clip.play(random.integer(0, ORB_FRAMES.length));
        this.clip.loop = true;
        this.clip.animationSpeed = 16;

        this.preLightningClip = sprite(new MovieClip(settings.PRE_LIGHTNING_FRAMES))
                                .addTo(this)
                                .position(0, 50)
                                .pivot(28, 30)
                                .scale(2, 2)
                                .rotation(Math.PI)
                                .shader(feature.hueShader)
                                .blending('ADD')
                                .hide()
                                .sprite;

        this.rings = [];

        for (var i = 0; i < ringsCount; i++)
            this.rings.push(container(new Ring(feature.hueShader)).addTo(this).scale(1, 0.25).rotation((i * 60 - 30) * Math.PI / 180).hide().instance);

        tweens.scale(this.circle).start(1.5).to(1.6, 1, 'sine').to(1.5, 1, 'sine').repeat().randomize();
        this.scale.set(0.5);

        this.hueShader = feature.hueShader;
    }

    update(elapsed) {
        super.update(elapsed);

        this.flare1.rotation += 0.1 * elapsed;
        this.flare2.rotation -= 0.1 * elapsed;
    }

    onFlareCreated(particle) {
        this.addChild(particle);
    }

    onRingSpawned(spawner, particle) {
        particle.layer = 'mainParticles';
        particle.textures = this.clip.textures;
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.life = 2;

        translatePosition(this, particle.parent, particle.position);

        var scale = random.uniform(0.5, 1);
        var squish = random.uniform(0.125, 0.875);
        particle.scale.set(scale, scale * squish);

        particle.rotation = random.uniform(0, 2) * Math.PI;
        tweens.scaleXY().start(0, 0).to(3 * scale, 3 * scale * squish, particle.life, 'sineIn');
        tweens.alpha().start(0).to(1, particle.life / 2).to(0, particle.life / 2);

        particle.textureTimeline.reset(0).to(46, particle.life);
    }

    onBeamSpawned(spawner, particle) {
        particle.layer = 'mainParticles';
        var angle = random.uniform(0, 2 * Math.PI);
        particle.life = 2;
        particle.texture = PIXI.Texture.fromFrame('main/prize_orb/flare_beam.png');
        particle.shader = this.hueShader;
        particle.anchor.set(0, 0.5);

        translatePosition(this, particle.parent, particle.position);

        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.rotation = angle;

        particle.scaleTimeline.enabled = false;

        tweens.alpha().start(0).to(1, particle.life / 2).to(0, particle.life / 2);
        tweens.scaleXY().start(1, 0.5).to(2, 1, particle.life);
    }

    onDustSpawned(spawner, particle) {
        particle.layer = 'mainParticles';
        var angle = random.uniform(0, 2 * Math.PI);
        particle.texture = PIXI.Texture.fromFrame('main/prize_orb/1.png');

        particle.blendMode = PIXI.BLEND_MODES.ADD;

        var cos = Math.cos(angle);
        var sin = Math.sin(angle);

        var radius = random.uniform(20, 100);

        var x = particle.position.x = radius * cos;
        var y = particle.position.y = radius * sin;

        translatePosition(this, particle.parent, particle.position);

        particle.scaleTimeline.enabled = false;

        tweens.scale().start(0).to(random.uniform(0.125, 1), particle.life / 2).to(0, particle.life / 2);
        tweens.position().start().by(x / 8, y / 8, particle.life, 'sineOut');
    }

    onFlameSpawned(spawner, particle) {
        var angle, cos, sin;
        particle.layer = 'mainParticles';

        translatePosition(this, particle.parent, particle.position);

        particle.life = random.uniform(0.5, 1);

        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.texture = PIXI.Texture.fromFrame('main/square.png');

        particle.rotation = random.uniform(0, Math.PI * 2);

        particle.position.x += random.uniform(-10, 10);
        particle.position.y += random.uniform(-10, -30);

        particle.usePhysics = true;

        particle.alphaTimeline.reset(1);

        particle.tintTimeline.reset(0x26466b);

        particle.scaleTimeline.reset(0.25).to(0, particle.life, 'cubicIn');

        angle = (-90 + random.uniform(-10, 10)) * Math.PI / 180;
        cos = Math.cos(angle);
        sin = Math.sin(angle);

        particle.velocity.x = cos * 50;
        particle.velocity.y = sin * 50;

        particle.gravity.y = 50;
    }
}

module.exports = PrizeOrb;
