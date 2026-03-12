import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { SongsModule } from '../songs/songs.module';
import { CollaborationsModule } from '../collaborations/collaborations.module';

@Module({
  imports: [AuthModule, SongsModule, forwardRef(() => CollaborationsModule)],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistModule {}
