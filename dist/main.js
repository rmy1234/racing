"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
    });
    const port = process.env.PORT || 3000;
    const host = '0.0.0.0';
    app.enableShutdownHooks();
    const shutdown = async (signal) => {
        console.log(`\n🛑 ${signal} 시그널 수신, 서버 종료 중...`);
        await app.close();
        console.log('✅ 서버가 정상적으로 종료되었습니다.');
        process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    if (process.platform === 'win32') {
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.on('SIGINT', () => process.emit('SIGINT'));
    }
    await app.listen(port, host);
    console.log(`🏎️ Racing game server running on http://10.2.2.116:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map