import { Injectable } from '@nestjs/common';
import { trackServerConfigs, TrackServerConfig } from './tracks/track-configs';

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
  // 앞바퀴 조향 각도(rad) - 클라이언트에서 바퀴 애니메이션에 사용
  steerAngle: number;
  // 현재 입력 상태 (서버 틱마다 참고)
  input: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  lap: number;
  checkpoint: number;
  finished: boolean;
  // 레이스 완주/리타이어 여부
  retired: boolean;
  // 완주 시 레이스 시작으로부터 걸린 전체 시간(ms)
  finishTime: number | null;
  // 리타이어 시점 (레이스 시작으로부터 ms)
  retiredAt: number | null;
  // 차량 스킨 파일 이름 (예: 'racingCar.png')
  carSkin?: string | null;
  angularVelocity: number;

}

export interface GameRoom {
  id: string;
  name: string;
  host: string; // playerId
  hostNickname: string; // 호스트 닉네임 (재연결 시 식별용)
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
  // ========================================
  // 🏎️ F1 가속도 시스템 (속도 구간별 가속도)
  // ========================================
  // 실제 F1 차량의 가속도 특성:
  // - 0 → 100km/h: 2.5초 (기본 가속도)
  // - 100 → 200km/h: 2초 (더 빠른 가속도 - 고단 기어 효율)
  // - 200 → 300km/h: 4초 (느린 가속도 - 공기 저항 증가)
  
  private readonly MAX_SPEED = 300; // km/h
  private readonly MAX_SPEED_OFF_TRACK = 120; // 트랙 밖 최대 속도 (느리게)
  private readonly MAX_REVERSE_SPEED = 30; // km/h
  
  // 속도 구간별 가속도 (km/h per second)
  // - 0-100km/h: 40 km/h/s (100km/h / 2.5초)
  private readonly ACCEL_LOW = 45;
  // - 100-200km/h: 50 km/h/s (100km/h / 2초) - 더 빠름
  private readonly ACCEL_MID = 50;
  // - 200-300km/h: 25 km/h/s (100km/h / 4초) - 느림
  private readonly ACCEL_HIGH = 25;
  
  // 트랙 밖 가속도 (기본 가속도의 35%)
  private readonly ACCELERATION_OFF_TRACK = this.ACCEL_LOW * 0.65;
  // 트랙 밖 감속 속도 (트랙 밖으로 나갔을 때 80km/h까지 감속하는 속도)
  // - 값이 클수록 빠르게 감속, 작을수록 천천히 감속
  // - 현재: 60 km/h per second (200km/h에서 80km/h까지 약 2초)
  private readonly OFF_TRACK_DECELERATION = 80;
  private readonly BRAKE_POWER = 80; // 브레이크 감속 km/h per second
  private readonly FRICTION = 40; // 자연 감속 km/h per second (가속 버튼에서 손 떼면 더 빨리 감속)
  private readonly PIXELS_PER_METER = 15; // 1m를 몇 px로 볼지 (속도감 향상을 위해 6에서 12로 증가)
  private readonly TRACK_WIDTH_PX = 120; // 트랙 폭 (모든 트랙에서 통일 사용)
  // 트랙별 중앙선 경로 맵
  // - 각 트랙의 중심선 좌표 배열을 저장
  // - 트랙 안/밖 판정(isOnTrack)에 사용
  // - track-configs.ts에서 설정을 가져와서 동적으로 생성
  private readonly trackCenterPaths: Map<string, Vector2D[]> = (() => {
    const paths = new Map<string, Vector2D[]>();
    trackServerConfigs.forEach((config, trackId) => {
      const path = config.buildCenterPath();
      paths.set(trackId, path.map(p => ({ x: p.x, y: p.y })));
    });
    return paths;
  })();
  // ========================================
  // 🏎️ F1 조향 시스템 파라미터
  // ========================================

  // 앞바퀴 최대 조향각 (라디안)
  // - 실제 F1: 약 20~25도 (고속 안정성)
  // - 값이 클수록 급격한 회전 가능, 작을수록 안정적
  // - 현재: 약 25도 (Math.PI / 7.2 ≈ 0.436 rad)
  private readonly MAX_STEER_ANGLE = Math.PI / 7.2;

  
  // 휠베이스(앞/뒤 바퀴 간 거리)
  // - 실제 F1: 약 3.0~3.6m
  // - 값이 클수록 회전 반경이 커짐 (안정적이지만 느린 회전)
  // - 현재: 2.5m (더 빠른 회전을 위해 단축)
  private readonly WHEEL_BASE_METERS = 3.0;

  // 클라이언트 Track.checkpoints 와 동일한 체크포인트 (시계 방향)
  // 트랙별 체크포인트 반경 (기본값: 120)
  private getCheckpointRadius(trackName: string): number {
    // 기본 서킷은 크기가 커졌으므로 반경도 증가
    if (trackName === 'basic-circuit') {
      return 360; // 원래 120 * 3
    }
    // 몬차 서킷은 원래 크기 유지
    if (trackName === 'monza') {
      return 300; // 클라이언트와 동일
    }
    return 120; // 기본값
  }
  private readonly START_LINE_HALF_LENGTH = 60; // 트랙 폭 120 기준 절반

  // 트랙별 체크포인트 정보
  private getCheckpoints(trackName: string): Vector2D[] {
    const config = trackServerConfigs.get(trackName);
    if (config) {
      return config.checkpoints.map(cp => ({ x: cp.x, y: cp.y }));
    }
    // 기본값: 기본 서킷
    const defaultConfig = trackServerConfigs.get('basic-circuit')!;
    return defaultConfig.checkpoints.map(cp => ({ x: cp.x, y: cp.y }));
  }

  // 트랙별 스타트 라인 정보
  private getStartLine(trackName: string): { x: number; y: number; angle: number } {
    const config = trackServerConfigs.get(trackName);
    if (config) {
      return {
        x: config.startLine.x,
        y: config.startLine.y,
        angle: config.startLine.angle,
      };
    }
    // 기본값: 기본 서킷
    const defaultConfig = trackServerConfigs.get('basic-circuit')!;
    return {
      x: defaultConfig.startLine.x,
      y: defaultConfig.startLine.y,
      angle: defaultConfig.startLine.angle,
    };
  }
  // ========================================
  // 🏎️ F1 그립 & 다운포스 시스템
  // ========================================

  // 기본 횡방향 그립 (타이어 컴파운드)
  // - 값이 클수록 미끄러짐 감소, 차가 목표 방향으로 빠르게 수렴
  // - 값이 작을수록 관성이 더 유지되어 급격한 방향 전환에 유리
  // - 실제 F1: 소프트 타이어(높은 그립) vs 하드 타이어(낮은 그립)
  // - 현재: 6.5 (적당한 그립 - 급격한 방향 전환 반응성 향상)
  private readonly BASE_LATERAL_GRIP = 6.5; // 🔧 회전력 감소, 미끄러짐 허용

  
  // 다운포스 계수 (속도²에 비례)
  // - 속도가 빠를수록 차체가 지면에 눌려 그립 증가
  // - 실제 F1: 고속 코너에서 다운포스로 안정성 확보
  // - 현재: 0.0022 (고속에서 강력한 다운포스)
  private readonly DOWNFORCE_COEFF = 0.0022; // 🔧 안정은 유지, 회전력 감소

  
  // ========================================
  // 🏎️ F1 조향 반응성 파라미터
  // ========================================
  
  // 조향 입력 속도 (초당 조향각 변화율)
  // - 값이 클수록 핸들이 빠르게 움직임 (가벼움)
  // - 값이 작을수록 핸들이 천천히 움직임 (무거움)
  // - 실제 F1: 파워 스티어링이지만 정밀한 피드백을 위해 적당한 무게감
  // - 현재: 5.5 (더 빠른 조향 반응)
  private readonly STEERING_RESPONSE_SPEED = 5.5;
  
  // 조향 센터링 속도 (손을 뗐을 때 핸들이 중앙으로 복귀하는 속도)
  // - 실제 F1: 파워 스티어링의 센터링 포스로 핸들이 자동으로 중앙 복귀
  // - 값이 클수록 빠르게 중앙으로 돌아감
  // - 현재: 20.0 (매우 빠른 센터링 - 손 떼면 즉시 직진)
  private readonly STEERING_CENTERING_SPEED = 50.0;



  createRoom(hostId: string, hostNickname: string, roomName: string, carSkin?: string | null, trackId?: string): GameRoom {
    const roomId = this.generateRoomId();
    const room: GameRoom = {
      id: roomId,
      name: roomName,
      host: hostId,
      hostNickname: hostNickname, // 호스트 닉네임 저장
      players: new Map(),
      status: 'waiting',
      trackName: trackId ?? 'basic-circuit',
      totalLaps: 5,
      startTime: null,
      maxPlayers: 8,
      lastUpdateTime: null,
    };

    // 호스트를 방에 추가
    this.addPlayerToRoom(room, hostId, hostNickname, 0, carSkin);
    this.rooms.set(roomId, room);
    this.playerRooms.set(hostId, roomId);

    return room;
  }


  joinRoom(roomId: string, playerId: string, nickname: string, carSkin?: string | null): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    // 기존 플레이어가 재연결하는 경우 (레이스 중이어도 허용)
    // room.players에 플레이어가 있으면 이전에 참가했던 플레이어로 간주
    if (room.players.has(playerId)) {
      // 이미 방에 있는 플레이어는 재연결만 처리
      // playerRooms 매핑 복원 (연결이 끊어졌다가 재연결한 경우)
      this.playerRooms.set(playerId, roomId);
      return room;
    }
    
    // 방이 비어있지만 이전 호스트가 재연결하는 경우 방 복원
    // 새로고침 시 client.id가 변경되므로 닉네임으로 호스트 식별
    if (room.players.size === 0 && room.hostNickname === nickname) {
      // 호스트가 재연결: 플레이어를 다시 추가하고 호스트 ID 업데이트
      room.host = playerId; // 새로운 client.id로 업데이트
      this.addPlayerToRoom(room, playerId, nickname, 0, carSkin);
      this.playerRooms.set(playerId, roomId);
      return room;
    }
    
    // 새 플레이어는 대기 상태일 때만 참가 가능
    if (room.status !== 'waiting') return null;
    if (room.players.size >= room.maxPlayers) return null;

    const spawnIndex = room.players.size;
    this.addPlayerToRoom(room, playerId, nickname, spawnIndex, carSkin);
    this.playerRooms.set(playerId, roomId);

    return room;
  }

  private addPlayerToRoom(
    room: GameRoom,
    playerId: string,
    nickname: string,
    spawnIndex: number,
    carSkin?: string | null,
  ): void {
    const spawnData = this.getSpawnPositions(room.trackName);
    const spawnPos = spawnData.positions[spawnIndex % spawnData.positions.length];

    const carState: CarState = {
      id: playerId,
      nickname,
      position: { ...spawnPos },
      velocity: { x: 0, y: 0 },
      // 트랙별로 다른 초기 각도 설정
      angle: spawnData.angle,
      speed: 0,
      steerAngle: 0,
      input: {
        up: false,
        down: false,
        left: false,
        right: false,
      },
      lap: 0,
      // -1: 아직 어떤 체크포인트도 통과하지 않은 상태
      checkpoint: -1,
      finished: false,
      retired: false,
      finishTime: null,
      retiredAt: null,
      carSkin: carSkin ?? null,
      angularVelocity: 0,
    };

    room.players.set(playerId, carState);
  }

  private getSpawnPositions(trackName: string): { positions: Vector2D[]; angle: number } {
    // 트랙별 그리드 포지션과 초기 각도 반환
    const config = trackServerConfigs.get(trackName);
    if (config) {
      return {
        positions: config.spawnPositions.map(p => ({ x: p.x, y: p.y })),
        angle: config.spawnAngle,
      };
    }
    // 기본값: 기본 서킷
    const defaultConfig = trackServerConfigs.get('basic-circuit')!;
    return {
      positions: defaultConfig.spawnPositions.map(p => ({ x: p.x, y: p.y })),
      angle: defaultConfig.spawnAngle,
    };
  }

    // ========================================
  // 1️⃣ 개선된 조향각 시스템
  // ========================================
  
  /**
   * 속도에 따른 조향각 제한 (실제 F1 데이터 기반)
   * - 저속(0-50km/h): 100% 조향각 (헤어핀, 저속 코너)
   * - 중속(50-150km/h): 70% 조향각 (중속 코너)
   * - 고속(150-250km/h): 40% 조향각 (고속 스위퍼)
   * - 초고속(250km/h+): 20% 조향각 (DRS 존, 긴 직선)
   */
  private getSpeedSensitiveSteerAngle(targetSteer: number, speed: number): number {
    const speedKmh = Math.abs(speed);
    
    let steerMultiplier: number;
    
    if (speedKmh < 50) {
      // 저속 구간: 전체 조향각 사용 가능
      steerMultiplier = 1.0;
    } else if (speedKmh < 150) {
      // 중속 구간: 50km/h(1.0) → 150km/h(0.7) 선형 보간
      const ratio = (speedKmh - 50) / 100;
      steerMultiplier = 1.0 - ratio * 0.3;
    } else if (speedKmh < 250) {
      // 고속 구간: 150km/h(0.7) → 250km/h(0.4) 선형 보간
      const ratio = (speedKmh - 150) / 100;
      steerMultiplier = 0.7 - ratio * 0.3;
    } else {
      // 초고속 구간: 250km/h(0.4) → 300km/h(0.2) 선형 보간
      const ratio = Math.min(1, (speedKmh - 250) / 50);
      steerMultiplier = 0.4 - ratio * 0.2;
    }
    
    return targetSteer * steerMultiplier;
  }

  // ========================================
  // 2️⃣ 슬립 각도 (Slip Angle) 시스템
  // ========================================
  
  /**
   * 차량의 슬립 각도 계산
   * - 차체가 향하는 방향 vs 실제 이동 방향의 차이
   * - 언더스티어/오버스티어 감지에 사용
   * @returns 슬립 각도 (라디안, -π ~ π)
   */
  private calculateSlipAngle(car: CarState): number {
    // 차량이 바라보는 방향
    const carAngle = car.angle;
    
    // 실제 속도 벡터가 향하는 방향
    const velocityMagnitude = Math.sqrt(
      car.velocity.x * car.velocity.x + 
      car.velocity.y * car.velocity.y
    );
    
    // 속도가 너무 작으면 슬립 각도 계산 불가 (정지 상태)
    if (velocityMagnitude < 1) {
      return 0;
    }
    
    const velocityAngle = Math.atan2(car.velocity.y, car.velocity.x);
    
    // 슬립 각도 = 이동 방향 - 차체 방향
    let slipAngle = velocityAngle - carAngle;
    
    // -π ~ π 범위로 정규화
    while (slipAngle > Math.PI) slipAngle -= 2 * Math.PI;
    while (slipAngle < -Math.PI) slipAngle += 2 * Math.PI;
    
    return slipAngle;
  }
  
  /**
   * 슬립 각도에 따른 그립 페널티 계산
   * - 최적 슬립 각도(0-5도): 100% 그립
   * - 중간 슬립(5-15도): 70-100% 그립 (타이어가 미끄러지기 시작)
   * - 심각한 슬립(15도+): 50% 그립 (심각한 언더/오버스티어)
   * @returns 그립 배율 (0.5 ~ 1.0)
   */
  private getSlipGripMultiplier(slipAngle: number): number {
    const absSlip = Math.abs(slipAngle);
    
    // 각도를 도(degree)로 변환하여 이해하기 쉽게
    const slipDegrees = (absSlip * 180) / Math.PI;
    
    if (slipDegrees < 5) {
      // 0-5도: 최적 슬립 각도 - 100% 그립
      return 1.0;
    } else if (slipDegrees < 15) {
      // 5-15도: 타이어 한계 접근 - 선형으로 그립 감소
      const ratio = (slipDegrees - 5) / 10;
      return 1.0 - ratio * 0.3; // 100% → 70%
    } else if (slipDegrees < 30) {
      // 15-30도: 심각한 슬립 - 급격한 그립 손실
      const ratio = (slipDegrees - 15) / 15;
      return 0.7 - ratio * 0.2; // 70% → 50%
    } else {
      // 30도+: 거의 스핀 상태 - 최소 그립
      return 0.5;
    }
  }
  
  /**
   * 슬립 각도 기반 카운터스티어 힌트 제공 (선택적)
   * - 클라이언트에 슬립 상태를 전달하여 UI 표시 가능
   * @returns 'none' | 'understeer' | 'oversteer' | 'severe'
   */
  private getSlipCondition(slipAngle: number, steerAngle: number): string {
    const absSlip = Math.abs(slipAngle);
    const slipDegrees = (absSlip * 180) / Math.PI;
    
    if (slipDegrees < 5) {
      return 'none'; // 정상 주행
    }
    
    // 슬립 방향과 조향 방향 비교
    const isSlippingOutward = (slipAngle * steerAngle) > 0;
    
    if (slipDegrees < 15) {
      // 가벼운 슬립
      return isSlippingOutward ? 'understeer' : 'oversteer';
    } else {
      // 심각한 슬립
      return 'severe';
    }
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

    // 대기실/완료 상태에서는 플레이어를 제거하되, 호스트인 경우에는 방을 유지
    // (재연결을 고려하여 호스트가 나가도 방을 즉시 삭제하지 않음)
    room.players.delete(playerId);
    this.playerRooms.delete(playerId);

    // 방이 비었으면 삭제 (단, 호스트가 나간 경우 잠시 유지)
    if (room.players.size === 0) {
      // 호스트가 나간 경우 5초 후 삭제 (재연결 대기)
      if (wasHost) {
        setTimeout(() => {
          const checkRoom = this.rooms.get(roomId);
          if (checkRoom && checkRoom.players.size === 0) {
            this.rooms.delete(roomId);
          }
        }, 5000);
        return { room, wasHost };
      }
      // 일반 플레이어가 나간 경우 즉시 삭제
      this.rooms.delete(roomId);
      return { room: null, wasHost };
    }

    // 호스트가 나갔으면 다음 플레이어에게 호스트 위임
    if (wasHost) {
      const nextHost = room.players.keys().next().value;
      if (nextHost) {
        room.host = nextHost;
        // 호스트 닉네임도 업데이트
        const nextHostCar = room.players.get(nextHost);
        if (nextHostCar) {
          room.hostNickname = nextHostCar.nickname;
        }
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

    // 모든 플레이어 상태 초기화
    room.players.forEach(car => {
      car.lap = 0;
      car.checkpoint = -1;
      car.speed = 0;
      car.steerAngle = 0;
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

  // ========================================
  // 3️⃣ 개선된 updateCarPhysics (기존 메서드 대체)
  // ========================================
  
  private updateCarPhysics(
    room: GameRoom,
    car: CarState,
    input: { up: boolean; down: boolean; left: boolean; right: boolean },
    deltaTime: number,
  ): void {
    const prevPosition: Vector2D = { ...car.position };
  
    const onTrack = this.isOnTrack(car.position, room.trackName);
    const maxForwardSpeed = onTrack ? this.MAX_SPEED : this.MAX_SPEED_OFF_TRACK;
  
    // =========================
    // 1️⃣ 속도 입력 처리 (기존과 동일)
    // =========================
    if (input.up) {
      const accel = onTrack 
        ? this.getAcceleration(car.speed)
        : this.ACCELERATION_OFF_TRACK;
      car.speed += accel * deltaTime;
    }
  
    if (input.down) {
      if (car.speed > 5) {
        car.speed -= this.BRAKE_POWER * deltaTime;
      } else {
        const reverseAccel = onTrack 
          ? this.ACCEL_LOW 
          : this.ACCELERATION_OFF_TRACK;
        car.speed -= reverseAccel * deltaTime;
      }
    }
  
    if (!input.up && !input.down) {
      if (car.speed > 0) {
        car.speed = Math.max(0, car.speed - this.FRICTION * deltaTime);
      } else if (car.speed < 0) {
        car.speed = Math.min(0, car.speed + this.FRICTION * deltaTime);
      }
    }
  
    // 트랙 밖 감속 처리
    if (!onTrack && car.speed > this.MAX_SPEED_OFF_TRACK) {
      car.speed = Math.max(
        this.MAX_SPEED_OFF_TRACK,
        car.speed - this.OFF_TRACK_DECELERATION * deltaTime
      );
    }
  
    car.speed = Math.min(car.speed, maxForwardSpeed);
    car.speed = Math.max(car.speed, -this.MAX_REVERSE_SPEED);
  
    // =========================
    // 2️⃣ 🆕 개선된 조향각 계산
    // =========================
    
    // 입력에 따른 목표 조향각 설정
    let targetSteer = 0;
    if (input.left && !input.right) targetSteer = -this.MAX_STEER_ANGLE;
    else if (input.right && !input.left) targetSteer = this.MAX_STEER_ANGLE;

    // 🆕 속도 기반 조향각 제한 적용 (실제 F1 특성)
    targetSteer = this.getSpeedSensitiveSteerAngle(targetSteer, car.speed);

    // 조향각 부드럽게 적용 (핸들의 관성/무게감)
    const steerInertia = 1 / (1 + Math.abs(car.speed) * 0.020);
    
    // 조향각 반대 방향 전환 감지
    const isReversingDirection = (car.steerAngle * targetSteer) < 0 && Math.abs(car.steerAngle) > 0.01;
    
    // 실제 조향각 업데이트
    const isInputActive = input.left || input.right;
    let steeringSpeed = isInputActive 
      ? this.STEERING_RESPONSE_SPEED 
      : this.STEERING_CENTERING_SPEED;
    
    if (isReversingDirection && isInputActive) {
      steeringSpeed *= 3.5;
    }
    
    car.steerAngle +=
      (targetSteer - car.steerAngle) *
      Math.min(1, steeringSpeed * steerInertia * deltaTime);

    // =========================
    // 3️⃣ 자전거 모델 물리 (기존과 동일)
    // =========================
    const speedMps = car.speed / 3.6;
    const pixelsPerSecond = speedMps * this.PIXELS_PER_METER;
  
    const frontWheelAngle = car.angle + car.steerAngle;
    
    const frontVelX = pixelsPerSecond * Math.cos(frontWheelAngle);
    const frontVelY = pixelsPerSecond * Math.sin(frontWheelAngle);
    
    const rearVelX = pixelsPerSecond * Math.cos(car.angle);
    const rearVelY = pixelsPerSecond * Math.sin(car.angle);
    
    const targetVelX = (frontVelX + rearVelX) / 2;
    const targetVelY = (frontVelY + rearVelY) / 2;
    
    // =========================
    // 4️⃣ 🆕 슬립 각도 기반 그립 계산
    // =========================
    const speedAbs = Math.abs(pixelsPerSecond);

    // 기본 다운포스 계산
    const downforce = speedAbs * speedAbs * this.DOWNFORCE_COEFF;
    const totalGrip = this.BASE_LATERAL_GRIP + downforce;

    // 고속 조향 스트레스 (언더스티어)
    const steeringStress = Math.abs(car.steerAngle) * speedAbs * 0.015;
    let effectiveGrip = Math.max(0.3, totalGrip - steeringStress);

    // 🆕 슬립 각도 기반 그립 손실 추가
    const slipAngle = this.calculateSlipAngle(car);
    const slipGripMultiplier = this.getSlipGripMultiplier(slipAngle);
    
    // 최종 그립 = 기본 그립 × 슬립 페널티
    effectiveGrip *= slipGripMultiplier;

    // 🆕 (선택적) 슬립 상태를 car에 저장 (UI/디버깅용)
    // car.slipAngle = slipAngle;
    // car.slipCondition = this.getSlipCondition(slipAngle, car.steerAngle);

    // 그립을 이용해 목표 속도로 수렴
    const gripFactor = Math.min(1, effectiveGrip * deltaTime);

    car.velocity.x += (targetVelX - car.velocity.x) * gripFactor;
    car.velocity.y += (targetVelY - car.velocity.y) * gripFactor;
  
    // =========================
    // 5️⃣ 차체 회전 (기존과 동일)
    // =========================
    let angularVelocity = 0;
    if (Math.abs(car.steerAngle) > 0.0001 && Math.abs(pixelsPerSecond) > 0.1) {
      const wheelBasePixels = this.WHEEL_BASE_METERS * this.PIXELS_PER_METER;
      angularVelocity = (pixelsPerSecond / wheelBasePixels) * Math.tan(car.steerAngle);
    }
    
    car.angle += angularVelocity * deltaTime;
    car.angularVelocity = angularVelocity;
  
    // =========================
    // 6️⃣ 위치 업데이트 (기존과 동일)
    // =========================
    car.position.x += car.velocity.x * deltaTime;
    car.position.y += car.velocity.y * deltaTime;
  
    if (Math.abs(car.speed) < 0.1) car.speed = 0;
  
    // =========================
    // 7️⃣ 체크포인트 & 랩 (기존과 동일)
    // =========================
    const checkpoints = this.getCheckpoints(room.trackName);
    this.updateCheckpointProgress(car, checkpoints, room.trackName);
  
    const crossDir = this.checkStartLineCross(prevPosition, car.position, room.trackName);
    if (crossDir === 'forward' && car.checkpoint >= checkpoints.length - 1) {
      car.lap += 1;
      car.checkpoint = -1;
  
      if (!car.retired && room.startTime != null && car.lap >= room.totalLaps) {
        car.finished = true;
        car.finishTime = Date.now() - room.startTime;
      }
    }
  }

  

  // 체크포인트를 올바른 순서로 통과했는지 진행도 업데이트
  private updateCheckpointProgress(car: CarState, checkpoints: Vector2D[], trackName: string): void {
    const lastCheckpoint = car.checkpoint;

    // 이미 마지막 체크포인트까지 통과했다면 더 이상 진행도는 올리지 않음
    if (lastCheckpoint >= checkpoints.length - 1) {
      return;
    }

    const nextCheckpoint = lastCheckpoint + 1; // -1 -> 0, 0 -> 1, 1 -> 2 ...
    const cp = checkpoints[nextCheckpoint];

    const dx = car.position.x - cp.x;
    const dy = car.position.y - cp.y;
    const distSq = dx * dx + dy * dy;

    const checkpointRadius = this.getCheckpointRadius(trackName);
    if (distSq <= checkpointRadius * checkpointRadius) {
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
    trackName: string,
  ): 'forward' | 'backward' | null {
    const startLine = this.getStartLine(trackName);
    // 진행 방향(트랙 접선 방향)을 법선 벡터로 사용
    const nx = Math.cos(startLine.angle);
    const ny = Math.sin(startLine.angle);
    // 라인 자체는 진행 방향에 수직인 방향(세로 방향)으로 뻗어 있음
    const tx = -ny;
    const ty = nx;

    const pxPrev = prev.x - startLine.x;
    const pyPrev = prev.y - startLine.y;
    const pxCurr = curr.x - startLine.x;
    const pyCurr = curr.y - startLine.y;

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

  // 현재 속도에 따른 가속도 반환 (F1 구간별 가속도)
  // - 0-100km/h: ACCEL_LOW (40 km/h/s)
  // - 100-200km/h: ACCEL_MID (50 km/h/s) - 더 빠름
  // - 200-300km/h: ACCEL_HIGH (25 km/h/s) - 느림
  private getAcceleration(currentSpeed: number): number {
    const speed = Math.abs(currentSpeed);
    
    if (speed < 100) {
      // 0-100km/h: 기본 가속도
      return this.ACCEL_LOW;
    } else if (speed < 200) {
      // 100-200km/h: 더 빠른 가속도 (고단 기어 효율)
      return this.ACCEL_MID;
    } else {
      // 200-300km/h: 느린 가속도 (공기 저항 증가)
      return this.ACCEL_HIGH;
    }
  }

  // 중앙선으로부터의 최소 거리를 이용해 트랙 안/밖 판정
  // 클라이언트와 동일한 판정 범위 사용 (trackWidth / 2 + 여유값)
  // 세그먼트까지의 거리를 계산하여 더 정확한 판정
  private isOnTrack(position: Vector2D, trackName: string): boolean {
    const centerPath = this.trackCenterPaths.get(trackName) || this.trackCenterPaths.get('basic-circuit')!;
    let minDist = Infinity;

    // 각 세그먼트(두 포인트 사이의 선분)까지의 거리 계산
    for (let i = 0; i < centerPath.length; i++) {
      const p1 = centerPath[i];
      const p2 = centerPath[(i + 1) % centerPath.length];
      
      // 세그먼트까지의 최소 거리 계산
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segLenSq = dx * dx + dy * dy;
      
      if (segLenSq < 0.001) {
        // 세그먼트 길이가 거의 0이면 포인트 간 거리만 계산
        const dist = Math.sqrt((position.x - p1.x) ** 2 + (position.y - p1.y) ** 2);
        minDist = Math.min(minDist, dist);
      } else {
        // 세그먼트 위의 가장 가까운 점 찾기
        const t = Math.max(0, Math.min(1, ((position.x - p1.x) * dx + (position.y - p1.y) * dy) / segLenSq));
        const closestX = p1.x + t * dx;
        const closestY = p1.y + t * dy;
        const dist = Math.sqrt((position.x - closestX) ** 2 + (position.y - closestY) ** 2);
        minDist = Math.min(minDist, dist);
      }
    }

    // 모든 트랙에서 TRACK_WIDTH_PX 상수 사용
    const trackWidth = this.TRACK_WIDTH_PX;
    // 클라이언트와 동일: trackWidth / 2 + 여유값
    const margin = 50; // 모든 트랙에서 동일한 여유값 사용
    const maxDist = trackWidth / 2 + margin;
    return minDist <= maxDist;
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
      hostNickname: room.hostNickname,
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

