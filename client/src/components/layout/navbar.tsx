import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user initials for avatar
  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const isActivePage = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-semibold text-primary">FinTrack</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/">
                <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActivePage('/') 
                    ? 'border-primary text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}>
                  Dashboard
                </a>
              </Link>
              <Link href="/transactions">
                <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActivePage('/transactions') 
                    ? 'border-primary text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}>
                  Transactions
                </a>
              </Link>
              <Link href="/categories">
                <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActivePage('/categories') 
                    ? 'border-primary text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}>
                  Categories
                </a>
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full h-8 w-8 p-0" aria-label="User menu">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-white">
                        {user ? getInitials(user.username) : '?'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium">{user?.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              className="inline-flex items-center justify-center rounded-md p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/">
              <a 
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActivePage('/') 
                    ? 'bg-blue-50 border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </a>
            </Link>
            <Link href="/transactions">
              <a 
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActivePage('/transactions') 
                    ? 'bg-blue-50 border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Transactions
              </a>
            </Link>
            <Link href="/categories">
              <a 
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActivePage('/categories') 
                    ? 'bg-blue-50 border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Categories
              </a>
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <Avatar>
                  <AvatarFallback className="bg-primary text-white">
                    {user ? getInitials(user.username) : '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.username}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
