// ============================================
// 몬차 서킷 (Autodromo Nazionale Monza) - Realistic Corner Ver.
//  - 01, 02, 03 (Rettifilo & Curva Grande): 급격한 시케인 후 완만한 코너 구현
//  - 04, 05 (Roggia): 뚜렷한 S자 시케인으로 수정
//  - 08, 09, 10 (Ascari): 깊은 굴곡의 연속 S자 (물결 모양) 구현
// ============================================

function buildMonzaCenterPath() {
  const points = [];
  const SEG = 40;

  function addStraight(x1, y1, x2, y2, steps = 30) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: x1 + (x2 - x1) * t,
        y: y1 + (y2 - y1) * t
      });
    }
  }

  function addCurve(p0, p1, p2, steps = SEG) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      points.push({
        x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
      });
    }
  }

  // --- 트랙 구현 시작 (Start -> 01 -> ... -> 11) ---

  // Start/Finish 직선 (메인 스트레이트)
  addStraight(5200, 3400, 1900, 3400, 80);

  // [수정] 01, 02, 03: Rettifilo 시케인 & Curva Grande
  // 급격한 'ㄱ'자 시케인 구현
  addCurve(
    { x: 1900, y: 3400 }, // 진입
    { x: 1700, y: 3400 }, // 제어점 1 (직선 끝까지 유지)
    { x: 1650, y: 3100 }  // 탈출 (급격히 위로)
  );
  // Curva Grande: 더 크고 완만하게
  addCurve(
    { x: 1650, y: 3100 },
    { x: 1700, y: 2500 }, // 바깥으로 크게 돔
    { x: 1200, y: 2000 }  // 상단 진입점
  );

  // Roggia 진입 직선
  addStraight(1200, 2000, 1200, 1600, 30);

  // [수정] 04, 05: Variante della Roggia
  // 더 뚜렷한 S자 시케인
  addCurve(
    { x: 1200, y: 1600 },
    { x: 1050, y: 1400 }, // 안쪽으로 깊게 제어
    { x: 1250, y: 1300 }  // 바깥으로 탈출
  );

  // Lesmo 진입 짧은 직선
  addStraight(1250, 1300, 1350, 1000, 20);

  // 06, 07: Curve di Lesmo (기존 유지)
  addCurve(
    { x: 1350, y: 1000 },
    { x: 1400, y: 700 },
    { x: 1700, y: 700 }
  );
  addStraight(1700, 700, 1900, 700, 20);
  addCurve(
    { x: 1900, y: 700 },
    { x: 2300, y: 700 },
    { x: 2500, y: 1000 }
  );

  // 대각선 직선 (Serraglio)
  addStraight(2500, 1000, 3400, 2000, 70);

  // [수정] 08, 09, 10: Variante Ascari
  // 깊은 굴곡의 연속 S자 (물결 모양)
  addCurve(
    { x: 3400, y: 2000 },
    { x: 3500, y: 2300 }, // 첫 번째 깊은 굴곡 (아래로)
    { x: 3700, y: 2150 }  // 중간 지점
  );
  addCurve(
    { x: 3700, y: 2150 },
    { x: 3800, y: 2000 }, // 두 번째 굴곡 (위로 복귀)
    { x: 4000, y: 2000 }  // 탈출 (직선 라인 복귀)
  );

  // Back Straight (뒷 직선)
  addStraight(4000, 2000, 5200, 2000, 60);

  // 11: Curva Parabolica (기존 유지)
  addCurve(
    { x: 5200, y: 2000 },
    { x: 6000, y: 2200 },
    { x: 5900, y: 3000 }
  );
  addCurve(
    { x: 5900, y: 3000 },
    { x: 5800, y: 3400 },
    { x: 5200, y: 3400 }
  );

  return points;
}

const MonzaTrack = {
  name: '몬차 서킷',
  id: 'monza',
  width: 8000,
  height: 5000,

  centerPath: buildMonzaCenterPath(),

  trackWidth: 120,  // 트랙 폭 (모든 트랙에서 120으로 통일)

  // 체크포인트 (경로 변경에 맞춰 대략적인 위치 유지)
  checkpoints: [
    { x: 3500, y: 3400, angle: Math.PI },       // 메인 스트레이트
    { x: 1650, y: 3100, angle: -Math.PI/2 },    // 02번 탈출
    { x: 1200, y: 2000, angle: -Math.PI/2 },    // 03번 탈출
    { x: 1250, y: 1300, angle: -Math.PI/4 },    // 05번 탈출
    { x: 1700, y: 700,  angle: 0 },             // Lesmo 사이
    { x: 2900, y: 1500, angle: Math.PI/4 },     // 대각선 중간
    { x: 4000, y: 2000, angle: 0 },             // 10번(Ascari) 탈출
    { x: 4600, y: 2000, angle: 0 },             // Back Straight
    { x: 5800, y: 2600, angle: Math.PI/2 },     // Parabolica 중간
  ],

  startLine: {
    x: 5000,
    y: 3400,
    width: 120,  // 트랙 폭과 동일
    angle: Math.PI
  },
  
  serverConfig: {
    buildCenterPath: buildMonzaCenterPath,
  
    spawnPositions: [
      { x: 4900, y: 3370 },
      { x: 4900, y: 3430 },
      { x: 5100, y: 3370 },
      { x: 5100, y: 3430 },
    ],
  
    spawnAngle: Math.PI 
  },
  
  // (기존 로직 유지)
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
    return minDist < this.trackWidth / 2 + 20;
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
    const checkpointRadius = 300;
    const nextCheckpoint = (lastCheckpoint + 1) % this.checkpoints.length;
    const cp = this.checkpoints[nextCheckpoint];
    const dx = x - cp.x;
    const dy = y - cp.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < checkpointRadius) return nextCheckpoint;
    return lastCheckpoint;
  },

  curbs: [] 
};

MonzaTrack.getSmoothPath = function () { return this.centerPath; };
if (typeof registerTrack === 'function') registerTrack('monza', MonzaTrack);