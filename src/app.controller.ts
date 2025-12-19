import { Controller, Get } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  // 사용 가능한 차량 스킨 목록 반환
  @Get('cars')
  async getCars(): Promise<{ id: string; url: string }[]> {
    try {
      const carsDir = join(__dirname, '..', 'public', 'assets', 'cars');
      const files = await fs.readdir(carsDir);

      return files
        .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
        .map((file) => ({
          id: file,
          url: `/assets/cars/${file}`,
        }));
    } catch (error) {
      console.error('Failed to read cars directory:', error);
      return [];
    }
  }
}
