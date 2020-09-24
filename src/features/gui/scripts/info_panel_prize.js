'use strict';


const {Container, sprite, button, Counter, container, Button} = require('@omnigame/core');
const BetPanel = require('./betpanel');
const nodeStructure = require('../../main/scripts/node_structure');

const PRIZE_TABLE = [];

for (var id in settings.SYMBOL_DEFINITIONS) {
    var definition = settings.SYMBOL_DEFINITIONS[id];

    if (!definition.multipliers)
        continue;

    var output = [definition.multipliers[0]];

    for (var i = 1; i < definition.multipliers.length; i++)
        output[i] = definition.multipliers[i] + output[i - 1];

    PRIZE_TABLE.push(output);
}


class PrizeInfoPanel extends Container {
    constructor(feature) {
        super();

        this.interactive = true;

        this.feature = feature;

        this.topRow = 20;

        var i;

        this.interactiveChildren = true;

        this.game = require('../../../scripts/main.js');

        this.background = sprite('features/gui/images/prize_list.png').addTo(this).instance;

        this.up   = button('gui/buttons/arrow_up/?.png').anchor(0.5, 35 / 69).position(330, 45).hitAreaCircle(21).enable().addTo(this).button;
        this.down = button('gui/buttons/arrow_down/?.png').anchor(0.5, 35 / 69).position(330, 165).hitAreaCircle(21).enable().addTo(this).button;

        this.labels = new Array(4);

        this.numbers = new Array(4 * 8);

        for (i = 0; i < this.labels.length; i++)
            this.labels[i] = container(new Counter('guiInfoCredits')).position(-335, i * 39 + 45).addTo(this).instance;

        for (i = 0; i < this.numbers.length; i++)
            this.numbers[i] = container(new Counter('guiInfoCredits')).position((i % 8) * 74 - 263, Math.floor(i / 8) * 39 + 45).addTo(this).instance;

        BetPanel.onBetRateChanged(this.updateNumbers, this);
        Button.onClick({'sender': this.up, 'receiver': this.moveUp, 'context': this});
        Button.onClick({'sender': this.down, 'receiver': this.moveDown, 'context': this});
    }

    moveUp() {
        this.topRow = Math.min(20, this.topRow + 1);
        this.updateNumbers();
    }

    moveDown() {
        this.topRow = Math.max(nodeStructure.clusterSize + 3, this.topRow - 1);
        this.updateNumbers();
    }

    updateNumbers() {
        var i;
        var betRate = this.feature.betPanel.betRate;

        for (i = 0; i < this.labels.length; i++)
            this.labels[i].changeValueInstantly(this.topRow - i);

        var maxWidth = 0;
        for (i = 0; i < this.numbers.length; i++) {
            this.numbers[i].changeValueInstantly(PRIZE_TABLE[i % 8][this.topRow - Math.floor(i / 8) - 1] * betRate / 100);
            this.numbers[i].scale.set(1);
            maxWidth = Math.max(maxWidth, this.numbers[i].width);
        }

        var scale = maxWidth > 68 ? 68 / maxWidth : 1;

        for (i = 0; i < this.numbers.length; i++)
            this.numbers[i].scale.set(scale);
    }
}

module.exports = PrizeInfoPanel;
