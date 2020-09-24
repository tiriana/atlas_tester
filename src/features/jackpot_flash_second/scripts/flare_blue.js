'use strict';

const {sprite, Flare, tweens, random, PIXI} = require('@omnigame/core');

class FlareBlue extends Flare {
    constructor() {
        super(function(spawner, particle) {
            var angle = random.uniform(0, 2 * Math.PI);

            if (random.uniform() < 0.05) {
                particle.life = 2;
                particle.texture = PIXI.Texture.fromFrame('jackpot_flash_second/flare_beam.png');
                particle.anchor.set(0, 0.5);

                particle.blendMode = PIXI.BLEND_MODES.ADD;

                particle.rotation = angle;

                particle.scaleTimeline.enabled = false;

                tweens.alpha().start(0).to(1, particle.life / 2).to(0, particle.life / 2);
                tweens.scaleXY().start(1, 0.5).to(2, 1, particle.life);
            } else {
                particle.texture = PIXI.Texture.fromFrame('jackpot_flash_second/particles/flares/1.png');

                particle.blendMode = PIXI.BLEND_MODES.ADD;

                var cos = Math.cos(angle);
                var sin = Math.sin(angle);

                var radius = random.uniform(20, 100);

                particle.position.x = radius * cos;
                particle.position.y = radius * sin;

                particle.scaleTimeline.enabled = false;

                tweens.scale().start(0).to(random.uniform(0.125, 1), particle.life / 2).to(0, particle.life / 2);
                tweens.position().start().by(particle.position.x / 8, particle.position.y / 8, particle.life, 'sineOut');
            }
        }, 50);

        this.rotationSpeed = 0;

        sprite('jackpot_flash_second/flare.png').addTo(this).rotation(random.uniform(0, 2 * Math.PI)).blending('ADD').sprite;
        sprite('jackpot_flash_second/flare.png').addTo(this).rotation(random.uniform(0, 2 * Math.PI)).blending('ADD').sprite;
    }

    update(elapsed) {
        super.update(elapsed);

        this.children[0].rotation = 0.1 * elapsed;
        this.children[1].rotation -= 0.1 * elapsed;
    }
}

module.exports = FlareBlue;
