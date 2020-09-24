'use strict';


const {State, tweens, Button, numbers, features} = require('@omnigame/core');

class SecondIdle extends State {
    create() {
        this.nextStates = {};
        this.nextStates.Cycle = require('./cycle');
    }

    enter(feature) {
        feature.game.schedule(1, this.showNefertiti);
        feature.game.schedule(5, this.showStartButton);
    }

    showStartButton() {
        // Show the START button
        features.gui.start.position.set(1024, 1024);
        features.gui.start.enable();
        tweens.alpha(features.gui.start).start(0).to(1, 1);
        tweens.scale(features.gui.start).start(1).to(0.9, 1, 'sine').to(1, 1, 'sine').repeat();
        Button.onClick.once({'sender': features.gui.start, 'receiver': this.startPressed});
    }

    startPressed(feature) {
        tweens.alpha(features.gui.start).start().to(0, 0.25);
        tweens.scale(features.gui.start).start().to(0.5, 0.25);
        feature.states.change(this.nextStates.Cycle);
    }

    showNefertiti(feature) {
        tweens.tint(feature.background).start().to(0xffffff, 2);
        feature.nefertiti.spine.state.setAnimation(2, 'reveal', false);
        feature.audioGroup.effect('jackpot_flash_second/intro_hit.m4a').play();
        feature.nefertiti.spawner.enable();
        tweens.alpha(feature.overlay2).start().to(0, 1);

        tweens.scale(feature.overlay).start().to(128, 3, 'cubicIn');
        tweens.alpha(feature.overlay).start().delay(3).to(0, 4);

        feature.game.schedule(2, this.showWheels, this);
    }

    showWheels(feature) {
        feature.prizeWheel.wholeRotationTime = 10;
        for (var i = 0; i < feature.prizes.length; i++) {
            var prize = feature.prizes[i];
            tweens.rotation(prize).start(Math.PI / 2).to(prize.targetRotation, 4, 'cubicOut');
        }

        tweens.rotation(feature.prizeWheel).start().to(Math.PI * 2, feature.prizeWheel.wholeRotationTime).repeat();
    }

    update(feature) {
        for (var i = 0; i < feature.prizes.length; i++) {
            var prize = feature.prizes[i];

            prize.rotationContainer.rotation = -prize.parent.rotation - prize.rotation;
            var sin = (Math.sin(prize.parent.rotation + prize.rotation) + 1) / 2;

            prize.alpha = Math.max(0.01, 1 - sin);
            prize.swayContainer.scale.set(numbers.scale(prize.alpha, 0, 1, 0.75, 1.2));
        }
    }
}


module.exports = SecondIdle;
