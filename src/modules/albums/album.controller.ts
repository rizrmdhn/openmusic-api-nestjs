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

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get(':id')
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
  @UseInterceptors(FileInterceptor('cover'))
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
  async delete(@Param('id') id: string) {
    const album = await this.albumsService.delete(id);
    return {
      data: {
        albumId: album.id,
        album,
      },
    };
  }
}
