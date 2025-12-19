// ============================================
// 몬차 서킷 (Autodromo Nazionale Monza) - Realistic Minimap Ver.
//  - 공식 트랙맵(2번째 이미지) 비율에 맞춘 미니맵
//  - centerPath / serverConfig.buildCenterPath 완전 동일 로직(불일치 방지)
//  - 연석(curbs) 위치 재배치 (트랙 가장자리로 더 붙임)
// ============================================

function buildMonzaCenterPath() {
  const points = [];
  const SEG = 28;

  function addStraight(x1, y1, x2, y2, s = 40) {
    for (let i = 0; i <= s; i++) {
      const t = i / s;
      points.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
  }

  function addCurve(p0, p1, p2, s = SEG) {
    for (let i = 0; i <= s; i++) {
      const t = i / s;
      const u = 1 - t;
      points.push({
        x: u*u*p0.x + 2*u*t*p1.x + t*t*p2.x,
        y: u*u*p0.y + 2*u*t*p1.y + t*t*p2.y,
      });
    }
  }

  // =========================
  // 1. Start / Finish (하단)
  // → 출발 방향: 오른쪽 → 왼쪽
  // =========================
  addStraight(5000, 3500, 1400, 3500, 90);

  // =========================
  // 2. 좌하단 큰 곡선 (Curva Grande 진입)
  // =========================
  addCurve(
    { x:1400, y:3500 },
    { x: 900, y:3450 },
    { x: 900, y:2700 }
  );

  // =========================
  // 3. 좌측 세로 Sector 2
  // =========================
  addStraight(900, 2700, 900, 1100, 60);

  // =========================
  // 4. 상단 짧은 꺾임 (06 → 07)
  // =========================
  addCurve(
    { x:900, y:1100 },
    { x:1000, y:800 },
    { x:1400, y:700 }
  );

  // =========================
  // 5. DRS Zone 1 (대각선 ↓)
  // =========================
  addStraight(1400, 700, 3000, 2000, 70);

  // =========================
  // 6. Ascari (짧은 꺾임)
  // =========================
  addStraight(3000, 2000, 3300, 2050, 12);
  addStraight(3300, 2050, 3500, 1950, 12);
  addStraight(3500, 1950, 3700, 2000, 12);

  // =========================
  // 7. Back Straight
  // =========================
  addStraight(3700, 2000, 5200, 2000, 70);

  // =========================
  // 8. Parabolica (큰 U자)
  // =========================
  addCurve(
    { x:5200, y:2000 },
    { x:5800, y:2200 },
    { x:5800, y:3000 }
  );
  addCurve(
    { x:5800, y:3000 },
    { x:5800, y:3600 },
    { x:5000, y:3500 }
  );

  return points;
};


const MonzaTrack = {
  name: '몬차 서킷',
  id: 'monza',
  width: 6000,
  height: 4000,

  centerPath: buildMonzaCenterPath(),

  trackWidth: 100,

  // 체크포인트: 트랙 경로를 따라 주요 지점에 배치
  checkpoints: [
    { x: 3200, y: 3500, angle: Math.PI },        // 메인 스트레이트 중간 (왼쪽 진행)
    { x: 1400, y: 3500, angle: Math.PI },        // Curva Grande 진입 전
    { x: 900, y: 3100, angle: -Math.PI / 2 },    // Curva Grande 중간
    { x: 900, y: 1900, angle: -Math.PI / 2 },    // 좌측 세로 구간 중간
    { x: 1200, y: 750, angle: Math.PI / 4 },     // 상단 꺾임 후
    { x: 2200, y: 1350, angle: -Math.PI / 4 },   // DRS Zone 중간
    { x: 3400, y: 2000, angle: 0 },               // Ascari 중간
    { x: 4500, y: 2000, angle: 0 },               // Back Straight 중간
    { x: 5500, y: 2500, angle: Math.PI / 2 },     // Parabolica 중간
  ],

  startLine: {
    x: 4800,
    y: 3500,
    width: 120,
    angle: Math.PI // ← 왼쪽
  },
  
  serverConfig: {
    buildCenterPath: buildMonzaCenterPath,
  
    spawnPositions: [
      { x: 4900, y: 3470 },
      { x: 4900, y: 3530 },
      { x: 5050, y: 3470 },
      { x: 5050, y: 3530 },
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
  // 연석(curbs): 트랙 경로에 맞게 배치
  // 트랙 폭 100px 기준, 중앙선에서 ±50px가 트랙 경계
  // 연석은 트랙 경계에서 약 5-10px 바깥쪽에 배치
  // type: 'left' = 트랙 왼쪽(바깥쪽), 'right' = 트랙 오른쪽(안쪽)
  // ============================================
  curbs: [
    // 1. 메인 스트레이트 중간 (y=3500, 왼쪽 진행 중)
    // 오른쪽 연석 (안쪽): y를 약간 작게
    { x: 3200, y: 3445, angle: Math.PI, width: 250, height: 14, type: 'right' },
    
    // 2. Curva Grande 진입부 (1400, 3500 근처)
    // 오른쪽 연석 (안쪽)
    { x: 1350, y: 3480, angle: Math.PI * 0.9, width: 120, height: 14, type: 'right' },
    
    // 3. Curva Grande 곡선 중간 (900, 3100 근처)
    // 왼쪽 연석 (바깥쪽): x를 약간 작게
    { x: 850, y: 3100, angle: -Math.PI / 2, width: 180, height: 14, type: 'left' },
    
    // 4. 좌측 세로 구간 중간 (900, 1900)
    // 왼쪽 연석 (바깥쪽): x를 약간 작게
    { x: 850, y: 1900, angle: -Math.PI / 2, width: 200, height: 14, type: 'left' },
    
    // 5. 상단 꺾임 곡선 (1200, 850 근처)
    // 오른쪽 연석 (안쪽)
    { x: 1250, y: 820, angle: Math.PI / 3, width: 140, height: 14, type: 'right' },
    
    // 6. DRS Zone 대각선 중간 (2200, 1350)
    // 오른쪽 연석 (안쪽)
    { x: 2200, y: 1320, angle: -Math.PI / 4, width: 180, height: 14, type: 'right' },
    
    // 7. Ascari 시케인 3단 (3000-3700, 2000)
    // 첫 번째: 왼쪽 연석
    { x: 3050, y: 2020, angle: 0, width: 100, height: 14, type: 'left' },
    // 두 번째: 오른쪽 연석
    { x: 3300, y: 2030, angle: 0, width: 120, height: 14, type: 'right' },
    // 세 번째: 왼쪽 연석
    { x: 3550, y: 1970, angle: 0, width: 100, height: 14, type: 'left' },
    
    // 8. Back Straight 중간 (4500, 2000)
    // 오른쪽 연석 (안쪽): y를 약간 작게
    { x: 4500, y: 1970, angle: 0, width: 250, height: 14, type: 'right' },
    
    // 9. Parabolica 진입부 (5200, 2000)
    // 오른쪽 연석 (안쪽)
    { x: 5150, y: 2020, angle: Math.PI / 6, width: 150, height: 14, type: 'right' },
    
    // 10. Parabolica 중간 (5800, 2800)
    // 왼쪽 연석 (바깥쪽): x를 약간 크게
    { x: 5750, y: 2800, angle: Math.PI / 2, width: 300, height: 14, type: 'left' },
    
    // 11. Parabolica 탈출부 (5500, 3400 근처)
    // 왼쪽 연석 (바깥쪽)
    { x: 5450, y: 3420, angle: Math.PI * 0.75, width: 200, height: 14, type: 'left' }
  ]
};

MonzaTrack.getSmoothPath = function () { return this.centerPath; };
if (typeof registerTrack === 'function') registerTrack('monza', MonzaTrack);
