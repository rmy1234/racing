export interface TrackServerConfig {
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
    trackWidth: number;
}
export declare const basicCircuitServerConfig: TrackServerConfig;
export declare const monzaServerConfig: TrackServerConfig;
export declare const newTrackServerConfig: TrackServerConfig;
export declare const trackServerConfigs: Map<string, TrackServerConfig>;
