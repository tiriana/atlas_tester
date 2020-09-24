'use strict';


const { State, tweens, PIXI, translatePosition, random, features } = require('@omnigame/core');

const SHOCKWAVE_TEXTURES = [];

for (var i = 0; i < 48; i++)
    SHOCKWAVE_TEXTURES[i] = `gui/shockwave/${i}.jpg`;


const tempPoint = new PIXI.Point();

class SecondShowPrize extends State {
    create() {
        this.nextStates = {};
        this.nextStates.BigWin = require('./big_win');

        this.oldProjectilePosition = new PIXI.Point();
    }

    enter(feature, results) {
        this.results = results;

        this.prize = feature.prizes[results.prizeIndex];

        feature.particleContainer.emitter.spawnInstantly(50, this.onExplosionParticleSpawned);
        feature.particleContainer.emitter.spawnInstantly(1, this.onShockwaveSpawned);

        for (var i = 0; i < feature.prizes.length; i++) {
            var prize = feature.prizes[i];

            if (prize === this.prize)
                continue;

            tempPoint.set(0, 0);

            translatePosition(this.prize.counter, prize.counter, tempPoint);

            tweens.position(prize.swayContainer).start().by(-tempPoint.x, -tempPoint.y, 1).to(0, 0, 0);
            tweens.scale(prize.swayContainer).start().to(0, 1).to(1, 0);

            tweens.alpha(prize).start().to(0, 0.25);
        }

        this.prize.flare.alpha = 1;
        tweens.scale(this.prize.swayContainer).start().to(2, 0.5, 'cubicOut');
        tweens.alpha(this.prize.flare).start().to(1, 0.125);
        tweens.scale(this.prize.flare).start(0.25).to(1, 0.5, 'cubicOut').delay(2).call(this.outroToBigWin);
    }

    onExplosionParticleSpawned(feature, particle) {
        var angle, cos, sin, speed;
        if (random.uniform() < 0.75) {
            particle.texture = PIXI.Texture.fromFrame('jackpot_flash_second/particles/flares/1.png');
            particle.layer = 'jackpotFlashEffects';
            particle.usePhysics = true;
            particle.blendMode = PIXI.BLEND_MODES.ADD;

            particle.life = random.uniform(0.5, 2);

            translatePosition(this.prize, particle.parent, particle.position);

            tweens.scale().start(2).to(0, particle.life, 'cubicIn');

            particle.rotation = random.uniform(0, 2) * Math.PI;
            particle.rotationSpeedTimeline.reset(random.uniform(-0.1, 0.1));
            particle.tintTimeline.reset(0x376bae);

            angle = random.uniform(0, 2) * Math.PI;
            cos = Math.cos(angle);
            sin = Math.sin(angle);
            speed = random.uniform(50, 200);

            particle.velocity.x = cos * speed;
            particle.velocity.y = sin * speed;

            particle.friction = 50;

            particle.gravity.y = 100;
        } else {
            particle.texture = PIXI.Texture.fromFrame('jackpot_flash_second/particles/projectile.png');
            particle.layer = 'jackpotFlashEffects';
            particle.usePhysics = true;
            particle.blendMode = PIXI.BLEND_MODES.ADD;

            translatePosition(this.prize, particle.parent, particle.position);

            angle = random.uniform(0, 2) * Math.PI;
            cos = Math.cos(angle);
            sin = Math.sin(angle);
            speed = random.uniform(300, 500);

            particle.velocity.x = cos * speed;
            particle.velocity.y = sin * speed;

            particle.rotationFromDirection = true;

            particle.gravity.y = 100;

            tweens.scaleXY().start(random.uniform(1, 2), 0.5).to(0, 0, particle.life);
            tweens.alpha().start(1).to(0, particle.life, 'cubicIn');
        }
    }

    onShockwaveSpawned(feature, particle) {
        particle.textures = SHOCKWAVE_TEXTURES;

        particle.layer = 'jackpotFlashEffects';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.scale.set(2, 2);

        translatePosition(this.prize, particle.parent, particle.position);

        particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.life);
        particle.tintTimeline.reset(0x7fe2f8);
    }

    outroToBigWin() {
        this.playFlareExplosionSound();
        tweens.scale(this.prize.flare).start()
            .to(0.8, 0.125)
            .to(200, 0.5, 'cubicIn');

        features.gui.overlay.tint = 0xffffff;
        tweens.alpha(features.gui.overlay).start()
            .delay(0.125)
            .to(1, 0.5, 'cubicIn')
            .call(this.startSubtleZoomOut)
            .call(this.showBigWin)
            .to(0, 1, 'cubicIn')
            .set('tint', 0x000000);
    }

    playFlareExplosionSound(feature) {
        feature.audioGroup.track('gui/white_flash.m4a').play();
    }

    startSubtleZoomOut(feature) {
        tweens.scale(feature.container).start().to(1, 0.125, 'cubicIn');
        tweens.positionY(feature.container).start().to(1024, 0.125, 'cubicIn');
    }

    showBigWin(feature) {
        var flare = this.prize.flare;

        features.gui.bigWin.alpha = 1;

        this.prize.alpha = 0;

        flare.alpha = 0;
        flare.scale.set(1);

        this.prize.swayContainer.scale.set(1);
        this.prize.counter.value.children[0].alpha = 1;

        var amount = this.prize.counter.amount;
        if (this.prize.counter.showCurrency)
            amount = this.results.jackpotValue;

        feature.states.change(this.nextStates.BigWin, amount, this.prize.counter.showCurrency);
    }
}


module.exports = SecondShowPrize;
