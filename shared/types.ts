// Extended types for the frontend
export type TransactionWithCategory = {
  id: number;
  userId: number;
  amount: number;
  date: string;
  description: string;
  categoryId: number;
  isIncome: boolean;
  category: {
    id: number;
    name: string;
    type: string;
    color: string;
  };
};

export type BudgetWithCategory = {
  id: number;
  userId: number;
  categoryId: number;
  amount: number;
  period: string;
  category: {
    id: number;
    name: string;
    type: string;
    color: string;
  };
  spent: number;
  percentage: number;
};

export type TopicWithUser = {
  id: number;
  userId: number;
  title: string;
  content: string;
  likes: number;
  views: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName: string;
  };
  replyCount: number;
};

export type DealWithUser = {
  id: number;
  title: string;
  description: string;
  company: string;
  validUntil: string;
  addedBy: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName: string;
  };
};

export type FinancialSummary = {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  nextIncomeDate: string;
  nextIncomeAmount: number;
  budgetDifference: number;
};
