'use strict';

const {Container, container, sprite} = require('@omnigame/core');
const SwayContainer = require('../../../scripts/sway_container');

const FlareBlue = require('./flare_blue');

const Jackpot = require('../../gui/scripts/jackpot');

class PrizeJackpotSecond extends Container {
    constructor(label) {
        super();

        this.game = require('../../../scripts/main');

        this.rotationContainer = container(new Container()).addTo(this).instance;
        this.flare = container(new FlareBlue()).alpha(0).addTo(this.rotationContainer).position(0, 20).layer('jackpotFlashEffects').instance;
        this.swayContainer = container(new SwayContainer(3, 1, 2 * Math.PI / 180)).addTo(this.rotationContainer).instance;
        this.label = sprite(label).addTo(this.swayContainer).position(0, -20).layer('jackpotFlashLabels').sprite;
        this.counter = container(new Jackpot()).position(0, 20).addTo(this.swayContainer).instance;
    }
}

module.exports = PrizeJackpotSecond;
