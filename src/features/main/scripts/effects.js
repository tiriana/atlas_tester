'use strict';

const { PIXI, Container, sprite, container, Polyline, random, Signal, features } = require('@omnigame/core');
const pack = require('./packer');

const tempPoint = new PIXI.Point();

function OverlayShader() {
    var fragmentSrc = `
        precision lowp float;

        varying vec2 vTextureCoord;
        varying vec4 vColor;

        uniform sampler2D uSampler;

        void main(void) {
           gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor - 0.008;
        }`;

    PIXI.AbstractFilter.call(this, null, fragmentSrc);
}

OverlayShader.prototype = Object.create(PIXI.AbstractFilter.prototype);

const OVERLAY_SHADER = new OverlayShader();

const path = Polyline.fromSVG('M -50 -35 L 50 -35 L 50 35 L -50 35 L -50 -35');

const ELAPSED = 1 / 60;

const trailsQuality = 50; // 1 -- 100
const maxAlphaMultiplier = 7;

class Frame extends Container {
    constructor() {
        super();

        this.overlay = sprite('main/square.png').addTo(this).tint(0x000000).alpha(0.01).sprite;
        this.overlay.layer = new PIXI.DisplayGroup(0, true);

        this.overlay.width = 200;
        this.overlay.height = 120;

        this.particles = [];

        for (var i = 0; i < 20; i++) {
            this.particles[i] = sprite('main/particles/test.png').addTo(this).blending('ADD').hide().sprite;
            this.particles[i].layer = new PIXI.DisplayGroup(1, true);
        }

        this.lastProgress = 0;
        this.progress = 0;
        this.speed = 0;
        this.particleAlpha = 0;

        this.path = path;
    }

    randomize() {
        this.progress = Math.random();
        this.lastProgress = this.progress;
        this.scale.x = random.sign();
    }

    setType(type) {
        for (var i = 0; i < this.particles.length; i++)
            this.particles[i].texture = settings.SYMBOL_DEFINITIONS[type].trailTexture;
    }

    update(elapsed) {
        this.progress += this.speed * elapsed;

        this.progress = (this.progress + 1) % 1;

        path.getPosition(this.progress, this.particles[0].position);

        var difference = (1 + this.progress - this.lastProgress) % 1;

        var step = 0.005;
        var i = 0;
        while (difference >= step) {
            difference -= step;

            if (i === this.particles.length - 2)
                break;

            var particle = this.particles[i];
            particle.visible = true;
            particle.alpha = this.particleAlpha;
            this.path.getPosition((this.lastProgress + step * i) % 1, particle.position);
            i++;
        }

        this.lastProgress = (this.lastProgress + step * i) % 1;

        for (; i < this.particles.length; i++)
            this.particles[i].visible = false;
    }
}

class Trail extends Container {
    constructor() {
        super();

        this.texture = null;

        this.points = [];

        this.nodeIndexes = null;

        this.lastPosition = new PIXI.Point();

        this.lastPointIndex = 0;
        this.pointIndex = 0;

        this.velocity = new PIXI.Point();
        this.turnSpeed = 3;

        this.signals = {};
        this.signals.arrived = new Signal();

        this.particleAlpha = 0;
        this.particleScale = 1;
    }

    setType(type) {
        this.texture = settings.SYMBOL_DEFINITIONS[type].trailTexture;
    }

    onParticleSpawned(particle) {
        sprite(particle).position(tempPoint.x + 694, tempPoint.y + 940).blending('ADD').layer('mainSymbols');
        particle.texture = this.texture;

        const qMultiplier = 1 / 99 * (1 - maxAlphaMultiplier) * trailsQuality + 100 * (maxAlphaMultiplier - 1) / 99 + 1;

        particle.alphaTimeline.reset(this.particleAlpha * qMultiplier).to(0, particle.life);
        particle.scaleTimeline.reset(this.particleScale).to(0, particle.life);
    }

    update(elapsed) {
        if (this.particleAlpha === 0)
            return;

        var target = this.points[this.pointIndex];
        var dx = target.x - this.lastPosition.x;
        var dy = target.y - this.lastPosition.y;
        var distance = Math.hypot(dx, dy);

        this.velocity.x += this.turnSpeed * dx * elapsed / distance;
        this.velocity.y += this.turnSpeed * dy * elapsed / distance;

        var speed = Math.hypot(this.velocity.x, this.velocity.y);

        this.velocity.x /= speed;
        this.velocity.y /= speed;

        var x = tempPoint.x = this.lastPosition.x + this.speed * this.velocity.x * elapsed;
        var y = tempPoint.y = this.lastPosition.y + this.speed * this.velocity.y * elapsed;

        features.main.particleContainer.emitter.spawnInstantly(1, this.onParticleSpawned, this);

        dx = x - this.lastPosition.x;
        dy = y - this.lastPosition.y;

        var d = Math.hypot(dx, dy);

        dx /= d;
        dy /= d;

        var count = Math.floor(d);
        const step = 1 / 99 * (1 - count) * trailsQuality + 100 * (count - 1) / 99 + 1;

        for (var i = 1; i < count; i += step) {
            tempPoint.x = this.lastPosition.x + dx * i;
            tempPoint.y = this.lastPosition.y + dy * i;

            features.main.particleContainer.emitter.spawnInstantly(1, this.onParticleSpawned, this);
        }

        this.lastPosition.x = x;
        this.lastPosition.y = y;

        if (distance < 10 && this.lastPointIndex !== this.pointIndex) {
            this.lastPointIndex = this.pointIndex;
            this.pointIndex = Math.min(this.pointIndex + 1, this.points.length - 1);
            this.signals.arrived.send(this, this.lastPointIndex);
        }
    }

    start() {
        this.turnSpeed = 60;
        this.lastPointIndex = 0;
        this.pointIndex = 1;

        this.lastPosition.x = this.points[0].x;
        this.lastPosition.y = this.points[0].y;

        var target = this.points[this.pointIndex];

        var dx = target.x - this.lastPosition.x;
        var dy = target.y - this.lastPosition.y;
        var d = Math.hypot(dx, dy);

        dx /= d;
        dy /= d;

        var angle = random.uniform(20, 60) * random.sign() * Math.PI / 180;

        var cos = Math.cos(angle);
        var sin = Math.sin(angle);

        this.velocity.x = cos * dx - sin * dy;
        this.velocity.y = sin * dx + cos * dy;
    }
}

class Effects extends Container {
    constructor() {
        super();

        this.game = require('../../../scripts/main');

        this.timeAccumulator = 0;

        // we need two containers in order for layers to work properly
        this.stage = new Container();
        this.stage.displayList = new PIXI.DisplayList();

        this.frames = [];
        this.trails = [new Trail(), new Trail(), new Trail(), new Trail(), new Trail()];

        for (var i = 0; i < features.main.symbols.length; i++)
            this.frames.push(new Frame());

        // determine the max size of the needed renderTexture and use frames as texture coordinates for sprites
        var packData = pack(this.frames);

        this.renderTextures = [
            new PIXI.RenderTexture(this.game.renderer, packData.width, packData.height),
            new PIXI.RenderTexture(this.game.renderer, packData.width, packData.height)
        ];

        this.sprites = [];

        for (i = 0; i < features.main.symbols.length; i++) {
            var symbol = features.main.symbols[i];
            var frame = this.frames[i];
            var framePositionInfo = packData.frames.get(frame);

            var symbolSprite = new PIXI.Sprite();
            symbolSprite.textures = [
                new PIXI.Texture(this.renderTextures[0], framePositionInfo),
                new PIXI.Texture(this.renderTextures[1], framePositionInfo)
            ];
            symbolSprite.texture = symbolSprite.textures[0];
            symbolSprite.blendMode = PIXI.BLEND_MODES.ADD;
            symbolSprite.autoAnchor();

            this.sprites[i] = symbolSprite;

            container(frame).addTo(this.stage).position(framePositionInfo.x + 100, framePositionInfo.y + 60);
            container(symbolSprite).addTo(this).position(symbol.position.x, symbol.position.y);
        }

        for (i = 0; i < this.trails.length; i++)
            container(this.trails[i]).addTo(this.stage);

        this.renderTextures.current = 0;

        this.sprite = sprite(this.renderTextures[0]).blending('ADD').sprite;

        this.overlay = sprite('main/square.png').alpha(1).tint(0).position(1024).width(2048).height(2048).sprite;
        this.overlayContainer = new PIXI.Container();
        this.overlayContainer.addChild(this.overlay);
    }

    update(elapsed) {
        this.timeAccumulator += elapsed;

        while (this.timeAccumulator > ELAPSED) {
            this.containerUpdate(ELAPSED);
            this.stage.update(ELAPSED);
            this.timeAccumulator -= ELAPSED;

            var index = this.renderTextures.current = (this.renderTextures.current + 1) % 2;
            this.sprite.shader = OVERLAY_SHADER;
            this.sprite.blendMode = PIXI.BLEND_MODES.NORMAL;

            this.stage.displayList.update(this.stage);
            this.renderTextures[index].render(this.overlayContainer);
            this.renderTextures[index].render(this.sprite);
            this.renderTextures[index].render(this.stage);
            this.sprite.texture = this.renderTextures[index];
            this.sprite.shader = null;

            for (var i = 0; i < this.sprites.length; i++)
                this.sprites[i].texture = this.sprites[i].textures[index];
        }
    }
}

module.exports = Effects;
