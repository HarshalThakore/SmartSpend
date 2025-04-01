import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/hooks/use-auth";
import SummaryCards from "@/components/summary-cards";
import TransactionList from "@/components/transaction-list";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import TransactionForm from "@/components/transaction-form";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Financial Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Hello, {user?.username}! Here's your financial overview.
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex">
                <Button onClick={() => setIsAddingTransaction(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <SummaryCards
            balance={dashboardData?.totalBalance || 0}
            income={dashboardData?.totalIncome || 0}
            expenses={dashboardData?.totalExpenses || 0}
          />
        )}

        {/* Recent Transactions */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-gray-900">Recent Transactions</h2>
            <Link href="/transactions" className="text-primary hover:text-primary/80 text-sm font-medium">
              View all
            </Link>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <TransactionList 
              transactions={dashboardData?.recentTransactions || []} 
              showActions={false}
              emptyMessage="No recent transactions. Add your first transaction to get started!"
            />
          )}
        </div>
      </div>

      <TransactionForm 
        open={isAddingTransaction} 
        onOpenChange={setIsAddingTransaction} 
      />
    </div>
  );
}
