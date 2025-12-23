// TrackEditor 유틸리티 함수들
// 이 함수들은 TrackEditor 클래스의 메서드로 사용됩니다.

// 전역 네임스페이스에 추가 (비-모듈 환경에서 사용 가능하도록)
const TrackEditorUtils = {};

// 캔버스 좌표를 월드 좌표로 변환
TrackEditorUtils.canvasToWorld = function(canvasX, canvasY, offsetX, offsetY, zoom) {
  const worldX = (canvasX - offsetX) / zoom;
  const worldY = (canvasY - offsetY) / zoom;
  return { x: worldX, y: worldY };
}

// 월드 좌표를 캔버스 좌표로 변환
TrackEditorUtils.worldToCanvas = function(worldX, worldY, offsetX, offsetY, zoom) {
  const canvasX = worldX * zoom + offsetX;
  const canvasY = worldY * zoom + offsetY;
  return { x: canvasX, y: canvasY };
}

// 이벤트에서 캔버스 포인트 가져오기
TrackEditorUtils.getCanvasPoint = function(e, canvas, offsetX, offsetY, zoom, round = true) {
  const rect = canvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  
  // 줌과 오프셋을 고려하여 월드 좌표로 변환
  const world = TrackEditorUtils.canvasToWorld(canvasX, canvasY, offsetX, offsetY, zoom);
  // 연석 이동 시 부드러운 이동을 위해 반올림 옵션 추가
  if (round) {
    return { x: Math.round(world.x), y: Math.round(world.y) };
  } else {
    return { x: world.x, y: world.y };
  }
}

// 포인트 찾기
TrackEditorUtils.findPointAt = function(x, y, points, radius = 10) {
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    const dx = p.x - x;
    const dy = p.y - y;
    if (dx * dx + dy * dy < radius * radius) {
      return i;
    }
  }
  return -1;
}

// 트랙 중심선에 가장 가까운 점 찾기 (스냅용)
TrackEditorUtils.snapToTrackCenter = function(x, y, points) {
  if (points.length < 2) return { x, y };
  
  let minDist = Infinity;
  let nearestPoint = { x, y };
  let nearestIndex = 0;
  
  // 모든 선분에 대해 가장 가까운 점 찾기
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    
    // 선분에 투영된 점 찾기
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    
    if (len2 === 0) {
      // 점과 점 사이의 거리
      const dist = Math.sqrt((x - p1.x) ** 2 + (y - p1.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearestPoint = { x: p1.x, y: p1.y };
        nearestIndex = i;
      }
    } else {
      // 선분에 투영
      const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / len2));
      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
      
      if (dist < minDist) {
        minDist = dist;
        nearestPoint = { x: projX, y: projY };
        nearestIndex = i;
      }
    }
  }
  
  return nearestPoint;
}

// 체크포인트 각도 계산 (가장 가까운 트랙 포인트의 방향)
TrackEditorUtils.calculateCheckpointAngle = function(x, y, points) {
  if (points.length < 2) return 0;
  
  // 가장 가까운 포인트 찾기
  let minDist = Infinity;
  let nearestIndex = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const dx = x - p.x;
    const dy = y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearestIndex = i;
    }
  }
  
  // 다음 포인트 방향 계산
  const p1 = points[nearestIndex];
  const p2 = points[(nearestIndex + 1) % points.length];
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.atan2(dy, dx);
}

// 체크포인트 찾기
TrackEditorUtils.findCheckpointAt = function(x, y, checkpoints, radius = 15) {
  for (let i = checkpoints.length - 1; i >= 0; i--) {
    const cp = checkpoints[i];
    const dx = cp.x - x;
    const dy = cp.y - y;
    if (dx * dx + dy * dy < radius * radius) {
      return i;
    }
  }
  return -1;
}

// 출발 위치 찾기
TrackEditorUtils.findSpawnAt = function(x, y, spawnPositions, radius = 15) {
  for (let i = spawnPositions.length - 1; i >= 0; i--) {
    const spawn = spawnPositions[i];
    const dx = spawn.x - x;
    const dy = spawn.y - y;
    if (dx * dx + dy * dy < radius * radius) {
      return i;
    }
  }
  return -1;
}

// 시작선 찾기 (트랙 전체를 가로지르는 시작선)
TrackEditorUtils.findStartLineAt = function(x, y, startLine, trackWidth, threshold = 30) {
  if (!startLine || (startLine.x === 0 && startLine.y === 0)) {
    return false;
  }

  const dx = startLine.x - x;
  const dy = startLine.y - y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 중심점 근처
  if (dist < threshold) {
    return true;
  }

  const halfTrackWidth = trackWidth / 2;

  // 시작선은 트랙 진행방향에 수직
  const perpAngle = startLine.angle + Math.PI / 2;
  const lineX = Math.cos(perpAngle);
  const lineY = Math.sin(perpAngle);

  // 클릭 좌표를 시작선 기준 좌표로 변환
  const relX = x - startLine.x;
  const relY = y - startLine.y;

  // 시작선 방향 투영 (양쪽 허용)
  const proj = relX * lineX + relY * lineY;

  // 시작선에서의 수직 거리
  const perpX = relX - proj * lineX;
  const perpY = relY - proj * lineY;
  const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);

  // 선분 전체 + 두께 판정
  if (Math.abs(proj) <= halfTrackWidth && perpDist < threshold) {
    return true;
  }

  return false;
}

// 연석 찾기
TrackEditorUtils.findKerbAt = function(x, y, curbs, threshold = 30) {
  for (let i = curbs.length - 1; i >= 0; i--) {
    const kerb = curbs[i];
    
    // 새로운 경로 기반 연석
    if (kerb.centerPath && kerb.centerPath.length > 0) {
      // 클릭 위치에서 연석 경로까지의 최소 거리 계산
      let minDist = Infinity;
      for (let j = 0; j < kerb.centerPath.length; j++) {
        const p = kerb.centerPath[j];
        const dx = p.x - x;
        const dy = p.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
        }
      }
      // 연석의 폭을 고려한 감지 범위
      const detectRange = (kerb.width || 20) / 2 + threshold;
      if (minDist < detectRange) {
        return i;
      }
    }
    // 구형 포맷 (하위 호환성)
    else if (kerb.x !== undefined && kerb.y !== undefined) {
      const dx = kerb.x - x;
      const dy = kerb.y - y;
      if (dx * dx + dy * dy < threshold * threshold) {
        return i;
      }
    }
  }
  return -1;
}

// 트랙 경계 계산
TrackEditorUtils.getTrackBounds = function(centerPath, trackWidth) {
  const innerPath = [];
  const outerPath = [];
  
  for (let i = 0; i < centerPath.length; i++) {
    const curr = centerPath[i];
    const prev = centerPath[(i - 1 + centerPath.length) % centerPath.length];
    const next = centerPath[(i + 1) % centerPath.length];
    
    // 방향 벡터 계산
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len > 0) {
      // 법선 벡터 (좌우)
      const nx = -dy / len;
      const ny = dx / len;
      
      const halfWidth = trackWidth / 2;
      
      innerPath.push({
        x: curr.x + nx * halfWidth,
        y: curr.y + ny * halfWidth
      });
      
      outerPath.push({
        x: curr.x - nx * halfWidth,
        y: curr.y - ny * halfWidth
      });
    } else {
      // 길이가 0이면 그대로 사용
      innerPath.push({ x: curr.x, y: curr.y });
      outerPath.push({ x: curr.x, y: curr.y });
    }
  }
  
  return { innerPath, outerPath };
}

// 경로에서 지정된 길이만큼의 세그먼트 추출 (세밀한 위치 고려)
TrackEditorUtils.extractPathSegment = function(path, startIndex, targetLength, t = 0) {
  if (!path || path.length === 0) return [];
  
  const segment = [];
  
  // 시작점 계산 (startIndex와 startIndex+1 사이의 정확한 위치)
  let startPoint;
  if (startIndex < path.length - 1 && t > 0) {
    const p1 = path[startIndex];
    const p2 = path[startIndex + 1];
    startPoint = {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    };
  } else {
    startPoint = { ...path[startIndex] };
  }
  
  // 중심점 추가
  segment.push(startPoint);
  
  // 뒤쪽으로 확장 (경로의 절반 길이)
  let backwardLength = 0;
  // 시작 세그먼트의 뒤쪽 부분 길이 계산
  if (startIndex < path.length - 1 && t > 0) {
    const p1 = path[startIndex];
    const p2 = path[startIndex + 1];
    const segDist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    backwardLength += segDist * t;
  }
  
  for (let i = startIndex - 1; i >= 0 && backwardLength < targetLength / 2; i--) {
    const p1 = path[i];
    const p2 = path[i + 1];
    const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    backwardLength += dist;
    segment.unshift({ ...p1 });
  }
  
  // 앞쪽으로 확장 (경로의 절반 길이)
  let forwardLength = 0;
  // 시작 세그먼트의 앞쪽 부분 길이 계산
  if (startIndex < path.length - 1 && t < 1) {
    const p1 = path[startIndex];
    const p2 = path[startIndex + 1];
    const segDist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    forwardLength += segDist * (1 - t);
  }
  
  for (let i = startIndex + 1; i < path.length && forwardLength < targetLength / 2; i++) {
    const p1 = path[i - 1];
    const p2 = path[i];
    const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    forwardLength += dist;
    segment.push({ ...p2 });
  }
  
  return segment;
}

// 직선과 곡선을 구분하여 경로 생성 (전환 지점 부드럽게 처리)
TrackEditorUtils.getSmoothPath = function(points, targetPoints = 400) {
  if (points.length < 2) return points;
  
  const smoothPath = [];
  const numPoints = points.length;
  
  for (let i = 0; i < numPoints; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % numPoints];
    const p0 = points[(i - 1 + numPoints) % numPoints];
    const p3 = points[(i + 2) % numPoints];
    
    const p1Type = p1.type || 'straight';
    const p2Type = p2.type || 'straight';
    
    // 전환 구간 감지: 직선->곡선 또는 곡선->직선
    const isTransition = (p1Type === 'straight' && p2Type === 'curve') || 
                         (p1Type === 'curve' && p2Type === 'straight');
    
    // 곡선 구간 또는 전환 구간인지 확인
    const isCurve = p1Type === 'curve' || p2Type === 'curve' || isTransition;
    
    if (isCurve && numPoints >= 4) {
      // 곡선 구간 또는 전환 구간: Catmull-Rom 스플라인 사용
      const steps = Math.ceil(targetPoints / numPoints);
      
      // 전환 구간인 경우 더 많은 포인트로 부드럽게 처리
      const transitionSteps = isTransition ? steps * 1.5 : steps;
      
      for (let j = 0; j < transitionSteps; j++) {
        const t = j / transitionSteps;
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
    } else {
      // 순수 직선 구간: 단순 선형 보간
      const steps = Math.max(2, Math.ceil(targetPoints / numPoints / 2));
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        smoothPath.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t
        });
      }
    }
  }
  
  return smoothPath;
}

// 가장 가까운 트랙 경계 찾기 (연석 배치용)
TrackEditorUtils.findNearestTrackBoundary = function(x, y, points, trackWidth, kerbLength, isDragging = false, editor = null) {
  if (points.length < 2) return null;
  
  // 포인트 배열 해시 생성 (캐시 무효화 확인용)
  const pointsHash = points.map(p => `${p.x},${p.y},${p.type || 'straight'}`).join('|');
  
  // 캐시 확인 및 사용
  let smoothPath, innerPath, outerPath;
  if (editor && editor._pointsHash === pointsHash && editor._smoothPathCache && editor._trackBoundsCache) {
    // 캐시 사용
    smoothPath = editor._smoothPathCache;
    innerPath = editor._trackBoundsCache.innerPath;
    outerPath = editor._trackBoundsCache.outerPath;
  } else {
    // 캐시 없거나 무효화됨 - 새로 계산
    smoothPath = TrackEditorUtils.getSmoothPath(points, 200);
    const bounds = TrackEditorUtils.getTrackBounds(smoothPath, trackWidth);
    innerPath = bounds.innerPath;
    outerPath = bounds.outerPath;
    
    // 캐시 저장
    if (editor) {
      editor._smoothPathCache = smoothPath;
      editor._trackBoundsCache = { innerPath, outerPath };
      editor._pointsHash = pointsHash;
    }
  }
  
  let minDist = Infinity;
  let nearestIndex = -1;
  let isInnerPath = false;
  let nearestT = 0; // 세그먼트 내 위치 (0~1)
  
  // 드래그 중에는 샘플링 개수를 줄여서 성능 향상 (20 -> 5)
  // 드래그 종료 후 정밀한 위치 계산은 handleMouseUp에서 수행
  const sampleCount = isDragging ? 5 : 20;
  
  // 내부 경계 확인 - 각 세그먼트를 샘플링
  for (let i = 0; i < innerPath.length - 1; i++) {
    const p1 = innerPath[i];
    const p2 = innerPath[i + 1];
    
    for (let j = 0; j <= sampleCount; j++) {
      const t = j / sampleCount;
      const px = p1.x + (p2.x - p1.x) * t;
      const py = p1.y + (p2.y - p1.y) * t;
      const dx = x - px;
      const dy = y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
        nearestT = t;
        isInnerPath = true;
      }
    }
  }
  
  // 외부 경계 확인 - 각 세그먼트를 샘플링
  for (let i = 0; i < outerPath.length - 1; i++) {
    const p1 = outerPath[i];
    const p2 = outerPath[i + 1];
    
    for (let j = 0; j <= sampleCount; j++) {
      const t = j / sampleCount;
      const px = p1.x + (p2.x - p1.x) * t;
      const py = p1.y + (p2.y - p1.y) * t;
      const dx = x - px;
      const dy = y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
        nearestT = t;
        isInnerPath = false;
      }
    }
  }
  
  // 거리 조건을 줄여서 트랙 경계에 더 가까운 곳에서만 연석 배치 가능
  if (nearestIndex >= 0 && minDist < trackWidth * 1.5) {
    const path = isInnerPath ? innerPath : outerPath;
    
    // 클릭한 지점에서 경로를 따라 지정된 길이만큼의 경로 추출 (세밀한 위치 고려)
    const kerbPath = TrackEditorUtils.extractPathSegment(path, nearestIndex, kerbLength, nearestT);
    
    return {
      path: isInnerPath ? innerPath : outerPath,
      closestIndex: nearestIndex,
      isInner: isInnerPath,
      kerbPath: kerbPath,
      trackWidth: trackWidth
    };
  }
  
  return null;
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorUtils = TrackEditorUtils;
}

