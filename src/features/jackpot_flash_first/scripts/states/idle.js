'use strict';


const {State, tweens, Button, features} = require('@omnigame/core');


class Idle extends State {
    create() {
        this.nextStates = {};
        this.nextStates.Cycle = require('./cycle');
    }

    enter() {
        features.gui.start.position.set(1024, 1234);
        tweens.alpha(features.gui.start).start().to(1, 1);

        features.gui.start.enable();

        tweens.scale(features.gui.start).start(1).to(0.9, 1, 'sine').to(1, 1, 'sine').repeat();

        Button.onClick.once({'sender': features.gui.start, 'receiver': this.startPressed});
    }

    startPressed(feature) {
        feature.audioGroup.effect('jackpot_flash_first/start_button.m4a').play();

        features.gui.start.disable();
        tweens.alpha(features.gui.start).start().to(0, 0.25);
        tweens.scale(features.gui.start).start().to(0.5, 0.25);
        this.next();
    }

    next(feature) {
        feature.states.change(this.nextStates.Cycle);
    }
}


module.exports = Idle;
