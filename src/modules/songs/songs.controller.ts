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
  Query,
} from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';

@Controller('songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get()
  async findAll(
    @Query('title') title?: string,
    @Query('performer') performer?: string,
  ) {
    const songs = await this.songsService.findAll(title, performer);
    return {
      data: {
        songs,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const song = await this.songsService.findOne(id);
    return {
      data: {
        songId: song?.id,
        song,
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSongDto) {
    const song = await this.songsService.create(dto);
    return {
      data: {
        songId: song.id,
        song,
      },
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSongDto) {
    const song = await this.songsService.update(id, dto);
    return {
      data: {
        songId: song.id,
        song,
      },
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const song = await this.songsService.delete(id);
    return {
      data: {
        songId: song.id,
        song,
      },
    };
  }
}
