'use strict';


const {State} = require('@omnigame/core');

// Guarantee at least 3 seconds between spins
class Delay extends State {
    create() {
        this.nextStates = {};
        this.nextStates.Idle = require('./idle');
    }

    enter(feature) {
        this.timeToNextSpin = 3 - (Date.now() - feature.spinStart) / 1000;
    }

    update(feature, elapsed) {
        if (feature.fastForward.active && feature.fastForward.originalClockSpeed === 1)
            this.timeToNextSpin -= elapsed / feature.game.clock.speed;
        else
            this.timeToNextSpin -= elapsed;

        if (this.timeToNextSpin <= 0)
            feature.states.change(this.nextStates.Idle);
    }
}


module.exports = Delay;
