import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { DB } from '../../database/database.types';
import { DRIZZLE } from '../../database/drizzle.constants';
import { songs } from './songs.schema';
import { and, eq, ilike } from 'drizzle-orm';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';

@Injectable()
export class SongsService {
  constructor(@Inject(DRIZZLE) private db: DB) {}

  async findAll(title?: string, performer?: string) {
    const songsList = await this.db.query.songs.findMany({
      columns: {
        id: true,
        title: true,
        performer: true,
      },
      where: and(
        title ? ilike(songs.title, `%${title}%`) : undefined,
        performer ? ilike(songs.performer, `%${performer}%`) : undefined,
      ),
    });

    return songsList;
  }

  async findOne(id: string) {
    const song = await this.db.query.songs.findFirst({
      where: eq(songs.id, id),
    });

    if (!song) throw new NotFoundException(`Song with id ${id} not found`);

    return song;
  }

  async create(dto: CreateSongDto) {
    const [song] = await this.db.insert(songs).values(dto).returning();

    return song;
  }

  async update(id: string, dto: UpdateSongDto) {
    await this.findOne(id);

    const [song] = await this.db
      .update(songs)
      .set(dto)
      .where(eq(songs.id, id))
      .returning();

    return song;
  }

  async delete(id: string) {
    await this.findOne(id);

    const [song] = await this.db
      .delete(songs)
      .where(eq(songs.id, id))
      .returning();

    return song;
  }
}
