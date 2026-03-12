import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from '../config/env';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private memoryStore: Map<string, CacheEntry<unknown>> = new Map();

  constructor() {
    try {
      this.redis = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        db: 1,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.warn('Exceeded maximum Redis reconnection attempts');
            return null;
          }
          return Math.min(times * 50, 2000);
        },
        lazyConnect: true,
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}`);
      });

      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis server');
      });

      this.redis.connect().catch((err: Error) => {
        this.logger.warn(`Failed to connect to Redis: ${err.message}`);
      });
    } catch (error) {
      this.logger.warn(
        `Failed to initialize Redis: ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data) return JSON.parse(data) as T;
        return null;
      } catch {
        // fallback to memory
      }
    }

    const entry = this.memoryStore.get(key) as CacheEntry<T> | undefined;
    if (entry && entry.expiresAt > Date.now()) return entry.value;
    if (entry) this.memoryStore.delete(key);
    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch {
        // fallback to memory
      }
    }

    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch {
        // fallback to memory
      }
    }

    this.memoryStore.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`${prefix}*`);
        if (keys.length > 0) await this.redis.del(...keys);
        return;
      } catch {
        // fallback to memory
      }
    }

    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) this.memoryStore.delete(key);
    }
  }
}
