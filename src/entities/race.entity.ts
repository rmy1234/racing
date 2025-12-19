import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('races')
export class Race {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  trackName: string;

  @Column()
  totalLaps: number;

  @Column({ type: 'simple-json' })
  results: {
    playerId: number;
    nickname: string;
    position: number;
    totalTime: number;
    bestLapTime: number;
  }[];

  @CreateDateColumn()
  createdAt: Date;
}





