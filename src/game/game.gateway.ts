import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private gameLoopInterval: NodeJS.Timeout | null = null;

  constructor(private readonly gameService: GameService) {
    // 게임 루프 시작 (60fps)
    this.startGameLoop();
  }

  // 모듈 종료 시 게임 루프 정리
  onModuleDestroy() {
    this.stopGameLoop();
    console.log('🎮 게임 게이트웨이 정리 완료');
  }

  private stopGameLoop(): void {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  private startGameLoop(): void {
    this.gameLoopInterval = setInterval(() => {
      this.broadcastGameStates();
    }, 1000 / 60);
  }

  private broadcastGameStates(): void {
    const rooms = this.gameService.getAllRooms();
    rooms.forEach(room => {
      if (room.status === 'racing') {
        // 각 방의 물리 상태 업데이트 (델타 타임 기반)
        const result = this.gameService.updateRoomPhysics(room.id);

        // 레이스가 진행 중이면 게임 상태 브로드캐스트
        if (room.status === 'racing') {
          const gameState = this.gameService.serializeGameState(room);
          this.server.to(room.id).emit('gameState', gameState);
        }

        // 레이스가 막 종료되었다면 결과 전송
        if (result && result.results) {
          this.server.to(room.id).emit('raceEnd', result.results);
        }
      }
    });
  }

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
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

  @SubscribeMessage('getRooms')
  handleGetRooms(@ConnectedSocket() client: Socket): void {
    const rooms = this.gameService.getWaitingRooms();
    client.emit('roomList', rooms);
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { nickname: string; roomName: string; carSkin?: string | null },
  ): void {
    const room = this.gameService.createRoom(
      client.id,
      data.nickname,
      data.roomName,
      data.carSkin ?? null,
    );
    client.join(room.id);
    client.emit('roomCreated', this.gameService.serializeRoom(room));
    
    // 다른 클라이언트들에게 새 방 알림
    this.server.emit('roomListUpdated', this.gameService.getWaitingRooms());
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; nickname: string; carSkin?: string | null },
  ): void {
    const room = this.gameService.joinRoom(
      data.roomId,
      client.id,
      data.nickname,
      data.carSkin ?? null,
    );

    if (room) {
      client.join(room.id);
      client.emit('roomJoined', this.gameService.serializeRoom(room));
      
      // 방의 다른 플레이어들에게 알림
      client.to(room.id).emit('playerJoined', {
        playerId: client.id,
        nickname: data.nickname,
        room: this.gameService.serializeRoom(room),
      });
      
      this.server.emit('roomListUpdated', this.gameService.getWaitingRooms());
    } else {
      client.emit('joinError', { message: '방에 참가할 수 없습니다.' });
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket): void {
    const { room, wasHost } = this.gameService.leaveRoom(client.id);

    if (room) {
      client.leave(room.id);
      client.emit('leftRoom');
      
      this.server.to(room.id).emit('playerLeft', {
        playerId: client.id,
        room: this.gameService.serializeRoom(room),
        newHost: wasHost ? room.host : null,
      });
      
      this.server.emit('roomListUpdated', this.gameService.getWaitingRooms());
    }
  }

  @SubscribeMessage('startGame')
  handleStartGame(@ConnectedSocket() client: Socket): void {
    const room = this.gameService.getRoomByPlayer(client.id);
    
    if (!room) {
      client.emit('error', { message: '방을 찾을 수 없습니다.' });
      return;
    }

    if (room.host !== client.id) {
      client.emit('error', { message: '호스트만 게임을 시작할 수 있습니다.' });
      return;
    }

    // 카운트다운 없이 바로 레이스 시작
    if (this.gameService.startRace(room.id)) {
      this.server.to(room.id).emit('raceStart', {
        room: this.gameService.serializeRoom(room),
      });
    }
  }

  @SubscribeMessage('playerInput')
  handlePlayerInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() input: { up: boolean; down: boolean; left: boolean; right: boolean },
  ): void {
    this.gameService.updatePlayerInput(client.id, input);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: Date.now() });
  }
}

