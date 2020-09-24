'use strict';


const {State, tweens, features} = require('@omnigame/core');
const signals = require('../../../../scripts/signals');

class JackpotFlashActivate extends State {
    create() {
        this.nextStates = {};
        this.nextStates.JackpotFlashWait = require('./jackpot_flash_wait');
    }

    enter() {
        signals.info.featureActivating.send('JackpotFlash');
    }

    update() {
        if (this.messages.isReady.send(features.jackpotFlashFirst))
            this.next();
    }

    next(feature) {
        tweens.alpha(features.gui.featureOverlay).start().to(0, 2);
        feature.container.visible = false;

        feature.audioGroup.fadeOut(2);
        this.messages.activate.send(features.jackpotFlashFirst);
        feature.states.change(this.nextStates.JackpotFlashWait);
    }
}


module.exports = JackpotFlashActivate;
