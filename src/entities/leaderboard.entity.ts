import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('leaderboard')
export class Leaderboard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  playerId: number;

  @Column()
  nickname: string;

  @Column()
  trackName: string;

  @Column({ type: 'float' })
  lapTime: number;

  @CreateDateColumn()
  createdAt: Date;
}




