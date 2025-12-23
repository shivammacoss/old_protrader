"use client";

import { Home, BarChart3, Wallet, User, UserPlus, LayoutDashboard, PieChart, Trophy } from "lucide-react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  onOpenInstruments?: () => void;
}

const menuItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BarChart3, label: "Instruments", action: "instruments" },
  { icon: Trophy, label: "Competitions", path: "/competitions" },
  { icon: PieChart, label: "Portfolio", path: "/portfolio" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: UserPlus, label: "Become", path: "/become-ib" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function Sidebar({ onOpenInstruments }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  return (
    <div className="hidden lg:flex w-16 bg-sidebar border-r border-sidebar-border flex-col items-center py-4 shrink-0">
      {/* Logo */}
      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-6">
        <span className="text-primary-foreground font-bold text-lg">PT</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          
          if (item.action === 'instruments') {
            return (
              <button
                key={item.label}
                onClick={onOpenInstruments}
                className="w-full py-2 flex flex-col items-center gap-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.path!}
              className={`w-full py-2 flex flex-col items-center gap-1 rounded-lg transition-colors ${
                active 
                  ? 'text-foreground bg-sidebar-accent' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Logo */}
      <div className="mt-auto pt-4">
        <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
          <span className="text-background font-bold text-sm">N</span>
        </div>
      </div>
    </div>
  );
}
