'use strict';


const {State, audio, features} = require('@omnigame/core');
const nodeStructure = require('../node_structure');


class Setup extends State {
    create() {
        this.nextStates = {};
        this.nextStates.Idle = require('./idle');
        this.nextStates.SpinTopOrb = require('./spin_top_orb');
        this.nextStates.JackpotFlashWait = require('./jackpot_flash_wait');
        this.nextStates.Respin = require('./respin');
    }

    enter(feature) {
        var i;
        var initData = this.messages.getInitData.send(feature.game);
        var spinResults = initData.main.results;

        for (i in initData.main.scatteredCollected)
            feature.scatteredCollected[i] = initData.main.scatteredCollected[i];

        // show or hide the pryramid top cats and Nefertiti
        var collected = feature.scatteredCollected[initData.betRate];
        feature.nefertiti.alpha = collected >= 3;
        feature.catRight.alpha = collected >= 2;
        feature.catLeft.alpha = collected >= 1;

        // change the textures of scattered based on collected info
        feature.updateScatteredTextures(collected);

        nodeStructure.fill(spinResults);

        this.messages.setSpinResults.send(this.machine, spinResults);

        for (i = 0; i < feature.reels.length; i++) {
            var reel = feature.reels[i];

            reel.nextSymbolId = spinResults.symbols[i];
            reel.swap();

            reel.nextSymbolId = spinResults.symbols[i];
            reel.swap();

            reel.visible = false;

            feature.symbols[i].setType(spinResults.symbols[i]);
            switch (feature.symbols[i].type) {
                case 'scattered':
                    feature.symbols[i].scale.set(1.1);
                    if (feature.scatteredCollected[features.gui.betPanel.rawBetRate] < 2)
                        feature.symbols[i].pivot.set(0, 3);
                    else
                        feature.symbols[i].pivot.set(0, 6);
                    break;
                case 'black':
                case 'purple':
                case 'white':
                    feature.symbols[i].sprite.scale.set(1.1);
                    feature.symbols[i].frame.scale.set(1);
                    feature.symbols[i].frame.visible = true;
                    feature.symbols[i].frame.alpha = 1;
            }
        }

        feature.sidebar.set(initData.main.sidebarLevel);

        if (feature.sidebar.level === settings.SIDEBAR_BRICKS_COUNT) {
            feature.prizeOrb.state = settings.ORB_STATES.OFF;

            if (initData.main.nextState === 'SpinTopOrb')
                feature.prizeOrb.state = settings.ORB_STATES.ACTIVATED;
        }

        switch (feature.prizeOrb.state) {
            case settings.ORB_STATES.OFF:
                feature.prizeOrb.outerRingSpawner.disable();
                feature.prizeOrb.flareBeamSpawner.disable();
                feature.prizeOrb.dustSpawner.disable();

                for (i = 0; i < feature.prizeOrb.rings.length; i++)
                    feature.prizeOrb.rings[i].scale.set(0);

                feature.prizeOrb.circle.scale.set(0);
                feature.prizeOrb.alpha = 0;
                break;

            case settings.ORB_STATES.ACTIVATED:
                for (i = 0; i < feature.prizeOrb.rings.length; i++)
                    feature.prizeOrb.rings[i].visible = true;

                feature.prizeOrb.flareBeamSpawner.enable();
                feature.prizeOrb.dustSpawner.enable();
                feature.prizeOrb.flameSpawner.disable();
                feature.prizeOrb.scale.set(1);
                break;
        }

        feature.sky.jackpots.papyrus.counter.changeValueInstantly(initData.jackpots.papyrus);
        feature.sky.jackpots.pharaoh.counter.changeValueInstantly(initData.jackpots.pharaoh);
        feature.sky.jackpots.luxur.counter.changeValueInstantly(initData.jackpots.luxur);
        feature.sky.jackpots.nefertiti.counter.changeValueInstantly(initData.jackpots.nefertiti);

        const {magicBet} = features.gui.betPanel;
        if (magicBet > 1) {
            feature.hueShader.hue = 0.35;
            features.gui.betShader.hue = 0.6;
            features.gui.spinShader.hue = 0.6;
            feature.sidebar.glowColor = 0x9903b4;
            feature.sky.purpleSky.alpha = 1;
            feature.sky.purpleSky.visible = true;
            feature.sky.purpleLake.alpha = 1;
            feature.sky.purpleLake.visible = true;
            feature.purpleForeground.alpha = 1;
            feature.purpleForeground.visible = true;
            feature.purpleWaves.alpha = 1;
            feature.purpleWaves.visible = true;

            feature.sky.sky.visible = false;
            feature.sky.lake.visible = false;
            feature.foreground.visible = false;
            feature.waves.visible = false;

            const scale = magicBet < 4 ? 1 : magicBet < 6 ? 1.25 : 1.5;
            features.gui.betPanel.number.scale.set(scale);

            features.gui.particleSpawner.enable();
            features.gui.smokeSpawner.enable();
            features.gui.betDown.visible = false;
            features.gui.betUp.visible = false;
            features.gui.betLabel.currentFrame = 37;
            features.gui.betLabel.targetFrame = 37;
            features.gui.betLabel.play();
            features.gui.betLabel.pulse();

            feature.audio.ambient.stop();
            feature.audio.ambient.alias = 'main/music/loop_magic_bet.m4a';
            feature.audio.ambient.play();
        }

        audio.load();

        this.nextState = this.nextStates[initData.main.nextState];

        if (this.nextState !== this.nextStates.JackpotFlashWait)
            feature.audioGroup.fadeIn(5);
    }

    onIsLoaded() {
        return true;
    }

    onIsReady() {
        return false;
    }

    update(feature) {
        feature.states.change(this.nextState);
    }

    ready(feature) {
        this.messages.featureReady.send(feature.game, feature.name);
    }

    exit(feature) {
        feature.game.schedule(0, this.ready);
    }
}


module.exports = Setup;
