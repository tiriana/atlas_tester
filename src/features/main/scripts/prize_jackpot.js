'use strict';

const {Container, container, sprite} = require('@omnigame/core');
const SwayContainer = require('../../../scripts/sway_container');

const Jackpot = require('../../gui/scripts/jackpot');

class PrizeJackpot extends Container {
    constructor(label) {
        super();

        this.swayContainer = container(new SwayContainer(3, 1, 2 * Math.PI / 180)).addTo(this).instance;
        this.label = sprite(label).addTo(this.swayContainer).position(0, -20).layer('bg').sprite;
        this.counter = container(new Jackpot()).position(0, 20).addTo(this.swayContainer).instance;

    }

    update(elapsed) {
        super.update(elapsed);

        this.scale.set((0.75 + (this.parent.scale.x - 1) * 0.25) / this.parent.scale.x);
        this.position.set(1024 + (this.parent.pivot.x - 1024) * 0.25, 1024 + (this.parent.pivot.y - 1024) * 0.25);
    }
}

module.exports = PrizeJackpot;
