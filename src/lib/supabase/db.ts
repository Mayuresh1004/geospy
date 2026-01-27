// src/lib/supabase/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/supabase/schema';

const connectionString = process.env.SUPABASE_DIRECT_CONN_URL;

if (!connectionString) {
  throw new Error("SUPABASE_DIRECT_CONN_URL is not set");
}

// Disable prefetch/prepared statements for compatibility with Supavisor (Supabase's pooler)
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });