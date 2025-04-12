import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Footer } from "@/components/layout/footer";
import { Loader2, Plus, Calendar } from "lucide-react";
import { DealWithUser } from "@shared/types";
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
import { format } from "date-fns";

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

export default function Deals() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">Student Deals & Discounts</h1>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
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
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-heading font-semibold mb-6">Available Deals</h2>
              
              {deals?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-4">No deals available yet</p>
                  <Button onClick={() => setIsDialogOpen(true)}>Submit the First Deal</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {deals?.map((deal) => (
                    <div key={deal.id} className="border-b border-neutral-200 pb-6 group">
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
                  ))}
                </div>
              )}
              
              {deals && deals.length > 5 && (
                <div className="mt-6 flex justify-center">
                  <Button variant="outline">Load More Deals</Button>
                </div>
              )}
            </div>
            
            {/* Tips for Finding Deals Section */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-heading font-semibold mb-4">Tips for Finding Student Deals</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex">
                    <div className="bg-primary rounded-full p-2 text-white mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Always Ask About Student Discounts</h3>
                      <p className="text-sm text-neutral-600 mt-1">Many places offer student discounts but don't advertise them. Always ask before paying!</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="bg-primary rounded-full p-2 text-white mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Sign Up for Notifications</h3>
                      <p className="text-sm text-neutral-600 mt-1">Subscribe to newsletters from your favorite stores to be notified about student promotions.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex">
                    <div className="bg-primary rounded-full p-2 text-white mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Use Student Discount Apps</h3>
                      <p className="text-sm text-neutral-600 mt-1">Apps like UNiDAYS and Student Beans verify your student status and show available discounts.</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="bg-primary rounded-full p-2 text-white mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Share With Friends</h3>
                      <p className="text-sm text-neutral-600 mt-1">When you find a good deal, share it with other students and check this community board regularly!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
