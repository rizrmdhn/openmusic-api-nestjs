import { relations } from 'drizzle-orm';
import { users } from '../users/users.schema';
import {
  playlists,
  playlistSongs,
  playlistSongsActivities,
} from './playlists.schema';
import { songs } from '../songs/songs.schema';

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  owner: one(users, {
    fields: [playlists.owner],
    references: [users.id],
  }),
  songs: many(playlistSongs),
  activities: many(playlistSongsActivities),
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

export const playlistSongsActivitiesRelations = relations(
  playlistSongsActivities,
  ({ one }) => ({
    playlist: one(playlists, {
      fields: [playlistSongsActivities.playlistId],
      references: [playlists.id],
    }),
    song: one(songs, {
      fields: [playlistSongsActivities.songId],
      references: [songs.id],
    }),
    user: one(users, {
      fields: [playlistSongsActivities.userId],
      references: [users.id],
    }),
  }),
);
