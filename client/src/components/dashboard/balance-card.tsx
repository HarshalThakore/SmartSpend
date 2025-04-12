import { ArrowUpRight } from "lucide-react";

type BalanceCardProps = {
  balance: number;
};

export function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-neutral-500 text-sm font-medium mb-1">Current Balance</h3>
          <p className="text-2xl font-semibold">${balance.toFixed(2)}</p>
        </div>
        <div className="bg-primary-light rounded-full p-2 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className="text-green-600 font-medium flex items-center">
          <ArrowUpRight className="h-4 w-4 mr-1" />
          3.5%
        </span>
        <span className="text-neutral-500 ml-2">from last month</span>
      </div>
    </div>
  );
}
