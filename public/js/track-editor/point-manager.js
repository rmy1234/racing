// TrackEditor 포인트 관리 함수들
// 이 함수들은 TrackEditor 클래스의 메서드로 사용됩니다.

const TrackEditorPointManager = {};

// 포인트 추가
TrackEditorPointManager.addPoint = function(editor, x, y) {
  // 기본값은 직선, 이전 포인트가 곡선이면 곡선으로 설정
  const type = editor.points.length > 0 && editor.points[editor.points.length - 1].type === 'curve' ? 'curve' : 'straight';
  editor.points.push({ x, y, type });
  editor.selectedPointIndex = editor.points.length - 1;
  editor.selectedCheckpointIndex = -1;
  
  // 경로 캐시 무효화 (포인트가 변경됨)
  editor.invalidatePathCache();
  
  // 첫 번째 포인트 추가 시 시작선 초기화
  if (editor.points.length === 1 && (!editor.startLine || (editor.startLine.x === 0 && editor.startLine.y === 0))) {
    editor.startLine = { x, y, angle: 0 };
    if (document.getElementById('startLineX')) document.getElementById('startLineX').value = x;
    if (document.getElementById('startLineY')) document.getElementById('startLineY').value = y;
    if (document.getElementById('startLineAngle')) document.getElementById('startLineAngle').value = '0.000';
    if (document.getElementById('startLineAngleDeg')) document.getElementById('startLineAngleDeg').value = '0';
  }
  
  editor.updatePointList();
  editor.updateSelectedPointInfo();
  editor.updateCheckpointList();
  editor.updateSelectedCheckpointInfo();
  editor.updateCodeOutput();
  editor.saveToStorage();
  editor.render();
};

// 포인트 삭제
TrackEditorPointManager.deletePoint = function(editor, index) {
  editor.points.splice(index, 1);
  if (editor.selectedPointIndex >= editor.points.length) {
    editor.selectedPointIndex = editor.points.length - 1;
  }
  
  // 경로 캐시 무효화 (포인트가 변경됨)
  editor.invalidatePathCache();
  
  editor.updatePointList();
  editor.updateSelectedPointInfo();
  editor.updateCodeOutput();
  editor.saveToStorage();
  editor.render();
};

// 포인트 선택
TrackEditorPointManager.selectPoint = function(editor, index) {
  editor.selectedPointIndex = index;
  editor.selectedCheckpointIndex = -1;
  editor.updatePointList();
  editor.updateSelectedPointInfo();
  editor.updateCheckpointList();
  editor.updateSelectedCheckpointInfo();
  editor.render();
};

// 선택된 포인트 업데이트
TrackEditorPointManager.updateSelectedPoint = function(editor) {
  if (editor.selectedPointIndex >= 0) {
    const x = parseFloat(document.getElementById('pointX').value);
    const y = parseFloat(document.getElementById('pointY').value);
    if (!isNaN(x) && !isNaN(y)) {
      const currentPoint = editor.points[editor.selectedPointIndex];
      editor.points[editor.selectedPointIndex] = { 
        x, 
        y, 
        type: currentPoint.type || 'straight' 
      };
      
      // 경로 캐시 무효화 (포인트 좌표가 변경됨)
      editor.invalidatePathCache();
      
      editor.updateCodeOutput();
      editor.saveToStorage();
      editor.render();
    }
  }
};

// 선택된 포인트 정보 업데이트
TrackEditorPointManager.updateSelectedPointInfo = function(editor) {
  const infoDiv = document.getElementById('selectedPointInfo');
  const editGroup = document.getElementById('pointEditGroup');
  const editGroup2 = document.getElementById('pointEditGroup2');
  const editGroup3 = document.getElementById('pointEditGroup3');

  if (editor.selectedPointIndex >= 0 && editor.selectedPointIndex < editor.points.length) {
    const p = editor.points[editor.selectedPointIndex];
    const typeText = p.type === 'curve' ? '곡선' : '직선';
    infoDiv.textContent = `포인트 ${editor.selectedPointIndex + 1}: (${p.x}, ${p.y}) [${typeText}]`;
    document.getElementById('pointX').value = p.x;
    document.getElementById('pointY').value = p.y;
    editGroup.style.display = 'block';
    editGroup2.style.display = 'block';
    editGroup3.style.display = 'block';
    
    // 타입 버튼 상태 업데이트
    const straightBtn = document.getElementById('setStraightBtn');
    const curveBtn = document.getElementById('setCurveBtn');
    straightBtn.classList.toggle('active', p.type === 'straight');
    curveBtn.classList.toggle('active', p.type === 'curve');
  } else {
    infoDiv.textContent = '포인트를 선택하세요';
    editGroup.style.display = 'none';
    editGroup2.style.display = 'none';
    editGroup3.style.display = 'none';
  }
};

// 포인트 타입 설정
TrackEditorPointManager.setPointType = function(editor, type) {
  if (editor.selectedPointIndex >= 0 && editor.selectedPointIndex < editor.points.length) {
    editor.points[editor.selectedPointIndex].type = type;
    
    // 경로 캐시 무효화 (포인트 타입이 변경됨)
    editor.invalidatePathCache();
    
    editor.updatePointList();
    editor.updateSelectedPointInfo();
    editor.updateCodeOutput();
    editor.saveToStorage();
    editor.render();
  }
};

// 포인트 목록 업데이트
TrackEditorPointManager.updatePointList = function(editor) {
  const list = document.getElementById('pointList');
  if (editor.points.length === 0) {
    list.innerHTML = '<div style="color: #666; font-size: 11px; text-align: center; padding: 20px;">포인트를 추가하려면 캔버스를 클릭하세요</div>';
    return;
  }

  list.innerHTML = editor.points.map((p, i) => `
    <div class="point-item ${i === editor.selectedPointIndex ? 'selected' : ''}" 
         data-point-index="${i}">
      <span>포인트 ${i + 1}</span>
      <span class="point-coords">(${p.x}, ${p.y})</span>
      <span style="font-size: 10px; color: ${p.type === 'curve' ? '#ff6b6b' : '#4ecdc4'};">
        ${p.type === 'curve' ? '곡선' : '직선'}
      </span>
      <div class="point-actions">
        <button class="delete-point-btn" data-point-index="${i}">삭제</button>
      </div>
    </div>
  `).join('');
  
  // 이벤트 리스너 추가
  list.querySelectorAll('.point-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // 삭제 버튼 클릭이 아닌 경우에만 포인트 선택
      if (!e.target.classList.contains('delete-point-btn')) {
        const index = parseInt(item.dataset.pointIndex);
        editor.selectPoint(index);
      }
    });
  });
  
  // 삭제 버튼 이벤트 리스너
  list.querySelectorAll('.delete-point-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.pointIndex);
      editor.deletePoint(index);
    });
  });
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorPointManager = TrackEditorPointManager;
}

