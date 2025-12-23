// TrackEditor 체크포인트 관리 함수들
// 이 함수들은 TrackEditor 클래스의 메서드로 사용됩니다.

const TrackEditorCheckpointManager = {};

// 체크포인트 추가
TrackEditorCheckpointManager.addCheckpoint = function(editor, x, y, angle = 0) {
  editor.checkpoints.push({ x, y, angle });
  editor.selectedCheckpointIndex = editor.checkpoints.length - 1;
  editor.selectedPointIndex = -1;
  editor.updatePointList();
  editor.updateSelectedPointInfo();
  editor.updateCheckpointList();
  editor.updateSelectedCheckpointInfo();
  editor.updateCodeOutput();
  editor.saveToStorage();
  editor.render();
};

// 체크포인트 삭제
TrackEditorCheckpointManager.deleteCheckpoint = function(editor, index) {
  editor.checkpoints.splice(index, 1);
  if (editor.selectedCheckpointIndex >= editor.checkpoints.length) {
    editor.selectedCheckpointIndex = editor.checkpoints.length - 1;
  }
  editor.updateCheckpointList();
  editor.updateSelectedCheckpointInfo();
  editor.updateCodeOutput();
  editor.saveToStorage();
  editor.render();
};

// 체크포인트 선택
TrackEditorCheckpointManager.selectCheckpoint = function(editor, index) {
  editor.selectedCheckpointIndex = index;
  editor.selectedPointIndex = -1;
  editor.updatePointList();
  editor.updateSelectedPointInfo();
  editor.updateCheckpointList();
  editor.updateSelectedCheckpointInfo();
  editor.render();
};

// 선택된 체크포인트 업데이트
TrackEditorCheckpointManager.updateSelectedCheckpoint = function(editor) {
  if (editor.selectedCheckpointIndex >= 0) {
    const x = parseFloat(document.getElementById('checkpointX').value);
    const y = parseFloat(document.getElementById('checkpointY').value);
    const angle = parseFloat(document.getElementById('checkpointAngle').value);
    if (!isNaN(x) && !isNaN(y) && !isNaN(angle)) {
      editor.checkpoints[editor.selectedCheckpointIndex] = { x, y, angle };
      editor.updateSelectedCheckpointInfo();
      editor.updateCodeOutput();
      editor.saveToStorage();
      editor.render();
    }
  }
};

// 선택된 체크포인트 정보 업데이트
TrackEditorCheckpointManager.updateSelectedCheckpointInfo = function(editor) {
  const infoDiv = document.getElementById('selectedCheckpointInfo');
  if (!infoDiv) return;
  
  const editGroup = document.getElementById('checkpointEditGroup');
  const editGroup2 = document.getElementById('checkpointEditGroup2');
  const editGroup3 = document.getElementById('checkpointEditGroup3');
  const editGroup4 = document.getElementById('checkpointEditGroup4');

  if (editor.selectedCheckpointIndex >= 0 && editor.selectedCheckpointIndex < editor.checkpoints.length) {
    const cp = editor.checkpoints[editor.selectedCheckpointIndex];
    const angleDeg = (cp.angle * 180 / Math.PI).toFixed(1);
    infoDiv.textContent = `체크포인트 ${editor.selectedCheckpointIndex + 1}: (${cp.x}, ${cp.y}) [${angleDeg}°]`;
    if (document.getElementById('checkpointX')) document.getElementById('checkpointX').value = cp.x;
    if (document.getElementById('checkpointY')) document.getElementById('checkpointY').value = cp.y;
    if (document.getElementById('checkpointAngle')) document.getElementById('checkpointAngle').value = cp.angle.toFixed(3);
    if (document.getElementById('checkpointAngleDeg')) document.getElementById('checkpointAngleDeg').value = Math.round(cp.angle * 180 / Math.PI);
    if (editGroup) editGroup.style.display = 'block';
    if (editGroup2) editGroup2.style.display = 'block';
    if (editGroup3) editGroup3.style.display = 'block';
    if (editGroup4) editGroup4.style.display = 'block';
  } else {
    infoDiv.textContent = '체크포인트를 선택하세요';
    if (editGroup) editGroup.style.display = 'none';
    if (editGroup2) editGroup2.style.display = 'none';
    if (editGroup3) editGroup3.style.display = 'none';
    if (editGroup4) editGroup4.style.display = 'none';
  }
};

// 체크포인트 목록 업데이트
TrackEditorCheckpointManager.updateCheckpointList = function(editor) {
  const list = document.getElementById('checkpointList');
  if (!list) return;
  
  if (editor.checkpoints.length === 0) {
    list.innerHTML = '<div style="color: #666; font-size: 11px; text-align: center; padding: 20px;">체크포인트를 추가하려면 체크포인트 추가 모드를 선택하세요</div>';
    return;
  }

  list.innerHTML = editor.checkpoints.map((cp, i) => `
    <div class="point-item ${i === editor.selectedCheckpointIndex ? 'selected' : ''}" 
         data-checkpoint-index="${i}">
      <span>체크포인트 ${i + 1}</span>
      <span class="point-coords">(${cp.x}, ${cp.y})</span>
      <span style="font-size: 10px; color: #ffd700;">
        ${(cp.angle * 180 / Math.PI).toFixed(0)}°
      </span>
      <div class="point-actions">
        <button class="delete-checkpoint-btn" data-checkpoint-index="${i}">삭제</button>
      </div>
    </div>
  `).join('');
  
  // 이벤트 리스너 추가
  list.querySelectorAll('.point-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // 삭제 버튼 클릭이 아닌 경우에만 체크포인트 선택
      if (!e.target.classList.contains('delete-checkpoint-btn')) {
        const index = parseInt(item.dataset.checkpointIndex);
        editor.selectCheckpoint(index);
      }
    });
  });
  
  // 삭제 버튼 이벤트 리스너
  list.querySelectorAll('.delete-checkpoint-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.checkpointIndex);
      editor.deleteCheckpoint(index);
    });
  });
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorCheckpointManager = TrackEditorCheckpointManager;
}

