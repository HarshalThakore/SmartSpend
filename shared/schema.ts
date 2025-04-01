import { pgTable, text, serial, integer, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Categories model
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  icon: text("icon").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  type: true,
  icon: true,
  userId: true,
});

// Transactions model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(), // 'income' or 'expense'
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
  categoryId: integer("category_id").references(() => categories.id),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  description: true,
  amount: true,
  type: true,
  date: true,
  notes: true,
  categoryId: true,
  userId: true,
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Extend schemas for validation
export const loginUserSchema = insertUserSchema;

export const extendedTransactionSchema = insertTransactionSchema.extend({
  amount: z.number().positive("Amount must be a positive number"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["income", "expense"], { 
    required_error: "Type must be either 'income' or 'expense'" 
  }),
  date: z.string().or(z.date()).transform(val => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const extendedCategorySchema = insertCategorySchema.extend({
  name: z.string().min(1, "Category name is required"),
  type: z.enum(["income", "expense"], { 
    required_error: "Type must be either 'income' or 'expense'" 
  }),
  icon: z.string().min(1, "Icon is required"),
});
