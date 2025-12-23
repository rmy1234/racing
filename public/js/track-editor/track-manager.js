// TrackEditor 트랙 관리 함수들
const TrackEditorTrackManager = {};

// localStorage에 저장
TrackEditorTrackManager.saveToStorage = function(editor) {
  try {
    localStorage.setItem('trackEditor_points', JSON.stringify(editor.points));
    localStorage.setItem('trackEditor_checkpoints', JSON.stringify(editor.checkpoints));
    localStorage.setItem('trackEditor_curbs', JSON.stringify(editor.curbs));
    localStorage.setItem('trackEditor_spawnPositions', JSON.stringify(editor.spawnPositions));
    localStorage.setItem('trackEditor_spawnAngle', editor.spawnAngle.toString());
    localStorage.setItem('trackEditor_startLine', JSON.stringify(editor.startLine));
    localStorage.setItem('trackEditor_trackName', document.getElementById('trackName').value);
    localStorage.setItem('trackEditor_trackId', document.getElementById('trackId').value);
    localStorage.setItem('trackEditor_mapWidth', document.getElementById('mapWidth').value);
    localStorage.setItem('trackEditor_mapHeight', document.getElementById('mapHeight').value);
    localStorage.setItem('trackEditor_selectedPointIndex', editor.selectedPointIndex.toString());
    localStorage.setItem('trackEditor_selectedCheckpointIndex', editor.selectedCheckpointIndex.toString());
    localStorage.setItem('trackEditor_selectedKerbIndex', editor.selectedKerbIndex.toString());
    localStorage.setItem('trackEditor_selectedSpawnIndex', editor.selectedSpawnIndex.toString());
    localStorage.setItem('trackEditor_zoom', editor.zoom.toString());
    localStorage.setItem('trackEditor_offsetX', editor.offsetX.toString());
    localStorage.setItem('trackEditor_offsetY', editor.offsetY.toString());
    localStorage.setItem('trackEditor_previewMode', editor.previewMode.toString());
    localStorage.setItem('trackEditor_mode', editor.mode);
  } catch (e) {
    console.warn('저장 실패:', e);
  }
};

// localStorage에서 복원
TrackEditorTrackManager.loadFromStorage = function(editor) {
  try {
    const savedPoints = localStorage.getItem('trackEditor_points');
    if (savedPoints) {
      editor.points = JSON.parse(savedPoints);
      // 경로 캐시 무효화 (포인트가 로드됨)
      editor.invalidatePathCache();
    }
    
    const savedCheckpoints = localStorage.getItem('trackEditor_checkpoints');
    if (savedCheckpoints) {
      editor.checkpoints = JSON.parse(savedCheckpoints);
    }
    
    const savedCurbs = localStorage.getItem('trackEditor_curbs');
    if (savedCurbs) {
      editor.curbs = JSON.parse(savedCurbs);
    }
    
    const savedSpawnPositions = localStorage.getItem('trackEditor_spawnPositions');
    if (savedSpawnPositions) {
      editor.spawnPositions = JSON.parse(savedSpawnPositions);
    }
    
    const savedSpawnAngle = localStorage.getItem('trackEditor_spawnAngle');
    if (savedSpawnAngle) {
      editor.spawnAngle = parseFloat(savedSpawnAngle);
      if (document.getElementById('spawnAngle')) document.getElementById('spawnAngle').value = editor.spawnAngle.toFixed(3);
      if (document.getElementById('spawnAngleDeg')) document.getElementById('spawnAngleDeg').value = Math.round(editor.spawnAngle * 180 / Math.PI);
    }
    
    const savedStartLine = localStorage.getItem('trackEditor_startLine');
    if (savedStartLine) {
      editor.startLine = JSON.parse(savedStartLine);
    } else if (editor.points.length > 0) {
      // 저장된 값이 없으면 첫 번째 포인트 위치를 기본값으로 사용
      editor.startLine = {
        x: editor.points[0].x,
        y: editor.points[0].y,
        angle: 0
      };
    }
    
    // 시작선 입력 필드에 값 설정
    if (document.getElementById('startLineX')) document.getElementById('startLineX').value = editor.startLine.x || 0;
    if (document.getElementById('startLineY')) document.getElementById('startLineY').value = editor.startLine.y || 0;
    if (document.getElementById('startLineAngle')) document.getElementById('startLineAngle').value = (editor.startLine.angle || 0).toFixed(3);
    if (document.getElementById('startLineAngleDeg')) document.getElementById('startLineAngleDeg').value = Math.round((editor.startLine.angle || 0) * 180 / Math.PI);
    
    const trackName = localStorage.getItem('trackEditor_trackName');
    const trackId = localStorage.getItem('trackEditor_trackId');
    const mapWidth = localStorage.getItem('trackEditor_mapWidth');
    const mapHeight = localStorage.getItem('trackEditor_mapHeight');
    const selectedIndex = localStorage.getItem('trackEditor_selectedPointIndex');
    const selectedCheckpointIndex = localStorage.getItem('trackEditor_selectedCheckpointIndex');
    const selectedKerbIndex = localStorage.getItem('trackEditor_selectedKerbIndex');
    const selectedSpawnIndex = localStorage.getItem('trackEditor_selectedSpawnIndex');
    
    if (trackName) document.getElementById('trackName').value = trackName;
    if (trackId) document.getElementById('trackId').value = trackId;
    if (mapWidth) document.getElementById('mapWidth').value = mapWidth;
    if (mapHeight) document.getElementById('mapHeight').value = mapHeight;
    if (selectedIndex) editor.selectedPointIndex = parseInt(selectedIndex, 10);
    if (selectedCheckpointIndex) editor.selectedCheckpointIndex = parseInt(selectedCheckpointIndex, 10);
    if (selectedKerbIndex) editor.selectedKerbIndex = parseInt(selectedKerbIndex, 10);
    if (selectedSpawnIndex) editor.selectedSpawnIndex = parseInt(selectedSpawnIndex, 10);
    
    // 미리보기 모드 복원
    const savedPreviewMode = localStorage.getItem('trackEditor_previewMode');
    if (savedPreviewMode === 'true') {
      editor.previewMode = true;
      const previewBtn = document.getElementById('previewBtn');
      if (previewBtn) {
        previewBtn.classList.add('active');
      }
    }
    
    // 모드 복원 (버튼 상태 업데이트는 setupEventListeners 이후에 수행)
    const savedMode = localStorage.getItem('trackEditor_mode');
    if (savedMode) {
      editor.mode = savedMode;
    }
    
    // 카메라 위치(오프셋)와 줌 복원
    const savedZoom = localStorage.getItem('trackEditor_zoom');
    const savedOffsetX = localStorage.getItem('trackEditor_offsetX');
    const savedOffsetY = localStorage.getItem('trackEditor_offsetY');
    if (savedZoom && savedOffsetX !== null && savedOffsetY !== null) {
      editor.zoom = parseFloat(savedZoom);
      editor.offsetX = parseFloat(savedOffsetX);
      editor.offsetY = parseFloat(savedOffsetY);
    }
    
    if (editor.points.length > 0) {
      editor.updatePointList();
      editor.updateSelectedPointInfo();
    }
    if (editor.checkpoints.length > 0) {
      editor.updateCheckpointList();
      editor.updateSelectedCheckpointInfo();
    }
    if (editor.curbs.length > 0) {
      editor.updateKerbList();
      editor.updateSelectedKerbInfo();
    }
    
    if (editor.spawnPositions.length > 0) {
      editor.updateSpawnList();
      editor.updateSelectedSpawnInfo();
    }
    
    if (editor.checkpoints.length > 0) {
      editor.updateCheckpointList();
      editor.updateSelectedCheckpointInfo();
    }
  } catch (e) {
    console.warn('복원 실패:', e);
  }
};

// 뷰 초기화 (맵을 화면 중앙에 맞추기)
TrackEditorTrackManager.resetView = function(editor, skipSave = false) {
  const width = parseInt(document.getElementById('mapWidth')?.value || '4500') || 4500;
  const height = parseInt(document.getElementById('mapHeight')?.value || '3000') || 3000;
  
  // 맵을 화면 중앙에 맞추기
  const scaleX = editor.canvas.width / width;
  const scaleY = editor.canvas.height / height;
  editor.zoom = Math.min(scaleX, scaleY) * 0.9; // 약간의 여유 공간
  
  editor.offsetX = (editor.canvas.width - width * editor.zoom) / 2;
  editor.offsetY = (editor.canvas.height - height * editor.zoom) / 2;
  
  // 초기 로드 시에는 저장하지 않음 (사용자가 명시적으로 resetView 버튼을 누른 경우에만 저장)
  if (!skipSave) {
    editor.saveToStorage(); // 줌 상태 저장
  }
  editor.render();
};

// 새 트랙 생성
TrackEditorTrackManager.newTrack = function(editor) {
  // 현재 작업이 있으면 확인
  if (editor.points.length > 0 || editor.checkpoints.length > 0 || editor.curbs.length > 0 || document.getElementById('trackId').value !== 'new-track') {
    if (!confirm('현재 작업 중인 트랙이 있습니다. 새 트랙을 만들면 모든 데이터가 초기화됩니다. 계속하시겠습니까?')) {
      return;
    }
  }
  
  // 포인트 초기화
  editor.points = [];
  editor.selectedPointIndex = -1;
  editor.invalidatePathCache(); // 캐시 무효화
  
  // 체크포인트 초기화
  editor.checkpoints = [];
  editor.selectedCheckpointIndex = -1;
  
  // 연석 초기화
  editor.curbs = [];
  editor.selectedKerbIndex = -1;
  
  // 시작선 초기화
  editor.startLine = { x: 0, y: 0, angle: 0 };
  if (document.getElementById('startLineX')) document.getElementById('startLineX').value = 0;
  if (document.getElementById('startLineY')) document.getElementById('startLineY').value = 0;
  if (document.getElementById('startLineAngle')) document.getElementById('startLineAngle').value = '0.000';
  if (document.getElementById('startLineAngleDeg')) document.getElementById('startLineAngleDeg').value = '0';
  
  // 출발 위치 초기화
  editor.spawnPositions = [];
  editor.selectedSpawnIndex = -1;
  editor.spawnAngle = 0;
  if (document.getElementById('spawnX')) document.getElementById('spawnX').value = '';
  if (document.getElementById('spawnY')) document.getElementById('spawnY').value = '';
  if (document.getElementById('spawnAngle')) document.getElementById('spawnAngle').value = '0';
  if (document.getElementById('spawnAngleDeg')) document.getElementById('spawnAngleDeg').value = '0';
  
  // 트랙 정보 초기화
  document.getElementById('trackName').value = '새 트랙';
  document.getElementById('trackId').value = 'new-track';
  document.getElementById('mapWidth').value = '4500';
  document.getElementById('mapHeight').value = '3000';
  
  // 모드를 포인트 추가 모드로 변경
  editor.setMode('add');
  
  // 뷰 초기화
  editor.resetView();
  
  // UI 업데이트
  editor.updatePointList();
  editor.updateSelectedPointInfo();
  editor.updateCheckpointList();
  editor.updateSelectedCheckpointInfo();
  editor.updateSpawnList();
  editor.updateSelectedSpawnInfo();
  editor.updateCodeOutput();
  editor.saveToStorage(); // 저장
  editor.render();
};

// 트랙 초기화 (clearTrack)
TrackEditorTrackManager.clearTrack = function(editor) {
  if (confirm('모든 트랙 데이터를 초기화하시겠습니까?\n(포인트, 체크포인트, 연석, 시작선, 출발 위치, 트랙 정보가 모두 초기화됩니다)')) {
    // 포인트 초기화
    editor.points = [];
    editor.selectedPointIndex = -1;
    
    // 체크포인트 초기화
    editor.checkpoints = [];
    editor.selectedCheckpointIndex = -1;
    
    // 연석 초기화
    editor.curbs = [];
    editor.selectedKerbIndex = -1;
    
    // 시작선 초기화
    editor.startLine = { x: 0, y: 0, angle: 0 };
    if (document.getElementById('startLineX')) document.getElementById('startLineX').value = 0;
    if (document.getElementById('startLineY')) document.getElementById('startLineY').value = 0;
    if (document.getElementById('startLineAngle')) document.getElementById('startLineAngle').value = '0.000';
    if (document.getElementById('startLineAngleDeg')) document.getElementById('startLineAngleDeg').value = '0';
    
    // 출발 위치 초기화
    editor.spawnPositions = [];
    editor.selectedSpawnIndex = -1;
    editor.spawnAngle = 0;
    if (document.getElementById('spawnX')) document.getElementById('spawnX').value = '';
    if (document.getElementById('spawnY')) document.getElementById('spawnY').value = '';
    if (document.getElementById('spawnAngle')) document.getElementById('spawnAngle').value = '0';
    if (document.getElementById('spawnAngleDeg')) document.getElementById('spawnAngleDeg').value = '0';
    
    // 트랙 정보 초기화
    document.getElementById('trackName').value = '새 트랙';
    document.getElementById('trackId').value = 'new-track';
    document.getElementById('mapWidth').value = '4500';
    document.getElementById('mapHeight').value = '3000';
    
    // 뷰 초기화
    editor.resetView();
    
    // UI 업데이트
    editor.updatePointList();
    editor.updateSelectedPointInfo();
    editor.updateCheckpointList();
    editor.updateSelectedCheckpointInfo();
    editor.updateKerbList();
    editor.updateSelectedKerbInfo();
    editor.updateSpawnList();
    editor.updateSelectedSpawnInfo();
    editor.updateCodeOutput();
    editor.saveToStorage(); // 저장
    editor.render();
  }
};

// 트랙 로드
TrackEditorTrackManager.loadTrack = async function(editor) {
  const trackId = prompt('로드할 트랙 ID를 입력하세요 (basic-circuit 또는 monza):');
  if (!trackId) return;

  // 트랙 파일이 아직 로드되지 않았다면 로드 시도
  if (typeof window.getTrack === 'undefined' || typeof window.TRACKS === 'undefined') {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        // 이미 로드된 스크립트인지 확인
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };
    
    try {
      await Promise.all([
        loadScript('/js/track.js'),
        loadScript('/js/tracks/basic-circuit.js'),
        loadScript('/js/tracks/monza.js')
      ]);
      // 스크립트 로드 후 약간의 시간을 두어 registerTrack 호출 완료 대기
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      alert('트랙 파일 로드에 실패했습니다: ' + error);
      return;
    }
  }

  // 디버깅: TRACKS 상태 확인
  console.log('TRACKS:', window.TRACKS);
  console.log('getTrack 함수:', typeof window.getTrack);
  
  // 전역 getTrack 함수 사용 또는 직접 TRACKS에서 가져오기
  let trackData = null;
  if (typeof window.getTrack === 'function') {
    trackData = window.getTrack(trackId);
    console.log('getTrack 결과:', trackData);
  }
  
  // getTrack이 실패했거나 null을 반환한 경우 직접 TRACKS에서 확인
  if (!trackData && typeof window.TRACKS !== 'undefined') {
    const trackInfo = window.TRACKS[trackId];
    console.log('TRACKS에서 직접 가져오기:', trackInfo);
    if (trackInfo) {
      trackData = trackInfo.data;
    }
  }

  if (!trackData) {
    const availableTracks = typeof window.TRACKS !== 'undefined' 
      ? Object.keys(window.TRACKS).join(', ') 
      : '없음';
    alert(`트랙 '${trackId}'를 찾을 수 없습니다.\n\n사용 가능한 트랙: ${availableTracks}\n\n트랙이 로드되지 않았을 수 있습니다. 콘솔을 확인하세요.`);
    console.error('트랙 로드 실패:', {
      trackId,
      TRACKS: window.TRACKS,
      getTrack: typeof window.getTrack,
      trackData: trackData
    });
    return;
  }

  // 트랙 데이터를 편집기에 로드
  let centerPath = trackData.centerPath;
  
  // centerPath가 함수인 경우 호출
  if (typeof centerPath === 'function') {
    centerPath = centerPath();
  }
  
  if (centerPath && Array.isArray(centerPath) && centerPath.length > 0) {
    editor.points = centerPath.map(p => ({ 
      x: p.x, 
      y: p.y, 
      type: p.type || 'straight' 
    }));
    
    // 경로 캐시 무효화 (포인트가 변경됨)
    editor.invalidatePathCache();
    
    // 체크포인트 로드
    if (trackData.checkpoints && Array.isArray(trackData.checkpoints)) {
      editor.checkpoints = trackData.checkpoints.map(cp => ({
        x: cp.x,
        y: cp.y,
        angle: cp.angle || 0
      }));
    }
    
    // 연석 로드
    if (trackData.curbs && Array.isArray(trackData.curbs)) {
      editor.curbs = trackData.curbs.map(kerb => ({
        x: kerb.x,
        y: kerb.y,
        angle: kerb.angle || 0,
        width: kerb.width || 200,
        height: kerb.height || 20
      }));
    } else {
      editor.curbs = [];
    }
    
    // 트랙 정보 업데이트
    if (trackData.width) {
      document.getElementById('mapWidth').value = trackData.width;
    }
    if (trackData.height) {
      document.getElementById('mapHeight').value = trackData.height;
    }
    if (trackData.trackWidth) {
      document.getElementById('trackWidth').value = trackData.trackWidth;
    }
    if (trackData.name) {
      document.getElementById('trackName').value = trackData.name;
    }
    if (trackData.id) {
      document.getElementById('trackId').value = trackData.id;
    }
    
    editor.selectedPointIndex = -1;
    editor.selectedCheckpointIndex = -1;
    editor.updatePointList();
    editor.updateSelectedPointInfo();
    editor.updateCheckpointList();
    editor.updateSelectedCheckpointInfo();
    editor.updateCodeOutput();
    editor.saveToStorage(); // 저장
    editor.render();
    
    alert(`트랙 '${trackData.name || trackId}'가 로드되었습니다. (${editor.points.length}개 포인트, ${editor.checkpoints.length}개 체크포인트)`);
  } else {
    alert('트랙 데이터 형식이 올바르지 않습니다. centerPath가 없습니다.');
  }
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorTrackManager = TrackEditorTrackManager;
}

