import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Users, Database, Settings, BarChart } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import type { User as UserType } from "@shared/schema";
import type { SystemSettings } from "@/lib/types";

function UserManagement() {
  const { toast } = useToast();
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users');
      return await res.json();
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User deleted',
        description: 'User has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting user',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {users?.map((user: UserType) => (
        <Card key={user.id}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-medium">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleDeleteUser(user.id)} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DatabaseManagement() {
  const { toast } = useToast();

  const backupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('GET', '/api/admin/database/backup');
      return await res.json();
    },
    onSuccess: (backupData: any) => {
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Backup created',
        description: 'Database backup has been downloaded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Backup failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Management</CardTitle>
        <CardDescription>Backup and restore your database</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => backupMutation.mutate()}>
          Download Backup
        </Button>
      </CardContent>
    </Card>
  );
}

function ReportsSection() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/stats');
      return await res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>User Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          <p className="text-sm text-gray-500">Total Users</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemSettingsSection() {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/settings');
      return await res.json();
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SystemSettings) => {
      await apiRequest('PUT', '/api/admin/settings', data);
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'System settings have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>Manage global system settings</CardDescription>
      </CardHeader>
      <CardContent>
        <pre>{JSON.stringify(settings, null, 2)}</pre>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  if (!user?.isAdmin) {
    setLocation("/");
    toast({
      title: "Access Denied",
      description: "You don't have permission to access this page.",
      variant: "destructive",
    });
    return null;
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseManagement />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsSection />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}