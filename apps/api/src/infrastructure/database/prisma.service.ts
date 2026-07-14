import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createChildLogger } from '../logging/logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly log = createChildLogger('PrismaService');

  async onModuleInit() {
    await this.$connect();
    this.log.info('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.log.info('Database disconnected');
  }
}
