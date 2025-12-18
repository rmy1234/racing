export declare class Race {
    id: number;
    trackName: string;
    totalLaps: number;
    results: {
        playerId: number;
        nickname: string;
        position: number;
        totalTime: number;
        bestLapTime: number;
    }[];
    createdAt: Date;
}
