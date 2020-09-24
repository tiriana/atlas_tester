'use strict';

const {MovieClip, numbers, tweens} = require('@omnigame/core');


const betLabelFrames = [];
const numFrames = 37;
for (var i = 0; i < numFrames; i += 1) {
    betLabelFrames[i] = `gui/indsats_animation/indsats_${numbers.pad(i, 2)}.png`;
    const j = numFrames - i - 1;
    betLabelFrames[i + numFrames] = `gui/indsats_animation/indsats_${numbers.pad(j, 2)}.png`;
}


class BetLabel extends MovieClip {
    constructor() {
        super(betLabelFrames);
        this.loop = true;
        this.targetFrame = 0;
        this.animationSpeed = 45;
        this.texture = this.textures[this.targetFrame];
    }

    update(elapsed) {
        super.update(elapsed);

        if (this.currentFrame === this.targetFrame)
            this.playing = false;
    }

    playTo(frame) {
        if (frame === this.currentFrame) return;
        this.targetFrame = frame;
        this.play(this.currentFrame);
    }

    pulse() {
        const time = 1.2;
        tweens.scale(this).to(1.1, time, 'sineIn').to(1.2, time, 'sineOut').to(1.1, time, 'sineIn').to(1, time, 'sineOut').repeat();
    }

    stopPulse() {
        tweens.scale(this).stop().to(1, 0.5, 'sineOut');
    }
}

module.exports = BetLabel;
