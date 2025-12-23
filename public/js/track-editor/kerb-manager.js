// TrackEditor 연석 관리 함수들
// 이 함수들은 TrackEditor 클래스의 메서드로 사용됩니다.

const TrackEditorKerbManager = {};

// 연석 추가
TrackEditorKerbManager.addKerb = function(editor, x, y, length = 300) {
  // 트랙 경계를 따라 경로 기반 연석 추가
  console.log('addKerb called:', { x, y, length });
  
  const boundary = editor.findNearestTrackBoundary(x, y, length);
  if (!boundary || !boundary.kerbPath || boundary.kerbPath.length < 2) {
    console.warn('Unable to create kerb: no valid path found');
    return;
  }
  
  editor.curbs.push({ 
    centerPath: boundary.kerbPath, // 연석의 중심 경로
    width: 20, // 연석의 두께 (폭)
    length: length, // 연석의 길이
    trackSide: boundary.isInner ? 'inner' : 'outer'
  });
  
  editor.selectedKerbIndex = editor.curbs.length - 1;
  editor.selectedPointIndex = -1;
  editor.selectedCheckpointIndex = -1;
  editor.updatePointList();
  editor.updateSelectedPointInfo();
  editor.updateCheckpointList();
  editor.updateSelectedCheckpointInfo();
  editor.updateKerbList();
  editor.updateSelectedKerbInfo();
  editor.updateCodeOutput();
  editor.saveToStorage();
  editor.render();
  console.log('Kerb added, total curbs:', editor.curbs.length);
};

// 연석 삭제
TrackEditorKerbManager.deleteKerb = function(editor, index) {
  editor.curbs.splice(index, 1);
  if (editor.selectedKerbIndex >= editor.curbs.length) {
    editor.selectedKerbIndex = editor.curbs.length - 1;
  }
  editor.updateKerbList();
  editor.updateSelectedKerbInfo();
  editor.updateCodeOutput();
  editor.saveToStorage();
  editor.render();
};

// 연석 선택
TrackEditorKerbManager.selectKerb = function(editor, index) {
  editor.selectedKerbIndex = index;
  editor.selectedPointIndex = -1;
  editor.selectedCheckpointIndex = -1;
  editor.updatePointList();
  editor.updateSelectedPointInfo();
  editor.updateCheckpointList();
  editor.updateSelectedCheckpointInfo();
  editor.updateKerbList();
  editor.updateSelectedKerbInfo();
  editor.render();
};

// 연석 이동 (세밀한 조정) - 드래그 이동용
TrackEditorKerbManager.moveKerbDirect = function(editor, index, deltaX, deltaY, isFineTuning = false) {
  if (index < 0 || index >= editor.curbs.length) return;
  
  const kerb = editor.curbs[index];
  
  // 세밀 조정 모드일 때 이동량을 1/5로 줄임
  const movementScale = isFineTuning ? 0.2 : 1.0;
  const actualDeltaX = deltaX * movementScale;
  const actualDeltaY = deltaY * movementScale;
  
  // 경로 기반 연석
  if (kerb.centerPath && kerb.centerPath.length > 0) {
    // 모든 경로 포인트를 직접 이동 (트랙 경계를 따르지 않음)
    kerb.centerPath = kerb.centerPath.map(point => ({
      x: point.x + actualDeltaX,
      y: point.y + actualDeltaY
    }));
  }
  // 구형 포맷
  else if (kerb.x !== undefined && kerb.y !== undefined) {
    kerb.x += actualDeltaX;
    kerb.y += actualDeltaY;
  }
  
  editor.updateSelectedKerbInfo();
  editor.updateCodeOutput();
  editor.saveToStorage();
  editor.render();
};

// 연석을 트랙 경계에 스냅 (필요시 사용)
TrackEditorKerbManager.snapKerbToTrackBoundary = function(editor, index) {
  if (index < 0 || index >= editor.curbs.length) return;
  
  const kerb = editor.curbs[index];
  
  if (kerb.centerPath && kerb.centerPath.length > 0) {
    const midIdx = Math.floor(kerb.centerPath.length / 2);
    const midPoint = kerb.centerPath[midIdx];
    const kerbLength = kerb.length || 300;
    
    // 현재 중심점에서 가장 가까운 트랙 경계로 스냅
    const boundary = editor.findNearestTrackBoundary(midPoint.x, midPoint.y, kerbLength, false);
    
    if (boundary && boundary.kerbPath && boundary.kerbPath.length >= 2) {
      editor.curbs[index] = {
        centerPath: boundary.kerbPath,
        width: kerb.width || 20,
        length: kerbLength,
        trackSide: boundary.isInner ? 'inner' : 'outer'
      };
      
      editor.updateSelectedKerbInfo();
      editor.updateCodeOutput();
      editor.saveToStorage();
      editor.render();
    }
  }
};

// 연석 위치 미세 조정 (키보드 화살표 키 사용)
TrackEditorKerbManager.adjustKerbPosition = function(editor, direction, isFineTuning = false) {
  if (editor.selectedKerbIndex < 0 || editor.selectedKerbIndex >= editor.curbs.length) {
    return;
  }
  
  // 기본 이동 단위 (픽셀)
  const baseStep = isFineTuning ? 1 : 5;
  
  let deltaX = 0;
  let deltaY = 0;
  
  switch(direction) {
    case 'left':
      deltaX = -baseStep;
      break;
    case 'right':
      deltaX = baseStep;
      break;
    case 'up':
      deltaY = -baseStep;
      break;
    case 'down':
      deltaY = baseStep;
      break;
  }
  
  editor.moveKerb(editor.selectedKerbIndex, deltaX, deltaY, false);
};

// 연석 목록 업데이트
TrackEditorKerbManager.updateKerbList = function(editor) {
  const list = document.getElementById('kerbList');
  if (!list) return;
  
  if (editor.curbs.length === 0) {
    list.innerHTML = '<div style="color: #666; font-size: 11px; text-align: center; padding: 20px;">연석을 추가하려면 연석 추가 모드를 선택하세요</div>';
    return;
  }

  list.innerHTML = editor.curbs.map((kerb, i) => {
    let displayInfo = '';
    if (kerb.centerPath && kerb.centerPath.length > 0) {
      // 경로 기반 연석
      const midIdx = Math.floor(kerb.centerPath.length / 2);
      const midPoint = kerb.centerPath[midIdx];
      displayInfo = `
        <span>연석 ${i + 1}</span>
        <span class="point-coords">${kerb.trackSide === 'inner' ? '내부' : '외부'}</span>
        <span style="font-size: 10px; color: #ff9500;">
          ${kerb.length || 300}px
        </span>
      `;
    } else {
      // 구형 포맷
      displayInfo = `
        <span>연석 ${i + 1}</span>
        <span class="point-coords">(${kerb.x}, ${kerb.y})</span>
        <span style="font-size: 10px; color: #ff9500;">
          ${kerb.width || 200}px
        </span>
      `;
    }
    
    return `
      <div class="point-item ${i === editor.selectedKerbIndex ? 'selected' : ''}" 
           data-kerb-index="${i}">
        ${displayInfo}
        <div class="point-actions">
          <button class="delete-kerb-btn" data-kerb-index="${i}">삭제</button>
        </div>
      </div>
    `;
  }).join('');
  
  // 이벤트 리스너 추가
  list.querySelectorAll('.point-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('delete-kerb-btn')) {
        const index = parseInt(item.dataset.kerbIndex);
        editor.selectKerb(index);
      }
    });
  });
  
  // 삭제 버튼 이벤트 리스너
  list.querySelectorAll('.delete-kerb-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.kerbIndex);
      editor.deleteKerb(index);
    });
  });
};

// 선택된 연석 정보 업데이트
TrackEditorKerbManager.updateSelectedKerbInfo = function(editor) {
  const infoDiv = document.getElementById('selectedKerbInfo');
  if (!infoDiv) return;
  
  const editGroup = document.getElementById('kerbEditGroup');
  const editGroup2 = document.getElementById('kerbEditGroup2');
  const editGroup3 = document.getElementById('kerbEditGroup3');
  const editGroup4 = document.getElementById('kerbEditGroup4');
  const editGroup5 = document.getElementById('kerbEditGroup5');

  if (editor.selectedKerbIndex >= 0 && editor.selectedKerbIndex < editor.curbs.length) {
    const kerb = editor.curbs[editor.selectedKerbIndex];
    
    // 경로 기반 연석
    if (kerb.centerPath && kerb.centerPath.length > 0) {
      const sideText = kerb.trackSide === 'inner' ? '내부' : '외부';
      const widthText = kerb.width || 20;
      const lengthText = kerb.length || 300;
      const midIdx = Math.floor(kerb.centerPath.length / 2);
      const midPoint = kerb.centerPath[midIdx];
      
      infoDiv.innerHTML = `
        연석 ${editor.selectedKerbIndex + 1}: ${sideText} | 폭: ${widthText}px, 길이: ${lengthText}px<br>
        <span style="font-size: 10px; color: #888;">
          위치: (${Math.round(midPoint.x)}, ${Math.round(midPoint.y)}) | 
          방향키로 이동 (Shift: 1px, 일반: 5px)
        </span>
      `;
      
      // 길이 조절만 가능하도록 (위치는 드래그로)
      if (document.getElementById('kerbLength')) {
        document.getElementById('kerbLength').value = lengthText;
      }
      // 다른 필드들은 숨기거나 비활성화
      if (editGroup) editGroup.style.display = 'none';
      if (editGroup2) editGroup2.style.display = 'none';
      if (editGroup3) editGroup3.style.display = 'none';
      if (editGroup4) editGroup4.style.display = 'none';
      if (editGroup5) editGroup5.style.display = 'block'; // 길이만 표시
    }
    // 구형 포맷
    else if (kerb.x !== undefined && kerb.y !== undefined) {
      const angleDeg = ((kerb.angle || 0) * 180 / Math.PI).toFixed(1);
      infoDiv.innerHTML = `
        연석 ${editor.selectedKerbIndex + 1}: (${kerb.x}, ${kerb.y}) [${angleDeg}°] 길이: ${kerb.width || 200}px<br>
        <span style="font-size: 10px; color: #888;">
          방향키로 이동 (Shift: 1px, 일반: 5px)
        </span>
      `;
      if (document.getElementById('kerbX')) document.getElementById('kerbX').value = kerb.x;
      if (document.getElementById('kerbY')) document.getElementById('kerbY').value = kerb.y;
      if (document.getElementById('kerbAngle')) document.getElementById('kerbAngle').value = (kerb.angle || 0).toFixed(3);
      if (document.getElementById('kerbAngleDeg')) document.getElementById('kerbAngleDeg').value = Math.round((kerb.angle || 0) * 180 / Math.PI);
      if (document.getElementById('kerbLength')) document.getElementById('kerbLength').value = kerb.width || 200;
      if (editGroup) editGroup.style.display = 'block';
      if (editGroup2) editGroup2.style.display = 'block';
      if (editGroup3) editGroup3.style.display = 'block';
      if (editGroup4) editGroup4.style.display = 'block';
      if (editGroup5) editGroup5.style.display = 'block';
    }
  } else {
    infoDiv.textContent = '연석을 선택하세요';
    if (editGroup) editGroup.style.display = 'none';
    if (editGroup2) editGroup2.style.display = 'none';
    if (editGroup3) editGroup3.style.display = 'none';
    if (editGroup4) editGroup4.style.display = 'none';
    if (editGroup5) editGroup5.style.display = 'none';
  }
};

// 선택된 연석 업데이트
TrackEditorKerbManager.updateSelectedKerb = function(editor) {
  if (editor.selectedKerbIndex >= 0 && editor.selectedKerbIndex < editor.curbs.length) {
    const currentKerb = editor.curbs[editor.selectedKerbIndex];
    const length = parseFloat(document.getElementById('kerbLength')?.value || 300);
    
    // 경로 기반 연석
    if (currentKerb.centerPath && currentKerb.centerPath.length > 0) {
      if (!isNaN(length) && length > 0) {
        // 길이만 변경 (중심점 유지하면서 경로 재생성)
        const midIdx = Math.floor(currentKerb.centerPath.length / 2);
        const midPoint = currentKerb.centerPath[midIdx];
        
        // 중심점 기준으로 새 경로 생성
        const boundary = editor.findNearestTrackBoundary(midPoint.x, midPoint.y, length);
        if (boundary && boundary.kerbPath && boundary.kerbPath.length >= 2) {
          editor.curbs[editor.selectedKerbIndex] = {
            centerPath: boundary.kerbPath,
            width: currentKerb.width || 20,
            length: length,
            trackSide: boundary.isInner ? 'inner' : 'outer'
          };
        } else {
          // 경로 생성 실패 시 길이만 업데이트
          currentKerb.length = length;
        }
      }
    }
    // 구형 포맷
    else if (currentKerb.x !== undefined && currentKerb.y !== undefined) {
      const x = parseFloat(document.getElementById('kerbX')?.value || currentKerb.x);
      const y = parseFloat(document.getElementById('kerbY')?.value || currentKerb.y);
      const angle = parseFloat(document.getElementById('kerbAngle')?.value || currentKerb.angle || 0);
      if (!isNaN(x) && !isNaN(y) && !isNaN(angle) && !isNaN(length)) {
        editor.curbs[editor.selectedKerbIndex] = { 
          x, 
          y, 
          angle, 
          width: length,
          height: currentKerb.height || 20
        };
      }
    }
    
    editor.updateSelectedKerbInfo();
    editor.updateCodeOutput();
    editor.saveToStorage();
    editor.render();
  }
};

// 전역 스코프에 노출
if (typeof window !== 'undefined') {
  window.TrackEditorKerbManager = TrackEditorKerbManager;
}