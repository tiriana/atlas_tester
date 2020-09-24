'use strict';


const {State, tweens} = require('@omnigame/core');


class Activating extends State {
    create() {
        this.nextStates = {};

        this.nextStates.Idle = require('./idle');
    }

    enter(feature) {
        feature.torches[0].flameSpawner.spawnRate = 10;
        feature.torches[1].flameSpawner.spawnRate = 10;
        feature.dust.spawner.spawnRate = 20;
        feature.highlights.spawner.spawnRate = 10;
        feature.container.visible = true;
        tweens.alpha(feature.container).start().to(1, 1).call(this.next);
        tweens.scale(feature.container).start(0.5).to(0.9, 3, 'cubicOut');
        tweens.alpha(feature.topLight).start(0).to(1, 2).delay(1).to(0, 2).delay(1).repeat();
        tweens.position(feature.container).start().by(0.0001, 0.0001, 0.01, null, 'loop').to([1014, 1034], [1019, 1029], [0.75, 1.5], 'sine').repeat(Infinity, 'loop');

        feature.audio.ambient.volume = 0;
        feature.audio.ambient.play().fadeIn(5);
        feature.audio.playlist.volume = 0;
        feature.audio.playlist.play('idle').fadeIn(5);
        feature.audioGroup.effect('jackpot_flash_first/start.m4a').play();

        for (var i = 0; i < feature.prizes.length - 1; i++)
            if (i !== this.lastPrizeIndex) {
                feature.prizes[i].alpha = 1;
                feature.prizes[i].counter.scale.set(1);
            }
    }

    next(feature) {
        feature.states.change(this.nextStates.Idle);
    }
}


module.exports = Activating;
