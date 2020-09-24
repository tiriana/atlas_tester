'use strict';

const {Container, sprite, tweens} = require('@omnigame/core');

class MultiplierLights extends Container {
    constructor() {
        super();

        this.game = require('../../../scripts/main');

        this.left = [];
        this.right = [];

        this.left.push(sprite('main/multiplier_lights/left/2.png').position(745, 1236).alpha(0).addTo(this).sprite);
        this.left.push(sprite('main/multiplier_lights/left/3.png').position(789, 1155).alpha(0).addTo(this).sprite);
        this.left.push(sprite('main/multiplier_lights/left/4.png').position(840, 1080).alpha(0).addTo(this).sprite);
        this.left.push(sprite('main/multiplier_lights/left/5.png').position(884, 1008).alpha(0).addTo(this).sprite);

        this.right.push(sprite('main/multiplier_lights/right/2.png').position(1297, 1248).alpha(0).addTo(this).sprite);
        this.right.push(sprite('main/multiplier_lights/right/3.png').position(1251, 1147).alpha(0).addTo(this).sprite);
        this.right.push(sprite('main/multiplier_lights/right/4.png').position(1214, 1071).alpha(0).addTo(this).sprite);
        this.right.push(sprite('main/multiplier_lights/right/5.png').position(1161, 1005).alpha(0).addTo(this).sprite);

        this.level = 0;
    }

    add(delay = 0) {
        if (this.level === this.left.length)
            return;
        tweens.alpha(this.left[this.level]).start(0).delay(delay).to(0.5, 0.25);
        tweens.alpha(this.right[this.level]).start(0).delay(delay).to(0.5, 0.25);
        this.level++;
    }

    subtract(delay = 0) {
        if (this.level === 0)
            throw new Error('Limit reached');
        this.level--;
        tweens.alpha(this.left[this.level]).start().delay(delay).to(0, 1);
        tweens.alpha(this.right[this.level]).start().delay(delay).to(0, 1);
    }
}

module.exports = MultiplierLights;
