import { ArrowDown, AlertTriangle } from "lucide-react";

type ExpensesCardProps = {
  monthlyExpenses: number;
  budgetDifference: number;
};

export function ExpensesCard({ monthlyExpenses, budgetDifference }: ExpensesCardProps) {
  const isOverBudget = budgetDifference > 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-neutral-500 text-sm font-medium mb-1">Monthly Expenses</h3>
          <p className="text-2xl font-semibold">${monthlyExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-red-500 rounded-full p-2 text-white">
          <ArrowDown className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 text-sm">
        {isOverBudget ? (
          <div className="text-red-500 font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {budgetDifference.toFixed(1)}% higher than budget
          </div>
        ) : budgetDifference < 0 ? (
          <div className="text-green-500 font-medium flex items-center">
            {Math.abs(budgetDifference).toFixed(1)}% under budget
          </div>
        ) : (
          <div className="text-neutral-500">
            On track with your budget
          </div>
        )}
      </div>
    </div>
  );
}
