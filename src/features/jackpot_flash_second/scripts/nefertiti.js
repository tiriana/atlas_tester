'use strict';

const {Container, Spine, PIXI, translatePosition, random} = require('@omnigame/core');

const SMOKE_FRAMES = [
    'jackpot_flash_second/particles/smoke/1.png',
    'jackpot_flash_second/particles/smoke/2.png',
    'jackpot_flash_second/particles/smoke/3.png'
];

class Nefertiti extends Container {
    constructor(feature) {
        super();

        this.spine = Spine.fromId('features/jackpot_flash_second/spine/nefertiti.json');
        this.spine.state.setAnimation(0, 'nefertiti', true);
        this.spine.state.setAnimation(1, 'cat', true);
        this.spine.skeleton.setSkinByName('default');
        this.addChild(this.spine);

        this.spine.state.data.defaultMix = 0.25;

        this.handCenter = this.spine.skeleton.findBone('hand_center');

        this.spawner = feature.particleContainer.emitter.createSpawner(this.onFlameSpawned, this, false, 30);

        this.blinkTimer = 0;
    }

    update(elapsed) {
        this.containerUpdate(elapsed);

        this.blinkTimer -= elapsed;

        if (this.blinkTimer <= 0) {
            this.spine.state.setAnimation(3, 'blink', false);
            this.blinkTimer = random.uniform(2, 3);
        }
    }

    onFlameSpawned(spawner, particle) {
        particle.layer = 'jackpotFlashEffects';

        particle.position.set(this.handCenter.worldX, this.handCenter.worldY);
        translatePosition(this.spine, particle.parent, particle.position);

        particle.position.x -= 5;
        particle.position.y -= 10;

        if (random.uniform() < 0.8) {
            particle.life = random.uniform(1.5, 2);

            particle.blendMode = PIXI.BLEND_MODES.ADD;

            particle.texture = PIXI.Texture.fromFrame(random.choice(SMOKE_FRAMES));

            particle.rotation = random.uniform(0, Math.PI * 2);

            particle.position.x += random.uniform(-2, 2);

            particle.directionTimeline.reset(-Math.PI / 2);

            particle.speedTimeline.reset(0).to(100, particle.life);

            particle.scaleTimeline.reset(0).to(0.75, particle.life * 0.3).to(0.5, particle.life);
                        
            particle.alphaTimeline.reset(0.75).to(0, particle.life, 'cubicIn');

            particle.tintTimeline.reset(0x26466b);
        } else {
            particle.life = random.uniform(0.5, 1);

            particle.blendMode = PIXI.BLEND_MODES.ADD;

            particle.texture = PIXI.Texture.fromFrame('jackpot_flash_second/square.png');

            particle.rotation = random.uniform(0, Math.PI * 2);

            particle.position.x += random.uniform(-10, 10);
            particle.position.y += random.uniform(-10, -30);

            particle.usePhysics = true;

            particle.alphaTimeline.reset(1);

            particle.tintTimeline.reset(0x26466b);

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

module.exports = Nefertiti;