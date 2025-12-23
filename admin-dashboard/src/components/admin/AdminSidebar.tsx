"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Wallet, 
  Users2, 
  CreditCard, 
  Copy,
  Shield,
  Building2,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  children?: { title: string; path: string }[];
}

const menuItems: MenuItem[] = [
  {
    title: "Overview Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: "/",
  },
  {
    title: "User Management",
    icon: <Users className="w-5 h-5" />,
    path: "/users",
    children: [
      { title: "All Users", path: "/users" },
      { title: "Active Users", path: "/users/active" },
      { title: "Inactive Users", path: "/users/inactive" },
      { title: "User Roles", path: "/users/roles" },
      { title: "User Permissions", path: "/users/permissions" },
    ],
  },
  {
    title: "Trade Management",
    icon: <TrendingUp className="w-5 h-5" />,
    path: "/trades",
    children: [
      { title: "All Trades", path: "/trades" },
      { title: "Open Positions", path: "/trades/open" },
      { title: "Closed Positions", path: "/trades/closed" },
      { title: "Pending Orders", path: "/trades/pending" },
      { title: "Trade History", path: "/trades/history" },
      { title: "Trade Analytics", path: "/trades/analytics" },
    ],
  },
  {
    title: "Fund Management",
    icon: <Wallet className="w-5 h-5" />,
    path: "/funds",
    children: [
      { title: "Deposits", path: "/funds" },
      { title: "Withdrawals", path: "/funds/withdrawals" },
      { title: "Transactions", path: "/funds/transactions" },
      { title: "Fund Requests", path: "/funds/requests" },
      { title: "Balance Management", path: "/funds/balance" },
      { title: "Bank", path: "/funds/bank" },
    ],
  },
  {
    title: "IB Management",
    icon: <Users2 className="w-5 h-5" />,
    path: "/ib",
    children: [
      { title: "IB Overview", path: "/ib" },
      { title: "IB Accounts", path: "/ib/accounts" },
      { title: "Commissions", path: "/ib/commissions" },
      { title: "Performance", path: "/ib/performance" },
      { title: "Tier Management", path: "/ib/tiers" },
    ],
  },
  {
    title: "Charges Management",
    icon: <CreditCard className="w-5 h-5" />,
    path: "/charges",
    children: [
      { title: "Fee Structure", path: "/charges" },
      { title: "Spread Management", path: "/charges/spreads" },
      { title: "Commission Rates", path: "/charges/commissions" },
      { title: "Swap Rates", path: "/charges/swaps" },
      { title: "Charge History", path: "/charges/history" },
    ],
  },
  {
    title: "Copy Trade Management",
    icon: <Copy className="w-5 h-5" />,
    path: "/copy-trade",
    children: [
      { title: "Copy Trade Overview", path: "/copy-trade" },
      { title: "Masters", path: "/copy-trade/masters" },
      { title: "Followers", path: "/copy-trade/followers" },
      { title: "Performance", path: "/copy-trade/performance" },
      { title: "Settings", path: "/copy-trade/settings" },
    ],
  },
  {
    title: "Admin Management",
    icon: <Shield className="w-5 h-5" />,
    path: "/admin",
    children: [
      { title: "All Admins", path: "/admin" },
      { title: "Admin Roles", path: "/admin/roles" },
      { title: "Permissions", path: "/admin/permissions" },
      { title: "Activity Log", path: "/admin/activity" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openItems, setOpenItems] = useState<string[]>(() => {
    // Open the menu item that matches current path
    const currentItem = menuItems.find(
      (item) => item.children && item.children.some((child) => child.path === pathname)
    );
    return currentItem ? [currentItem.path] : [];
  });

  const toggleItem = (path: string) => {
    setOpenItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const isChildActive = (children: { path: string }[]) => {
    return children.some((child) => pathname === child.path);
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">Admin Panel</h1>
            <p className="text-xs text-sidebar-foreground/70">Management Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openItems.includes(item.path);
            const active = isActive(item.path);
            const childActive = hasChildren && isChildActive(item.children!);

            if (hasChildren) {
              return (
                <li key={item.path}>
                  <Collapsible open={isOpen} onOpenChange={() => toggleItem(item.path)}>
                    <CollapsibleTrigger
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/70",
                        (active || childActive) && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-8 pt-1 space-y-1">
                      {item.children!.map((child) => (
                        <button
                          key={child.path}
                          onClick={() => router.push(child.path)}
                          className={cn(
                            "w-full flex items-center px-3 py-2 rounded-md text-sm transition-colors text-left",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/70",
                            pathname === child.path && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          )}
                        >
                          {child.title}
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              );
            }

            return (
              <li key={item.path}>
                <button
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/70",
                    active && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

