import { varchar } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema';
import { createTable, idGenerator } from '../../database/helpers';

export const playlists = createTable('playlists', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$default(() => idGenerator('playlist')),
  name: varchar('name', { length: 255 }).notNull(),
  owner: varchar('owner', { length: 255 })
    .references(() => users.id)
    .notNull(),
});

export const playlistSongs = createTable('playlist_songs', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$default(() => idGenerator('playlist_song')),
  playlistId: varchar('playlist_id', { length: 255 })
    .references(() => playlists.id, { onDelete: 'cascade' })
    .notNull(),
  songId: varchar('song_id', { length: 255 }).notNull(),
});
