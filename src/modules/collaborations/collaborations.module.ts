import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PlaylistModule } from '../playlists/playlists.module';
import { CollaborationsController } from './collaborations.controller';
import { CollaborationsService } from './collaborations.service';

@Module({
  imports: [AuthModule, UsersModule, forwardRef(() => PlaylistModule)],
  controllers: [CollaborationsController],
  providers: [CollaborationsService],
  exports: [CollaborationsService],
})
export class CollaborationsModule {}
