'use strict';


const {State, audio} = require('@omnigame/core');


class Setup extends State {
    create() {
        this.nextStates = {};
        this.nextStates.Off = require('./off');
        this.nextStates.Activating = require('./activating');
        this.nextStates.JackpotFlashSecondWait = require('./jackpot_flash_second_wait');
    }

    enter(feature) {
        var initData = this.messages.getInitData.send(feature.game);

        feature.prizes[4].counter.changeValueInstantly(initData.jackpots.papyrus);
        feature.prizes[5].counter.changeValueInstantly(initData.jackpots.pharaoh);

        audio.load();

        this.nextState = this.nextStates[initData.jackpotFlashFirst.nextState];
    }

    onIsLoaded() {
        return true;
    }

    onIsReady() {
        return false;
    }

    update(feature) {
        feature.states.change(this.nextState);
    }

    ready(feature) {
        this.messages.featureReady.send(feature.game, feature.name);
    }

    exit(feature) {
        feature.game.schedule(0, this.ready);
    }
}


module.exports = Setup;
