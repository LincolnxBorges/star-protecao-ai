CREATE TYPE "public"."activity_type" AS ENUM('CREATION', 'STATUS_CHANGE', 'WHATSAPP_SENT', 'NOTE', 'CALL', 'EMAIL', 'ASSIGNMENT');--> statement-breakpoint
CREATE TABLE "quotation_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"type" "activity_type" NOT NULL,
	"description" text NOT NULL,
	"author_id" text,
	"author_name" varchar(255),
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "quotation_activities" ADD CONSTRAINT "quotation_activities_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_activities" ADD CONSTRAINT "quotation_activities_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;