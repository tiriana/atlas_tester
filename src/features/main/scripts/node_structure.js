'use strict';

const { arrayDiff } = require('../../../scripts/utils');

const DIRECTIONS = {'0': {'1': 0, '6': 1}, '1': {'0': 3, '2': 0, '6': 2, '7': 1}, '2': {'1': 3, '3': 0, '7': 2, '8': 1}, '3': {'2': 3, '4': 0, '8': 2, '9': 1}, '4': {'3': 3, '5': 0, '9': 2, '10': 1}, '5': {'4': 3, '10': 2}, '6': {'0': 4, '1': 5, '7': 0, '11': 1}, '7': {'1': 4, '2': 5, '6': 3, '8': 0, '11': 2, '12': 1}, '8': {'2': 4, '3': 5, '7': 3, '9': 0, '12': 2, '13': 1}, '9': {'3': 4, '4': 5, '8': 3, '10': 0, '13': 2, '14': 1}, '10': {'4': 4, '5': 5, '9': 3, '14': 2}, '11': {'6': 4, '7': 5, '12': 0, '15': 1}, '12': {'7': 4, '8': 5, '11': 3, '13': 0, '15': 2, '16': 1}, '13': {'8': 4, '9': 5, '12': 3, '14': 0, '16': 2, '17': 1}, '14': {'9': 4, '10': 5, '13': 3, '17': 2}, '15': {'11': 4, '12': 5, '16': 0, '18': 1}, '16': {'12': 4, '13': 5, '15': 3, '17': 0, '18': 2, '19': 1}, '17': {'13': 4, '14': 5, '16': 3, '19': 2}, '18': {'15': 4, '16': 5, '19': 0}, '19': {'16': 4, '17': 5, '18': 3}, '20': {'18': 4, '19': 5}};
const CHANGE_DIRECTION_COST = {'0': {'0': 1, '1': 2, '2': 3, '3': 4, '4': 3, '5': 2, }, '1': {'0': 2, '1': 1, '2': 2, '3': 3, '4': 4, '5': 3, }, '2': {'0': 3, '1': 2, '2': 1, '3': 2, '4': 3, '5': 4, }, '3': {'0': 4, '1': 3, '2': 2, '3': 1, '4': 2, '5': 3, }, '4': {'0': 3, '1': 4, '2': 3, '3': 2, '4': 1, '5': 2, }, '5': {'0': 2, '1': 3, '2': 4, '3': 3, '4': 2, '5': 1, }, };
const MIRROR_INDEX = [5, 4, 3, 2, 1, 0, 10, 9, 8, 7, 6, 14, 13, 12, 11, 17, 16, 15, 19, 18, 20];

const edgeMap = {};
const edgeMapInverted = [];

const CLUSTER_TRAILS = new Map();
const MULTIPLIER_TRAILS = new Map();

const SYMBOL_IDS = ['wild'];

if (typeof settings !== 'undefined') {
    for (var s in settings.SYMBOL_DEFINITIONS)
        if (settings.SYMBOL_DEFINITIONS[s].multipliers)
            SYMBOL_IDS.push(s);

    SYMBOL_IDS.sort(function(a, b) {
        if (!settings.SYMBOL_DEFINITIONS[a].multipliers)
            return -1;

        if (!settings.SYMBOL_DEFINITIONS[b].multipliers)
            return 1;

        return settings.SYMBOL_DEFINITIONS[a].multipliers[0] - settings.SYMBOL_DEFINITIONS[b].multipliers[0];
    });
}


function has(array, value) {
    return array.indexOf(value) > -1;
}

function clusterSort(a, b) {
    var d = a.row - b.row;

    if (d)
        return d;

    return a.column - b.column;
}

function permutateWithoutRepetitions(input) {
    if (input.length === 1)
        return [input];

    const output = [];

    const smallerPermutations = permutateWithoutRepetitions(input.slice(1));

    const firstOption = input[0];

    for (let i = 0; i < smallerPermutations.length; i += 1) {
        const smallerPermutation = smallerPermutations[i];

        for (let j = 0; j <= smallerPermutation.length; j += 1) {
            const permutationPrefix = smallerPermutation.slice(0, j);
            const permutationSuffix = smallerPermutation.slice(j);
            output.push(permutationPrefix.concat([firstOption], permutationSuffix));
        }
    }

    return output;
}


class Node {
    constructor(i, c, r) {
        this.index = i;
        this.column = c;
        this.row = r;
        this.value = 0;
        this.neighbours = [];
    }

    toJSON() {
        return this.value;
    }
}

class Structure {
    constructor() {
        var x, y, row;

        this.nodes = [];
        this.rows = [];

        this.rows[0] = new Array(6);
        this.rows[1] = new Array(5);
        this.rows[2] = new Array(4);
        this.rows[3] = new Array(3);
        this.rows[4] = new Array(2);

        this.clusterSize = 7;

        this.topMultiplier = 1;

        this.wins = null;

        for (y = 0; y < this.rows.length; y++) {
            row = this.rows[y];
            for (x = 0; x < row.length; x++) {
                row[x] = new Node(this.nodes.length, x, y);
                this.nodes.push(row[x]);

                if (x > 0)
                    this.connectNodes(row[x - 1], row[x]);
            }
        }

        for (y = this.rows.length - 1; y > 0; y--) {
            row = this.rows[y];
            for (x = 0; x < row.length; x++) {
                this.connectNodes(row[x], this.rows[y - 1][x]);
                this.connectNodes(row[x], this.rows[y - 1][x + 1]);
            }
        }
    }

    connectNodes(a, b) {
        a.neighbours.push(b);
        b.neighbours.push(a);
    }

    getNode(row, index) {
        return this.rows[row][index];
    }

    check(node, cluster, checked, value = node.value, includeWilds = false) {
        var i, neighbour;

        for (i = 0; i < node.neighbours.length; i++) {
            neighbour = node.neighbours[i];

            if (!has(checked, neighbour)) {
                if (neighbour.value === value || (neighbour.value === 'wild' && includeWilds)) {
                    checked.push(neighbour);
                    cluster.push(neighbour);
                    this.check(neighbour, cluster, checked, value, includeWilds);
                }
            }
        }
    }

    isRegularSymbol(value) {
        return settings.SYMBOL_DEFINITIONS[value].multipliers;
    }

    fill(result) {
        this.topMultiplier = result.multiplier || this.topMultiplier;
        const symbols = result.symbols;
        var i;

        for (i = 0; i < symbols.length; i++)
            this.nodes[i].value = symbols[i];

        this.scattered = this.checkForScattered();
        this.allWilds = this.findAllWilds();
        this.wilds = this.checkForWilds(this.allWilds);
        this.wins = this.checkForClusters();
    }

    getWinAmount(clusters) {
        var i;
        var sum = 0;

        for (i = 0; i < clusters.length; i++)
            sum += this.getWinAmountForCluster(clusters[i]);

        return sum;
    }

    getWinAmountForCluster(cluster) {
        var sum = 0;
        var symbol;

        for (var j = 0; j < cluster.length; j++) {
            symbol = settings.SYMBOL_DEFINITIONS[cluster[j].value];
            if (symbol.multipliers)
                sum += symbol.multipliers[j];
        }

        return sum / 100;
    }

    isClusterTouchingMultiplier(cluster) {
        var hasIndex18 = false;
        var hasIndex19 = false;

        for (var j = 0; j < cluster.length; j++) {
            if (cluster[j].index === 18)
                hasIndex18 = true;
            if (cluster[j].index === 19)
                hasIndex19 = true;
        }

        return hasIndex18 && hasIndex19;
    }

    isAnyClusterTouchingMultiplier(clusters) {
        for (var i = 0; i < clusters.length; i++) {
            if (this.isClusterTouchingMultiplier(clusters[i])) {
                return true;
            }
        }
        return false;
    }

    findAllWilds() {
        const allWilds = [];
        for (i = 0; i < this.nodes.length; i++)
            if (this.nodes[i].value === 'wild')
                allWilds.push(this.nodes[i]);
        return allWilds;
    }

    checkForWilds(allWilds = this.findAllWilds()) {
        var i, j;
        var wilds = [...allWilds];
        var wildClusters;

        if (wilds.length === 0)
            return wilds;

        // if all symbols are wilds then fill them with the best symbol
        if (wilds.length + this.scattered.length === this.nodes.length) {
            for (i = 0; i < wilds.length; i++)
                wilds[i].value = SYMBOL_IDS[SYMBOL_IDS.length - 1];
            return wilds;
        }

        // find every smallest possible cluster
        var clusters = this.checkForClusters(1, true, false);

        // expand those clusters by adding wilds to them
        for (i = 0; i < clusters.length; i++) {
            clusters[i].length = 1;
            this.check(clusters[i][0], clusters[i], clusters[i].slice(), clusters[i][0].value, true);
        }

        // remove clusters smaller than minimum cluster size
        for (i = clusters.length - 1; i >= 0; i--)
            if (clusters[i].length < this.clusterSize)
                clusters.splice(i, 1);

        // remove duplicates
        for (i = 0; i < clusters.length; i++) {
            var code = this.clusterToCode(clusters[i]);

            for (j = clusters.length - 1; j > i; j--)
                if (this.clusterToCode(clusters[j]) === code)
                    clusters.splice(j, 1);
        }

        // remove clusters that don't touch the bottom
        for (i = clusters.length - 1; i >= 0; i--) {
            for (j = 0; j < clusters[i].length; j++)
                if (clusters[i][j].row === 0)
                    break;

            if (j === clusters[i].length)
                clusters.splice(i, 1);
        }

        wildClusters = clusters;

        if (wildClusters.length === 0)
            return [];

        var winAmount = 0;
        var bestWinAmount = 0;
        var bestConfiguration = 0;
        var bestPermutation = null;
        var bestClusterSize = 0;
        var size = 0;

        var count = Math.pow(2, wildClusters.length);

        var permutations = permutateWithoutRepetitions(wildClusters);

        for (var p = 0; p < permutations.length; p++) {
            var permutation = permutations[p];

            for (var c = 0; c < count; c++) {
                for (i = 0; i < wilds.length; i++)
                    wilds[i].value = 'wild';

                for (i = 0; i < permutation.length; i++) {
                    if ((c >> i) % 2)
                        for (j = 1; j < permutation[i].length; j++)
                            permutation[i][j].value = permutation[i][0].value;
                }

                clusters = this.checkForClusters();
                winAmount = this.getWinAmount(clusters);

                size = 0;

                for (i = 0; i < clusters.length; i++) {
                    size += clusters[i].length;
                    if (this.isClusterTouchingMultiplier(clusters[i]))
                        winAmount += 100000000;
                }

                if (winAmount > bestWinAmount || (winAmount === bestWinAmount && size > bestClusterSize)) {
                    bestConfiguration = c;
                    bestWinAmount = winAmount;
                    bestPermutation = permutation;
                    bestClusterSize = size;
                }
            }
        }

        for (i = 0; i < wilds.length; i++)
            wilds[i].value = 'wild';

        if (bestConfiguration === 0)
            return [];

        for (i = 0; i < bestPermutation.length; i++) {
            if ((bestConfiguration >> i) % 2)
                for (j = 1; j < bestPermutation[i].length; j++)
                    bestPermutation[i][j].value = bestPermutation[i][0].value;
        }

        return wilds;
    }

    checkForScattered() {
        var i;
        var scattered = [];
        for (i = 0; i < this.nodes.length; i++)
            if (this.nodes[i].value === 'scattered')
                scattered.push(this.nodes[i]);

        if (scattered.length === 3)
            return scattered;

        return [];
    }

    checkForClusters(size = this.clusterSize, allowOnlyRegularSymbols = true, allowOnlyFromFirstRow = true) {
        var n, i;

        var clusters = [];
        var checked = [];

        for (i = 0; i < this.nodes.length; i++) {
            n = this.nodes[i];

            if (allowOnlyFromFirstRow && n.row > 0)
                continue;

            if (allowOnlyRegularSymbols && !this.isRegularSymbol(n.value))
                continue;

            if (!has(checked, n)) {
                var cluster = [];

                cluster.push(n);
                checked.push(n);

                this.check(n, cluster, checked);

                if (cluster.length >= size) {
                    cluster.sort(clusterSort);
                    clusters.push(cluster);
                }
            }
        }

        return clusters;
    }

    mergeClusters(clusters) {
        if (clusters.length === 1)
            return clusters[0].slice();

        var output = [];
        for (var i = 0; i < clusters.length; i++)
            output = output.concat(clusters[i]);

        output.sort(clusterSort);

        return output;
    }

    getNonWins(allNodes, clusters) {
        return arrayDiff(allNodes, [].concat(...clusters));
    }

    calculateTrailPath(steps, checked, cluster, best) {
        var lastStep = steps[steps.length - 1];
        var i, n, move;

        var cost = this.calculatePathCost(steps);

        if (cost > best.cost)
            return;

        var availableMoves = [];

        for (i = 0; i < lastStep.length; i++) {
            move = lastStep[i];
            var node = move.to;

            for (n = 0; n < node.neighbours.length; n++) {
                if (has(checked, node.neighbours[n]))
                    continue;

                if (node.value !== node.neighbours[n].value)
                    continue;

                availableMoves.push({'from': node, 'to': node.neighbours[n]});
            }
        }

        if (availableMoves.length === 0) {
            if (checked.length === cluster.length) {
                if (cost < best.cost) {
                    best.steps = steps;
                    best.cost = cost;
                }
            }

            return;
        }

        var count = Math.pow(2, availableMoves.length);

        for (var c = 1; c < count; c++) {
            var step = [];
            var newChecked = checked.slice();
            for (i = 0; i < availableMoves.length; i++) {
                if ((c >> i) % 2 === 1) {
                    move = availableMoves[i];
                    // don't go to the same node twice from different origins
                    if (this.hasSameDestination(step, move))
                        continue;

                    newChecked.push(move.to);

                    step.push({'from': move.from, 'to': move.to});
                }
            }

            var newSteps = steps.slice();
            newSteps.push(step);

            this.calculateTrailPath(newSteps, newChecked, cluster, best);
        }
    }

    hasSameOrigin(step, move) {
        for (var i = 0; i < step.length; i++) {
            if (step[i] === move)
                continue;

            if (step[i].from === move.from)
                return true;
        }
        return false;
    }

    hasSameDestination(step, move) {
        for (var i = 0; i < step.length; i++) {
            if (step[i] === move)
                continue;

            if (step[i].to === move.to)
                return true;
        }
        return false;
    }

    calculateMoveCost(previousStep, step, move, progress, index) {
        if (move.from === move.to)
            return 0;
        else if (this.hasSameOrigin(step, move)) {
            if (index < 2)
                return 0;
            return 10 * (1 + progress);
        } else if (previousStep) {
            if (previousStep[0].from === previousStep[0].to)
                return 1;
            var previousDirection;
            for (var i = 0; i < previousStep.length; i++) {
                if (previousStep[i].to === move.from) {
                    previousDirection = DIRECTIONS[previousStep[i].from.index][previousStep[i].to.index];
                    break;
                }
            }

            if (previousDirection === undefined)
                throw new Error('Path direction error');

            var currentDirection = DIRECTIONS[move.from.index][move.to.index];

            var cost = CHANGE_DIRECTION_COST[previousDirection][currentDirection];

            if (cost === 1) // no change in direction
                return 1;
            else if (cost === 2) // slight turn
                return 2;
            else if (cost === 3) // hard turn
                return 6;
            else // go back
                return 4;

        } else
            return 0;
    }

    calculatePathCost(steps) {
        var sum = 0;

        for (var i = 0; i < steps.length; i++)
            for (var j = 0; j < steps[i].length; j++) {
                var cost = this.calculateMoveCost(steps[i - 1], steps[i], steps[i][j], i / steps.length, i) + 5 / steps[i].length;
                sum += cost;
                steps[i][j].cost = cost;
            }

        return sum;
    }

    calculateTrailPaths(cluster) {
        var steps = [];
        var step = [{'from': cluster[0], 'to': cluster[0]}];
        steps.push(step);
        var minPath = {
            'steps': null,
            'cost': Infinity
        };

        this.calculateTrailPath(steps, [cluster[0]], cluster, minPath);

        return minPath.steps;
    }

    calculateMultiplierPaths(cluster) {
        var steps = [];
        var multiplier = new Node(20, 0, 5);
        multiplier.value = 'red';
        multiplier.neighbours.push(this.nodes[18], this.nodes[19]);

        var step = [{'from': multiplier, 'to': multiplier}];
        steps.push(step);
        var minPath = {
            'steps': null,
            'cost': Infinity
        };

        this.calculateTrailPath(steps, [], cluster, minPath);

        return minPath.steps;
    }

    compressTrailPath(steps) {
        var output = [];
        for (var i = 1; i < steps.length; i++)
            for (var j = 0; j < steps[i].length; j++)
                output.push(this.getEdgeIndex(steps[i][j].from, steps[i][j].to));
        return output.join(',');
    }

    decompressTrailPath(str) {
        str = str.split(',');

        for (var s = 0; s < str.length; s++)
            str[s] = this.getEdge(str[s]);

        var output = [[{'from': str[0].from, 'to': str[0].from}]];
        var currentStep = output[0];

        for (var i = 0; i < str.length; i++) {
            var item = str[i];

            for (var j = 0; j < currentStep.length; j++) {
                if (currentStep[j].to === item.from) {
                    currentStep = [];
                    output.push(currentStep);
                    break;
                }
            }

            currentStep.push(item);
        }

        return output;
    }

    trailPathToCluster(steps) {
        var cluster = [];

        for (var i = 0; i < steps.length; i++)
            for (var j = 0; j < steps[i].length; j++) {
                var node = this.nodes[steps[i][j].from];
                if (!cluster.includes(node))
                    cluster.push(node);

                node = this.nodes[steps[i][j].to];
                if (!cluster.includes(node))
                    cluster.push(node);
            }

        cluster.sort(clusterSort);

        return cluster;
    }

    trailPathToCode(steps) {
        return this.clusterToCode(this.trailPathToCluster(steps));
    }

    clusterToCode(cluster) {
        var code = 0;
        for (var i = 0; i < cluster.length; i++)
            code += 1 << cluster[i].index;
        return code;
    }

    getEdgeIndex(from, to) {
        return edgeMap[from][to];
    }

    getEdge(index) {
        return edgeMapInverted[index];
    }

    getTrailForCode(code) {
        var trail = CLUSTER_TRAILS.get(code);

        if (!trail)
            throw new Error('Missing trail for cluster code: ' + code);

        return trail;
    }

    getTrailForCluster(cluster) {
        return this.getTrailForCode(this.clusterToCode(cluster));
    }

    getMultiplierTrailForCode(code) {
        var trail = MULTIPLIER_TRAILS.get(code);

        if (!trail)
            throw new Error('Missing multiplier trail for cluster code: ' + code);

        return trail;
    }

    getMultiplierTrailForCluster(cluster) {
        return this.getMultiplierTrailForCode(this.clusterToCode(cluster));
    }

    mirrorClusterCode(code) {
        var str = code.toString(2).padStart(20, 0);
        var array = str.split('');

        var row0 = array.slice(14, 20);
        var row1 = array.slice(9, 14);
        var row2 = array.slice(5, 9);
        var row3 = array.slice(2, 5);
        var row4 = array.slice(0, 2);

        return parseInt(row4.reverse().concat(row3.reverse(), row2.reverse(), row1.reverse(), row0.reverse()).join(''), 2);
    }

    mirrorTrail(trail) {
        var output = [];
        for (var i = 0; i < trail.length; i++) {
            output.push([]);
            for (var j = 0; j < trail[i].length; j++) {
                output[i].push({
                    'from': MIRROR_INDEX[trail[i][j].from],
                    'to': MIRROR_INDEX[trail[i][j].to]
                });
            }
        }

        return output;
    }

    separateTrails(trail) {
        var trails = [];

        for (var i = trail.length - 1; i > 0; i--) {
            var step = trail[i];

            for (var j = 0; j < step.length; j++) {
                var move = step[j];
                var found = false;

                for (var k = 0; k < trails.length; k++) {
                    if (trails[k].includes(move.to)) {
                        trails[k].push(move.from);
                        found = true;
                    }
                }

                if (!found)
                    trails.push([move.to, move.from]);
            }
        }

        for (i = 0; i < trails.length; i++)
            trails[i].reverse();

        return trails;
    }

    readClustersFromBinary(buffer) {
        const CONTROL_NUMBER = 128;

        var i, n;
        var trail, code, mirroredCode;

        const view = new Uint8Array(buffer);

        var numbers = [];
        for (i = 0; i < view.length; i++) {
            n = view[i];

            if (n < CONTROL_NUMBER)
                numbers.push(n);
            else {
                numbers.push(n & ~CONTROL_NUMBER);

                trail = this.decompressTrailPath(numbers.join(','));
                code = this.trailPathToCode(trail);
                mirroredCode = this.mirrorClusterCode(code);

                CLUSTER_TRAILS.set(code, trail);

                if (mirroredCode !== code) {
                    trail = this.mirrorTrail(trail);
                    CLUSTER_TRAILS.set(mirroredCode, trail);
                }

                numbers.length = 0;
            }
        }
    }

    readMultipliersFromBinary(buffer) {
        const CONTROL_NUMBER = 128;

        var i, n;
        var trail, code, mirroredCode, cluster;

        const view = new Uint8Array(buffer);

        var numbers = [];
        for (i = 0; i < view.length; i++) {
            n = view[i];

            if (n < CONTROL_NUMBER)
                numbers.push(n);
            else {
                numbers.push(n & ~CONTROL_NUMBER);

                trail = this.decompressTrailPath(numbers.join(','));

                cluster = this.trailPathToCluster(trail);

                cluster.length--;

                code = this.clusterToCode(cluster);
                mirroredCode = this.mirrorClusterCode(code);

                MULTIPLIER_TRAILS.set(code, trail);

                if (mirroredCode !== code) {
                    trail = this.mirrorTrail(trail);
                    MULTIPLIER_TRAILS.set(mirroredCode, trail);
                }

                numbers.length = 0;
            }
        }
    }

    draw() {
        var out = '';
        var x, y;
        for (y = this.rows.length - 1; y >= 0; y--) {
            for (x = 0; x < y; x++)
                out += '  ';
            for (x = 0; x < this.rows[y].length; x++) {
                out += this.rows[y][x].value.substring(0, 3) + ',';
            }

            out += '\n';
        }

        return out;
    }
}

const structure = new Structure();

var edgeMapCount = 0;
for (var i = 0; i < structure.nodes.length; i++) {
    var node = structure.nodes[i];
    if (!edgeMap[node.index])
        edgeMap[node.index] = {};

    for (var j = 0; j < node.neighbours.length; j++) {
        var n = node.neighbours[j];
        if (typeof edgeMap[node.index][n.index] == 'undefined') {
            edgeMap[node.index][n.index] = edgeMapCount;
            edgeMapInverted[edgeMapCount] = {'from': node.index, 'to': n.index};
            edgeMapCount++;
        }
    }
}

// special cases: going from top multipier to nodes from top row
edgeMap[20] = {};
edgeMap[20][18] = edgeMapCount;
edgeMapInverted[edgeMapCount] = {'from': 20, 'to': 18};
edgeMapCount++;
edgeMap[20][19] = edgeMapCount;
edgeMapInverted[edgeMapCount] = {'from': 20, 'to': 19};
edgeMapCount++;

module.exports = structure;
