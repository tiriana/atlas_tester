'use strict';

const {container, Container, Overlay} = require('@omnigame/core');
const Credits = require('./credits');

const SwayContainer = require('../../../scripts/sway_container');

class BigWin extends Container {
    constructor() {
        super();

        this.overlay = container(new Overlay('gui/square.png')).scale(256, 256).addTo(this).instance;
        this.overlay.tint = 0x000000;
        this.overlay.alphaTimeline.reset(0.8);

        this.swayContainer = container(new SwayContainer(5, 5, 1 * Math.PI / 180)).position(1024, 1024).addTo(this).instance;

        this.counter = container(new Credits()).scale(3.5).addTo(this.swayContainer).instance;
        this.counter.useBigTextures = true;
    }
}

module.exports = BigWin;
