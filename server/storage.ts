import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pkg from 'pg';
const { Pool } = pkg;
import session from "express-session";
import createMemoryStore from "memorystore";
import * as schema from "@shared/schema";
import type { SystemSettings } from "./types";
import type { 
  User, InsertUser, Category, InsertCategory, 
  Transaction, InsertTransaction, Budget, InsertBudget,
  Alert, InsertAlert, ForumTopic, InsertForumTopic,
  ForumReply, InsertForumReply, Deal, InsertDeal
} from "@shared/schema";

const MemoryStore = createMemoryStore(session);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Azure PostgreSQL
  }
});

const db = drizzle(pool, { schema });

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Transaction methods
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: number): Promise<boolean>;
  getAllTransactions(): Promise<Transaction[]>;

  // Budget methods
  getBudgetsByUser(userId: number): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: number): Promise<boolean>;
  getAllBudgets(): Promise<Budget[]>;

  // Alert methods
  getAlertsByUser(userId: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<boolean>;
  getAllAlerts(): Promise<Alert[]>;

  // Forum methods
  getAllForumTopics(): Promise<ForumTopic[]>;
  getForumTopicById(id: number): Promise<ForumTopic | undefined>;
  createForumTopic(topic: InsertForumTopic): Promise<ForumTopic>;
  getRepliesByTopic(topicId: number): Promise<ForumReply[]>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  getAllForumReplies(): Promise<ForumReply[]>;

  // Deals methods
  getAllDeals(): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;

  // System settings
  getSystemSettings(): Promise<any>;
  updateSystemSettings(settings: any): Promise<any>;

  // Backup and restore
  restoreFromBackup(backup: any): Promise<boolean>;

  // Session store
  sessionStore: any;
}

export class PostgresStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(sql`id = ${id}`);
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(schema.users).where(sql`username = ${username}`);
    return users[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(schema.users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(schema.users)
      .set(userData)
      .where(sql`id = ${id}`)
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(schema.users).where(sql`id = ${id}`);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(schema.categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const categories = await db.select().from(schema.categories).where(sql`id = ${id}`);
    return categories[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(schema.categories).values(category).returning();
    return newCategory;
  }

  // Transaction methods
  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(schema.transactions)
      .where(sql`user_id = ${userId}`);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(schema.transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(schema.transactions)
      .set(transaction)
      .where(sql`id = ${id}`)
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    await db.delete(schema.transactions).where(sql`id = ${id}`);
    return true;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(schema.transactions);
  }

  // Budget methods
  async getBudgetsByUser(userId: number): Promise<Budget[]> {
    return await db
      .select()
      .from(schema.budgets)
      .where(sql`user_id = ${userId}`);
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(schema.budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: number, budget: Partial<Budget>): Promise<Budget> {
    const [updatedBudget] = await db
      .update(schema.budgets)
      .set(budget)
      .where(sql`id = ${id}`)
      .returning();
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    await db.delete(schema.budgets).where(sql`id = ${id}`);
    return true;
  }

  async getAllBudgets(): Promise<Budget[]> {
    return await db.select().from(schema.budgets);
  }

  // Alert methods
  async getAlertsByUser(userId: number): Promise<Alert[]> {
    return await db
      .select()
      .from(schema.alerts)
      .where(sql`user_id = ${userId}`)
      .orderBy(sql`created_at desc`);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(schema.alerts).values(alert).returning();
    return newAlert;
  }

  async markAlertAsRead(id: number): Promise<boolean> {
    await db
      .update(schema.alerts)
      .set({ read: true })
      .where(sql`id = ${id}`);
    return true;
  }

  async getAllAlerts(): Promise<Alert[]> {
    return await db.select().from(schema.alerts);
  }

  // Forum methods
  async getAllForumTopics(): Promise<ForumTopic[]> {
    return await db
      .select()
      .from(schema.forumTopics)
      .orderBy(sql`created_at desc`);
  }

  async getForumTopicById(id: number): Promise<ForumTopic | undefined> {
    const topics = await db.select().from(schema.forumTopics).where(sql`id = ${id}`);
    return topics[0];
  }

  async createForumTopic(topic: InsertForumTopic): Promise<ForumTopic> {
    const [newTopic] = await db.insert(schema.forumTopics).values(topic).returning();
    return newTopic;
  }

  async getRepliesByTopic(topicId: number): Promise<ForumReply[]> {
    return await db
      .select()
      .from(schema.forumReplies)
      .where(sql`topic_id = ${topicId}`)
      .orderBy(sql`created_at asc`);
  }

  async createForumReply(reply: InsertForumReply): Promise<ForumReply> {
    const [newReply] = await db.insert(schema.forumReplies).values(reply).returning();
    return newReply;
  }

  async getAllForumReplies(): Promise<ForumReply[]> {
    return await db.select().from(schema.forumReplies);
  }

  // Deals methods
  async getAllDeals(): Promise<Deal[]> {
    return await db
      .select()
      .from(schema.deals)
      .orderBy(sql`created_at desc`);
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(schema.deals).values(deal).returning();
    return newDeal;
  }

  private systemSettings: SystemSettings = {
    allowRegistration: true,
    maintenanceMode: false,
    appName: "Smart Spend",
    contactEmail: "support@smartspend.com",
    backupFrequency: "daily",
    lastBackup: null
  };

  async getSystemSettings(): Promise<SystemSettings> {
    return { ...this.systemSettings };
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    this.systemSettings = { ...this.systemSettings, ...settings };
    return this.systemSettings;
  }

  async restoreFromBackup(backup: any): Promise<boolean> {
    // Implementation would depend on your backup strategy
    return false;
  }
}

export const storage = new PostgresStorage();
