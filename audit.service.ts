import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string | null;
    action: string;
    entity?: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ip?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId ?? null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          metadata: params.metadata as any,
          ip: params.ip,
        },
      });
    } catch (err) {
      // Auditing must never break the primary flow.
      this.logger.warn(`Audit log failed: ${(err as Error).message}`);
    }
  }
}
