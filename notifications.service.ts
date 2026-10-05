import { Injectable, Logger } from '@nestjs/common';
import { NotificationCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService, QUEUES } from '../queue/queue.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async getPreferences(userId: string) {
    const prefs = await this.prisma.notificationPreference.findMany({ where: { userId } });
    const all = Object.values(NotificationCategory);
    return all.map((category) => ({
      category,
      enabled: prefs.find((p) => p.category === category)?.enabled ?? true,
    }));
  }

  async setPreference(userId: string, category: NotificationCategory, enabled: boolean) {
    return this.prisma.notificationPreference.upsert({
      where: { userId_category: { userId, category } },
      create: { userId, category, enabled },
      update: { enabled },
    });
  }

  async registerPushToken(userId: string, token: string, platform?: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  async removePushToken(userId: string, token: string) {
    await this.prisma.pushToken.deleteMany({ where: { userId, token } });
    return { success: true };
  }

  /** Enqueue a notification if the user has that category enabled. */
  async notify(userId: string, category: NotificationCategory, payload: { title: string; body: string; data?: Record<string, any> }) {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId_category: { userId, category } },
    });
    if (pref && !pref.enabled) return { skipped: true, reason: 'category disabled' };
    await this.queue.addNotification(userId, { category, ...payload });
    return { queued: true };
  }

  /** Worker entry point — resolves tokens and dispatches (push provider pluggable). */
  async dispatch(userId: string, payload: { category: string; title: string; body: string; data?: Record<string, any> }) {
    const tokens = await this.prisma.pushToken.findMany({ where: { userId } });
    if (tokens.length === 0) {
      this.logger.debug(`No push tokens for user ${userId}; notification stored only`);
      return { delivered: 0 };
    }
    // A real FCM/APNs provider would be invoked here. We log to keep it provider-agnostic.
    this.logger.log(`[push:${payload.category}] -> ${tokens.length} device(s): ${payload.title}`);
    return { delivered: tokens.length };
  }
}
