'use strict';

const {Container, PIXI, translatePosition, random} = require('@omnigame/core');

const POSITIONS = [
    {'x': 896, 'y': 1140},
    {'x': 863, 'y': 1136},
    {'x': 889, 'y': 1194},
    {'x': 850, 'y': 1245},
    {'x': 770, 'y': 1159},
    {'x': 732, 'y': 1173},
    {'x': 678, 'y': 1123},
    {'x': 651, 'y': 1161},
    {'x': 773, 'y': 1134},
    {'x': 1034, 'y': 1256},
    {'x': 1149, 'y': 1192},
    {'x': 1143, 'y': 1138},
    {'x': 1177, 'y': 1135},
    {'x': 1197, 'y': 1236},
    {'x': 1255, 'y': 1190},
    {'x': 1343, 'y': 1174},
    {'x': 1347, 'y': 1128},
    {'x': 1373, 'y': 1203},
    {'x': 1447, 'y': 1248}
];


class Highlights extends Container {
    constructor(feature) {
        super();

        this.spawner = feature.particleContainer.emitter.createSpawner(this.onParticleSpawned, this);
    }

    onParticleSpawned(spawner, particle) {
        particle.layer = 'jackpotFlashEffects';

        particle.life = random.uniform(1, 2);

        particle.blendMode = PIXI.BLEND_MODES.ADD;

        particle.texture = PIXI.Texture.fromFrame('jackpot_flash_first/particles/flares/1.png');

        var position = random.choice(POSITIONS);

        particle.position.set(position.x, position.y);
        translatePosition(this, particle.parent, particle.position);

        particle.scaleTimeline.reset(0).to(random.uniform(1, 2), particle.life);
                    
        particle.alphaTimeline.reset(1).to(0, particle.life, 'cubicIn');
    }
}

module.exports = Highlights;