CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"token" text NOT NULL
);
