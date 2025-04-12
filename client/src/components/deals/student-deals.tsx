import { useQuery, useMutation } from "@tanstack/react-query";
import { DealWithUser } from "@shared/types";
import { Calendar, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { Link } from "wouter";

// Form validation schema
const dealSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  company: z.string().min(1, "Company name is required"),
  validUntil: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
});

type DealFormValues = z.infer<typeof dealSchema>;

type StudentDealsProps = {
  limit?: number;
  showViewAll?: boolean;
};

export function StudentDeals({ limit = 3, showViewAll = false }: StudentDealsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: deals, isLoading } = useQuery<DealWithUser[]>({
    queryKey: ["/api/deals"],
  });

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      description: "",
      company: "",
      validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 30 days from now
    },
  });

  const createDeal = useMutation({
    mutationFn: async (data: DealFormValues) => {
      const res = await apiRequest("POST", "/api/deals", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Deal created",
        description: "Your deal has been successfully added",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating deal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DealFormValues) => {
    createDeal.mutate(data);
  };
  
  // Generate a simple color from company name for the icon
  const getCompanyColor = (company: string) => {
    const colors = [
      "#1976D2", // primary
      "#00897B", // secondary
      "#FFC107", // accent
      "#9C27B0", // purple
      "#FF5722", // deep orange
      "#607D8B", // blue grey
    ];
    
    // Get a consistent color based on company name
    const sumChars = company.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[sumChars % colors.length];
  };
  
  // Get company initials for the icon
  const getCompanyInitials = (company: string) => {
    return company
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayDeals = deals ? deals.slice(0, limit) : [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-heading font-semibold mb-6">Student Deals & Discounts</h2>
      
      <div className="space-y-4">
        {displayDeals.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">
            No deals available yet. Be the first to share a student deal!
          </div>
        ) : (
          displayDeals.map((deal) => (
            <div key={deal.id} className="border-b border-neutral-200 pb-4 group">
              <div className="flex items-center">
                <div 
                  className="bg-neutral-100 p-2 rounded-lg mr-4 w-12 h-12 flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${getCompanyColor(deal.company)}10` }}
                >
                  <div 
                    className="font-bold text-xl"
                    style={{ color: getCompanyColor(deal.company) }}
                  >
                    {getCompanyInitials(deal.company)}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium group-hover:text-primary">{deal.title}</h3>
                  <p className="text-sm text-neutral-500">
                    <span className="inline-flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Valid until {format(new Date(deal.validUntil), "MMMM d, yyyy")}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-2 ml-16">
                <p className="text-sm">{deal.description}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-neutral-500">
                    Added by {deal.user ? deal.user.fullName || deal.user.username : 'Admin'}
                  </span>
                  <Button size="sm" variant="secondary" className="text-xs px-3 py-1 rounded-full">
                    View Deal
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-6 flex justify-between">
        {showViewAll && deals && deals.length > 0 && (
          <Link href="/deals">
            <Button variant="ghost" className="text-sm text-primary font-medium">
              View all deals
            </Button>
          </Link>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Plus className="h-4 w-4 mr-2" />
              Submit a Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit a New Deal</DialogTitle>
              <DialogDescription>
                Share a student discount or deal you've found with the community.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., 20% off for students at Store Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of the company offering the deal" {...field} />
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
                        <Textarea 
                          placeholder="Provide details about the deal and how to claim it..." 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createDeal.isPending}>
                    {createDeal.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Deal"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
