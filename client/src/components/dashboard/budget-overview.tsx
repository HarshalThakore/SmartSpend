import { useQuery } from "@tanstack/react-query";
import { BudgetWithCategory } from "@shared/types";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid } from "lucide-react";
import { format } from "date-fns";

export function BudgetOverview() {
  const currentMonth = format(new Date(), "MMMM yyyy");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const { data: budgets, isLoading } = useQuery<BudgetWithCategory[]>({
    queryKey: ["/api/budgets"],
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex justify-center items-center h-80">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Generate last 3 months for the dropdown
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      options.push(format(date, "MMMM yyyy"));
    }
    
    return options;
  };
  
  const monthOptions = getMonthOptions();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-semibold">Budget Overview</h2>
        <Select defaultValue={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="text-sm bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1 h-auto w-auto">
            <SelectValue placeholder={currentMonth} />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Budget Category Progress Bars */}
      <div className="space-y-4">
        {budgets && budgets.length > 0 ? (
          budgets.map((budget) => (
            <div key={budget.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="font-medium">{budget.category?.name}</div>
                <div className="text-neutral-500">
                  <span className="text-primary font-medium">
                    ${budget.spent.toFixed(2)}
                  </span> of ${Number(budget.amount).toFixed(2)}
                </div>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    budget.percentage > 100 
                      ? "bg-red-500" 
                      : budget.percentage > 90 
                        ? "bg-yellow-500" 
                        : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <p className="mb-4">No budget categories found</p>
            <Button variant="outline" className="text-primary">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Set up your budget
            </Button>
          </div>
        )}
      </div>
      
      {budgets && budgets.length > 0 && (
        <Button variant="ghost" className="mt-6 text-sm text-primary font-medium flex items-center">
          <LayoutGrid className="h-4 w-4 mr-1" />
          See all budget categories
        </Button>
      )}
    </div>
  );
}
