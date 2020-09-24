'use strict';


const {State, features} = require('@omnigame/core');
const signals = require('../../../../scripts/signals');

class NotEnoughCredits extends State {
    create() {
        this.nextStates = {};
        this.nextStates.Delay = require('./delay');
    }

    enter() {
        if (features.gui.auto.checked)
            features.gui.auto.simulateClick();

        signals.info.notEnoughCredits.send();
    }

    update(feature) {
        if (feature.states.time >= 1)
            feature.states.change(this.nextStates.Delay);
    }
}


module.exports = NotEnoughCredits;
