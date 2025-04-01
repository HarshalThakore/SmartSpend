var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  extendedCategorySchema: () => extendedCategorySchema,
  extendedTransactionSchema: () => extendedTransactionSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserSchema: () => insertUserSchema,
  loginUserSchema: () => loginUserSchema,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  icon: text("icon").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  type: true,
  icon: true,
  userId: true
});
var transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(),
  // 'income' or 'expense'
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
  categoryId: integer("category_id").references(() => categories.id),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertTransactionSchema = createInsertSchema(transactions).pick({
  description: true,
  amount: true,
  type: true,
  date: true,
  notes: true,
  categoryId: true,
  userId: true
});
var usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  categories: many(categories)
}));
var categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  transactions: many(transactions)
}));
var transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] })
}));
var loginUserSchema = insertUserSchema;
var extendedTransactionSchema = insertTransactionSchema.extend({
  amount: z.number().positive("Amount must be a positive number"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["income", "expense"], {
    required_error: "Type must be either 'income' or 'expense'"
  }),
  date: z.string().or(z.date()).transform((val) => {
    if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  })
});
var extendedCategorySchema = insertCategorySchema.extend({
  name: z.string().min(1, "Category name is required"),
  type: z.enum(["income", "expense"], {
    required_error: "Type must be either 'income' or 'expense'"
  }),
  icon: z.string().min(1, "Icon is required")
});

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not defined");
}
var client = postgres(process.env.DATABASE_URL, {
  max: 10,
  ssl: {
    rejectUnauthorized: false
    // Required for Azure PostgreSQL connections
  }
});
var db = drizzle(client, { schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
var MemoryStore = createMemoryStore(session);
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
      this.sessionStore = new PostgresSessionStore({
        conObject: {
          connectionString: process.env.DATABASE_URL
        },
        createTableIfMissing: true
      });
    } else {
      this.sessionStore = new MemoryStore({
        checkPeriod: 864e5
        // prune expired entries every 24h
      });
    }
  }
  // User methods
  async getUser(id) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }
  async getUserByUsername(username) {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }
  async createUser(user) {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  // Category methods
  async getCategories(userId) {
    try {
      return await db.select().from(categories).where(eq(categories.userId, userId));
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  }
  async getCategoryById(id) {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.id, id));
      return category;
    } catch (error) {
      console.error("Error getting category by id:", error);
      throw error;
    }
  }
  async createCategory(category) {
    try {
      const [newCategory] = await db.insert(categories).values(category).returning();
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }
  async updateCategory(id, category) {
    try {
      const [updatedCategory] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
      return updatedCategory;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }
  async deleteCategory(id) {
    try {
      const result = await db.delete(categories).where(eq(categories.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }
  // Transaction methods
  async getTransactions(userId) {
    try {
      return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date));
    } catch (error) {
      console.error("Error getting transactions:", error);
      throw error;
    }
  }
  async getTransactionById(id) {
    try {
      const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
      return transaction;
    } catch (error) {
      console.error("Error getting transaction by id:", error);
      throw error;
    }
  }
  async createTransaction(transaction) {
    try {
      const [newTransaction] = await db.insert(transactions).values(transaction).returning();
      return newTransaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }
  async updateTransaction(id, transaction) {
    try {
      const [updatedTransaction] = await db.update(transactions).set(transaction).where(eq(transactions.id, id)).returning();
      return updatedTransaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }
  async deleteTransaction(id) {
    try {
      await db.delete(transactions).where(eq(transactions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  }
  // Dashboard stats
  async getDashboardStats(userId) {
    try {
      const userTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId));
      let totalIncome = 0;
      let totalExpenses = 0;
      userTransactions.forEach((transaction) => {
        if (transaction.type === "income") {
          totalIncome += transaction.amount;
        } else {
          totalExpenses += transaction.amount;
        }
      });
      const totalBalance = totalIncome - totalExpenses;
      const recentTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date)).limit(3);
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
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSecret = process.env.SESSION_SECRET || "fintrack_secret_key";
  const sessionSettings = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1e3 * 60 * 60 * 24 * 7
      // 1 week
    }
  };
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (err2) => {
        if (err2) {
          return next(err2);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
async function registerRoutes(app2) {
  setupAuth(app2);
  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  const handleValidation = (schema) => async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        next(error);
      }
    }
  };
  app2.get("/api/categories", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const categories2 = await storage.getCategories(userId);
      res.json(categories2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });
  app2.post(
    "/api/categories",
    ensureAuthenticated,
    handleValidation(extendedCategorySchema),
    async (req, res) => {
      try {
        const userId = req.user.id;
        const category = await storage.createCategory({
          ...req.body,
          userId
        });
        res.status(201).json(category);
      } catch (error) {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  );
  app2.put(
    "/api/categories/:id",
    ensureAuthenticated,
    handleValidation(extendedCategorySchema.partial()),
    async (req, res) => {
      try {
        const categoryId = parseInt(req.params.id);
        const category = await storage.getCategoryById(categoryId);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
        if (category.userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        const updatedCategory = await storage.updateCategory(categoryId, req.body);
        res.json(updatedCategory);
      } catch (error) {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  );
  app2.delete("/api/categories/:id", ensureAuthenticated, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      if (category.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteCategory(categoryId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  app2.get("/api/transactions", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const transactions2 = await storage.getTransactions(userId);
      res.json(transactions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });
  app2.post(
    "/api/transactions",
    ensureAuthenticated,
    handleValidation(extendedTransactionSchema),
    async (req, res) => {
      try {
        const userId = req.user.id;
        const transaction = await storage.createTransaction({
          ...req.body,
          userId
        });
        res.status(201).json(transaction);
      } catch (error) {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  );
  app2.put(
    "/api/transactions/:id",
    ensureAuthenticated,
    handleValidation(extendedTransactionSchema.partial()),
    async (req, res) => {
      try {
        const transactionId = parseInt(req.params.id);
        const transaction = await storage.getTransactionById(transactionId);
        if (!transaction) {
          return res.status(404).json({ message: "Transaction not found" });
        }
        if (transaction.userId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
        const updatedTransaction = await storage.updateTransaction(transactionId, req.body);
        res.json(updatedTransaction);
      } catch (error) {
        res.status(500).json({ message: "Failed to update transaction" });
      }
    }
  );
  app2.delete("/api/transactions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      if (transaction.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteTransaction(transactionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });
  app2.get("/api/dashboard", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard statistics" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
