import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, of, tap } from 'rxjs';
import { CacheService } from './cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from './cacheable.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const cacheKeyTemplate = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKeyTemplate) return next.handle();

    const ttl =
      this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler()) ??
      300;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Build cache key: replace :param tokens with actual route params
    const cacheKey = cacheKeyTemplate.replace(/:(\w+)/g, (_, param: string) =>
      String(request.params[param] ?? param),
    );

    const cached = await this.cacheService.get(cacheKey);
    if (cached !== null) {
      response.setHeader('X-Data-Source', 'cache');
      return of(cached);
    }

    return next.handle().pipe(
      tap((data) => {
        response.setHeader('X-Data-Source', 'database');
        void this.cacheService.set(cacheKey, data, ttl);
      }),
    );
  }
}
