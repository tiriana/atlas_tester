'use strict';


const {PIXI, State, tweens, Button, features, translatePosition} = require('@omnigame/core');
const signals = require('../../../../scripts/signals');

const SHOCKWAVE_TEXTURES = [];

for (var i = 0; i < 48; i++)
    SHOCKWAVE_TEXTURES[i] = `gui/shockwave/${i}.jpg`;

class BigWin extends State {
    create() {
        this.nextStates = {};

        this.nextStates.Deactivating = require('./deactivating');
    }

    enter(feature, amount = 0, showCurrency = false) {
        this.waitForItems = 1;

        features.gui.bigWin.alpha = 1;

        features.gui.bigWin.counter.showCurrency = showCurrency;

        features.gui.bigWin.counter.changeValueInstantly(0);
        features.gui.bigWin.counter.add(amount, 5.2);
        feature.game.schedule(5.2, this.spawnShockwave, this);
        tweens.scale(features.gui.bigWin.counter).start(2).to(3.5, 5.1).to(4, 0.1, 'cubicOut');

        feature.audioGroup.effect('gui/big_win_countup.m4a').play();

        features.gui.bigWin.counter.valueTimeline.onEnded.once(this.showContinueButton);
    }

    spawnShockwave(feature) {
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.life = SHOCKWAVE_TEXTURES.length / 30;

        particle.textures = SHOCKWAVE_TEXTURES;
        particle.layer = 'gui';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.tint = 0xc87b2d;
        particle.scale.set(3, 3);

        translatePosition(features.gui.bigWin.counter, particle.parent, particle.position);

        particle.textureTimeline.reset(0).to(SHOCKWAVE_TEXTURES.length - 1, particle.life);
    }

    showContinueButton() {
        features.gui.continue.position.set(1024, 1234);
        tweens.alpha(features.gui.continue).start().to(1, 1);

        features.gui.continue.enable();

        tweens.scale(features.gui.continue).start(1).to(0.9, 1, 'sine').to(1, 1, 'sine').repeat();

        Button.onClick.once({'sender': features.gui.continue, 'receiver': this.continuePressed});
    }

    continuePressed() {
        if (features.gui.bigWin.counter.showCurrency) {
            tweens.alpha(features.gui.bigWin.counter).start().to(0, 0.25);
            tweens.alpha(features.gui.jackpotNotice).start().to(1, 1).delay(1).call(this.showJackpotContinueButton);
        } else {
            signals.info.bigWinConfirm.send();
        }

        features.gui.continue.disable();
        tweens.alpha(features.gui.continue).start().to(0, 0.25);
        tweens.scale(features.gui.continue).start().to(0.5, 0.25);
    }

    showJackpotContinueButton() {
        features.gui.continue.position.set(1024, 1234);
        tweens.alpha(features.gui.continue).start().to(1, 1);

        features.gui.continue.enable();

        tweens.scale(features.gui.continue).start(1).to(0.9, 1, 'sine').to(1, 1, 'sine').repeat();

        Button.onClick.once({'sender': features.gui.continue, 'receiver': this.jackpotContinuePressed});
    }

    jackpotContinuePressed() {
        tweens.alpha(features.gui.jackpotNotice).start().to(0, 1, 'cubicIn');

        features.gui.continue.disable();
        tweens.alpha(features.gui.continue).start().to(0, 0.25);
        tweens.scale(features.gui.continue).start().to(0.5, 0.25);

        signals.info.bigWinConfirm.send();
    }

    onAcknowledge() {
        this.waitForItems--;

        if (!features.gui.bigWin.counter.showCurrency)
            features.gui.credits.add(features.gui.bigWin.counter.amount, 1);
        return true;
    }

    update(feature) {
        if (this.waitForItems === 0 && this.messages.deactivating.send(features, feature.name))
            this.next();
    }

    next(feature) {
        feature.states.change(this.nextStates.Deactivating);
    }
}


module.exports = BigWin;
