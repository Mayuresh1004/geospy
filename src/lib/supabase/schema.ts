// src/lib/supabase/schema.ts

import { 
  pgTable, 
  pgSchema, 
  uuid, 
  text,
  boolean, 
  timestamp,
} from "drizzle-orm/pg-core";

// 1. Reference the Supabase Auth Schema
export const authSchema = pgSchema("auth");

export const users = authSchema.table("users", {
  id: uuid("id").primaryKey().notNull(),
});

// 3. Tables

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  username: text("username").unique(),
  fullName: text("full_name"),
  email: text("email").unique(),
  avatarUrl: text("avatar_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});