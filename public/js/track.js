// 트랙 목록 정의
const TRACKS = {
  'basic-circuit': {
    id: 'basic-circuit',
    name: '기본 서킷',
    data: null // 아래 Track 객체를 참조
  }
};

// 라운드 사각형 서킷 트랙 데이터
// 단순한 둥근 사각형 형태의 트랙

const Track = {
  name: '기본 서킷',
  id: 'basic-circuit',
  width: 2400,
  height: 1600,
  
  // 트랙 중앙선 경로 (수학적으로 정의된 둥근 사각형)
  // 전체 캔버스 기준으로 거의 완전한 직사각형 + 둥근 코너
  centerPath: (function () {
    const cx = 1200;
    const cy = 800;
    const halfWidth = 760;
    const halfHeight = 440;
    const cornerRadius = 280;

    const points = [];

    // 각 코너를 작은 호(arc)와 직선 구간으로 구성 (좌하단 → 좌상단 → 우상단 → 우하단 → 좌하단)
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
  
  trackWidth: 100,  // 트랙 폭 (차량 약 3.7대 분량)
  
  // 체크포인트 (시계 방향, 하단 스타트 구간은 제외)
  // 차량이 시계 방향(오른쪽으로 출발)으로 달린다고 가정하고
  // 우측 → 상단 → 좌측 순서로 통과하도록 설정
  checkpoints: [
    { x: 1860, y: 840, angle: -Math.PI / 2 },   // 우측 중앙 (↑)
    { x: 1200, y: 420, angle: Math.PI },        // 상단 중앙 (←)
    { x: 520, y: 840, angle: Math.PI / 2 },    // 좌측 중앙 (↓)
  ],
  
  // 시작 위치
  startLine: {
    x: 1200,
    // 트랙 하단 중앙선 위치 (centerPath 하단 y ≈ 1240)에 맞춤
    y: 1240,
    // 트랙 폭과 동일하게
    width: 100,
    angle: 0
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
    
    return minDist < this.trackWidth / 2 + 10; // 약간의 여유
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
  
  // 커브 데이터 (연석 위치) - 트랙 안쪽 라인을 따라 부드럽게 배치
  curbs: (function () {
    const curbs = [];

    const cx = 1200;
    const cy = 800;
    const halfWidth = 760;
    const halfHeight = 440;
    const cornerRadius = 280;
    const trackWidth = 100;

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

// 둥근 사각형은 이미 부드럽게 생성했으므로 그대로 사용
Track.getSmoothPath = function () {
  return this.centerPath;
};

// 트랙 목록에 현재 트랙 데이터 연결
TRACKS['basic-circuit'].data = Track;

// 현재 선택된 트랙을 가져오는 함수
function getTrack(trackId) {
  const trackInfo = TRACKS[trackId];
  if (!trackInfo || !trackInfo.data) {
    // 기본값으로 기본 서킷 반환
    return TRACKS['basic-circuit'].data;
  }
  return trackInfo.data;
}

// 사용 가능한 모든 트랙 목록 반환
function getAvailableTracks() {
  return Object.values(TRACKS).map(track => ({
    id: track.id,
    name: track.name
  }));
}

