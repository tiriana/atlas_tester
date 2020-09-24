'use strict';

const { sprite, container, Container, ParticleContainer, Signal, audio } = require('@omnigame/core');
const InitFeature = require('../../../../scripts/states/init_feature');
const Nefertiti = require('../nefertiti');
const BlueFlare = require('../flare_blue');

const PrizeInstantWinSecond = require('../prize_instant_win');
const PrizeJackpotSecond = require('../prize_jackpot');

class Init extends InitFeature {
    create() {
        this.nextStates = {};
        this.nextStates.Setup = require('./setup');
    }

    addGraphics(feature) {
        feature.container = container(new Container()).layer('jackpotFlash').addTo(feature.game.stage).hide().position(1024, 1024).pivot(1024, 1024).instance;
        feature.container.interactiveChildren = false;

        feature.particleContainer = container(new ParticleContainer()).addTo(feature.container).instance;

        feature.background = sprite('features/jackpot_flash_second/images/background.jpg').anchor(0, 0).addTo(feature.container).sprite;

        feature.prizeWheel = container(new Container()).position(1024, 900).addTo(feature.container).instance;

        feature.prizes = [
            container(new PrizeInstantWinSecond(settings.JACKPOT_FLASH_MULTIPLIERS.SECOND[0])).addTo(feature.prizeWheel).instance,
            container(new PrizeInstantWinSecond(settings.JACKPOT_FLASH_MULTIPLIERS.SECOND[1])).addTo(feature.prizeWheel).instance,
            container(new PrizeInstantWinSecond(settings.JACKPOT_FLASH_MULTIPLIERS.SECOND[2])).addTo(feature.prizeWheel).instance,
            container(new PrizeJackpotSecond('jackpot_flash_second/labels/nefertiti.png')).addTo(feature.prizeWheel).instance,
            container(new PrizeInstantWinSecond(settings.JACKPOT_FLASH_MULTIPLIERS.SECOND[3])).addTo(feature.prizeWheel).instance,
            container(new PrizeInstantWinSecond(settings.JACKPOT_FLASH_MULTIPLIERS.SECOND[4])).addTo(feature.prizeWheel).instance,
            container(new PrizeInstantWinSecond(settings.JACKPOT_FLASH_MULTIPLIERS.SECOND[5])).addTo(feature.prizeWheel).instance,
            container(new PrizeJackpotSecond('jackpot_flash_second/labels/luxur.png')).addTo(feature.prizeWheel).instance,
        ];

        feature.prizes[3].counter.changeValueInstantly(1234567890);
        feature.prizes[7].counter.changeValueInstantly(1234567890);

        for (var i = 0; i < feature.prizes.length; i++) {
            var prize = feature.prizes[i];
            prize.pivot.set(-300, 0);
            prize.targetRotation = i * Math.PI * 2 / feature.prizes.length;
            prize.rotation = Math.PI / 2;

            if (prize.rotation > prize.targetRotation)
                prize.targetRotation += Math.PI * 2;
        }

        feature.nefertiti = container(new Nefertiti(feature)).position(828, 715).layer('jackpotFlashNefertiti').addTo(feature.container).instance;

        feature.projectile = sprite('jackpot_flash_second/particles/projectile.png').addTo(feature.container).scale(0).blending('ADD').layer('debug').sprite;

        feature.projectileTarget = null;

        feature.projectileReachedTarget = new Signal();

        feature.flare = container(new BlueFlare()).addTo(feature.container).alpha(0).position(1024, 1024).instance;

        feature.overlay = sprite('jackpot_flash_second/overlay.png').addTo(feature.container).position(1064, 980).anchor(0.51953125, 0.478515625).scale(8).layer('jackpotOverlay').sprite;
        feature.overlay2 = sprite('jackpot_flash_second/square.png').addTo(feature.container).position(1064, 980).scale(16).tint(0x000000).sprite;
    }

    addSounds(feature) {
        feature.audioGroup = audio.group();
        feature.audio = {};
        feature.audio.playlist = feature.audioGroup.playlist({ 'loops': { 'middle': ['jackpot_flash_second/loop.m4a'], } });
    }

    next(feature) {
        feature.states.change(this.nextStates.Setup);
    }
}


module.exports = Init;
