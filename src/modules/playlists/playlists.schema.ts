import { pgEnum, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema';
import { createTable, idGenerator } from '../../database/helpers';
import { songs } from '../songs/songs.schema';

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

export const playlistSongsActivitiesActionEnum = pgEnum(
  'playlist_song_activities_action_enum',
  ['add', 'delete'],
);

export const playlistSongsActivities = createTable('playlist_song_activities', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$default(() => idGenerator('playlist_song_activity')),
  playlistId: varchar('playlist_id', { length: 255 })
    .references(() => playlists.id, { onDelete: 'cascade' })
    .notNull(),
  songId: varchar('song_id', { length: 255 }).references(() => songs.id, {
    onDelete: 'cascade',
  }),
  userId: varchar('user_id', { length: 255 })
    .references(() => users.id)
    .notNull(),
  action: playlistSongsActivitiesActionEnum('action').notNull(),
  time: timestamp('time', {
    withTimezone: true,
    mode: 'string',
  })
    .defaultNow()
    .notNull(),
});
