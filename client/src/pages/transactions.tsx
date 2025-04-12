
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Footer } from "@/components/layout/footer";
import { Loader2, Plus, Filter, Search } from "lucide-react";
import { TransactionWithCategory } from "@shared/types";
import { format } from "date-fns";
import { Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format as formatDate } from "date-fns";

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
  isIncome: z.boolean().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function Transactions() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
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
      date: formatDate(new Date(), "yyyy-MM-dd"),
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

  // Filter and sort transactions
  const filteredTransactions = transactions
    ? transactions
        .filter((transaction) => {
          // Search filter
          const matchesSearch =
            searchQuery === "" ||
            transaction.description.toLowerCase().includes(searchQuery.toLowerCase());

          // Category filter
          const matchesCategory =
            categoryFilter === "all" || transaction.categoryId === parseInt(categoryFilter);

          // Type filter
          const matchesType =
            typeFilter === "all" ||
            (typeFilter === "income" && transaction.isIncome) ||
            (typeFilter === "expense" && !transaction.isIncome);

          return matchesSearch && matchesCategory && matchesType;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  if (isLoadingTransactions || isLoadingCategories) {
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
        <div className="bg-dashboard py-8 relative">
          <div className="container mx-auto px-4 relative z-1">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">
                Transactions
              </h1>

              <div className="flex gap-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
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

                <Button variant="outline" onClick={() => document.getElementById('csvInput')?.click()}>
                  <input
                    id="csvInput"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const base64Data = (reader.result as string).split(',')[1];
                          try {
                            const res = await fetch('/api/transactions/upload-csv', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ csvData: base64Data }),
                            });
                            if (!res.ok) throw new Error('Upload failed');
                            toast({
                              title: "Success",
                              description: "CSV file uploaded successfully",
                            });
                            queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to upload CSV file",
                              variant: "destructive",
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  Upload CSV
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Filters Row */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transactions Table */}
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
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-neutral-500">
                          No transactions found. Add a new transaction to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
