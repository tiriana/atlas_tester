'use strict';

const {Container, sprite, container, ClippedTexture, tweens, PIXI, random, translatePosition, colors} = require('@omnigame/core');
const FlareDoor = require('./flare_door');

class PrizeDoor extends Container {
    constructor(feature) {
        super();

        this.game = require('../../../scripts/main');

        this.flare = container(new FlareDoor()).alpha(0).addTo(this).layer('jackpotFlashDoorEffects').instance;
        this.door = sprite('jackpot_flash_first/door.png').anchor(0.5, 0).addTo(this).layer('jackpotFlashDoor').sprite;
        this.door.position.y = -this.door.height / 2;
        this.light = sprite('jackpot_flash_first/door_light.png').position(0, 7).alpha(0).addTo(this).blending('ADD').layer('jackpotFlashDoor').sprite;

        var texture = new ClippedTexture(this.door.texture);
        texture.originalTexture = this.door.texture;
        this.door.texture = texture;

        this.tween = tweens.create(1);
        this._lastTweenValue = -1;

        this.dustSpawner = feature.particleContainer.emitter.createSpawner(this.onDustSpawned, this, false, 20);
    }

    update(elapsed) {
        super.update(elapsed);

        if (this._lastTweenValue !== this.tween.value) {
            this.door.texture.crop.height = this.door.height = this.door.texture.originalTexture.crop.height * this.tween.value;
            this.door.texture.crop.y = this.door.texture.originalTexture.crop.y + this.door.texture.originalTexture.crop.height * (1 - this.tween.value);
            this.door.texture._updateUvs();
        }

        this._lastTweenValue = this.tween.value;
        this.dustSpawner.spawnRate = (1 - this.tween.value) * 50;
    }

    onDustSpawned(spawner, particle) {
        particle.layer = 'jackpotFlashEffects';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.life = random.uniform(0.5, 1);

        particle.texture = 'jackpot_flash_first/particles/dust/1.png';

        particle.position.x = random.uniform(-0.5, 0.5) * 185;
        particle.position.y = this.door.height;
        translatePosition(this.door, particle.parent, particle.position);

        tweens.alpha(particle).start(1).to(0, particle.life);

        particle.usePhysics = true;

        particle.tint = colors.hsv2hex(36 / 255, random.uniform(0.2, 0.84), random.uniform(0.2, 0.45));

        particle.rotation = Math.PI / 2;

        tweens.rotation(particle).start().by(random.uniform(-5, 5) * Math.PI / 180, particle.life);

        particle.scale.set(random.uniform(0.0625, 0.125));
        particle.scale.x *= 2;

        particle.velocity.x = random.uniform(-50, 50);
        particle.velocity.y = 200;
        particle.gravity.y = 200;
    }
}

module.exports = PrizeDoor;
