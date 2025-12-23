// TrackEditor 이벤트 핸들러 설정 함수들
const TrackEditorEventHandler = {};

// 이벤트 리스너 설정
TrackEditorEventHandler.setupEventListeners = function(editor) {
  // 모드 버튼
  document.getElementById('addModeBtn').addEventListener('click', () => editor.setMode('add'));
  document.getElementById('moveModeBtn').addEventListener('click', () => editor.setMode('move'));
  document.getElementById('deleteModeBtn').addEventListener('click', () => editor.setMode('delete'));
  document.getElementById('addCheckpointBtn').addEventListener('click', () => editor.setMode('addCheckpoint'));
  document.getElementById('moveCheckpointBtn').addEventListener('click', () => editor.setMode('moveCheckpoint'));
  document.getElementById('deleteCheckpointBtn').addEventListener('click', () => editor.setMode('deleteCheckpoint'));
  document.getElementById('addKerbBtn').addEventListener('click', () => editor.setMode('addKerb'));
  document.getElementById('moveKerbBtn').addEventListener('click', () => editor.setMode('moveKerb'));
  document.getElementById('deleteKerbBtn').addEventListener('click', () => editor.setMode('deleteKerb'));
  document.getElementById('addSpawnBtn').addEventListener('click', () => editor.setMode('addSpawn'));
  document.getElementById('moveSpawnBtn').addEventListener('click', () => editor.setMode('moveSpawn'));
  document.getElementById('deleteSpawnBtn').addEventListener('click', () => editor.setMode('deleteSpawn'));
  document.getElementById('setStartLineBtn').addEventListener('click', () => editor.setMode('setStartLine'));
  document.getElementById('moveStartLineBtn').addEventListener('click', () => editor.setMode('moveStartLine'));
  document.getElementById('deleteStartLineBtn').addEventListener('click', () => editor.setMode('deleteStartLine'));
  document.getElementById('previewBtn').addEventListener('click', () => editor.togglePreview());

  // 캔버스 이벤트
  editor.canvas.addEventListener('click', (e) => editor.handleCanvasClick(e));
  editor.canvas.addEventListener('mousedown', (e) => editor.handleMouseDown(e));
  editor.canvas.addEventListener('mousemove', (e) => editor.handleMouseMove(e));
  editor.canvas.addEventListener('mouseup', (e) => editor.handleMouseUp(e));
  editor.canvas.addEventListener('wheel', (e) => editor.handleWheel(e));
  editor.canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // 우클릭 메뉴 방지
  editor.canvas.addEventListener('mouseleave', (e) => {
    // 캔버스를 벗어날 때 호버 상태 초기화
    editor.hoveredPointIndex = -1;
    editor.hoveredCheckpointIndex = -1;
    editor.hoveredKerbIndex = -1;
    editor.hoveredSpawnIndex = -1;
    editor.hoveredStartLine = false;
    if (editor.mode === 'delete' || editor.mode === 'deleteCheckpoint' || editor.mode === 'deleteKerb' || editor.mode === 'deleteSpawn' || editor.mode === 'deleteStartLine') {
      editor.canvas.style.cursor = 'not-allowed';
    }
    editor.render();
  });
  
  // 미니맵 이벤트
  if (editor.minimapCanvas) {
    editor.minimapCanvas.addEventListener('mousedown', (e) => editor.handleMinimapMouseDown(e));
    editor.minimapCanvas.addEventListener('mousemove', (e) => editor.handleMinimapMouseMove(e));
    editor.minimapCanvas.addEventListener('mouseup', (e) => editor.handleMinimapMouseUp(e));
    editor.minimapCanvas.addEventListener('mouseleave', (e) => editor.handleMinimapMouseUp(e));
  }
  
  // 줌 컨트롤 버튼
  document.getElementById('zoomInBtn').addEventListener('click', () => editor.zoomIn());
  document.getElementById('zoomOutBtn').addEventListener('click', () => editor.zoomOut());
  document.getElementById('resetViewBtn').addEventListener('click', () => editor.resetView());

  // 입력 필드 변경
  document.getElementById('trackName').addEventListener('input', () => { editor.updateCodeOutput(); editor.saveToStorage(); });
  document.getElementById('trackId').addEventListener('input', () => { editor.updateCodeOutput(); editor.saveToStorage(); });
  document.getElementById('mapWidth').addEventListener('input', () => { editor.render(); editor.updateCodeOutput(); editor.saveToStorage(); });
  document.getElementById('mapHeight').addEventListener('input', () => { editor.render(); editor.updateCodeOutput(); editor.saveToStorage(); });
  document.getElementById('pointX').addEventListener('input', () => editor.updateSelectedPoint());
  document.getElementById('pointY').addEventListener('input', () => editor.updateSelectedPoint());
  
  // 포인트 타입 변경 버튼
  document.getElementById('setStraightBtn').addEventListener('click', () => editor.setPointType('straight'));
  document.getElementById('setCurveBtn').addEventListener('click', () => editor.setPointType('curve'));
  
  // 체크포인트 입력 필드 (요소가 존재하는 경우에만 이벤트 리스너 추가)
  const checkpointX = document.getElementById('checkpointX');
  const checkpointY = document.getElementById('checkpointY');
  const checkpointAngle = document.getElementById('checkpointAngle');
  const checkpointAngleDeg = document.getElementById('checkpointAngleDeg');
  
  if (checkpointX) {
    checkpointX.addEventListener('input', () => editor.updateSelectedCheckpoint());
  }
  if (checkpointY) {
    checkpointY.addEventListener('input', () => editor.updateSelectedCheckpoint());
  }
  if (checkpointAngle) {
    checkpointAngle.addEventListener('input', () => {
      const angle = parseFloat(checkpointAngle.value);
      if (!isNaN(angle) && checkpointAngleDeg) {
        checkpointAngleDeg.value = Math.round(angle * 180 / Math.PI);
        editor.updateSelectedCheckpoint();
      }
    });
  }
  if (checkpointAngleDeg) {
    checkpointAngleDeg.addEventListener('input', () => {
      const angleDeg = parseFloat(checkpointAngleDeg.value);
      if (!isNaN(angleDeg) && checkpointAngle) {
        checkpointAngle.value = (angleDeg * Math.PI / 180).toFixed(3);
        editor.updateSelectedCheckpoint();
      }
    });
  }
  
  // 연석 입력 필드
  const kerbX = document.getElementById('kerbX');
  const kerbY = document.getElementById('kerbY');
  const kerbAngle = document.getElementById('kerbAngle');
  const kerbAngleDeg = document.getElementById('kerbAngleDeg');
  const kerbLength = document.getElementById('kerbLength');
  
  if (kerbX) {
    kerbX.addEventListener('input', () => editor.updateSelectedKerb());
  }
  if (kerbY) {
    kerbY.addEventListener('input', () => editor.updateSelectedKerb());
  }
  if (kerbAngle) {
    kerbAngle.addEventListener('input', () => {
      const angle = parseFloat(kerbAngle.value);
      if (!isNaN(angle) && kerbAngleDeg) {
        kerbAngleDeg.value = Math.round(angle * 180 / Math.PI);
        editor.updateSelectedKerb();
      }
    });
  }
  if (kerbAngleDeg) {
    kerbAngleDeg.addEventListener('input', () => {
      const angleDeg = parseFloat(kerbAngleDeg.value);
      if (!isNaN(angleDeg) && kerbAngle) {
        kerbAngle.value = (angleDeg * Math.PI / 180).toFixed(3);
        editor.updateSelectedKerb();
      }
    });
  }
  if (kerbLength) {
    kerbLength.addEventListener('input', () => editor.updateSelectedKerb());
  }

  // 출발 위치 입력 필드
  const spawnX = document.getElementById('spawnX');
  const spawnY = document.getElementById('spawnY');
  if (spawnX) {
    spawnX.addEventListener('input', () => editor.updateSelectedSpawn());
  }
  if (spawnY) {
    spawnY.addEventListener('input', () => editor.updateSelectedSpawn());
  }

  // 출발 방향 입력 필드
  const spawnAngle = document.getElementById('spawnAngle');
  const spawnAngleDeg = document.getElementById('spawnAngleDeg');
  if (spawnAngle) {
    spawnAngle.addEventListener('input', () => {
      const angle = parseFloat(spawnAngle.value);
      if (!isNaN(angle) && spawnAngleDeg) {
        spawnAngleDeg.value = Math.round(angle * 180 / Math.PI);
        editor.spawnAngle = angle;
        editor.updateCodeOutput();
        editor.saveToStorage();
      }
    });
  }
  if (spawnAngleDeg) {
    spawnAngleDeg.addEventListener('input', () => {
      const angleDeg = parseFloat(spawnAngleDeg.value);
      if (!isNaN(angleDeg) && spawnAngle) {
        spawnAngle.value = (angleDeg * Math.PI / 180).toFixed(3);
        editor.spawnAngle = angleDeg * Math.PI / 180;
        editor.updateCodeOutput();
        editor.saveToStorage();
      }
    });
  }

  // 시작선 입력 필드
  const startLineX = document.getElementById('startLineX');
  const startLineY = document.getElementById('startLineY');
  const startLineAngle = document.getElementById('startLineAngle');
  const startLineAngleDeg = document.getElementById('startLineAngleDeg');
  if (startLineX) {
    startLineX.addEventListener('input', () => {
      const x = parseFloat(startLineX.value);
      if (!isNaN(x)) {
        editor.startLine.x = x;
        editor.updateCodeOutput();
        editor.saveToStorage();
        editor.render();
      }
    });
  }
  if (startLineY) {
    startLineY.addEventListener('input', () => {
      const y = parseFloat(startLineY.value);
      if (!isNaN(y)) {
        editor.startLine.y = y;
        editor.updateCodeOutput();
        editor.saveToStorage();
        editor.render();
      }
    });
  }
  if (startLineAngle) {
    startLineAngle.addEventListener('input', () => {
      const angle = parseFloat(startLineAngle.value);
      if (!isNaN(angle) && startLineAngleDeg) {
        startLineAngleDeg.value = Math.round(angle * 180 / Math.PI);
        editor.startLine.angle = angle;
        editor.updateCodeOutput();
        editor.saveToStorage();
        editor.render();
      }
    });
  }
  if (startLineAngleDeg) {
    startLineAngleDeg.addEventListener('input', () => {
      const angleDeg = parseFloat(startLineAngleDeg.value);
      if (!isNaN(angleDeg) && startLineAngle) {
        startLineAngle.value = (angleDeg * Math.PI / 180).toFixed(3);
        editor.startLine.angle = angleDeg * Math.PI / 180;
        editor.updateCodeOutput();
        editor.saveToStorage();
        editor.render();
      }
    });
  }

  // 버튼
  document.getElementById('newTrackBtn').addEventListener('click', () => editor.newTrack());
  document.getElementById('copyCodeBtn').addEventListener('click', () => editor.copyCode());
  document.getElementById('saveTrackBtn').addEventListener('click', () => editor.copyCode());
  document.getElementById('clearBtn').addEventListener('click', () => editor.clearTrack());
  document.getElementById('loadTrackBtn').addEventListener('click', () => editor.loadTrack());

  // 키보드
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (editor.selectedPointIndex >= 0) {
        editor.deletePoint(editor.selectedPointIndex);
      }
    }
    // 스페이스바로 팬 모드 활성화
    if (e.key === ' ') {
      e.preventDefault();
      editor.canvas.style.cursor = 'grabbing';
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === ' ') {
      editor.canvas.style.cursor = editor.mode === 'add' ? 'crosshair' : editor.mode === 'move' ? 'move' : 'pointer';
    }
  });

    // 키보드 이벤트 리스너 추가 (TrackEditor 생성자나 초기화 함수에)
  document.addEventListener('keydown', (e) => {
    if (this.selectedKerbIndex >= 0) {
      const isFineTuning = e.shiftKey; // Shift 키로 세밀 조정
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.adjustKerbPosition('left', isFineTuning);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.adjustKerbPosition('right', isFineTuning);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.adjustKerbPosition('up', isFineTuning);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.adjustKerbPosition('down', isFineTuning);
          break;
      }
    }
  });
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorEventHandler = TrackEditorEventHandler;
}

