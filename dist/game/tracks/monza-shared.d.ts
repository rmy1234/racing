export interface MonzaSharedConfig {
    buildCenterPath: () => Array<{
        x: number;
        y: number;
    }>;
    spawnPositions: Array<{
        x: number;
        y: number;
    }>;
    spawnAngle: number;
    checkpoints: Array<{
        x: number;
        y: number;
        angle: number;
    }>;
    startLine: {
        x: number;
        y: number;
        angle: number;
    };
}
export declare function buildMonzaCenterPath(): Array<{
    x: number;
    y: number;
}>;
export declare const monzaSharedConfig: MonzaSharedConfig;
