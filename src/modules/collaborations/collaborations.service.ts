import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from '../../database/drizzle.constants';
import type { DB } from '../../database/database.types';
import { and, eq } from 'drizzle-orm';
import { collaborations } from './collaborations.schema';
import { CreateCollaborationDto } from './dto/create-collaboration.dto';
import { UsersService } from '../users/users.service';
import { PlaylistsService } from '../playlists/playlists.service';

@Injectable()
export class CollaborationsService {
  constructor(
    @Inject(DRIZZLE) private db: DB,
    private readonly userService: UsersService,
    @Inject(forwardRef(() => PlaylistsService))
    private readonly playlistService: PlaylistsService,
  ) {}

  async findOne(playlistId: string, userId: string) {
    const collaboration = await this.db.query.collaborations.findFirst({
      where: and(
        eq(collaborations.playlistId, playlistId),
        eq(collaborations.userId, userId),
      ),
    });

    return collaboration;
  }

  async create(userId: string, dto: CreateCollaborationDto) {
    const user = await this.userService.findById(dto.userId);

    if (!user)
      throw new NotFoundException(`User with id ${dto.userId} not found`);

    const playlist = await this.playlistService.findById(dto.playlistId);

    if (!playlist)
      throw new NotFoundException(
        `Playlist with id ${dto.playlistId} not found`,
      );

    if (playlist.owner !== userId)
      throw new ForbiddenException(
        `Forbidden you have permission to create collaboration for playlist ${dto.playlistId} and user ${dto.userId}`,
      );

    const [collaboration] = await this.db
      .insert(collaborations)
      .values(dto)
      .returning();

    return collaboration;
  }

  async delete(userId: string, dto: CreateCollaborationDto) {
    const user = await this.userService.findById(dto.userId);

    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    const playlist = await this.playlistService.findById(dto.playlistId);

    if (!playlist)
      throw new NotFoundException(
        `Playlist with id ${dto.playlistId} not found`,
      );

    if (playlist.owner !== userId)
      throw new ForbiddenException(
        `Forbidden you have permission to delete collaboration for playlist ${dto.playlistId} and user ${dto.userId}`,
      );

    const isExist = await this.findOne(dto.playlistId, dto.userId);

    if (!isExist)
      throw new NotFoundException(
        `Collaboration for playlist ${dto.playlistId} and user ${dto.userId} not found`,
      );

    const [collaboration] = await this.db
      .delete(collaborations)
      .where(
        and(
          eq(collaborations.playlistId, dto.playlistId),
          eq(collaborations.userId, dto.userId),
        ),
      )
      .returning();

    return collaboration;
  }
}
