'use strict';

const {sprite, Flare, tweens, random, PIXI, Path} = require('@omnigame/core');

class FlareDoor extends Flare {
    constructor() {
        super(function(spawner, particle) {
            var angle;

            var r = random.uniform();

            if (r < 0.25) {
                particle.texture = PIXI.Texture.fromFrame('jackpot_flash_first/flare_beam_narrow.png');
                particle.anchor.set(0, 0.5);
                particle.blendMode = PIXI.BLEND_MODES.ADD;

                this.path.getRandomPosition(particle.position);

                particle.position.x -= 186 / 2;
                particle.position.y -= 281 / 2;

                particle.position.x *= 0.75;
                particle.position.y *= 0.75;

                angle = Math.atan2(particle.position.y, particle.position.x);

                particle.rotation = angle;

                particle.scaleTimeline.enabled = false;

                tweens.alpha().start(0).to(1, particle.life / 2).to(0, particle.life / 2);
                tweens.scale().start(1).to(2, particle.life);
            } else if (r < 0.75) {
                particle.texture = PIXI.Texture.fromFrame('jackpot_flash_first/particles/flares/1.png');
                particle.blendMode = PIXI.BLEND_MODES.ADD;
                particle.layer = 'debug';

                this.path.getRandomPosition(particle.position);

                particle.position.x -= 186 / 2;
                particle.position.y -= 281 / 2;

                tweens.scale().start(0).to(random.uniform(0.125, 1), particle.life / 2).to(0, particle.life / 2);
            } else {
                particle.texture = PIXI.Texture.fromFrame('jackpot_flash_first/particles/flares/1.png');
                particle.blendMode = PIXI.BLEND_MODES.ADD;
                particle.layer = 'debug';

                this.path.getRandomPosition(particle.position);

                particle.position.x -= 186 / 2;
                particle.position.y -= 281 / 2;

                particle.scaleTimeline.enabled = false;

                tweens.scale().start(0).to(random.uniform(0.125, 1), particle.life / 2).to(0, particle.life / 2);
                tweens.position().start().by(particle.position.x / 8, particle.position.y / 8, particle.life, 'sineOut');
            }
        }, 150);

        this.path = Path.fromSVG('M 0,0 L 187,0 L 187,281 L 0,281 L 0,0');
        this.rotationSpeed = 0;

        var texture = PIXI.Texture.fromFrame('jackpot_flash_first/door.png');

        sprite('jackpot_flash_first/square.png').addTo(this).width(texture.crop.width).height(texture.crop.height).position(-1, 0).sprite;
    }
}

module.exports = FlareDoor;
