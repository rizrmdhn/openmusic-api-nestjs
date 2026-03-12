# Cache, RabbitMQ & Email Usage Guide

All services are registered as `@Global()` modules. Inject them directly into any service — no need to import their modules in the consuming module.

---

## CacheService

**Location:** `src/cache/cache.service.ts`

### Env vars

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=        # optional
```

> If Redis is unavailable, it automatically falls back to an in-memory store.

### API

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `get<T>(key: string): Promise<T \| null>` | Returns cached value or `null` |
| `set` | `set<T>(key: string, value: T, ttlSeconds: number): Promise<void>` | Store a value with TTL |
| `delete` | `delete(key: string): Promise<void>` | Remove a single key |
| `deleteByPrefix` | `deleteByPrefix(prefix: string): Promise<void>` | Remove all keys matching a prefix |

### Usage

**1. Inject the service**

```ts
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class PlaylistsService {
  constructor(
    private readonly cacheService: CacheService,
    // ...other deps
  ) {}
}
```

**2. Cache a database query**

```ts
async getSongs(playlistId: string, userId: string) {
  const cacheKey = `playlist:${playlistId}:songs`;

  const cached = await this.cacheService.get(cacheKey);
  if (cached) return cached;

  const result = await this.db.query.playlists.findFirst(/* ... */);

  await this.cacheService.set(cacheKey, result, 1800); // 30 min TTL
  return result;
}
```

**3. Invalidate on mutation**

```ts
async addSong(playlistId: string, dto: AddSongToPlaylistDto) {
  // ...insert logic...
  await this.cacheService.delete(`playlist:${playlistId}:songs`);
}

// Or remove all keys for a resource
async deletePlaylist(playlistId: string) {
  // ...delete logic...
  await this.cacheService.deleteByPrefix(`playlist:${playlistId}:`);
}
```

### Key naming conventions

```
playlist:{id}:songs       → songs list for a playlist
album:{id}                → single album
user:{id}:playlists       → all playlists for a user
```

---

## RabbitMQService

**Location:** `src/rabbitmq/rabbitmq.service.ts`

### Env vars

```env
RABBITMQ_URL=amqp://localhost
# With credentials: amqp://user:password@localhost:5672
```

### Queue & type definitions

Add new queues and their payload shapes in `src/rabbitmq/rabbitmq.types.ts`:

```ts
export const QueueName = {
  EXPORT_PLAYLIST: 'export:playlist',
  // ADD_NEW_QUEUE: 'queue:name',
} as const;

export interface QueueJobDataMap {
  [QueueName.EXPORT_PLAYLIST]: {
    targetEmail: string;
    playlist: {
      id: string;
      name: string;
      songs: { id: string; title: string; performer: string }[];
    };
  };
  // [QueueName.ADD_NEW_QUEUE]: { ... };
}
```

### API

| Method | Signature | Description |
|--------|-----------|-------------|
| `publish` | `publish<Q>(queue: Q, data: QueueJobData<Q>): boolean` | Send a message to a queue |
| `consume` | `consume<Q>(queue: Q, handler: (data) => Promise<void>): void` | Register a consumer |

Both methods are fully type-safe — `data` is inferred from `QueueJobDataMap` based on the queue name.

### Publishing a message

```ts
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { QueueName } from '../../rabbitmq/rabbitmq.types';

@Injectable()
export class PlaylistsService {
  constructor(private readonly rabbitmq: RabbitMQService) {}

  async exportSongs(playlist: Playlist, targetEmail: string) {
    this.rabbitmq.publish(QueueName.EXPORT_PLAYLIST, {
      targetEmail,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        songs: playlist.songs,
      },
    });
  }
}
```

### Consuming messages

Register consumers in `OnModuleInit` of the service that handles the job:

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { QueueName } from '../../rabbitmq/rabbitmq.types';

@Injectable()
export class ExportService implements OnModuleInit {
  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    this.rabbitmq.consume(QueueName.EXPORT_PLAYLIST, async (data) => {
      // data is fully typed: { targetEmail, playlist: { id, name, songs } }
      await this.emailService.sendPlaylistExport({
        to: data.targetEmail,
        playlist: data.playlist,
      });
    });
  }
}
```

### Adding a new queue

1. Add the name to `QueueName` in `rabbitmq.types.ts`
2. Add the payload type to `QueueJobDataMap`
3. Call `publish()` from the producer
4. Call `consume()` from the consumer's `OnModuleInit`

The exchange binding is set up automatically on startup — no manual RabbitMQ configuration needed.

---

## EmailService

**Location:** `src/email/email.service.ts`

### Env vars

```env
EMAIL_DRIVER=nodemailer        # "nodemailer" | "resend"
EMAIL_FROM=noreply@openmusic.app

# If EMAIL_DRIVER=nodemailer
EMAIL_PROVIDER=gmail           # "gmail" | "smtp"
EMAIL_USER=you@gmail.com
EMAIL_PASSWORD=your-app-password

# If EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASSWORD=password

# If EMAIL_DRIVER=resend
RESEND_API_KEY=re_xxxx
```

### API

| Method | Signature | Description |
|--------|-----------|-------------|
| `send` | `send(options: SendEmailOptions): Promise<unknown>` | Send a raw email |
| `sendPlaylistExport` | `sendPlaylistExport(data): Promise<unknown>` | Send formatted playlist export email |

```ts
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;   // plain-text fallback
  from?: string;   // overrides EMAIL_FROM
}
```

### Sending a playlist export

This is the primary use case — called by the RabbitMQ consumer after receiving an `EXPORT_PLAYLIST` job:

```ts
await this.emailService.sendPlaylistExport({
  to: 'user@example.com',
  playlist: {
    id: 'playlist-Mk8AnmCp210PwT6B',
    name: 'My Favorite Coldplay Song',
    songs: [
      { id: 'song-1', title: 'Life in Technicolor', performer: 'Coldplay' },
      { id: 'song-2', title: 'Cemeteries of London', performer: 'Coldplay' },
    ],
  },
});
```

The email subject will be: `[OpenMusic] Export Playlist: My Favorite Coldplay Song`

### Sending a custom email

```ts
await this.emailService.send({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Hello world</p>',
  text: 'Hello world',
});
```

### Switching providers

Change `EMAIL_DRIVER` in `.env` — no code changes needed:

```env
EMAIL_DRIVER=resend    # switch to Resend
```

---

## Full export flow

```
POST /playlists/:id/export
  → PlaylistsService.exportSongs()
    → RabbitMQService.publish(EXPORT_PLAYLIST, { targetEmail, playlist })
      → RabbitMQ queue
        → ExportService consumer (OnModuleInit)
          → EmailService.sendPlaylistExport()
            → nodemailer / resend → user inbox
```
