'use strict';

const {Container, sprite, container} = require('@omnigame/core');
const SwayContainer = require('../../../scripts/sway_container');

const FlareBlue = require('./flare_blue');

const Jackpot = require('../../gui/scripts/jackpot');

class PrizeJackpot extends Container {
    constructor(backlightFrame) {
        super();

        // this.game = require('../../../scripts/main');

        this.light = sprite(backlightFrame).alpha(0).addTo(this).sprite;
        this.flare = container(new FlareBlue()).alpha(0).addTo(this).layer('jackpotFlashEffects').instance;

        this.swayContainer = container(new SwayContainer(3, 1, 2 * Math.PI / 180)).addTo(this).instance;
        this.counter = container(new Jackpot()).addTo(this.swayContainer).instance;
    }
}

module.exports = PrizeJackpot;
