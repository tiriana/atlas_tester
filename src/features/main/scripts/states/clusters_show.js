'use strict';


const {PIXI, tweens, State, random, features, translatePosition} = require('@omnigame/core');
const nodeStructure = require('../node_structure');

const INDICATION_DURATION = 1;

class ClustersShow extends State {
    create() {
        this.nextStates = {};
        this.nextStates.CollectWinAmounts = require('./collect_win_amounts');
        this.nextStates.MultiplyWinAmounts = require('./multiply_win_amounts');

        // Used for checking if a symbol was already passed by a trail
        this.trailFlags = [];

        for (var i = 0; i < 20; i++)
            this.trailFlags[i] = false;
    }

    enter(feature) {
        this.orb = null;

        this.clusterIndex = -1;
        this.explodeSymbolCounter = 0;

        this.reachedMultiplier = nodeStructure.isAnyClusterTouchingMultiplier(nodeStructure.wins);

        this.spinResults = this.messages.getSpinResults.send(feature.game);

        feature.effects.visible = true;

        feature.audio.ambient.fadeOut(0.5, 0.5);

        this.showClusters();

        this.dimNonWiningSymbols();

        if (nodeStructure.isAnyClusterTouchingMultiplier(nodeStructure.wins))
            this.activateTopMultiplier();
    }

    activateTopMultiplier(feature) {
        feature.audioGroup.effect('main/instant_win/multiplier/trigger_6_row.m4a').play();
        feature.topMultiplier.playShockwave();
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.texture = 'gui/particles/flares/4.png';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.layer = 'mainParticlesAdd';

        translatePosition(feature.topMultiplier.number, particle.parent, particle.position);

        particle.alphaTimeline.reset(1).to(0, particle.life);
        particle.scaleTimeline.reset(1).to(3, particle.life, 'cubicOut');
    }

    dimNonWiningSymbols(feature) {
        const nonWins = nodeStructure.getNonWins(nodeStructure.nodes, nodeStructure.wins);

        for (let i = 0; i < nonWins.length; i++) {
            feature.symbols[nonWins[i].index].dim();
        }
    }

    showClusters(feature) {
        this.clusterIndex++;

        if (this.clusterIndex < nodeStructure.wins.length)
            feature.game.schedule(this.clusterIndex === 0 ? 0 : 2, this.showCluster, this, nodeStructure.wins[this.clusterIndex]);
        else if (this.reachedMultiplier)
            feature.game.schedule(2, this.multiplyWinAmounts);
        else
            feature.game.schedule(0, this.collectWinAmounts);
    }

    trailArrived(feature, trail, index) {
        if (this.trailFlags[trail.nodeIndexes[index]])
            return;

        this.trailFlags[trail.nodeIndexes[index]] = true;

        this.highlightSymbol(trail.nodeIndexes[index]);

        if (index === trail.points.length - 1) {
            tweens.create(trail, 'speed').start().to(0, 1);
            tweens.create(trail, 'particleAlpha').start().to(0, 0.5);
            tweens.create(trail, 'particleScale').start().to(1, 0.25);

            trail.signals.arrived.disconnect(this.trailArrived, this);
        }
    }

    showCluster(feature, cluster) {
        var i, j, symbol;

        var trail = nodeStructure.decompressTrailPath(this.spinResults.clusterTrails[nodeStructure.clusterToCode(cluster)]);
        var trails = nodeStructure.separateTrails(trail);

        for (i = 0; i < 20; i++)
            this.trailFlags[i] = false;

        this.explodeSymbolCounter = cluster.length;

        for (i = 0; i < trails.length; i++) {
            var t = feature.effects.trails[i];
            t.points.length = 0;

            for (j = 0; j < trails[i].length; j++) {
                symbol = feature.symbols[trails[i][j]];
                t.points.push({'x': symbol.position.x - 694 + random.uniform(-20, 20), 'y': symbol.position.y - 940 + random.uniform(-20, 20)});
            }

            t.nodeIndexes = trails[i];
            t.setType(cluster[0].value);
            t.particleAlpha = 0.125;
            t.speed = 700;
            tweens.create(t, 'particleScale').start(0).to(6, 0.25);

            t.signals.arrived.connect(this.trailArrived, this);

            t.start();
        }

        this.highlightSymbol(trails[0][0], true);

        var winAmount = nodeStructure.getWinAmountForCluster(cluster);

        if (winAmount > settings.CLUSTER_LEVELS.MEDIUM)
            feature.audioGroup.effect('instantWinHigh').rate(feature.game.clock.speed).play();
        else if (winAmount > settings.CLUSTER_LEVELS.LOW)
            feature.audioGroup.effect('instantWinMedium').rate(feature.game.clock.speed).play();
        else
            feature.audioGroup.effect('instantWinLow').rate(feature.game.clock.speed).play();
    }

    highlightSymbol(feature, index, first = false) {
        var node = nodeStructure.nodes[index];
        var symbol = feature.symbols[index];
        var frame = feature.effects.frames[index];

        frame.randomize();
        frame.setType(node.value);

        tweens.scale(symbol.sprite).start().delay(random.uniform(0, 0.25)).to(1.2, INDICATION_DURATION, 'cubic');
        tweens.alpha(symbol.frame).start().to(0, 1).hide();

        symbol.background.visible = true;
        tweens.alpha(symbol.background).start(0).to(0.5, 1);
        symbol.background.tint = settings.SYMBOL_DEFINITIONS[node.value].backgroundTint;

        frame.overlay.alpha = 0.01;
        frame.particleAlpha = 0.5;
        frame.speed = 1;

        if (node.row >= feature.multiplierLights.level + 1)
            feature.multiplierLights.add();

        feature.game.schedule(INDICATION_DURATION, this.explodeSymbol, this, index);

        if (first)
            this.crashZoom();
    }

    crashZoom(feature) {
        tweens.scale(feature.container).start().to(1.2, 1, 'quintic');
        tweens.pivot(feature.container).start()
            .delay(0.25)
            .to(1024, 1074, 1, 'quintic')
            .by(0.0001, 0.0001, 0, null, 'loop')
            .to([1014, 1034], [1069, 1079], [0.75, 1.5], 'sine')
            .repeat(Infinity, 'loop');
    }

    explodeSymbol(feature, index) {
        var node = nodeStructure.nodes[index];
        var symbol = feature.symbols[index];
        var frame = feature.effects.frames[index];
        var clusterLength = nodeStructure.wins[this.clusterIndex].length;

        symbol.shatter.visible = true;
        symbol.setShatterType(symbol.type);
        symbol.shatter.scale.set(symbol.sprite.scale.x);

        symbol.sprite.alpha = 0;

        symbol.shatter.scatterScale = 0.5;
        tweens.create(symbol.shatter, 'scatter').start(0).to(1, 2);

        tweens.create(frame, 'speed').start().to(0.125, 2);

        tweens.alpha(symbol.background).start().to(0.8, 0.25).to(0, 1);
        tweens.tint(symbol.background).start().to(0xffffff, 0.25);

        symbol.winAmount.visible = true;
        symbol.winAmount.changeValue(settings.SYMBOL_DEFINITIONS[node.value].multipliers[clusterLength - this.explodeSymbolCounter] * features.gui.betPanel.betRate / 100, false, 0.01, false);

        symbol.winAmount.useBigTextures = false;
        symbol.winAmount.position.set(0, 0);
        tweens.alpha(symbol.winAmount).start(0).to(1, 0.125);
        tweens.scale(symbol.winAmount).start(0.75).to(1, 1, 'elasticOut');

        this.explodeSymbolCounter--;

        if (this.explodeSymbolCounter === 0)
            this.showClusters();
    }

    multiplyWinAmounts() {
        this.machine.change(this.nextStates.MultiplyWinAmounts);
    }

    collectWinAmounts() {
        this.machine.change(this.nextStates.CollectWinAmounts);
    }

}


module.exports = ClustersShow;
