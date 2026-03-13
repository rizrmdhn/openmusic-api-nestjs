import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import {
  ImageSizeValidator,
  ImageTypeValidator,
} from '../../storage/file.validators';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../auth/auth.service';
import { CacheInterceptor } from '../../cache/cache.interceptor';
import { CacheInvalidateInterceptor } from '../../cache/cache-invalidate.interceptor';
import { Cacheable, CacheInvalidate } from '../../cache/cacheable.decorator';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @Cacheable('albums/:id', 300)
  async findOne(@Param('id') id: string) {
    const album = await this.albumsService.findOne(id);
    return {
      data: {
        albumId: album?.id,
        album,
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAlbumDto) {
    const album = await this.albumsService.create(dto);
    return {
      data: {
        albumId: album.id,
        album,
      },
    };
  }

  @Post(':id/covers')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('cover'), CacheInvalidateInterceptor)
  @CacheInvalidate('albums/:id')
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new ImageSizeValidator(5 * 1024 * 1024),
          new ImageTypeValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    await this.albumsService.uploadCover(id, file);
    return {
      message: 'Cover uploaded successfully',
    };
  }

  @Put(':id')
  @UseInterceptors(CacheInvalidateInterceptor)
  @CacheInvalidate('albums/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateAlbumDto) {
    const album = await this.albumsService.update(id, dto);
    return {
      data: {
        albumId: album.id,
        album,
      },
    };
  }

  @Delete(':id')
  @UseInterceptors(CacheInvalidateInterceptor)
  @CacheInvalidate('albums/:id')
  async delete(@Param('id') id: string) {
    const album = await this.albumsService.delete(id);
    return {
      data: {
        albumId: album.id,
        album,
      },
    };
  }

  @Get(':id/likes')
  @UseInterceptors(CacheInterceptor)
  @Cacheable('albums/:id/likes', 1800)
  async getLikes(@Param('id') albumId: string) {
    const number = await this.albumsService.getLikesCount(albumId);
    return { data: { likes: number } };
  }

  @Post(':id/likes')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtGuard)
  @UseInterceptors(CacheInvalidateInterceptor)
  @CacheInvalidate('albums/:id/likes')
  async like(
    @Param('id') albumId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    await this.albumsService.like(user.userId, albumId);
    return { message: 'Album liked successfully' };
  }

  @Delete(':id/likes')
  @UseGuards(JwtGuard)
  @UseInterceptors(CacheInvalidateInterceptor)
  @CacheInvalidate('albums/:id/likes')
  async deleteLike(
    @Param('id') albumId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    await this.albumsService.deleteLike(user.userId, albumId);
    return { message: 'Album unliked successfully' };
  }
}
