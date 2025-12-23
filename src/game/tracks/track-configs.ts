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
  trackWidth: number; // 트랙 폭 (클라이언트와 동일)
}

// 기본 서킷 서버 설정
export const basicCircuitServerConfig: TrackServerConfig = {
  buildCenterPath: function() {
    const points: Array<{ x: number; y: number }> = [];
    const cx = 2250;
    const cy = 1500;
    const halfWidth = 2250;
    const halfHeight = 1500;
    const cornerRadius = 830;
    // 트랙 크기가 커졌으므로 샘플링 밀도 증가
    const segmentsPerCorner = 16;
    const segmentsPerStraight = 40;

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
      // 시작점과 끝점을 포함하여 더 많은 포인트 생성
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
  trackWidth: 120, // 트랙 폭 (모든 트랙에서 120으로 통일)
};

// 몬차 서킷 서버 설정 (클라이언트와 완전 동일)
export const monzaServerConfig: TrackServerConfig = {
  buildCenterPath: function() {
    const points: Array<{ x: number; y: number }> = [];
    const SEG = 40;

    const addStraight = (x1: number, y1: number, x2: number, y2: number, s = 30) => {
      for (let i = 0; i <= s; i++) {
        const t = i / s;
        points.push({
          x: x1 + (x2 - x1) * t,
          y: y1 + (y2 - y1) * t
        });
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
          y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
        });
      }
    };

    // Start/Finish 직선 (메인 스트레이트)
    addStraight(5200, 3400, 1900, 3400, 80);

    // [수정] 01, 02, 03: Rettifilo 시케인 & Curva Grande
    // 급격한 'ㄱ'자 시케인 구현
    addCurve(
      { x: 1900, y: 3400 },
      { x: 1700, y: 3400 },
      { x: 1650, y: 3100 }
    );
    // Curva Grande: 더 크고 완만하게
    addCurve(
      { x: 1650, y: 3100 },
      { x: 1700, y: 2500 },
      { x: 1200, y: 2000 }
    );

    // Roggia 진입 직선
    addStraight(1200, 2000, 1200, 1600, 30);

    // [수정] 04, 05: Variante della Roggia
    // 더 뚜렷한 S자 시케인
    addCurve(
      { x: 1200, y: 1600 },
      { x: 1050, y: 1400 },
      { x: 1250, y: 1300 }
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
      { x: 3500, y: 2300 },
      { x: 3700, y: 2150 }
    );
    addCurve(
      { x: 3700, y: 2150 },
      { x: 3800, y: 2000 },
      { x: 4000, y: 2000 }
    );

    // Back Straight (뒷 직선)
    addStraight(4000, 2000, 5200, 2000, 60);

    // 11. Curva Parabolica (11 코너) - 마지막 U턴
    addCurve(
      { x: 5200, y: 2000 },
      { x: 6000, y: 2200 },
      { x: 5900, y: 3000 }
    );
    // 피니시 라인으로 복귀
    addCurve(
      { x: 5900, y: 3000 },
      { x: 5800, y: 3400 },
      { x: 5200, y: 3400 }
    );

    return points;
  },
  spawnPositions: [
    { x: 4900, y: 3370 },
    { x: 4900, y: 3430 },
    { x: 5100, y: 3370 },
    { x: 5100, y: 3430 },
  ],
  spawnAngle: Math.PI, // ← 왼쪽 출발
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
    angle: Math.PI, // ← 왼쪽
  },
  trackWidth: 120, // 트랙 폭 (모든 트랙에서 120으로 통일)
};

// 새 트랙 서버 설정
export const newTrackServerConfig: TrackServerConfig = {
  buildCenterPath: function() {
    return [
      { x: 3970, y: 477 },
      { x: 3954, y: 1249 },
      { x: 3934, y: 2278 },
      { x: 3917, y: 2517 },
      { x: 3822, y: 2645 },
      { x: 3649, y: 2722 },
      { x: 3486, y: 2710 },
      { x: 3343, y: 2669 },
      { x: 3168, y: 2591 },
      { x: 2986, y: 2582 },
      { x: 2778, y: 2691 },
      { x: 2634, y: 2836 },
      { x: 2516, y: 2875 },
      { x: 2389, y: 2844 },
      { x: 2297, y: 2768 },
      { x: 2227, y: 2688 },
      { x: 2138, y: 2616 },
      { x: 2058, y: 2597 },
      { x: 1969, y: 2601 },
      { x: 1801, y: 2592 },
      { x: 1656, y: 2505 },
      { x: 1583, y: 2419 },
      { x: 1529, y: 2330 },
      { x: 1488, y: 2241 },
      { x: 1461, y: 2155 },
      { x: 1452, y: 2051 },
      { x: 1453, y: 1960 },
      { x: 1454, y: 1833 },
      { x: 1449, y: 399 },
      { x: 1695, y: 103 },
      { x: 2154, y: 116 },
      { x: 2350, y: 126 },
      { x: 2530, y: 131 },
      { x: 2626, y: 145 },
      { x: 2717, y: 166 },
      { x: 2797, y: 176 },
      { x: 2956, y: 216 }
    ];
  },
  spawnPositions: [
    { x: 3966, y: 719 }
  ],
  spawnAngle: 1.560,
  checkpoints: [
    { x: 3935, y: 2282, angle: 1.596 },
    { x: 3347, y: 2668, angle: -2.763 },
    { x: 2778, y: 2694, angle: 2.493 },
    { x: 1578, y: 2415, angle: -2.183 },
    { x: 1450, y: 401, angle: -1.574 },
    { x: 2534, y: 127, angle: 0.066 },
    { x: 3635, y: 332, angle: 0.256 }
  ],
  startLine: {
    x: 3963.364169486476,
    y: 797.1788222775224,
    angle: 1.592
  },
  trackWidth: 120
};

// 트랙별 서버 설정 맵
export const trackServerConfigs: Map<string, TrackServerConfig> = new Map([
  ['basic-circuit', basicCircuitServerConfig],
  ['monza', monzaServerConfig],
  ['new-track', newTrackServerConfig],
]);

