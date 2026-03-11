import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AlbumsModule } from './modules/albums/albums.module';
import { DatabaseModule } from './database/database.module';
import { SongsModule } from './modules/songs/songs.module';

@Module({
  imports: [DatabaseModule, AlbumsModule, SongsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
