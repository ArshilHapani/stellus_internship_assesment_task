import { text, integer, pgTable } from "drizzle-orm/pg-core";

export const PoolTable = pgTable("pools", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userAddress: text().notNull(),
  poolAddress: text().notNull(),
  poolName: text().notNull(),
  image: text().notNull(),
  description: text().notNull(),
  bump: integer().notNull(),
});
