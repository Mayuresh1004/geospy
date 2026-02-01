// components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Projects",
      href: "/dashboard",
      icon: FolderKanban,
    },
  ];

  return (
    <div className="w-64 border-r border-white/5 bg-background/95 backdrop-blur-xl flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-brand-500/5 blur-3xl pointer-events-none"></div>

      {/* Logo */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
            <Sparkles className="w-5 h-5 text-brand-500 group-hover:text-white transition-colors" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">GEOspy</h1>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 relative z-10">
        <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">Menu</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-brand-500" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(var(--brand-500),0.5)]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/5 bg-muted/5 relative z-10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-background/50 backdrop-blur-sm">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/20 text-white border border-white/10">
            <span className="text-sm font-bold">
              {user.email?.[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.user_metadata?.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate opacity-70">{user.email}</p>
          </div>
        </div>
        <button className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/20">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}