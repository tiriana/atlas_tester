'use strict';


const {State, tweens, features} = require('@omnigame/core');

const BigWin = require('./big_win');

class Deactivating extends State {
    create() {
        this.nextStates = {};

        this.nextStates.Off = require('./off');
    }

    enter(feature) {
        if (feature.states.previous === BigWin) {
            tweens.alpha(features.gui.bigWin).start().to(0, 1);
            tweens.alpha(features.gui.featureOverlay).start().delay(2).to(1, 2).delay(1).call(this.next);
            tweens.scale(feature.container).start().to(feature.container.scale.x * 0.8, 4, 'sineIn');
            tweens.position(feature.container).start().by(0.0001, 0.0001, 0.01, null, 'loop').to([1014, 1034], [1019, 1029], 1, 'sine').repeat(4, 'loop');

            feature.game.schedule(2, this.fadeOutAudio, this);
        } else
            feature.game.schedule(0, this.next, this);
    }

    fadeOutAudio(feature) {
        feature.audio.ambient.fadeOut(2).stop(2);
    }

    next(feature) {
        feature.torches[0].flameSpawner.spawnRate = 0;
        feature.torches[1].flameSpawner.spawnRate = 0;
        feature.dust.spawner.spawnRate = 0;
        feature.highlights.spawner.spawnRate = 0;
        feature.topLight.alpha = 0;

        feature.container.visible = false;

        features.gui.bigWin.counter.alpha = 1;

        feature.states.change(this.nextStates.Off);
    }
}


module.exports = Deactivating;
