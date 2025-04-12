import { Link, useLocation } from "wouter";

export function MobileMenu() {
  const [location] = useLocation();
  
  // Navigation items
  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/transactions", label: "Transactions" },
    { path: "/budget", label: "Budget" },
    { path: "/community", label: "Community" },
    { path: "/deals", label: "Deals" },
  ];

  return (
    <div className="md:hidden bg-white shadow-lg absolute top-16 inset-x-0 z-20 p-4">
      <nav className="flex flex-col space-y-4">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a
              className={`
                py-2 px-4 rounded hover:bg-neutral-50
                ${location === item.path 
                  ? "text-primary font-medium" 
                  : "text-neutral-500 hover:text-primary"}
              `}
            >
              {item.label}
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
}
