ALTER TABLE "task_tags" DROP CONSTRAINT "task_tags_tag_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;