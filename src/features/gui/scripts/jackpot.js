'use strict';

var {Counter, Pool, MovieClip, PIXI, translatePosition, random} = require('@omnigame/core');

const HueShader = require('../../../scripts/hue_shader');

const hueShader = new HueShader(0.45);

const movieClips = new Pool(10, true, true, function() {
    var clip = new MovieClip(settings.GUI_NUMBER_FRAMES[0]);
    clip.loop = true;
    clip.animationSpeed = 20;
    clip.blendMode = PIXI.BLEND_MODES.ADD;
    clip.anchor.set(0.5, 0.5);
    clip.shader = hueShader;
    return clip;
});


class Jackpot extends Counter {
    constructor() {
        super('guiCredits', 'gui/kr.png', true);

        this.value.alpha = 0;
        this.currency.alpha = 0;

        this.movieClipsUsed = 0;

        Counter.onValueChange({'sender': this, 'receiver': this.onValueChange, 'context': this});
    }

    onValueChange() {
        var i;

        this.value.updateTransform();

        if (this.value.text.length + 1 > this.movieClipsUsed)
            for (i = this.movieClipsUsed; i < this.value.text.length + 1; i++)
                this.addChild(movieClips.get());
        else
            for (i = this.movieClipsUsed; i > this.value.text.length + 1; i--) {
                movieClips.recycle(this.children[2 + i - 1]);
                this.removeChildAt(2 + i - 1);
            }

        this.movieClipsUsed = this.value.text.length + 1;

        for (i = 0; i < this.value.text.length; i++) {
            var digit = this.value.children[0].children[i];
            var clip = this.children[2 + i];

            clip.position.set(0, 0);

            clip.textures = settings.GUI_NUMBER_FRAMES[this.value.text[i]];

            translatePosition(digit, this, clip.position);

            clip.position.x += digit.width / 2;

            clip.position.y += 17;

            clip.play(random.integer(0, settings.GUI_NUMBER_FRAMES[this.value.text[i]].length));

            clip.update(0);
        }

        clip = this.children[2 + i];
        clip.position.set(0, 0);
        clip.textures = settings.GUI_NUMBER_FRAMES['kr'];

        clip.position.x = this.children[2 + i - 1].position.x + this.children[2 + i - 1].width / 2 + 10;
        clip.position.y = this.children[2 + i - 1].position.y;

        clip.play(random.integer(0, settings.GUI_NUMBER_FRAMES['kr'].length));
    }
}

module.exports = Jackpot;
