// TrackEditor 렌더링 함수들
// 이 함수들은 TrackEditor 클래스의 메서드로 사용됩니다.

const TrackEditorRenderer = {};

// 부드러운 경로 그리기
TrackEditorRenderer.drawSmoothPath = function(ctx, path, closed = false) {
  if (path.length < 2) return;
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  
  if (closed && path.length > 2) {
    ctx.closePath();
  }
};

// 경로 기반 연석 그리기
TrackEditorRenderer.drawPathBasedKerb = function(ctx, centerPath, kerbWidth, trackSide = 'outer') {
  if (!centerPath || centerPath.length < 2) return;

  // 누적 길이 테이블
  const cumulative = [0];
  for (let i = 1; i < centerPath.length; i++) {
    const p1 = centerPath[i - 1];
    const p2 = centerPath[i];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy));
  }
  const totalLength = cumulative[cumulative.length - 1];

  // 경로상의 특정 거리에서 위치와 법선을 계산
  const getPointAt = (dist) => {
    const clamped = Math.min(Math.max(dist, 0), totalLength);
    // 해당 세그먼트 찾기
    let idx = cumulative.findIndex((len) => len >= clamped);
    if (idx === -1) idx = cumulative.length - 1;
    if (idx === 0) idx = 1;

    const p1 = centerPath[idx - 1];
    const p2 = centerPath[idx];
    const segLen = cumulative[idx] - cumulative[idx - 1] || 1;
    const t = (clamped - cumulative[idx - 1]) / segLen;

    const x = p1.x + (p2.x - p1.x) * t;
    const y = p1.y + (p2.y - p1.y) * t;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;

    // 기본 법선 (좌측 기준)
    const nx = -dy / len;
    const ny = dx / len;
    const sign = trackSide === 'inner' ? 1 : -1;

    return {
      track: { x, y },
      outer: { x: x + nx * kerbWidth * sign, y: y + ny * kerbWidth * sign },
      tangent: { x: dx / len, y: dy / len }
    };
  };

  const blockSize = 40; // 색상 패턴 길이
  const stepSize = 0.5; // 경로를 따라 그릴 때의 간격 (작을수록 부드러움)

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  // 경로를 따라 색상만 변경하면서 연속적으로 그리기
  // 색상이 바뀌는 지점들을 먼저 찾기
  const colorChangePoints = [0];
  for (let d = blockSize; d < totalLength; d += blockSize) {
    colorChangePoints.push(d);
  }
  colorChangePoints.push(totalLength);

  // 각 색상 블록을 연속적으로 그리기
  for (let i = 0; i < colorChangePoints.length - 1; i++) {
    const startDist = colorChangePoints[i];
    const endDist = colorChangePoints[i + 1];
    const blockIdx = Math.floor(startDist / blockSize);
    const isRed = blockIdx % 2 === 0;
    const color = isRed ? '#ff0000' : '#ffffff';

    // 트랙 경계선과 바깥쪽 경계선을 따라 부드럽게 그리기
    ctx.beginPath();
    
    // 트랙 경계선 (앞에서 뒤로)
    for (let d = startDist; d <= endDist; d += stepSize) {
      const dist = Math.min(d, endDist);
      const pt = getPointAt(dist);
      if (d === startDist) {
        ctx.moveTo(pt.track.x, pt.track.y);
      } else {
        ctx.lineTo(pt.track.x, pt.track.y);
      }
    }
    
    // 바깥쪽 경계선 (뒤에서 앞으로)
    for (let d = endDist; d >= startDist; d -= stepSize) {
      const dist = Math.max(d, startDist);
      const pt = getPointAt(dist);
      ctx.lineTo(pt.outer.x, pt.outer.y);
    }
    
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.restore();
};

// 렌더링 스케줄링 (부드러운 애니메이션을 위해)
TrackEditorRenderer.scheduleRender = function(editorInstance) {
  if (editorInstance.animationFrameId) return; // 이미 스케줄링됨
  
  editorInstance.animationFrameId = requestAnimationFrame(() => {
    editorInstance.render();
    editorInstance.animationFrameId = null;
    editorInstance.pendingRender = false;
  });
  editorInstance.pendingRender = true;
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorRenderer = TrackEditorRenderer;
}

