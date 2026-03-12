CREATE TYPE "public"."playlist_song_activities_action_enum" AS ENUM('add', 'delete');--> statement-breakpoint
CREATE TABLE "playlist_song_activities" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"playlist_id" varchar(255) NOT NULL,
	"song_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"action" "playlist_song_activities_action_enum" NOT NULL,
	"time" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "playlist_song_activities" ADD CONSTRAINT "playlist_song_activities_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_song_activities" ADD CONSTRAINT "playlist_song_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;