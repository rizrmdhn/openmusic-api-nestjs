import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { SongsModule } from '../songs/songs.module';

@Module({
  imports: [AuthModule, SongsModule],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistModule {}
