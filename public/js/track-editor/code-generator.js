// TrackEditor 코드 생성 함수들
const TrackEditorCodeGenerator = {};

// 코드 출력 업데이트
TrackEditorCodeGenerator.updateCodeOutput = function(editor) {
  const trackName = document.getElementById('trackName').value;
  const trackId = document.getElementById('trackId').value;
  const mapWidth = parseInt(document.getElementById('mapWidth').value) || 4500;
  const mapHeight = parseInt(document.getElementById('mapHeight').value) || 3000;
  const trackWidth = parseInt(document.getElementById('trackWidth').value) || 120;

  if (editor.points.length < 2) {
    document.getElementById('codeOutput').value = '// 최소 2개의 포인트가 필요합니다.';
    return;
  }

  const pointsStr = editor.points.map(p => `{ x: ${p.x}, y: ${p.y}${p.type ? `, type: '${p.type}'` : ''} }`).join(',\n      ');
  
  // curbs 변환 로직: 에디터 형식(centerPath 기반)을 렌더러 형식({x, y, width, height, angle})으로 변환
  let curbsCode = '';
  if (editor.curbs.length > 0) {
    const curbsArray = editor.curbs.map(kerb => {
      if (kerb.centerPath && kerb.centerPath.length > 0) {
        // 경로 기반 연석 - 렌더러 형식으로 변환
        const path = kerb.centerPath;
        const midIndex = Math.floor(path.length / 2);
        const midPoint = path[midIndex];
        
        // 경로의 전체 길이 계산
        let totalLength = 0;
        for (let i = 0; i < path.length - 1; i++) {
          const dx = path[i + 1].x - path[i].x;
          const dy = path[i + 1].y - path[i].y;
          totalLength += Math.sqrt(dx * dx + dy * dy);
        }
        
        // 중간 지점 근처의 방향 벡터 계산
        let dx = 0, dy = 0;
        if (midIndex > 0 && midIndex < path.length - 1) {
          dx = path[midIndex + 1].x - path[midIndex - 1].x;
          dy = path[midIndex + 1].y - path[midIndex - 1].y;
        } else if (midIndex < path.length - 1) {
          dx = path[midIndex + 1].x - path[midIndex].x;
          dy = path[midIndex + 1].y - path[midIndex].y;
        } else if (midIndex > 0) {
          dx = path[midIndex].x - path[midIndex - 1].x;
          dy = path[midIndex].y - path[midIndex - 1].y;
        }
        
        // 각도 계산 (트랙을 가로지르는 방향이므로 90도 회전)
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = len > 0.001 ? Math.atan2(dy, dx) + Math.PI / 2 : 0;
        
        return `{ x: ${midPoint.x}, y: ${midPoint.y}, width: ${totalLength || kerb.length || 300}, height: ${kerb.width || 20}, angle: ${angle.toFixed(6)} }`;
      } else if (kerb.x !== undefined && kerb.y !== undefined) {
        // 구형 포맷 (이미 렌더러 형식)
        return `{ x: ${kerb.x}, y: ${kerb.y}, width: ${kerb.width || 200}, height: ${kerb.height || 20}, angle: ${(kerb.angle || 0).toFixed(6)} }`;
      }
      return null;
    }).filter(k => k !== null);
    
    // curbs 코드 생성: centerPath 기반과 구형 포맷 모두 처리
    const hasCurbs = editor.curbs.length > 0;
    if (hasCurbs) {
      const hasCenterPathCurbs = editor.curbs.some(k => k.centerPath && k.centerPath.length > 0);
      const hasLegacyCurbs = editor.curbs.some(k => k.x !== undefined && k.y !== undefined && !k.centerPath);
      
      if (hasCenterPathCurbs) {
        // centerPath 기반 curbs를 그대로 저장 (렌더러에서 경로 기반으로 그림)
        curbsCode = `[
${editor.curbs.map(kerb => {
  if (kerb.centerPath && kerb.centerPath.length > 0) {
    const pathStr = kerb.centerPath.map(p => `{ x: ${p.x}, y: ${p.y} }`).join(', ');
    return `      { centerPath: [${pathStr}], width: ${kerb.width || 20}, trackSide: '${kerb.trackSide || 'outer'}' }`;
  }
  return null;
}).filter(k => k !== null).join(',\n')}
    ]`;
      } else if (hasLegacyCurbs) {
        // 구형 포맷 (이미 렌더러 형식)
        curbsCode = `[
${editor.curbs.filter(k => k.x !== undefined && k.y !== undefined).map(kerb => 
  `      { x: ${kerb.x}, y: ${kerb.y}, width: ${kerb.width || 200}, height: ${kerb.height || 20}, angle: ${(kerb.angle || 0).toFixed(6)} }`
).join(',\n')}
    ]`;
      } else {
        curbsCode = '[]';
      }
    } else {
      curbsCode = '[]';
    }
  } else {
    curbsCode = '[]';
  }

  const code = `// @ts-nocheck
const ${trackId.replace(/-/g, '')} = {
    name: '${trackName}',
    id: '${trackId}',
    width: ${mapWidth},
    height: ${mapHeight},
    
    centerPath: [
      ${pointsStr}
    ],
    
    trackWidth: ${trackWidth},
    
    checkpoints: [
${editor.checkpoints.length > 0 ? editor.checkpoints.map(cp => `      { x: ${cp.x}, y: ${cp.y}, angle: ${cp.angle.toFixed(3)} }`).join(',\n') : '      // 체크포인트를 추가하세요'}
    ],
    
    curbs: ${curbsCode},
    
    startLine: {
      x: ${editor.startLine?.x || editor.points[0]?.x || 0},
      y: ${editor.startLine?.y || editor.points[0]?.y || 0},
      width: ${trackWidth},
      angle: ${(editor.startLine?.angle || 0).toFixed(3)}
    },
  
  // 트랙 경계 생성 (부드러운 경로 사용)
  getTrackBounds() {
    // 부드러운 경로 생성 (더 정확한 경계 계산)
    const smoothPath = this.getSmoothPath(200);
    const innerPath = [];
    const outerPath = [];

    for (let i = 0; i < smoothPath.length; i++) {
      const curr = smoothPath[i];
      const prev = smoothPath[(i - 1 + smoothPath.length) % smoothPath.length];
      const next = smoothPath[(i + 1) % smoothPath.length];

      // 이전 포인트에서 현재 포인트로의 방향 벡터
      const dx1 = curr.x - prev.x;
      const dy1 = curr.y - prev.y;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      // 현재 포인트에서 다음 포인트로의 방향 벡터
      const dx2 = next.x - curr.x;
      const dy2 = next.y - curr.y;
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      // 두 방향 벡터의 평균을 사용하여 더 정확한 법선 벡터 계산
      let nx, ny;
      if (len1 > 0.001 && len2 > 0.001) {
        // 각 방향 벡터의 법선 벡터 계산 후 평균화
        const nx1 = -dy1 / len1;
        const ny1 = dx1 / len1;
        const nx2 = -dy2 / len2;
        const ny2 = dx2 / len2;
        
        // 평균 법선 벡터 (정규화)
        const avgNx = (nx1 + nx2) / 2;
        const avgNy = (ny1 + ny2) / 2;
        const avgLen = Math.sqrt(avgNx * avgNx + avgNy * avgNy);
        nx = avgLen > 0.001 ? avgNx / avgLen : nx1;
        ny = avgLen > 0.001 ? avgNy / avgLen : ny1;
      } else if (len1 > 0.001) {
        nx = -dy1 / len1;
        ny = dx1 / len1;
      } else if (len2 > 0.001) {
        nx = -dy2 / len2;
        ny = dx2 / len2;
      } else {
        // 기본값 (발생하지 않아야 함)
        nx = 0;
        ny = 1;
      }

      const halfWidth = this.trackWidth / 2;

      innerPath.push({ x: curr.x + nx * halfWidth, y: curr.y + ny * halfWidth });
      outerPath.push({ x: curr.x - nx * halfWidth, y: curr.y - ny * halfWidth });
    }
    return { innerPath, outerPath };
  },

  // 포인트가 트랙 위에 있는지 확인 (부드러운 경로 사용)
  isOnTrack(x, y) {
    // 부드러운 경로를 사용하여 더 정확한 판정
    const smoothPath = this.getSmoothPath(200);
    let minDist = Infinity;
    
    // 각 세그먼트(두 포인트 사이의 선분)까지의 거리 계산
    for (let i = 0; i < smoothPath.length; i++) {
      const p1 = smoothPath[i];
      const p2 = smoothPath[(i + 1) % smoothPath.length];
      
      // 세그먼트까지의 최소 거리 계산
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segLenSq = dx * dx + dy * dy;
      
      if (segLenSq < 0.001) {
        // 세그먼트 길이가 거의 0이면 포인트 간 거리만 계산
        const dist = Math.sqrt((x - p1.x) ** 2 + (y - p1.y) ** 2);
        minDist = Math.min(minDist, dist);
      } else {
        // 세그먼트 위의 가장 가까운 점 찾기
        const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / segLenSq));
        const closestX = p1.x + t * dx;
        const closestY = p1.y + t * dy;
        const dist = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
        minDist = Math.min(minDist, dist);
      }
    }
    
    return minDist < this.trackWidth / 2 + 50;
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
      if (dist < minDist) { minDist = dist; nearestIdx = i; }
    }
    return nearestIdx;
  },

  // 체크포인트 통과 확인
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
  
  // 부드러운 경로 생성 (에디터와 동일한 방식: type 속성 고려)
  getSmoothPath(targetPoints = 200) {
    if (this.centerPath.length < 2) return this.centerPath;
    
    const smoothPath = [];
    const numPoints = this.centerPath.length;
    
    for (let i = 0; i < numPoints; i++) {
      const p1 = this.centerPath[i];
      const p2 = this.centerPath[(i + 1) % numPoints];
      const p0 = this.centerPath[(i - 1 + numPoints) % numPoints];
      const p3 = this.centerPath[(i + 2) % numPoints];
      
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
};

// 트랙 등록
if (typeof registerTrack === 'function') {
  registerTrack('${trackId}', ${trackId.replace(/-/g, '')});
}`;

  // 서버 설정 코드 생성 (track-configs.ts용)
  const serverPointsStr = editor.points.map(p => `      { x: ${p.x}, y: ${p.y} }`).join(',\n');
  const serverSpawnStr = editor.spawnPositions.length > 0 
    ? editor.spawnPositions.map(spawn => `    { x: ${spawn.x}, y: ${spawn.y} }`).join(',\n') 
    : `    { x: ${editor.points[0]?.x || 0}, y: ${editor.points[0]?.y || 0} }`;
  const serverCheckpointsStr = editor.checkpoints.length > 0 
    ? editor.checkpoints.map(cp => `    { x: ${cp.x}, y: ${cp.y}, angle: ${cp.angle.toFixed(3)} }`).join(',\n') 
    : '    // 체크포인트를 추가하세요';
  
  const serverCode = `

// ========================================
// 서버 설정 코드 (src/game/tracks/track-configs.ts에 추가)
// ========================================

// 1. 아래 코드를 track-configs.ts의 trackServerConfigs 맵 위에 추가하세요:

export const ${trackId.replace(/-/g, '')}ServerConfig: TrackServerConfig = {
  buildCenterPath: function() {
    return [
${serverPointsStr}
    ];
  },
  spawnPositions: [
${serverSpawnStr}
  ],
  spawnAngle: ${(editor.spawnAngle || 0).toFixed(3)},
  checkpoints: [
${serverCheckpointsStr}
  ],
  startLine: {
    x: ${editor.startLine?.x || editor.points[0]?.x || 0},
    y: ${editor.startLine?.y || editor.points[0]?.y || 0},
    angle: ${(editor.startLine?.angle || 0).toFixed(3)}
  },
  trackWidth: ${trackWidth}
};

// 2. trackServerConfigs 맵에 아래 줄을 추가하세요:
//    ['${trackId}', ${trackId.replace(/-/g, '')}ServerConfig],
`;

  document.getElementById('codeOutput').value = code + serverCode;
};

// 코드 복사
TrackEditorCodeGenerator.copyCode = function() {
  const codeOutput = document.getElementById('codeOutput');
  const code = codeOutput.value;
  
  // 코드가 비어있거나 최소 포인트 오류 메시지인지 확인
  if (!code || code.trim() === '' || code.includes('최소 2개의 포인트가 필요합니다')) {
    alert('복사할 코드가 없습니다. 먼저 트랙을 생성해주세요.');
    return;
  }
  
  // 클립보드 API 사용 시도
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      alert('코드가 클립보드에 복사되었습니다!');
    }).catch(err => {
      console.error('클립보드 복사 실패:', err);
      // 대체 방법 사용
      TrackEditorCodeGenerator.fallbackCopyCode(codeOutput);
    });
  } else {
    // 클립보드 API를 사용할 수 없는 경우 대체 방법 사용
    TrackEditorCodeGenerator.fallbackCopyCode(codeOutput);
  }
};

// 대체 복사 방법 (구형 브라우저 지원)
TrackEditorCodeGenerator.fallbackCopyCode = function(textarea) {
  try {
    textarea.select();
    textarea.setSelectionRange(0, 99999); // 모바일 지원
    
    const successful = document.execCommand('copy');
    if (successful) {
      alert('코드가 클립보드에 복사되었습니다!');
    } else {
      alert('복사에 실패했습니다. 코드를 수동으로 선택하여 복사해주세요.');
      textarea.focus();
    }
  } catch (err) {
    console.error('대체 복사 방법 실패:', err);
    alert('복사에 실패했습니다. 코드를 수동으로 선택하여 복사해주세요.');
    textarea.focus();
    textarea.select();
  }
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorCodeGenerator = TrackEditorCodeGenerator;
}

