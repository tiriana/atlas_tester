'use strict';


const {Signal, Container, sprite} = require('@omnigame/core');
const BetRate = require('./bet_rate');


const BETPANEL_RATES = settings.BETPANEL_RATES;


for (var id in settings.SYMBOL_DEFINITIONS) {
    var definition = settings.SYMBOL_DEFINITIONS[id];

    if (!definition.multipliers)
        continue;

    for (var i = 0; i < BETPANEL_RATES.length; i++) {
        var rate = BETPANEL_RATES[i];
        for (var j = 0; j < definition.multipliers.length; j++) {
            var value = definition.multipliers[j] * rate / 100;

            if (Math.floor(value) !== value)
                console.warn(`Invalid value for bet rate "${rate}" and symbol multiplier "${definition.multipliers[j] / 100}": ${value}`);
        }
    }
}


class Betpanel extends Container {
    constructor() {
        super();

        this.game = require('../../../scripts/main.js');

        this.index = 0;
        this.betRate = BETPANEL_RATES[0];
        this.magicBet = 1;

        this.number = sprite(new BetRate()).layer('guiParticlesAdd').scale(0.75).pivot(0, -20).position(0, -16).addTo(this).sprite;

        this.updateNumbers();

        Betpanel.onBetRateChanged(this.updateNumbers, this);
    }

    get rawBetRate() {
        return BETPANEL_RATES[this.index];
    }

    updateNumbers() {
        this.number.changeValueInstantly(this.betRate);
    }

    increaseMagicBet() {
        var oldBetRate = this.betRate;
        this.magicBet++;
        this.betRate = BETPANEL_RATES[this.index] * this.magicBet;
        Betpanel.onBetRateChanged.send(this.betRate, this, oldBetRate);
    }
    
    resetMagicBet() {
        var oldBetRate = this.betRate;
        this.magicBet = 1;
        this.betRate = BETPANEL_RATES[this.index];
        Betpanel.onBetRateChanged.send(this.betRate, this, oldBetRate);
    }

    increaseBetRate() {
        var oldBetRate = this.betRate;
        this.index = Math.min(this.index + 1, BETPANEL_RATES.length - 1);
        this.betRate = BETPANEL_RATES[this.index];
        if (oldBetRate !== this.betRate) {
            Betpanel.onBetRateChanged.send(this.betRate, this, oldBetRate);
            Betpanel.onBetRateChangedByUser.send(this.betRate, this, oldBetRate);
        }
    }

    decreaseBetRate() {
        var oldBetRate = this.betRate;
        this.index = Math.max(this.index - 1, 0);
        this.betRate = BETPANEL_RATES[this.index];
        if (oldBetRate !== this.betRate) {
            Betpanel.onBetRateChanged.send(this.betRate, this, oldBetRate);
            Betpanel.onBetRateChangedByUser.send(this.betRate, this, oldBetRate);
        }
    }

    setBetRate(value) {
        var oldBetRate = this.betRate;
        var index = BETPANEL_RATES.indexOf(value);
        if (index === -1)
            throw new Error('Bet rate does not exist');
        this.betRate = value;
        this.index = index;
        Betpanel.onBetRateChanged.send(this.betRate, this, oldBetRate);
    }
}

Betpanel.onBetRateChanged = new Signal();
Betpanel.onBetRateChangedByUser = new Signal();


module.exports = Betpanel;
