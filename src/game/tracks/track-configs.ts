// ============================================
// 트랙별 서버 측 설정
// ============================================
// ⚠️ 중요: 새로운 트랙을 추가할 때는 이 파일도 함께 수정해야 합니다!
// 
// 클라이언트 트랙 파일 (public/js/tracks/*.js)의 serverConfig와 동기화 필요
// 
// 트랙 추가 방법:
// 1. public/js/tracks/[track-id].js 파일 생성
// 2. 이 파일에 trackServerConfigs Map에 새 트랙 추가
// 3. track.js의 TRACKS 객체에 새 트랙 등록
// ============================================

export interface TrackServerConfig {
  buildCenterPath: () => Array<{ x: number; y: number }>;
  spawnPositions: Array<{ x: number; y: number }>;
  spawnAngle: number;
  checkpoints: Array<{ x: number; y: number; angle: number }>;
  startLine: { x: number; y: number; angle: number };
}

// 기본 서킷 서버 설정
export const basicCircuitServerConfig: TrackServerConfig = {
  buildCenterPath: function() {
    const points: Array<{ x: number; y: number }> = [];
    const cx = 1200;
    const cy = 800;
    const halfWidth = 760;
    const halfHeight = 440;
    const cornerRadius = 280;
    const segmentsPerCorner = 8;
    const segmentsPerStraight = 20;

    const addArc = (cxArc: number, cyArc: number, startAngle: number, endAngle: number) => {
      for (let i = 0; i <= segmentsPerCorner; i++) {
        const t = i / segmentsPerCorner;
        const angle = startAngle + (endAngle - startAngle) * t;
        points.push({
          x: cxArc + Math.cos(angle) * cornerRadius,
          y: cyArc + Math.sin(angle) * cornerRadius,
        });
      }
    };

    const addStraight = (x1: number, y1: number, x2: number, y2: number) => {
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

// 몬차 서킷 서버 설정 (클라이언트와 완전 동일)
export const monzaServerConfig: TrackServerConfig = {
  buildCenterPath: function() {
    const points: Array<{ x: number; y: number }> = [];
    const SEG = 28;

    const addStraight = (x1: number, y1: number, x2: number, y2: number, s = 40) => {
      for (let i = 0; i <= s; i++) {
        const t = i / s;
        points.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
      }
    };

    const addCurve = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      s = SEG,
    ) => {
      for (let i = 0; i <= s; i++) {
        const t = i / s;
        const u = 1 - t;
        points.push({
          x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
          y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
        });
      }
    };

    // =========================
    // 1. Start / Finish (하단)
    // → 출발 방향: 오른쪽 → 왼쪽
    // =========================
    addStraight(5000, 3500, 1400, 3500, 90);

    // =========================
    // 2. 좌하단 큰 곡선 (Curva Grande 진입)
    // =========================
    addCurve(
      { x: 1400, y: 3500 },
      { x: 900, y: 3450 },
      { x: 900, y: 2700 }
    );

    // =========================
    // 3. 좌측 세로 Sector 2
    // =========================
    addStraight(900, 2700, 900, 1100, 60);

    // =========================
    // 4. 상단 짧은 꺾임 (06 → 07)
    // =========================
    addCurve(
      { x: 900, y: 1100 },
      { x: 1000, y: 800 },
      { x: 1400, y: 700 }
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
      { x: 5200, y: 2000 },
      { x: 5800, y: 2200 },
      { x: 5800, y: 3000 }
    );
    addCurve(
      { x: 5800, y: 3000 },
      { x: 5800, y: 3600 },
      { x: 5000, y: 3500 }
    );

    return points;
  },
  spawnPositions: [
    { x: 4900, y: 3470 },
    { x: 4900, y: 3530 },
    { x: 5050, y: 3470 },
    { x: 5050, y: 3530 },
  ],
  spawnAngle: Math.PI, // ← 왼쪽 출발
  checkpoints: [
    { x: 3200, y: 3500, angle: Math.PI },
    { x: 1400, y: 3500, angle: Math.PI },
    { x: 900, y: 3100, angle: -Math.PI / 2 },
    { x: 900, y: 1900, angle: -Math.PI / 2 },
    { x: 1200, y: 750, angle: Math.PI / 4 },
    { x: 2200, y: 1350, angle: -Math.PI / 4 },
    { x: 3400, y: 2000, angle: 0 },
    { x: 4500, y: 2000, angle: 0 },
    { x: 5500, y: 2500, angle: Math.PI / 2 },
  ],
  startLine: {
    x: 4800,
    y: 3500,
    angle: Math.PI, // ← 왼쪽
  },
};

// 트랙별 서버 설정 맵
export const trackServerConfigs: Map<string, TrackServerConfig> = new Map([
  ['basic-circuit', basicCircuitServerConfig],
  ['monza', monzaServerConfig],
]);

