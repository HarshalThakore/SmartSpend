import { useQuery, useMutation } from "@tanstack/react-query";
import { TransactionWithCategory } from "@shared/types";
import { format } from "date-fns";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const transactionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Please select a category",
  }),
  isIncome: z.boolean().default(false),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function RecentTransactions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<TransactionWithCategory[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      categoryId: "",
      isIncome: false,
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      const transformedData = {
        ...data,
        amount: parseFloat(data.amount),
        categoryId: parseInt(data.categoryId),
        isIncome: data.isIncome || false,
      };
      const res = await apiRequest("POST", "/api/transactions", transformedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      toast({
        title: "Transaction created",
        description: "Your transaction has been successfully added",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransactionFormValues) => {
    createTransaction.mutate(data);
  };

  // Loading state
  if (isLoadingTransactions || isLoadingCategories) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sort transactions by date (newest first)
  const sortedTransactions = transactions 
    ? [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  
  // Take only the 5 most recent transactions
  const recentTransactions = sortedTransactions.slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-semibold">Recent Transactions</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
              <DialogDescription>
                Enter the details of your transaction below.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Grocery shopping" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isIncome"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">This is income</FormLabel>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createTransaction.isPending}>
                    {createTransaction.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Transaction"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs text-neutral-500 border-b">
              <th className="pb-3 font-medium">DATE</th>
              <th className="pb-3 font-medium">DESCRIPTION</th>
              <th className="pb-3 font-medium">CATEGORY</th>
              <th className="pb-3 font-medium text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-neutral-500">
                  No transactions found. Add a new transaction to get started.
                </td>
              </tr>
            ) : (
              recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-neutral-200 text-sm hover:bg-neutral-50">
                  <td className="py-4 pr-4">
                    {format(new Date(transaction.date), "MMM dd, yyyy")}
                  </td>
                  <td className="py-4 pr-4">{transaction.description}</td>
                  <td className="py-4 pr-4">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${transaction.category?.color}20`,
                        color: transaction.category?.color,
                      }}
                    >
                      {transaction.category?.name}
                    </span>
                  </td>
                  <td className={`py-4 text-right ${transaction.isIncome ? "text-green-600" : "text-red-600"}`}>
                    {transaction.isIncome ? "+" : "-"}${Number(transaction.amount).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {transactions && transactions.length > 5 && (
        <div className="mt-6 flex justify-center">
          <Button variant="ghost" className="text-sm text-primary font-medium flex items-center">
            View all transactions
          </Button>
        </div>
      )}
    </div>
  );
}
