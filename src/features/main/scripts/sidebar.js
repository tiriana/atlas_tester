'use strict';

const {Container, sprite, MovieClip, tweens, PIXI, random, translatePosition, Polyline, features} = require('@omnigame/core');

const LEFT_POLYLINE = Polyline.fromSVG('M 625 1346 L 637.991 1326.074 L 654.187 1301.232 L 670.179 1276.703 L 686.23 1252.083 L 702.337 1227.378 L 718.359 1202.803 L 734.469 1178.092 L 750.521 1153.472 L 758 1128 L 776.887 1113.03 L 794.745 1085.639 L 813.086 1057.507 L 830.918 1030.155 L 848.862 1002.633 L 866.95 974.888 L 885.035 947.149 L 903.346 919.063 L 927.735 881.655 L 951.415 845.334 L 975.095 809.013 L 999.71 771.257 L 1024 734');
const RIGHT_POLYLINE = Polyline.fromSVG('M 1423 1346 L 1410.066 1326.162 L 1392.81 1299.693 L 1376.013 1273.929 L 1358.881 1247.652 L 1341.672 1221.256 L 1324.57 1195.025 L 1307.747 1169.22 L 1290.743 1143.14 L 1273.639 1116.905 L 1256.764 1091.022 L 1239.71 1064.864 L 1222.399 1038.312 L 1205.528 1012.434 L 1188.397 986.157 L 1171.393 960.077 L 1164 934 L 1144.345 918.589 L 1120.157 881.49 L 1095.04 842.964 L 1072.835 808.904 L 1048.417 771.452 L 1024 734');

const GLOW_TEXTURES = [
    'main/particles/smoke/1.png',
    'main/particles/smoke/2.png',
    'main/particles/smoke/3.png'
];

const LIGHTNING_FRAMES = [
    'main/effects/lightning/0.png',
    'main/effects/lightning/1.png',
    'main/effects/lightning/2.png',
    'main/effects/lightning/3.png',
    'main/effects/lightning/4.png',
    'main/effects/lightning/5.png',
    'main/effects/lightning/6.png',
];

class Sidebar extends Container {
    constructor(hueShader) {
        super();

        this.left = [];
        this.right = [];

        this.glowColor = 0x03b479;

        this.left.push(sprite('main/sidebar/left/1.png').position(644, 1330).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/2.png').position(677, 1287).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/3.png').position(700, 1249).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/4.png').position(728, 1200).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/5.png').position(752, 1164).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/6.png').position(786, 1119).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/7.png').position(809, 1072).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/8.png').position(845, 1034).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/9.png').position(869, 987).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/10.png').position(904, 946).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/17.png').position(921, 900).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/18.png').position(941, 867).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/19.png').position(969, 822).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/20.png').position(991, 794).alpha(0).shader(hueShader).addTo(this).sprite);
        this.left.push(sprite('main/sidebar/left/21.png').position(1012, 756).alpha(0).shader(hueShader).addTo(this).sprite);

        this.right.push(sprite('main/sidebar/right/1.png').position(1396, 1322).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/2.png').position(1372, 1288).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/3.png').position(1346, 1248).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/4.png').position(1323, 1216).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/5.png').position(1288, 1168).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/6.png').position(1266, 1120).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/7.png').position(1232, 1069).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/8.png').position(1205, 1030).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/9.png').position(1181, 993).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/10.png').position(1146, 950).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/17.png').position(1126, 900).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/18.png').position(1106, 867).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/19.png').position(1078, 822).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/20.png').position(1055, 794).alpha(0).shader(hueShader).addTo(this).sprite);
        this.right.push(sprite('main/sidebar/right/21.png').position(1036, 756).alpha(0).shader(hueShader).addTo(this).sprite);

        this.level = 0;

        this.glowSpawnerLeft = features.main.particleContainer.emitter.createSpawner(this.onGlowSpawnedLeft, this);
        this.glowSpawnerRight = features.main.particleContainer.emitter.createSpawner(this.onGlowSpawnedRight, this);

        this.preLightningClip = sprite(new MovieClip(settings.PRE_LIGHTNING_FRAMES)).addTo(this).position(1024, 737).pivot(28, 30).scale(2, 2).blending('ADD').hide().sprite;
        this.lightningClip = sprite(new MovieClip(LIGHTNING_FRAMES)).addTo(this).position(1024, 737).pivot(36, 60).scale(2, 2).blending('ADD').hide().sprite;
    }

    set(level = 0) {
        for (var i = 0; i < this.left.length; i++)
            this.left[i].alpha = this.right[i].alpha = i < level ? 1 : 0;

        this.level = level;

        this.glowSpawnerLeft.spawnRate = this.level * 5;
        this.glowSpawnerRight.spawnRate = this.level * 5;
    }

    add(fast = false) {
        if (this.level === this.left.length)
            return;
        tweens.alpha(this.left[this.level]).start(0).to(1, 0.125);
        tweens.alpha(this.right[this.level]).start(0).to(1, 0.125);

        if (!fast) {
            features.main.particleContainer.emitter.spawnInstantly(10, this.explosionLeft, this);
            features.main.particleContainer.emitter.spawnInstantly(10, this.explosionRight, this);

            this.level++;

            this.glowSpawnerLeft.spawnRate = this.level * 5;
            this.glowSpawnerRight.spawnRate = this.level * 5;
        } else
            this.level++;
    }

    subtract() {
        if (this.level === 0)
            throw new Error('Limit reached');
        this.level--;
        this.glowSpawnerLeft.spawnRate = this.level * 5;
        this.glowSpawnerRight.spawnRate = this.level * 5;
        tweens.alpha(this.left[this.level]).start().to(0, 0.125);
        tweens.alpha(this.right[this.level]).start().to(0, 0.125);
    }

    onGlowSpawned(particle) {
        particle.layer = 'mainParticles';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.texture = PIXI.Texture.fromFrame(random.choice(GLOW_TEXTURES));

        particle.rotation = random.uniform(0, 2 * Math.PI);

        tweens.tint().start(this.glowColor).delay(particle.life);

        tweens.alpha().start(1).to(0, particle.life);
        tweens.scale().start(0).to(random.uniform(0.25, 0.5), particle.life);
    }

    onGlowSpawnedLeft(spawner, particle) {
        this.onGlowSpawned(particle, this.left);

        var edgeSum = 0;
        var count = this.level;

        if (count >= 8)
            count++;

        for (var i = 0; i < count; i++)
            edgeSum += LEFT_POLYLINE.edgeLengths[i];

        var progress = random.uniform(0, edgeSum / LEFT_POLYLINE.edgeLengthsSum);
        LEFT_POLYLINE.getPosition(progress, particle.position);
    }

    onGlowSpawnedRight(spawner, particle) {
        this.onGlowSpawned(particle, this.right);

        var edgeSum = 0;
        var count = this.level;

        if (count >= 15)
            count++;

        for (var i = 0; i < count; i++)
            edgeSum += RIGHT_POLYLINE.edgeLengths[i];

        var progress = random.uniform(0, edgeSum / RIGHT_POLYLINE.edgeLengthsSum);
        RIGHT_POLYLINE.getPosition(progress, particle.position);
    }

    explosion(particle, angle) {
        particle.layer = 'mainParticles';
        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.texture = PIXI.Texture.fromFrame('main/prize_orb/1.png');

        var cos = Math.cos(angle);
        var sin = Math.sin(angle);

        var radius = random.uniform(25, 50);

        tweens.position().start().by(cos * radius, sin * radius, particle.life, 'cubicOut');

        tweens.alpha().start(1).to(0, particle.life);
        tweens.scale().start(random.uniform(1, 1.5)).to(0, particle.life);
    }

    explosionLeft(particle) {
        translatePosition(this.left[this.level], particle.parent, particle.position);
        this.explosion(particle, random.uniform(0, Math.PI) + 135 * Math.PI / 180);
    }

    explosionRight(particle) {
        translatePosition(this.right[this.level], particle.parent, particle.position);
        this.explosion(particle, random.uniform(0, Math.PI) - 135 * Math.PI / 180);
    }
}

module.exports = Sidebar;
