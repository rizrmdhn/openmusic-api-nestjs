import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { playlists, playlistSongs } from './playlists.schema';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import type { DB } from '../../database/database.types';
import { DRIZZLE } from '../../database/drizzle.constants';
import { AddSongToPlaylistDto } from './dto/add-song-to-playlist.dto';
import { SongsService } from '../songs/songs.service';

@Injectable()
export class PlaylistsService {
  constructor(
    @Inject(DRIZZLE) private db: DB,
    private readonly songsService: SongsService,
  ) {}

  async findAll(userId: string) {
    const playlistLists = await this.db.query.playlists.findMany({
      where: eq(playlists.owner, userId),
      with: {
        owner: true,
      },
    });

    return playlistLists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      username: playlist.owner.username,
    }));
  }

  async findOne(id: string, userId: string) {
    const playlist = await this.db.query.playlists.findFirst({
      where: and(eq(playlists.id, id), eq(playlists.owner, userId)),
      with: {
        owner: true,
        songs: {
          with: {
            song: {
              columns: {
                id: true,
                title: true,
                performer: true,
              },
            },
          },
        },
      },
    });

    return playlist
      ? {
          id: playlist?.id,
          name: playlist?.name,
          username: playlist?.owner.username,
          songs: playlist?.songs.map((ps) => ({
            id: ps.song.id,
            title: ps.song.title,
            performer: ps.song.performer,
          })),
        }
      : null;
  }

  async findById(id: string) {
    const playlist = await this.db.query.playlists.findFirst({
      where: eq(playlists.id, id),
      with: {
        owner: true,
        songs: {
          with: {
            song: {
              columns: {
                id: true,
                title: true,
                performer: true,
              },
            },
          },
        },
      },
    });

    return playlist
      ? {
          id: playlist?.id,
          name: playlist?.name,
          username: playlist?.owner.username,
          owner: playlist?.owner.id,
          songs: playlist?.songs.map((ps) => ({
            id: ps.song.id,
            title: ps.song.title,
            performer: ps.song.performer,
          })),
        }
      : null;
  }

  async create(userId: string, dto: CreatePlaylistDto) {
    const [playlist] = await this.db
      .insert(playlists)
      .values({
        ...dto,
        owner: userId,
      })
      .returning();

    return playlist;
  }

  async addSong(playlistId: string, dto: AddSongToPlaylistDto, userId: string) {
    const song = await this.songsService.findOne(dto.songId);

    if (!song)
      throw new NotFoundException(`Song with id ${dto.songId} not found`);

    const playlist = await this.findById(playlistId);

    if (!playlist)
      throw new NotFoundException(`Playlist with id ${playlistId} not found`);

    if (playlist.owner !== userId)
      throw new ForbiddenException(`You are not the owner of this playlist`);

    const [addedSong] = await this.db
      .insert(playlistSongs)
      .values({
        playlistId,
        songId: dto.songId,
      })
      .returning();

    return addedSong;
  }

  async delete(id: string, userId: string) {
    const playlist = await this.findById(id);

    if (!playlist)
      throw new NotFoundException(`Playlist with id ${id} not found`);

    if (playlist.owner !== userId)
      throw new ForbiddenException(`You are not the owner of this playlist`);

    const [deletedPlaylist] = await this.db
      .delete(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.owner, userId)))
      .returning();

    return deletedPlaylist;
  }

  async deleteSong(playlistId: string, songId: string, userId: string) {
    const song = await this.songsService.findOne(songId);

    if (!song) throw new NotFoundException(`Song with id ${songId} not found`);

    const playlist = await this.findById(playlistId);

    if (!playlist)
      throw new NotFoundException(`Playlist with id ${playlistId} not found`);

    if (playlist.owner !== userId)
      throw new ForbiddenException(`You are not the owner of this playlist`);

    const [deletedSong] = await this.db
      .delete(playlistSongs)
      .where(
        and(
          eq(playlistSongs.playlistId, playlistId),
          eq(playlistSongs.songId, songId),
        ),
      )
      .returning();

    return deletedSong;
  }
}
