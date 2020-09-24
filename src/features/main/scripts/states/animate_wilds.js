'use strict';


const {PIXI, State, tweens} = require('@omnigame/core');
const nodeStructure = require('../node_structure');


function getActivationDelay(progress, wildCount) {
    switch (wildCount) {
        case 6: return 1 * progress;
        case 5: return 18 / 25 * progress;
        case 4: return 12 / 25 * progress;
        case 3: return 10 / 25 * progress;
        case 2: return 8 / 25 * progress;
        case 1: return 8 / 25 * progress;
    }
}

class AnimateWilds extends State {
    create() {
        this.nextStates = {};
        this.nextStates.ClustersShow = require('./clusters_show');
        this.nextStates.Delay = require('./delay');

        this.winIndex = -1;
    }

    enter(feature) {
        var i;

        this.explosionCounter = 0;

        feature.audioGroup.effect('main/wild/reveal.m4a').play();

        for (i = 0; i < nodeStructure.rows.length; i++)
            this.animateRow(i);
    }

    animateRow(feature, rowIndex) {
        var wildsCount = 0;
        var row = nodeStructure.rows[rowIndex];
        var x = 0;
        var y = 0;
        var k = 0;
        var firstWildIndex = Infinity;
        var lastWildIndex = -Infinity;

        for (var i = 0; i < row.length; i++)
            if (nodeStructure.wilds.includes(row[i]) && row[i].value !== 'wild') {
                firstWildIndex = Math.min(firstWildIndex, row[i].index);
                lastWildIndex = Math.max(lastWildIndex, row[i].index);
                wildsCount++;

                x += feature.symbols[row[i].index].position.x;
                y += feature.symbols[row[i].index].position.y;
            }

        if (!wildsCount)
            return;

        x /= wildsCount;
        y /= wildsCount;

        // lightning animation
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.layer = 'mainParticlesAdd';
        particle.textures = feature.frames.lightningEnd[wildsCount - 1];
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.life = particle.textures.length / 25;

        particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.life);

        particle.position.x = x;
        particle.position.y = y;

        particle.scale.x = (rowIndex % 2) ? -1 : 1;

        particle.scale.x *= 2;
        particle.scale.y *= 2;

        feature.game.schedule(getActivationDelay(1, wildsCount), this.shockwave, this, x, y, wildsCount);

        k = 0;
        var progress = 0;
        for (i = firstWildIndex; i <= lastWildIndex; i++) {
            if (rowIndex % 2) {
                progress = (wildsCount - k - 1) / (wildsCount - 1) || 0;
                feature.game.schedule(getActivationDelay(progress, wildsCount), this.explodeWild, this, i, progress);
            } else {
                progress = k / (wildsCount - 1) || 0;
                feature.game.schedule(getActivationDelay(progress, wildsCount), this.explodeWild, this, i, progress);
            }
            k++;
        }

        this.explosionCounter += wildsCount;
    }

    shockwave(feature, x, y, wildsCount) {
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.layer = 'mainParticlesAdd';
        particle.textures = feature.frames.shockwave;
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.life = particle.textures.length / 40;

        particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.life);

        particle.position.x = x;
        particle.position.y = y;

        tweens.alpha(particle).start(0.5).to(0, particle.life);

        var scale = 2 * wildsCount / 6;
        particle.scale.set(scale, scale * 0.75);
    }

    explodeWild(feature, index) {
        var node = nodeStructure.nodes[index];
        var symbol = feature.symbols[index];
        var reel = feature.reels[index];

        reel.setType(node.value);

        symbol.setType(node.value);
        symbol.setShatterType('wildGlowing');

        symbol.wildSmokeSpawner.disable();
        
        symbol.shatter.visible = true;
        symbol.shatter.scale.set(symbol.sprite.scale.x);

        symbol.shatter.scatterScale = 0.75;
        tweens.create(symbol.shatter, 'scatter').start(0).delay(0.8).to(1, 2);

        switch (symbol.type) {
            case 'purple':
            case 'white':
            case 'black':
                tweens.scale(symbol.frame).start(0.75).show().delay(0.8).to(1, 0.125, 'cubicOut');
                tweens.alpha(symbol.frame).start(0).delay(0.8).to(1, 0.125);
                tweens.scale(symbol.sprite).start(0).delay(0.8).to(1.1, 1, 'elasticOut');
                break;
            default:
                tweens.scale(symbol.sprite).start(0).delay(0.8).to(1, 1, 'elasticOut');
        }

        // flare
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.layer = 'mainParticlesAdd';
        particle.texture = 'main/particles/flares/7.png';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.position.x = symbol.x;
        particle.position.y = symbol.y;

        tweens.alpha(particle).start(0).to(1, particle.life / 2).to(0, particle.life / 2);
        tweens.scale(particle).start(0).to(1, particle.life / 2).to(0, particle.life / 2);

        this.explosionCounter--;

        if (this.explosionCounter === 0)
            feature.game.schedule(1, this.animationEnded);
    }

    animationEnded(feature) {
        feature.effects.visible = false;

        this.next();
    }

    next(feature) {
        if (nodeStructure.wins.length)
            feature.states.change(this.nextStates.ClustersShow);
        else
            feature.states.change(this.nextStates.Delay);
    }
}


module.exports = AnimateWilds;
