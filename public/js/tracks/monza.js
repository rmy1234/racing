// ============================================
// 몬차 서킷 (Autodromo Nazionale Monza)
// ============================================
// 이탈리아 몬차, F1 이탈리아 그랑프리 개최지
// 특징: 긴 직선 구간, 빠른 코너, 시케인
const MonzaTrack = {
  name: '몬차 서킷',
  id: 'monza',
  width: 2800,
  height: 1800,
  
  // 트랙 중앙선 경로 (몬차 서킷 레이아웃)
  centerPath: (function () {
    const points = [];
    const segmentsPerCurve = 12;
    const segmentsPerStraight = 25;

    // 부드러운 곡선을 위한 헬퍼 함수
    function addArc(cx, cy, radius, startAngle, endAngle, segments = segmentsPerCurve) {
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = startAngle + (endAngle - startAngle) * t;
        points.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
        });
      }
    }

    function addStraight(x1, y1, x2, y2, segments = segmentsPerStraight) {
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        points.push({
          x: x1 + (x2 - x1) * t,
          y: y1 + (y2 - y1) * t,
        });
      }
    }

    // 베지어 곡선 헬퍼 (부드러운 S자 시케인용)
    function addBezier(p0, p1, p2, p3, segments = segmentsPerCurve) {
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const u = 1 - t;
        const x = u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x;
        const y = u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y;
        points.push({ x, y });
      }
    }

    // 몬차 서킷 레이아웃 (시계 방향으로 주행)
    // Start/Finish 라인 위치: 오른쪽 하단 직선

    // ===== 1. 메인 스트레이트 (Start/Finish) =====
    // 오른쪽에서 왼쪽으로 주행
    addStraight(2550, 1450, 900, 1450, 35);

    // ===== 2. Turn 1-2: Variante del Rettifilo (첫 번째 시케인) =====
    // 좌-우-좌 시케인
    addBezier(
      { x: 900, y: 1450 },
      { x: 750, y: 1450 },
      { x: 700, y: 1380 },
      { x: 700, y: 1320 },
      10
    );
    addBezier(
      { x: 700, y: 1320 },
      { x: 700, y: 1260 },
      { x: 750, y: 1200 },
      { x: 820, y: 1180 },
      10
    );

    // ===== 3. Turn 3: Curva Grande 방향으로 좌회전 =====
    addStraight(820, 1180, 650, 1100, 15);
    addArc(650, 950, 150, Math.PI / 2, Math.PI, 10);

    // ===== 4. 짧은 직선 (Turn 3 → Turn 4) =====
    addStraight(500, 950, 500, 700, 15);

    // ===== 5. Turn 4-5: Variante della Roggia (두 번째 시케인) =====
    addBezier(
      { x: 500, y: 700 },
      { x: 500, y: 620 },
      { x: 450, y: 560 },
      { x: 380, y: 540 },
      10
    );
    addBezier(
      { x: 380, y: 540 },
      { x: 310, y: 520 },
      { x: 280, y: 460 },
      { x: 300, y: 400 },
      10
    );

    // ===== 6. Turn 6: Curve di Lesmo 1 =====
    addStraight(300, 400, 350, 300, 10);
    addArc(500, 300, 150, Math.PI, Math.PI * 1.5, 12);

    // ===== 7. Turn 7: Curve di Lesmo 2 =====
    addStraight(500, 150, 700, 150, 10);
    addArc(700, 300, 150, -Math.PI / 2, 0, 12);

    // ===== 8. 백스트레이트 (Serraglio → Ascari) =====
    addStraight(850, 300, 1400, 500, 25);

    // ===== 9. Turn 8-9-10: Variante Ascari (아스카리 시케인) =====
    // 복잡한 S자 시케인
    addBezier(
      { x: 1400, y: 500 },
      { x: 1500, y: 540 },
      { x: 1550, y: 620 },
      { x: 1520, y: 700 },
      12
    );
    addBezier(
      { x: 1520, y: 700 },
      { x: 1490, y: 780 },
      { x: 1550, y: 860 },
      { x: 1650, y: 880 },
      12
    );
    addBezier(
      { x: 1650, y: 880 },
      { x: 1750, y: 900 },
      { x: 1800, y: 950 },
      { x: 1850, y: 1000 },
      10
    );

    // ===== 10. 짧은 직선 (Ascari → Parabolica) =====
    addStraight(1850, 1000, 2100, 1100, 15);

    // ===== 11. Turn 11: Curva Parabolica (파라볼리카) =====
    // 긴 우회전 곡선
    addArc(2100, 1350, 250, -Math.PI / 2, Math.PI / 6, 20);

    // ===== 12. 파라볼리카 출구 → 스타트/피니시 라인 =====
    addStraight(2317, 1475, 2550, 1450, 10);

    return points;
  })(),
  
  trackWidth: 100,  // 트랙 폭
  
  // 체크포인트 (시계 방향)
  checkpoints: [
    { x: 700, y: 1250, angle: -Math.PI / 2 },     // Turn 1-2 시케인 후
    { x: 500, y: 800, angle: -Math.PI / 2 },      // Turn 3 후
    { x: 350, y: 400, angle: -Math.PI / 4 },      // Turn 5 후
    { x: 700, y: 200, angle: 0 },                  // Lesmo 곡선 사이
    { x: 1200, y: 450, angle: Math.PI / 6 },      // 백스트레이트 중간
    { x: 1600, y: 800, angle: Math.PI / 2 },      // Ascari 시케인 중간
    { x: 2100, y: 1200, angle: Math.PI / 4 },     // Parabolica 중간
  ],
  
  // 시작 위치 (메인 스트레이트)
  startLine: {
    x: 2400,
    y: 1450,
    width: 100,
    angle: Math.PI  // 왼쪽 방향으로 출발
  },
  
  // 트랙 경계 생성 (중앙선에서 좌우로 확장)
  getTrackBounds() {
    const innerPath = [];
    const outerPath = [];
    
    for (let i = 0; i < this.centerPath.length; i++) {
      const curr = this.centerPath[i];
      const prev = this.centerPath[(i - 1 + this.centerPath.length) % this.centerPath.length];
      const next = this.centerPath[(i + 1) % this.centerPath.length];
      
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      const nx = -dy / len;
      const ny = dx / len;
      
      const halfWidth = this.trackWidth / 2;
      
      innerPath.push({
        x: curr.x + nx * halfWidth,
        y: curr.y + ny * halfWidth
      });
      
      outerPath.push({
        x: curr.x - nx * halfWidth,
        y: curr.y - ny * halfWidth
      });
    }
    
    return { innerPath, outerPath };
  },
  
  // 포인트가 트랙 위에 있는지 확인
  isOnTrack(x, y) {
    let minDist = Infinity;
    
    for (const point of this.centerPath) {
      const dx = x - point.x;
      const dy = y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      minDist = Math.min(minDist, dist);
    }
    
    return minDist < this.trackWidth / 2 + 10;
  },
  
  // 가장 가까운 체크포인트 인덱스 반환
  getNearestCheckpoint(x, y) {
    let minDist = Infinity;
    let nearestIdx = 0;
    
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      const dx = x - cp.x;
      const dy = y - cp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }
    
    return nearestIdx;
  },
  
  // 체크포인트 통과 확인
  checkCheckpoint(x, y, lastCheckpoint) {
    const checkpointRadius = 120;
    const nextCheckpoint = (lastCheckpoint + 1) % this.checkpoints.length;
    const cp = this.checkpoints[nextCheckpoint];
    
    const dx = x - cp.x;
    const dy = y - cp.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < checkpointRadius) {
      return nextCheckpoint;
    }
    
    return lastCheckpoint;
  },
  
  // 커브 데이터 (연석 위치)
  curbs: (function () {
    const curbs = [];
    const blockHeight = 18;
    
    // Turn 1-2 시케인 연석
    const chicane1Curbs = [
      { x: 760, y: 1400, width: 40, angle: -Math.PI / 4 },
      { x: 740, y: 1350, width: 40, angle: -Math.PI / 4 },
      { x: 720, y: 1300, width: 40, angle: -Math.PI / 4 },
      { x: 740, y: 1240, width: 40, angle: Math.PI / 4 },
      { x: 780, y: 1200, width: 40, angle: Math.PI / 4 },
    ];
    
    // Turn 4-5 시케인 연석
    const chicane2Curbs = [
      { x: 460, y: 660, width: 35, angle: -Math.PI / 4 },
      { x: 420, y: 600, width: 35, angle: -Math.PI / 3 },
      { x: 340, y: 540, width: 35, angle: -Math.PI / 6 },
      { x: 320, y: 480, width: 35, angle: Math.PI / 6 },
      { x: 330, y: 420, width: 35, angle: Math.PI / 4 },
    ];
    
    // Lesmo 곡선 연석
    const lesmoCurbs = [
      { x: 400, y: 350, width: 35, angle: Math.PI / 3 },
      { x: 450, y: 250, width: 35, angle: Math.PI / 2 },
      { x: 550, y: 180, width: 35, angle: 0 },
      { x: 650, y: 200, width: 35, angle: -Math.PI / 4 },
      { x: 750, y: 270, width: 35, angle: -Math.PI / 3 },
    ];
    
    // Ascari 시케인 연석
    const ascariCurbs = [
      { x: 1450, y: 550, width: 35, angle: Math.PI / 4 },
      { x: 1500, y: 650, width: 35, angle: Math.PI / 2 },
      { x: 1480, y: 750, width: 35, angle: Math.PI * 3/4 },
      { x: 1550, y: 850, width: 35, angle: Math.PI / 4 },
      { x: 1700, y: 890, width: 35, angle: 0 },
      { x: 1800, y: 950, width: 35, angle: Math.PI / 4 },
    ];
    
    // Parabolica 연석
    const parabolicaCurbs = [];
    for (let i = 0; i < 8; i++) {
      const angle = -Math.PI / 2 + (Math.PI * 2/3) * (i / 7);
      const radius = 210;
      const cx = 2100, cy = 1350;
      parabolicaCurbs.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        width: 35,
        angle: angle + Math.PI / 2,
      });
    }
    
    // 모든 연석 합치기
    const allCurbs = [...chicane1Curbs, ...chicane2Curbs, ...lesmoCurbs, ...ascariCurbs, ...parabolicaCurbs];
    
    for (const c of allCurbs) {
      curbs.push({
        x: c.x,
        y: c.y,
        width: c.width,
        height: blockHeight,
        angle: c.angle,
      });
    }
    
    return curbs;
  })()
};

// 몬차 트랙도 부드러운 경로 반환
MonzaTrack.getSmoothPath = function () {
  return this.centerPath;
};

// 트랙 등록 (registerTrack 함수가 정의되어 있는 경우)
if (typeof registerTrack === 'function') {
  registerTrack('monza', MonzaTrack);
}

