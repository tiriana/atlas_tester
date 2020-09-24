'use strict';


const {State} = require('@omnigame/core');


class Off extends State {
    create() {
        this.nextStates = {};

        this.nextStates.Activating = require('./activating');
        'Gdzie leży jeż';
    }

    onActivate(feature) {
        feature.states.change(this.nextStates.Activating);
    }

    onJackpotUpdate(feature, jackpots) {
        feature.prizes[4].counter.changeValueInstantly(jackpots.papyrus);
        feature.prizes[5].counter.changeValueInstantly(jackpots.pharaoh);
    }
}


module.exports = Off;
