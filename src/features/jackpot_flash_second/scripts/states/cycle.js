'use strict';

const { State, random, tweens, PIXI, translatePosition, numbers } = require('@omnigame/core');
const signals = require('../../../../scripts/signals');

const frames = (pattern, numFrames = 0, minFrameNum = 0) => {
    const frames = [];
    for (let i = minFrameNum; i < numFrames + minFrameNum; i++) {
        frames.push(pattern.replace('*', i));
    }
    return frames;
};

const preLightning = frames('jackpot_flash_second/effects/pre_lightning/*.png', 13, 1);
const implosion = frames('gui/implosion/*.png', 32);
const blueFlame = frames('jackpot_flash_second/effects/blue_flame/*.png', 18);
const lightning = frames('jackpot_flash_second/effects/lightning/*.png', 6);

class SecondCycle extends State {
    constructor(...args) {
        super(...args);

        this.initSounds();
    }

    initSounds(feature) {
        this.sounds = {
            'buildUp': feature.audioGroup.track('jackpot_flash_second/build_up.m4a'),
            'thunder': feature.audioGroup.track('jackpot_flash_second/light_up.m4a'),
            'shot': feature.audioGroup.effect('jackpot_flash_second/shot.m4a'),
        };
    }

    create() {
        this.nextStates = {};
        this.nextStates.ShowPrize = require('./show_prize');
    }

    enter() {
        this.results = null;

        signals.get.jackpotFlashSuperResults.send();
    }

    onSetJackpotFlashSuperResults(feature, results) {
        this.results = results;

        this.playTheAnimation();
    }

    playTheAnimation(feature) {
        const rotationTime = this.startWheelsFinalSpin();

        const buildUpOffset = Math.max(10 - rotationTime, 0);
        const cookingDelay = Math.max(random.uniform(4, 6) - buildUpOffset, 2);
        const shotDelay = rotationTime - 0.25;
        const shotSoundDelay = shotDelay - 3.545;

        this.startSubtleZoomIn(rotationTime);
        this.shakeScreenSubtle(rotationTime);
        this.playBuildUp(rotationTime, buildUpOffset);

        feature.game.schedule(cookingDelay, this.startCooking, this, rotationTime - cookingDelay);

        feature.game.schedule(shotSoundDelay, this.sounds.shot.play, this.sounds.shot);
        feature.game.schedule(shotDelay, this.playTheShotAnimation, this);
    }

    playBuildUp(feature, duration, offset = 0) {
        if (offset) {
            this.sounds.buildUp.fadeIn(1).play(false, 0, offset);
        } else {
            this.sounds.buildUp.play();
        }
        const fadeoOutLegth = 0.5;
        const delay = duration - fadeoOutLegth;
        this.sounds.buildUp.fadeOut(fadeoOutLegth, 0, delay).stop(fadeoOutLegth + 0.01 + delay);
    }

    startSubtleZoomIn(feature, duration) {
        const scaleMultiplier = 1.4;
        tweens
            .scale(feature.container)
            .start()
            .to(feature.container.scale.x * scaleMultiplier, duration, 'sineIn');
        tweens
            .positionY(feature.container)
            .start()
            .by(512 * (scaleMultiplier - 1), duration, 'sineIn');
    }

    startWheelsFinalSpin(feature) {
        return tweens.rotation(feature.prizeWheel).start().to(this.getWheelFinalRotation(), this.getFinalRotationTime()).call(this.onShotDone).duration;
    }

    onShotDone() {
        this.fixPrizesRotations();
        this.next(this.results);
    }

    startCooking(feature, time) {
        const { 'life': duration } = this.spawnFirstFlareFlashing(time);
        this.playPreLightning();
        this.spawnBlueFlame();
        this.spawnImplosion();

        this.playQuietThinder();

        return duration;
    }

    playQuietThinder() {
        this.sounds.thunder.play().fadeIn(0.1).fadeOut(2).stop(2.5);
    }

    playTheShotAnimation(feature) {
        this.shakeScreenStrong();
        this.startLightningShot();
        this.spawnBigBlueFlame();
        this.spawnSecondFlareFlashing();
        this.startPrizeExplosion();
        this.playFullscreenWhiteBlink();

        feature.nefertiti.spine.state.setAnimation(4, 'fire', false);
    }

    playFullscreenWhiteBlink() {
        const particle = this.spawnParticle();
        particle.scale.set(256, 256);
        particle.position.x = particle.position.y = 1024;
        particle.alpha = 0;
        particle.texture = PIXI.Texture.fromFrame('gui/square.png');
        particle.life = 0.5;

        tweens.alpha(particle).start().to(1, 0.125, 'cubic').to(0, 0.125, 'cubic');

        return particle;
    }

    getFinalRotationTime(feature) {
        return ((this.getWheelFinalRotation() - feature.prizeWheel.rotation) * feature.prizeWheel.wholeRotationTime) / 2 / Math.PI;
    }

    spawnParticle(feature) {
        const particle = feature.particleContainer.emitter.spawn(0, 0, 0);
        particle.layer = 'jackpotFlashEffects';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.alpha = 1;

        return particle;
    }

    moveToHand(feature, particle) {
        translatePosition(feature.nefertiti.spine, particle.parent, particle.position);

        particle.position.x += 230;
        particle.position.y += 250;

        return particle;
    }

    spawnParticleInHand() {
        return this.moveToHand(this.spawnParticle());
    }

    addFrames(feature, particle, frames, life = frames.length / 30) {
        particle.life = life;
        particle.textures = frames;
        particle.textureTimeline.reset(0).to(frames.length - 1, particle.life);

        return particle;
    }

    spawnFirstFlareFlashing(feature, duration) {
        const particle = this.spawnFlare();

        const blinkTime = 0.05;
        const initialDelay = 0.25;
        const introTime = 0.5;
        const outroTime = 0.25;
        const effectLife = Math.max(0, duration - outroTime - introTime);

        this.flashBackgroundSubtle(duration);

        tweens.tint(particle)
            .start(0xffffff)
            .delay(initialDelay)
            .to(0xcccccc, blinkTime, 'elastic', 'cooking')
            .delay(0.02)
            .to(0xeeeeee, blinkTime, 'elastic')
            .repeat(Infinity, 'cooking');

        tweens.scaleXY(particle).start(0, 0).to(1, 1, introTime, 'elasticOut').to(3, 1.2, effectLife, 'cubic').to(0, 0, outroTime, 'cubicOut');
        tweens.alpha(particle).start(0).to(0.9, introTime).delay(effectLife).call(this.spawnImplosion, this).to(0, outroTime, 'cubicOut');

        particle.life = duration;

        return particle;
    }

    update() {
        this.fixPrizesRotations();
    }

    fixPrizesRotations(feature) {
        for (var i = 0; i < feature.prizes.length; i++) {
            var prize = feature.prizes[i];

            const rotationSum = prize.parent.rotation + prize.rotation;

            prize.rotationContainer.rotation = -rotationSum;

            prize.alpha = Math.max(0.01, 1 - (Math.sin(rotationSum) + 1) / 2);
            prize.swayContainer.scale.set(numbers.scale(prize.alpha, 0, 1, 0.75, 1.2));
        }
    }

    next(feature) {
        feature.states.change(this.nextStates.ShowPrize, this.results);
    }

    spawnImplosion() {
        const particle = this.addFrames(this.spawnParticleInHand(), implosion);
        particle.tint = 0x1c8085;
        particle.alpha = 1;

        tweens.alpha(particle).start().to(0, 1);

        return particle;
    }

    playPreLightning() {
        const particle = this.addFrames(this.spawnParticleInHand(), preLightning, preLightning.length / 20);
        particle.position.y -= 50;
    }

    spawnBlueFlame() {
        const particle = this.addFrames(this.spawnParticleInHand(), blueFlame);
        particle.position.y -= 50;

        return particle;
    }

    spawnFlare() {
        const particle = this.spawnParticleInHand();
        particle.position.y -= 20;
        particle.texture = PIXI.Texture.fromFrame('jackpot_flash_second/flare.jpg');

        return particle;
    }

    spawnBackgroundParticle() {
        const particle = this.spawnParticle();
        particle.texture = PIXI.Texture.fromFrame('features/jackpot_flash_second/images/background_blurred.jpg');
        particle.position.x = 1024;
        particle.position.y = 1024;

        particle.anchor.x = 0.5;
        particle.anchor.y = 0.5;

        return particle;
    }

    flashBackgroundSubtle(feature, duration) {
        const particle = this.spawnBackgroundParticle();
        particle.life = duration;

        tweens.alpha(particle).start(0).to(0.25, duration - 2, 'cubicOut').to(0.125, 1.75, 'cubic').to(0, 0.25, 'cubic');
        // tweens.positionY(particle).start().by(32, duration, 'cubicIn');
        // tweens.scale(particle).start().to(1.2, duration, 'cubicIn');
    }

    flashBackgroundStrong() {
        const particle = this.spawnBackgroundParticle();

        particle.life = tweens.alpha(particle).start(0).to(0.25, 0.2, 'cubicIn').to(0, 1, 'cubicOut').duration;
    }

    shakeScreenSubtle(feature, time) {
        const count = 200;

        for (let i = 0; i <= count; i++) {
            const x = (3 * random.uniform(0.5, 1) * random.sign() * i) / count;
            const y = (2 * random.uniform(0.5, 1) * random.sign() * i) / count;
            tweens.pivot(feature.container).to(1024 + x, 1024 + y, time / count, 'quintic');
        }
    }

    shakeScreenStrong(feature) {
        tweens.pivot(feature.container).start();
        const count = 50;
        for (let i = count; i >= 0; i--) {
            const x = (5 * random.uniform(0.5, 1) * random.sign() * i) / count;
            const y = (3 * random.uniform(0.5, 1) * random.sign() * i) / count;
            tweens.pivot(feature.container).to(1024 + x, 1024 + y, 1.5 / count, 'quintic');
        }
    }

    spawnSecondFlareFlashing() {
        let particle = this.spawnFlare();
        particle.position.y += 10;

        this.flashBackgroundStrong();

        const durationScale = tweens.scaleXY(particle).start(0, 0).delay(0.1).call(this.flashBackgroundStrong).to(3, 1.5, 0.25, 'cubic').to(0, 0, 1, 'cubic').duration;
        const durationAlpha = tweens.alpha(particle).start(0).to(0.5, 0.25, 'cubic').delay(1).to(0, 0.25, 'cubic').duration;

        const firstFlareDuration = Math.max(durationScale, durationAlpha);

        particle.life = firstFlareDuration;
        particle.alpha = 0.5;

        particle = this.spawnFlare();
        particle.rotation = Math.PI / 2;

        particle.life = tweens
            .tint(particle)
            .start(0xffffff)
            .to(0xcccccc, (firstFlareDuration - 1) / 15 / 2)
            .to(0xeeeeee, (firstFlareDuration - 1) / 15 / 2)
            .repeat(15).duration;

        return particle.life;
    }

    spawnBigBlueFlame() {
        const blueFlameParticle = this.spawnBlueFlame();
        blueFlameParticle.scale.set(2, 2);
        blueFlameParticle.position.y -= 50;
    }

    startLightningShot() {
        const particle = this.addFrames(this.spawnParticleInHand(), lightning, lightning.length / 25);
        particle.scale.set(2, 2);
        particle.position.y -= 165;
        particle.position.x += 10;
    }

    startPrizeExplosion() {
        let particle = this.spawnFlare();
        particle.position.y -= 335;
        particle.position.x -= 30;

        const durationScale = tweens.scaleXY(particle).start(0, 0).to(1, 1, 0.1, 'cubic').to(0, 0, 0.8, 'cubic').duration;
        const durationAlpha = tweens.alpha(particle).start(0).to(1, 0.25, 'cubic').to(0, 1, 'cubic').duration;

        particle.life = Math.max(durationScale, durationAlpha);
    }

    getWheelFinalRotation(feature) {
        const _2_PI = Math.PI * 2;

        const prize = feature.prizes[this.results.prizeIndex];
        prize.rotation %= _2_PI;
        feature.prizeWheel.rotation %= _2_PI;

        let finalRotation = -(Math.PI / 2 + prize.targetRotation);

        while (finalRotation - feature.prizeWheel.rotation < 0.65 * _2_PI) {
            finalRotation += _2_PI;
        }

        return finalRotation;
    }
}

module.exports = SecondCycle;
