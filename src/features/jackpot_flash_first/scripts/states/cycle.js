'use strict';


const {PIXI, State, tweens, random, translatePosition, audio, features} = require('@omnigame/core');
const signals = require('../../../../scripts/signals');

// const ORDER = [0, 6, 1, 6, 2, 6, 3, 6, 4, 6, 5, 6, 2, 6, 3, 6];
const ORDER = [0, 1, 2, 3, 4, 5, 6];
const DELAY = 7.662585034013605 / 16;

class Cycle extends State {
    create() {
        this.nextStates = {};
        this.nextStates.BigWin = require('./big_win');
        this.nextStates.SecondActivate = require('./jackpot_flash_second_activate');
    }

    enter(feature) {
        this.waitForItems = 2; // wait for results and for a small delay

        this.orderIndex = -1;
        this.lastPrizeIndex = -1;

        this.results = null;

        feature.audio.playlist.queue('cycle').once('loopchange', this.startCycle);

        tweens.scale(feature.container).start().to(1.1, 20, 'sine');
        tweens.position(feature.container).start().by(0.0001, 0.0001, 0.01, null, 'loop').to([1014, 1034], [1019, 1029], [0.75, 1.5], 'sine').repeat(Infinity, 'loop');

        signals.get.jackpotFlashResults.send();
    }

    startCycle(feature) {
        feature.game.schedule(5, this.check);
        this.scheduleFourHighlights();
    }

    scheduleFourHighlights(feature) {
        for (var i = 1; i < 16; i++)
            audio.clock.schedule(DELAY * i, this.highlightPrize);

        this.highlightPrize();

        feature.audio.playlist.once('loop', this.scheduleFourHighlights);
    }

    onSetJackpotFlashResults(feature, results) {
        this.results = results;

        this.check();
    }

    check() {
        this.waitForItems--;

        if (this.waitForItems === 0)
            this.afterCheck();
    }

    afterCheck() {
        this.lastPrizeIndex = this.results.prizeIndex;
    }

    highlightPrize(feature) {
        this.orderIndex = (this.orderIndex + 1) % ORDER.length;

        var prizeIndex = ORDER[this.orderIndex];

        if (prizeIndex === this.lastPrizeIndex) {
            this.highlightLastPrize();
            return;
        }

        var prize = feature.prizes[prizeIndex];
        var flare = prize.flare;
        var light = prize.light;

        tweens.alpha(flare).start().to(1, 0.125).to(0, 0.5);
        tweens.rotation(flare).start().by(random.sign() * random.uniform(10, 20) * Math.PI / 180, 0.5, 'cubicOut');
        tweens.scale(flare).start(0.25).to(random.uniform(0.5, 1), 0.5, 'cubicOut');

        tweens.alpha(light).start().to(1, 0.125).to(0, 1);

        if (prize.counter) {
            tweens.scale(prize.counter).start().to(1.1, 0.125).to(1, 1);
        }

        if (prizeIndex === 6)
            feature.particleContainer.emitter.spawnInstantly(50, this.onDoorParticleSpawned);
        else
            feature.particleContainer.emitter.spawnInstantly(10, this.onParticleSpawned);
    }

    highlightLastPrize(feature) {
        // feature.game.cancelAll(this.highlightPrize);
        audio.clock.cancelAll(this.highlightPrize);

        feature.audio.playlist.off('loop', this.scheduleFourHighlights);
        feature.audio.playlist.stop();

        for (var i = 0; i < feature.prizes.length - 1; i++)
            if (i !== this.lastPrizeIndex)
                tweens.alpha(feature.prizes[i]).start().to(0, 1);

        var prize = feature.prizes[this.lastPrizeIndex];
        var flare = prize.flare;
        var light = prize.light;

        tweens.scale(feature.container).start().to(1.2, 1, 'quintic');
        tweens.pivot(feature.container).start().delay(0.25).to(prize.position.x, prize.position.y, 1, 'quintic');

        tweens.alpha(flare).start().to(1, 0.125);
        flare.rotation = 0;
        tweens.scale(flare).start(0.25).to(1, 0.5, 'cubicOut');

        tweens.alpha(light).start().to(1, 0.125);

        if (prize.counter)
            tweens.scale(prize.counter).start().to(1.5, 1, 'elasticOut');

        if (this.lastPrizeIndex === 6) {
            feature.audioGroup.effect('jackpot_flash_first/win_door.m4a').play();

            tweens.scale(feature.container).start().to(1.5, 1, 'quintic');

            feature.game.schedule(2, this.outroToNextChamber);
            feature.particleContainer.emitter.spawnInstantly(100, this.onDoorParticleSpawned);
        } else {
            feature.audioGroup.effect('jackpot_flash_first/win_instant.m4a').play();

            feature.game.schedule(2, this.outroToBigWin);
            feature.particleContainer.emitter.spawnInstantly(20, this.onParticleSpawned);
        }
    }

    outroToNextChamber(feature) {
        var door = feature.prizes[this.lastPrizeIndex];
        var time = 5;
        var easedTime = 3 * time / 10;
        var wholeTime = time + easedTime;

        tweens.alpha(door.light).start().to(0, 0.25);
        tweens.alpha(door.flare).start().to(0, 0.25);
        door.tween.start(1).to(0.9, easedTime, 'cubicIn').to(0, time);

        feature.dust.dropSpawner.enable();
        feature.dust.smokeSpawner.enable();
        door.dustSpawner.enable();

        tweens.scale(feature.container).start().to(8, wholeTime, 'quinticIn');

        var x = door.position.x;
        var y = door.position.y;

        tweens.pivot(feature.container).start().to([x - 5, x + 5], [y - 2, y + 2], 0.06).repeat();

        tweens.alpha(features.gui.featureOverlay).start()
                                                 .delay(wholeTime / 2)
                                                 .to(1, wholeTime / 2, 'cubicIn')
                                                 .call(this.showNextChamber)
                                                 .to(0, 1);
    }

    showNextChamber(feature) {
        var door = feature.prizes[this.lastPrizeIndex];

        feature.container.visible = false;

        feature.dust.dropSpawner.disable();
        feature.dust.smokeSpawner.disable();
        door.dustSpawner.disable();

        feature.torches[0].flameSpawner.spawnRate = 0;
        feature.torches[1].flameSpawner.spawnRate = 0;
        feature.dust.spawner.spawnRate = 0;
        feature.highlights.spawner.spawnRate = 0;
        tweens.alpha(feature.topLight).start().to(0, 2);

        tweens.scale(feature.game.stage).stop(1);
        door.tween.stop(1);

        door.flare.alpha = 0;
        door.flare.scale.set(0);
        door.light.alpha = 0;

        tweens.pivot(feature.container).stop(1024, 1024);
        tweens.position(feature.container).stop(1024, 1024);

        feature.states.change(this.nextStates.SecondActivate);
    }

    outroToBigWin(feature) {
        var flare = feature.prizes[this.lastPrizeIndex].flare;

        tweens.scale(flare).start()
                           .to(0.8, 0.125)
                           .to(200, 0.5, 'cubicIn');

        features.gui.overlay.tint = 0xffffff;
        tweens.alpha(features.gui.overlay).start()
                                          .delay(0.125)
                                          .to(1, 0.5, 'cubicIn')
                                          .call(this.showBigWin)
                                          .to(0, 1, 'cubicIn')
                                          .set('tint', 0x000000);
    }

    showBigWin(feature) {
        var prize = feature.prizes[this.lastPrizeIndex];
        var flare = prize.flare;
        var light = prize.light;

        features.gui.bigWin.alpha = 1;
        feature.container.scale.set(1);
        feature.container.pivot.set(1024, 1024);

        prize.alpha = 0;

        light.alpha = 0;

        flare.alpha = 0;
        flare.scale.set(1);

        prize.scale.set(1);
        prize.counter.value.children[0].alpha = 1;

        var amount = prize.counter.amount;
        if (prize.counter.showCurrency)
            amount = this.results.jackpotValue;

        feature.states.change(this.nextStates.BigWin, amount, prize.counter.showCurrency);
    }

    onParticleSpawned(feature, particle) {
        var prizeIndex = ORDER[this.orderIndex];
        var prize = feature.prizes[prizeIndex];

        particle.layer = 'jackpotFlashEffects';
        particle.texture = PIXI.Texture.fromFrame('jackpot_flash_first/particles/flares/1.png');

        particle.life = 1;

        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.usePhysics = true;
        particle.friction = 100;

        var angle = random.uniform(0, 2) * Math.PI;
        var speed = random.uniform(50, 100);
        var vx = Math.cos(angle);
        var vy = Math.sin(angle);
        var radius = random.uniform(20, 50);

        particle.position.set(vx * radius, vy * radius);

        particle.velocity.set(vx * speed, vy * speed);

        particle.scaleTimeline.reset(random.uniform(1, 2)).to(0, particle.life, 'cubicIn');

        translatePosition(prize, particle.parent, particle.position);
    }

    onDoorParticleSpawned(feature, particle) {
        var prizeIndex = ORDER[this.orderIndex];
        var prize = feature.prizes[prizeIndex];
        var doorWidth = 94;
        var doorHeight = 140;

        particle.layer = 'jackpotFlashDoorEffects';
        particle.texture = PIXI.Texture.fromFrame('jackpot_flash_first/particles/flares/1.png');

        particle.life = 1;

        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.usePhysics = true;
        particle.friction = 100;

        var angle = random.uniform(0, 2) * Math.PI;
        var speed = random.uniform(50, 100);
        var vx = Math.cos(angle);
        var vy = Math.sin(angle);

        if (Math.abs(vx) > Math.abs(vy))
            particle.position.set(doorWidth * Math.sign(vx), Math.sign(vx) * doorWidth * vy / vx);
        else
            particle.position.set(Math.sign(vy) * doorHeight * vx / vy, doorHeight * Math.sign(vy));

        particle.velocity.set(vx * speed, vy * speed);

        particle.scaleTimeline.reset(random.uniform(1, 2)).to(0, particle.life, 'cubicIn');

        translatePosition(prize, particle.parent, particle.position);
    }
}


module.exports = Cycle;
