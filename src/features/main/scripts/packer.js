'use strict';


class PackNode {
    constructor(area) {
        if (area.length === 2)
            area = [0, 0, area[0], area[1]];
        this.area = area;
        this.width = this.right - this.left;
        this.height = this.bottom - this.top;
        this.children = null;
    }

    get left() {
        return this.area[0]; 
    }
    get top() {
        return this.area[1]; 
    }
    get right() {
        return this.area[2]; 
    }
    get bottom() {
        return this.area[3]; 
    }

    insert(area) {
        if (this.children) {
            var node = this.children[0].insert(area);
            if (node)
                return node;
            return this.children[1].insert(area);
        }

        area = new PackNode(area);

        if (area.width <= this.width && area.height <= this.height) {
            this.children = [
                new PackNode([this.left + area.width, this.top, this.right, this.top + area.height]),
                new PackNode([this.left, this.top + area.height, this.right, this.bottom])
            ];
            return new PackNode([this.left, this.top, this.left + area.width, this.top + area.height]);
        }

        return null;
    }
}


function nearestPowerOf2(n) {
    return 1 << 31 - Math.clz32(n);
}

function sortTallestFirst(a, b) {
    return b.height - a.height;
}


function pack(images, padding = 0, maxWidth = 2048, maxHeight = 2048) {
    // Copy images to avoid mutating passed-in array
    images = images.slice().sort(sortTallestFirst);

    // Set starting dimensions from the biggest image
    var height = nearestPowerOf2(images[0].height);
    var width = 0;
    for (let image of images)
        width = Math.max(width, nearestPowerOf2(image.width));

    while (width <= maxWidth && height <= maxHeight) {
        var root = new PackNode([width, height]);
        var frames = new Map();
        var fit = true;

        for (let image of images) {
            var imageWidth = Math.ceil(image.width);
            var imageHeight = Math.ceil(image.height);

            var node = root.insert([imageWidth + padding, imageHeight + padding]);
            if (node)
                frames.set(image, {
                    'x': node.left,
                    'y': node.top,
                    'width': imageWidth,
                    'height': imageHeight,
                });
            else {
                if (width >= maxWidth && height >= maxHeight)
                    throw new Error('Pack size too small');

                if (width > height)
                    height *= 2;
                else
                    width *= 2;

                fit = false;
                break;
            }
        }

        if (fit)
            break;
    }

    return {
        'width': width,
        'height': height,
        'frames': frames
    };
}


module.exports = pack;
