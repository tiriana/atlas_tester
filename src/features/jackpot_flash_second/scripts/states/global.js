'use strict';


const {State, sprite} = require('@omnigame/core');


class Global extends State {
    enter(feature) {
        // Force uploading this scene's texture atlas to the GPU, so future
        // camera scrolling is smoother.
        var primer = sprite('jackpot_flash_second/square.png').position(0, 2048).addTo(feature.game.stage);
        feature.game.schedule(1, primer.remove, primer);
    }

    onIsLoaded() {
        return true;
    }

    onIsLoading() {
        return false;
    }

    onIsReady() {
        return true;
    }

    onSetSpinResults(feature, results) {
        this.spinResults = results;
    }

    onGetSpinResults() {
        return this.spinResults;
    }

    onJackpotUpdate() {
        // this.main.jackpot.changeValueInstantly(jackpot);
        // this.main.superJackpot.changeValueInstantly(superJackpot);
    }
}


module.exports = Global;
