import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Footer } from "@/components/layout/footer";
import { Loader2, Plus, PieChart, BarChart } from "lucide-react";
import { BudgetWithCategory } from "@shared/types";
import { Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// Form validation schema
const budgetSchema = z.object({
  categoryId: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Please select a category",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  period: z.string().min(1, "Please select a period"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export default function Budget() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const { toast } = useToast();

  const { data: budgets, isLoading: isLoadingBudgets } = useQuery<BudgetWithCategory[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      period: "monthly",
    },
  });

  const createBudget = useMutation({
    mutationFn: async (data: BudgetFormValues) => {
      const transformedData = {
        ...data,
        amount: parseFloat(data.amount),
        categoryId: parseInt(data.categoryId),
      };
      const res = await apiRequest("POST", "/api/budgets", transformedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Budget created",
        description: "Your budget has been successfully added",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating budget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BudgetFormValues) => {
    createBudget.mutate(data);
  };

  // Prepare data for charts
  const chartData = budgets
    ? budgets.map((budget) => ({
        name: budget.category?.name,
        value: Number(budget.amount),
        spent: budget.spent,
        remaining: Number(budget.amount) - budget.spent,
        color: budget.category?.color,
      }))
    : [];

  if (isLoadingBudgets || isLoadingCategories) {
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
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">Budget Management</h1>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Budget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Budget</DialogTitle>
                    <DialogDescription>
                      Set a budget limit for a specific category.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                {categories
                                  ?.filter(category => category.type !== "income")
                                  .map((category) => (
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
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0.00" step="0.01" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Period</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a period" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit" disabled={createBudget.isPending}>
                          {createBudget.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Budget"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Budget Overview Card */}
              <div className="bg-white rounded-lg shadow-md p-6 col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-heading font-semibold">Budget Overview</h2>
                  <div className="flex space-x-2">
                    <Button
                      variant={chartType === "pie" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("pie")}
                    >
                      <PieChart className="h-4 w-4 mr-2" />
                      Pie
                    </Button>
                    <Button
                      variant={chartType === "bar" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType("bar")}
                    >
                      <BarChart className="h-4 w-4 mr-2" />
                      Bar
                    </Button>
                  </div>
                </div>
                
                {budgets?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-neutral-500 mb-4">No budgets created yet</p>
                    <Button onClick={() => setIsDialogOpen(true)}>Create Your First Budget</Button>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "pie" ? (
                        <RechartsPieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `$${value}`} />
                          <Legend />
                        </RechartsPieChart>
                      ) : (
                        <RechartsBarChart
                          data={chartData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `$${value}`} />
                          <Legend />
                          <Bar dataKey="spent" name="Spent" stackId="a" fill="#1976D2" />
                          <Bar dataKey="remaining" name="Remaining" stackId="a" fill="#4CAF50" />
                        </RechartsBarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              
              {/* Budget Summary Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-heading font-semibold mb-4">Budget Summary</h2>
                
                {budgets?.length === 0 ? (
                  <p className="text-neutral-500">No budgets to summarize</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-neutral-500 mb-1">Total Budget</div>
                        <div className="text-2xl font-semibold">
                          ${budgets?.reduce((sum, budget) => sum + Number(budget.amount), 0).toFixed(2)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-neutral-500 mb-1">Total Spent</div>
                        <div className="text-2xl font-semibold">
                          ${budgets?.reduce((sum, budget) => sum + budget.spent, 0).toFixed(2)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-neutral-500 mb-1">Remaining</div>
                        <div className="text-2xl font-semibold text-green-600">
                          ${budgets?.reduce((sum, budget) => sum + (Number(budget.amount) - budget.spent), 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <div className="text-sm font-medium mb-2">Overall Budget Health</div>
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        {(() => {
                          const totalBudget = budgets?.reduce((sum, budget) => sum + Number(budget.amount), 0) || 0;
                          const totalSpent = budgets?.reduce((sum, budget) => sum + budget.spent, 0) || 0;
                          const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
                          
                          let color = "#4CAF50"; // Green
                          if (percentage > 90) color = "#F44336"; // Red
                          else if (percentage > 75) color = "#FF9800"; // Yellow
                          
                          return <div className="h-2.5 rounded-full" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}></div>;
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Budget Categories List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-heading font-semibold mb-6">Budget Categories</h2>
              
              {budgets?.length === 0 ? (
                <p className="text-neutral-500 text-center py-6">No budget categories created yet</p>
              ) : (
                <div className="space-y-4">
                  {budgets?.map((budget) => (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <div className="font-medium">{budget.category?.name}</div>
                        <div className="text-neutral-500">
                          <span className="text-primary font-medium">${budget.spent.toFixed(2)}</span> of ${Number(budget.amount).toFixed(2)}
                        </div>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            width: `${Math.min(budget.percentage, 100)}%`,
                            backgroundColor: budget.percentage > 100 ? "#F44336" : budget.percentage > 90 ? "#FF9800" : budget.category?.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
