'use strict';


const {State, sprite} = require('@omnigame/core');


class Global extends State {
    enter(feature) {
        // Force uploading this scene's texture atlas to the GPU, so future
        // camera scrolling is smoother.
        var primer = sprite('main/square.png').position(0, 2048).addTo(feature.game.stage);
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

    onJackpotUpdate(feature, jackpots) {
        if (feature.sky && feature.sky.jackpots)
            for (var id in jackpots)
                feature.sky.jackpots[id].counter.changeValueInstantly(jackpots[id]);
    }
}


module.exports = Global;
