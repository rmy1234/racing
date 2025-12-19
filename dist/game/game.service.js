"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const track_configs_1 = require("./tracks/track-configs");
let GameService = class GameService {
    rooms = new Map();
    playerRooms = new Map();
    MAX_SPEED = 300;
    MAX_SPEED_OFF_TRACK = 120;
    MAX_REVERSE_SPEED = 30;
    ACCEL_LOW = 45;
    ACCEL_MID = 50;
    ACCEL_HIGH = 25;
    ACCELERATION_OFF_TRACK = this.ACCEL_LOW * 0.65;
    OFF_TRACK_DECELERATION = 80;
    BRAKE_POWER = 80;
    FRICTION = 40;
    PIXELS_PER_METER = 8;
    TRACK_WIDTH_PX = 100;
    trackCenterPaths = (() => {
        const paths = new Map();
        track_configs_1.trackServerConfigs.forEach((config, trackId) => {
            const path = config.buildCenterPath();
            paths.set(trackId, path.map(p => ({ x: p.x, y: p.y })));
        });
        return paths;
    })();
    MAX_STEER_ANGLE = Math.PI / 6.5;
    WHEEL_BASE_METERS = 3.0;
    CHECKPOINT_RADIUS = 120;
    START_LINE_HALF_LENGTH = 50;
    getCheckpoints(trackName) {
        const config = track_configs_1.trackServerConfigs.get(trackName);
        if (config) {
            return config.checkpoints.map(cp => ({ x: cp.x, y: cp.y }));
        }
        const defaultConfig = track_configs_1.trackServerConfigs.get('basic-circuit');
        return defaultConfig.checkpoints.map(cp => ({ x: cp.x, y: cp.y }));
    }
    getStartLine(trackName) {
        const config = track_configs_1.trackServerConfigs.get(trackName);
        if (config) {
            return {
                x: config.startLine.x,
                y: config.startLine.y,
                angle: config.startLine.angle,
            };
        }
        const defaultConfig = track_configs_1.trackServerConfigs.get('basic-circuit');
        return {
            x: defaultConfig.startLine.x,
            y: defaultConfig.startLine.y,
            angle: defaultConfig.startLine.angle,
        };
    }
    BASE_LATERAL_GRIP = 11.0;
    DOWNFORCE_COEFF = 0.004;
    STEERING_RESPONSE_SPEED = 3.5;
    STEERING_CENTERING_SPEED = 40.0;
    createRoom(hostId, hostNickname, roomName, carSkin, trackId) {
        const roomId = this.generateRoomId();
        const room = {
            id: roomId,
            name: roomName,
            host: hostId,
            players: new Map(),
            status: 'waiting',
            trackName: trackId ?? 'basic-circuit',
            totalLaps: 5,
            startTime: null,
            maxPlayers: 8,
            lastUpdateTime: null,
        };
        this.addPlayerToRoom(room, hostId, hostNickname, 0, carSkin);
        this.rooms.set(roomId, room);
        this.playerRooms.set(hostId, roomId);
        return room;
    }
    joinRoom(roomId, playerId, nickname, carSkin) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        if (room.status !== 'waiting')
            return null;
        if (room.players.size >= room.maxPlayers)
            return null;
        const spawnIndex = room.players.size;
        this.addPlayerToRoom(room, playerId, nickname, spawnIndex, carSkin);
        this.playerRooms.set(playerId, roomId);
        return room;
    }
    addPlayerToRoom(room, playerId, nickname, spawnIndex, carSkin) {
        const spawnData = this.getSpawnPositions(room.trackName);
        const spawnPos = spawnData.positions[spawnIndex % spawnData.positions.length];
        const carState = {
            id: playerId,
            nickname,
            position: { ...spawnPos },
            velocity: { x: 0, y: 0 },
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
    getSpawnPositions(trackName) {
        const config = track_configs_1.trackServerConfigs.get(trackName);
        if (config) {
            return {
                positions: config.spawnPositions.map(p => ({ x: p.x, y: p.y })),
                angle: config.spawnAngle,
            };
        }
        const defaultConfig = track_configs_1.trackServerConfigs.get('basic-circuit');
        return {
            positions: defaultConfig.spawnPositions.map(p => ({ x: p.x, y: p.y })),
            angle: defaultConfig.spawnAngle,
        };
    }
    leaveRoom(playerId) {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId)
            return { room: null, wasHost: false };
        const room = this.rooms.get(roomId);
        if (!room)
            return { room: null, wasHost: false };
        const wasHost = room.host === playerId;
        const car = room.players.get(playerId);
        if (room.status === 'racing' && car) {
            car.finished = true;
            car.retired = true;
            car.speed = 0;
            car.velocity = { x: 0, y: 0 };
            car.input = { up: false, down: false, left: false, right: false };
            if (room.startTime != null) {
                car.retiredAt = Date.now() - room.startTime;
            }
            else {
                car.retiredAt = 0;
            }
            this.playerRooms.delete(playerId);
            return { room, wasHost };
        }
        room.players.delete(playerId);
        this.playerRooms.delete(playerId);
        if (room.players.size === 0) {
            this.rooms.delete(roomId);
            return { room: null, wasHost };
        }
        if (wasHost) {
            const nextHost = room.players.keys().next().value;
            if (nextHost) {
                room.host = nextHost;
            }
        }
        return { room, wasHost };
    }
    updatePlayerInput(playerId, input) {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId)
            return null;
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'racing')
            return null;
        const car = room.players.get(playerId);
        if (!car || car.finished)
            return null;
        car.input = { ...input };
        return car;
    }
    startCountdown(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'waiting')
            return false;
        if (room.players.size < 1)
            return false;
        room.status = 'countdown';
        return true;
    }
    startRace(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || (room.status !== 'countdown' && room.status !== 'waiting'))
            return false;
        room.status = 'racing';
        room.startTime = Date.now();
        room.lastUpdateTime = room.startTime;
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
    updateRoomPhysics(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'racing')
            return null;
        const now = Date.now();
        if (room.lastUpdateTime == null) {
            room.lastUpdateTime = now;
            return null;
        }
        const deltaTime = (now - room.lastUpdateTime) / 1000;
        room.lastUpdateTime = now;
        room.players.forEach(car => {
            if (!car.finished) {
                this.updateCarPhysics(room, car, car.input, deltaTime);
            }
        });
        const results = this.checkRaceFinished(room);
        return results ? { results } : null;
    }
    updateCarPhysics(room, car, input, deltaTime) {
        const prevPosition = { ...car.position };
        const onTrack = this.isOnTrack(car.position, room.trackName);
        const maxForwardSpeed = onTrack ? this.MAX_SPEED : this.MAX_SPEED_OFF_TRACK;
        if (input.up) {
            const accel = onTrack
                ? this.getAcceleration(car.speed)
                : this.ACCELERATION_OFF_TRACK;
            car.speed += accel * deltaTime;
        }
        if (input.down) {
            if (car.speed > 5) {
                car.speed -= this.BRAKE_POWER * deltaTime;
            }
            else {
                const reverseAccel = onTrack
                    ? this.ACCEL_LOW
                    : this.ACCELERATION_OFF_TRACK;
                car.speed -= reverseAccel * deltaTime;
            }
        }
        if (!input.up && !input.down) {
            if (car.speed > 0) {
                car.speed = Math.max(0, car.speed - this.FRICTION * deltaTime);
            }
            else if (car.speed < 0) {
                car.speed = Math.min(0, car.speed + this.FRICTION * deltaTime);
            }
        }
        if (!onTrack && car.speed > this.MAX_SPEED_OFF_TRACK) {
            car.speed = Math.max(this.MAX_SPEED_OFF_TRACK, car.speed - this.OFF_TRACK_DECELERATION * deltaTime);
        }
        car.speed = Math.min(car.speed, maxForwardSpeed);
        car.speed = Math.max(car.speed, -this.MAX_REVERSE_SPEED);
        let targetSteer = 0;
        if (input.left && !input.right)
            targetSteer = -this.MAX_STEER_ANGLE;
        else if (input.right && !input.left)
            targetSteer = this.MAX_STEER_ANGLE;
        const visualSpeedRatio = Math.min(1, Math.abs(car.speed) / (this.MAX_SPEED * 0.7));
        targetSteer *= 0.65 + 0.30 * visualSpeedRatio;
        const steerInertia = 1 / (1 + Math.abs(car.speed) * 0.025);
        const isInputActive = input.left || input.right;
        const steeringSpeed = isInputActive
            ? this.STEERING_RESPONSE_SPEED
            : this.STEERING_CENTERING_SPEED;
        car.steerAngle +=
            (targetSteer - car.steerAngle) *
                Math.min(1, steeringSpeed * steerInertia * deltaTime);
        const speedMps = car.speed / 3.6;
        const pixelsPerSecond = speedMps * this.PIXELS_PER_METER;
        const frontWheelAngle = car.angle + car.steerAngle;
        const frontVelX = pixelsPerSecond * Math.cos(frontWheelAngle);
        const frontVelY = pixelsPerSecond * Math.sin(frontWheelAngle);
        const rearVelX = pixelsPerSecond * Math.cos(car.angle);
        const rearVelY = pixelsPerSecond * Math.sin(car.angle);
        const targetVelX = (frontVelX + rearVelX) / 2;
        const targetVelY = (frontVelY + rearVelY) / 2;
        const speedAbs = Math.abs(pixelsPerSecond);
        const downforce = speedAbs * speedAbs * this.DOWNFORCE_COEFF;
        const totalGrip = this.BASE_LATERAL_GRIP + downforce;
        const gripFactor = Math.min(1, totalGrip * deltaTime);
        car.velocity.x += (targetVelX - car.velocity.x) * gripFactor;
        car.velocity.y += (targetVelY - car.velocity.y) * gripFactor;
        let angularVelocity = 0;
        if (Math.abs(car.steerAngle) > 0.0001 && Math.abs(pixelsPerSecond) > 0.1) {
            const wheelBasePixels = this.WHEEL_BASE_METERS * this.PIXELS_PER_METER;
            angularVelocity = (pixelsPerSecond / wheelBasePixels) * Math.sin(car.steerAngle);
        }
        car.angle += angularVelocity * deltaTime;
        car.angularVelocity = angularVelocity;
        car.position.x += car.velocity.x * deltaTime;
        car.position.y += car.velocity.y * deltaTime;
        if (Math.abs(car.speed) < 0.1)
            car.speed = 0;
        const checkpoints = this.getCheckpoints(room.trackName);
        this.updateCheckpointProgress(car, checkpoints);
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
    updateCheckpointProgress(car, checkpoints) {
        const lastCheckpoint = car.checkpoint;
        if (lastCheckpoint >= checkpoints.length - 1) {
            return;
        }
        const nextCheckpoint = lastCheckpoint + 1;
        const cp = checkpoints[nextCheckpoint];
        const dx = car.position.x - cp.x;
        const dy = car.position.y - cp.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= this.CHECKPOINT_RADIUS * this.CHECKPOINT_RADIUS) {
            car.checkpoint = nextCheckpoint;
        }
    }
    checkRaceFinished(room) {
        if (room.status !== 'racing')
            return null;
        const players = Array.from(room.players.values());
        const allDone = players.every(p => p.finished);
        if (!allDone)
            return null;
        room.status = 'finished';
        const now = Date.now();
        const start = room.startTime ?? now;
        const finished = players.filter(p => !p.retired);
        const retired = players.filter(p => p.retired);
        finished.sort((a, b) => {
            const ta = a.finishTime ?? (now - start);
            const tb = b.finishTime ?? (now - start);
            return ta - tb;
        });
        retired.sort((a, b) => {
            const ta = a.retiredAt ?? 0;
            const tb = b.retiredAt ?? 0;
            return tb - ta;
        });
        const ordered = [...finished, ...retired];
        return ordered.map(p => {
            const retiredFlag = p.retired;
            const baseTime = retiredFlag
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
    checkStartLineCross(prev, curr, trackName) {
        const startLine = this.getStartLine(trackName);
        const nx = Math.cos(startLine.angle);
        const ny = Math.sin(startLine.angle);
        const tx = -ny;
        const ty = nx;
        const pxPrev = prev.x - startLine.x;
        const pyPrev = prev.y - startLine.y;
        const pxCurr = curr.x - startLine.x;
        const pyCurr = curr.y - startLine.y;
        const sidePrev = pxPrev * nx + pyPrev * ny;
        const sideCurr = pxCurr * nx + pyCurr * ny;
        if (sidePrev === 0 && sideCurr === 0)
            return null;
        if (sidePrev > 0 && sideCurr > 0)
            return null;
        if (sidePrev < 0 && sideCurr < 0)
            return null;
        const projPrev = pxPrev * tx + pyPrev * ty;
        const projCurr = pxCurr * tx + pyCurr * ty;
        const projMid = (projPrev + projCurr) / 2;
        const margin = 8;
        if (Math.abs(projMid) > this.START_LINE_HALF_LENGTH + margin) {
            return null;
        }
        if (sidePrev < sideCurr) {
            return 'forward';
        }
        if (sidePrev > sideCurr) {
            return 'backward';
        }
        return null;
    }
    getAcceleration(currentSpeed) {
        const speed = Math.abs(currentSpeed);
        if (speed < 100) {
            return this.ACCEL_LOW;
        }
        else if (speed < 200) {
            return this.ACCEL_MID;
        }
        else {
            return this.ACCEL_HIGH;
        }
    }
    isOnTrack(position, trackName) {
        const centerPath = this.trackCenterPaths.get(trackName) || this.trackCenterPaths.get('basic-circuit');
        let minDistSq = Infinity;
        for (const point of centerPath) {
            const dx = position.x - point.x;
            const dy = position.y - point.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDistSq) {
                minDistSq = distSq;
            }
        }
        const maxDist = this.TRACK_WIDTH_PX / 2 + 15;
        return minDistSq <= maxDist * maxDist;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }
    getRoomByPlayer(playerId) {
        const roomId = this.playerRooms.get(playerId);
        if (!roomId)
            return null;
        return this.rooms.get(roomId) || null;
    }
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    getWaitingRooms() {
        return Array.from(this.rooms.values())
            .filter(room => room.status === 'waiting')
            .map(room => ({
            id: room.id,
            name: room.name,
            playerCount: room.players.size,
            maxPlayers: room.maxPlayers,
        }));
    }
    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    serializeRoom(room) {
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
    serializeGameState(room) {
        return {
            roomId: room.id,
            status: room.status,
            players: Array.from(room.players.values()),
            startTime: room.startTime,
        };
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)()
], GameService);
//# sourceMappingURL=game.service.js.map