'use strict';

const {Counter, Pool, MovieClip, PIXI, translatePosition, random} = require('@omnigame/core');

const movieClips = new Pool(10, true, true, function() {
    var clip = new MovieClip(settings.GUI_NUMBER_FRAMES[0]);
    clip.loop = true;
    clip.animationSpeed = 20;
    clip.blendMode = PIXI.BLEND_MODES.ADD;
    clip.anchor.set(0.5, 0.5);
    return clip;
});


class BetRate extends Counter {
    constructor() {
        super('guiCredits');

        this.value.alpha = 0;

        this.movieClipsUsed = 0;

        this._useBigTextures = false;

        Counter.onValueChange({'sender': this, 'receiver': this.onValueChange, 'context': this});
    }

    set useBigTextures(value) {
        this._useBigTextures = value;
        this.onValueChange();
    }

    get useBigTextures() {
        return this._useBigTextures;
    }

    onValueChange() {
        var i;

        this.value.updateTransform();

        const add = this.showCurrency ? 1 : 0;

        if (this.value.text.length + add > this.movieClipsUsed)
            for (i = this.movieClipsUsed; i < this.value.text.length + add; i++)
                this.addChild(movieClips.get());
        else
            for (i = this.movieClipsUsed; i > this.value.text.length + add; i--) {
                this.children[2 + i - 1].shader = null;
                movieClips.recycle(this.children[2 + i - 1]);
                this.removeChildAt(2 + i - 1);
            }

        this.movieClipsUsed = this.value.text.length + add;

        for (i = 0; i < this.value.text.length; i++) {
            var digit = this.value.children[0].children[i];
            var clip = this.children[2 + i];

            clip.scale.set(this._useBigTextures ? 0.5 : 1);

            clip.position.set(0, 0);

            if (this._useBigTextures)
                clip.textures = settings.GUI_NUMBER_FRAMES_BIG[this.value.text[i]];
            else
                clip.textures = settings.GUI_NUMBER_FRAMES[this.value.text[i]];

            translatePosition(digit, this, clip.position);

            clip.position.x += digit.width / 2;

            clip.position.y += 17;

            clip.play(random.integer(0, settings.GUI_NUMBER_FRAMES[this.value.text[i]].length));
        }

        if (this.showCurrency) {
            clip = this.children[2 + i];
            clip.position.set(0, 0);
            clip.scale.set(this._useBigTextures ? 0.5 : 1);
            clip.textures = settings.GUI_NUMBER_FRAMES_BIG['kr'];

            clip.position.x = this.children[2 + i - 1].position.x + this.children[2 + i - 1].width / 2 + 10;
            clip.position.y = this.children[2 + i - 1].position.y;

            clip.play(random.integer(0, settings.GUI_NUMBER_FRAMES_BIG['kr'].length));
        }
    }
}

module.exports = BetRate;
