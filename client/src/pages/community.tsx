import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { Footer } from "@/components/layout/footer";
import { Loader2, Plus, ThumbsUp, Eye, MessageCircle } from "lucide-react";
import { TopicWithUser } from "@shared/types";
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
import { formatDistanceToNow } from "date-fns";

// Form validation schema
const topicSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

type TopicFormValues = z.infer<typeof topicSchema>;

export default function Community() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: topics, isLoading } = useQuery<TopicWithUser[]>({
    queryKey: ["/api/forum"],
  });

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const createTopic = useMutation({
    mutationFn: async (data: TopicFormValues) => {
      const res = await apiRequest("POST", "/api/forum", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum"] });
      toast({
        title: "Topic created",
        description: "Your topic has been successfully posted",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating topic",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TopicFormValues) => {
    createTopic.mutate(data);
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
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">Community Forum</h1>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Topic
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Start a New Topic</DialogTitle>
                    <DialogDescription>
                      Share your financial question or tip with other students.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic Title</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., How to save money on textbooks?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Share your thoughts, questions, or tips..." 
                                rows={5}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="submit" disabled={createTopic.isPending}>
                          {createTopic.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            "Post Topic"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-heading font-semibold mb-6">Popular Discussions</h2>
              
              {topics?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500 mb-4">No forum topics yet</p>
                  <Button onClick={() => setIsDialogOpen(true)}>Start the First Discussion</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {topics?.map((topic) => (
                    <div key={topic.id} className="border-b border-neutral-200 pb-4">
                      <h3 className="font-medium text-primary hover:underline cursor-pointer">
                        {topic.title}
                      </h3>
                      <div className="text-sm text-neutral-500 mt-1">
                        Started by {topic.user?.fullName || topic.user?.username} · {topic.replyCount} replies · {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
                      </div>
                      <p className="text-sm mt-2 line-clamp-2">{topic.content}</p>
                      <div className="mt-3 flex items-center text-xs text-neutral-500">
                        <span className="flex items-center mr-4">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {topic.likes}
                        </span>
                        <span className="flex items-center mr-4">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {topic.replyCount}
                        </span>
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {topic.views}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {topics && topics.length > 10 && (
                <div className="mt-6 flex justify-center">
                  <Button variant="outline">Load More Discussions</Button>
                </div>
              )}
            </div>
            
            {/* Community Guidelines Section */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-heading font-semibold mb-4">Community Guidelines</h2>
              
              <div className="prose prose-sm max-w-none">
                <p>Welcome to the SmartSpend Community Forum! To keep our community helpful and friendly, please follow these guidelines:</p>
                
                <ol className="mt-4 space-y-2">
                  <li><strong>Be respectful</strong> - Treat others with respect and kindness, even in disagreement.</li>
                  <li><strong>Stay on topic</strong> - Keep discussions focused on financial topics relevant to international students.</li>
                  <li><strong>No promotion</strong> - Don't post promotional content or spam.</li>
                  <li><strong>Protect privacy</strong> - Don't share personal financial information that could identify you.</li>
                  <li><strong>Verify information</strong> - If sharing financial advice, provide sources when possible.</li>
                </ol>
                
                <p className="mt-4">By participating in our community forum, you're helping create a valuable resource for international students managing their finances!</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
