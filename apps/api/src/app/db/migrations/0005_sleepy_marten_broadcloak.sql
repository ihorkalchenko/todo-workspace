CREATE TYPE "public"."priority" AS ENUM('Lowest', 'Low', 'Medium', 'High', 'Highest');--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" "priority" DEFAULT 'Medium' NOT NULL;