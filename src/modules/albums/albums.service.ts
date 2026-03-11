import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../../database/drizzle.constants';
import type { DB } from '../../database/database.types';
import { eq } from 'drizzle-orm';
import { albums } from './albums.schema';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@Injectable()
export class AlbumsService {
  constructor(@Inject(DRIZZLE) private db: DB) {}

  async findOne(id: string) {
    const album = await this.db.query.albums.findFirst({
      where: eq(albums.id, id),
      with: {
        songs: true,
      },
    });

    if (!album) throw new NotFoundException(`Album with id ${id} not found`);

    return album;
  }

  async create(dto: CreateAlbumDto) {
    const [todo] = await this.db.insert(albums).values(dto).returning();

    return todo;
  }

  async update(id: string, dto: UpdateAlbumDto) {
    await this.findOne(id);

    const [album] = await this.db
      .update(albums)
      .set(dto)
      .where(eq(albums.id, id))
      .returning();

    return album;
  }

  async delete(id: string) {
    await this.findOne(id);

    const [album] = await this.db
      .delete(albums)
      .where(eq(albums.id, id))
      .returning();

    return album;
  }
}
