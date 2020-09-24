'use strict';


const {Container, numbers, Button, Counter, Overlay, PIXI, sprite, container, button, checkbox, tweens, random, translatePosition, ParticleContainer} = require('@omnigame/core');
const format = numbers.currency('da-DK');
const BetPanel = require('../betpanel.js');
const BetLabel = require('../bet_label.js');
const InitFeature = require('../../../../scripts/states/init_feature.js');
const BigWin = require('../big_win');
const Credits = require('../credits');
const InfoPanel = require('../info_panel');
const HueShader = require('../../../../scripts/hue_shader');
const signals = require('../../../../scripts/signals');

const SPIN_SHADER = new HueShader(0.4);
const BET_SHADER = new HueShader(0);


function framePadding(name, x, y) {
    var texture = PIXI.utils.TextureCache[name];
    x *= texture.baseTexture.resolution;
    y *= texture.baseTexture.resolution;
    texture.crop.x += x;
    texture.crop.y += y;
    texture.crop.width -= x * 2;
    texture.crop.height -= y * 2;
    texture.frame = texture.crop;
}

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

const smokeSprites = [
    'gui/particles/smoke/1.png',
    'gui/particles/smoke/2.png',
    'gui/particles/smoke/3.png',
];


class Init extends InitFeature {
    create() {
        this.nextStates = {};
        this.nextStates.Setup = require('./setup');
    }

    enter(feature) {
        feature.game.schedule(0, this.init);
    }

    addGraphics(feature) {
        framePadding('gui/square.png', 1, 1);

        feature.container = new Container();
        feature.container.layer = 'gui';
        feature.container.interactive = true;
        feature.container.hitArea = new PIXI.Rectangle(1024 - 380, 1024 + 270, 550, 200);  // Used to disable fast forward in this area
        feature.game.stage.addChild(feature.container);

        feature.frames = {};
        feature.frames.shockwave = getFrames('gui/shockwave');

        feature.particleContainer = container(new ParticleContainer({ 'standalone': true })).addTo(feature.container).instance;

        const BUTTON_Y = 1397;
        const BETPANEL_X = 1024 - 270;
        const CREDITS_X = 1024 + 260;
        const HOME_X = 1024 - 110;
        const AUTO_X = 1024 + 110;
        const REAL_BACKGROUND_Y = 1428;
        const REAL_CREDITS_Y = REAL_BACKGROUND_Y + 14;

        feature.bigWin                = container(new BigWin()).alpha(0).addTo(feature.container).instance;

        feature.creditsLabel          = sprite('gui/credits_label.png').anchor(0.5, 0).position(CREDITS_X, 1358).addTo(feature.container).sprite;

        feature.betLabel              = sprite(new BetLabel()).anchor(0.5, 0.5).position(BETPANEL_X, 1365).addTo(feature.container).sprite;
        feature.particleSpawner       = feature.particleContainer.emitter.createSpawner(this.onParticleSpawned, this, false, 10);
        feature.smokeSpawner          = feature.particleContainer.emitter.createSpawner(this.onSmokeSpawned, this, false, 50);
        feature.betShader             = BET_SHADER;

        feature.bonusSpins            = container(new Counter('guiCredits')).position(1097, REAL_CREDITS_Y).addTo(feature.container).hide().instance;

        feature.betPanel              = container(new BetPanel()).position(BETPANEL_X, BUTTON_Y).addTo(feature.container).instance;

        feature.credits               = container(new Credits()).layer('guiParticlesAdd').position(CREDITS_X, BUTTON_Y).layer('guiParticlesAdd').addTo(feature.container).instance;

        feature.home                  = button('gui/buttons/home/?.png').anchor(0.5, 48 / 98).position(HOME_X, BUTTON_Y).hitAreaCircle(37).addTo(feature.container).enable().button;
        feature.betDown               = button('gui/buttons/arrow_down/?.png').anchor(0.5, 35 / 69).position(BETPANEL_X - 70, BUTTON_Y).hitAreaCircle(27).disable().addTo(feature.container).button;
        feature.betUp                 = button('gui/buttons/arrow_up/?.png').anchor(0.5, 35 / 69).position(BETPANEL_X + 70, BUTTON_Y).hitAreaCircle(27).disable().addTo(feature.container).button;
        feature.auto                  = checkbox('gui/buttons/auto/?.png').anchor(0.5, 42 / 82).position(AUTO_X, BUTTON_Y).hitAreaCircle(37).addTo(feature.container).enable().button;
        feature.auto.decoration       = sprite('gui/buttons/auto/decor.png').position(0, -1).anchor(0.5, 0.5).addTo(feature.auto).hide().sprite;
        feature.info                  = button('gui/buttons/info/?.png').anchor(0.5, 35 / 69).position(856, 1443).hitAreaCircle(27).addTo(feature.container).disable().button;
        feature.spin                  = button('gui/buttons/spin/?.png').anchor(0.5, 51 / 104).position(1025, BUTTON_Y).hitAreaCircle(68).disable().addTo(feature.container).button;
        feature.spin.counter          = container(new Credits()).scale(1.3).addTo(feature.spin).instance;
        feature.spinShader            = SPIN_SHADER;

        feature.jackpotNotice         = sprite('features/gui/images/jackpot_notice.png').position(1024, 1024).anchor(0, 0).pivot(370, 160).alpha(0).addTo(feature.container).layer('info').sprite;
        feature.bonusSpinsNotice      = sprite('features/gui/images/no_more_bonus_spins.png').position(1024, 1024).alpha(0).addTo(feature.container).layer('info').sprite;

        feature.start                 = button('gui/buttons/start/?.png').position(1024, 1024).alpha(0).addTo(feature.container).button;
        feature.continue              = button('gui/buttons/continue/?.png').position(1024, 1024).alpha(0).addTo(feature.container).button;

        feature.featureOverlay        = container(new Overlay('gui/square.png')).layer('featureOverlay').scale(256, 256).addTo(feature.container).alpha(0).instance;
        feature.featureOverlay.tint = 0;

        feature.overlay               = container(new Overlay('gui/square.png')).layer('blackOverlay').scale(256, 256).addTo(feature.container).instance;
        feature.overlay.tint = 0;

        tweens.alpha(feature.overlay).start(1).delay(0.5).to(0, 1);

        feature.infoPanel             = container(new InfoPanel(feature)).layer('info').position(1024, 1024).hide().addTo(feature.container).instance;

        feature.addCredits = this.addCredits;

        Button.onClick({
            'sender': feature.home, 'context': this, 'receiver': function() {
                if (feature.auto.checked)
                    feature.auto.simulateClick();
            }
        });

        Button.onClick({
            'sender': feature.auto, 'context': feature.auto, 'receiver': function() {
                if (this.checked) {
                    tweens.alpha(this.decoration).start(1);
                    tweens.alpha(this.checkedBase).start(1);
                    tweens.rotation(this.decoration).start().show().by(Math.PI * 2, 5).repeat();
                } else {
                    var rotationTime = 1;
                    var fadeTime = 1;
                    tweens.rotation(this.decoration).start().by(numbers.minAngleDistance(this.decoration.rotation, 0), rotationTime, 'elasticOut');
                    tweens.alpha(this.decoration).start().delay(rotationTime).to(0, fadeTime, 'cubic').set(1).hide();
                    tweens.alpha(this.checkedBase).start(1).show().delay(rotationTime).to(0, fadeTime, 'cubic').set(0).hide();
                }
            }
        });

        // bind bet buttons to their respective functions
        Button.onClick({'sender': feature.betUp,   'receiver': feature.betPanel.increaseBetRate, 'context': feature.betPanel});
        Button.onClick({'sender': feature.betDown, 'receiver': feature.betPanel.decreaseBetRate, 'context': feature.betPanel});
        Button.onClick({
            'sender': feature.home, 'context': this, 'receiver': function() {
                signals.info.homePressed.send();
            }
        });

        // when bet is changed we have to update the html bet rate
        var betRateValueElement = document.getElementById('bet-rate-value');
        if (betRateValueElement) {
            BetPanel.onBetRateChanged(function(value, betPanel) {
                betRateValueElement.textContent = betPanel.magicBet > 1 ? format((value / betPanel.magicBet) / 100) : format(value / 100);
                signals.info.betRateChanged.send(value);
            }, this);
        }

        // when credits value is changed we have to align the "real credits value" text
        var creditsElement = document.getElementById('credits');
        var creditsValueElement = document.getElementById('credits-value');
        if (creditsValueElement) {
            Counter.onValueChange({
                'context': this, 'sender': feature.credits, 'receiver': function(sender, amount) {
                    creditsValueElement.textContent = format(amount / 100);
                }
            });
        }

        // when promo spins are changed we have to align the "bonus spins left" text
        var bonusSpinsElement = document.getElementById('bonus-spins');
        var bonusSpinsValueElement = document.getElementById('bonus-spins-value');
        var bonusSpinsLabelElement = document.getElementById('bonus-spins-label');
        if (bonusSpinsElement) {
            Counter.onValueChange({
                'context': this, 'sender': feature.bonusSpins, 'receiver': function(sender, amount) {
                    bonusSpinsLabelElement.textContent = amount > 1 ? 'bonus spins tilbage' : 'bonus spin tilbage';
                    bonusSpinsValueElement.textContent = amount;

                    if (amount === 0) {
                        bonusSpinsElement.classList.add('hidden');
                        creditsElement.classList.remove('hidden');
                    } else {
                        bonusSpinsElement.classList.remove('hidden');
                        creditsElement.classList.add('hidden');
                    }
                }
            });
        }

        // when the free spins value changes we have to switch spin button states
        Counter.onValueChange({
            'context': this, 'sender': feature.spin.counter, 'receiver': function(sender, amount, oldAmount) {
                var i;
                if (amount > 0) {
                    if (amount > oldAmount)
                        feature.game.particleContainer.emitter.spawnInstantly(amount, this.freeSpinParticle, this);

                    for (i = 1; i < feature.spin.counter.children.length; i++) {
                        feature.spin.counter.children[i].shader = SPIN_SHADER;
                        feature.spin.counter.children[i].alpha = 1;
                    }

                    if (feature.betPanel.magicBet > 1) {
                        this.setSpinButtonTexture('purple');
                    } else {
                        this.setSpinButtonTexture('green');
                    }
                } else {
                    for (i = 1; i < feature.spin.counter.children.length; i++)
                        feature.spin.counter.children[i].alpha = 0;
                    this.setSpinButtonTexture();
                }

                // sometimes a font has digits that are not at the same baseline
                // here they can be moved up/down when necessary
            /*
            var moveDown = true;
            while (amount) {
                if ((amount % 10) !== 6 && (amount % 10) !== 8) {
                    moveDown = false;
                    break;
                }

                amount = (amount / 10) | 0;
            }

            if (moveDown)
                sender.position.y = 5;
            else
                sender.position.y = 0;
            */
            }
        });

        Counter.onValueChange({
            'context': this, 'sender': feature.betPanel.number, 'receiver': function() {
                for (var i = 1; i < feature.betPanel.number.children.length; i++)
                    feature.betPanel.number.children[i].shader = null;

                if (feature.betPanel.magicBet > 1) {
                    this.setSpinButtonTexture('purple');
                    for (i = 1; i < feature.betPanel.number.children.length; i++)
                        feature.betPanel.number.children[i].shader = BET_SHADER;
                } else if (feature.spin.counter.amount > 0) {
                    this.setSpinButtonTexture('green');
                } else {
                    this.setSpinButtonTexture();
                }
            }
        });

        Button.onClick({'context': feature.infoPanel, 'sender': feature.info, 'receiver': feature.infoPanel.show});
    }

    addCredits(feature, amount) {
        feature.credits.add(amount);
        feature.credits.valueTimeline.onEnded.once(this.addCreditsExplosion, this);
    }

    addCreditsExplosion(feature) {
        tweens.scale(feature.credits).start(1.2).to(1, 1, 'cubicOut');

        var particle = feature.particleContainer.emitter.spawn(0, 0, 0);

        particle.layer = 'guiParticlesAdd';
        particle.textures = feature.frames.shockwave;

        particle.blendMode = PIXI.BLEND_MODES.ADD;
    
        particle.life = particle.textures.length / 40;

        particle.tint = 0xb07b15;

        translatePosition(feature.credits, particle.parent, particle.position);

        particle.textureTimeline.reset(0).to(particle.textures.length - 1, particle.life);
    }

    setSpinButtonTexture(feature, type = 'spin') {
        feature.spin.base.texture = PIXI.Texture.fromFrame(`gui/buttons/${type}/base.png`);
        feature.spin.hover.texture = PIXI.Texture.fromFrame(`gui/buttons/${type}/hover.png`);
        feature.spin.pressed.texture = PIXI.Texture.fromFrame(`gui/buttons/${type}/pressed.png`);
    }

    freeSpinParticle(feature, particle) {
        particle.texture = PIXI.Texture.fromFrame('gui/particles/plus.png');
        particle.layer = 'guiParticlesAdd';
        particle.blendMode = PIXI.BLEND_MODES.ADD;
        particle.life = random.uniform(1, 1.5);

        translatePosition(feature.spin, particle.parent, particle.position);

        var angle = random.uniform(-Math.PI * 0.25, -Math.PI * 0.75);
        var distance = random.uniform(5, 10);
        particle.position.x += Math.cos(angle) * distance;
        particle.position.y += Math.sin(angle) * distance;

        particle.scaleTimeline.reset(random.uniform(0.75, 1.25));
        particle.directionTimeline.reset(angle);
        particle.speedTimeline.reset(random.uniform(150, 250)).to(10, particle.life);
        particle.alphaTimeline.reset(0).to(1, particle.life / 2, 'cubicOut').to(0, particle.life, 'cubicIn');
    }

    onParticleSpawned(feature, spawner, particle) {
        particle.layer = 'guiParticlesAdd';
        particle.texture = PIXI.Texture.fromFrame('gui/particles/flares/5.png');
        particle.blendMode = PIXI.BLEND_MODES.ADD;
    
        particle.life = random.uniform(1, 2);
        particle.rotation = random.uniform(0, Math.PI * 2);
    
        if (Math.random() < 0.75) {
            translatePosition(feature.betLabel, particle.parent, particle.position);

            particle.position.x += random.uniform(-90, 90);
            particle.position.y += random.uniform(-20, 20);
        } else {
            translatePosition(feature.betPanel, particle.parent, particle.position);

            var width = feature.betPanel.width / 2;
            particle.position.x += random.uniform(-width, width);
            particle.position.y += random.uniform(10, 20);
        }
    
        particle.directionTimeline.reset(Math.random() * Math.PI * 2);
        particle.scaleTimeline.reset(random.uniform(0.2, 0.3));
        particle.speedTimeline.reset(10);
        particle.alphaTimeline.reset(0).to(random.uniform(0.8, 1), particle.life / 2, 'cubicOut').to(0, particle.life, 'cubicIn');
    }

    onSmokeSpawned(feature, spawner, particle) {
        if (Math.random() < 0.125)
            particle.layer = 'guiParticlesAdd';
        particle.texture = PIXI.Texture.fromFrame(random.choice(smokeSprites));

        particle.life = random.uniform(1, 2);
        particle.rotation = random.uniform(0, Math.PI * 2);

        if (Math.random() < 0.75) {
            translatePosition(feature.betLabel, particle.parent, particle.position);

            particle.position.x += random.uniform(-90, 90);
            particle.position.y += random.uniform(10, 20);
        } else {
            translatePosition(feature.betPanel, particle.parent, particle.position);

            var width = feature.betPanel.width / 2;
            particle.position.x += random.uniform(-width, width);
            particle.position.y += random.uniform(10, 20);
        }

        particle.scaleTimeline.reset(random.uniform(0.25, 0.4)).to(1, particle.life);
        particle.directionTimeline.reset(-Math.PI / 2);//.to(angle, particle.life);
        particle.speedTimeline.reset(random.uniform(10, 30));
        particle.tintTimeline.reset(0x340b51).to(0xf84aff, particle.life, 'cubicIn');
        particle.alphaTimeline.reset(0).to(0.5, particle.life / 2, 'cubicOut').to(0, particle.life, 'cubicIn');
    }

    next(feature) {
        feature.states.change(this.nextStates.Setup);
    }
}

module.exports = Init;
