import { relations } from 'drizzle-orm';
import { songs } from './songs.schema';
import { albums } from '../albums/albums.schema';

export const songRelations = relations(songs, ({ one }) => ({
  album: one(albums, {
    fields: [songs.albumId],
    references: [albums.id],
  }),
}));
