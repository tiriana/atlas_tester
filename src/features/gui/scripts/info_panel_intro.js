'use strict';


const {Container, sprite} = require('@omnigame/core');

class IntroInfoPanel extends Container {
    constructor(feature) {
        super();

        this.interactive = true;

        this.feature = feature;

        this.interactiveChildren = true;

        this.game = require('../../../scripts/main.js');

        this.background = sprite('features/gui/images/intro_panel.png').addTo(this).instance;
    }
}

module.exports = IntroInfoPanel;
