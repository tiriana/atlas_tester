'use strict';


const {State, random, PIXI, tweens, translatePosition, Overlay, Button, features} = require('@omnigame/core');
const Betpanel = require('../../../gui/scripts/betpanel');


const idleAnimations = ['black', 'blue', 'green', 'orange', 'purple', 'red', 'teal', 'white', 'cat_left_big', 'cat_right_big', 'nefertiti_big'].reduce(
    (anims, color) => {
        anims[color] = [];
        for (var i = 0; i < 120; i += 1) anims[color][i] = `main/effects/idle_symbols/${color}/${i}.png`;
        return anims;
    }, {}
);


class Idle extends State {
    create() {
        this.nextStates = {};
        this.nextStates.InitiateSpin = require('./initiate_spin');
        this.nextStates.NotEnoughCredits = require('./not_enough_credits');

        this.showBonusSpinsNotice = false;
    }

    enter(feature) {
        var delay;
        this.main = feature.game.stage.main;

        if (features.gui.betPanel.magicBet > 1 && features.gui.spin.counter.amount === 0) {
            features.gui.betPanel.resetMagicBet();
            tweens.scale(features.gui.betPanel.number).to(.75, 0.5, 'cubicOut');

            features.gui.betUp.visible = true;
            features.gui.betUp.alpha = 0;
            features.gui.betUp.show(0.5);
            features.gui.betDown.visible = true;
            features.gui.betDown.alpha = 0;
            features.gui.betDown.show(0.5);
            features.gui.betLabel.playTo(0);
            features.gui.betLabel.stopPulse();
            features.gui.particleSpawner.disable();
            features.gui.smokeSpawner.disable();

            delay = 0.5;
            tweens.create(feature.hueShader, 'hue').start().delay(delay).to(0, delay);
            tweens.create(features.gui.spinShader, 'hue').start().to(0.4, delay);
            tweens.create(features.gui.betShader, 'hue').start().to(0, delay);

            feature.sidebar.glowColor = 0x03b479;

            feature.sky.sky.visible = true;
            feature.sky.lake.visible = true;
            feature.foreground.visible = true;
            feature.waves.visible = true;

            tweens.alpha(feature.sky.purpleSky).start().delay(delay).to(0, delay).hide();
            tweens.alpha(feature.sky.purpleLake).start().delay(delay).to(0, delay).hide();
            tweens.alpha(feature.purpleForeground).start().delay(delay).to(0, delay).hide();
            tweens.alpha(feature.purpleWaves).start().delay(delay).to(0, delay).hide();

            feature.audio.ambient.stop();
            feature.audio.ambient.alias = 'main/music/loop.m4a';
            feature.audio.ambient.play();
        }

        if (this.showBonusSpinsNotice) {
            this.showBonusSpinsNotice = false;

            tweens.alpha(features.gui.overlay).start(0).to(0.6, 1, 'cubicOut');

            features.gui.overlay.interactive = true;

            tweens.alpha(features.gui.bonusSpinsNotice).start(0).to(1, 1, 'cubicOut');

            Overlay.onClick.once(this.closeBonusSpinsNotice);

            if (features.gui.auto.checked)
                features.gui.auto.simulateClick();
        }

        this.spinning = false;

        if (!features.gui.auto.checked) {
            features.gui.spin.enable();
            features.gui.info.enable();
            feature.fastForward.disable();

            if (!features.gui.spin.counter.amount && !features.gui.bonusSpins.amount) {
                features.gui.betUp.enable();
                features.gui.betDown.enable();
            }

            this.showIdleHighlight();
        }

        Betpanel.onBetRateChanged(this.updateCollectibles);

        delay = 0;
        var count = feature.sidebar.level;

        if (count) {
            feature.audioGroup.effect('main/instant_win/orbs/down.m4a').play();
            while (count) {
                feature.game.schedule(delay, feature.sidebar.subtract, feature.sidebar);
                delay += 0.03125;
                count--;
            }
        }

        Button.onClick.once({'sender': features.gui.spin, 'receiver': this.spin});

        if (feature.prizeOrb.state === settings.ORB_STATES.OFF) {
            feature.prizeOrb.state = settings.ORB_STATES.IDLE;
            feature.prizeOrb.flameSpawner.enable();
            tweens.scale(feature.prizeOrb.circle).start(1.5).to(1.6, 1, 'sine').to(1.5, 1, 'sine').repeat().randomize();
            feature.prizeOrb.alpha = 1;
            tweens.scale(feature.prizeOrb).start(0).to(0.5, 1, 'elasticOut');
        }
    }

    showIdleHighlight(feature) {
        const id = random.integer(0, feature.symbols.length);
        const symbol = feature.symbols[id];
        if (tweens.alpha(symbol.highlight).ended) {
            var {type} = symbol;
            if (type === 'scattered') {
                switch (feature.scatteredCollected[features.gui.betPanel.rawBetRate]) {
                    case 0:
                        type = 'cat_left_big';
                        break;
                    case 1:
                        type = 'cat_right_big';
                        break;
                    case 2:
                        type = 'nefertiti_big';
                        break;
                }
            }
            if (type !== 'wild' && type !== 'wildGlowing') {
                symbol.highlight.textures = idleAnimations[type];
                symbol.highlight.loop = true;
                symbol.highlight.scale.set(2.5);
                symbol.highlight.play();
                tweens.alpha(symbol.highlight, 0).show().to(1, 0.5).delay(random.uniform(3, 7)).to(0, 0.5).hide();
            }
        }
        feature.game.schedule(random.uniform(0.3, 1), this.showIdleHighlight);
    }

    updateCollectibles(feature, betRate) {
        var collected = feature.scatteredCollected[betRate];
        feature.nefertiti.alpha = collected >= 3;
        feature.catRight.alpha = collected >= 2;
        feature.catLeft.alpha = collected >= 1;

        // change the textures of scattered based on collected info
        feature.updateScatteredTextures(collected);
    }

    closeBonusSpinsNotice() {
        tweens.alpha(features.gui.bonusSpinsNotice).start().to(0, 0.5);
        tweens.alpha(features.gui.overlay).start().to(0, 0.5);

        features.gui.overlay.interactive = false;
    }

    spin(feature) {
        feature.game.cancelAll(this.showIdleHighlight);

        this.spinning = true;

        this.disableButtons();

        if (features.gui.credits.valueTimeline.ended)
            this.freeSpinsCheck();
        else
            features.gui.credits.valueTimeline.onEnded.once(this.scheduleNext);
    }

    disableButtons() {
        features.gui.info.disable();
        features.gui.spin.disable();
        features.gui.betUp.disable();
        features.gui.betDown.disable();
    }

    update() {
        if (features.gui.auto.checked && !this.spinning)
            this.spin();
    }

    scheduleNext(feature) {
        feature.game.schedule(0.5, this.freeSpinsCheck);
    }

    freeSpinsCheck() {
        if (features.gui.spin.counter.amount === 0)
            this.bonusSpinsCheck();
        else {
            features.gui.spin.counter.subtract(1);
            this.initiateSpin();
        }
    }

    bonusSpinsCheck() {
        if (features.gui.bonusSpins.amount === 0) {
            features.gui.bonusSpins.showNotice = false;
            this.creditsCheck();
        } else {
            features.gui.bonusSpins.subtractInstantly(1);

            if (features.gui.bonusSpins.amount === 0)
                this.showBonusSpinsNotice = true;

            this.initiateSpin();
        }
    }

    creditsCheck(feature) {
        if (features.gui.credits.amount >= features.gui.betPanel.betRate) {
            this.initiateSpin();
            features.gui.credits.subtractInstantly(features.gui.betPanel.betRate);
        } else
            feature.states.change(this.nextStates.NotEnoughCredits);
    }

    initiateSpin(feature) {
        if (feature.sidebar.level) {
            return feature.game.schedule(0.5, this.initiateSpin, this);
        }

        feature.spinStart = Date.now();
        feature.fastForward.enable();

        feature.states.change(this.nextStates.InitiateSpin);
    }

    onFlareSpawned(feature, particle) {
        particle.oldPosition.set(0, 0);
        translatePosition(features.gui.spin, particle.parent, particle.oldPosition);

        particle.texture = PIXI.Texture.fromFrame('main/particles/flares/4.png');
        particle.life = random.uniform(0.75, 1);
        particle.layer = 'debug';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.scaleTimeline.reset(0).addFrame(3, particle.life, 'cubicOut');

        particle.alphaTimeline.reset(0)
            .addFrame(0.75, particle.life * 0.125)
            .addFrame(0, particle.life, 'cubicOut');
    }

    buttonIndicateOnce(feature) {
        feature.game.particleContainer.emitter.spawnInstantly(1, this.onFlareSpawned);
    }

    buttonIndicate(feature) {
        this.buttonIndicateOnce();
        feature.game.schedule(1, this.buttonIndicateOnce);
        feature.game.schedule(settings.SPIN_BUTTON_FIRST_HINT_DELAY, this.buttonIndicate);
    }

    exit(feature) {
        feature.game.cancelAll(this.buttonIndicate);
        Button.onClick.disconnect({'sender': features.gui.spin, 'receiver': this.spin});
        Betpanel.onBetRateChanged.disconnect(this.updateCollectibles);
    }
}


module.exports = Idle;
