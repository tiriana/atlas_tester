'use strict';


const { PIXI, translatePosition, tweens, State, random, sprite, features } = require('@omnigame/core');
const nodeStructure = require('../node_structure');

const SOUNDS = {
    '2': [
        'main/instant_win/multiplier/x2_1.m4a',
        'main/instant_win/multiplier/x2_2.m4a'
    ],
    '3': [
        'main/instant_win/multiplier/x3_1.m4a',
        'main/instant_win/multiplier/x3_2.m4a'
    ],
    '5': [
        'main/instant_win/multiplier/x5_1.m4a',
        'main/instant_win/multiplier/x5_2.m4a'
    ],
    '7': [
        'main/instant_win/multiplier/x7_1.m4a',
        'main/instant_win/multiplier/x7_2.m4a'
    ],
    '9': ['main/instant_win/multiplier/x9.m4a']
};

class MultiplyWinAmounts extends State {
    create() {
        this.nextStates = {};
        this.nextStates.CollectWinAmounts = require('./collect_win_amounts');

        // Used for checking if a symbol was already passed by a trail
        this.trailFlags = [];

        for (var i = 0; i < 20; i++)
            this.trailFlags[i] = false;
    }

    enter(feature) {
        this.orb = null;

        this.spinResults = this.messages.getSpinResults.send(feature.game);

        // merged cluster will be used for multiplying every cluster win amount
        this.mergedCluster = nodeStructure.mergeClusters(nodeStructure.wins);

        this.multiplySymbolCounter = this.mergedCluster.length;

        tweens.scale(feature.container).start().to(1.3, 1, 'quintic');
        tweens.position(feature.container).start().delay(0.25).to(1024, 1024, 1, 'quintic');

        feature.topMultiplier.value = 1;
        feature.topMultiplier.number.alpha = 0;
        feature.topMultiplier.number.scale.set(0);

        tweens.rotation(feature.topMultiplier.number).start(-2 * Math.PI / 180).to(2 * Math.PI / 180, 0.0625, 'cubic').to(-2 * Math.PI / 180, 0.0625, 'cubic').repeat();

        this.incrementMultiplier();
    }

    multiplierTrailArrived(feature, trail, index) {
        if (this.trailFlags[trail.nodeIndexes[index]])
            return;

        this.trailFlags[trail.nodeIndexes[index]] = true;

        this.multiplySymbol(trail.nodeIndexes[index]);

        if (index === trail.points.length - 1) {
            tweens.create(trail, 'speed').start().to(0, 1);
            tweens.create(trail, 'particleAlpha').start().to(0, 0.5);
            tweens.create(trail, 'particleScale').start().to(1, 0.25);

            trail.signals.arrived.disconnect(this.multiplierTrailArrived, this);
        }
    }

    incrementMultiplier(feature) {
        feature.audio.ambient.fadeOut(0.25, 0, 0.5);

        tweens.alpha(features.gui.container).start().to(0, 0.125);

        var value = feature.topMultiplier.value;
        var index = settings.TOP_MULTIPLIER_VALUES.indexOf(this.spinResults.multiplier);
        var currentIndex = settings.TOP_MULTIPLIER_VALUES.indexOf(value);
        var nextValue = settings.TOP_MULTIPLIER_VALUES[currentIndex + 1];

        feature.audioGroup.effect(SOUNDS[nextValue][0]).rate(feature.game.clock.speed).play();

        feature.game.schedule(0.25, feature.topMultiplier.add, feature.topMultiplier);
        feature.game.schedule(0.25, this.multiplierExplosion, this);

        tweens.alpha(feature.topMultiplier.number).start().to(1, 0.125);
        tweens.scale(feature.topMultiplier.number).start().to(Math.pow(1.2, value), 0.5, 'cubic');
        tweens.scale(feature.container).start().to(1.3 * Math.pow(1.1, value), 1.5, 'cubic');
        tweens.position(feature.container).start().by(0, 20, 0.5, 'cubic');

        if (value < settings.TOP_MULTIPLIER_VALUES[index - 1]) {
            feature.game.schedule(1.5, this.fadeToBlack, this);
        } else {
            const buildUpDelay = 2 / feature.game.clock.speed;
            const buildUpLength = 3.922;
            const explosionTime = buildUpLength + buildUpDelay;

            feature.audioGroup.effect('main/instant_win/multiplier/build_up.m4a').delay(buildUpDelay).rate(feature.game.clock.speed).play();
            feature.game.schedule(explosionTime, this.landMultiplier, this);
            const { pivot } = feature.container;
            tweens.pivot(feature.container).start().delay(buildUpDelay).to([pivot.x - 10, pivot.x + 10], [pivot.y - 10, pivot.y + 10], 0.1, null, 'loop').repeat((explosionTime - 2.4) / 0.1, 'loop');

            feature.game.particleContainer.emitter.spawnInstantly(1, this.onQuickFlickering, this);
        }
    }

    fadeToBlack(feature) {
        var value = feature.topMultiplier.value;

        feature.audioGroup.effect(SOUNDS[value][1]).rate(feature.game.clock.speed).play();

        feature.game.particleContainer.emitter.spawnInstantly(1, this.onBlackOverlay, this);

        feature.game.schedule(1.5, this.incrementMultiplier, this);
    }

    multiplierExplosion(feature) {
        feature.topMultiplier.playShockwave();
        feature.particleContainer.emitter.spawnInstantly(1, this.onMultiplierExplosion, this);
    }

    onMultiplierExplosion(feature, particle) {
        particle.texture = 'gui/particles/flares/4.png';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.layer = 'mainParticlesAdd';

        translatePosition(feature.topMultiplier.number, particle.parent, particle.position);

        particle.alphaTimeline.reset(1).to(0, particle.life);
        particle.scaleTimeline.reset(1).to(3, particle.life, 'cubicOut');
    }

    landMultiplier(feature) {
        tweens.scale(feature.container).start().to(1, 2, 'quinticOut');
        tweens.position(feature.container).start().to(1024, 1024, 2, 'quinticOut');

        this.shakeScreenStrong();
        tweens.pivot(feature.container).to(1024, 1024, 2, 'quinticOut');

        tweens.scale(feature.topMultiplier.number).start().to(1, 2, 'quinticOut');

        this.multiplySymbols();

        tweens.alpha(features.gui.container).start().to(1, 1.0);
    }

    shakeScreenStrong(feature) {
        tweens.pivot(feature.container).start();
        const count = 50;
        for (let i = count; i >= 0; i--) {
            const x = (5 * random.uniform(0.5, 1) * random.sign() * i) / count;
            const y = (3 * random.uniform(0.5, 1) * random.sign() * i) / count;
            tweens.pivot(feature.container).to(1024 + x, 1024 + y, 1.5 / count, 'quintic');
        }
    }

    multiplySymbols(feature) {
        feature.audioGroup.effect('main/instant_win/multiplier/drop.m4a').rate(feature.game.clock.speed).play();

        tweens.rotation(feature.topMultiplier.number).start(0);
        this.multiplierExplosion();

        tweens.alpha(feature.topMultiplier.number).start().to(0, 0.125);

        var trail = nodeStructure.decompressTrailPath(this.spinResults.multiplierTrails[nodeStructure.clusterToCode(this.mergedCluster)]);
        var trails = nodeStructure.separateTrails(trail);

        var i, j, symbol;

        for (i = 0; i < 20; i++)
            this.trailFlags[i] = false;

        for (i = 0; i < trails.length; i++) {
            var t = feature.effects.trails[i];
            t.points.length = 0;

            for (j = 0; j < trails[i].length; j++) {
                symbol = feature.symbols[trails[i][j]] || feature.topMultiplier;
                t.points.push({ 'x': symbol.position.x - 694 + random.uniform(-20, 20), 'y': symbol.position.y - 940 + random.uniform(-20, 20) });
            }

            t.nodeIndexes = trails[i];
            t.setType('teal');
            t.particleAlpha = 0.125;
            t.speed = 500;
            tweens.create(t, 'particleScale').start(0).to(6, 0.25);

            t.signals.arrived.connect(this.multiplierTrailArrived, this);
            t.start();
        }
    }

    multiplySymbol(feature, index) {
        var symbol = feature.symbols[index];

        symbol.winAmount.changeValue(feature.topMultiplier.value * symbol.winAmount.amount, false, 1, false);

        this.multiplySymbolCounter--;

        if (this.multiplySymbolCounter === 0)
            this.next();
    }

    onQuickFlickering(feature, particle) {
        const flickeringDelay = 1.0;
        const buildUpDelay = 2 / feature.game.clock.speed;
        const buildUpLength = 3.922;
        const flickeringLength = 2.75;
        const explosionTime = buildUpLength + buildUpDelay;

        const blink = 0.055;
        const reps = (flickeringLength - flickeringDelay) / blink / 2 - 2;

        sprite(particle).layer('blackOverlay').scale(256).position(1024).tint(0).alpha(0);
        particle.texture = PIXI.Texture.fromFrame('gui/square.png');
        particle.life = explosionTime;
        tweens.alpha(particle).start().delay(buildUpDelay + flickeringDelay).to(1, 0, null, 'loop').delay(blink).to(0, 0).delay(blink).repeat(reps, 'loop').to(1, 0);
    }

    onBlackOverlay(feature, particle) {
        sprite(particle).layer('blackOverlay').scale(256).position(1024).tint(0).alpha(0);
        particle.texture = PIXI.Texture.fromFrame('gui/square.png');
        particle.life = 1.944;
        tweens.alpha(particle).start().delay(0.5).to(1, 0.3);
    }

    next() {
        this.machine.change(this.nextStates.CollectWinAmounts);
    }
}


module.exports = MultiplyWinAmounts;
