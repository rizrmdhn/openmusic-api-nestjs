import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { CacheService } from './cache.service';
import { CACHE_INVALIDATE_METADATA } from './cacheable.decorator';

@Injectable()
export class CacheInvalidateInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const keys = this.reflector.get<string[]>(
      CACHE_INVALIDATE_METADATA,
      context.getHandler(),
    );

    if (!keys?.length) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      tap(() => {
        for (const keyTemplate of keys) {
          const resolvedKey = keyTemplate.replace(
            /:(\w+)/g,
            (_, param: string) => String(request.params[param] ?? param),
          );

          // If the resolved key still has no wildcards and matches an exact
          // template (no param tokens left), delete by prefix so all variants
          // (e.g. albums/123, albums/123/likes) are cleared together.
          void this.cacheService.deleteByPrefix(resolvedKey);
        }
      }),
    );
  }
}
