'use strict';


const {State} = require('@omnigame/core');


class Off extends State {
    create() {
        this.nextStates = {};

        this.nextStates.Activating = require('./activating.js');
    }

    onActivate(feature) {
        feature.states.change(this.nextStates.Activating);
    }

    onJackpotUpdate(feature, jackpots) {
        feature.prizes[3].counter.changeValueInstantly(jackpots.nefertiti);
        feature.prizes[7].counter.changeValueInstantly(jackpots.luxur);
    }
}


module.exports = Off;
