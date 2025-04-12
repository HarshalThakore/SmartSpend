import { ArrowUp } from "lucide-react";
import { format, addDays } from "date-fns";

type IncomeCardProps = {
  monthlyIncome: number;
  nextIncomeDate: string;
  nextIncomeAmount: number;
};

export function IncomeCard({ monthlyIncome, nextIncomeDate, nextIncomeAmount }: IncomeCardProps) {
  // Calculate days until next income
  const getDaysUntil = (dateString: string) => {
    if (!dateString) return 0;
    
    const today = new Date();
    const nextDate = new Date(dateString);
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const daysUntilNextIncome = getDaysUntil(nextIncomeDate);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-neutral-500 text-sm font-medium mb-1">Monthly Income</h3>
          <p className="text-2xl font-semibold">${monthlyIncome.toFixed(2)}</p>
        </div>
        <div className="bg-green-500 rounded-full p-2 text-white">
          <ArrowUp className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4">
        {nextIncomeDate ? (
          <>
            <div className="text-xs text-neutral-500 mb-1">
              Next deposit in {daysUntilNextIncome} days
            </div>
            <div className="text-sm">
              <span className="font-medium">${nextIncomeAmount.toFixed(2)}</span> on {format(new Date(nextIncomeDate), "MMMM d, yyyy")}
            </div>
          </>
        ) : (
          <div className="text-sm text-neutral-500">
            No upcoming deposits scheduled
          </div>
        )}
      </div>
    </div>
  );
}
