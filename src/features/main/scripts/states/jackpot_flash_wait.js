'use strict';


const {tweens, State, features} = require('@omnigame/core');
const nodeStructure = require('../node_structure');
const Setup = require('./setup');

const OffFirst = require('../../../jackpot_flash_first/scripts/states/off');

class JackpotFlashWait extends State {
    create() {
        this.nextStates = {};
        this.nextStates.AnimateWilds = require('./animate_wilds');
        this.nextStates.ClustersShow = require('./clusters_show');
        this.nextStates.Respin = require('./respin');

        this.winIndex = -1;
    }

    enter(feature) {
        if (feature.states.previous === Setup)
            feature.container.visible = false;

        feature.fastForward.disable();
    }

    onDeactivating(feature, name) {
        if (name === 'jackpotFlashFirst') {
            OffFirst.onEnter.once(this.show, this);

            feature.container.visible = true;
            feature.scatteredCollected[features.gui.betPanel.rawBetRate] = 0;
            feature.updateScatteredTextures(0);

            feature.audioGroup.fadeIn(2);

            tweens.alpha(feature.catLeft).start().to(0, 0.125);
            tweens.alpha(feature.catRight).start().to(0, 0.125);
            tweens.alpha(feature.nefertiti).start().to(0, 0.125);

            return true;
        }
    }

    show() {
        tweens.alpha(features.gui.featureOverlay).start().to(0, 2).call(this.next, this);
    }

    next(feature) {
        if (nodeStructure.wilds.length)
            feature.states.change(this.nextStates.AnimateWilds);
        else if (nodeStructure.wins.length)
            feature.states.change(this.nextStates.ClustersShow);
        else
            feature.states.change(this.nextStates.Respin);
    }
}


module.exports = JackpotFlashWait;
