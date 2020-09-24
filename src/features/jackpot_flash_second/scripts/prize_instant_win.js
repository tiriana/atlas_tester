'use strict';

const {Container, container, features} = require('@omnigame/core');
const SwayContainer = require('../../../scripts/sway_container');
const BetPanel = require('../../gui/scripts/betpanel');

const FlareBlue = require('./flare_blue');

const Credits = require('../../gui/scripts/credits');

class PrizeInstantWinSecond extends Container {
    constructor(multiplier) {
        super();

        this.game = require('../../../scripts/main');

        this.rotationContainer = container(new Container()).addTo(this).instance;
        this.flare = container(new FlareBlue()).alpha(0).addTo(this.rotationContainer).layer('jackpotFlashEffects').instance;
        this.swayContainer = container(new SwayContainer(3, 1, 2 * Math.PI / 180)).addTo(this.rotationContainer).instance;
        this.counter = container(new Credits()).addTo(this.swayContainer).instance;

        this.multiplier = multiplier;

        BetPanel.onBetRateChanged(this.updateAmount, this);

        this.updateAmount(features.gui.betPanel.betRate);
    }

    updateAmount(betRate) {
        this.counter.changeValueInstantly(betRate * this.multiplier);
    }
}

module.exports = PrizeInstantWinSecond;
