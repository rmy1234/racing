// ============================================
// 라운드 사각형 서킷 트랙 데이터
// ============================================
// 단순한 둥근 사각형 형태의 트랙
// 
// ⚠️ 이 트랙을 수정할 때는 src/game/tracks/track-configs.ts의 basicCircuitServerConfig도
//    함께 수정해야 서버 측 트랙 판정이 올바르게 작동합니다!
// ============================================
const BasicCircuitTrack = {
  name: '기본 서킷',
  id: 'basic-circuit',
  width: 4500,
  height: 3000,
  
  // 트랙 중앙선 경로 (수학적으로 정의된 둥근 사각형)
  // 전체 캔버스 기준으로 거의 완전한 직사각형 + 둥근 코너
  centerPath: (function () {
    const cx = 2250;
    const cy = 1500;
    const halfWidth = 2250;
    const halfHeight = 1500;
    const cornerRadius = 830;

    const points = [];

    // 각 코너를 작은 호(arc)와 직선 구간으로 구성 (좌하단 → 좌상단 → 우상단 → 우하단 → 좌하단)
    // 트랙 크기가 커졌으므로 샘플링 밀도 증가
    const segmentsPerCorner = 16;
    const segmentsPerStraight = 40;

    function addArc(cxArc, cyArc, startAngle, endAngle) {
      for (let i = 0; i <= segmentsPerCorner; i++) {
        const t = i / segmentsPerCorner;
        const angle = startAngle + (endAngle - startAngle) * t;
        points.push({
          x: cxArc + Math.cos(angle) * cornerRadius,
          y: cyArc + Math.sin(angle) * cornerRadius,
        });
      }
    }

    function addStraight(x1, y1, x2, y2) {
      // 시작점과 끝점을 포함하여 더 많은 포인트 생성
      for (let i = 0; i <= segmentsPerStraight; i++) {
        const t = i / segmentsPerStraight;
        points.push({
          x: x1 + (x2 - x1) * t,
          y: y1 + (y2 - y1) * t,
        });
      }
    }

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

    // 좌하단 코너 (하단 → 좌측)
    addArc(blCx, blCy, Math.PI / 2, Math.PI);
    // 좌측 직선
    addStraight(blLeft.x, blLeft.y, tlLeft.x, tlLeft.y);

    // 좌상단 코너 (좌측 → 상단)
    addArc(tlCx, tlCy, Math.PI, (3 * Math.PI) / 2);
    // 상단 직선
    addStraight(tlTop.x, tlTop.y, trTop.x, trTop.y);

    // 우상단 코너 (상단 → 우측)
    addArc(trCx, trCy, (3 * Math.PI) / 2, 2 * Math.PI);
    // 우측 직선
    addStraight(trRight.x, trRight.y, brRight.x, brRight.y);

    // 우하단 코너 (우측 → 하단)
    addArc(brCx, brCy, 0, Math.PI / 2);
    // 하단 직선
    addStraight(brBottom.x, brBottom.y, blBottom.x, blBottom.y);

    return points;
  })(),
  
  trackWidth: 120,  // 트랙 폭 (모든 트랙에서 120으로 통일)
  
  // 체크포인트 (시계 방향, 하단 스타트 구간은 제외)
  // 차량이 시계 방향(오른쪽으로 출발)으로 달린다고 가정하고
  // 우측 → 상단 → 좌측 순서로 통과하도록 설정
  checkpoints: [
    { x: 4204, y: 1636, angle: -Math.PI / 2 },   // 우측 중앙 (↑)
    { x: 2250, y: 205, angle: Math.PI },        // 상단 중앙 (←)
    { x: 237, y: 1636, angle: Math.PI / 2 },    // 좌측 중앙 (↓)
  ],
  
  // 시작 위치
  startLine: {
    x: 2250,
    // 트랙 하단 중앙선 위치 (centerPath 하단 y ≈ 3000)에 맞춤
    y: 3000,
    // 트랙 폭과 동일하게
    width: 120,
    angle: 0
  },

  // ============================================
  // 서버 측 데이터 (game.service.ts에서 사용)
  // ============================================
  serverConfig: {
    // 서버 측 경로 생성 함수 (클라이언트 centerPath와 동일한 로직)
    buildCenterPath: function() {
      const points = [];
      const cx = 2250;
      const cy = 1500;
      const halfWidth = 2250;
      const halfHeight = 1500;
      const cornerRadius = 830;
      const segmentsPerCorner = 8;
      const segmentsPerStraight = 20;

      function addArc(cxArc, cyArc, startAngle, endAngle) {
        for (let i = 0; i <= segmentsPerCorner; i++) {
          const t = i / segmentsPerCorner;
          const angle = startAngle + (endAngle - startAngle) * t;
          points.push({
            x: cxArc + Math.cos(angle) * cornerRadius,
            y: cyArc + Math.sin(angle) * cornerRadius,
          });
        }
      }

      function addStraight(x1, y1, x2, y2) {
        for (let i = 1; i < segmentsPerStraight; i++) {
          const t = i / segmentsPerStraight;
          points.push({
            x: x1 + (x2 - x1) * t,
            y: y1 + (y2 - y1) * t,
          });
        }
      }

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

    // 스폰 위치 (8개 그리드) - startLine(y=3000) 근처에 배치
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

    // 초기 각도
    spawnAngle: 0
  },
  
  // 트랙 경계 생성 (중앙선에서 좌우로 확장)
  getTrackBounds() {
    const innerPath = [];
    const outerPath = [];
    
    for (let i = 0; i < this.centerPath.length; i++) {
      const curr = this.centerPath[i];
      const prev = this.centerPath[(i - 1 + this.centerPath.length) % this.centerPath.length];
      const next = this.centerPath[(i + 1) % this.centerPath.length];
      
      // 방향 벡터 계산
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      // 법선 벡터 (좌우)
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
    // 간단한 구현: 중앙선과의 거리 체크
    let minDist = Infinity;
    
    for (const point of this.centerPath) {
      const dx = x - point.x;
      const dy = y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      minDist = Math.min(minDist, dist);
    }
    
    return minDist < this.trackWidth / 2 + 50; // 트랙 크기에 맞게 여유 증가
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
    const checkpointRadius = 360; // 트랙 크기에 맞게 증가 (원래 120 * 3)
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
  
  // 커브 데이터 (연석 위치) - 트랙 안쪽 라인을 따라 부드럽게 배치
  curbs: (function () {
    const curbs = [];

    const cx = 2250;
    const cy = 1500;
    const halfWidth = 2250;
    const halfHeight = 1500;
    const cornerRadius = 830;
    const trackWidth = 120;

    const curbOffset = 8; // 중앙선에서 안쪽으로 더 들어가도록
    const innerRadius = cornerRadius - trackWidth / 2 - curbOffset;

    const blockHeight = 20; // 연석 두께 (트랙 크기에 맞게 증가)
    const blocksPerCorner = 10; // 코너당 연석 개수 증가 (큰 트랙에 맞게)

    function addCornerCurbs(cxArc, cyArc, startAngle, endAngle) {
      const totalAngle = endAngle - startAngle;

      for (let i = 0; i < blocksPerCorner; i++) {
        const tCenter = (i + 0.5) / blocksPerCorner;
        const angle = startAngle + totalAngle * tCenter;

        const x = cxArc + Math.cos(angle) * innerRadius;
        const y = cyArc + Math.sin(angle) * innerRadius;

        // 해당 블록이 담당하는 호 길이에 비례해서 가로 길이 결정
        const segmentAngle = totalAngle / blocksPerCorner;
        const arcLength = innerRadius * segmentAngle;
        const width = arcLength * 1.05;

        // 진행 방향에 따른 접선 각도 (차량 진행 방향과 정렬)
        const tangentAngle = angle + Math.PI / 2;

        curbs.push({
          x,
          y,
          width,
          height: blockHeight,
          angle: tangentAngle,
        });
      }
    }

    const blCx = cx - halfWidth + cornerRadius;
    const blCy = cy + halfHeight - cornerRadius;
    const tlCx = cx - halfWidth + cornerRadius;
    const tlCy = cy - halfHeight + cornerRadius;
    const trCx = cx + halfWidth - cornerRadius;
    const trCy = cy - halfHeight + cornerRadius;
    const brCx = cx + halfWidth - cornerRadius;
    const brCy = cy + halfHeight - cornerRadius;

    // 각 코너 안쪽에 연석 배치 (입·출구 쪽은 약간 여유를 두고)
    const margin = 0.15 * (Math.PI / 2);
    addCornerCurbs(
      blCx,
      blCy,
      Math.PI / 2 + margin,
      Math.PI - margin,
    ); // 좌하단
    addCornerCurbs(
      tlCx,
      tlCy,
      Math.PI + margin,
      (3 * Math.PI) / 2 - margin,
    ); // 좌상단
    addCornerCurbs(
      trCx,
      trCy,
      (3 * Math.PI) / 2 + margin,
      2 * Math.PI - margin,
    ); // 우상단
    addCornerCurbs(
      brCx,
      brCy,
      0 + margin,
      Math.PI / 2 - margin,
    ); // 우하단

    return curbs;
  })()
};

// 부드러운 경로 생성 (Catmull-Rom 스플라인 보간)
BasicCircuitTrack.getSmoothPath = function (targetPoints = 400) {
  const path = this.centerPath;
  if (path.length < 4) return path;
  
  // 경로를 부드럽게 보간
  const smoothPath = [];
  const numPoints = path.length;
  
  // 각 세그먼트를 더 많은 포인트로 보간
  for (let i = 0; i < numPoints; i++) {
    const p0 = path[(i - 1 + numPoints) % numPoints];
    const p1 = path[i];
    const p2 = path[(i + 1) % numPoints];
    const p3 = path[(i + 2) % numPoints];
    
    // Catmull-Rom 스플라인 보간
    const steps = Math.ceil(targetPoints / numPoints);
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );
      
      smoothPath.push({ x, y });
    }
  }
  
  return smoothPath;
};

// 트랙 등록 (registerTrack 함수가 정의되어 있는 경우)
if (typeof registerTrack === 'function') {
  registerTrack('basic-circuit', BasicCircuitTrack);
}

