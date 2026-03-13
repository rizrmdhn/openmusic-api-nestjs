import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_INVALIDATE_METADATA = 'cache:invalidate';

/**
 * Marks a route handler as cacheable.
 *
 * Use `:param` tokens to interpolate route params into the cache key.
 *
 * @example
 * @Cacheable('albums/:id', 300)
 * @Get(':id')
 * findOne(@Param('id') id: string) { ... }
 */
/**
 * Invalidates one or more cache keys after a mutation handler completes.
 *
 * Supports `:param` tokens and prefix wildcards (e.g. `'albums/:id'` or `'albums'`).
 * Prefix keys (no `:param`) use deleteByPrefix so all sub-keys are cleared.
 *
 * @example
 * @CacheInvalidate('albums/:id', 'albums')
 * @Post(':id/covers')
 * uploadCover(...) { ... }
 */
export const CacheInvalidate = (...keys: string[]) =>
  SetMetadata(CACHE_INVALIDATE_METADATA, keys);

export const Cacheable =
  (key: string, ttlSeconds: number = 300) =>
  (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL_METADATA, ttlSeconds)(
      target,
      propertyKey,
      descriptor,
    );
  };
