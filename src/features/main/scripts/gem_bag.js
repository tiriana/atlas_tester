'use strict';

const {random} = require('@omnigame/core');

class GemBag {
    constructor(step, weights, values) {
        this.step = step;
        this.weights = weights;
        this.values = values;

        this.sum = 0;
        this.counter = 0;
        this.value = 0;

        for (var i = 0; i < weights.length; i++)
            this.sum += weights[i];

        this.randomize();
    }

    randomize() {
        this.counter = random.integer(0, this.step);
        this.value = this._pick();
    }

    _pick() {
        var r = random.integer(0, this.sum);

        var sum = 0;
        for (var i = 0; i < this.weights.length; i++) {
            sum += this.weights[i];
            if (r < sum)
                return this.values[i];
        }

        throw new Error('Out of bounds');
    }

    pick() {
        if (this.counter)
            this.counter--;
        else {
            this.value = this._pick();

            if (this.value !== 'scattered' && this.value !== 'wild')
                this.counter = this.step - 1;
        }
        return this.value;
    }
}

module.exports = GemBag;
