import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  varchar,
  decimal,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

// ===========================================
// Enums
// ===========================================

export const vehicleCategoryEnum = pgEnum("vehicle_category", [
  "NORMAL",
  "ESPECIAL",
  "UTILITARIO",
  "MOTO",
]);

export const usageTypeEnum = pgEnum("usage_type", ["PARTICULAR", "COMERCIAL"]);

export const quotationStatusEnum = pgEnum("quotation_status", [
  "PENDING",
  "CONTACTED",
  "ACCEPTED",
  "EXPIRED",
  "CANCELLED",
  "REJECTED",
]);

export const sellerRoleEnum = pgEnum("seller_role", ["SELLER", "ADMIN"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ===========================================
// Cotacao Veicular Tables
// ===========================================

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  cep: varchar("cep", { length: 9 }).notNull(),
  street: varchar("street", { length: 255 }).notNull(),
  number: varchar("number", { length: 20 }).notNull(),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  placa: varchar("placa", { length: 8 }).notNull(),
  marca: varchar("marca", { length: 100 }).notNull(),
  modelo: varchar("modelo", { length: 100 }).notNull(),
  ano: varchar("ano", { length: 10 }).notNull(),
  valorFipe: decimal("valor_fipe", { precision: 12, scale: 2 }).notNull(),
  codigoFipe: varchar("codigo_fipe", { length: 20 }).notNull(),
  combustivel: varchar("combustivel", { length: 50 }),
  cor: varchar("cor", { length: 50 }),
  categoria: vehicleCategoryEnum("categoria").notNull(),
  tipoUso: usageTypeEnum("tipo_uso").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sellers = pgTable("sellers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").default(true),
  role: sellerRoleEnum("role").notNull().default("SELLER"),
  lastAssignmentAt: timestamp("last_assignment_at", { withTimezone: true }),
  assignmentCount: integer("assignment_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const quotations = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  sellerId: uuid("seller_id").references(() => sellers.id),
  mensalidade: decimal("mensalidade", { precision: 10, scale: 2 }).notNull(),
  adesao: decimal("adesao", { precision: 10, scale: 2 }).notNull(),
  adesaoDesconto: decimal("adesao_desconto", { precision: 10, scale: 2 }).notNull(),
  cotaParticipacao: decimal("cota_participacao", { precision: 10, scale: 2 }),
  status: quotationStatusEnum("status").notNull().default("PENDING"),
  rejectionReason: varchar("rejection_reason", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  contactedAt: timestamp("contacted_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  notes: text("notes"),
});

export const pricingRules = pgTable("pricing_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoria: vehicleCategoryEnum("categoria").notNull(),
  faixaMin: decimal("faixa_min", { precision: 12, scale: 2 }).notNull(),
  faixaMax: decimal("faixa_max", { precision: 12, scale: 2 }).notNull(),
  mensalidade: decimal("mensalidade", { precision: 10, scale: 2 }).notNull(),
  cotaParticipacao: decimal("cota_participacao", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const blacklist = pgTable("blacklist", {
  id: uuid("id").primaryKey().defaultRandom(),
  marca: varchar("marca", { length: 100 }).notNull(),
  modelo: varchar("modelo", { length: 100 }),
  motivo: varchar("motivo", { length: 255 }).default(
    "Nao trabalhamos com este veiculo"
  ),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const roundRobinConfig = pgTable("round_robin_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  currentIndex: integer("current_index").default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ===========================================
// Dashboard Tables
// ===========================================

export const sellerGoals = pgTable("seller_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellers.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  targetAccepted: integer("target_accepted").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
