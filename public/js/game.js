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
      await this.network.connect();
      this.localPlayerId = this.network.playerId;
      
      this.canvas = document.getElementById('gameCanvas');
      this.renderer = new Renderer(this.canvas);
      
      this.setupEventListeners();
      this.setupNetworkListeners();
      
      // 초기 방 목록 요청
      this.network.getRooms();
      
      console.log('Game initialized');
    } catch (error) {
      console.error('Failed to initialize game:', error);
      alert('서버 연결에 실패했습니다.');
    }
  }
  
  setupEventListeners() {
    // 닉네임 입력
    const nicknameInput = document.getElementById('nickname');
    nicknameInput.addEventListener('input', (e) => {
      this.nickname = e.target.value.trim();
    });
    
    // 방 만들기 버튼
    document.getElementById('createRoomBtn').addEventListener('click', () => {
      if (!this.nickname) {
        alert('닉네임을 입력해주세요.');
        return;
      }
      const roomName = `${this.nickname}의 레이스`;
      this.network.createRoom(this.nickname, roomName);
    });
    
    // 새로고침 버튼
    document.getElementById('refreshRoomsBtn').addEventListener('click', () => {
      this.network.getRooms();
    });
    
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
    });
    
    // 방 참가됨
    this.network.on('roomJoined', (room) => {
      this.currentRoom = room;
      this.showWaitingRoom(room);
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
      this.network.getRooms();
    });
    
    // 카운트다운
    this.network.on('countdown', (data) => {
      this.showCountdown(data.count);
    });
    
    // 레이스 시작
    this.network.on('raceStart', (data) => {
      this.startRace(data.room);
    });
    
    // 게임 상태 업데이트
    this.network.on('gameState', (state) => {
      this.gameState = state;
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
    this.network.joinRoom(roomId, this.nickname);
  }
  
  showWaitingRoom(room) {
    this.showScreen('waitingRoom');
    this.updateWaitingRoom(room);
  }
  
  updateWaitingRoom(room) {
    document.getElementById('roomTitle').textContent = room.name;
    document.getElementById('roomId').textContent = `코드: ${room.id}`;
    
    const playersList = document.getElementById('playersList');
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
    
    this.renderer.clear();
    this.renderer.drawTrack();
    
    // 차량 렌더링
    const cars = this.gameState.players || [];
    
    // 다른 플레이어 먼저
    cars.filter(car => car.id !== this.localPlayerId).forEach(car => {
      this.renderer.drawCar(car, false);
    });
    
    // 로컬 플레이어
    const localCar = cars.find(car => car.id === this.localPlayerId);
    if (localCar) {
      this.renderer.drawSpeedEffect(localCar);
      this.renderer.drawCar(localCar, true);
      this.updateHUD(localCar, cars);
    }
    
    // 미니맵
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

