CREATE TABLE "songs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"genre" varchar(100) NOT NULL,
	"performer" varchar(255) NOT NULL,
	"duration" integer,
	"album_id" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;