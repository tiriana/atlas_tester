'use strict';


const {State} = require('@omnigame/core');
const signals = require('../../../../scripts/signals');
const nodeStructure = require('../node_structure');

const Setup = require('./setup');

class Respin extends State {
    create() {
        this.nextStates = {};
        this.nextStates.InitiateSpin = require('./initiate_spin');
    }

    enter(feature) {
        if (feature.states.previous === Setup)
            feature.game.schedule(2, this.getResults);
        else
            this.getResults();
    }

    getResults() {
        signals.get.mainSpinResults.send(true);
    }

    onSetSpinResults(feature, results) {
        nodeStructure.fill(results);
        feature.game.schedule(0, this.next, this);
    }

    next(feature) {
        feature.states.change(this.nextStates.InitiateSpin, true);
    }
}


module.exports = Respin;
