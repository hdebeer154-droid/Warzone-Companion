import { Injectable, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueService, QUEUES } from '../queue/queue.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsWorker implements OnModuleInit {
  constructor(
    private readonly queue: QueueService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.queue.createWorker(QUEUES.NOTIFICATIONS, async (job: Job) => this.process(job), 5);
  }

  private async process(job: Job) {
    const { userId, category, title, body, data } = job.data;
    return this.notifications.dispatch(userId, { category, title, body, data });
  }
}
