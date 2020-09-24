'use strict';


const {State, tweens, random} = require('@omnigame/core');
const signals = require('../../../../scripts/signals');
const nodeStructure = require('../node_structure');
const DELAY = 0.0625;


class InitiateSpin extends State {
    create() {
        this.nextStates = {};
        this.nextStates.StopReels = require('./stop_reels');
    }

    enter(feature, respin = false) {
        this.respin = respin;

        this.waitForItems = this.respin ? 1 : 2; // wait for results and for small delay

        if (this.respin)
            feature.game.schedule(0, this.startCertainReels, this);
        else
            feature.game.schedule(0, this.startAllReels, this);
    }

    startAllReels(feature) {
        var delay;

        feature.audioGroup.effect('wheelStart').rate(random.uniform(0.9, 1.1)).play();

        for (var i = 0; i < feature.reels.length; i++) {
            var reel = feature.reels[i];
            delay = settings.STOP_ORDER[i] * DELAY;

            reel.start(delay);
            feature.game.schedule(delay, this.startReel, this, i);
        }

        feature.reels[settings.STOP_ORDER[0]].onLoop.connect(this.timelineLooped);

        this.requestResults();

        feature.game.schedule(1, this.check);
    }

    startReel(feature, index) {
        var symbol = feature.symbols[index];

        switch (symbol.type) {
            case 'scattered':
                tweens.scale(symbol).start().to(0.82, 0.35, 'cubicOut').to(1, 0);
                break;
            case 'wildGlowing':
                symbol.wildSmokeSpawner.disable();
                break;
            case 'purple':
            case 'black':
            case 'white':
                tweens.scale(symbol.frame).start().to(0.75, 0.125, 'cubicIn').hide();
                tweens.alpha(symbol.frame).start().to(0, 0.125);
                tweens.scale(symbol.sprite).start().to(1, 0.125, 'cubicIn');
                break;
        }

        tweens.pivotY(symbol).start().to(10, 0.25, 'cubic').to(0, 0.1, 'cubicIn').hide().set(feature.reels[index], 'visible', true);
        tweens.alpha(symbol.highlight).start().to(0, 0.35);
    }

    startCertainReels(feature) {
        var i, k, delay, reel, symbol, order;

        var firstReel = null;

        var spinResults = this.messages.getSpinResults.send(feature.game);

        k = 0;

        for (i = 0; i < settings.STOP_ORDER.length; i++) {
            order = settings.STOP_ORDER[i];
            symbol = feature.symbols[order];
            reel = feature.reels[order];
            if (reel.type !== 'empty')
                continue;

            if (!firstReel)
                firstReel = reel;

            delay = k * DELAY;
            if (spinResults.symbols[reel.index] === 'scattered') {
                k += 10;
            }

            reel.respin(delay);
            reel.visible = true;
            symbol.visible = false;
            k++;
        }

        this.check();
    }

    requestResults() {
        signals.get.mainSpinResults.send(this.respin);
    }

    timelineLooped(feature) {
        for (var i = 0; i < feature.reels.length; i++) {
            var frame = feature.reels[i].tween.get('loopEnd');
            if (frame)
                frame.repeatCount += 1;
        }
    }

    onSetSpinResults(feature, results) {
        nodeStructure.fill(results);
        this.check();
    }

    check(feature) {
        this.waitForItems--;
        if (this.waitForItems === 0)
            feature.game.schedule(0, this.afterCheck); // use schedule so the the machine doesn't change state BEFORE the global onSetSpinResults finishes
    }

    afterCheck(feature) {
        feature.states.change(this.nextStates.StopReels, this.respin);
    }

    exit(feature) {
        for (var i = 0; i < feature.reels.length; i++)
            feature.reels[i].onLoop.disconnect(this.timelineLooped);
    }
}


module.exports = InitiateSpin;
