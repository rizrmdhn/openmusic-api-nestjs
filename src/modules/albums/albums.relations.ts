import { relations } from 'drizzle-orm';
import { albums, userAlbumLikes } from './albums.schema';
import { songs } from '../songs/songs.schema';
import { users } from '../users/users.schema';

export const albumRelations = relations(albums, ({ many }) => ({
  songs: many(songs),
}));

export const userAlbumLikeRelations = relations(userAlbumLikes, ({ one }) => ({
  album: one(albums, {
    fields: [userAlbumLikes.albumId],
    references: [albums.id],
  }),
  user: one(users, {
    fields: [userAlbumLikes.userId],
    references: [users.id],
  }),
}));
