import { Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from './cache.service';
import { CacheInterceptor } from './cache.interceptor';
import { CacheInvalidateInterceptor } from './cache-invalidate.interceptor';

@Global()
@Module({
  providers: [CacheService, CacheInterceptor, CacheInvalidateInterceptor, Reflector],
  exports: [CacheService, CacheInterceptor, CacheInvalidateInterceptor],
})
export class CacheModule {}
