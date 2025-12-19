// ============================================
// 몬차 서킷 (Autodromo Nazionale Monza) - Realistic Minimap Ver.
//  - 공식 트랙맵(2번째 이미지) 비율에 맞춘 미니맵
//  - centerPath / serverConfig.buildCenterPath 완전 동일 로직(불일치 방지)
//  - 연석(curbs) 위치 재배치 (트랙 가장자리로 더 붙임)
// ============================================

function buildMonzaCenterPath() {
  const points = [];
  const SEG = 36;

  function addStraight(x1, y1, x2, y2, s = 40) {
    for (let i = 0; i <= s; i++) {
      const t = i / s;
      points.push({
        x: x1 + (x2 - x1) * t,
        y: y1 + (y2 - y1) * t
      });
    }
  }

  function addCurve(p0, p1, p2, s = SEG) {
    for (let i = 0; i <= s; i++) {
      const t = i / s;
      const u = 1 - t;
      points.push({
        x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
      });
    }
  }

  // 1. Start / Finish
  addStraight(5000, 3500, 1400, 3500, 90);

  // 2. Curva Grande
  addCurve(
    { x: 1400, y: 3500 },
    { x: 900, y: 3400 },
    { x: 900, y: 2700 }
  );

  // 3. Sector 2 straight
  addStraight(900, 2700, 900, 1100, 70);

  // 4. 상단 자연스러운 코너
  addCurve(
    { x: 900, y: 1100 },
    { x: 1050, y: 800 },
    { x: 1400, y: 700 }
  );

  // 5. DRS Zone (완만한 대각)
  addStraight(1400, 700, 2800, 1800, 80);

  // 6. Ascari – ★ 진짜 곡선 ★
  addCurve(
    { x: 2800, y: 1800 },
    { x: 3200, y: 2200 },
    { x: 3600, y: 2000 }
  );

  // 7. Back Straight
  addStraight(3600, 2000, 5200, 2000, 80);

  // 8. Parabolica
  addCurve(
    { x: 5200, y: 2000 },
    { x: 5900, y: 2400 },
    { x: 5800, y: 3200 }
  );
  addCurve(
    { x: 5800, y: 3200 },
    { x: 5600, y: 3700 },
    { x: 5000, y: 3500 }
  );

  return points;
}



const MonzaTrack = {
  name: '몬차 서킷',
  id: 'monza',
  width: 6000,
  height: 4000,

  centerPath: buildMonzaCenterPath(),

  trackWidth: 100,

  // 체크포인트: 새로운 경로에 맞게 재배치
  checkpoints: [
    { x: 3200, y: 3500, angle: Math.PI },        // 메인 스트레이트 중간 (왼쪽 진행)
    { x: 1400, y: 3500, angle: Math.PI },        // Curva Grande 진입 전
    { x: 900, y: 3100, angle: -Math.PI / 2 },    // Curva Grande 중간
    { x: 900, y: 1900, angle: -Math.PI / 2 },    // 좌측 세로 구간 중간
    { x: 1200, y: 800, angle: Math.PI / 4 },      // 상단 코너 중간
    { x: 2100, y: 1250, angle: -Math.PI / 4 },   // DRS Zone 중간
    { x: 3200, y: 2000, angle: 0 },               // Ascari 중간
    { x: 4400, y: 2000, angle: 0 },              // Back Straight 중간
    { x: 5600, y: 2800, angle: Math.PI / 2 },    // Parabolica 중간
  ],

  startLine: {
    x: 5000,
    y: 3500,
    width: 120,
    angle: Math.PI // ← 왼쪽
  },
  
  serverConfig: {
    buildCenterPath: buildMonzaCenterPath,
  
    spawnPositions: [
      { x: 4900, y: 3470 },
      { x: 4900, y: 3530 },
      { x: 5100, y: 3470 },
      { x: 5100, y: 3530 },
    ],
  
    spawnAngle: Math.PI // ← 왼쪽 출발
  },
  

  getTrackBounds() {
    const innerPath = [];
    const outerPath = [];

    for (let i = 0; i < this.centerPath.length; i++) {
      const curr = this.centerPath[i];
      const prev = this.centerPath[(i - 1 + this.centerPath.length) % this.centerPath.length];
      const next = this.centerPath[(i + 1) % this.centerPath.length];

      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;

      const nx = -dy / len;
      const ny = dx / len;

      const halfWidth = this.trackWidth / 2;

      innerPath.push({ x: curr.x + nx * halfWidth, y: curr.y + ny * halfWidth });
      outerPath.push({ x: curr.x - nx * halfWidth, y: curr.y - ny * halfWidth });
    }
    return { innerPath, outerPath };
  },

  isOnTrack(x, y) {
    let minDist = Infinity;
    for (const p of this.centerPath) {
      const dx = x - p.x;
      const dy = y - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) minDist = d;
    }
    return minDist < this.trackWidth / 2 + 15;
  },

  getNearestCheckpoint(x, y) {
    let minDist = Infinity;
    let nearestIdx = 0;
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      const dx = x - cp.x;
      const dy = y - cp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; nearestIdx = i; }
    }
    return nearestIdx;
  },

  checkCheckpoint(x, y, lastCheckpoint) {
    const checkpointRadius = 260;
    const nextCheckpoint = (lastCheckpoint + 1) % this.checkpoints.length;
    const cp = this.checkpoints[nextCheckpoint];
    const dx = x - cp.x;
    const dy = y - cp.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < checkpointRadius) return nextCheckpoint;
    return lastCheckpoint;
  },

  // ============================================
  // 연석(curbs): 트랙 전체를 따라 연속적으로 배치
  // ============================================
// ============================================
// 연석(curbs): 실제 F1 서킷 방식
//  - 곡선 구간에만 배치
//  - 코너 안쪽에만 생성
//  - Monza 스타일 (짧고 연속적인 연석)
// ============================================
curbs: (function () {
  const curbs = [];
  const path = buildMonzaCenterPath();

  const trackWidth = 100;
  const halfWidth = trackWidth / 2;
  const curbOffset = 6;

  const CURVE_THRESHOLD = 0.06;
  const STEP = 2;

  function curvature(p0, p1, p2) {
    const v1x = p1.x - p0.x;
    const v1y = p1.y - p0.y;
    const v2x = p2.x - p1.x;
    const v2y = p2.y - p1.y;

    const dot = v1x * v2x + v1y * v2y;
    const len = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
    return Math.acos(dot / (len + 0.0001));
  }

  for (let i = 2; i < path.length - 2; i += STEP) {
    const p0 = path[i - 1];
    const p1 = path[i];
    const p2 = path[i + 1];

    if (curvature(p0, p1, p2) < CURVE_THRESHOLD) continue;

    // 평균 접선
    const dx = p2.x - p0.x;
    const dy = p2.y - p0.y;
    const len = Math.hypot(dx, dy) || 1;

    const tx = dx / len;
    const ty = dy / len;

    // 외적으로 안쪽 판별
    const cross =
      (p1.x - p0.x) * (p2.y - p1.y) -
      (p1.y - p0.y) * (p2.x - p1.x);

    const nx = cross > 0 ? -ty : ty;
    const ny = cross > 0 ? tx : -tx;

    curbs.push({
      x: p1.x + nx * (halfWidth + curbOffset),
      y: p1.y + ny * (halfWidth + curbOffset),
      width: 14,
      height: 6,
      angle: Math.atan2(ty, tx),
      type: 'curb'
    });
  }

  return curbs;
})()


};

MonzaTrack.getSmoothPath = function () { return this.centerPath; };
if (typeof registerTrack === 'function') registerTrack('monza', MonzaTrack);
