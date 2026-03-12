import { varchar } from 'drizzle-orm/pg-core';
import { createTable, idGenerator } from '../../database/helpers';
import { playlists } from '../playlists/playlists.schema';
import { users } from '../users/users.schema';

export const collaborations = createTable('collaborations', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$default(() => idGenerator('song')),
  playlistId: varchar('playlist_id', { length: 255 })
    .notNull()
    .references(() => playlists.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});
