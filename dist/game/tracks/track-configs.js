"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackServerConfigs = exports.monzaServerConfig = exports.basicCircuitServerConfig = void 0;
exports.basicCircuitServerConfig = {
    buildCenterPath: function () {
        const points = [];
        const cx = 1200;
        const cy = 800;
        const halfWidth = 760;
        const halfHeight = 440;
        const cornerRadius = 280;
        const segmentsPerCorner = 8;
        const segmentsPerStraight = 20;
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
            for (let i = 1; i < segmentsPerStraight; i++) {
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
        { x: 1140, y: 1280 },
        { x: 1220, y: 1280 },
        { x: 1140, y: 1350 },
        { x: 1220, y: 1350 },
        { x: 1140, y: 1420 },
        { x: 1220, y: 1420 },
        { x: 1140, y: 1490 },
        { x: 1220, y: 1490 },
    ],
    spawnAngle: 0,
    checkpoints: [
        { x: 1860, y: 840, angle: -Math.PI / 2 },
        { x: 1200, y: 420, angle: Math.PI },
        { x: 520, y: 840, angle: Math.PI / 2 },
    ],
    startLine: {
        x: 1200,
        y: 1240,
        angle: 0,
    },
};
exports.monzaServerConfig = {
    buildCenterPath: function () {
        const points = [];
        const SEG = 36;
        const addStraight = (x1, y1, x2, y2, s = 40) => {
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
        addStraight(5000, 3500, 1400, 3500, 90);
        addCurve({ x: 1400, y: 3500 }, { x: 900, y: 3400 }, { x: 900, y: 2700 });
        addStraight(900, 2700, 900, 1100, 70);
        addCurve({ x: 900, y: 1100 }, { x: 1050, y: 800 }, { x: 1400, y: 700 });
        addStraight(1400, 700, 2800, 1800, 80);
        addCurve({ x: 2800, y: 1800 }, { x: 3200, y: 2200 }, { x: 3600, y: 2000 });
        addStraight(3600, 2000, 5200, 2000, 80);
        addCurve({ x: 5200, y: 2000 }, { x: 5900, y: 2400 }, { x: 5800, y: 3200 });
        addCurve({ x: 5800, y: 3200 }, { x: 5600, y: 3700 }, { x: 5000, y: 3500 });
        return points;
    },
    spawnPositions: [
        { x: 4900, y: 3470 },
        { x: 4900, y: 3530 },
        { x: 5100, y: 3470 },
        { x: 5100, y: 3530 },
    ],
    spawnAngle: Math.PI,
    checkpoints: [
        { x: 3200, y: 3500, angle: Math.PI },
        { x: 1400, y: 3500, angle: Math.PI },
        { x: 900, y: 3100, angle: -Math.PI / 2 },
        { x: 900, y: 1900, angle: -Math.PI / 2 },
        { x: 1200, y: 800, angle: Math.PI / 4 },
        { x: 2100, y: 1250, angle: -Math.PI / 4 },
        { x: 3200, y: 2000, angle: 0 },
        { x: 4400, y: 2000, angle: 0 },
        { x: 5600, y: 2800, angle: Math.PI / 2 },
    ],
    startLine: {
        x: 5000,
        y: 3500,
        angle: Math.PI,
    },
};
exports.trackServerConfigs = new Map([
    ['basic-circuit', exports.basicCircuitServerConfig],
    ['monza', exports.monzaServerConfig],
]);
//# sourceMappingURL=track-configs.js.map