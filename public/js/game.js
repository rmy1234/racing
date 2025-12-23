// 메인 게임 컨트롤러
class Game {
  constructor() {
    this.network = new Network();
    this.renderer = null;
    this.canvas = null;
    this.gameLoop = null;
    
    this.currentRoom = null;
    this.localPlayerId = null;
    this.nickname = '';
    this.carColor = { r: 45, g: 108, b: 232 }; // 기본 색상 (파란색) - #2d6ce8
    this.selectedTrackId = 'basic-circuit'; // 기본 트랙

    this.gameState = null;
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    
    this.screens = {
      lobby: document.getElementById('lobby'),
      waitingRoom: document.getElementById('waitingRoom'),
      gameScreen: document.getElementById('gameScreen'),
      resultScreen: document.getElementById('resultScreen')
    };
    
    this.init();
  }
  
  async init() {
    try {
      // 서버 연결 시도 (재연결을 고려하여 에러 처리 개선)
      try {
        await this.network.connect();
      } catch (error) {
        // 연결 실패 시에도 게임은 계속 진행 (오프라인 모드 또는 재연결 대기)
        console.warn('Initial connection failed, but will retry:', error);
        // 사용자에게 알림만 표시하고 게임은 계속 진행
        // Socket.IO가 자동으로 재연결을 시도하므로 게임은 정상 작동할 수 있음
      }
      
      this.localPlayerId = this.network.playerId;
      
      this.canvas = document.getElementById('gameCanvas');
      this.renderer = new Renderer(this.canvas);
      
      // localStorage에서 데이터 복원
      this.loadFromStorage();
      
      this.setupEventListeners();
      this.setupNetworkListeners();
      
      // 연결이 성공한 경우에만 방 목록 요청
      if (this.network.connected) {
        this.network.getRooms();
      } else {
        // 연결되지 않았으면 잠시 후 재시도
        setTimeout(() => {
          if (this.network.connected) {
            this.network.getRooms();
          }
        }, 2000);
      }
      
      // 임시: 차량 미리보기 초기화 (추후 제거 예정)
      this.initCarPreview();
      
      // 색상 선택 UI 초기화
      this.setupColorPicker();
      
      // 트랙 선택 UI 초기화
      this.setupTrackSelector();
      
      console.log('Game initialized');
    } catch (error) {
      console.error('Failed to initialize game:', error);
      // 치명적인 에러가 아닌 경우에만 알림 표시
      if (error.message && error.message.includes('서버')) {
        // 서버 연결 관련 에러는 조용히 처리 (재연결 시도 중)
      } else {
        alert('게임 초기화 중 오류가 발생했습니다: ' + error.message);
      }
    }
  }
  
  // localStorage에 저장
  saveToStorage() {
    try {
      localStorage.setItem('game_nickname', this.nickname);
      localStorage.setItem('game_selectedTrackId', this.selectedTrackId);
      localStorage.setItem('game_carColor', JSON.stringify(this.carColor));
      
      // 현재 화면 저장
      const currentScreen = Object.keys(this.screens).find(key => 
        this.screens[key] && this.screens[key].classList.contains('active')
      );
      if (currentScreen) {
        localStorage.setItem('game_currentScreen', currentScreen);
      }
      
      // 현재 방 정보 저장
      if (this.currentRoom) {
        localStorage.setItem('game_currentRoom', JSON.stringify(this.currentRoom));
      }
      
      // 게임 상태 저장 (레이스 중인 경우)
      if (this.gameState) {
        localStorage.setItem('game_gameState', JSON.stringify(this.gameState));
      }
    } catch (e) {
      console.warn('저장 실패:', e);
    }
  }
  
  // localStorage에서 복원
  loadFromStorage() {
    try {
      const savedNickname = localStorage.getItem('game_nickname');
      const savedTrackId = localStorage.getItem('game_selectedTrackId');
      const savedCarColor = localStorage.getItem('game_carColor');
      const savedScreen = localStorage.getItem('game_currentScreen');
      
      if (savedNickname) {
        this.nickname = savedNickname;
        const nicknameInput = document.getElementById('nickname');
        if (nicknameInput) {
          nicknameInput.value = savedNickname;
        }
      }
      
      if (savedTrackId) {
        this.selectedTrackId = savedTrackId;
      }
      
      if (savedCarColor) {
        this.carColor = JSON.parse(savedCarColor);
        const colorPicker = document.getElementById('carColorPicker');
        if (colorPicker) {
          const color = this.carColor;
          const hexColor = `#${[color.r, color.g, color.b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('')}`;
          colorPicker.value = hexColor;
          this.updateCarPreview();
        }
      }
      
      // 화면 복원은 네트워크 연결 후에 처리
      if (savedScreen && savedScreen !== 'lobby') {
        // 방 정보 복원 시도
        const savedRoom = localStorage.getItem('game_currentRoom');
        if (savedRoom) {
          try {
            this.currentRoom = JSON.parse(savedRoom);
          } catch (e) {
            console.warn('방 정보 복원 실패:', e);
          }
        }
      }
    } catch (e) {
      console.warn('복원 실패:', e);
    }
  }
  
  // 트랙 선택 UI 설정
  setupTrackSelector() {
    const trackDropdown = document.getElementById('trackDropdown');
    const trackDropdownSelected = document.getElementById('trackDropdownSelected');
    const trackDropdownOptions = document.getElementById('trackDropdownOptions');
    const trackDropdownText = document.getElementById('trackDropdownText');
    const trackSelect = document.getElementById('trackSelect');
    
    if (!trackDropdown || !trackDropdownSelected || !trackDropdownOptions || !trackDropdownText) {
      return;
    }

    // 사용 가능한 트랙 목록 가져오기
    const tracks = getAvailableTracks();
    
    // 숨겨진 select에도 옵션 추가 (호환성)
    if (trackSelect) {
      tracks.forEach(track => {
        const option = document.createElement('option');
        option.value = track.id;
        option.textContent = track.name;
        trackSelect.appendChild(option);
      });
      trackSelect.value = this.selectedTrackId;
    }
    
    // 커스텀 드롭다운 옵션 생성
    tracks.forEach(track => {
      const option = document.createElement('div');
      option.className = 'custom-dropdown-option';
      option.dataset.value = track.id;
      option.textContent = track.name;
      
      // 옵션 클릭 이벤트
      option.addEventListener('click', () => {
        this.selectedTrackId = track.id;
        trackDropdownText.textContent = track.name;
        trackDropdown.classList.remove('open');
        
        // 부모 카드에서도 클래스 제거
        const settingsCard = trackDropdown.closest('.settings-card');
        if (settingsCard) {
          settingsCard.classList.remove('dropdown-open');
        }
        
        // 선택된 옵션 표시 업데이트
        trackDropdownOptions.querySelectorAll('.custom-dropdown-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        option.classList.add('selected');
        
        // 숨겨진 select도 업데이트
        if (trackSelect) {
          trackSelect.value = track.id;
        }
        
        this.saveToStorage(); // 저장
      });
      
      // 기본 선택된 옵션 표시
      if (track.id === this.selectedTrackId) {
        option.classList.add('selected');
      }
      
      trackDropdownOptions.appendChild(option);
    });

    // 기본값 설정
    const defaultTrack = tracks.find(t => t.id === this.selectedTrackId) || tracks[0];
    if (defaultTrack) {
      trackDropdownText.textContent = defaultTrack.name;
      this.selectedTrackId = defaultTrack.id;
    }

    // 드롭다운 열기/닫기
    trackDropdownSelected.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = trackDropdown.classList.contains('open');
      trackDropdown.classList.toggle('open');
      
      // 드롭다운이 열려있을 때 부모 카드에 클래스 추가/제거
      const settingsCard = trackDropdown.closest('.settings-card');
      if (settingsCard) {
        if (!isOpen) {
          settingsCard.classList.add('dropdown-open');
        } else {
          settingsCard.classList.remove('dropdown-open');
        }
      }
    });

    // 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!trackDropdown.contains(e.target)) {
        trackDropdown.classList.remove('open');
        // 부모 카드에서도 클래스 제거
        const settingsCard = trackDropdown.closest('.settings-card');
        if (settingsCard) {
          settingsCard.classList.remove('dropdown-open');
        }
      }
    });

    // 키보드 접근성 (ESC로 닫기)
    trackDropdownSelected.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const isOpen = trackDropdown.classList.contains('open');
        trackDropdown.classList.toggle('open');
        
        // 드롭다운이 열려있을 때 부모 카드에 클래스 추가/제거
        const settingsCard = trackDropdown.closest('.settings-card');
        if (settingsCard) {
          if (!isOpen) {
            settingsCard.classList.add('dropdown-open');
          } else {
            settingsCard.classList.remove('dropdown-open');
          }
        }
      }
    });
  }

  // 색상 선택 UI 설정
  setupColorPicker() {
    const colorPicker = document.getElementById('carColorPicker');
    const colorValueText = document.getElementById('colorValueText');

    if (!colorPicker || !colorValueText) {
      return;
    }

    // HEX를 RGB로 변환하는 함수
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const updateColor = () => {
      const hexColor = colorPicker.value;
      const rgb = hexToRgb(hexColor);
      
      if (rgb) {
        // HEX 값 표시 업데이트
        colorValueText.textContent = hexColor.toUpperCase();
        
        // 게임 객체에 색상 저장
        this.carColor = rgb;
        this.saveToStorage(); // 저장
      }
    };

    // 색상 선택 이벤트
    colorPicker.addEventListener('input', updateColor);
    colorPicker.addEventListener('change', updateColor);

    // 초기 색상 설정
    updateColor();
  }

  // 차량 미리보기 초기화
  initCarPreview() {
    const previewCanvas = document.getElementById('carPreviewCanvas');
    if (!previewCanvas) return;
    
    const previewRenderer = new Renderer(previewCanvas);
    
    // 미리보기용 차량 데이터
    const testCar = {
      id: 'preview',
      nickname: 'Preview',
      position: { x: previewCanvas.width / 2, y: previewCanvas.height / 2 },
      angle: 0,
      steerAngle: 0,
      carSkin: null,
      carColor: this.carColor
    };
    
    // 미리보기 렌더링 함수
    const renderPreview = () => {
      // 로비 화면이 활성화되어 있을 때만 렌더링
      if (this.screens.lobby.classList.contains('active')) {
        // 현재 색상 업데이트 (색상 선택 시 자동 반영)
        testCar.carColor = this.carColor;
        
        // 배경 클리어
        previewRenderer.clear();
        
        // 차량 그리기 (미리보기에서는 1.2배 크기로 표시)
        previewRenderer.drawCar(testCar, true, 1.5);
        
        // 조향각 애니메이션 (시각 효과)
        testCar.steerAngle = Math.sin(Date.now() / 1000) * 0.3;
        
        requestAnimationFrame(renderPreview);
      }
    };
    
    // 초기 렌더링 시작
    renderPreview();
  }
  
  setupEventListeners() {
    // 닉네임 입력
    const nicknameInput = document.getElementById('nickname');
    if (nicknameInput) {
      nicknameInput.addEventListener('input', (e) => {
        this.nickname = e.target.value.trim();
        this.saveToStorage(); // 저장
      });
    }
    
    // 방 만들기 버튼
    document.getElementById('createRoomBtn').addEventListener('click', () => {
      if (!this.nickname) {
        alert('닉네임을 입력해주세요.');
        return;
      }
      const roomName = `${this.nickname}의 레이스`;
      // RGB 색상을 JSON 문자열로 변환하여 전달
      const carColorStr = JSON.stringify(this.carColor);
      this.network.createRoom(this.nickname, roomName, carColorStr, this.selectedTrackId);
    });
    
    // 새로고침 버튼
    const refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
    const refreshRoomsBtn2 = document.getElementById('refreshRoomsBtn2');
    
    const refreshRooms = () => {
      this.network.getRooms();
    };
    
    if (refreshRoomsBtn) {
      refreshRoomsBtn.addEventListener('click', refreshRooms);
    }
    
    if (refreshRoomsBtn2) {
      refreshRoomsBtn2.addEventListener('click', refreshRooms);
    }
    
    // 게임 시작 버튼
    document.getElementById('startGameBtn').addEventListener('click', () => {
      this.network.startGame();
    });
    
    // 방 나가기 버튼
    document.getElementById('leaveRoomBtn').addEventListener('click', () => {
      this.network.leaveRoom();
    });

    // 레이스 중 나가기(리타이어) 버튼
    const leaveRaceBtn = document.getElementById('leaveRaceBtn');
    if (leaveRaceBtn) {
      leaveRaceBtn.addEventListener('click', () => {
        this.network.leaveRoom();
      });
    }
    
    // 로비로 돌아가기 버튼
    document.getElementById('backToLobbyBtn').addEventListener('click', () => {
      this.showScreen('lobby');
      this.network.getRooms();
    });
    
    // 키보드 입력
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }
  
  setupNetworkListeners() {
    // 방 목록 업데이트
    this.network.on('roomList', (rooms) => this.updateRoomList(rooms));
    this.network.on('roomListUpdated', (rooms) => this.updateRoomList(rooms));
    
    // 방 생성됨
    this.network.on('roomCreated', (room) => {
      this.currentRoom = room;
      this.showWaitingRoom(room);
      this.saveToStorage(); // 저장
    });
    
    // 방 참가됨
    this.network.on('roomJoined', (room) => {
      this.currentRoom = room;
      this.showWaitingRoom(room);
      this.saveToStorage(); // 저장
    });
    
    // 참가 에러
    this.network.on('joinError', (error) => {
      alert(error.message);
    });
    
    // 플레이어 참가
    this.network.on('playerJoined', (data) => {
      this.currentRoom = data.room;
      this.updateWaitingRoom(data.room);
    });
    
    // 플레이어 퇴장
    this.network.on('playerLeft', (data) => {
      this.currentRoom = data.room;
      this.updateWaitingRoom(data.room);
    });
    
    // 방 나감
    this.network.on('leftRoom', () => {
      // 레이스 중이든 대기실이든, 방에서 나가면 게임 루프 중지
      this.stopGameLoop();
      this.gameState = null;
      this.currentRoom = null;
      this.showScreen('lobby');
      this.saveToStorage(); // 저장
      this.network.getRooms();
    });
    
    // 카운트다운
    this.network.on('countdown', (data) => {
      this.showCountdown(data.count);
    });
    
    // 레이스 시작
    this.network.on('raceStart', (data) => {
      this.startRace(data.room);
      this.saveToStorage(); // 저장
    });
    
    // 게임 상태 업데이트
    this.network.on('gameState', (state) => {
      // carSkin 문자열을 carColor 객체로 변환
      if (state.players && Array.isArray(state.players)) {
        state.players = state.players.map(player => {
          if (player.carSkin && typeof player.carSkin === 'string') {
            try {
              const colorObj = JSON.parse(player.carSkin);
              if (colorObj.r !== undefined && colorObj.g !== undefined && colorObj.b !== undefined) {
                player.carColor = colorObj;
              }
            } catch (e) {
              // JSON 파싱 실패 시 무시
            }
          }
          return player;
        });
      }
      this.gameState = state;
      this.saveToStorage(); // 저장
    });
    
    // 레이스 종료
    this.network.on('raceEnd', (results) => {
      this.showResults(results);
    });
  }
  
  handleKeyDown(e) {
    if (this.screens.gameScreen.classList.contains('active')) {
      const key = e.key.toLowerCase();
      
      if (key === 'arrowup' || key === 'w') {
        this.input.up = true;
        e.preventDefault();
      }
      if (key === 'arrowdown' || key === 's') {
        this.input.down = true;
        e.preventDefault();
      }
      if (key === 'arrowleft' || key === 'a') {
        this.input.left = true;
        e.preventDefault();
      }
      if (key === 'arrowright' || key === 'd') {
        this.input.right = true;
        e.preventDefault();
      }
      
      this.network.sendInput(this.input);
    }
  }
  
  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    
    if (key === 'arrowup' || key === 'w') this.input.up = false;
    if (key === 'arrowdown' || key === 's') this.input.down = false;
    if (key === 'arrowleft' || key === 'a') this.input.left = false;
    if (key === 'arrowright' || key === 'd') this.input.right = false;
    
    this.network.sendInput(this.input);
  }
  
  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.remove('active');
    });
    this.screens[screenName].classList.add('active');
    this.saveToStorage(); // 저장
  }
  
  updateRoomList(rooms) {
    const roomListEl = document.getElementById('roomList');
    
    if (rooms.length === 0) {
      roomListEl.innerHTML = '<div class="no-rooms">현재 열린 게임이 없습니다</div>';
      return;
    }
    
    roomListEl.innerHTML = rooms.map(room => `
      <div class="room-item">
        <div class="room-info">
          <h3>${this.escapeHtml(room.name)}</h3>
          <span>👥 ${room.playerCount}/${room.maxPlayers}</span>
        </div>
        <button class="btn btn-primary join-btn" onclick="game.joinRoom('${room.id}')">
          참가
        </button>
      </div>
    `).join('');
  }
  
  joinRoom(roomId) {
    if (!this.nickname) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    // RGB 색상을 JSON 문자열로 변환하여 전달
    const carColorStr = JSON.stringify(this.carColor);
    this.network.joinRoom(roomId, this.nickname, carColorStr);
  }
  
  showWaitingRoom(room) {
    this.showScreen('waitingRoom');
    this.updateWaitingRoom(room);
  }
  
  updateWaitingRoom(room) {
    document.getElementById('roomTitle').textContent = room.name;
    document.getElementById('roomId').textContent = room.id;
    
    const playersList = document.getElementById('playersList');
    const playerCount = room.players ? room.players.length : 0;
    const maxPlayers = room.maxPlayers || 8;
    
    // 플레이어 수 업데이트
    const playerCountElement = document.getElementById('playerCount');
    if (playerCountElement) {
      playerCountElement.textContent = `${playerCount}/${maxPlayers}`;
    }
    
    playersList.innerHTML = room.players.map(player => `
      <div class="player-card ${player.id === room.host ? 'host' : ''}">
        <div class="player-avatar">🏎️</div>
        <span class="player-name">${this.escapeHtml(player.nickname)}</span>
        ${player.id === room.host ? '<span class="host-badge">호스트</span>' : ''}
      </div>
    `).join('');
    
    // 시작 버튼 활성화 (호스트만)
    const startBtn = document.getElementById('startGameBtn');
    const isHost = room.host === this.localPlayerId;
    startBtn.disabled = !isHost || room.players.length < 1;
    startBtn.textContent = isHost ? '🏁 게임 시작' : '호스트 대기 중...';
  }
  
  showCountdown(count) {
    this.showScreen('gameScreen');
    const countdownEl = document.getElementById('countdown');
    countdownEl.classList.remove('hidden');
    countdownEl.textContent = count === 0 ? 'GO!' : count;
    
    // 애니메이션 재시작
    countdownEl.style.animation = 'none';
    countdownEl.offsetHeight; // 리플로우 강제
    countdownEl.style.animation = 'pulse 0.5s ease-in-out';
  }
  
  startRace(room) {
    // 게임 화면으로 전환
    this.showScreen('gameScreen');

    const countdownEl = document.getElementById('countdown');
    // 카운트다운 없이 바로 시작하므로 오버레이 숨김
    countdownEl.classList.add('hidden');
    
    this.currentRoom = room;
    
    // 트랙 설정 (방에서 선택된 트랙 사용)
    if (room.trackName) {
      this.renderer.setTrack(room.trackName);
    }
    
    this.startGameLoop();
  }
  
  startGameLoop() {
    const loop = () => {
      this.render();
      this.gameLoop = requestAnimationFrame(loop);
    };
    this.gameLoop = requestAnimationFrame(loop);
  }
  
  stopGameLoop() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
  }
  
  render() {
    if (!this.gameState) return;
    
    // 차량 렌더링
    const cars = this.gameState.players || [];
    const localCar = cars.find(car => car.id === this.localPlayerId);
    
    // 카메라 설정 (로컬 플레이어 위치를 화면 중앙에 오도록)
    if (localCar) {
      this.renderer.setCamera(localCar.position.x, localCar.position.y);
    }
    
    this.renderer.clear();
    this.renderer.drawTrack();
    
    // 다른 플레이어 먼저
    cars.filter(car => car.id !== this.localPlayerId).forEach(car => {
      this.renderer.drawCar(car, false);
    });
    
    // 로컬 플레이어
    if (localCar) {
      this.renderer.drawSpeedEffect(localCar);
      this.renderer.drawCar(localCar, true);
      this.updateHUD(localCar, cars);
    }
    
    // 미니맵 (카메라 오프셋 영향 없음)
    this.renderer.drawMinimap(cars, this.localPlayerId);
  }
  
  updateHUD(localCar, allCars) {
    // 서버에서 전달된 km/h 속도 사용
    const speedKmh = Math.round(Math.abs(localCar.speed));
    document.getElementById('speedValue').textContent = speedKmh;
    
    // 랩
    document.getElementById('lapValue').textContent = 
      `${localCar.lap}/${this.currentRoom?.totalLaps || 3}`;
    
    // 순위 계산
    const totalLaps = this.currentRoom?.totalLaps || 3;
    const sortedCars = [...allCars].sort((a, b) => {
      // 리타이어 여부 우선: 리타이어는 항상 맨 뒤에
      if (a.retired && !b.retired) return 1;
      if (!a.retired && b.retired) return -1;

      const aFinished = !a.retired && a.lap >= totalLaps;
      const bFinished = !b.retired && b.lap >= totalLaps;

      // 둘 다 완주한 경우, 완주 시간 기준
      if (aFinished && bFinished && a.finishTime != null && b.finishTime != null) {
        return a.finishTime - b.finishTime;
      }

      // 둘 다 리타이어라면, 나중에 나간 사람이 위에 오도록 retiredAt 내림차순
      if (a.retired && b.retired && a.retiredAt != null && b.retiredAt != null) {
        return b.retiredAt - a.retiredAt;
      }

      // 그 외에는 랩/체크포인트 기준
      if (a.lap !== b.lap) return b.lap - a.lap;
      return b.checkpoint - a.checkpoint;
    });
    
    const position = sortedCars.findIndex(car => car.id === this.localPlayerId) + 1;
    const positionText = this.getPositionText(position);
    document.getElementById('positionValue').textContent = positionText;
    
    // 시간
    if (this.gameState.startTime) {
      const elapsed = Date.now() - this.gameState.startTime;
      document.getElementById('timeValue').textContent = this.formatTime(elapsed);
    }
    
    // 리더보드
    this.updateLeaderboard(sortedCars);
  }
  
  updateLeaderboard(sortedCars) {
    const leaderboardEl = document.getElementById('racePositions');
    leaderboardEl.innerHTML = sortedCars.map((car, index) => `
      <div class="position-item ${car.id === this.localPlayerId ? 'me' : ''}">
        <span class="position-rank">${this.getPositionText(index + 1)}</span>
        <span class="position-name">${this.escapeHtml(car.nickname)}${car.retired ? ' (Retire)' : ''}</span>
      </div>
    `).join('');
  }
  
  getPositionText(pos) {
    const suffixes = ['st', 'nd', 'rd'];
    const suffix = pos <= 3 ? suffixes[pos - 1] : 'th';
    return `${pos}${suffix}`;
  }
  
  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  }
  
  showResults(results) {
    this.stopGameLoop();
    this.showScreen('resultScreen');
    
    const resultsEl = document.getElementById('raceResults');
    resultsEl.innerHTML = results.map((result, index) => {
      const rankClass = index === 0 ? 'gold' : (index === 1 ? 'silver' : (index === 2 ? 'bronze' : ''));
      return `
        <div class="result-item ${index === 0 ? 'winner' : ''}">
          <span class="result-rank ${rankClass}">${this.getPositionText(index + 1)}</span>
          <span class="result-name">${this.escapeHtml(result.nickname)}${result.retired ? ' (Retire)' : ''}</span>
          <span class="result-time">${this.formatTime(result.totalTime)}</span>
        </div>
      `;
    }).join('');
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 게임 인스턴스 생성
const game = new Game();

