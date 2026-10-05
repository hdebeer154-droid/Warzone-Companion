import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueService, QUEUES } from '../queue/queue.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queue: QueueService,
  ) {}

  @Public()
  @Get()
  async check() {
    const [db, redis] = await Promise.all([this.prisma.ping(), this.redis.ping()]);
    let queues: Record<string, unknown> = {};
    try {
      queues = {
        sync: await this.queue.getCounts(QUEUES.SYNC),
        ocr: await this.queue.getCounts(QUEUES.OCR),
        notifications: await this.queue.getCounts(QUEUES.NOTIFICATIONS),
      };
    } catch {
      queues = { error: 'queue unavailable' };
    }
    const ok = db && redis;
    return {
      status: ok ? 'ok' : 'degraded',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      dependencies: { database: db ? 'up' : 'down', redis: redis ? 'up' : 'down' },
      queues,
    };
  }
}
