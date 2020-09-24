'use strict';


const {tweens, sprite, audio, Signal} = require('@omnigame/core');


class FastForward {
    constructor(clock, parent) {
        this.overlay = sprite('gui/square.png').anchor(0).alpha(0.0001).size(2048).blending('ADD').layer('featureOverlay').hide().addTo(parent).sprite;
        this.arrows = sprite('gui/fastforward.png').anchor(0.5).alpha(0).position(1036, 1155).blending('ADD').layer('featureOverlay').hide().addTo(parent).sprite;

        this.clock = clock;
        this.enabled = false;
        this.active = false;
        this.originalClockSpeed = -1;

        this.biquadFilter = audio.context.createBiquadFilter();
        this.biquadFilter.frequency.setValueAtTime(this.biquadFilter.frequency.maxValue || 24000, audio.time);

        this.delayTween = tweens.create();

        this.onSpeedUp = new Signal();
        this.onSlowDown = new Signal();

        this.overlay.on('touchstart', this.speedUp, this);
        this.overlay.on('mousedown', this.speedUp, this);

        this.slowDown = this.slowDown.bind(this);

        window.addEventListener('touchend', this.slowDown);
        window.addEventListener('mouseup', this.slowDown);
        window.addEventListener('mouseout', this.slowDown);
    }

    setFrequency(value, duration = 1) {
        var frequency = this.biquadFilter.frequency;
        if (frequency.cancelAndHoldAtTime)
            frequency.cancelAndHoldAtTime(audio.time);
        else {
            frequency.cancelScheduledValues(audio.time);
            frequency.setValueAtTime(frequency.value, audio.time + 0.001);
        }
        frequency.linearRampToValueAtTime(value, audio.time + duration);
    }

    enable() {
        if (this.enabled)
            return;

        tweens.alpha(this.overlay).show();
        this.overlay.alpha = Math.max(this.overlay.alpha, 0.0001);
        this.overlay.interactive = true;

        this.enabled = true;
    }

    disable() {
        if (!this.enabled)
            return;

        this.overlay.interactive = false;

        if (this.active)
            this.slowDown();

        tweens.alpha(this.overlay).hide();

        this.active = this.enabled = false;
    }

    speedUp() {
        if (!this.enabled || this.active)
            return;

        this.delayTween.start(0).delay(0.1).call(this._actuallySpeedUp, this);
    }

    _actuallySpeedUp() {
        if (!this.enabled || this.active)
            return;

        this.originalClockSpeed = this.clock.speed;

        this.clock.speedUp(this.clock.speed * 4, 1 / 10);

        this.setFrequency(200);

        tweens.alpha(this.arrows).start().show().to(0.5, 1);

        this.active = true;

        this.onSpeedUp.send();
    }

    slowDown() {
        this.delayTween.stop();

        if (!this.enabled || !this.active)
            return;

        if (this.originalClockSpeed === -1)
            this.originalClockSpeed = this.clock.speed;
        this.clock.slowDown(this.originalClockSpeed);
        this.originalClockSpeed = -1;

        this.setFrequency(this.biquadFilter.frequency.maxValue || 24000);

        tweens.alpha(this.arrows).start().to(0, 0.5, 'cubic').hide();

        this.active = false;

        this.onSlowDown.send();
    }
}


module.exports = FastForward;
