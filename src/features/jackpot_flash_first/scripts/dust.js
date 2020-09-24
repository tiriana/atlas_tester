'use strict';

const {Container, PIXI, translatePosition, random, Polygon, tweens, colors} = require('@omnigame/core');

const SMOKE_FRAMES = [
    'jackpot_flash_first/particles/smoke/1.png',
    'jackpot_flash_first/particles/smoke/2.png',
    'jackpot_flash_first/particles/smoke/3.png'
];

class Dust extends Container {
    constructor(feature) {
        super();

        this.feature = feature;

        this.path = Polygon.fromSVG('M 1140 669 L 1219 1435 L 818 1435 L 893 669 Z');

        this.spawner = feature.particleContainer.emitter.createSpawner(this.onParticleSpawned, this);

        this.dropSpawner = feature.particleContainer.emitter.createSpawner(this.onDropSpawned, this, false, 20);
        this.smokeSpawner = feature.particleContainer.emitter.createSpawner(this.onSmokeSpawned, this, false, 5);
    }

    update(elapsed) {
        super.update(elapsed);

        for (var i = 0; i < this.feature.particleContainer.emitter.aliveParticles.size; i++) {
            var p = this.feature.particleContainer.emitter.aliveParticles[i];

            if (p.owner !== this)
                continue;

            if (this.path.isPointInside(p.position))
                p.alpha *= (1 + this.feature.topLight.alpha);
        }
    }

    onParticleSpawned(spawner, particle) {
        particle.layer = 'jackpotFlashParticlesAdd';

        particle.life = 5;

        particle.owner = this;

        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.texture = random.choice(SMOKE_FRAMES);

        particle.rotation = random.uniform(0, Math.PI * 2);

        particle.position.x = 1024 + random.uniform(-300, 300);
        particle.position.y = random.uniform(700, 1024);
        translatePosition(this, particle.parent, particle.position);

        particle.scaleTimeline.reset(0.05);

        particle.alphaTimeline.reset(0).to(0.5, particle.life / 2).to(0, particle.life);

        var angle = random.uniform(0, Math.PI * 2);

        particle.directionTimeline.reset(angle)
                                  .to(random.uniform(-90, 90) * Math.PI / 180, particle.life / 2, null, true)
                                  .to(random.uniform(-90, 90) * Math.PI / 180, particle.life, null, true);

        particle.speedTimeline.reset(10);
    }

    onDropSpawned(spawner, particle) {
        particle.layer = 'jackpotFlashEffects';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.life = random.uniform(0.5, 1);

        particle.texture = 'jackpot_flash_first/particles/dust/1.png';

        particle.position.x = 1024 + random.uniform(-300, 300);
        particle.position.y = random.uniform(300, 700);
        translatePosition(this, particle.parent, particle.position);

        tweens.alpha(particle).start(0).to(1, particle.life / 2).to(0, particle.life / 2);

        particle.usePhysics = true;

        particle.tint = colors.hsv2hex(36 / 255, 0.84, random.uniform(0.2, 0.45));

        particle.rotation = Math.PI / 2;

        tweens.rotation(particle).start().by(random.uniform(-5, 5) * Math.PI / 180, particle.life);

        particle.scale.set(random.uniform(0.0625, 0.25));
        particle.scale.x *= 4;

        particle.velocity.x = random.uniform(-100, 100);
        particle.velocity.y = 500;
        particle.gravity.y = 500;
    }

    onSmokeSpawned(spawner, particle) {
        particle.layer = 'jackpotFlashEffects';

        particle.life = 3;

        particle.owner = this;

        particle.texture = random.choice(SMOKE_FRAMES);

        particle.rotation = random.uniform(0, Math.PI * 2);

        particle.position.x = 1024 + random.uniform(-300, 300);
        particle.position.y = 1024 + 200;
        translatePosition(this, particle.parent, particle.position);

        particle.tint = colors.hsv2hex(40 / 255, 0.18, random.uniform(0.2, 0.4));

        tweens.scale(particle).start(3).to(5, particle.life);
        tweens.alpha(particle).start(0).to(0.5, particle.life / 2).to(0, particle.life / 2);

        var angle = random.uniform(0, Math.PI * 2);

        tweens.rotation(particle).start().by(random.uniform(-20, 20) * Math.PI / 180, particle.life, 'cubicIn');

        particle.directionTimeline.reset(angle)
                                  .to(random.uniform(-90, 90) * Math.PI / 180, particle.life / 2, null, true)
                                  .to(random.uniform(-90, 90) * Math.PI / 180, particle.life, null, true);

        particle.speedTimeline.reset(30);
    }
}

module.exports = Dust;
