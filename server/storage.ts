import { 
  users, type User, type InsertUser, 
  categories, type Category, type InsertCategory,
  transactions, type Transaction, type InsertTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
type SessionStore = session.Store;
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import postgres from "postgres";

// Memory store for session (for development)
const MemoryStore = createMemoryStore(session);

// PostgreSQL session store (for production)
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(userId: number): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Transaction methods
  getTransactions(userId: number): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Stats methods
  getDashboardStats(userId: number): Promise<{
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    recentTransactions: Transaction[];
  }>;
  
  // Session store
  sessionStore: SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      // In production, use PostgreSQL for session storage
      this.sessionStore = new PostgresSessionStore({
        conObject: {
          connectionString: process.env.DATABASE_URL,
        },
        createTableIfMissing: true,
      });
    } else {
      // In development, use memory store
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    try {
      return await db.select().from(categories).where(eq(categories.userId, userId));
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.id, id));
      return category;
    } catch (error) {
      console.error("Error getting category by id:", error);
      throw error;
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const [newCategory] = await db.insert(categories).values(category).returning();
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    try {
      const [updatedCategory] = await db
        .update(categories)
        .set(category)
        .where(eq(categories.id, id))
        .returning();
      return updatedCategory;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      const result = await db.delete(categories).where(eq(categories.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }

  // Transaction methods
  async getTransactions(userId: number): Promise<Transaction[]> {
    try {
      return await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date));
    } catch (error) {
      console.error("Error getting transactions:", error);
      throw error;
    }
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    try {
      const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
      return transaction;
    } catch (error) {
      console.error("Error getting transaction by id:", error);
      throw error;
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const [newTransaction] = await db.insert(transactions).values(transaction).returning();
      return newTransaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    try {
      const [updatedTransaction] = await db
        .update(transactions)
        .set(transaction)
        .where(eq(transactions.id, id))
        .returning();
      return updatedTransaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      await db.delete(transactions).where(eq(transactions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  }

  // Dashboard stats
  async getDashboardStats(userId: number): Promise<{
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    recentTransactions: Transaction[];
  }> {
    try {
      // Get all transactions for the user
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));

      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;

      userTransactions.forEach(transaction => {
        if (transaction.type === 'income') {
          totalIncome += transaction.amount;
        } else {
          totalExpenses += transaction.amount;
        }
      });

      const totalBalance = totalIncome - totalExpenses;

      // Get recent transactions
      const recentTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date))
        .limit(3);

      return {
        totalBalance,
        totalIncome,
        totalExpenses,
        recentTransactions
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
