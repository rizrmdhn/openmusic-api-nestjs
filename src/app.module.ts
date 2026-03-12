import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlbumsModule } from './modules/albums/albums.module';
import { DatabaseModule } from './database/database.module';
import { SongsModule } from './modules/songs/songs.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [DatabaseModule, AlbumsModule, SongsModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
