"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monzaSharedConfig = void 0;
exports.buildMonzaCenterPath = buildMonzaCenterPath;
function buildMonzaCenterPath() {
    const points = [];
    const SEG = 40;
    const addStraight = (x1, y1, x2, y2, steps = 30) => {
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: x1 + (x2 - x1) * t,
                y: y1 + (y2 - y1) * t
            });
        }
    };
    const addCurve = (p0, p1, p2, steps = SEG) => {
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const u = 1 - t;
            points.push({
                x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
                y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
            });
        }
    };
    addStraight(5200, 3400, 1800, 3400, 80);
    addCurve({ x: 1800, y: 3400 }, { x: 1400, y: 3400 }, { x: 1500, y: 3100 });
    addCurve({ x: 1500, y: 3100 }, { x: 1600, y: 2400 }, { x: 1200, y: 1900 });
    addStraight(1200, 1900, 1200, 1500, 40);
    addCurve({ x: 1200, y: 1500 }, { x: 1100, y: 1350 }, { x: 1300, y: 1200 });
    addStraight(1300, 1200, 1350, 1000, 20);
    addCurve({ x: 1350, y: 1000 }, { x: 1400, y: 700 }, { x: 1700, y: 700 });
    addStraight(1700, 700, 1900, 700, 20);
    addCurve({ x: 1900, y: 700 }, { x: 2300, y: 700 }, { x: 2500, y: 1000 });
    addStraight(2500, 1000, 3400, 2000, 70);
    addCurve({ x: 3400, y: 2000 }, { x: 3600, y: 2200 }, { x: 3800, y: 2000 });
    addStraight(3800, 2000, 5200, 2000, 80);
    addCurve({ x: 5200, y: 2000 }, { x: 6000, y: 2200 }, { x: 5900, y: 3000 });
    addCurve({ x: 5900, y: 3000 }, { x: 5800, y: 3400 }, { x: 5200, y: 3400 });
    return points;
}
exports.monzaSharedConfig = {
    buildCenterPath: buildMonzaCenterPath,
    spawnPositions: [
        { x: 4900, y: 3370 },
        { x: 4900, y: 3430 },
        { x: 5100, y: 3370 },
        { x: 5100, y: 3430 },
    ],
    spawnAngle: Math.PI,
    checkpoints: [
        { x: 3500, y: 3400, angle: Math.PI },
        { x: 1500, y: 3100, angle: -Math.PI / 2 },
        { x: 1300, y: 2000, angle: -Math.PI / 2 },
        { x: 1300, y: 1200, angle: -Math.PI / 4 },
        { x: 1700, y: 700, angle: 0 },
        { x: 2900, y: 1500, angle: Math.PI / 4 },
        { x: 3800, y: 2000, angle: 0 },
        { x: 4500, y: 2000, angle: 0 },
        { x: 5800, y: 2600, angle: Math.PI / 2 },
    ],
    startLine: {
        x: 5000,
        y: 3400,
        angle: Math.PI,
    },
};
//# sourceMappingURL=monza-shared.js.map