// TrackEditor 출발 위치 관리 함수들
// 이 함수들은 TrackEditor 클래스의 메서드로 사용됩니다.

const TrackEditorSpawnManager = {};

// 출발 위치 추가
TrackEditorSpawnManager.addSpawn = function(editor, x, y) {
  editor.spawnPositions.push({ x, y });
  editor.selectedSpawnIndex = editor.spawnPositions.length - 1;
  editor.selectedPointIndex = -1;
  editor.selectedCheckpointIndex = -1;
  editor.selectedKerbIndex = -1;
  editor.updatePointList();
  editor.updateSelectedPointInfo();
  editor.updateCheckpointList();
  editor.updateSelectedCheckpointInfo();
  editor.updateKerbList();
  editor.updateSelectedKerbInfo();
  editor.updateSpawnList();
  editor.updateSelectedSpawnInfo();
  editor.updateCodeOutput();
  editor.saveToStorage();
  editor.render();
};

// 출발 위치 삭제
TrackEditorSpawnManager.deleteSpawn = function(editor, index) {
  editor.spawnPositions.splice(index, 1);
  if (editor.selectedSpawnIndex >= editor.spawnPositions.length) {
    editor.selectedSpawnIndex = editor.spawnPositions.length - 1;
  }
  editor.updateSpawnList();
  editor.updateSelectedSpawnInfo();
  editor.updateCodeOutput();
  editor.saveToStorage();
  editor.render();
};

// 출발 위치 선택
TrackEditorSpawnManager.selectSpawn = function(editor, index) {
  editor.selectedSpawnIndex = index;
  editor.selectedPointIndex = -1;
  editor.selectedCheckpointIndex = -1;
  editor.selectedKerbIndex = -1;
  editor.updatePointList();
  editor.updateSelectedPointInfo();
  editor.updateCheckpointList();
  editor.updateSelectedCheckpointInfo();
  editor.updateKerbList();
  editor.updateSelectedKerbInfo();
  editor.updateSpawnList();
  editor.updateSelectedSpawnInfo();
  editor.render();
};

// 출발 위치 목록 업데이트
TrackEditorSpawnManager.updateSpawnList = function(editor) {
  const list = document.getElementById('spawnList');
  if (!list) return;
  
  if (editor.spawnPositions.length === 0) {
    list.innerHTML = '<div style="color: #666; font-size: 11px; text-align: center; padding: 20px;">출발 위치를 추가하려면 출발 위치 추가 모드를 선택하세요</div>';
    return;
  }

  list.innerHTML = editor.spawnPositions.map((spawn, i) => `
    <div class="point-item ${i === editor.selectedSpawnIndex ? 'selected' : ''}" 
         data-spawn-index="${i}">
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div>
          <span>출발 위치 ${i + 1}</span>
          <span class="point-coords">(${Math.round(spawn.x)}, ${Math.round(spawn.y)})</span>
        </div>
        <button class="delete-kerb-btn" data-spawn-index="${i}">삭제</button>
      </div>
    </div>
  `).join('');

  // 클릭 이벤트
  list.querySelectorAll('.point-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('delete-kerb-btn')) {
        const index = parseInt(item.dataset.spawnIndex);
        editor.selectSpawn(index);
      }
    });
  });

  // 삭제 버튼 이벤트
  list.querySelectorAll('.delete-kerb-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.spawnIndex);
      editor.deleteSpawn(index);
    });
  });
};

// 선택된 출발 위치 정보 업데이트
TrackEditorSpawnManager.updateSelectedSpawnInfo = function(editor) {
  const infoDiv = document.getElementById('selectedSpawnInfo');
  const editGroup = document.getElementById('spawnEditGroup');
  const editGroup2 = document.getElementById('spawnEditGroup2');
  
  if (!infoDiv || !editGroup || !editGroup2) return;
  
  if (editor.selectedSpawnIndex >= 0 && editor.selectedSpawnIndex < editor.spawnPositions.length) {
    const spawn = editor.spawnPositions[editor.selectedSpawnIndex];
    infoDiv.textContent = `출발 위치 ${editor.selectedSpawnIndex + 1}: (${Math.round(spawn.x)}, ${Math.round(spawn.y)})`;
    editGroup.style.display = 'block';
    editGroup2.style.display = 'block';
    if (document.getElementById('spawnX')) document.getElementById('spawnX').value = spawn.x;
    if (document.getElementById('spawnY')) document.getElementById('spawnY').value = spawn.y;
  } else {
    infoDiv.textContent = '출발 위치를 선택하세요';
    editGroup.style.display = 'none';
    editGroup2.style.display = 'none';
  }
};

// 선택된 출발 위치 업데이트
TrackEditorSpawnManager.updateSelectedSpawn = function(editor) {
  if (editor.selectedSpawnIndex >= 0 && editor.selectedSpawnIndex < editor.spawnPositions.length) {
    const spawnX = document.getElementById('spawnX');
    const spawnY = document.getElementById('spawnY');
    if (spawnX && spawnY) {
      const x = parseFloat(spawnX.value);
      const y = parseFloat(spawnY.value);
      if (!isNaN(x) && !isNaN(y)) {
        editor.spawnPositions[editor.selectedSpawnIndex] = { x, y };
        editor.updateSpawnList();
        editor.updateSelectedSpawnInfo();
        editor.updateCodeOutput();
        editor.saveToStorage();
        editor.render();
      }
    }
  }
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorSpawnManager = TrackEditorSpawnManager;
}

