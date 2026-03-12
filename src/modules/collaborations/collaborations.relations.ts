import { relations } from 'drizzle-orm';
import { collaborations } from './collaborations.schema';
import { playlists } from '../playlists/playlists.schema';
import { users } from '../users/users.schema';

export const collaborationsRelations = relations(collaborations, ({ one }) => ({
  playlist: one(playlists, {
    fields: [collaborations.playlistId],
    references: [playlists.id],
  }),
  user: one(users, {
    fields: [collaborations.userId],
    references: [users.id],
  }),
}));
