'use strict';


const { PIXI, State, tweens, random, translatePosition, features } = require('@omnigame/core');
const nodeStructure = require('../node_structure');

const WILD_HIGHLIGHTS = [
    'main/wild/highlight/1.m4a',
    'main/wild/highlight/2.m4a',
    'main/wild/highlight/3.m4a',
    'main/wild/highlight/4.m4a',
    'main/wild/highlight/5.m4a',
    'main/wild/highlight/6.m4a',
];

const SCATTERED_SOUNDS = [
    [
        'main/scattered/cat/1.m4a',
        'main/scattered/cat/2.m4a',
        'main/scattered/cat/3.m4a'
    ],
    [
        'main/scattered/cat/1.m4a',
        'main/scattered/cat/2.m4a',
        'main/scattered/cat/3.m4a'
    ],
    [
        'main/scattered/nefertiti/1.m4a',
        'main/scattered/nefertiti/2.m4a',
        'main/scattered/nefertiti/3.m4a'
    ]
];

const FLAME_FRAMES = [];
for (let i = 0; i < 19; i++) {
    FLAME_FRAMES.push(`main/other/blue_flame/${i}.png`);
}

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


class StopReels extends State {
    create() {
        this.nextStates = {};
        this.nextStates.AnimateScattered = require('./animate_scattered');
        this.nextStates.AnimateWilds = require('./animate_wilds');
        this.nextStates.ClustersShow = require('./clusters_show');
        this.nextStates.Delay = require('./delay');
    }

    enter(feature, respin = false) {
        var i, j;

        this.main = feature.game.stage.main;
        this.spinResults = this.messages.getSpinResults.send(feature.game);

        this.multiplierActivated = false;
        this.wildsAnimated = 0;

        this.scattered = 0;

        for (i = 0; i < feature.reels.length; i++) {
            if (feature.reels[i].tween.ended && feature.reels[i].type === 'scattered')
                this.scattered++;
            feature.reels[i].onLastLoop.connect(this.timelineLastLooped);
            feature.reels[i].onLand.connect(this.reelLanded);
        }

        if (respin) {
            return;
        }

        var order = settings.STOP_ORDER;
        var lastWildRow = -1;
        var row = -1;
        for (i = 0; i < order.length; i++) {
            var index = order[i];
            row = settings.INDEX_TO_ROW[index];

            if (this.spinResults.symbols[index] === 'wild') {
                if (row === lastWildRow) {
                    for (j = i; j < order.length; j++)
                        this.addToRepeatCount(feature.reels[order[j]].tween, 1);
                }

                // add rotations to reels after last wild in a row
                if (settings.INDEX_TO_ROW[order[i + 1]] !== row)
                    for (j = i + 1; j < order.length; j++)
                        this.addToRepeatCount(feature.reels[order[j]].tween, 21);

                lastWildRow = row;
            } else if (this.spinResults.symbols[index] === 'scattered') {
                for (j = i + 1; j < order.length; j++)
                    this.addToRepeatCount(feature.reels[order[j]].tween, 10);
            }
        }
    }

    addToRepeatCount(feature, tween, amount) {
        var frame = tween.get('loopEnd');

        if (frame)
            frame.repeatCount += amount;
    }

    reelLanded(feature, reel) {
        var index = reel.index;
        var i, j;
        var particle;

        var previousReel = feature.reels[settings.STOP_ORDER[settings.STOP_ORDER.indexOf(reel.index) - 1]];
        var nextReel = feature.reels[settings.STOP_ORDER[settings.STOP_ORDER.indexOf(reel.index) + 1]];
        var symbol = feature.symbols[index];

        var alreadyVisible = symbol.visible;

        reel.visible = false;
        symbol.setType(this.spinResults.symbols[index]);
        symbol.visible = true;

        switch (symbol.type) {
            case 'purple':
            case 'white':
            case 'black':
                feature.audioGroup.effect('wheelFrame').play();
                break;
            default:
                feature.audioGroup.effect('wheelStop').play();
        }

        tweens.position(symbol).start().by(0, 2, 0.1, 'cubicOut').by(0, -2, 0.1, 'cubicOut');

        switch (this.spinResults.symbols[index]) {
            case 'scattered':
                symbol.highlight.loop = false;
                symbol.highlight.scale.set(1);
                symbol.highlight.visible = true;
                symbol.highlight.play(0);
                symbol.updateTransform();
                tweens.scale(symbol).start(0.82).delay(0.25).to(1.1, 0.5, 'cubic');

                if (feature.scatteredCollected[features.gui.betPanel.rawBetRate] < 2)
                    tweens.y(symbol.pivot).start(-5).to(0, 0.25, 'cubic').to(3, 0.5, 'cubic');
                else
                    tweens.y(symbol.pivot).start(-5).to(0, 0.25, 'cubic').to(6, 0.5, 'cubic');

                particle = feature.particleContainer.emitter.spawn(0, 0, 0);

                particle.textures = FLAME_FRAMES;

                particle.layer = 'mainParticlesAdd';
                particle.blendMode = PIXI.BLEND_MODES.ADD;
                translatePosition(symbol, particle.parent, particle.position);
                particle.position.y -= 35;
                particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.life);
                tweens.alpha(particle).start(1).delay(0.5).to(0, 0.5, 'cubic');

                particle = feature.particleContainer.emitter.spawn(0, 0, 0);

                particle.texture = PIXI.Texture.fromFrame('main/other/flare.jpg');
                particle.layer = 'mainParticlesAdd';
                particle.blendMode = PIXI.BLEND_MODES.ADD;

                translatePosition(symbol, particle.parent, particle.position);

                particle.tint = 0xccddcc;

                particle.life = tweens.alpha(particle).start(0).to(0.5, 0.5, 'cubic').delay(0.25).to(0, 0.5, 'cubicOut').duration;
                tweens.y(particle).start(particle.position.y).delay(0.25).by(-20, 0.5, 'cubic');

                this.scattered++;

                feature.audioGroup.effect(SCATTERED_SOUNDS[feature.scatteredCollected[features.gui.betPanel.rawBetRate]][this.scattered - 1]).play();

                for (i = 0; i < 100; i++)
                    this.scatteredExplosion(feature.particleContainer.emitter.spawn(0, 0, 0), symbol);
                break;
            case 'wild':
                // the wild symbol may have come from the top orb which means it's already visible so no sound should be played
                if (!alreadyVisible) {
                    if (!previousReel || previousReel.row !== reel.row || this.spinResults.symbols[previousReel.index] !== 'wild') {
                        // this is the first wild symbol in a row
                        feature.audioGroup.effect('main/wild/land/1.m4a').play();

                        tweens.pivot(feature.container).start().to(1024 + random.uniform(-5, 5), 1024 - random.uniform(10, 20), 0.125, 'cubicOut').to(1024, 1024, 2, 'elasticOut');
                    } else {
                        feature.audioGroup.effect('wildLand').play();

                        tweens.pivot(feature.container).start().by(random.uniform(-5, 5), -random.uniform(5, 10), 0.125, 'cubicOut').to(1024, 1024, 1, 'elasticOut');
                    }
                }

                // add some brick particles
                for (i = 0; i < 10; i++) {
                    particle = feature.particleContainer.emitter.spawn(0, 0, 0);

                    particle.layer = 'mainParticles';

                    particle.textures = feature.frames.brick;

                    particle.life = 1;

                    particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.textures.length / 25).repeat();

                    particle.position.x = symbol.position.x;
                    particle.position.y = symbol.position.y;

                    particle.rotation = random.uniform(0, 2) * Math.PI;

                    tweens.alpha(particle).start(1).delay(particle.life * 0.5).to(0, particle.life * 0.5);
                    tweens.scale(particle).start(0.5).to(3, particle.life);

                    var angle = random.uniform(0, 2) * Math.PI;

                    var sin = Math.sin(angle);
                    var cos = Math.cos(angle);

                    particle.usePhysics = true;

                    var speed = random.uniform(300, 600);

                    particle.velocity.x = cos * speed;
                    particle.velocity.y = sin * speed;

                    particle.friction = 100;

                    particle.gravity.y = 1000;
                }

                // dust when brick lands
                particle = feature.particleContainer.emitter.spawn(0, 0, 0);

                particle.layer = 'mainParticlesAdd';
                particle.textures = feature.frames.brickLandingDust;
                particle.blendMode = PIXI.BLEND_MODES.ADD;

                particle.life = particle.textures.length / 25;

                particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.life);

                particle.position.x = symbol.position.x;
                particle.position.y = symbol.position.y - 30;

                particle.scale.x *= 2;
                particle.scale.y *= 2;

                if (!nextReel || nextReel.row !== reel.row)
                    this.activateWildsRow(reel.row);
                break;
            case 'purple':
            case 'black':
            case 'white':
                tweens.scale(symbol.frame).start(0.75).show().to(1, 0.125, 'cubicOut');
                tweens.alpha(symbol.frame).start(0).to(1, 0.125);
                tweens.scale(symbol.sprite).start(1).to(1.1, 0.5, 'cubic');
            default:
                tweens.pivot(feature.container).start().to(1024 + random.uniform(-2, 2), 1024 + random.uniform(-2, 2), 0.125, 'cubicOut').to(1024, 1024, 1, 'elasticOut');
                for (i = 0; i < 5; i++) {
                    var r = random.sign();

                    particle = feature.particleContainer.emitter.spawn(0, 0, 0);
                    particle.life = random.uniform(0.5, 1.5);
                    particle.texture = 'main/particles/flares/5.png';
                    particle.layer = 'mainParticlesAdd';
                    particle.blendMode = PIXI.BLEND_MODES.ADD;

                    particle.position.x = r * random.uniform(10, 30);
                    particle.position.y = 35;

                    translatePosition(symbol, particle.parent, particle.position);

                    particle.scale.set(random.uniform(0.25, 1));

                    angle = (r * random.uniform(0.25, 0.75) - 0.5) * Math.PI;

                    particle.alphaTimeline.reset(1).to(0, particle.life);

                    particle.directionTimeline.reset(angle);
                    particle.speedTimeline.reset(random.uniform(200, 500)).to(10, particle.life, 'cubicOut');
                    tweens.scale(particle).start(2).to(0.25, particle.life, 'cubicOut');

                    for (j = 1; j <= 2; j++)
                        particle.directionTimeline.to(-r * random.uniform(100, 200) * Math.PI / 180, particle.life / 2, 'sine', true, true);

                    tweens.tint(particle).start(0xffffff).to(settings.SYMBOL_DEFINITIONS[symbol.type].backgroundTint, particle.life / 2, 'cubicOut');
                }
                
                break;
        }
    }

    activateWildsRow(feature, rowIndex) {
        var wildsCount = 0;
        var row = nodeStructure.rows[rowIndex];
        var x = 0;
        var y = 0;
        var k = 0;
        var firstWildIndex = Infinity;
        var lastWildIndex = -Infinity;

        for (var i = 0; i < row.length; i++)
            if (this.spinResults.symbols[row[i].index] === 'wild') {
                firstWildIndex = Math.min(firstWildIndex, row[i].index);
                lastWildIndex = Math.max(lastWildIndex, row[i].index);
                wildsCount++;

                this.wildsAnimated++;
            }

        feature.audioGroup.effect(WILD_HIGHLIGHTS[wildsCount - 1]).play();

        // lightning animation
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.layer = 'mainParticlesAdd';
        particle.textures = feature.frames.lightning[wildsCount - 1];
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.life = particle.textures.length / 25;

        particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.life);

        particle.position.x = (feature.symbols[firstWildIndex].position.x + feature.symbols[lastWildIndex].position.x) * .5;
        particle.position.y = feature.symbols[firstWildIndex].position.y - 20;

        particle.scale.x = (rowIndex % 2) ? -1 : 1;

        particle.scale.x *= 2;
        particle.scale.y *= 2;


        // lightning afterburn
        particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.layer = 'mainParticlesAdd';
        particle.textures = feature.frames.lightningAfterburn;
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.life = particle.textures.length / 25;

        particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.life);

        particle.scale.x = (rowIndex % 2) ? -1 : 1;

        particle.scale.x *= 2;
        particle.scale.y *= 2;

        if (rowIndex % 2) {
            particle.x = feature.symbols[firstWildIndex].position.x - 10;
            particle.y = feature.symbols[firstWildIndex].position.y - 10;
        } else {
            particle.x = feature.symbols[lastWildIndex].position.x + 10;
            particle.y = feature.symbols[lastWildIndex].position.y - 10;
        }

        k = 0;
        var progress = 0;
        for (i = firstWildIndex; i <= lastWildIndex; i++) {
            if (rowIndex % 2) {
                progress = (wildsCount - k - 1) / (wildsCount - 1) || (wildsCount === 1 ? 1 : 0);
                feature.game.schedule(0.8 + getActivationDelay(progress, wildsCount), this.activateWild, this, i, progress);
            } else {
                progress = k / (wildsCount - 1) || (wildsCount === 1 ? 1 : 0);
                feature.game.schedule(0.8 + getActivationDelay(progress, wildsCount), this.activateWild, this, i, progress);
            }
            k++;
        }

        tweens.scale(feature.container).start().delay(1.5).to(1, 1, 'quintic');
        tweens.position(feature.container).start().delay(1.5).to(1024, 1024, 1, 'quintic');

        var count = 50;
        tweens.pivot(feature.container).start();
        for (i = count; i >= 0; i--) {
            x = 5 * random.uniform(0.5, 1) * random.sign() * i / count;
            y = 5 * random.uniform(0.5, 1) * random.sign() * i / count;
            tweens.pivot(feature.container).to(1024 + x, 1024 + y, 3 / count, 'quintic');
        }
    }

    activateWild(feature, index, progress) {
        var symbol = feature.symbols[index];

        var particle;
        symbol.setType('wildGlowing');
        symbol.wildSmokeSpawner.enable();

        const wildAnimationFinishedDelay = nodeStructure.wins.length === 0 ? 0 : (nodeStructure.allWilds.length <= 1 ? 0.5 : 1);

        feature.game.schedule(wildAnimationFinishedDelay, this.wildAnimationFinished, this);

        if (progress === 1) {
            // dust shockwave
            particle = feature.particleContainer.emitter.spawn(0, 0, 0);

            particle.layer = 'mainParticlesAdd';
            particle.textures = feature.frames.shockwave;
            particle.blendMode = PIXI.BLEND_MODES.ADD;

            particle.life = particle.textures.length / 40;

            particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.life);

            particle.position.x = symbol.x;
            particle.position.y = symbol.y;

            tweens.alpha(particle).start(0.5).to(0, particle.life);
            particle.scale.set(2, 1.5);


            // flare
            particle = feature.particleContainer.emitter.spawn(0, 0, 0);

            particle.layer = 'mainParticlesAdd';
            particle.texture = 'main/particles/flares/7.png';
            particle.blendMode = PIXI.BLEND_MODES.ADD;

            particle.position.x = symbol.x;
            particle.position.y = symbol.y;

            particle.rotation = Math.PI / 2;

            tweens.alpha(particle).start(0).to(1, particle.life / 2).to(0, particle.life / 2);
            tweens.scale(particle).start(0).to(2, particle.life / 2).to(0, particle.life / 2);
        } else {
            // dust shockwave
            particle = feature.particleContainer.emitter.spawn(0, 0, 0);

            particle.layer = 'mainParticlesAdd';
            particle.textures = feature.frames.shockwave;
            particle.blendMode = PIXI.BLEND_MODES.ADD;

            particle.life = particle.textures.length / 60;

            particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.life);

            particle.position.x = symbol.x;
            particle.position.y = symbol.y;

            particle.rotation = random.uniform(0, 2) * Math.PI;

            particle.scale.set(0.5);

            tweens.alpha(particle).start(0.25).to(0, particle.life);

            // flare
            particle = feature.particleContainer.emitter.spawn(0, 0, 0);

            particle.layer = 'mainParticlesAdd';
            particle.texture = 'main/particles/flares/7.png';
            particle.blendMode = PIXI.BLEND_MODES.ADD;

            particle.position.x = symbol.x;
            particle.position.y = symbol.y;

            tweens.alpha(particle).start(0).to(1, particle.life / 2).to(0, particle.life / 2);
            tweens.scale(particle).start(0).to(1, particle.life / 2).to(0, particle.life / 2);
        }
    }

    wildAnimationFinished() {
        this.wildsAnimated--;
    }

    scatteredExplosion(feature, particle, symbol) {
        particle.life = random.uniform(0.5, 1.5);
        particle.texture = 'main/particles/flares/5.png';
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        translatePosition(symbol, particle.parent, particle.position);

        particle.scale.set(random.uniform(0.25, 1));

        var angle = random.uniform(0, 2) * Math.PI;

        particle.alphaTimeline.reset(1).to(0, particle.life);

        particle.directionTimeline.reset(angle);
        particle.speedTimeline.reset(random.uniform(200, 500)).to(50, particle.life, 'cubicOut');

        for (var i = 1; i <= 5; i++)
            particle.directionTimeline.to(random.sign() * random.uniform(20, 50) * Math.PI / 180, particle.life / 5, 'sine', true, true);

        // particle.tint = 0xfdc40a;
        tweens.tint(particle).start(0xffffff).to(0xfdc40a, particle.life / 2, 'cubicOut');
    }

    timelineLastLooped(feature, reel) {
        var index = feature.reels.indexOf(reel);

        reel.nextSymbolId = this.spinResults.symbols[index];
    }

    update(feature) {
        if (this.wildsAnimated)
            return;

        for (var i = 0; i < feature.reels.length; i++)
            if (!feature.reels[i].tween.ended)
                return;

        this.next();
    }

    next(feature) {
        if (nodeStructure.scattered.length)
            feature.states.change(this.nextStates.AnimateScattered);
        else if (nodeStructure.wilds.length)
            feature.states.change(this.nextStates.AnimateWilds);
        else if (nodeStructure.wins.length)
            feature.states.change(this.nextStates.ClustersShow);
        else
            feature.states.change(this.nextStates.Delay);
    }

    exit(feature) {
        for (var i = 0; i < feature.reels.length; i++) {
            var reel = feature.reels[i];
            var symbol = feature.symbols[i];
            reel.onLastLoop.disconnect(this.timelineLastLooped);
            reel.onLand.disconnect(this.reelLanded);

            var result = this.spinResults.symbols[i];

            var type = symbol.type;

            if (type === 'wildGlowing')
                type = 'wild';

            if (type !== result) {
                const mismatchError = new Error(`Symbol mismatch.`);
                mismatchError.additionalData = {
                    'expected': type,
                    'actual': result,
                    'reel index': i,
                };

                throw mismatchError;
            }
        }
    }
}


module.exports = StopReels;
