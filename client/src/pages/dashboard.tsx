import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Footer } from "@/components/layout/footer";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { IncomeCard } from "@/components/dashboard/income-card";
import { ExpensesCard } from "@/components/dashboard/expenses-card";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ForumTopics } from "@/components/community/forum-topics";
import { StudentDeals } from "@/components/deals/student-deals";
import { Loader2 } from "lucide-react";
import { FinancialSummary } from "@shared/types";
import { Alert } from "@shared/schema";

export default function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: summary, isLoading: isLoadingSummary } = useQuery<FinancialSummary>({
    queryKey: ["/api/summary"],
  });
  
  const { data: alerts, isLoading: isLoadingAlerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  if (isLoadingSummary || isLoadingAlerts) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        {mobileMenuOpen && <MobileMenu />}
        
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      {mobileMenuOpen && <MobileMenu />}
      
      <main className="flex-grow">
        {/* Dashboard */}
        <div className="bg-dashboard py-8 relative">
          <div className="container mx-auto px-4 relative z-1">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-4">Financial Dashboard</h1>
            <p className="text-neutral-700 max-w-2xl mb-8">
              Track your finances, set budgets, and manage expenses all in one place. Smart financial management for international students.
            </p>
            
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <BalanceCard balance={summary?.balance || 0} />
              <IncomeCard 
                monthlyIncome={summary?.monthlyIncome || 0} 
                nextIncomeDate={summary?.nextIncomeDate || ""} 
                nextIncomeAmount={summary?.nextIncomeAmount || 0} 
              />
              <ExpensesCard 
                monthlyExpenses={summary?.monthlyExpenses || 0} 
                budgetDifference={summary?.budgetDifference || 0} 
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BudgetOverview />
              </div>
              <RecentAlerts alerts={alerts || []} />
            </div>
            
            {/* Recent Transactions Section */}
            <div className="mt-8">
              <RecentTransactions />
            </div>
          </div>
        </div>
        
        {/* Community & Deals Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ForumTopics limit={3} showViewAll={true} />
            <StudentDeals limit={3} showViewAll={true} />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
