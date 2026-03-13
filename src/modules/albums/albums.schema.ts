import { integer, varchar } from 'drizzle-orm/pg-core';
import {
  createFileUrlColumn,
  createTable,
  idGenerator,
} from '../../database/helpers';

export const albums = createTable('albums', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$default(() => idGenerator('album')),
  name: varchar('name', { length: 255 }).notNull(),
  year: integer('year').notNull(),
  ...createFileUrlColumn('cover'),
});

export const userAlbumLikes = createTable('user_album_likes', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$default(() => idGenerator('like')),
  userId: varchar('user_id', { length: 255 }).notNull(),
  albumId: varchar('album_id', { length: 255 }).notNull(),
});
