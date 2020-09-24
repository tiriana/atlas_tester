'use strict';

const {sprite, container, Container, ParticleContainer, audio} = require('@omnigame/core');
const InitFeature = require('../../../../scripts/states/init_feature');
const Torch = require('../torch');
const Dust = require('../dust');
const Highlights = require('../highlights');
const PrizeInstantWin = require('../prize_instant_win');
const PrizeJackpot = require('../prize_jackpot');
const PrizeDoor = require('../prize_door');
const Setup = require('./setup');

class Init extends InitFeature {
    addGraphics(feature) {
        feature.container = container(new Container()).layer('jackpotFlash').addTo(feature.game.stage).hide().position(1024, 1024).pivot(1024, 1024).instance;
        feature.container.interactiveChildren = false;

        feature.particleContainer = container(new ParticleContainer()).addTo(feature.container).instance;

        sprite('features/jackpot_flash_first/images/background.png').anchor(0, 0).addTo(feature.container);

        feature.torches = [
            container(new Torch(feature)).addTo(feature.container).position(652, 934).instance,
            container(new Torch(feature)).addTo(feature.container).position(1386, 934).instance
        ];

        feature.topLight = sprite('jackpot_flash_first/top_light.png').position(1017, 956).addTo(feature.container).sprite;

        feature.dust = container(new Dust(feature)).addTo(feature.container).instance;
        feature.highlights = container(new Highlights(feature)).addTo(feature.container).instance;

        feature.prizes = [
            container(new PrizeInstantWin('jackpot_flash_first/shelf_lights/1.png', settings.JACKPOT_FLASH_MULTIPLIERS.FIRST[0])).addTo(feature.container).position(796, 1105).instance,
            container(new PrizeInstantWin('jackpot_flash_first/shelf_lights/2.png', settings.JACKPOT_FLASH_MULTIPLIERS.FIRST[1])).addTo(feature.container).position(1240, 1102).instance,
            container(new PrizeInstantWin('jackpot_flash_first/shelf_lights/3.png', settings.JACKPOT_FLASH_MULTIPLIERS.FIRST[2])).addTo(feature.container).position(765, 990).instance,
            container(new PrizeInstantWin('jackpot_flash_first/shelf_lights/4.png', settings.JACKPOT_FLASH_MULTIPLIERS.FIRST[3])).addTo(feature.container).position(1274, 988).instance,
            container(new PrizeJackpot('jackpot_flash_first/shelf_lights/5.png')).addTo(feature.container).position(775, 880).instance,
            container(new PrizeJackpot('jackpot_flash_first/shelf_lights/6.png')).addTo(feature.container).position(1265, 880).instance,
            container(new PrizeDoor(feature)).addTo(feature.container).position(1018, 1045).instance
        ];

        feature.prizes[4].counter.changeValueInstantly(12345678);
        feature.prizes[5].counter.changeValueInstantly(12345678);
    }

    addSounds(feature) {
        feature.audioGroup = audio.group();
        feature.audio = {};
        feature.audio.ambient = feature.audioGroup.track('jackpot_flash_first/ambient.m4a');
        feature.audio.ambient.loop = true;

        feature.audio.playlist = feature.audioGroup.playlist({
            'loops': {
                'idle': ['jackpot_flash_first/loop_1.m4a'],
                'cycle': ['jackpot_flash_first/loop_2.m4a']
            }
        });
    }

    next(feature) {
        feature.states.change(Setup);
    }
}


module.exports = Init;
