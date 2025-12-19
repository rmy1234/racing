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
    speed: number;
    steerAngle: number;
    input: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
    };
    lap: number;
    checkpoint: number;
    finished: boolean;
    retired: boolean;
    finishTime: number | null;
    retiredAt: number | null;
    carSkin?: string | null;
    angularVelocity: number;
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
export declare class GameService {
    private rooms;
    private playerRooms;
    private readonly MAX_SPEED;
    private readonly MAX_SPEED_OFF_TRACK;
    private readonly MAX_REVERSE_SPEED;
    private readonly ACCEL_LOW;
    private readonly ACCEL_MID;
    private readonly ACCEL_HIGH;
    private readonly ACCELERATION_OFF_TRACK;
    private readonly OFF_TRACK_DECELERATION;
    private readonly BRAKE_POWER;
    private readonly FRICTION;
    private readonly PIXELS_PER_METER;
    private readonly TRACK_WIDTH_PX;
    private readonly TRACK_CENTER_PATH;
    private readonly MAX_STEER_ANGLE;
    private readonly WHEEL_BASE_METERS;
    private readonly CHECKPOINTS;
    private readonly CHECKPOINT_RADIUS;
    private readonly START_LINE_X;
    private readonly START_LINE_Y;
    private readonly START_LINE_ANGLE;
    private readonly START_LINE_HALF_LENGTH;
    private readonly BASE_LATERAL_GRIP;
    private readonly DOWNFORCE_COEFF;
    private readonly STEERING_RESPONSE_SPEED;
    private readonly STEERING_CENTERING_SPEED;
    createRoom(hostId: string, hostNickname: string, roomName: string, carSkin?: string | null, trackId?: string): GameRoom;
    private buildTrackCenterPath;
    joinRoom(roomId: string, playerId: string, nickname: string, carSkin?: string | null): GameRoom | null;
    private addPlayerToRoom;
    private getSpawnPositions;
    leaveRoom(playerId: string): {
        room: GameRoom | null;
        wasHost: boolean;
    };
    updatePlayerInput(playerId: string, input: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
    }): CarState | null;
    startCountdown(roomId: string): boolean;
    startRace(roomId: string): boolean;
    updateRoomPhysics(roomId: string): {
        results: {
            id: string;
            nickname: string;
            totalTime: number;
            retired: boolean;
        }[];
    } | null;
    private updateCarPhysics;
    private updateCheckpointProgress;
    private checkRaceFinished;
    private checkStartLineCross;
    private getAcceleration;
    private isOnTrack;
    getRoom(roomId: string): GameRoom | null;
    getRoomByPlayer(playerId: string): GameRoom | null;
    getAllRooms(): GameRoom[];
    getWaitingRooms(): {
        id: string;
        name: string;
        playerCount: number;
        maxPlayers: number;
    }[];
    private generateRoomId;
    serializeRoom(room: GameRoom): object;
    serializeGameState(room: GameRoom): object;
}
