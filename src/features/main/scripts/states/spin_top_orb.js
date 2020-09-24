'use strict';


const {PIXI, translatePosition, tweens, random, sprite, features, MovieClip, Pool} = require('@omnigame/core');
const InitiateSpin = require('./initiate_spin');
const signals = require('../../../../scripts/signals');
const tempPoint = new PIXI.Point();
const Setup = require('./setup');


const ORB_SHOTS = [
    'main/instant_win/orbs/shot/1.m4a',
    'main/instant_win/orbs/shot/2.m4a',
    'main/instant_win/orbs/shot/3.m4a',
    'main/instant_win/orbs/shot/4.m4a'
];

const THUNDERS = [];
for (var i = 0; i < 5; i += 1) {
    THUNDERS[i] = [];
    for (var j = 0; j < 8; j += 1) {
        THUNDERS[i].push(`main/thunders/thunder_${i + 1}/thunder_${i + 1}_0${j}.png`);
    }
}


class SpinTopOrb extends InitiateSpin {
    create(feature) {
        super.create();

        this.wildsMap = new Map();

        this.thunders = new Pool(10, true, true, function() {
            const clip = sprite(new MovieClip(random.choice(THUNDERS))).anchor(0.5, 0.07).blending('ADD').addTo(feature.container).shader(feature.hueShader).layer('mainParticlesAdd').sprite;
            clip.animationSpeed = 30;
            return clip;
        });

    }

    enter(feature) {
        InitiateSpin.prototype.enter.call(this, feature, false);

        this.waitForItems += 2;

        this.freeSpinsCounter = 0;
        this.wildsCounter = 0;

        this.wildsMap.clear();

        feature.audioGroup.effect('main/instant_win/orbs/spin.m4a').play();
        feature.audio.tension.fadeIn(1).play();

        feature.game.schedule(0, this.requestPrize);

        this.dimReels();

        for (var i = 0; i < feature.sidebar.left.length; i++) {
            tweens.alpha(feature.sidebar.left[i]).start(0).to(1, 0.125).delay(0.25).to(0, 0.125).delay(0.25).repeat();
            tweens.alpha(feature.sidebar.right[i]).start(0).to(1, 0.125).delay(0.25).to(0, 0.125).delay(0.25).repeat();
        }

        if (feature.states.previous === Setup) {
            var orb = feature.prizeOrb;

            for (i = 0; i < orb.rings.length; i++) {
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
        }
    }

    requestResults() {
    }

    requestPrize(feature) {
        feature.game.particleContainer.emitter.spawnInstantly(1, this.onWhiteOverlay, this);
        
        feature.game.schedule(3, this.check);
        signals.get.mainPrizeOrbResults.send(2);
    }

    onSetPrizeOrbResults(feature, results) {
        this.results = results;
        this.messages.setSpinResults.send(this.machine, results.spinResults);
        this.check();
    }

    fireThunders(feature) {
        var i, j, delay = 0.6;

        if (!this.freeSpinsCounter && !this.wildsCounter && !this.magicBetCounter)
            this.hideOrb();

        if (this.freeSpinsCounter) {
            tempPoint.set(0, 0);
            translatePosition(features.gui.spin, feature.container, tempPoint);

            feature.game.schedule(0, this.preThunder, this);
            feature.game.schedule(delay, this.fireThunder, this, tempPoint.x, tempPoint.y);
            feature.game.schedule(delay, this.addFreeSpin, this);
        } else if (this.magicBetCounter) {
            tempPoint.set(0, 0);
            translatePosition(features.gui.betPanel, feature.container, tempPoint);

            for (i = 0; i < this.magicBetCounter; i++) {
                feature.game.schedule(2 + i * 2 + 0, this.preThunder);
                feature.game.schedule(2 + i * 2 + delay, this.fireMagicBetThunder, null, tempPoint.x, tempPoint.y, i);
            }

            tweens.create(feature.hueShader, 'hue').start().to(0.35, delay);

            feature.sidebar.glowColor = 0x9903b4;

            tweens.alpha(feature.sky.purpleSky).start().show().to(1, delay).call(this.hideNonPurple, this);
            tweens.alpha(feature.sky.purpleLake).start().show().to(1, delay);
            tweens.alpha(feature.purpleForeground).start().show().to(1, delay);
            tweens.alpha(feature.purpleWaves).start().show().to(1, delay);
            feature.audioGroup.effect('main/instant_win/orbs/magicbet_transition.m4a').play();
        } else if (this.wildsCounter) {
            var lastWildsRow = -1;
            var row;

            tweens.scale(feature.prizeOrb).start(1).delay(delay);
            for (i = 0; i < this.wildsCounter; i++) {
                for (j = 0; j < settings.STOP_ORDER.length; j++) {
                    row = settings.INDEX_TO_ROW[settings.STOP_ORDER[j]];

                    if (this.results.spinResults.symbols[settings.STOP_ORDER[j]] === 'wild' && row > lastWildsRow) {
                        tempPoint.set(0, 0);
                        translatePosition(feature.symbols[settings.STOP_ORDER[j]], feature.container, tempPoint);

                        feature.game.schedule(i * 0.5 + 0, this.preThunder);
                        feature.game.schedule(i * 0.5 + delay, this.fireWildThunder, null, tempPoint.x, tempPoint.y, settings.STOP_ORDER[j]);

                        lastWildsRow = row;
                        break;
                    }
                }
            }
        } else {
            this.next();
        }
    }

    fireThunder(feature, x, y) {
        feature.audioGroup.effect(random.choice(ORB_SHOTS)).play();
        tweens.pivot(feature.container).start().to(1024 + random.uniform(-5, 5), 1024 - random.uniform(10, 20), 0.125, 'cubicOut').to(1024, 1024, 2, 'elasticOut');

        tempPoint.set(0, 0);
        translatePosition(feature.prizeOrb, feature.container, tempPoint);
        const scale = Math.hypot(x - tempPoint.x, y - tempPoint.y) / 435;
        const angle = Math.atan2(y - tempPoint.y, x - tempPoint.x) - 1.6213860355642813;

        const thunder = sprite(this.thunders.get()).position(tempPoint).rotation(angle).scale(scale).sprite;
        thunder.play();

        tweens.scale(feature.prizeOrb).start(1.2).to(1, 1, 'cubicOut');

        feature.game.particleContainer.emitter.spawnInstantly(1, this.onWhiteOverlay, this);

        return thunder;
    }

    fireWildThunder(feature, x, y, symbolIndex) {
        var p = this.fireThunder(x, y);
        this.wildsMap.set(p, symbolIndex);
        this.addWild(p);
    }

    fireMagicBetThunder(feature, x, y, index) {
        this.fireThunder(x, y);
        this.addMagicBet(index);
    }

    preThunder(feature) {
        feature.prizeOrb.preLightningClip.visible = true;
        feature.prizeOrb.preLightningClip.play(0);
        tweens.scale(feature.prizeOrb).to(0.9, 1, 'sine');
    }

    afterCheck(feature) {
        feature.prizeOrb.state = settings.ORB_STATES.OFF;

        this.freeSpinsCounter = this.results.freeSpins;
        this.wildsCounter = this.results.wilds;
        this.magicBetCounter = this.results.magicBet;

        this.fireThunders();
    }

    hideOrb(feature) {
        feature.prizeOrb.outerRingSpawner.disable();
        feature.prizeOrb.flareBeamSpawner.disable();
        feature.prizeOrb.dustSpawner.disable();

        for (var i = 0; i < feature.prizeOrb.rings.length; i++)
            tweens.scaleXY(feature.prizeOrb.rings[i]).start().to(0, 0, 1, 'cubicIn');

        tweens.scale(feature.prizeOrb.circle).start().to(3, 0.5, 'cubicOut').to(0, 0.25, 'cubicIn');
        tweens.alpha(feature.prizeOrb).start().to(0, 1, 'cubicIn');

        feature.audio.tension.fadeOut(1).stop(1);
        feature.audioGroup.effect('main/instant_win/orbs/end.m4a').play();
    }

    hideNonPurple(feature) {
        feature.sky.sky.visible = false;
        feature.sky.lake.visible = false;
        feature.foreground.visible = false;
        feature.waves.visible = false;
    }

    addFreeSpin(feature) {
        features.gui.spin.counter.addInstantly(this.freeSpinsCounter);
        feature.game.particleContainer.emitter.spawnInstantly(100, this.freeSpinExplosion, this);
        this.freeSpinsCounter = 0;

        feature.game.schedule(2, this.fireThunders, this);
    }

    addMagicBet(feature, index) {
        features.gui.betPanel.increaseMagicBet();
        features.gui.betDown.visible = false;
        features.gui.betUp.visible = false;
        const {magicBet} = features.gui.betPanel;
        const scale = magicBet < 4 ? 1 : magicBet < 6 ? 1.25 : 1.5;
        tweens.scale(features.gui.betPanel.number).start(0.75).to(scale, 2, 'elasticOut');

        feature.game.particleContainer.emitter.spawnInstantly(100, this.magicBetExplosion, this);
        

        this.magicBetCounter--;
        if (this.magicBetCounter === 0)
            feature.game.schedule(2, this.fireThunders, this);

        if (index === 0) {
            features.gui.spinShader.hue = 0.6;
            features.gui.betShader.hue = 0.6;
            features.gui.betLabel.playTo(37);
            features.gui.betLabel.pulse();
            features.gui.particleSpawner.enable();
            features.gui.smokeSpawner.enable();
            feature.audio.ambient.stop();
            feature.audio.ambient.alias = 'main/music/loop_magic_bet.m4a';
            feature.audio.ambient.play();
        }
    }

    addWild(feature, thunder) {
        var i, particle;

        var symbolIndex = this.wildsMap.get(thunder);

        var symbol = feature.symbols[symbolIndex];
        var reel = feature.reels[symbolIndex];

        symbol.setType('wild');
        tweens.scale(symbol.sprite).start(0.8).to(1, 1, 'elasticOut');

        symbol.alpha = 1;
        symbol.visible = true;

        reel.visible = false;

        feature.audioGroup.effect('main/wild/land/1.m4a').play();

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

        for (i = 0; i < 100; i++) {
            particle = feature.game.particleContainer.emitter.spawn(0, 0, 0);
            translatePosition(symbol, particle.parent, particle);
            this.explosion(particle);
        }

        this.wildsCounter--;

        if (this.wildsCounter === 0)
            feature.game.schedule(1, this.fireThunders, this);
    }

    explosion(feature, particle, alpha, elapsed, counter) {
        particle.layer = 'mainParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        if (counter === 0) {
            particle.texture = PIXI.Texture.fromFrame('main/particles/flares/4.png');

            tweens.alpha(particle).start(1).to(0, particle.life);
            tweens.scale(particle).start(1).to(2, particle.life, 'cubicOut');
        } else {
            particle.texture = PIXI.Texture.fromFrame('main/prize_orb/1.png');

            var angle = random.uniform(0, 2 * Math.PI);
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);

            var radius = random.uniform(100, 200);

            tweens.position(particle).start().by(cos * radius, sin * radius, particle.life, 'cubicOut');

            tweens.alpha(particle).start(1).to(0, particle.life);
            tweens.scale(particle).start(2).to(0, particle.life);
        }
    }

    onWhiteOverlay(feature, particle) {
        sprite(particle).layer('blackOverlay').scale(256).position(1024).tint(0xffffff).alpha(0);
        particle.texture = PIXI.Texture.fromFrame('gui/square.png');
        particle.life = 0.5;
        tweens.alpha(particle).start(1).to(0, particle.life);
    }

    freeSpinExplosion(feature, particle, alpha, elapsed, counter, amount) {
        translatePosition(features.gui.spin, particle.parent, particle);
        this.explosion(particle, alpha, elapsed, counter, amount);
    }

    magicBetExplosion(feature, particle, alpha, elapsed, counter, amount) {
        translatePosition(features.gui.betPanel, particle.parent, particle);
        this.explosion(particle, alpha, elapsed, counter, amount);
    }

    next(feature) {
        feature.states.change(this.nextStates.StopReels);
    }

    dimReels(feature) {
        for (let i = 0; i < feature.reels.length; i++) {
            feature.reels[i].dim();
        }
    }

    undimReels(feature) {
        for (let i = 0; i < feature.reels.length; i++) {
            feature.reels[i].undim();
        }
    }

    exit(feature) {
        super.exit(feature);

        this.undimReels();
    }
}


module.exports = SpinTopOrb;
