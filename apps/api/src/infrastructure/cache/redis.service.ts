import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createChildLogger } from '../logging/logger';
import type { EnvConfig } from '../../config/env.validation';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly log = createChildLogger('RedisService');
  private client: Redis;

  constructor(private config: ConfigService<EnvConfig>) {
    const url = this.config.get('REDIS_URL', { infer: true })!;
    this.client = new Redis(url, { maxRetriesPerRequest: null });
    this.client.on('connect', () => this.log.info('Redis connected'));
    this.client.on('error', (err) => this.log.error({ err }, 'Redis error'));
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
