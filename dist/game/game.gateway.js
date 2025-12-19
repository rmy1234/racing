"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const game_service_1 = require("./game.service");
let GameGateway = class GameGateway {
    gameService;
    server;
    gameLoopInterval = null;
    constructor(gameService) {
        this.gameService = gameService;
        this.startGameLoop();
    }
    onModuleDestroy() {
        this.stopGameLoop();
        console.log('🎮 게임 게이트웨이 정리 완료');
    }
    stopGameLoop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
    }
    startGameLoop() {
        this.gameLoopInterval = setInterval(() => {
            this.broadcastGameStates();
        }, 1000 / 60);
    }
    broadcastGameStates() {
        const rooms = this.gameService.getAllRooms();
        rooms.forEach(room => {
            if (room.status === 'racing') {
                const result = this.gameService.updateRoomPhysics(room.id);
                if (room.status === 'racing') {
                    const gameState = this.gameService.serializeGameState(room);
                    this.server.to(room.id).emit('gameState', gameState);
                }
                if (result && result.results) {
                    this.server.to(room.id).emit('raceEnd', result.results);
                }
            }
        });
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        const { room, wasHost } = this.gameService.leaveRoom(client.id);
        if (room) {
            client.leave(room.id);
            this.server.to(room.id).emit('playerLeft', {
                playerId: client.id,
                room: this.gameService.serializeRoom(room),
                newHost: wasHost ? room.host : null,
            });
        }
    }
    handleGetRooms(client) {
        const rooms = this.gameService.getWaitingRooms();
        client.emit('roomList', rooms);
    }
    handleCreateRoom(client, data) {
        const room = this.gameService.createRoom(client.id, data.nickname, data.roomName, data.carSkin ?? null, data.trackId ?? 'basic-circuit');
        client.join(room.id);
        client.emit('roomCreated', this.gameService.serializeRoom(room));
        this.server.emit('roomListUpdated', this.gameService.getWaitingRooms());
    }
    handleJoinRoom(client, data) {
        const room = this.gameService.joinRoom(data.roomId, client.id, data.nickname, data.carSkin ?? null);
        if (room) {
            client.join(room.id);
            client.emit('roomJoined', this.gameService.serializeRoom(room));
            client.to(room.id).emit('playerJoined', {
                playerId: client.id,
                nickname: data.nickname,
                room: this.gameService.serializeRoom(room),
            });
            this.server.emit('roomListUpdated', this.gameService.getWaitingRooms());
        }
        else {
            client.emit('joinError', { message: '방에 참가할 수 없습니다.' });
        }
    }
    handleLeaveRoom(client) {
        const { room, wasHost } = this.gameService.leaveRoom(client.id);
        if (room) {
            client.leave(room.id);
            this.server.to(room.id).emit('playerLeft', {
                playerId: client.id,
                room: this.gameService.serializeRoom(room),
                newHost: wasHost ? room.host : null,
            });
            this.server.emit('roomListUpdated', this.gameService.getWaitingRooms());
        }
        client.emit('leftRoom');
    }
    handleStartGame(client) {
        const room = this.gameService.getRoomByPlayer(client.id);
        if (!room) {
            client.emit('error', { message: '방을 찾을 수 없습니다.' });
            return;
        }
        if (room.host !== client.id) {
            client.emit('error', { message: '호스트만 게임을 시작할 수 있습니다.' });
            return;
        }
        if (this.gameService.startRace(room.id)) {
            this.server.to(room.id).emit('raceStart', {
                room: this.gameService.serializeRoom(room),
            });
        }
    }
    handlePlayerInput(client, input) {
        this.gameService.updatePlayerInput(client.id, input);
    }
    handlePing(client) {
        client.emit('pong', { timestamp: Date.now() });
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('getRooms'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleGetRooms", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('createRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleCreateRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('startGame'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleStartGame", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('playerInput'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handlePlayerInput", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handlePing", null);
exports.GameGateway = GameGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [game_service_1.GameService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map