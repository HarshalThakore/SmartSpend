import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Category } from "@shared/schema";
import CategoryForm from "@/components/category-form";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function CategoriesPage() {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsAddingCategory(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await apiRequest("DELETE", `/api/categories/${categoryId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category deleted",
        description: "The category has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Failed to delete category",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Group categories by type
  const expenseCategories = categories?.filter(cat => cat.type === 'expense') || [];
  const incomeCategories = categories?.filter(cat => cat.type === 'income') || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Categories Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your transaction categories
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex">
                <Button onClick={() => {
                  setEditingCategory(null);
                  setIsAddingCategory(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <h2 className="text-xl font-medium text-gray-900 mb-4">Expense Categories</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : expenseCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {expenseCategories.map(category => (
              <Card key={category.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <span className="material-icons text-primary text-sm">{category.icon}</span>
                      </div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{category.name}</h3>
                    </div>
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="material-icons text-sm">edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-gray-400 hover:text-destructive"
                          >
                            <span className="material-icons text-sm">delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the category "{category.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No expense categories yet. Add your first category to get started!</p>
            </CardContent>
          </Card>
        )}

        {/* Income Categories */}
        <h2 className="text-xl font-medium text-gray-900 mb-4">Income Categories</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : incomeCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {incomeCategories.map(category => (
              <Card key={category.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-2 mr-3">
                        <span className="material-icons text-secondary text-sm">{category.icon}</span>
                      </div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">{category.name}</h3>
                    </div>
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="material-icons text-sm">edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-gray-400 hover:text-destructive"
                          >
                            <span className="material-icons text-sm">delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the category "{category.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No income categories yet. Add your first category to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>

      <CategoryForm 
        open={isAddingCategory} 
        onOpenChange={setIsAddingCategory}
        category={editingCategory}
      />
    </div>
  );
}
