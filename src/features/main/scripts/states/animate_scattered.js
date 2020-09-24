'use strict';


const {PIXI, tweens, State, translatePosition, random, features} = require('@omnigame/core');
const nodeStructure = require('../node_structure');

const SHOCKWAVE_TEXTURES = [];

for (var i = 0; i < 48; i++)
    SHOCKWAVE_TEXTURES[i] = `gui/shockwave/${i}.jpg`;

const IMPLOSION_TEXTURES = [];

for (i = 0; i < 33; i++)
    IMPLOSION_TEXTURES[i] = `gui/implosion/${i}.png`;

const TRIANGLE_TEXTURES = [];

for (i = 0; i < 64; i++)
    TRIANGLE_TEXTURES[i] = `main/effects/triangle/${i}.png`;

const COLLECT_SOUNDS = [
    'main/scattered/cat/collect.m4a',
    'main/scattered/cat/collect.m4a',
    'main/scattered/nefertiti/collect.m4a'
];

function sort(a, b) {
    var y = a.position.y - b.position.y;

    if (y !== 0)
        return y;

    return b.position.x - a.position.x;
}

const TRIANGLE_CENTER = {'x': 1024, 'y': 1124};
const TRIANGLE_RADIUS = 120;

const tempPoint = new PIXI.Point();

class AnimateScattered extends State {
    create() {
        this.nextStates = {};
        this.nextStates.AnimateWilds = require('./animate_wilds');
        this.nextStates.ClustersShow = require('./clusters_show');
        this.nextStates.Respin = require('./respin');
        this.nextStates.JackpotFlashActivate = require('./jackpot_flash_activate');

        this.winIndex = -1;

        this.symbols = [null, null, null];
    }

    enter(feature) {
        var i, node, symbol;

        if (!this.dustSpawner)
            this.dustSpawner = feature.particleContainer.emitter.createSpawner(this.dustSpawned, this);

        feature.audioGroup.effect(COLLECT_SOUNDS[feature.scatteredCollected[features.gui.betPanel.rawBetRate]]).play();

        var delay = 0;

        for (i = 0; i < nodeStructure.scattered.length; i++) {
            node = nodeStructure.scattered[i];
            symbol = feature.symbols[node.index];

            this.symbols[i] = symbol;
        }

        this.symbols.sort(sort);

        for (i = 0; i < 3; i++) {
            symbol = this.symbols[i];
            symbol.setType(node.value);
            symbol.layer = 'mainParticles';

            var angle = (i * 120 - 90) * Math.PI / 180;
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);

            var x = TRIANGLE_CENTER.x + TRIANGLE_RADIUS * cos;
            var y = TRIANGLE_CENTER.y + TRIANGLE_RADIUS * sin;

            tweens.scale(symbol).start().delay(delay).to(1.5, 1, 'cubic');
            tweens.alpha(symbol.glow).start(0).delay(delay).show().to(1, 1, 'cubic');
            tweens.position(symbol).start().delay(delay + 2).to(x, y, 1, 'cubic');
            tweens.pivot(symbol).start().delay(delay).by(0, 10, random.uniform(0.9, 1.1), 'sine', 'loop').by(0, -10, random.uniform(0.9, 1.1), 'sine').repeat(Infinity, 'loop');
            tweens.rotation(symbol).start().delay(delay).by(-2 * Math.PI / 180, 1.2, 'sine').by(4 * Math.PI / 180, 2.4, 'sine', 'loop').by(-4 * Math.PI / 180, 2.4, 'sine').repeat(Infinity, 'loop');

            if (i === 2)
                feature.game.schedule(delay + 0.25, this.initialExplosion, this);

            delay += 0.125;
        }


        delay = tweens.position(symbol).duration + 1;

        tweens.scale(feature.container).start().delay(delay).to(1.2, 1, 'quintic');
        tweens.position(feature.container).start().delay(delay + 0.25).to(1024, 954, 1, 'quintic');

        feature.game.schedule(delay, this.implosion, this);
        feature.game.schedule(delay, this.triangle, this);
        feature.game.schedule(delay + 0.75, this.merge, this);
    }

    dustSpawned(feature, spawner, particle) {
        particle.life = random.uniform(2, 5);
        particle.texture = 'main/particles/flares/5.png';
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.position.x = TRIANGLE_CENTER.x;
        particle.position.y = TRIANGLE_CENTER.y;

        particle.scale.set(random.uniform(0.25, 1));

        var angle = random.uniform(0, 2) * Math.PI;

        particle.alphaTimeline.reset(1).to(0, particle.life);

        particle.directionTimeline.reset(angle);
        particle.speedTimeline.reset(random.uniform(100, 200));

        for (var i = 1; i <= 5; i++)
            particle.directionTimeline.to(random.sign() * random.uniform(20, 50) * Math.PI / 180, particle.life / 5, 'sine', true, true);

        particle.tint = 0xfdc40a;
    }

    merge(feature) {
        var i, symbol;

        tweens.create(this.dustSpawner, 'spawnRate').start(0).to(50, 1, 'cubicOut').to(0, 0);

        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.texture = PIXI.Texture.fromFrame('main/other/flare.jpg');
        particle.layer = 'guiParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.position.x = TRIANGLE_CENTER.x;
        particle.position.y = TRIANGLE_CENTER.y - 50;

        tweens.scale(particle).start(0).to(4, 0.5, 'cubic').delay(0.25).to(0, 0.5, 'cubicOut');

        particle.life = tweens.scale(particle).duration;

        for (i = 0; i < 3; i++) {
            symbol = this.symbols[i];

            tweens.position(symbol).start().to(TRIANGLE_CENTER.x, TRIANGLE_CENTER.y, 1, 'quintic');
            tweens.scale(symbol).start().to(1.8, 1, 'quintic').to(1.5, 0.25, 'cubicIn');

            if (i > 0)
                tweens.alpha(symbol).start().delay(0.5).to(0, 0.5);
        }

        var count = 50;
        tweens.pivot(feature.container).start();
        for (i = count; i >= 0; i--) {
            var x = 5 * random.uniform(0.5, 1) * random.sign() * i / count;
            var y = 5 * random.uniform(0.5, 1) * random.sign() * i / count;
            tweens.pivot(feature.container).to(1024 + x, 1024 + y, 3 / count, 'quintic');
        }

        feature.game.schedule(tweens.scale(symbol).duration, this.landExplosion, this);
        feature.game.schedule(2, this.flyToTop, this);
    }

    flyToTop(feature) {
        var symbol = this.symbols[0];

        var collected = feature.scatteredCollected[features.gui.betPanel.rawBetRate];

        var x = symbol.position.x;
        var y = symbol.position.y;

        tempPoint.set(0, 0);

        switch (collected) {
            case 0:
                translatePosition(feature.catLeft, symbol.parent, tempPoint);
                tempPoint.x += 18;
                tempPoint.y += 5;
                symbol.sprite.texture = 'main/cat_left_separated.png';
                tweens.scale(symbol).start().to(1.3, 1, 'quintic');
                break;
            case 1:
                translatePosition(feature.catRight, symbol.parent, tempPoint);
                tempPoint.x -= 18;
                tempPoint.y += 4;
                symbol.sprite.texture = 'main/cat_right_separated.png';
                tweens.scale(symbol).start().to(1.3, 1, 'quintic');
                break;
            case 2:
                translatePosition(feature.nefertiti, symbol.parent, tempPoint);
                symbol.sprite.texture = 'main/nefertiti_separated.png';
                tempPoint.x += 2;
                tempPoint.y += 4;
                tweens.scale(symbol).start().to(1.45, 1, 'quintic');
                break;
        }

        tweens.alpha(symbol.glow).start().to(0, 1, 'quintic');

        tweens.rotation(symbol).start().to(0, 1, 'quintic');
        tweens.pivot(symbol).start().to(0, 0, 1, 'quintic');
        tweens.position(symbol).start(x, y).to(tempPoint.x, tempPoint.y, 1, 'quintic').call(this.animateTopSymbols, this);
        tweens.position(feature.container).start().delay(0.5).to(1024, 1124, 1.5, 'quintic');
        tweens.scale(feature.container).start().delay(0.25).to(1.3, 1.5, 'quintic');
        tweens.pivot(feature.container).start()
            .delay(1.55)
            .by(0.0001, 0.0001, 0, null, 'loop')
            .to([1014, 1034], [1019, 1029], [0.75, 1.5], 'sine')
            .repeat(Infinity, 'loop');
    }

    initialExplosion(feature) {
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.life = SHOCKWAVE_TEXTURES.length / 30;

        particle.textures = SHOCKWAVE_TEXTURES;
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.tint = 0x1c8085;
        particle.scale.set(2, 2);

        for (var i = 0; i < nodeStructure.scattered.length; i++) {
            var node = nodeStructure.scattered[i];
            var symbol = feature.symbols[node.index];

            particle.position.x += symbol.position.x;
            particle.position.y += symbol.position.y;
        }

        particle.position.x /= 3;
        particle.position.y /= 3;

        translatePosition(symbol.parent, particle.parent, particle.position);

        particle.textureTimeline.reset(0).to(SHOCKWAVE_TEXTURES.length - 1, particle.life);
    }

    landExplosion(feature) {
        this.symbols[0].highlight.play(0);

        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.life = SHOCKWAVE_TEXTURES.length / 30;

        particle.textures = SHOCKWAVE_TEXTURES;
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.tint = 0xd4ac0a;

        particle.position.x = TRIANGLE_CENTER.x;
        particle.position.y = TRIANGLE_CENTER.y;

        particle.textureTimeline.reset(0).to(SHOCKWAVE_TEXTURES.length - 1, particle.life);

        particle.alpha = 0.25;
    }

    topExplosion(feature) {
        // shockwave
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.life = SHOCKWAVE_TEXTURES.length / 30;

        particle.textures = SHOCKWAVE_TEXTURES;
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.tint = 0x1c8085;
        particle.scale.set(2, 2);

        translatePosition(feature.nefertiti, particle.parent, particle.position);

        particle.textureTimeline.reset(0).to(SHOCKWAVE_TEXTURES.length - 1, particle.life);

        // dust particles
        for (var j = 0; j < 100; j++) {
            particle = feature.particleContainer.emitter.spawn(0, 0, 0);

            particle.life = random.uniform(0.5, 1.5);
            particle.texture = 'main/particles/flares/5.png';
            particle.layer = 'mainParticlesAdd';
            particle.blendMode = PIXI.BLEND_MODES.ADD;

            translatePosition(feature.nefertiti, particle.parent, particle.position);

            particle.scale.set(random.uniform(0.25, 1));

            var angle = random.uniform(0, 2) * Math.PI;

            particle.alphaTimeline.reset(1).to(0, particle.life);

            particle.directionTimeline.reset(angle);
            particle.speedTimeline.reset(random.uniform(200, 500)).to(100, particle.life, 'cubicOut');

            for (var i = 1; i <= 5; i++)
                particle.directionTimeline.to(random.sign() * random.uniform(20, 50) * Math.PI / 180, particle.life / 5, 'sine', true, true);

            particle.tint = 0xfdc40a;
        }
    }

    implosion(feature) {
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.life = IMPLOSION_TEXTURES.length / 30;

        particle.textures = IMPLOSION_TEXTURES;
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.tint = 0x1c8085;
        particle.scale.set(2, 2);

        particle.position.x = TRIANGLE_CENTER.x;
        particle.position.y = TRIANGLE_CENTER.y;

        particle.textureTimeline.reset(0).to(IMPLOSION_TEXTURES.length - 1, particle.life);
    }

    triangle(feature) {
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.anchor.set(0.5, 385 / 700);

        particle.life = TRIANGLE_TEXTURES.length / 30;

        particle.textures = TRIANGLE_TEXTURES;
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.position.x = TRIANGLE_CENTER.x;
        particle.position.y = TRIANGLE_CENTER.y;

        particle.textureTimeline.reset(0).to(TRIANGLE_TEXTURES.length - 1, particle.life);

        tweens.scale(particle).start(8).delay(0.75).to(0.4 * 8, 1, 'quintic');
    }

    animateTopSymbols(feature) {
        feature.scatteredCollected[features.gui.betPanel.rawBetRate]++;

        var collected = feature.scatteredCollected[features.gui.betPanel.rawBetRate];

        // change the textures of scattered based on collected info
        feature.updateScatteredTextures(collected);

        this.topExplosion();

        for (var i = 0; i < 3; i++) {
            var symbol = this.symbols[i];
            var index = feature.symbols.indexOf(symbol);

            tweens.pivot(symbol).stop();
            tweens.scale(symbol).stop();
            tweens.rotation(symbol).stop();
            tweens.position(symbol).stop();

            symbol.pivot.set(0, 0);
            symbol.rotation = 0;
            symbol.scale.set(1);
            symbol.layer = 'mainSymbols';
            symbol.alpha = 1;
            symbol.position.x = feature.reels[index].position.x + settings.SYMBOL_WIDTH / 2;
            symbol.position.y = feature.reels[index].position.y + settings.SYMBOL_HEIGHT / 2;
            symbol.reset();
            symbol.visible = false;
            feature.reels[index].setType('empty');
            feature.reels[index].visible = true;
        }

        if (collected < 3) {
            tweens.alpha(collected === 1 ? feature.catLeft : feature.catRight).start().to(1, 0.125);
            feature.game.schedule(2, this.outro);
        } else if (collected === 3) {
            tweens.alpha(feature.nefertiti).start().to(1, 0.125);
            feature.game.schedule(2, this.outroToJackpotFlash);
        } else
            throw new Error('Invalid scattered collected value: ' + collected);
    }

    outro(feature) {
        tweens.position(feature.container).start().to(1024, 1024, 2, 'cubic');
        tweens.pivot(feature.container).start().to(1024, 1024, 2, 'cubic');
        tweens.scale(feature.container).start().to(1, 2, 'cubic').call(this.next, this);
    }

    outroToJackpotFlash(feature) {
        // triangle
        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.anchor.set(0.5, 385 / 700);

        particle.life = TRIANGLE_TEXTURES.length / 30;

        particle.textures = TRIANGLE_TEXTURES;
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.position.x = 1024;
        particle.position.y = 850;

        particle.scale.set(0.64 * 8);

        particle.textureTimeline.reset(0).to(TRIANGLE_TEXTURES.length - 1, particle.life).repeat();

        // flare
        particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.texture = PIXI.Texture.fromFrame('main/other/flare.jpg');
        particle.layer = 'guiParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.position.x = 1024;
        particle.position.y = 850;

        tweens.scale(particle).start(0).delay(1).to(100, 2, 'cubic').delay(2);
        tweens.alpha(particle).start(1).delay(3).to(0, 2, 'cubic');

        particle.life = tweens.scale(particle).duration;

        tweens.alpha(features.gui.featureOverlay).start(0).delay(1).to(1, 2).delay(2).call(this.next, this);

        var count = 50;
        tweens.pivot(feature.container).start();
        for (i = count; i >= 0; i--) {
            var x = 5 * random.uniform(0.5, 1) * random.sign() * i / count;
            var y = 5 * random.uniform(0.5, 1) * random.sign() * i / count;
            tweens.pivot(feature.container).to(1024 + x, 1024 + y, 3 / count, 'quintic');
        }

        feature.audioGroup.effect('main/scattered/nefertiti/drop.m4a').play();

        // zoom out
        tweens.position(feature.container).start().to(1024, 1024, 2, 'cubic');
        tweens.scale(feature.container).start().to(1, 2, 'cubic');
    }

    next(feature) {
        if (feature.scatteredCollected[features.gui.betPanel.rawBetRate] === 3)
            feature.states.change(this.nextStates.JackpotFlashActivate);
        else if (nodeStructure.wilds.length)
            feature.states.change(this.nextStates.AnimateWilds);
        else if (nodeStructure.wins.length)
            feature.states.change(this.nextStates.ClustersShow);
        else
            feature.states.change(this.nextStates.Respin);
    }
}


module.exports = AnimateScattered;
