import { integer, varchar } from 'drizzle-orm/pg-core';
import { createTable, idGenerator } from '../../database/helpers';
import { albums } from '../albums/albums.schema';

export const songs = createTable('songs', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$default(() => idGenerator('song')),
  title: varchar('title', { length: 255 }).notNull(),
  year: integer('year').notNull(),
  genre: varchar('genre', { length: 100 }).notNull(),
  performer: varchar('performer', { length: 255 }).notNull(),
  duration: integer('duration'),
  albumId: varchar('album_id', { length: 255 }).references(() => albums.id),
});
