import { UseGuards } from '@nestjs/common';
import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../auth/auth.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AddSongToPlaylistDto } from './dto/add-song-to-playlist.dto';

@Controller('playlists')
@UseGuards(JwtGuard)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  async findAll(@CurrentUser() user: AccessTokenPayload) {
    const playlists = await this.playlistsService.findAll(user.userId);
    return {
      data: {
        playlists,
      },
    };
  }

  @Post()
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreatePlaylistDto,
  ) {
    const playlist = await this.playlistsService.create(user.userId, dto);
    return {
      data: {
        playlistId: playlist.id,
        ...playlist,
      },
    };
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    const deletedPlaylist = await this.playlistsService.delete(id, user.userId);
    return {
      data: {
        playlistId: deletedPlaylist.id,
        ...deletedPlaylist,
      },
    };
  }

  @Post(':id/songs')
  async addSong(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: AddSongToPlaylistDto,
  ) {
    const addedSong = await this.playlistsService.addSong(id, dto, user.userId);
    return {
      data: addedSong,
    };
  }

  @Get(':id/songs')
  async getSongs(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    const playlist = await this.playlistsService.getSongs(id, user.userId);

    return {
      data: {
        playlist,
      },
    };
  }

  @Delete(':id/songs')
  async removeSong(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: AddSongToPlaylistDto,
  ) {
    const deletedSong = await this.playlistsService.deleteSong(
      id,
      dto.songId,
      user.userId,
    );
    return {
      data: deletedSong,
    };
  }

  @Get(':id/activities')
  async getActivities(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    const activities = await this.playlistsService.getPlaylistActivities(
      id,
      user.userId,
    );
    return {
      data: activities,
    };
  }
}
