import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Category, extendedCategorySchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Icon options for categories
const iconOptions = [
  { value: "shopping_cart", label: "Shopping Cart" },
  { value: "home", label: "Home" },
  { value: "directions_car", label: "Car" },
  { value: "restaurant", label: "Food" },
  { value: "local_hospital", label: "Healthcare" },
  { value: "school", label: "Education" },
  { value: "flight", label: "Travel" },
  { value: "sports_esports", label: "Entertainment" },
  { value: "payments", label: "Salary" },
  { value: "savings", label: "Savings" },
  { value: "card_giftcard", label: "Gift" },
  { value: "sell", label: "Sales" },
  { value: "attach_money", label: "Income" },
  { value: "account_balance", label: "Investment" },
  { value: "miscellaneous_services", label: "Other" }
];

type CategoryFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
};

type FormData = {
  name: string;
  type: 'income' | 'expense';
  icon: string;
};

export default function CategoryForm({ open, onOpenChange, category }: CategoryFormProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Setup form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(extendedCategorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      icon: "miscellaneous_services"
    }
  });

  // Set form values when editing an existing category
  useEffect(() => {
    if (category) {
      setIsEditing(true);
      form.reset({
        name: category.name,
        type: category.type as 'income' | 'expense',
        icon: category.icon
      });
    } else {
      setIsEditing(false);
      form.reset({
        name: "",
        type: "expense",
        icon: "miscellaneous_services"
      });
    }
  }, [category, form]);

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category created",
        description: "Your category has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create category",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; formData: FormData }) => {
      const res = await apiRequest("PUT", `/api/categories/${data.id}`, data.formData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category updated",
        description: "Your category has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to update category",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: FormData) => {
    if (isEditing && category) {
      updateMutation.mutate({
        id: category.id,
        formData: data
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category type" />
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
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                          <div className="flex items-center">
                            <span className="material-icons text-sm mr-2">{field.value}</span>
                            {iconOptions.find(option => option.value === field.value)?.label || "Select an icon"}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {iconOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            <span className="material-icons text-sm mr-2">{option.value}</span>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
