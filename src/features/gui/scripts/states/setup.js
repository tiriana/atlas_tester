'use strict';


const {State, Button, audio, random, Counter} = require('@omnigame/core');


class Setup extends State {
    create() {
        this.nextStates = {};
        this.nextStates.Idle = require('./idle.js');
    }

    enter(feature) {
        var initData = this.messages.getInitData.send(feature.game);

        feature.credits.changeValueInstantly(initData.credits);
        feature.betPanel.setBetRate(initData.betRate);
        for (var i = 1; i < initData.magicBet; i += 1) {
            feature.betPanel.increaseMagicBet();
        }
        feature.spin.counter.changeValueInstantly(initData.freeSpins);
        feature.bonusSpins.changeValueInstantly(initData.bonusSpins || 0);

        Counter.onValueChange({'sender': feature.spin.counter, 'receiver': this.freeSpinCountUp, 'context': this});
        Counter.onValueChangeStarted({'sender': feature.credits, 'receiver': this.creditCountupStarted, 'context': this});

        Button.onClick(this.buttonUp, this);
        Button.onMouseDown(this.buttonDown, this);

        var infoBar = document.getElementById('info-bar');
        if (infoBar)
            infoBar.classList.remove('hidden');

        feature.game.schedule(0, this.next);
    }

    freeSpinCountUp(feature, counter, newAmount, oldAmount) {
        if (oldAmount === -1 || newAmount < oldAmount)
            return;

        if (newAmount === counter.amount)
            audio.effect('gui/fx/freespins/countup_end.m4a').play();
        else
            audio.effect('gui/fx/freespins/countup.m4a').play();
    }

    creditCountupStarted() {
        audio.effect('gui/fx/wins/countup.m4a').play();
    }

    buttonUp() {
        audio.effect('gui/fx/button/up.m4a').rate(random.uniform(0.9, 1.1)).play();
    }

    buttonDown() {
        audio.effect('gui/fx/button/down.m4a').rate(random.uniform(0.9, 1.1)).play();
    }

    onIsLoaded() {
        return true;
    }

    onIsReady() {
        return false;
    }

    next(feature) {
        feature.states.change(this.nextStates.Idle);
    }

    ready(feature) {
        this.messages.featureReady.send(feature.game, feature.name);
    }

    exit(feature) {
        feature.game.schedule(0, this.ready);
    }
}


module.exports = Setup;
