// Socket.IO 네트워크 관리
class Network {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.playerId = null;
    this.callbacks = {};
  }
  
  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io({
        transports: ['websocket', 'polling']
      });
      
      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.connected = true;
        this.playerId = this.socket.id;
        resolve();
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.connected = false;
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });
      
      // 이벤트 리스너 등록
      this.setupListeners();
    });
  }
  
  setupListeners() {
    // 방 목록
    this.socket.on('roomList', (rooms) => {
      this.emit('roomList', rooms);
    });
    
    this.socket.on('roomListUpdated', (rooms) => {
      this.emit('roomListUpdated', rooms);
    });
    
    // 방 관련
    this.socket.on('roomCreated', (room) => {
      this.emit('roomCreated', room);
    });
    
    this.socket.on('roomJoined', (room) => {
      this.emit('roomJoined', room);
    });
    
    this.socket.on('joinError', (error) => {
      this.emit('joinError', error);
    });
    
    this.socket.on('playerJoined', (data) => {
      this.emit('playerJoined', data);
    });
    
    this.socket.on('playerLeft', (data) => {
      this.emit('playerLeft', data);
    });
    
    this.socket.on('leftRoom', () => {
      this.emit('leftRoom');
    });
    
    // 게임 관련
    this.socket.on('countdown', (data) => {
      this.emit('countdown', data);
    });
    
    this.socket.on('raceStart', (data) => {
      this.emit('raceStart', data);
    });
    
    this.socket.on('gameState', (state) => {
      this.emit('gameState', state);
    });
    
    this.socket.on('raceEnd', (results) => {
      this.emit('raceEnd', results);
    });
    
    // 핑-퐁
    this.socket.on('pong', (data) => {
      this.emit('pong', data);
    });
    
    // 에러
    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
  }
  
  // 이벤트 구독
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }
  
  // 이벤트 발행
  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }
  
  // 서버로 메시지 전송
  send(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }
  
  // 방 관련 메소드
  getRooms() {
    this.send('getRooms');
  }
  
  createRoom(nickname, roomName, carColor) {
    this.send('createRoom', { nickname, roomName, carSkin: carColor });
  }
  
  joinRoom(roomId, nickname, carColor) {
    this.send('joinRoom', { roomId, nickname, carSkin: carColor });
  }
  
  leaveRoom() {
    this.send('leaveRoom');
  }
  
  // 게임 관련 메소드
  startGame() {
    this.send('startGame');
  }
  
  sendInput(input) {
    this.send('playerInput', input);
  }
  
  // 핑 측정
  ping() {
    const startTime = Date.now();
    this.send('ping');
    
    return new Promise((resolve) => {
      const handler = (data) => {
        const latency = Date.now() - startTime;
        resolve(latency);
        
        // 핸들러 제거
        const idx = this.callbacks['pong'].indexOf(handler);
        if (idx > -1) this.callbacks['pong'].splice(idx, 1);
      };
      this.on('pong', handler);
    });
  }
}

