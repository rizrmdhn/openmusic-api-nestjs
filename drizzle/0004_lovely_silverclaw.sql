CREATE TABLE "playlists" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;