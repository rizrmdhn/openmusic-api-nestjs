import { Module } from '@nestjs/common';
import { AlbumsController } from './album.controller';
import { AlbumsService } from './albums.service';
import { StorageService } from '../../storage';

@Module({
  controllers: [AlbumsController],
  providers: [AlbumsService, StorageService],
  exports: [AlbumsService],
})
export class AlbumsModule {}
