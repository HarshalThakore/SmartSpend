import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type SummaryCardsProps = {
  balance: number;
  income: number;
  expenses: number;
};

export default function SummaryCards({ balance, income, expenses }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Balance Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <span className="material-icons text-primary">account_balance_wallet</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Current Balance</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900 font-mono">
                    {formatCurrency(balance)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <span className="material-icons text-green-600">trending_up</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Income</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-green-600 font-mono">
                    {formatCurrency(income)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <span className="material-icons text-red-600">trending_down</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-red-600 font-mono">
                    {formatCurrency(expenses)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
