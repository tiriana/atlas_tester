'use strict';


const {PIXI, translatePosition, tweens, State, random, numbers, features} = require('@omnigame/core');
const nodeStructure = require('../node_structure');
const signals = require('../../../../scripts/signals');

const SHOCKWAVE_TEXTURES = [];

for (var i = 0; i < 48; i++)
    SHOCKWAVE_TEXTURES[i] = `gui/shockwave/${i}.jpg`;

const tempPoint = new PIXI.Point();

class Filter extends PIXI.AbstractFilter {
    constructor(sprite, scale) {
        var maskMatrix = new PIXI.Matrix();
        sprite.renderable = false;

        super(
            // vertex shader
            `precision mediump float;

            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            attribute vec4 aColor;

            uniform mat3 projectionMatrix;
            uniform vec4 mapFrame;

            varying vec2 vMapCoord;
            varying vec2 vTextureCoord;
            varying vec4 vColor;

            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
                vMapCoord = mapFrame.xy + aTextureCoord * (mapFrame.zw - mapFrame.xy);
                vColor = vec4(aColor.rgb * aColor.a, aColor.a);
            }`,
            // fragment shader
            `precision mediump float;

            varying vec2 vMapCoord;
            varying vec2 vTextureCoord;
            varying vec4 vColor;

            uniform vec2 scale;
            uniform sampler2D uSampler;
            uniform sampler2D mapSampler;
            uniform float alpha;

            void main(void) {
                gl_FragColor = texture2D(uSampler, mod(vTextureCoord + (texture2D(mapSampler, vMapCoord).xy - 0.5) * scale, 1.0)) * vColor * alpha;
            }`,
            // uniforms
            {
                'mapSampler': {'type': 'sampler2D', 'value': sprite.texture},
                'mapFrame': {'type': 'v4', 'value': {'x': 0, 'y': 0, 'z': 0, 'w': 0}},
                'scale': {'type': 'v2', 'value': {'x': 1, 'y': 1}},
                'alpha': {'type': '1f', 'value': 1}
            }
        );

        this.maskSprite = sprite;
        this.maskMatrix = maskMatrix;

        if (scale === null || scale === undefined)
            scale = 20;

        this.scale = new PIXI.Point(scale, scale);
    }

    applyFilter(renderer, input, output, clear) {
        var renderTarget = renderer.filterManager.getRenderTarget(true);
        renderer.blendModeManager.setBlendMode(PIXI.BLEND_MODES.ADD);

        var filterManager = renderer.filterManager;

        var maskUVs = this.maskSprite.texture._uvs;
        this.uniforms.mapFrame.value.x = maskUVs.x0;
        this.uniforms.mapFrame.value.y = maskUVs.y0;
        this.uniforms.mapFrame.value.z = maskUVs.x1;
        this.uniforms.mapFrame.value.w = maskUVs.y3;
        this.uniforms.scale.value.x = this.scale.x * (1 / input.frame.width);
        this.uniforms.scale.value.y = this.scale.y * (1 / input.frame.height);

        var shader = this.getShader(renderer);
        filterManager.applyFilter(shader, input, output, clear);

        renderer.blendModeManager.setBlendMode(PIXI.BLEND_MODES.NORMAL);
        renderer.filterManager.returnRenderTarget(renderTarget);
    }
}

const FILTER_ARRAY = [];


class CollectWinAmounts extends State {
    create() {
        this.nextStates = {};
        this.nextStates.Respin = require('./respin');
        this.nextStates.SpinTopOrb = require('./spin_top_orb');
    }

    enter(feature) {
        if (FILTER_ARRAY.length === 0) {
            FILTER_ARRAY.push(new Filter(PIXI.Sprite.fromFrame('main/other/map.jpg')));
            FILTER_ARRAY[0].scale.set(0, 0);
        }

        // merged cluster will be used for multiplying every cluster win amount
        this.mergedCluster = nodeStructure.mergeClusters(nodeStructure.wins);

        var x = 0;
        var y = 0;
        var i, symbol;

        for (i = 0; i < this.mergedCluster.length; i++) {
            symbol = feature.symbols[this.mergedCluster[i].index];
            x += symbol.position.x;
            y += symbol.position.y;
        }

        x /= this.mergedCluster.length;
        y /= this.mergedCluster.length;

        var d;

        var minDistance = Infinity;
        var minSymbol = null;
        var maxDistance = -Infinity;

        for (i = 0; i < this.mergedCluster.length; i++) {
            symbol = feature.symbols[this.mergedCluster[i].index];

            d = numbers.distance(symbol.position.x, symbol.position.y, x, y);

            if (d < minDistance) {
                minDistance = d;
                minSymbol = symbol;
            }
        }

        for (i = 0; i < this.mergedCluster.length; i++) {
            symbol = feature.symbols[this.mergedCluster[i].index];

            d = numbers.distance(symbol.position.x, symbol.position.y, minSymbol.position.x, minSymbol.position.y);

            if (d > maxDistance)
                maxDistance = d;
        }

        feature.winAmountContainer.position.set(minSymbol.position.x, minSymbol.position.y);
        feature.winAmount.changeValueInstantly(minSymbol.winAmount.amount);

        var delay = 0;
        var maxDuration = 0;
        var minDuration = Infinity;
        var winAmount = 0;

        for (i = 0; i < this.mergedCluster.length; i++) {
            symbol = feature.symbols[this.mergedCluster[i].index];

            winAmount += symbol.winAmount.amount;

            if (symbol === minSymbol)
                continue;

            d = numbers.distance(symbol.position.x, symbol.position.y, minSymbol.position.x, minSymbol.position.y) / maxDistance;

            delay = d + random.uniform(-0.125, 0.125);
            feature.game.schedule(delay, this.flyWinAmount, this, this.mergedCluster[i].index, i, minSymbol);
            maxDuration = Math.max(maxDuration, delay);
            minDuration = Math.min(minDuration, delay);
        }

        if (winAmount > 20 * features.gui.betPanel.rawBetRate)
            signals.info.bigInstantWin.send(winAmount);

        if (winAmount > features.gui.betPanel.betRate * settings.CLUSTER_LEVELS.MEDIUM)
            feature.audioGroup.effect('main/instant_win/count_up/lvl_3.m4a').delay((minDuration + 0.5) / feature.game.clock.speed).rate(feature.game.clock.speed).play();
        else if (winAmount > features.gui.betPanel.betRate * settings.CLUSTER_LEVELS.LOW)
            feature.audioGroup.effect('main/instant_win/count_up/lvl_2.m4a').delay(minDuration / feature.game.clock.speed).rate(feature.game.clock.speed).play();
        else
            feature.audioGroup.effect('main/instant_win/count_up/lvl_1.m4a').delay(minDuration / feature.game.clock.speed).rate(feature.game.clock.speed).play();

        feature.game.schedule(minDuration + 1, this.showCenterWinAmount, this, winAmount, maxDuration - minDuration, minSymbol);
    }

    showCenterWinAmount(feature, winAmount, duration, minSymbol) {
        var x = 0;
        var y = 0;
        var i, count;

        var countupDuration = 2;

        feature.winAmountContainer.visible = true;
        feature.winAmountContainer.alpha = 1;
        feature.winAmountContainer.scale.set(1);
        feature.winAmount.scale.set(1);
        minSymbol.visible = false;
        feature.winAmountContainer.updateTransform();

        var index = feature.symbols.indexOf(minSymbol);
        var frame = feature.effects.frames[index];

        tweens.create(frame, 'particleAlpha').start().to(0, 0.5);

        tweens.alpha(frame.overlay).start().to(1, 0.5);

        var sidebarBricksLeft = settings.SIDEBAR_BRICKS_COUNT - feature.sidebar.level;
        if (sidebarBricksLeft) {
            count = Math.min(sidebarBricksLeft, this.mergedCluster.length);
            for (i = 0; i < count; i++)
                feature.game.schedule(countupDuration * i / count, this.addSidebarBrick, this, i);
        }

        feature.winAmount.changeValue(winAmount, false, countupDuration);

        var afterCheckDelay = 1;

        if (winAmount > features.gui.betPanel.betRate * settings.CLUSTER_LEVELS.MEDIUM) {
            afterCheckDelay = 2;
            tweens.scale(feature.winAmount).start().to(1.75, (countupDuration - 0.5) / 2).to(2, 0.5, 'quinticOut').to(3.75, (countupDuration - 0.5) / 2 - 0.5).to(3.5, 0.5, 'cubic').to(5, 0.5, 'quinticOut');

            count = 100;
            tweens.position(feature.container).start();
            for (i = count; i >= 0; i--) {
                x = 5 * random.uniform(0.5, 1) * random.sign() * (i - count) / count;
                y = 5 * random.uniform(0.5, 1) * random.sign() * (i - count) / count;
                tweens.position(feature.container).to(1024 + x, 1024 + y, countupDuration / count, 'quintic');
            }

            feature.game.schedule(countupDuration, this.spawnShockwave, this);

            tweens.scale(feature.container).start().delay(countupDuration - 0.5).to(1.5, 1, 'quintic');
            tweens.pivot(feature.container).start()
                                           .delay(countupDuration + 0.25 - 0.5)
                                           .to(feature.winAmountContainer.position.x, feature.winAmountContainer.position.y, 1, 'quintic')
                                           .by(0.0001, 0.0001, 0, null, 'loop')
                                           .to([feature.winAmountContainer.position.x - 10, feature.winAmountContainer.position.x + 10], [feature.winAmountContainer.position.y - 10, feature.winAmountContainer.position.y + 10], [0.75, 1.5], 'sine')
                                           .repeat(Infinity, 'loop');
        } else if (winAmount > features.gui.betPanel.betRate * settings.CLUSTER_LEVELS.LOW) {
            feature.game.schedule(countupDuration, this.spawnShockwave, this);
            tweens.scale(feature.winAmount).start().to(1.75, (countupDuration - 0.5) / 2).to(2, 0.5, 'quinticOut').to(2.75, (countupDuration - 0.5) / 2).to(3, 0.5, 'quinticOut');
        } else {
            tweens.scale(feature.winAmount).start().to(1.75, (countupDuration - 0.5) / 2).to(2, 0.5, 'quinticOut').to(2.75, (countupDuration - 0.5) / 2).to(3, 0.5, 'quinticOut');
        }

        feature.game.schedule(0, this.countupFlare, this);
        feature.game.schedule(countupDuration / 2 - 0.5, this.countupFlare, this);
        feature.game.schedule(countupDuration - 1, this.countupFlare, this);

        feature.game.schedule(countupDuration + afterCheckDelay, this.afterCheck, this);
        feature.audio.ambient.fade(0.25, -1, 0.5, countupDuration);
    }

    countupFlare(feature) {
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.texture = PIXI.Texture.fromFrame('main/other/flare.jpg');
        particle.layer = 'guiParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        translatePosition(feature.winAmountContainer, particle.parent, particle.position);

        tweens.scale(particle).start(0).to(0.5, 1, 'cubic').to(0, 0.5, 'cubic');

        tweens.alpha(feature.sky.flare).start().to(1, 0.125).to(0, 1);

        particle.life = tweens.scale(particle).duration;
    }

    flyWinAmount(feature, index, clusterIndex, minSymbol) {
        var symbol = feature.symbols[index];
        var frame = feature.effects.frames[index];

        tweens.create(frame, 'particleAlpha').start()
                                             .delay(0.5)
                                             .to(0, 0.5);

        tweens.alpha(frame.overlay).start()
                                   .delay(0.5)
                                   .to(1, 0.5);

        if (symbol === minSymbol)
            return;

        tempPoint.set(0, 0);
        translatePosition(minSymbol, symbol, tempPoint);

        tweens.position(symbol.winAmount).start(0, 0).to(tempPoint.x, tempPoint.y, 1, 'quinticIn');
        tweens.scale(symbol.winAmount).start().to(1.2, 0.5, 'sineIn').to(1, 0.5, 'sineIn');
        tweens.alpha(symbol.winAmount).start().delay(0.5).to(0, 0.5, 'cubicIn');

        feature.game.schedule(1, this.addCredits, this, symbol.winAmount.amount, minSymbol);
    }

    spawnShockwave(feature) {
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.life = SHOCKWAVE_TEXTURES.length / 30;

        particle.textures = SHOCKWAVE_TEXTURES;
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.tint = 0xc87b2d;
        particle.scale.set(2, 2);

        translatePosition(feature.winAmountContainer, particle.parent, particle.position);

        particle.textureTimeline.reset(0).to(SHOCKWAVE_TEXTURES.length - 1, particle.life);
    }

    afterCheck(feature) {
        tweens.scale(feature.container).start().to(1, 1, 'cubic');
        tweens.position(feature.container).start().to(1024, 1024, 1, 'cubic');
        tweens.pivot(feature.container).start().to(1024, 1024, 1, 'cubic');

        tweens.position(feature.winAmountContainer).start().by(100, -80, 2, 'cubicIn');

        feature.winAmountShaderFix.visible = true;
        feature.winAmountContainer.filters = FILTER_ARRAY;

        tweens.scaleXY(FILTER_ARRAY[0]).start(0, 0).to(200, 200, 2, 'cubic');
        tweens.position(FILTER_ARRAY[0].maskSprite).start(0, 0).to(200, 200, 2, 'cubic');

        tweens.create(FILTER_ARRAY[0].uniforms.alpha, 'value').start(1).to(0, 2, 'cubic');

        features.gui.credits.add(feature.winAmount.amount);

        features.gui.overlay.interactive = false;

        feature.game.schedule(1, this.resetSymbols, this);
        feature.game.schedule(2, this.turnOffShader, this);
    }

    addCredits(feature) {
        var scale = feature.winAmountContainer.scale.x;
        tweens.scale(feature.winAmountContainer).start(scale * 1.1).to(1, 1, 'cubicOut');
    }

    turnOffShader(feature) {
        feature.winAmountShaderFix.visible = false;
        feature.winAmountContainer.filters = null;
        feature.winAmountContainer.visible = false;
    }

    resetSymbols(feature) {
        var i, j, node, reel, symbol, cluster;

        for (j = 0; j < nodeStructure.wins.length; j++) {
            cluster = nodeStructure.wins[j];

            for (i = 0; i < cluster.length; i++) {
                node = cluster[i];
                reel = feature.reels[node.index];
                symbol = feature.symbols[node.index];
                symbol.scale.set(1);
                reel.setType('empty');
                symbol.reset();
            }
        }

        this.next();
    }


    addSidebarBrick(feature, index) {
        if (index === 0)
            feature.audioGroup.effect('main/instant_win/orbs/up.m4a').delay(0.15 / feature.game.clock.speed).rate(feature.game.clock.speed).play();

        if (feature.sidebar.level < settings.SIDEBAR_BRICKS_COUNT) {
            tweens.scale(feature.prizeOrb).start().to(Math.pow(1.02, feature.sidebar.level) / 2, 0.125, 'cubicOut').to(0.5, 2, 'cubic');
            feature.sidebar.add(false);
        }

        if (feature.sidebar.level === settings.SIDEBAR_BRICKS_COUNT && feature.prizeOrb.state === settings.ORB_STATES.IDLE)
            this.activateOrb();
    }

    activateOrb(feature) {
        feature.prizeOrb.state = settings.ORB_STATES.ACTIVATED;

        for (var i = 0; i < feature.sidebar.left.length; i++) {
            tweens.alpha(feature.sidebar.left[i]).start(0).to(1, 0.125).delay(0.25).to(0, 0.125).delay(0.25).repeat();
            tweens.alpha(feature.sidebar.right[i]).start(0).to(1, 0.125).delay(0.25).to(0, 0.125).delay(0.25).repeat();
        }
    }

    startTheOrb(feature) {
        var preLightningClip = feature.sidebar.preLightningClip;

        preLightningClip.visible = true;
        preLightningClip.play(0);

        feature.game.schedule(1, this.shootLightning);
        feature.game.schedule(1.1, this.animateOrb);
    }

    shootLightning(feature) {
        var clip = feature.sidebar.lightningClip;

        clip.visible = true;
        clip.play(0);

        feature.audioGroup.effect('main/instant_win/orbs/bar.m4a').rate(feature.game.clock.speed).play();
    }

    animateOrb(feature) {
        var orb = feature.prizeOrb;

        for (var i = 0; i < orb.rings.length; i++) {
            orb.rings[i].visible = true;
            orb.rings[i].spriteRotationSpeed = random.uniform(0.5, 1);
            orb.rings[i].scale.set(1, 0.25);
        }

        orb.flareBeamSpawner.enable();
        orb.dustSpawner.enable();
        orb.flameSpawner.disable();
        orb.alpha = 1;
        orb.circle.scale.set(1);
        tweens.scale(orb).start().to(1, 0.25, 'cubicOut');

        orb.outerRingSpawner.enable();
        for (i = 0; i < orb.rings.length; i++)
            tweens.create(orb.rings[i], 'spriteRotationSpeed').start().to(100, 2);

        feature.game.particleContainer.emitter.spawnInstantly(1, this.orbExplosion);
        feature.game.particleContainer.emitter.spawnInstantly(1, this.orbExplosion2);

        feature.states.change(this.nextStates.SpinTopOrb);
    }

    orbExplosion(feature, particle) {
        particle.texture = PIXI.Texture.fromFrame('main/particles/flares/4.png');
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.layer = 'mainParticles';

        translatePosition(feature.prizeOrb, particle.parent, particle.position);

        var scale = 0.5;
        particle.life = 0.5;
        particle.scaleTimeline.reset(1.5 * scale).addFrame(3 * scale, 0.5, 'cubicOut');
        particle.alphaTimeline.reset(1).addFrame(0, 0.5);
    }

    orbExplosion2(feature, particle) {
        particle.texture = PIXI.Texture.fromFrame('main/particles/flares/1.png');
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.layer = 'mainParticles';

        translatePosition(feature.prizeOrb, particle.parent, particle.position);

        var scale = 0.5;
        particle.life = 0.5;
        particle.scaleTimeline.reset(1.5 * scale).addFrame(3 * scale, 0.5, 'cubicOut');
        particle.alphaTimeline.reset(1).addFrame(0, 0.5);
        particle.rotation = random.uniform(0, Math.PI * 2);
    }

    next(feature) {
        if (feature.prizeOrb.state === settings.ORB_STATES.ACTIVATED) {
            feature.sidebar.set(0);

            for (var i = 0; i < feature.sidebar.left.length; i++) {
                tweens.alpha(feature.sidebar.left[i]).unrepeat();
                tweens.alpha(feature.sidebar.right[i]).unrepeat();
            }

            var delay = 0.0625 / 4;
            for (i = 0; i < feature.sidebar.left.length; i++)
                feature.game.schedule(i * delay, feature.sidebar.add, feature.sidebar);

            feature.audioGroup.effect('main/instant_win/orbs/start.m4a').rate(feature.game.clock.speed).play();

            feature.game.schedule(i * delay, this.startTheOrb);
        } else
            feature.states.change(this.nextStates.Respin);
    }


    undimSymbols(feature) {
        for (let i = 0; i < feature.symbols.length; i++) {
            feature.symbols[i].undim();
        }
    }

    exit(feature) {
        this.undimSymbols();

        feature.effects.visible = false;
        feature.audio.ambient.fadeOut(0.5, 1);

        var count = feature.multiplierLights.level;
        for (var i = 0; i < count; i++)
            feature.multiplierLights.subtract();
    }
}


module.exports = CollectWinAmounts;
