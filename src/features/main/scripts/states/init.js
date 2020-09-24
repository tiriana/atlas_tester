'use strict';

const { PIXI, sprite, container, Container, ParticleContainer, audio, tweens } = require('@omnigame/core');
const InitFeature = require('../../../../scripts/states/init_feature');
const Reel = require('../reel');
const Sidebar = require('../sidebar');
const MultiplierLights = require('../multiplier_lights');
const TopMultiplier = require('../top_multiplier');
const PrizeOrb = require('../prize_orb');
const Symbol = require('../symbol');
const SwayContainer = require('../../../../scripts/sway_container');
const Sky = require('../sky');
const Effects = require('../effects');
const HueShader = require('../../../../scripts/hue_shader');
const FastForward = require('../fast_forward');
const Credits = require('../../../gui/scripts/credits');


function frameSort(a, b) {
    var d = a.length - b.length;

    if (d !== 0)
        return d;

    if (b < a)
        return 1;

    if (b > a)
        return -1;

    return 0;
}

function getFrames(pattern, out) {
    if (!out)
        out = [];

    for (var id in PIXI.utils.TextureCache) {
        if (id.match(pattern))
            out.push(id);
    }

    out.sort(frameSort);

    return out;
}

class Init extends InitFeature {
    create() {
        this.nextStates = {};
        this.nextStates.Setup = require('./setup');
    }

    addGraphics(feature) {
        feature.frames = {};
        feature.frames.brick = getFrames('main/particles/brick/');
        feature.frames.brickLandingDust = getFrames('main/effects/wild/brick_landing_dust/');
        feature.frames.lightningAfterburn = getFrames('main/effects/wild/lightning_afterburn/');
        feature.frames.lightning = [
            getFrames('main/effects/wild/lightning_1/'),
            getFrames('main/effects/wild/lightning_2/'),
            getFrames('main/effects/wild/lightning_3/'),
            getFrames('main/effects/wild/lightning_4/'),
            getFrames('main/effects/wild/lightning_5/'),
            getFrames('main/effects/wild/lightning_6/')
        ];
        feature.frames.lightningEnd = [
            getFrames('main/effects/wild/lightning_end_1/'),
            getFrames('main/effects/wild/lightning_end_2/'),
            getFrames('main/effects/wild/lightning_end_3/'),
            getFrames('main/effects/wild/lightning_end_4/'),
            getFrames('main/effects/wild/lightning_end_5/'),
            getFrames('main/effects/wild/lightning_end_6/')
        ];
        feature.frames.shockwave = getFrames('gui/shockwave');

        feature.container = new Container();
        feature.container.pivot.set(1024, 1024);
        feature.container.position.set(1024, 1024);
        feature.container.interactiveChildren = false;
        feature.game.stage.addChild(feature.container);

        feature.particleContainer = container(new ParticleContainer({ 'standalone': true })).addTo(feature.container).instance;

        feature.hueShader = new HueShader(0);

        feature.sky = new Sky();
        feature.container.addChild(feature.sky);
        feature.container.interactive = true;
        feature.container.hitArea = new PIXI.Rectangle(1190, 1050, 15, 25);
        feature.container.on('click', feature.sky.easterEgg, feature.sky);

        sprite('main/background/pyramid.png').place(0.5, 1, 1024, 1358).addTo(feature.container);
        feature.foreground = sprite('main/foreground/normal.png').place(0.5, 0, 1024, 1293).addTo(feature.container);
        feature.purpleForeground = sprite('main/foreground/purple.png').place(0.5, 0, 1024, 1293).alpha(0).hide().addTo(feature.container).sprite;

        /* River waves */
        const waveContainer = container().position(0, 1293).addTo(feature.container).instance;
        waveContainer.mask = sprite('features/main/images/wave_mask.jpg').anchor(0, 0).addTo(waveContainer).sprite;

        const ripple = sprite('features/main/images/ripple.jpg').scale(0.5, 0.5).addTo(waveContainer).sprite;
        tweens.position(ripple).start(0, 0).to(-4 * ripple.texture.width, ripple.texture.height, 64).repeat();

        feature.waves = sprite('main/other/waves.jpg').anchor(0, 0).blending('ADD').addTo(waveContainer).sprite;
        feature.purpleWaves = sprite('main/other/waves_purple.jpg').hide().alpha(0.0).anchor(0, 0).blending('ADD').addTo(waveContainer).sprite;
        const displacementFilter = new PIXI.filters.DisplacementFilter(ripple);
        feature.waves.filters = [displacementFilter];
        feature.purpleWaves.filters = [displacementFilter];
        /* River waves - END */

        feature.catLeft = sprite('main/cat_left.png').position(970, 870).addTo(feature.container).sprite;
        feature.catRight = sprite('main/cat_right.png').position(1080, 870).addTo(feature.container).sprite;
        feature.nefertiti = sprite('main/nefertiti.png').position(1024.5, 861).addTo(feature.container).sprite;

        feature.sidebar = container(new Sidebar(feature.hueShader)).addTo(feature.container).instance;
        feature.multiplierLights = container(new MultiplierLights()).addTo(feature.container).instance;

        feature.topMultiplier = container(new TopMultiplier(feature)).position(1024, 952).addTo(feature.container).instance;

        feature.reels = [];
        feature.symbols = [];
        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 6 - i; j++) {
                var reel = new Reel(feature.reels.length, j, i);
                reel.position.x = 770 + j * (settings.SYMBOL_WIDTH + 2) + i * (settings.SYMBOL_WIDTH + 2) / 2 - settings.SYMBOL_WIDTH / 2;
                reel.position.y = 1318 - i * (settings.SYMBOL_HEIGHT + 4) - 50;
                feature.reels.push(reel);
                feature.container.addChild(reel);
            }
        }

        for (i = 0; i < feature.reels.length; i++) {
            var symbol = new Symbol(feature);
            symbol.position.x = feature.reels[i].position.x + settings.SYMBOL_WIDTH / 2;
            symbol.position.y = feature.reels[i].position.y + settings.SYMBOL_HEIGHT / 2;
            symbol.layer = 'mainSymbols';
            symbol.zOrder = i;
            feature.symbols.push(symbol);
            feature.container.addChild(symbol);
        }

        feature.scatteredCollected = {};

        feature.updateScatteredTextures = function (collected) {
            var scattered = settings.SYMBOL_DEFINITIONS.scattered;
            if (collected === 0) {
                scattered.normalTexture = scattered.catLeftTexture;
                scattered.normalTextureBig = scattered.catLeftTextureBig;
                scattered.normalTextureGlow = scattered.catLeftTextureGlow;
                scattered.blurredTexture = scattered.catLeftBlurredTexture;
            } else if (collected === 1) {
                scattered.normalTexture = scattered.catRightTexture;
                scattered.normalTextureBig = scattered.catRightTextureBig;
                scattered.normalTextureGlow = scattered.catRightTextureGlow;
                scattered.blurredTexture = scattered.catRightBlurredTexture;
            } else {
                scattered.normalTexture = scattered.nefertitiTexture;
                scattered.normalTextureBig = scattered.nefertitiTextureBig;
                scattered.normalTextureGlow = scattered.nefertitiTextureGlow;
                scattered.blurredTexture = scattered.nefertitiBlurredTexture;
            }
        };

        for (i = 0; i < settings.BETPANEL_RATES.length; i++)
            feature.scatteredCollected[settings.BETPANEL_RATES[i]] = 0;

        feature.prizeOrbContainer = container(new SwayContainer(5, 3, 10 * Math.PI / 180)).position(1024, 600).scale(1.4).addTo(feature.container).instance;
        feature.prizeOrb = container(new PrizeOrb(3, feature)).addTo(feature.prizeOrbContainer).instance;

        feature.effects = container(new Effects()).addTo(feature.container).instance;
        feature.effects.visible = false;

        // Used for counting up credits
        feature.winAmountContainer = container(new Container()).hide().alpha(0).layer('guiParticlesAdd').addTo(feature.container).instance;
        feature.winAmountShaderFix = sprite('main/square.png').addTo(feature.winAmountContainer).alpha(0).scale(200); // needed to render big wins for the filter
        feature.winAmount = container(new Credits()).addTo(feature.winAmountContainer).instance;
        feature.winAmount.useBigTextures = true;

        // Used to calculate spin duration
        feature.spinStart = 0;
        feature.spinEnd = 0;

        feature.fastForward = new FastForward(feature.game.clock, feature.container.parent);
        feature.fastForward.onSpeedUp(function () {
            feature.audio.ambient.rate = feature.game.clock.speed;
        });
        feature.fastForward.onSlowDown(function () {
            feature.audio.ambient.rate = 1;
        });
    }

    addSounds(feature) {
        feature.audioGroup = audio.group();
        feature.audioGroup.volume = 0;
        feature.audio = {};
        feature.audio.ambient = feature.audioGroup.track('main/music/loop.m4a');
        feature.audio.ambient.loop = true;
        feature.audio.ambient.play();

        feature.audio.wind = feature.audioGroup.track('main/music/loop_wind.m4a');
        feature.audio.wind.loop = true;
        feature.audio.wind.play();

        feature.audio.tension = feature.audioGroup.track('main/instant_win/orbs/tension_music.m4a');
        feature.audio.tension.loop = true;

        feature.fastForward.biquadFilter.connect(audio.input);
        feature.audioGroup.panner.disconnect();
        feature.audioGroup.panner.connect(feature.fastForward.biquadFilter);

        audio.choices('orbShot', /main\/instant_win\/orbs\/shot\/\d\.m4a/);

        audio.choices('wildLand', /main\/wild\/land\/[^1]\.m4a/);

        audio.choices('instantWinLow', /main\/instant_win\/win\/low\/\d\.m4a/);
        audio.choices('instantWinMedium', /main\/instant_win\/win\/medium\/\d\.m4a/);
        audio.choices('instantWinHigh', /main\/instant_win\/win\/high\/\d\.m4a/);

        audio.choices('wheelStart', /main\/wheel\/spin\/\d\.m4a/);
        audio.choices('wheelStop', /main\/wheel\/stop\/\d\.m4a/);
        audio.choices('wheelFrame', /main\/wheel\/stop\/frame\/\d\.m4a/);
    }

    next(feature) {
        feature.states.change(this.nextStates.Setup);
    }
}


module.exports = Init;
