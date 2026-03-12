CREATE TABLE "collaborations" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"playlist_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;