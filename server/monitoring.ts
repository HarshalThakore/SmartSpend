
import { Express } from "express";
import { storage } from "./storage";

export function setupMonitoring(app: Express) {
  app.get("/metrics", async (req, res) => {
    const metrics = {
      activeUsers: await storage.getActiveUsersCount(),
      totalTransactions: await storage.getTotalTransactionsCount(),
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
    res.json(metrics);
  });
}
