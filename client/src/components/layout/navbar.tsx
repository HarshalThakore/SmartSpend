import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@shared/schema";

type NavbarProps = {
  onMobileMenuToggle: () => void;
};

export function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    enabled: !!user,
  });
  
  const unreadAlerts = alerts ? alerts.filter(alert => !alert.read).length : 0;
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Navigation items
  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/transactions", label: "Transactions" },
    { path: "/budget", label: "Budget" },
    { path: "/community", label: "Community" },
    { path: "/deals", label: "Deals" },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/">
              <a className="text-primary font-heading font-bold text-2xl">
                Smart<span className="text-secondary">Spend</span>
              </a>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a className={
                  location === item.path 
                    ? "text-primary font-medium" 
                    : "text-neutral-500 hover:text-primary"
                }>
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>
          
          {/* User Profile & Notifications */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <div className="relative text-neutral-500 hover:text-primary">
                      <Bell className="h-6 w-6" />
                      {unreadAlerts > 0 && (
                        <Badge className="absolute -top-1 -right-1 bg-error text-white w-4 h-4 p-0 flex items-center justify-center text-xs">
                          {unreadAlerts}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {alerts && alerts.length > 0 ? (
                      <>
                        {alerts.slice(0, 4).map((alert) => (
                          <DropdownMenuItem key={alert.id} className="cursor-pointer">
                            <div className="flex flex-col space-y-1">
                              <span className="font-medium text-sm">
                                {alert.title}
                              </span>
                              <span className="text-xs text-neutral-500 line-clamp-2">
                                {alert.message}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-primary text-sm">
                          View all notifications
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <div className="py-2 px-2 text-sm text-center text-neutral-500">
                        No notifications
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none flex items-center">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-2 hidden md:block text-sm font-medium text-neutral-800">
                        {user.fullName}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-1 text-neutral-500" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden focus:outline-none"
              onClick={onMobileMenuToggle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
