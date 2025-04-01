import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Transaction, extendedTransactionSchema } from "@shared/schema";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

type TransactionFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
};

type FormData = {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  notes?: string;
  categoryId?: number;
};

export default function TransactionForm({ open, onOpenChange, transaction }: TransactionFormProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Load categories for the dropdown
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Setup form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(extendedTransactionSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: "expense",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      categoryId: undefined
    }
  });

  // Set form values when editing an existing transaction
  useEffect(() => {
    if (transaction) {
      setIsEditing(true);
      
      form.reset({
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type as 'income' | 'expense',
        date: transaction.date ? format(new Date(transaction.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        notes: transaction.notes || "",
        categoryId: transaction.categoryId || undefined
      });
    } else {
      setIsEditing(false);
      form.reset({
        description: "",
        amount: 0,
        type: "expense",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        categoryId: undefined
      });
    }
  }, [transaction, form]);

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/transactions", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction created",
        description: "Your transaction has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create transaction",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; formData: FormData }) => {
      const res = await apiRequest("PUT", `/api/transactions/${data.id}`, data.formData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction updated",
        description: "Your transaction has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to update transaction",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: FormData) => {
    if (isEditing && transaction) {
      updateMutation.mutate({
        id: transaction.id,
        formData: data
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Filter categories based on transaction type
  const filteredCategories = categories?.filter(
    category => form.watch("type") === category.type
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Grocery Shopping" {...field} />
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
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                    defaultValue={field.value?.toString()}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No Category</SelectItem>
                      {filteredCategories.map(category => (
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  isEditing ? "Update" : "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
