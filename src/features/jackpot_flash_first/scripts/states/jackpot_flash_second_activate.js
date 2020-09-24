'use strict';


const {State, tweens, features} = require('@omnigame/core');

class JackpotFlashSecondActivate extends State {
    create() {
        this.nextStates = {};
        this.nextStates.JackpotFlashSecondWait = require('./jackpot_flash_second_wait');
    }

    update() {
        if (this.messages.isReady.send(features.jackpotFlashSecond))
            this.next();
    }

    next(feature) {
        tweens.alpha(features.gui.featureOverlay).start().to(0, 2);
        feature.container.visible = false;

        feature.audio.ambient.fadeOut(2).stop(2);
        this.messages.activate.send(features.jackpotFlashSecond);
        feature.states.change(this.nextStates.JackpotFlashSecondWait);
    }
}


module.exports = JackpotFlashSecondActivate;
