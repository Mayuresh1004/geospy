// src/lib/supabase/schema.ts

import { 
  pgTable, 
  pgSchema, 
  uuid, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  numeric, 
  jsonb, 
  date, 
  primaryKey,
  pgEnum 
} from "drizzle-orm/pg-core";

// 1. Reference the Supabase Auth Schema
export const authSchema = pgSchema("auth");

export const users = authSchema.table("users", {
  id: uuid("id").primaryKey().notNull(),
});

// 2. Define Enums
export const subscriptionStatusEnum = pgEnum("status", ["active", "canceled", "past_due", "trialing"]);
export const billingPeriodEnum = pgEnum("billing_period", ["month", "year"]);
export const paymentStatusEnum = pgEnum("status", ["succeeded", "failed", "pending"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["stripe", "razorpay"]);

// 3. Tables

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  username: text("username").unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price").notNull(),
  currency: text("currency").default("usd").notNull(),
  billingPeriod: text("billing_period").$type<"month" | "year">().notNull(),
  features: jsonb("features").default([]),
  isPopular: boolean("is_popular").default(false),
  stripePriceId: text("stripe_price_id"),
  razorpayPlanId: text("razorpay_plan_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  status: text("status").$type<"active" | "canceled" | "past_due" | "trialing">().notNull(),
  planId: text("plan_id").references(() => subscriptionPlans.id).notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  razorpaySubscriptionId: text("razorpay_subscription_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  amount: numeric("amount").notNull(),
  currency: text("currency").default("usd").notNull(),
  status: text("status").$type<"succeeded" | "failed" | "pending">().notNull(),
  paymentProvider: text("payment_provider").$type<"stripe" | "razorpay">().notNull(),
  providerPaymentId: text("provider_payment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const todos = pgTable("todos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const credits = pgTable("credits", {
  id: uuid("id").primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  credits: integer("credits").default(150).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const creditSettings = pgTable("credit_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  featureName: text("feature_name").notNull().unique(),
  creditCost: integer("credit_cost").notNull(),
  description: text("description"),
  isPerPage: boolean("is_per_page").default(false).notNull(),
  maxPages: integer("max_pages"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const runs = pgTable("runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  url: text("url").notNull(),
  type: text("type").notNull(),
  status: text("status").default("running").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  result: jsonb("result"),
});

export const dailyApiUsage = pgTable("daily_api_usage", {
  ip: text("ip").notNull(),
  usageDate: date("usage_date").defaultNow().notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.ip, table.usageDate] }),
}));