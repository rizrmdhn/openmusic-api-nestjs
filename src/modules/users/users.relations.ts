import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { playlists } from '../playlists/playlists.schema';

export const usersRelations = relations(users, ({ many }) => ({
  playlists: many(playlists),
}));
