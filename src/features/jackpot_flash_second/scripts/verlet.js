'use strict';

const {numbers} = require('@omnigame/core');
const Particle = require('../../../../scripts/verlet/particle');
const DistanceConstraint = require('../../../../scripts/verlet/distance_constraint');
const Pool = require('../../../../scripts/pool');

const VERLET_FPS = 1 / 60;

const ORDER = [
    0, // instnat win #1
    5, // pharaoh
    2, // instant win #3
    6,  // nefertiti
    3, // instant win #4
    4, // luxur
    1, // instnat win #2
];

function calculatePosition(index, count, particle) {
    var angleStep = Math.PI * 2 / 8;

    var p = 0;

    if (count > 2)
        p = (index - (count - 1) / 2) / ((count - 1) / 2);

    var angle = angleStep * index - angleStep * (count - 1) / 2 - Math.PI / 2 + Math.sign(p) * (1 - Math.abs(p)) * 20 * Math.PI / 180;
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var radius = 250 + 60 * Math.abs(p);

    particle.x = particle.ox = cos * radius;
    particle.y = particle.oy = sin * radius;
}

function particle() {
    var p = new Particle(0, 0, 0, 0);
    p.mass = 0;
    return p;
}

class Verlet {
    constructor() {
        var i;

        this.time = 0;

        this.anchors = [
            particle(),
            particle(),
            particle(),
            particle(),
            particle(),
            particle(),
            particle(),
        ];

        this.particles = [
            particle(),
            particle(),
            particle(),
            particle(),
            particle(),
            particle(),
            particle(),
            particle()
        ];

        this.particlePool = new Pool(9, false, false);
        for (i = 0; i < this.particles.length; i++)
            this.particlePool._objects[i] = this.particles[i];

        this.particlePool.size = this.particlePool.firstFreeIndex = this.particles.length;

        this.projectile = this.particles.shift();

        this.constraints = [];
        // make particle want to go to the anchor
        for (i = 0; i < this.particles.length; i++)
            this.constraints.push(new DistanceConstraint(this.anchors[i], this.particles[i], 0.01, 0.01, 1, 0));

        this.constraints.unshift(new DistanceConstraint(this.projectile, this.anchors[0], 0.01, 0.01, 0, 0));

        this.constraintPool = new Pool(this.constraints.length, false, false);
        for (i = 0; i < this.constraints.length; i++)
            this.constraintPool._objects[i] = this.constraints[i];

        this.constraintPool.size = this.constraintPool.firstFreeIndex = this.constraints.length;

        this.projectileConstraint = this.constraints.shift();

        this.reset();
    }

    setProjectileTarget(index) {
        this.projectileConstraint.b = this.anchors[index];
    }

    reset() {
        this.particlePool.size = this.particlePool.firstFreeIndex = this.particles.length + 1;
        this.constraintPool.size = this.constraintPool.firstFreeIndex = this.constraints.length + 1;

        for (var i = 0; i < this.anchors.length; i++) {
            calculatePosition(i, 7, this.anchors[ORDER[i]]);
            calculatePosition(i, 7, this.particles[ORDER[i]]);
        }
    }

    disableParticle(index) {
        var i, p;
        var disabledParticle = this.particles[index];

        this.particlePool.recycle(disabledParticle);

        for (i = this.constraintPool.firstFreeIndex - 1; i >= 0; i--) {
            var c = this.constraintPool._objects[i];

            if (disabledParticle === c.a || disabledParticle === c.b)
                this.constraintPool.recycle(c);
        }

        var k = 0;
        var count = this.particlePool.firstFreeIndex;
        for (i = 0; i < ORDER.length; i++) {
            p = this.particles[ORDER[i]];
            if (this.particlePool.indexOf(p) >= count)
                continue;

            var dx = p.x - disabledParticle.x;
            var dy = p.y - disabledParticle.y;

            var d = Math.hypot(dx, dy);

            dx /= d;
            dy /= d;

            d = numbers.clamp(d, 0, 500);

            d = 30 * (1 - d / 500);

            p.x += dx * d;
            p.y += dy * d;

            calculatePosition(k, count - 1, this.anchors[ORDER[i]]);
            k++;
        }
    }

    updateAnchorPositions() {
        for (var i = 0; i < this.anchors.length; i++) {
            this.anchors[i].x = this.anchors[i].ox;
            this.anchors[i].y = this.anchors[i].oy;
        }
    }

    update(elapsed) {
        this.time += elapsed;

        while (this.time > VERLET_FPS) {
            this.time -= VERLET_FPS;

            var i;

            for (i = 0; i < this.particlePool.firstFreeIndex; i++) {
                var p = this.particlePool._objects[i];

                var vx = p.x - p.ox;
                var vy = p.y - p.oy - 0.9 * p.mass;

                p.ox = p.x;
                p.oy = p.y;

                vx = p.drag * vx;
                vy = p.drag * vy;

                p.x += vx;
                p.y += vy;
            }

            for (var c = 0; c < 1; c++)
                for (i = 0; i < this.constraintPool.firstFreeIndex; i++)
                    this.constraintPool._objects[i].update();

            this.updateAnchorPositions();
        }
    }

}

module.exports = Verlet;
