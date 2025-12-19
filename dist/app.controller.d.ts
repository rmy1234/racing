import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHealth(): {
        status: string;
    };
    getCars(): Promise<{
        id: string;
        url: string;
    }[]>;
}
