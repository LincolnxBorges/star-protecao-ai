CREATE TYPE "public"."quotation_status" AS ENUM('PENDING', 'CONTACTED', 'ACCEPTED', 'EXPIRED', 'CANCELLED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."seller_role" AS ENUM('SELLER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."usage_type" AS ENUM('PARTICULAR', 'COMERCIAL');--> statement-breakpoint
CREATE TYPE "public"."vehicle_category" AS ENUM('NORMAL', 'ESPECIAL', 'UTILITARIO', 'MOTO');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blacklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"marca" varchar(100) NOT NULL,
	"modelo" varchar(100),
	"motivo" varchar(255) DEFAULT 'Nao trabalhamos com este veiculo',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"cpf" varchar(14) NOT NULL,
	"cep" varchar(9) NOT NULL,
	"street" varchar(255) NOT NULL,
	"number" varchar(20) NOT NULL,
	"complement" varchar(100),
	"neighborhood" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "customers_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoria" "vehicle_category" NOT NULL,
	"faixa_min" numeric(12, 2) NOT NULL,
	"faixa_max" numeric(12, 2) NOT NULL,
	"mensalidade" numeric(10, 2) NOT NULL,
	"cota_participacao" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"seller_id" uuid,
	"mensalidade" numeric(10, 2) NOT NULL,
	"adesao" numeric(10, 2) NOT NULL,
	"adesao_desconto" numeric(10, 2) NOT NULL,
	"cota_participacao" numeric(10, 2),
	"status" "quotation_status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"contacted_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "round_robin_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"current_index" integer DEFAULT 0,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true,
	"role" "seller_role" DEFAULT 'SELLER' NOT NULL,
	"last_assignment_at" timestamp with time zone,
	"assignment_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placa" varchar(8) NOT NULL,
	"marca" varchar(100) NOT NULL,
	"modelo" varchar(100) NOT NULL,
	"ano" varchar(10) NOT NULL,
	"valor_fipe" numeric(12, 2) NOT NULL,
	"codigo_fipe" varchar(20) NOT NULL,
	"combustivel" varchar(50),
	"cor" varchar(50),
	"categoria" "vehicle_category" NOT NULL,
	"tipo_uso" "usage_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;