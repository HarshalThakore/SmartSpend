import { Card } from "@/components/ui/card";
import { Transaction } from "@shared/schema";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

type TransactionListProps = {
  transactions: Transaction[];
  showActions?: boolean;
  onEdit?: (transaction: Transaction) => void;
  emptyMessage?: string;
};

export default function TransactionList({ 
  transactions, 
  showActions = true,
  onEdit,
  emptyMessage = "No transactions found."
}: TransactionListProps) {
  const { toast } = useToast();

  // Get categories to display category names
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Transaction deleted",
        description: "The transaction has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete transaction",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Get category name by ID
  const getCategoryName = (categoryId?: number | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories?.find(c => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Get icon for transaction (from category)
  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.categoryId) {
      const category = categories?.find(c => c.id === transaction.categoryId);
      if (category) return category.icon;
    }
    
    // Default icons based on transaction type
    return transaction.type === 'income' ? 'payments' : 'shopping_cart';
  };

  if (transactions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {transactions.map(transaction => (
          <li key={transaction.id}>
            <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`rounded-full p-2 mr-4 ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className={`material-icons text-sm ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {getTransactionIcon(transaction)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{getCategoryName(transaction.categoryId)}</p>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0 flex">
                  <p className={`px-2 inline-flex text-sm leading-5 font-semibold rounded-full font-mono ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex text-sm text-gray-500">
                  {transaction.notes && (
                    <p className="flex items-center">
                      <span className="material-icons text-gray-400 text-xs mr-1">notes</span>
                      {transaction.notes}
                    </p>
                  )}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <span className="material-icons text-gray-400 text-xs mr-1">calendar_today</span>
                  <p>
                    {format(new Date(transaction.date), "MMM dd, yyyy")}
                  </p>
                  
                  {showActions && (
                    <div className="ml-4 flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit && onEdit(transaction)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="material-icons text-sm">edit</span>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-gray-400 hover:text-red-600"
                          >
                            <span className="material-icons text-sm">delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(transaction.id)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
