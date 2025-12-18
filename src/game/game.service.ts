import { Injectable } from '@nestjs/common';

export interface Vector2D {
  x: number;
  y: number;
}

export interface CarState {
  id: string;
  nickname: string;
  position: Vector2D;
  velocity: Vector2D;
  angle: number;
  // km/h 단위 속도 (전진: 양수, 후진: 음수)
  speed: number;
  // 현재 입력 상태 (서버 틱마다 참고)
  input: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  lap: number;
  checkpoint: number;
  bestLapTime: number | null;
  currentLapTime: number;
  finished: boolean;
  // 레이스 완주/리타이어 여부
  retired: boolean;
  // 완주 시 레이스 시작으로부터 걸린 전체 시간(ms)
  finishTime: number | null;
  // 리타이어 시점 (레이스 시작으로부터 ms)
  retiredAt: number | null;
}

export interface GameRoom {
  id: string;
  name: string;
  host: string;
  players: Map<string, CarState>;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  trackName: string;
  totalLaps: number;
  startTime: number | null;
  maxPlayers: number;
  lastUpdateTime: number | null;
}

@Injectable()
export class GameService {
  private rooms: Map<string, GameRoom> = new Map();
  private playerRooms: Map<string, string> = new Map();

  // 차량 물리 상수 (km/h, 초 기준)
  // 0 -> 100km/h 를 약 2.5초에 도달시키기 위한 가속도
  private readonly MAX_SPEED = 150; // km/h
  private readonly MAX_SPEED_OFF_TRACK = 50; // 트랙 밖 최대 속도 (느리게)
  private readonly MAX_REVERSE_SPEED = 30; // km/h
  private readonly ZERO_TO_HUNDRED_TIME = 2.5; // 초
  private readonly ACCELERATION = 100 / this.ZERO_TO_HUNDRED_TIME; // km/h per second (≈ 40)
  private readonly ACCELERATION_OFF_TRACK = this.ACCELERATION * 0.35; // 트랙 밖 가속도 (느리게)
  private readonly BRAKE_POWER = 80; // 브레이크 감속 km/h per second
  private readonly FRICTION = 40; // 자연 감속 km/h per second (가속 버튼에서 손 떼면 더 빨리 감속)
  private readonly TURN_SPEED = Math.PI; // 최대 속도에서의 기본 회전 속도(rad/s)
  private readonly DRIFT_FACTOR = 0.85;
  private readonly PIXELS_PER_METER = 6; // 1m를 몇 px로 볼지
  private readonly TRACK_WIDTH_PX = 90; // 트랙 폭 (Track.trackWidth와 동일)
  private readonly TRACK_CENTER_PATH: Vector2D[] = this.buildTrackCenterPath();

  // 클라이언트 Track.checkpoints 와 동일한 체크포인트 (시계 방향)
  // 랩 판정에는 "하단 스타트 근처"는 제외하고, 우/상/좌 3개만 사용
  private readonly CHECKPOINTS: Vector2D[] = [
    { x: 930, y: 420 }, // 우측 중앙
    { x: 600, y: 210 }, // 상단 중앙
    { x: 260, y: 420 }, // 좌측 중앙
  ];
  private readonly CHECKPOINT_RADIUS = 90; // 체크포인트 판정 반경

  // 스타트/피니시 라인 (Track.startLine 과 동일한 좌표/각도 사용)
  private readonly START_LINE_X = 600;
  private readonly START_LINE_Y = 620;
  private readonly START_LINE_ANGLE = 0; // 진행 방향(→)
  private readonly START_LINE_HALF_LENGTH = 45; // 트랙 폭 90 기준 절반

  createRoom(hostId: string, hostNickname: string, roomName: string): GameRoom {
    const roomId = this.generateRoomId();
    const room: GameRoom = {
      id: roomId,
      name: roomName,
      host: hostId,
      players: new Map(),
      status: 'waiting',
      trackName: 'rounded-rectangle-circuit',
      totalLaps: 3,
      startTime: null,
      maxPlayers: 8,
      lastUpdateTime: null,
    };

    // 호스트를 방에 추가
    this.addPlayerToRoom(room, hostId, hostNickname, 0);
    this.rooms.set(roomId, room);
    this.playerRooms.set(hostId, roomId);

    return room;
  }

  // 클라이언트 Track.centerPath 와 동일한 둥근 사각형 중앙선 생성
  private buildTrackCenterPath(): Vector2D[] {
    const cx = 600;
    const cy = 400;
    const halfWidth = 380;
    const halfHeight = 220;
    const cornerRadius = 140;

    const points: Vector2D[] = [];
    const segmentsPerCorner = 8;
    const segmentsPerStraight = 20;

    const addArc = (
      cxArc: number,
      cyArc: number,
      startAngle: number,
      endAngle: number,
    ) => {
      for (let i = 0; i <= segmentsPerCorner; i++) {
        const t = i / segmentsPerCorner;
        const angle = startAngle + (endAngle - startAngle) * t;
        points.push({
          x: cxArc + Math.cos(angle) * cornerRadius,
          y: cyArc + Math.sin(angle) * cornerRadius,
        });
      }
    };

    const addStraight = (x1: number, y1: number, x2: number, y2: number) => {
      for (let i = 1; i < segmentsPerStraight; i++) {
        const t = i / segmentsPerStraight;
        points.push({
          x: x1 + (x2 - x1) * t,
          y: y1 + (y2 - y1) * t,
        });
      }
    };

    const blCx = cx - halfWidth + cornerRadius;
    const blCy = cy + halfHeight - cornerRadius;
    const tlCx = cx - halfWidth + cornerRadius;
    const tlCy = cy - halfHeight + cornerRadius;
    const trCx = cx + halfWidth - cornerRadius;
    const trCy = cy - halfHeight + cornerRadius;
    const brCx = cx + halfWidth - cornerRadius;
    const brCy = cy + halfHeight - cornerRadius;

    const blBottom = { x: blCx, y: blCy + cornerRadius };
    const blLeft = { x: blCx - cornerRadius, y: blCy };
    const tlLeft = { x: tlCx - cornerRadius, y: tlCy };
    const tlTop = { x: tlCx, y: tlCy - cornerRadius };
    const trTop = { x: trCx, y: trCy - cornerRadius };
    const trRight = { x: trCx + cornerRadius, y: trCy };
    const brRight = { x: brCx + cornerRadius, y: brCy };
    const brBottom = { x: brCx, y: brCy + cornerRadius };

    // 좌하단 → 좌상단 → 우상단 → 우하단 (시계 방향), 각 코너는 90도 호 + 직선 구간
    addArc(blCx, blCy, Math.PI / 2, Math.PI); // 하단 → 좌측
    addStraight(blLeft.x, blLeft.y, tlLeft.x, tlLeft.y); // 좌측 직선

    addArc(tlCx, tlCy, Math.PI, (3 * Math.PI) / 2); // 좌측 → 상단
    addStraight(tlTop.x, tlTop.y, trTop.x, trTop.y); // 상단 직선

    addArc(trCx, trCy, (3 * Math.PI) / 2, 2 * Math.PI); // 상단 → 우측
    addStraight(trRight.x, trRight.y, brRight.x, brRight.y); // 우측 직선

    addArc(brCx, brCy, 0, Math.PI / 2); // 우측 → 하단
    addStraight(brBottom.x, brBottom.y, blBottom.x, blBottom.y); // 하단 직선

    return points;
  }

  joinRoom(roomId: string, playerId: string, nickname: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.status !== 'waiting') return null;
    if (room.players.size >= room.maxPlayers) return null;

    const spawnIndex = room.players.size;
    this.addPlayerToRoom(room, playerId, nickname, spawnIndex);
    this.playerRooms.set(playerId, roomId);

    return room;
  }

  private addPlayerToRoom(room: GameRoom, playerId: string, nickname: string, spawnIndex: number): void {
    const spawnPositions = this.getSpawnPositions();
    const spawnPos = spawnPositions[spawnIndex % spawnPositions.length];

    const carState: CarState = {
      id: playerId,
      nickname,
      position: { ...spawnPos },
      velocity: { x: 0, y: 0 },
      // 트랙 하단 직선 기준, 진행 방향(오른쪽)을 향하도록 초기 각도 설정
      angle: 0,
      speed: 0,
      input: {
        up: false,
        down: false,
        left: false,
        right: false,
      },
      lap: 0,
      // -1: 아직 어떤 체크포인트도 통과하지 않은 상태
      checkpoint: -1,
      bestLapTime: null,
      currentLapTime: 0,
      finished: false,
      retired: false,
      finishTime: null,
      retiredAt: null,
    };

    room.players.set(playerId, carState);
  }

  private getSpawnPositions(): Vector2D[] {
    // 둥근 사각형 트랙 하단 시작선 근처 그리드 포지션
    return [
      { x: 570, y: 640 },
      { x: 610, y: 640 },
      { x: 570, y: 675 },
      { x: 610, y: 675 },
      { x: 570, y: 710 },
      { x: 610, y: 710 },
      { x: 570, y: 745 },
      { x: 610, y: 745 },
    ];
  }

  leaveRoom(playerId: string): { room: GameRoom | null; wasHost: boolean } {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return { room: null, wasHost: false };

    const room = this.rooms.get(roomId);
    if (!room) return { room: null, wasHost: false };

    const wasHost = room.host === playerId;
    const car = room.players.get(playerId);

    // 레이스 중이라면 "리타이어" 처리만 하고, 결과 계산을 위해 room.players 에는 남겨둔다
    if (room.status === 'racing' && car) {
      car.finished = true;
      car.retired = true;
      car.speed = 0;
      car.velocity = { x: 0, y: 0 };
      car.input = { up: false, down: false, left: false, right: false };

      if (room.startTime != null) {
        car.retiredAt = Date.now() - room.startTime;
      } else {
        car.retiredAt = 0;
      }

      // 더 이상 입력/방 조회를 하지 않도록 매핑만 제거
      this.playerRooms.delete(playerId);

      return { room, wasHost };
    }

    // 대기실/완료 상태에서는 기존처럼 방에서 완전히 제거
    room.players.delete(playerId);
    this.playerRooms.delete(playerId);

    // 방이 비었으면 삭제
    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      return { room: null, wasHost };
    }

    // 호스트가 나갔으면 다음 플레이어에게 호스트 위임
    if (wasHost) {
      const nextHost = room.players.keys().next().value;
      if (nextHost) {
        room.host = nextHost;
      }
    }

    return { room, wasHost };
  }

  updatePlayerInput(playerId: string, input: { up: boolean; down: boolean; left: boolean; right: boolean }): CarState | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'racing') return null;

    const car = room.players.get(playerId);
    if (!car || car.finished) return null;

    // 입력 상태만 업데이트 (실제 물리 계산은 서버 틱에서 수행)
    car.input = { ...input };

    return car;
  }

  startCountdown(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'waiting') return false;
    if (room.players.size < 1) return false;

    room.status = 'countdown';
    return true;
  }

  startRace(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    // countdown 상태뿐 아니라 waiting 상태에서도 바로 시작 가능하게 허용
    if (!room || (room.status !== 'countdown' && room.status !== 'waiting')) return false;

    room.status = 'racing';
    room.startTime = Date.now();
    room.lastUpdateTime = room.startTime;

    // 모든 플레이어 랩 타임 초기화
    room.players.forEach(car => {
      car.currentLapTime = 0;
      car.lap = 0;
      car.checkpoint = -1;
      car.speed = 0;
      car.velocity = { x: 0, y: 0 };
      car.input = { up: false, down: false, left: false, right: false };
      car.finished = false;
      car.retired = false;
      car.finishTime = null;
      car.retiredAt = null;
    });

    return true;
  }

  // 방 전체 물리 업데이트 (게임 루프에서 호출)
  updateRoomPhysics(
    roomId: string,
  ): { results: { id: string; nickname: string; totalTime: number; retired: boolean }[] } | null {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'racing') return null;

    const now = Date.now();
    if (room.lastUpdateTime == null) {
      room.lastUpdateTime = now;
      return null;
    }

    const deltaTime = (now - room.lastUpdateTime) / 1000; // 초 단위
    room.lastUpdateTime = now;

    room.players.forEach(car => {
      if (!car.finished) {
        this.updateCarPhysics(room, car, car.input, deltaTime);
      }
    });

    const results = this.checkRaceFinished(room);
    return results ? { results } : null;
  }

  private updateCarPhysics(
    room: GameRoom,
    car: CarState,
    input: { up: boolean; down: boolean; left: boolean; right: boolean },
    deltaTime: number,
  ): void {
    // 스타트 라인 통과 방향 판정을 위해 이전 위치 저장
    const prevPosition: Vector2D = { x: car.position.x, y: car.position.y };

    // 현재 위치가 트랙 위인지 여부 (가속/최고 속도에 영향을 줌)
    const onTrack = this.isOnTrack(car.position);

    const accel = onTrack ? this.ACCELERATION : this.ACCELERATION_OFF_TRACK;
    const maxForwardSpeed = onTrack ? this.MAX_SPEED : this.MAX_SPEED_OFF_TRACK;

    // 가속 (0 -> 100km/h 약 2.5초, 트랙 밖에서는 느리게)
    if (input.up) {
      car.speed += accel * deltaTime;
    }

    // 브레이크 / 후진
    if (input.down) {
      if (car.speed > 5) {
        // 주행 중일 때는 강한 브레이크
        car.speed -= this.BRAKE_POWER * deltaTime;
      } else {
        // 거의 정지 상태에서는 후진
        car.speed -= accel * deltaTime;
      }
    }

    // 자연 감속 (마찰)
    if (!input.up && !input.down) {
      if (car.speed > 0) {
        car.speed = Math.max(0, car.speed - this.FRICTION * deltaTime);
      } else if (car.speed < 0) {
        car.speed = Math.min(0, car.speed + this.FRICTION * deltaTime);
      }
    }

    // 최고/최저 속도 제한 (트랙 밖에서는 낮은 최대 속도 적용)
    if (car.speed > maxForwardSpeed) {
      car.speed = maxForwardSpeed;
    }
    if (car.speed < -this.MAX_REVERSE_SPEED) {
      car.speed = -this.MAX_REVERSE_SPEED;
    }

    // 회전 (속도에 비례하되, 정지 상태에서도 어느 정도 회전 가능)
    const baseTurnFactor = 0.7;
    const effectiveSpeed = Math.max(30, Math.abs(car.speed)); // 저속에서도 회전성을 확보
    const speedRatio = Math.min(1, effectiveSpeed / this.MAX_SPEED);
    const turnAmount = this.TURN_SPEED * (baseTurnFactor + speedRatio) * deltaTime;
    if (input.left) {
      car.angle -= turnAmount;
    }
    if (input.right) {
      car.angle += turnAmount;
    }

    // km/h -> px/s 변환
    const speedMetersPerSecond = car.speed / 3.6;
    const pixelsPerSecond = speedMetersPerSecond * this.PIXELS_PER_METER;

    const targetVelX = Math.cos(car.angle) * pixelsPerSecond;
    const targetVelY = Math.sin(car.angle) * pixelsPerSecond;

    // 드리프트 효과 (점진적으로 목표 속도로 수렴)
    car.velocity.x = car.velocity.x * this.DRIFT_FACTOR + targetVelX * (1 - this.DRIFT_FACTOR);
    car.velocity.y = car.velocity.y * this.DRIFT_FACTOR + targetVelY * (1 - this.DRIFT_FACTOR);

    car.position.x += car.velocity.x * deltaTime;
    car.position.y += car.velocity.y * deltaTime;

    // 매우 낮은 속도는 0으로 처리
    if (Math.abs(car.speed) < 0.1) {
      car.speed = 0;
    }

    // 체크포인트 진행도 업데이트 (시계 방향 순서로만 진행)
    this.updateCheckpointProgress(car);

    // 스타트 라인 통과 체크 (정방향 & 한 바퀴 체크포인트 모두 통과한 경우에만 랩 증가)
    const crossDir = this.checkStartLineCross(prevPosition, car.position);
    if (crossDir === 'forward' && car.checkpoint === this.CHECKPOINTS.length - 1) {
      car.lap += 1;
      // 다음 랩을 위해 체크포인트 진행도 초기화
      car.checkpoint = -1;

      // 목표 랩 수를 모두 완료했으면 완주 처리
      if (!car.retired && room.startTime != null && car.lap >= room.totalLaps) {
        car.finished = true;
        const elapsed = Date.now() - room.startTime;
        car.finishTime = elapsed;
      }
    }
  }

  // 체크포인트를 올바른 순서로 통과했는지 진행도 업데이트
  private updateCheckpointProgress(car: CarState): void {
    const lastCheckpoint = car.checkpoint;

    // 이미 마지막 체크포인트까지 통과했다면 더 이상 진행도는 올리지 않음
    if (lastCheckpoint >= this.CHECKPOINTS.length - 1) {
      return;
    }

    const nextCheckpoint = lastCheckpoint + 1; // -1 -> 0, 0 -> 1, 1 -> 2 ...
    const cp = this.CHECKPOINTS[nextCheckpoint];

    const dx = car.position.x - cp.x;
    const dy = car.position.y - cp.y;
    const distSq = dx * dx + dy * dy;

    if (distSq <= this.CHECKPOINT_RADIUS * this.CHECKPOINT_RADIUS) {
      car.checkpoint = nextCheckpoint;
    }
  }

  // 모든 차량이 완주(또는 리타이어)했는지 확인하고, 완료되었다면 결과를 생성
  private checkRaceFinished(
    room: GameRoom,
  ): { id: string; nickname: string; totalTime: number; retired: boolean }[] | null {
    if (room.status !== 'racing') return null;

    const players = Array.from(room.players.values());
    const allDone = players.every(p => p.finished);
    if (!allDone) return null;

    room.status = 'finished';

    // 결과 생성
    const now = Date.now();
    const start = room.startTime ?? now;

    const finished = players.filter(p => !p.retired);
    const retired = players.filter(p => p.retired);

    // 완주한 차량: 완주 시간 기준 오름차순
    finished.sort((a, b) => {
      const ta = a.finishTime ?? (now - start);
      const tb = b.finishTime ?? (now - start);
      return ta - tb;
    });

    // 리타이어 차량: 나중에 나갈수록 순위가 더 높게 (리스트 상단에) 배치되도록, retiredAt 내림차순
    retired.sort((a, b) => {
      const ta = a.retiredAt ?? 0;
      const tb = b.retiredAt ?? 0;
      return tb - ta;
    });

    const ordered = [...finished, ...retired];

    return ordered.map(p => {
      const retiredFlag = p.retired;
      const baseTime =
        retiredFlag
          ? (p.retiredAt ?? (now - start))
          : (p.finishTime ?? (now - start));

      return {
        id: p.id,
        nickname: p.nickname,
        totalTime: baseTime,
        retired: retiredFlag,
      };
    });
  }

  // 스타트 라인(유한 선분)을 기준으로 이전/현재 위치가 서로 다른 쪽에 있는지 판단하여
  // 'forward'(정방향), 'backward'(역방향), null(통과 없음)을 반환
  private checkStartLineCross(
    prev: Vector2D,
    curr: Vector2D,
  ): 'forward' | 'backward' | null {
    // 진행 방향(트랙 접선 방향)을 법선 벡터로 사용
    const nx = Math.cos(this.START_LINE_ANGLE);
    const ny = Math.sin(this.START_LINE_ANGLE);
    // 라인 자체는 진행 방향에 수직인 방향(세로 방향)으로 뻗어 있음
    const tx = -ny;
    const ty = nx;

    const pxPrev = prev.x - this.START_LINE_X;
    const pyPrev = prev.y - this.START_LINE_Y;
    const pxCurr = curr.x - this.START_LINE_X;
    const pyCurr = curr.y - this.START_LINE_Y;

    // 진행 방향 기준 어느 쪽에 있는지 (부호만 중요)
    const sidePrev = pxPrev * nx + pyPrev * ny;
    const sideCurr = pxCurr * nx + pyCurr * ny;

    // 양쪽 모두 같은 쪽이면 통과하지 않음
    if (sidePrev === 0 && sideCurr === 0) return null;
    if (sidePrev > 0 && sideCurr > 0) return null;
    if (sidePrev < 0 && sideCurr < 0) return null;

    // 선분 범위 안에서만 유효하도록, 라인 방향으로의 투영 길이를 확인
    const projPrev = pxPrev * tx + pyPrev * ty;
    const projCurr = pxCurr * tx + pyCurr * ty;
    const projMid = (projPrev + projCurr) / 2;

    const margin = 8; // 약간의 여유
    if (Math.abs(projMid) > this.START_LINE_HALF_LENGTH + margin) {
      return null;
    }

    // sidePrev -> sideCurr 방향에 따라 정/역방향 판정
    if (sidePrev < sideCurr) {
      return 'forward';
    }
    if (sidePrev > sideCurr) {
      return 'backward';
    }

    return null;
  }

  // 중앙선으로부터의 최소 거리를 이용해 트랙 안/밖 판정
  private isOnTrack(position: Vector2D): boolean {
    let minDistSq = Infinity;

    for (const point of this.TRACK_CENTER_PATH) {
      const dx = position.x - point.x;
      const dy = position.y - point.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
      }
    }

    const maxDist = this.TRACK_WIDTH_PX / 2 + 10; // 약간 여유
    return minDistSq <= maxDist * maxDist;
  }

  getRoom(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null;
  }

  getRoomByPlayer(playerId: string): GameRoom | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  getWaitingRooms(): { id: string; name: string; playerCount: number; maxPlayers: number }[] {
    return Array.from(this.rooms.values())
      .filter(room => room.status === 'waiting')
      .map(room => ({
        id: room.id,
        name: room.name,
        playerCount: room.players.size,
        maxPlayers: room.maxPlayers,
      }));
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  serializeRoom(room: GameRoom): object {
    return {
      id: room.id,
      name: room.name,
      host: room.host,
      players: Array.from(room.players.values()),
      status: room.status,
      trackName: room.trackName,
      totalLaps: room.totalLaps,
      maxPlayers: room.maxPlayers,
    };
  }

  serializeGameState(room: GameRoom): object {
    return {
      roomId: room.id,
      status: room.status,
      players: Array.from(room.players.values()),
      startTime: room.startTime,
    };
  }
}

