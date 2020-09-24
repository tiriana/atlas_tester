'use strict';


const { State } = require('@omnigame/core');


class SecondActivating extends State {
    create() {
        this.nextStates = {};

        this.nextStates.Idle = require('./idle');
    }

    enter(feature) {
        feature.container.visible = true;
        feature.container.alpha = 1;
        feature.container.scale.set(1);

        feature.overlay2.alpha = 0.5;
        feature.overlay.alpha = 0.5;
        feature.overlay.scale.set(8);

        feature.background.tint = 0x444444;

        feature.audio.playlist.volume = 0;
        feature.audio.playlist.play('middle').fadeIn(2);

        feature.nefertiti.spine.state.setAnimation(2, 'dark', true);

        feature.prizeWheel.rotation = 0;

        for (var i = 0; i < feature.prizes.length; i++) {
            var prize = feature.prizes[i];
            prize.alpha = 0;
            prize.rotation = Math.PI / 2;
        }

        feature.game.schedule(1, this.next);
    }

    next(feature) {
        feature.states.change(this.nextStates.Idle);
    }
}


module.exports = SecondActivating;
