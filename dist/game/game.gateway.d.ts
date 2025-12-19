import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
export declare class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
    private readonly gameService;
    server: Server;
    private gameLoopInterval;
    constructor(gameService: GameService);
    onModuleDestroy(): void;
    private stopGameLoop;
    private startGameLoop;
    private broadcastGameStates;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleGetRooms(client: Socket): void;
    handleCreateRoom(client: Socket, data: {
        nickname: string;
        roomName: string;
        carSkin?: string | null;
    }): void;
    handleJoinRoom(client: Socket, data: {
        roomId: string;
        nickname: string;
        carSkin?: string | null;
    }): void;
    handleLeaveRoom(client: Socket): void;
    handleStartGame(client: Socket): void;
    handlePlayerInput(client: Socket, input: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
    }): void;
    handlePing(client: Socket): void;
}
