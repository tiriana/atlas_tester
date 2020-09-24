'use strict';

const {Container, button, Button, container, tweens, Overlay} = require('@omnigame/core');
const InfoPanelIntro = require('./info_panel_intro');
const InfoPanelPrize = require('./info_panel_prize');

class IntroInfoPanel extends Container {
    constructor(feature) {
        super();

        this.interactive = true;

        this.feature = feature;

        this.interactiveChildren = true;

        this.game = require('../../../scripts/main.js');

        this.pageIndex = 0;

        this.pages = [
            container(new InfoPanelIntro(feature)).addTo(this).instance,
            container(new InfoPanelPrize(feature)).addTo(this).instance
        ];

        this.left   = button('gui/buttons/arrow_up/?.png').anchor(0.5, 35 / 69).position(-40, 260).hitAreaCircle(21).rotation(Math.PI / 2).scale(1.2, -1.2).disable().addTo(this).button;
        this.right  = button('gui/buttons/arrow_down/?.png').anchor(0.5, 35 / 69).position(40, 260).hitAreaCircle(21).rotation(Math.PI / 2).scale(1.2, -1.2).enable().addTo(this).button;

        Button.onClick({'sender': this.left, 'context': this, 'receiver': this.previous});
        Button.onClick({'sender': this.right, 'context': this, 'receiver': this.next});

        this.movePages();
    }

    movePages() {
        for (var i = 0; i < this.pages.length; i++) {
            tweens.position(this.pages[i]).start().to((i - this.pageIndex) * 2048, 0, 0.5, 'quintic');
            tweens.alpha(this.pages[i]).start().to(i === this.pageIndex ? 1 : 0, 0.5, 'quintic');
        }
    }

    previous() {
        if (!tweens.alpha(this.pages[0]).ended || this.pageIndex === 0)
            return;

        this.pageIndex = Math.max(0, this.pageIndex - 1);

        this.right.enable();

        if (this.pageIndex === 0)
            this.left.disable();

        this.movePages();
    }

    next() {
        if (!tweens.alpha(this.pages[0]).ended || this.pageIndex === this.pages.length - 1)
            return;

        this.pageIndex = Math.min(this.pages.length - 1, this.pageIndex + 1);

        this.left.enable();

        if (this.pageIndex === this.pages.length - 1)
            this.right.disable();

        this.movePages();
    }

    show() {
        this.feature.overlay.enable();
        tweens.position(this).start(1024, 1024 + 2048).to(1024, 1024, 1, 'cubicOut');
        tweens.alpha(this).start(0).show().to(1, 1, 'cubicOut');
        tweens.alpha(this.feature.overlay).start().to(0.75, 1, 'cubicOut').call(this.attachOverlayClick, this);
    }

    hide() {
        tweens.position(this).start().to(1024, 1024 - 2048, 1, 'cubicIn');
        tweens.alpha(this).start().to(0, 1, 'cubicIn').hide();
        this.feature.overlay.disable();
        tweens.alpha(this.feature.overlay).start().to(0, 1, 'cubicIn');
        Overlay.onClick.disconnect(this.hide);
    }

    attachOverlayClick() {
        Overlay.onClick.once(this.hide, this);
    }
}

module.exports = IntroInfoPanel;
