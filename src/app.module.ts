import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { Player } from './entities/player.entity';
import { Race } from './entities/race.entity';
import { Leaderboard } from './entities/leaderboard.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'racing.db',
      entities: [Player, Race, Leaderboard],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Player, Race, Leaderboard]),
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
