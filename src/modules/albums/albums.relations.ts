import { relations } from 'drizzle-orm';
import { albums } from './albums.schema';
import { songs } from '../songs/songs.schema';

export const albumRelations = relations(albums, ({ many }) => ({
  songs: many(songs),
}));
