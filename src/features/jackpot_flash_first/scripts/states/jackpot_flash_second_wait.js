'use strict';


const {State, features} = require('@omnigame/core');

const OffSecond = require('../../../jackpot_flash_second/scripts/states/off');

class JackpotFlashWait extends State {
    create() {
        this.nextStates = {};
        this.nextStates.Deactivating = require('./deactivating');
    }

    enter() {
        this.waitForItems = 1;
    }

    onDeactivating(feature, name) {
        if (name === 'jackpotFlashSecond') {
            OffSecond.onEnter.once(this.secondDeactivated, this);
            return true;
        }
    }

    secondDeactivated() {
        this.waitForItems--;
    }

    update(feature) {
        if (this.waitForItems === 0 && this.messages.deactivating.send(features, feature.name))
            this.next();
    }

    next(feature) {
        feature.states.change(this.nextStates.Deactivating);
    }
}


module.exports = JackpotFlashWait;
