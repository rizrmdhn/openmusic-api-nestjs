import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlbumsModule } from './modules/albums/albums.module';
import { DatabaseModule } from './database/database.module';
import { SongsModule } from './modules/songs/songs.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlaylistModule } from './modules/playlists/playlists.module';
import { CollaborationsModule } from './modules/collaborations/collaborations.module';
import { CacheModule } from './cache/cache.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { EmailModule } from './email/email.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    RabbitMQModule,
    EmailModule,
    AlbumsModule,
    SongsModule,
    UsersModule,
    AuthModule,
    PlaylistModule,
    CollaborationsModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
