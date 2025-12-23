// TrackEditor UI 관리 함수들
const TrackEditorUIManager = {};

// 모드 설정
TrackEditorUIManager.setMode = function(editor, mode) {
  editor.mode = mode;
  document.getElementById('addModeBtn').classList.toggle('active', mode === 'add');
  document.getElementById('moveModeBtn').classList.toggle('active', mode === 'move');
  document.getElementById('deleteModeBtn').classList.toggle('active', mode === 'delete');
  document.getElementById('addCheckpointBtn').classList.toggle('active', mode === 'addCheckpoint');
  document.getElementById('moveCheckpointBtn').classList.toggle('active', mode === 'moveCheckpoint');
  document.getElementById('deleteCheckpointBtn').classList.toggle('active', mode === 'deleteCheckpoint');
  document.getElementById('addKerbBtn').classList.toggle('active', mode === 'addKerb');
  document.getElementById('moveKerbBtn').classList.toggle('active', mode === 'moveKerb');
  document.getElementById('deleteKerbBtn').classList.toggle('active', mode === 'deleteKerb');
  document.getElementById('addSpawnBtn').classList.toggle('active', mode === 'addSpawn');
  document.getElementById('moveSpawnBtn').classList.toggle('active', mode === 'moveSpawn');
  document.getElementById('deleteSpawnBtn').classList.toggle('active', mode === 'deleteSpawn');
  document.getElementById('setStartLineBtn').classList.toggle('active', mode === 'setStartLine');
  document.getElementById('moveStartLineBtn').classList.toggle('active', mode === 'moveStartLine');
  document.getElementById('deleteStartLineBtn').classList.toggle('active', mode === 'deleteStartLine');
  
  // 커서 설정
  if (mode === 'add' || mode === 'addCheckpoint' || mode === 'addKerb' || mode === 'addSpawn' || mode === 'setStartLine') {
    editor.canvas.style.cursor = 'crosshair';
  } else if (mode === 'move' || mode === 'moveCheckpoint' || mode === 'moveKerb' || mode === 'moveSpawn' || mode === 'moveStartLine') {
    editor.canvas.style.cursor = 'move';
  } else if (mode === 'delete' || mode === 'deleteCheckpoint' || mode === 'deleteKerb' || mode === 'deleteSpawn' || mode === 'deleteStartLine') {
    editor.canvas.style.cursor = 'not-allowed'; // 삭제 모드 기본 커서
  } else {
    editor.canvas.style.cursor = 'pointer';
  }
  // 호버 상태 초기화
  editor.hoveredPointIndex = -1;
  editor.hoveredCheckpointIndex = -1;
  editor.hoveredKerbIndex = -1;
  editor.hoveredSpawnIndex = -1;
  editor.hoveredStartLine = false;
  editor.updateStatus();
  
  // 모드 변경 시 저장 (새로고침 후 복원을 위해)
  editor.saveToStorage();
  
  editor.render(); // 커서 변경을 위해 다시 렌더링
};

// 미리보기 모드 토글
TrackEditorUIManager.togglePreview = function(editor) {
  editor.previewMode = !editor.previewMode;
  document.getElementById('previewBtn').classList.toggle('active', editor.previewMode);
  // 미리보기 모드 상태 저장
  localStorage.setItem('trackEditor_previewMode', editor.previewMode.toString());
  editor.render();
};

// 상태 표시 업데이트
TrackEditorUIManager.updateStatus = function(editor) {
  const modeNames = { 
    add: '포인트 추가', 
    move: '포인트 이동', 
    delete: '포인트 삭제',
    addCheckpoint: '체크포인트 추가',
    moveCheckpoint: '체크포인트 이동',
    deleteCheckpoint: '체크포인트 삭제'
  };
  const statusEl = document.getElementById('status');
  if (statusEl) {
    const modeName = modeNames[editor.mode] || editor.mode;
    statusEl.textContent = `모드: ${modeName} | 포인트: ${editor.points.length}개 | 체크포인트: ${editor.checkpoints.length}개`;
  }
};

// 줌 인
TrackEditorUIManager.zoomIn = function(editor) {
  const centerX = editor.canvas.width / 2;
  const centerY = editor.canvas.height / 2;
  const worldBefore = editor.canvasToWorld(centerX, centerY);
  
  editor.zoom = Math.min(5, editor.zoom * 1.2);
  
  const worldAfter = editor.canvasToWorld(centerX, centerY);
  editor.offsetX += (worldBefore.x - worldAfter.x) * editor.zoom;
  editor.offsetY += (worldBefore.y - worldAfter.y) * editor.zoom;
  
  editor.saveToStorage(); // 저장
  editor.render();
};

// 줌 아웃
TrackEditorUIManager.zoomOut = function(editor) {
  const centerX = editor.canvas.width / 2;
  const centerY = editor.canvas.height / 2;
  const worldBefore = editor.canvasToWorld(centerX, centerY);
  
  editor.zoom = Math.max(0.1, editor.zoom / 1.2);
  
  const worldAfter = editor.canvasToWorld(centerX, centerY);
  editor.offsetX += (worldBefore.x - worldAfter.x) * editor.zoom;
  editor.offsetY += (worldBefore.y - worldAfter.y) * editor.zoom;
  
  editor.saveToStorage(); // 저장
  editor.render();
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorUIManager = TrackEditorUIManager;
}

