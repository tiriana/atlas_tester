'use strict';

const {Container, sprite, container, features} = require('@omnigame/core');
const SwayContainer = require('../../../scripts/sway_container');
const BetPanel = require('../../gui/scripts/betpanel');
const FlareGold = require('./flare_gold');

const Credits = require('../../gui/scripts/credits');

class PrizeInstantWin extends Container {
    constructor(backlightFrame, multiplier) {
        super();

        // this.game = require('../../../scripts/main');

        this.light = sprite(backlightFrame).alpha(0).addTo(this).sprite;
        this.flare = container(new FlareGold()).alpha(0).addTo(this).layer('jackpotFlashEffects').instance;

        this.swayContainer = container(new SwayContainer(3, 1, 2 * Math.PI / 180)).addTo(this).instance;
        this.counter = container(new Credits()).addTo(this.swayContainer).instance;

        this.multiplier = multiplier;

        BetPanel.onBetRateChanged(this.updateAmount, this);

        this.updateAmount(features.gui.betPanel.betRate);
    }

    updateAmount(betRate) {
        this.counter.changeValueInstantly(betRate * this.multiplier);
    }
}

module.exports = PrizeInstantWin;
