import { pgTable, text, serial, integer, boolean, date, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaSecret: text("mfa_secret"),
  lastLogin: timestamp("last_login"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

// Transaction categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'fixed', 'variable', 'discretionary', 'income'
  color: text("color").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  type: true,
  color: true,
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull(),
  isIncome: boolean("is_income").notNull().default(false),
});

export const insertTransactionSchema = createInsertSchema(transactions)
  .pick({
    userId: true,
    amount: true,
    date: true,
    description: true,
    categoryId: true,
    isIncome: true,
  })
  .extend({
    // Ensure amount is validated as a string that can be parsed as a number
    amount: z.union([z.string(), z.number()])
      .transform((val) => {
        // Convert to string first for consistency
        const stringVal = typeof val === 'number' ? val.toString() : val;
        // Check if it's a valid number string
        if (!/^-?\d*\.?\d+$/.test(stringVal)) {
          throw new z.ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['amount'],
              message: 'Expected string, received number',
            },
          ]);
        }
        return stringVal;
      }),
    // Properly validate categoryId
    categoryId: z.union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === '') {
          throw new Error('Category is required');
        }
        const numVal = typeof val === 'string' ? parseInt(val, 10) : val;
        if (isNaN(numVal)) {
          throw new Error('Invalid category');
        }
        return numVal;
      }),
  });

// Budget table
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull(), // 'monthly', 'weekly', etc.
});

export const insertBudgetSchema = createInsertSchema(budgets)
  .pick({
    userId: true,
    categoryId: true,
    amount: true,
    period: true,
  })
  .extend({
    // Ensure amount is validated as a string that can be parsed as a number
    amount: z.union([z.string(), z.number()])
      .transform((val) => {
        // Convert to string first for consistency
        const stringVal = typeof val === 'number' ? val.toString() : val;
        // Check if it's a valid number string
        if (!/^-?\d*\.?\d+$/.test(stringVal)) {
          throw new z.ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['amount'],
              message: 'Expected string, received number',
            },
          ]);
        }
        return stringVal;
      }),
    // Make sure categoryId is a number
    categoryId: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    ),
  });

// Alerts table
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'warning', 'error', 'success'
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
});

// Forum topics table
export const forumTopics = pgTable("forum_topics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForumTopicSchema = createInsertSchema(forumTopics).pick({
  userId: true,
  title: true,
  content: true,
});

// Forum replies table
export const forumReplies = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForumReplySchema = createInsertSchema(forumReplies).pick({
  topicId: true,
  userId: true,
  content: true,
});

// Deals table
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  company: text("company").notNull(),
  validUntil: date("valid_until"),
  addedBy: integer("added_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDealSchema = createInsertSchema(deals).pick({
  title: true,
  description: true,
  company: true,
  validUntil: true,
  addedBy: true,
});

// Types for frontend
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type ForumTopic = typeof forumTopics.$inferSelect;
export type InsertForumTopic = z.infer<typeof insertForumTopicSchema>;

export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
