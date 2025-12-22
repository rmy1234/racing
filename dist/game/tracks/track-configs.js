"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackServerConfigs = exports.monzaServerConfig = exports.basicCircuitServerConfig = void 0;
exports.basicCircuitServerConfig = {
    buildCenterPath: function () {
        const points = [];
        const cx = 2250;
        const cy = 1500;
        const halfWidth = 2250;
        const halfHeight = 1500;
        const cornerRadius = 830;
        const segmentsPerCorner = 16;
        const segmentsPerStraight = 40;
        const addArc = (cxArc, cyArc, startAngle, endAngle) => {
            for (let i = 0; i <= segmentsPerCorner; i++) {
                const t = i / segmentsPerCorner;
                const angle = startAngle + (endAngle - startAngle) * t;
                points.push({
                    x: cxArc + Math.cos(angle) * cornerRadius,
                    y: cyArc + Math.sin(angle) * cornerRadius,
                });
            }
        };
        const addStraight = (x1, y1, x2, y2) => {
            for (let i = 0; i <= segmentsPerStraight; i++) {
                const t = i / segmentsPerStraight;
                points.push({
                    x: x1 + (x2 - x1) * t,
                    y: y1 + (y2 - y1) * t,
                });
            }
        };
        const blCx = cx - halfWidth + cornerRadius;
        const blCy = cy + halfHeight - cornerRadius;
        const tlCx = cx - halfWidth + cornerRadius;
        const tlCy = cy - halfHeight + cornerRadius;
        const trCx = cx + halfWidth - cornerRadius;
        const trCy = cy - halfHeight + cornerRadius;
        const brCx = cx + halfWidth - cornerRadius;
        const brCy = cy + halfHeight - cornerRadius;
        const blBottom = { x: blCx, y: blCy + cornerRadius };
        const blLeft = { x: blCx - cornerRadius, y: blCy };
        const tlLeft = { x: tlCx - cornerRadius, y: tlCy };
        const tlTop = { x: tlCx, y: tlCy - cornerRadius };
        const trTop = { x: trCx, y: trCy - cornerRadius };
        const trRight = { x: trCx + cornerRadius, y: trCy };
        const brRight = { x: brCx + cornerRadius, y: brCy };
        const brBottom = { x: brCx, y: brCy + cornerRadius };
        addArc(blCx, blCy, Math.PI / 2, Math.PI);
        addStraight(blLeft.x, blLeft.y, tlLeft.x, tlLeft.y);
        addArc(tlCx, tlCy, Math.PI, (3 * Math.PI) / 2);
        addStraight(tlTop.x, tlTop.y, trTop.x, trTop.y);
        addArc(trCx, trCy, (3 * Math.PI) / 2, 2 * Math.PI);
        addStraight(trRight.x, trRight.y, brRight.x, brRight.y);
        addArc(brCx, brCy, 0, Math.PI / 2);
        addStraight(brBottom.x, brBottom.y, blBottom.x, blBottom.y);
        return points;
    },
    spawnPositions: [
        { x: 2190, y: 2970 },
        { x: 2310, y: 2970 },
        { x: 2190, y: 2990 },
        { x: 2310, y: 2990 },
        { x: 2190, y: 3010 },
        { x: 2310, y: 3010 },
        { x: 2190, y: 3030 },
        { x: 2310, y: 3030 },
    ],
    spawnAngle: 0,
    checkpoints: [
        { x: 4204, y: 1636, angle: -Math.PI / 2 },
        { x: 2250, y: 205, angle: Math.PI },
        { x: 237, y: 1636, angle: Math.PI / 2 },
    ],
    startLine: {
        x: 2250,
        y: 3000,
        angle: 0,
    },
    trackWidth: 120,
};
exports.monzaServerConfig = {
    buildCenterPath: function () {
        const points = [];
        const SEG = 40;
        const addStraight = (x1, y1, x2, y2, s = 30) => {
            for (let i = 0; i <= s; i++) {
                const t = i / s;
                points.push({
                    x: x1 + (x2 - x1) * t,
                    y: y1 + (y2 - y1) * t
                });
            }
        };
        const addCurve = (p0, p1, p2, s = SEG) => {
            for (let i = 0; i <= s; i++) {
                const t = i / s;
                const u = 1 - t;
                points.push({
                    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
                    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
                });
            }
        };
        addStraight(5200, 3400, 1900, 3400, 80);
        addCurve({ x: 1900, y: 3400 }, { x: 1700, y: 3400 }, { x: 1650, y: 3100 });
        addCurve({ x: 1650, y: 3100 }, { x: 1700, y: 2500 }, { x: 1200, y: 2000 });
        addStraight(1200, 2000, 1200, 1600, 30);
        addCurve({ x: 1200, y: 1600 }, { x: 1050, y: 1400 }, { x: 1250, y: 1300 });
        addStraight(1250, 1300, 1350, 1000, 20);
        addCurve({ x: 1350, y: 1000 }, { x: 1400, y: 700 }, { x: 1700, y: 700 });
        addStraight(1700, 700, 1900, 700, 20);
        addCurve({ x: 1900, y: 700 }, { x: 2300, y: 700 }, { x: 2500, y: 1000 });
        addStraight(2500, 1000, 3400, 2000, 70);
        addCurve({ x: 3400, y: 2000 }, { x: 3500, y: 2300 }, { x: 3700, y: 2150 });
        addCurve({ x: 3700, y: 2150 }, { x: 3800, y: 2000 }, { x: 4000, y: 2000 });
        addStraight(4000, 2000, 5200, 2000, 60);
        addCurve({ x: 5200, y: 2000 }, { x: 6000, y: 2200 }, { x: 5900, y: 3000 });
        addCurve({ x: 5900, y: 3000 }, { x: 5800, y: 3400 }, { x: 5200, y: 3400 });
        return points;
    },
    spawnPositions: [
        { x: 4900, y: 3370 },
        { x: 4900, y: 3430 },
        { x: 5100, y: 3370 },
        { x: 5100, y: 3430 },
    ],
    spawnAngle: Math.PI,
    checkpoints: [
        { x: 3500, y: 3400, angle: Math.PI },
        { x: 1650, y: 3100, angle: -Math.PI / 2 },
        { x: 1200, y: 2000, angle: -Math.PI / 2 },
        { x: 1250, y: 1300, angle: -Math.PI / 4 },
        { x: 1700, y: 700, angle: 0 },
        { x: 2900, y: 1500, angle: Math.PI / 4 },
        { x: 4000, y: 2000, angle: 0 },
        { x: 4600, y: 2000, angle: 0 },
        { x: 5800, y: 2600, angle: Math.PI / 2 },
    ],
    startLine: {
        x: 5000,
        y: 3400,
        angle: Math.PI,
    },
    trackWidth: 120,
};
exports.trackServerConfigs = new Map([
    ['basic-circuit', exports.basicCircuitServerConfig],
    ['monza', exports.monzaServerConfig],
]);
//# sourceMappingURL=track-configs.js.map