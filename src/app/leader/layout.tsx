"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  LogOut,
  Menu,
  User,
  ChevronRight,
} from "lucide-react";
import { leaderAuthApi } from "@/lib/leader/leaderApi";

interface LeaderUser {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  phoneNumber?: string;
  avatar?: string;
  status?: string;
}

const navItems = [
  { name: "Dashboard", href: "/leader/dashboard", icon: LayoutDashboard },
  { name: "Tour của tôi", href: "/leader/tours", icon: Calendar },
  { name: "Chat nhóm", href: "/leader/chat", icon: MessageSquare },
];

export default function LeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [leader, setLeader] = useState<LeaderUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra auth
  useEffect(() => {
    if (pathname === "/leader/login") {
      setIsLoading(false);
      return;
    }

    const checkAuth = () => {
      const isAuth = leaderAuthApi.isAuthenticated();
      if (!isAuth) {
        router.push("/leader/login");
        return;
      }

      const storedLeader = leaderAuthApi.getStoredLeader();
      setLeader(storedLeader);
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  const handleLogout = () => {
    leaderAuthApi.logout();
    router.push("/leader/login");
  };

  const isActive = (path: string) => {
    if (path === "/leader/dashboard") {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  if (pathname === "/leader/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-950 to-blue-900 border-b border-blue-800/50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <h1 className="font-bold text-xl text-white">Leader Portal</h1>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dark Blue Gradient như Admin */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64
          bg-gradient-to-b from-blue-950 to-blue-900
          transform transition-transform duration-300 lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar Header - Logo */}
        <div className="px-6 py-5 border-b border-blue-800/50">
          <Link href="/leader/dashboard" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="AHH Travel"
              width={140}
              height={45}
              className="brightness-0 invert"
            />
          </Link>
        </div>

        {/* Leader Profile Badge */}
        {leader && (
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden">
                {leader.avatar ? (
                  <img
                    src={leader.avatar}
                    alt={leader.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  leader.fullName?.charAt(0)?.toUpperCase() || "L"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {leader.fullName}
                </p>
                <p className="text-xs text-blue-300">Tour Leader</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          <div className="px-4 py-2 text-[10px] font-bold text-blue-400/70 uppercase tracking-wider">
            ĐIỀU HƯỚNG
          </div>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 transition-all duration-200 ${
                      active ? "text-white" : "text-blue-300 group-hover:text-orange-400"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                  </span>
                  <span className="flex-1">{item.name}</span>
                  {active && (
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-blue-800/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium text-blue-200 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
