import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { formatISO } from "date-fns";
import { 
  insertTransactionSchema, 
  insertBudgetSchema, 
  insertForumTopicSchema, 
  insertForumReplySchema, 
  insertDealSchema,
  insertAlertSchema
} from "@shared/schema";
import * as fs from 'fs'; // Import the fs module
import { parse } from 'csv-parse/sync'; //Corrected import statement
import { mkdir } from 'fs/promises'; //Already correctly imported


export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API Endpoints

  // Categories
  app.get("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    let categories = await storage.getCategories();

    // Create default categories if none exist
    if (categories.length === 0) {
      const defaultCategories = [
        { name: "Housing", type: "fixed", color: "#FF5722" },
        { name: "Food", type: "variable", color: "#4CAF50" },
        { name: "Transportation", type: "variable", color: "#2196F3" },
        { name: "Entertainment", type: "discretionary", color: "#9C27B0" },
        { name: "Education", type: "fixed", color: "#FF9800" },
        { name: "Healthcare", type: "variable", color: "#E91E63" },
        { name: "Shopping", type: "discretionary", color: "#00BCD4" },
        { name: "Income", type: "income", color: "#8BC34A" }
      ];

      for (const category of defaultCategories) {
        await storage.createCategory(category);
      }

      categories = await storage.getCategories();
    }

    res.json(categories);
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const transactions = await storage.getTransactionsByUser(userId);

    // Get all categories to attach to transactions
    const categories = await storage.getCategories();
    const categoriesMap = new Map(categories.map(cat => [cat.id, cat]));

    // Return transactions with category information
    const transactionsWithCategory = transactions.map(transaction => {
      const category = categoriesMap.get(transaction.categoryId);
      return {
        ...transaction,
        category
      };
    });

    res.json(transactionsWithCategory);
  });

  app.post("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = req.user!.id;
      const data = { ...req.body, userId };

      const validatedData = insertTransactionSchema.parse(data);
      const transaction = await storage.createTransaction(validatedData);

      // Check if this transaction exceeds any budget
      checkBudgetAlerts(userId, transaction.categoryId, transaction.amount);

      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;

      // First check if the transaction belongs to the user
      const transactions = await storage.getTransactionsByUser(userId);
      const transaction = transactions.find(t => t.id === id);

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const updatedTransaction = await storage.updateTransaction(id, req.body);
      res.json(updatedTransaction);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;

      // First check if the transaction belongs to the user
      const transactions = await storage.getTransactionsByUser(userId);
      const transaction = transactions.find(t => t.id === id);

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const success = await storage.deleteTransaction(id);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(500).json({ error: "Failed to delete transaction" });
      }
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Budgets
  app.get("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const budgets = await storage.getBudgetsByUser(userId);

    // Get all categories to attach to budgets
    const categories = await storage.getCategories();
    const categoriesMap = new Map(categories.map(cat => [cat.id, cat]));

    // Get all transactions to calculate spent amount
    const transactions = await storage.getTransactionsByUser(userId);

    // Calculate spent amount for each budget
    const budgetsWithDetails = budgets.map(budget => {
      const category = categoriesMap.get(budget.categoryId);

      // Calculate spent amount for this category
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const spent = transactions
        .filter(t => 
          t.categoryId === budget.categoryId && 
          !t.isIncome &&
          new Date(t.date).getMonth() === currentMonth &&
          new Date(t.date).getFullYear() === currentYear
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const percentage = budget.amount > 0 ? (spent / Number(budget.amount)) * 100 : 0;

      return {
        ...budget,
        category,
        spent,
        percentage
      };
    });

    res.json(budgetsWithDetails);
  });

  app.post("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = req.user!.id;
      const data = { ...req.body, userId };

      const validatedData = insertBudgetSchema.parse(data);
      const budget = await storage.createBudget(validatedData);

      res.status(201).json(budget);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.put("/api/budgets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;

      // First check if the budget belongs to the user
      const budgets = await storage.getBudgetsByUser(userId);
      const budget = budgets.find(b => b.id === id);

      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }

      const updatedBudget = await storage.updateBudget(id, req.body);
      res.json(updatedBudget);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/budgets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;

      // First check if the budget belongs to the user
      const budgets = await storage.getBudgetsByUser(userId);
      const budget = budgets.find(b => b.id === id);

      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }

      const success = await storage.deleteBudget(id);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(500).json({ error: "Failed to delete budget" });
      }
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Alerts
  app.get("/api/alerts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const alerts = await storage.getAlertsByUser(userId);
    res.json(alerts);
  });

  app.post("/api/alerts/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const success = await storage.markAlertAsRead(id);

      if (success) {
        res.sendStatus(200);
      } else {
        res.status(404).json({ error: "Alert not found" });
      }
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Financial summary
  app.get("/api/summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = req.user!.id;
    const transactions = await storage.getTransactionsByUser(userId);
    const budgets = await storage.getBudgetsByUser(userId);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter transactions for the current month
    const currentMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    // Calculate monthly income
    const monthlyIncome = currentMonthTransactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate monthly expenses
    const monthlyExpenses = currentMonthTransactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate current balance
    const balance = transactions
      .reduce((sum, t) => t.isIncome ? sum + Number(t.amount) : sum - Number(t.amount), 0);

    // Get income transactions to predict next income
    const incomeTransactions = transactions
      .filter(t => t.isIncome)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Estimate next income date and amount (using the most recent income)
    let nextIncomeDate = "";
    let nextIncomeAmount = 0;

    if (incomeTransactions.length > 0) {
      const lastIncome = incomeTransactions[0];
      const lastIncomeDate = new Date(lastIncome.date);

      // Assume income is monthly
      const nextDate = new Date(lastIncomeDate);
      nextDate.setMonth(nextDate.getMonth() + 1);

      nextIncomeDate = formatISO(nextDate, { representation: 'date' });
      nextIncomeAmount = Number(lastIncome.amount);
    }

    // Calculate budget variance
    const totalBudgeted = budgets
      .reduce((sum, b) => sum + Number(b.amount), 0);

    const budgetDifference = totalBudgeted > 0 
      ? ((monthlyExpenses / totalBudgeted) - 1) * 100 
      : 0;

    const summary = {
      balance,
      monthlyIncome,
      monthlyExpenses,
      nextIncomeDate,
      nextIncomeAmount,
      budgetDifference
    };

    res.json(summary);
  });

  // Forum
  app.get("/api/forum", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const topics = await storage.getAllForumTopics();

    // Get all users to attach to topics
    const usersMap = new Map();

    for (const topic of topics) {
      if (!usersMap.has(topic.userId)) {
        const user = await storage.getUser(topic.userId);
        if (user) {
          usersMap.set(topic.userId, {
            id: user.id,
            username: user.username,
            fullName: user.fullName
          });
        }
      }
    }

    // Count replies for each topic
    const replyCounts = new Map();

    for (const topic of topics) {
      const replies = await storage.getRepliesByTopic(topic.id);
      replyCounts.set(topic.id, replies.length);
    }

    // Return topics with user and reply count information
    const topicsWithDetails = topics.map(topic => {
      return {
        ...topic,
        user: usersMap.get(topic.userId),
        replyCount: replyCounts.get(topic.id) || 0
      };
    });

    res.json(topicsWithDetails);
  });

  app.get("/api/forum/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const id = parseInt(req.params.id);
      const topic = await storage.getForumTopicById(id);

      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      // Get replies for this topic
      const replies = await storage.getRepliesByTopic(id);

      // Get all users to attach to replies
      const usersMap = new Map();

      // Add the topic creator
      const topicCreator = await storage.getUser(topic.userId);
      if (topicCreator) {
        usersMap.set(topic.userId, {
          id: topicCreator.id,
          username: topicCreator.username,
          fullName: topicCreator.fullName
        });
      }

      // Add reply creators
      for (const reply of replies) {
        if (!usersMap.has(reply.userId)) {
          const user = await storage.getUser(reply.userId);
          if (user) {
            usersMap.set(reply.userId, {
              id: user.id,
              username: user.username,
              fullName: user.fullName
            });
          }
        }
      }

      // Return topic with replies and user information
      const topicWithDetails = {
        ...topic,
        user: usersMap.get(topic.userId),
        replies: replies.map(reply => ({
          ...reply,
          user: usersMap.get(reply.userId)
        }))
      };

      res.json(topicWithDetails);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/forum", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = req.user!.id;
      const data = { ...req.body, userId };

      const validatedData = insertForumTopicSchema.parse(data);
      const topic = await storage.createForumTopic(validatedData);

      res.status(201).json(topic);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/forum/:id/replies", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const topicId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if the topic exists
      const topic = await storage.getForumTopicById(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      const data = { 
        ...req.body, 
        userId, 
        topicId 
      };

      const validatedData = insertForumReplySchema.parse(data);
      const reply = await storage.createForumReply(validatedData);

      res.status(201).json(reply);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Deals
  app.get("/api/deals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Get all deals
    const deals = await storage.getAllDeals();

    // Get all users to attach to deals
    const usersMap = new Map();

    for (const deal of deals) {
      if (!usersMap.has(deal.addedBy)) {
        const user = await storage.getUser(deal.addedBy);
        if (user) {
          usersMap.set(deal.addedBy, {
            id: user.id,
            username: user.username,
            fullName: user.fullName
          });
        }
      }
    }

    // Return deals with user information
    const dealsWithUser = deals.map(deal => {
      return {
        ...deal,
        user: usersMap.get(deal.addedBy)
      };
    });

    res.json(dealsWithUser);
  });

  app.post("/api/deals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = req.user!.id;
      const data = { ...req.body, addedBy: userId };

      const validatedData = insertDealSchema.parse(data);
      const deal = await storage.createDeal(validatedData);

      res.status(201).json(deal);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Utility function to check budget alerts
  async function checkBudgetAlerts(userId: number, categoryId: number, transactionAmount: number | string) {
    // Get budgets for this user and category
    const budgets = await storage.getBudgetsByUser(userId);
    const budget = budgets.find(b => b.categoryId === categoryId);

    if (!budget) return; // No budget for this category

    // Get all transactions for this month and category
    const transactions = await storage.getTransactionsByUser(userId);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const categoryTransactions = transactions.filter(t => 
      t.categoryId === categoryId && 
      !t.isIncome &&
      new Date(t.date).getMonth() === currentMonth &&
      new Date(t.date).getFullYear() === currentYear
    );

    // Calculate total spent including the new transaction
    const totalSpent = categoryTransactions.reduce(
      (sum, t) => sum + Number(t.amount), 
      0
    ) + Number(transactionAmount);

    // Calculate percentage of budget
    const percentage = (totalSpent / Number(budget.amount)) * 100;

    // Create alerts based on thresholds
    if (percentage > 100) {
      // Budget exceeded alert
      const category = await storage.getCategoryById(categoryId);
      const categoryName = category ? category.name : 'this category';

      await storage.createAlert({
        userId,
        title: `Budget Alert: ${categoryName}`,
        message: `You've exceeded your ${categoryName} budget by $${(totalSpent - Number(budget.amount)).toFixed(2)} (${(percentage - 100).toFixed(0)}%)`,
        type: 'error'
      });
    } else if (percentage > 90 && percentage <= 100) {
      // Budget warning alert
      const category = await storage.getCategoryById(categoryId);
      const categoryName = category ? category.name : 'this category';

      await storage.createAlert({
        userId,
        title: `Budget Warning: ${categoryName}`,
        message: `You've reached ${percentage.toFixed(0)}% of your ${categoryName} budget for this month`,
        type: 'warning'
      });
    }
  }

  // Admin authorization middleware
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: "Admin access required" });
    next();
  };

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/admin/user/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/admin/user/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user data
      const updatedUser = await storage.updateUser(id, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/admin/user/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete user
      const success = await storage.deleteUser(id);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(500).json({ error: "Failed to delete user" });
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Database management endpoints
  app.get("/api/admin/database/backup", isAdmin, async (req, res) => {
    try {
      // Generate a database backup
      const backup = {
        timestamp: new Date().toISOString(),
        users: await storage.getAllUsers(),
        transactions: await storage.getAllTransactions(),
        budgets: await storage.getAllBudgets(),
        categories: await storage.getCategories(),
        alerts: await storage.getAllAlerts(),
        forumTopics: await storage.getAllForumTopics(),
        forumReplies: await storage.getAllForumReplies(),
        deals: await storage.getAllDeals()
      };

      res.json(backup);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/admin/database/restore", isAdmin, async (req, res) => {
    try {
      // Restore from a backup
      const backup = req.body;

      if (!backup || !backup.timestamp) {
        return res.status(400).json({ error: "Invalid backup format" });
      }

      // Implementation would depend on storage system
      const success = await storage.restoreFromBackup(backup);

      if (success) {
        res.sendStatus(200);
      } else {
        res.status(500).json({ error: "Failed to restore from backup" });
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Reports endpoints
  app.get("/api/admin/reports/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();

      const report = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.lastLogin && new Date(u.lastLogin).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length,
        newUsersThisMonth: users.filter(u => {
          const createdAt = u.createdAt ? new Date(u.createdAt) : null;
          if (!createdAt) return false;

          const now = new Date();
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear();
        }).length
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/admin/reports/transactions", isAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();

      // Group by month
      const monthlyTransactions = transactions.reduce((acc, t) => {
        const date = new Date(t.date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month + 1}`;

        if (!acc[key]) {
          acc[key] = {
            income: 0,
            expenses: 0,
            count: 0
          };
        }

        if (t.isIncome) {
          acc[key].income += Number(t.amount);
        } else {
          acc[key].expenses += Number(t.amount);
        }

        acc[key].count++;

        return acc;
      }, {} as Record<string, { income: number, expenses: number, count: number }>);

      res.json(monthlyTransactions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // System settings
  app.get("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      const updatedSettings = await storage.updateSystemSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/transactions/upload-csv", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const csvBuffer = Buffer.from(req.body.csvData, 'base64');
      const userId = req.user!.id;

      const csvString = csvBuffer.toString();
      
      // Validate CSV structure
      const records = parse(csvString, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true
      });

      if (!records || records.length === 0) {
        throw new Error("CSV file is empty or invalid");
      }

      // Validate required columns
      const requiredColumns = ['amount', 'date', 'description', 'categoryId', 'isIncome'];
      const csvColumns = Object.keys(records[0]);
      const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col));

      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Ensure directory exists and save file
      const csvDir = '/data/csv';
      await fs.promises.mkdir(csvDir, { recursive: true });

      const filename = `transactions-${userId}-${Date.now()}.csv`;
      const filePath = `${csvDir}/${filename}`;
      await fs.promises.writeFile(filePath, csvBuffer);

      // Create transactions
      for (const record of records) {
        const transaction = {
          userId,
          amount: parseFloat(record.amount),
          date: record.date,
          description: record.description,
          categoryId: parseInt(record.categoryId),
          isIncome: record.isIncome === 'true'
        };

        await storage.createTransaction(transaction);
      }

      res.status(201).json({ message: "CSV uploaded and transactions created successfully" });
    } catch (error) {
      console.error("Error uploading CSV:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload CSV";
      res.status(400).json({ error: errorMessage });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}