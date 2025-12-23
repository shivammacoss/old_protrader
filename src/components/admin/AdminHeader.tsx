"use client";

import { Bell, Moon, User, Settings, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  if (pathname === '/admin/login') return null;
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Logged out successfully");
        router.push("/admin/login");
        router.refresh();
      } else {
        toast.error(data.message || "Failed to logout");
      }
    } catch (error) {
      toast.error("An error occurred during logout");
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-14 bg-[#1a1025] border-b border-[#2a2035] flex items-center justify-end px-6 shrink-0">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-xl text-white/60 hover:text-white hover:bg-purple-600/10"
        >
          <Bell className="w-4 h-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-xl text-white/60 hover:text-white hover:bg-purple-600/10"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-xl text-white/60 hover:text-white hover:bg-purple-600/10"
        >
          <User className="w-4 h-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-xl text-white/60 hover:text-white hover:bg-purple-600/10"
        >
          <Settings className="w-4 h-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-500/10"
          onClick={handleLogout}
          disabled={loading}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

