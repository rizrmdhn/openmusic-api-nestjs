import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from '../../database/drizzle.constants';
import type { DB } from '../../database/database.types';
import { and, count, eq } from 'drizzle-orm';
import { albums, userAlbumLikes } from './albums.schema';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { processAndUploadImageIfPresent, StorageService } from '../../storage';
import {
  replaceStorageFile,
  type MulterFile,
} from '../../storage/upload.helper';

@Injectable()
export class AlbumsService {
  constructor(
    @Inject(DRIZZLE) private db: DB,
    private readonly storageService: StorageService,
  ) {}

  async findOne(id: string) {
    const album = await this.db.query.albums.findFirst({
      where: eq(albums.id, id),
      with: {
        songs: true,
      },
    });

    if (!album) throw new NotFoundException(`Album with id ${id} not found`);

    return {
      ...album,
      coverUrl: album.coverUrl
        ? this.storageService.getPublicUrl(album.coverUrl)
        : null,
    };
  }

  async getLikesCount(albumId: string) {
    const [{ count: number }] = await this.db
      .select({ count: count() })
      .from(userAlbumLikes)
      .where(eq(userAlbumLikes.albumId, albumId));

    return number;
  }

  async create(dto: CreateAlbumDto) {
    const [todo] = await this.db.insert(albums).values(dto).returning();

    return todo;
  }

  async findLike(userId: string, albumId: string) {
    const like = await this.db.query.userAlbumLikes.findFirst({
      where: and(
        eq(userAlbumLikes.userId, userId),
        eq(userAlbumLikes.albumId, albumId),
      ),
    });

    return like;
  }

  async like(userId: string, albumId: string) {
    await this.findOne(albumId);

    const alreadyLiked = await this.findLike(userId, albumId);

    if (alreadyLiked)
      throw new BadRequestException('Album already liked by this user');

    const [like] = await this.db
      .insert(userAlbumLikes)
      .values({ userId, albumId })
      .returning();

    return like;
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

  async uploadCover(albumId: string, file: MulterFile) {
    const album = await this.findOne(albumId);

    const coverUrl = await processAndUploadImageIfPresent(
      file,
      this.storageService,
      { folder: 'albums/covers' },
    );

    const [updatedAlbum] = await this.db
      .update(albums)
      .set({ coverUrl })
      .where(eq(albums.id, albumId))
      .returning();

    await replaceStorageFile(coverUrl, album.coverUrl, this.storageService);

    return updatedAlbum;
  }

  async delete(id: string) {
    await this.findOne(id);

    const [album] = await this.db
      .delete(albums)
      .where(eq(albums.id, id))
      .returning();

    return album;
  }

  async deleteLike(userId: string, albumId: string) {
    await this.findOne(albumId);

    const like = await this.findLike(userId, albumId);

    if (!like)
      throw new NotFoundException(
        'Like not found for this user and album combination',
      );

    const [deletedLike] = await this.db
      .delete(userAlbumLikes)
      .where(eq(userAlbumLikes.id, like.id))
      .returning();

    return deletedLike;
  }
}
