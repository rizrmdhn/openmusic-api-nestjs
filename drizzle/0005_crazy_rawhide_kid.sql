CREATE TABLE "playlist_songs" (
	"playlist_id" varchar(255) NOT NULL,
	"song_id" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "playlist_songs" ADD CONSTRAINT "playlist_songs_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE no action ON UPDATE no action;