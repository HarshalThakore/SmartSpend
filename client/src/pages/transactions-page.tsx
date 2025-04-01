import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import TransactionList from "@/components/transaction-list";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import TransactionForm from "@/components/transaction-form";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction } from "@shared/schema";
import CSVUploadWidget from "@/components/csv-upload";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export default function TransactionsPage() {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Filter and search transactions
  const filteredTransactions = transactions?.filter((transaction: Transaction) => {
    // Apply type filter
    if (filter === "income" && transaction.type !== "income") return false;
    if (filter === "expense" && transaction.type !== "expense") return false;
    
    // Apply search
    if (search && !transaction.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsAddingTransaction(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Transactions Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
                <p className="mt-1 text-sm text-gray-600">
                  View and manage all your financial transactions
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-2">
                <Button onClick={() => {
                  setEditingTransaction(null);
                  setIsAddingTransaction(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
                
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="mx-auto w-full max-w-4xl">
                      <DrawerHeader>
                        <DrawerTitle>Import Transactions</DrawerTitle>
                        <DrawerDescription>
                          Upload a CSV file to import multiple transactions at once.
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="p-4 pb-0">
                        <CSVUploadWidget />
                      </div>
                      <DrawerFooter>
                        <DrawerClose asChild>
                          <Button variant="outline">Close</Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Bar */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4">
              <div className="w-full md:w-1/3">
                <Select
                  value={filter}
                  onValueChange={setFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-2/3 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <TransactionList 
            transactions={filteredTransactions || []} 
            showActions={true}
            onEdit={handleEditTransaction}
            emptyMessage={
              search || filter !== "all" 
                ? "No transactions match your filters."
                : "No transactions found. Add your first transaction to get started!"
            }
          />
        )}
      </div>

      <TransactionForm 
        open={isAddingTransaction} 
        onOpenChange={setIsAddingTransaction}
        transaction={editingTransaction}
      />
    </div>
  );
}
