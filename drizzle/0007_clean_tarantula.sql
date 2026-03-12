ALTER TABLE "playlist_songs" DROP CONSTRAINT "playlist_songs_playlist_id_playlists_id_fk";
--> statement-breakpoint
ALTER TABLE "playlist_songs" ADD CONSTRAINT "playlist_songs_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;