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

  const pointsStr = editor.points.map(p => `{ x: ${p.x}, y: ${p.y}${p.type ? `, type: '${p.type}'` : ''} }`).join(',\n    ');

  const code = `const ${trackId}Track = {
  name: '${trackName}',
  id: '${trackId}',
  width: ${mapWidth},
  height: ${mapHeight},
  
  centerPath: [
    ${pointsStr}
  ],
  
  trackWidth: ${trackWidth},
  
  checkpoints: [
${editor.checkpoints.length > 0 ? editor.checkpoints.map(cp => `    { x: ${cp.x}, y: ${cp.y}, angle: ${cp.angle.toFixed(3)} }`).join(',\n') : '    // 체크포인트를 추가하세요'}
  ],
  
  curbs: [
${editor.curbs.length > 0 ? editor.curbs.map(kerb => {
  if (kerb.centerPath && kerb.centerPath.length > 0) {
    // 경로 기반 연석
    const pathStr = kerb.centerPath.map(p => `{ x: ${p.x}, y: ${p.y} }`).join(', ');
    return `    { centerPath: [${pathStr}], width: ${kerb.width || 20}, length: ${kerb.length || 300}, trackSide: '${kerb.trackSide || 'outer'}' }`;
  } else {
    // 구형 포맷
    return `    { x: ${kerb.x}, y: ${kerb.y}, angle: ${(kerb.angle || 0).toFixed(3)}, width: ${kerb.width || 200}, height: ${kerb.height || 20} }`;
  }
}).join(',\n') : '    // 연석을 추가하세요'}
  ],
  
  startLine: {
    x: ${editor.startLine?.x || editor.points[0]?.x || 0},
    y: ${editor.startLine?.y || editor.points[0]?.y || 0},
    width: ${trackWidth},
    angle: ${(editor.startLine?.angle || 0).toFixed(3)}
  },
  
  serverConfig: {
    buildCenterPath: function() {
      return [
        ${pointsStr}
      ];
    },
    
    spawnPositions: [
${editor.spawnPositions.length > 0 ? editor.spawnPositions.map(spawn => `      { x: ${spawn.x}, y: ${spawn.y} }`).join(',\n') : `      { x: ${editor.points[0]?.x || 0}, y: ${editor.points[0]?.y || 0} }`}
    ],
    
    spawnAngle: ${(editor.spawnAngle || 0).toFixed(3)},
    checkpoints: [
${editor.checkpoints.length > 0 ? editor.checkpoints.map(cp => `      { x: ${cp.x}, y: ${cp.y}, angle: ${cp.angle.toFixed(3)} }`).join(',\n') : '      // 체크포인트를 추가하세요'}
    ],
    startLine: {
      x: ${editor.startLine?.x || editor.points[0]?.x || 0},
      y: ${editor.startLine?.y || editor.points[0]?.y || 0},
      angle: ${(editor.startLine?.angle || 0).toFixed(3)}
    },
    trackWidth: ${trackWidth}
  }
};`;

  document.getElementById('codeOutput').value = code;
};

// 코드 복사
TrackEditorCodeGenerator.copyCode = function() {
  const code = document.getElementById('codeOutput').value;
  navigator.clipboard.writeText(code).then(() => {
    alert('코드가 클립보드에 복사되었습니다!');
  });
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorCodeGenerator = TrackEditorCodeGenerator;
}

