'use strict';

const {Container, PIXI, translatePosition, random} = require('@omnigame/core');

const SMOKE_FRAMES = [
    'jackpot_flash_first/particles/smoke/1.png',
    'jackpot_flash_first/particles/smoke/2.png',
    'jackpot_flash_first/particles/smoke/3.png'
];

class Torch extends Container {
    constructor(feature) {
        super();

        this.flameSpawner = feature.particleContainer.emitter.createSpawner(this.onFlameSpawned, this);
    }

    onFlameSpawned(spawner, particle) {
        particle.layer = 'jackpotFlashTorchFire';

        if (random.uniform() < 0.8) {
            particle.life = random.uniform(1.5, 2);

            particle.blendMode = PIXI.BLEND_MODES.ADD;

            particle.texture = PIXI.Texture.fromFrame(random.choice(SMOKE_FRAMES));

            particle.rotation = random.uniform(0, Math.PI * 2);

            particle.position.x = random.uniform(-2, 2);
            translatePosition(this, particle.parent, particle.position);

            particle.directionTimeline.reset(-Math.PI / 2);

            particle.speedTimeline.reset(0).to(100, particle.life);

            particle.scaleTimeline.reset(0).to(0.75, particle.life * 0.3).to(0.5, particle.life);
                        
            particle.alphaTimeline.reset(0.75).to(0, particle.life, 'cubicIn');

            particle.tintTimeline.reset(0x8b3e0f);
        } else {
            particle.life = random.uniform(0.5, 1);

            particle.blendMode = PIXI.BLEND_MODES.ADD;

            particle.texture = PIXI.Texture.fromFrame('jackpot_flash_first/square.png');

            particle.rotation = random.uniform(0, Math.PI * 2);

            particle.position.x = random.uniform(-10, 10);
            particle.position.y = random.uniform(-10, -30);
            translatePosition(this, particle.parent, particle.position);

            particle.usePhysics = true;

            particle.alphaTimeline.reset(1);

            particle.tintTimeline.reset(0x8b3e0f);

            particle.scaleTimeline.reset(0.25).to(0, particle.life, 'cubicIn');

            var angle = (-90 + random.uniform(-10, 10)) * Math.PI / 180;
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);

            particle.velocity.x = cos * 100;
            particle.velocity.y = sin * 100;

            particle.gravity.y = 100;
        }
    }
}

module.exports = Torch;