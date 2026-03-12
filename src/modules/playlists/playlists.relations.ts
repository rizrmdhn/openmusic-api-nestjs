import { relations } from 'drizzle-orm';
import { users } from '../users/users.schema';
import { playlists, playlistSongs } from './playlists.schema';
import { songs } from '../songs/songs.schema';

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  owner: one(users, {
    fields: [playlists.owner],
    references: [users.id],
  }),
  songs: many(playlistSongs),
}));

export const playlistSongsRelations = relations(playlistSongs, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistSongs.playlistId],
    references: [playlists.id],
  }),
  song: one(songs, {
    fields: [playlistSongs.songId],
    references: [songs.id],
  }),
}));
