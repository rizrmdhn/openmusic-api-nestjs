import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

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
