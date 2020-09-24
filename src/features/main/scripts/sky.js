'use strict';


const { sprite, container, Container, random, Polygon, colors, tweens } = require('@omnigame/core');
const Constellation = require('./constellation');
const PrizeJackpot = require('./prize_jackpot');

const constellationTime = 90;


class Sky extends Container {
    constructor() {
        super();
        this.position.set(1024, 1024);
        this.pivot.set(1024, 1024);
        this.sky = sprite('features/main/images/sky.jpg').layer('bg').place(0.5, 0, 1024, 0).addTo(this);
        this.purpleSky = sprite('features/main/images/sky_purple.jpg').layer('bg').place(0.5, 0, 1024, 0).alpha(0).hide().addTo(this).sprite;

        this.polygon = Polygon.fromSVG('M 0 0 L 2048 0 L 2048 915 L 1856 1001 L 1778 999 L 1747 985 L 1727 992 L 1710 990 L 1668 976 L 1624 989 L 1556 971 L 1495 995 L 1475 993 L 1452 1002 L 1423 1003 L 1373 981 L 1334 996 L 1308 1000 L 1273 999 L 1259 1005 L 1234 1006 L 1208 1000 L 1200 1000 L 1175 960 L 1169 932 L 1148 916 L 1103 850 L 1101 836 L 1089 828 L 1024 730 L 960 827 L 949 834 L 945 848 L 855 987 L 832 982 L 812 994 L 767 992 L 699 970 L 659 1001 L 607 985 L 591 997 L 559 1003 L 529 1001 L 497 990 L 483 999 L 467 988 L 459 992 L 417 966 L 393 968 L 337 990 L 268 969 L 210 999 L 0 915 L 0 0 L 0 0 Z');
        for (var i = 0; i < 200; i += 1) {
            const star = sprite('main/particles/flares/6.png').blending('ADD').addTo(this).sprite;
            this.randomizeStar(star).randomize();
        }

        this.constellations = [
            container(new Constellation('anubis')).addTo(this).instance,
            container(new Constellation('bird')).addTo(this).instance,
            container(new Constellation('queen')).addTo(this).instance,
            container(new Constellation('ra')).addTo(this).instance
        ];
        this.constellationTime = constellationTime;

        this.jackpots = {
            'papyrus': container(new PrizeJackpot('main/background/labels/papyrus.png')).addTo(this).position(1024, 1024).pivot((1024 - 780) / 0.75, (1024 - 890) / 0.75).instance,
            'pharaoh': container(new PrizeJackpot('main/background/labels/pharaoh.png')).addTo(this).position(1024, 1024).pivot((1024 - 1270) / 0.75, (1024 - 890) / 0.75).instance,
            'luxur': container(new PrizeJackpot('main/background/labels/luxur.png')).addTo(this).position(1024, 1024).pivot((1024 - 830) / 0.75, (1024 - 790) / 0.75).instance,
            'nefertiti': container(new PrizeJackpot('main/background/labels/nefertiti.png')).addTo(this).position(1024, 1024).pivot((1024 - 1220) / 0.75, (1024 - 790) / 0.75).instance
        };

        this.flare = sprite('main/background/flare.png').position(1024, 900).scale(2).blending('ADD').alpha(0).addTo(this).sprite;

        this.lake = sprite('main/background/lake.png').place(0.5, 0, 619 + 816 / 2, 1261 - 142).addTo(this).sprite;
        this.purpleLake = sprite('main/background/lake-purple.png').place(0.5, 0, 619 + 816 / 2, 1261 - 142).alpha(0).hide().addTo(this).sprite;
        this.dunes = sprite('main/background/dunes.png').place(0.5, 0, 1024, 1466 - 359).addTo(this).sprite;
        this.frontDunes = sprite('main/foreground/dunes.png').place(0.5, 0.5, 1024, 1024 + 240).pivot(0, -120).scale(4, 4).layer('mainForeground').addTo(this).sprite;
    }

    randomizeStar(star) {
        star.tint = colors.hsv2hex(random.uniform(30 / 360, 250 / 360), random.uniform(0, 1), 1);
        this.polygon.getPositionInArea(star.position);
        return tweens.scale(star).start(0).to(random.uniform(0.5, 1.5), random.uniform(0.25, 0.75)).to(0, random.uniform(2, 4)).call(this.randomizeStar, this, star);
    }

    showRandomConstelation() {
        random.choice(this.constellations).appearForAMoment();
    }

    easterEgg() {
        this.showRandomConstelation();
        this.constellationTime = constellationTime;
    }

    update(elapsed) {
        super.update(elapsed);

        this.constellationTime -= elapsed;
        if (this.constellationTime <= 0) {
            this.showRandomConstelation();
            this.constellationTime = constellationTime;
        }

        this.scale.set(1 / this.parent.scale.x + (this.parent.scale.x - 1) * 0.05);
        this.lake.scale.set(1 + (this.parent.scale.x - 1) * 0.15);
        this.purpleLake.scale.set(1 + (this.parent.scale.x - 1) * 0.15);
        this.dunes.scale.set(1 + (this.parent.scale.x - 1) * 0.4);
        this.frontDunes.scale.set((1 + (this.parent.scale.x - 1) * 2) * 4);

        this.position.set(this.parent.pivot.x + (1024 - this.parent.pivot.x) * 0.25, this.parent.pivot.y + (1024 - this.parent.pivot.y) * 0.25);

        this.lake.pivot.set((this.parent.pivot.x - 1024) * 0.1, (this.parent.pivot.y - 1024) * 0.1);
        this.purpleLake.pivot.set((this.parent.pivot.x - 1024) * 0.1, (this.parent.pivot.y - 1024) * 0.1);
        this.dunes.pivot.set((this.parent.pivot.x - 1024) * 0.2, (this.parent.pivot.y - 1024) * 0.2);
        this.frontDunes.pivot.set((this.parent.pivot.x - 1024) * 0.5, -120 + (this.parent.pivot.y - 1024) * 0.25);
    }
}


module.exports = Sky;
