import { useQuery, useMutation } from "@tanstack/react-query";
import { TopicWithUser } from "@shared/types";
import { ThumbsUp, Eye, MessageCircle, Loader2, Plus } from "lucide-react";
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
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

// Form validation schema
const topicSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

type TopicFormValues = z.infer<typeof topicSchema>;

type ForumTopicsProps = {
  limit?: number;
  showViewAll?: boolean;
};

export function ForumTopics({ limit = 10, showViewAll = false }: ForumTopicsProps) {
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
      <div className="bg-white rounded-lg shadow-md p-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayTopics = topics ? topics.slice(0, limit) : [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-heading font-semibold mb-6">Community Forum</h2>
      
      <div className="space-y-4">
        {displayTopics.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">
            No forum topics yet. Be the first to start a discussion!
          </div>
        ) : (
          displayTopics.map((topic) => (
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
          ))
        )}
      </div>
      
      <div className="mt-6 flex justify-between">
        {showViewAll && topics && topics.length > 0 && (
          <Link href="/community">
            <Button variant="ghost" className="text-sm text-primary font-medium">
              View all discussions
            </Button>
          </Link>
        )}
        
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
    </div>
  );
}
