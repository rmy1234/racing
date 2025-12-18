import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
  });

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';
  
  // Graceful shutdown 설정
  app.enableShutdownHooks();
  
  // 프로세스 종료 시그널 처리
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 ${signal} 시그널 수신, 서버 종료 중...`);
    await app.close();
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // Windows에서 Ctrl+C 처리
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
