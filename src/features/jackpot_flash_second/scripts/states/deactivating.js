'use strict';


const {State, tweens, features} = require('@omnigame/core');


class Deactivating extends State {
    create() {
        this.nextStates = {};

        this.nextStates.Off = require('./off');
    }

    enter(feature) {
        const time = 7;

        tweens.alpha(features.gui.bigWin).start().to(0, 1);
        tweens.alpha(features.gui.featureOverlay).start().to(1, time, 'cubicIn').call(this.next);
        tweens.scale(feature.container).start().to(feature.container.scale.x * 0.8, time, 'sineIn');

        feature.game.schedule(time - 2, this.fadeOutAudio, this);
    }

    fadeOutAudio(feature) {
        feature.audio.playlist.fadeOut(4).stop(4);
    }

    next(feature) {
        feature.nefertiti.spawner.disable();

        feature.container.visible = false;

        for (var i = 0; i < feature.prizes.length; i++)
            feature.prizes[i].scale.set(1);

        features.gui.bigWin.counter.alpha = 1;

        feature.states.change(this.nextStates.Off);
    }
}


module.exports = Deactivating;
