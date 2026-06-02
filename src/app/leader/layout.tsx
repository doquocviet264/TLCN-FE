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
  X,
  ChevronRight,
  MapPin,
  ChevronLeft,
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
  {
    name: "Dashboard",
    href: "/leader/dashboard",
    icon: LayoutDashboard,
    description: "Tổng quan hoạt động",
  },
  {
    name: "Tour của tôi",
    href: "/leader/tours",
    icon: Calendar,
    description: "Quản lý lịch trình",
  },
  {
    name: "Chat nhóm",
    href: "/leader/chat",
    icon: MessageSquare,
    description: "Liên lạc với khách",
  },
];

export default function LeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [leader, setLeader] = useState<LeaderUser | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/leader/login") {
      setIsLoading(false);
      return;
    }
    const isAuth = leaderAuthApi.isAuthenticated();
    if (!isAuth) {
      router.push("/leader/login");
      return;
    }
    const storedLeader = leaderAuthApi.getStoredLeader();
    setLeader(storedLeader);
    setIsLoading(false);
  }, [pathname, router]);

  const handleLogout = () => {
    leaderAuthApi.logout();
    router.push("/leader/login");
  };

  const isActive = (path: string) => {
    if (path === "/leader/dashboard") return pathname === path;
    return pathname?.startsWith(path);
  };

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(-2)
      .join("")
      .toUpperCase() || "L";

  if (pathname === "/leader/login") return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
          </div>
          <p className="text-slate-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  const sidebarW = isSidebarCollapsed ? "w-[72px]" : "w-64";
  const mlClass  = isSidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64";

  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full ${sidebarW}
          flex flex-col
          bg-gradient-to-b from-blue-950 via-blue-950 to-slate-900
          shadow-xl
          transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className={`relative border-b border-blue-800/40 flex items-center
          ${isSidebarCollapsed ? "px-4 py-4 justify-center" : "px-6 py-4"}`}>
          <Link href="/leader/dashboard">
            {isSidebarCollapsed ? (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600
                flex items-center justify-center shadow-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Image src="/logo.png" alt="AHH Travel" width={130} height={42}
                className="brightness-0 invert" />
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2
              w-6 h-6 rounded-full bg-slate-700 border border-blue-700/50
              items-center justify-center text-blue-300 hover:text-white
              hover:bg-blue-700 transition-all shadow-md z-10"
          >
            {isSidebarCollapsed
              ? <ChevronRight className="w-3 h-3" />
              : <ChevronLeft className="w-3 h-3" />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2
              p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile */}
        {leader && (
          <div className={`${isSidebarCollapsed ? "px-2 py-3" : "px-4 py-3"}`}>
            <div className={`flex items-center rounded-xl bg-white/5 border border-white/10
              ${isSidebarCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"}`}>
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600
                  flex items-center justify-center text-white font-bold text-sm
                  shadow-md overflow-hidden">
                  {leader.avatar
                    ? <img src={leader.avatar} alt="" className="w-full h-full object-cover" />
                    : <span>{getInitials(leader.fullName)}</span>}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full
                  bg-emerald-400 border-2 border-blue-950" />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{leader.fullName}</p>
                  <p className="text-xs text-emerald-400 font-medium">Tour Leader</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {!isSidebarCollapsed && (
            <p className="px-3 py-2 text-[10px] font-bold text-blue-400/60 uppercase tracking-widest">
              Điều hướng
            </p>
          )}
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileSidebarOpen(false)}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`group flex items-center rounded-xl transition-all duration-200
                  ${isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-2.5"}
                  ${active
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"}`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors
                  ${active ? "text-white" : "text-blue-300 group-hover:text-orange-400"}`} />
                {!isSidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-medium">{item.name}</span>
                      {!active && (
                        <span className="block text-[10px] text-blue-400/50">{item.description}</span>
                      )}
                    </div>
                    {active && <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t border-blue-800/40 ${isSidebarCollapsed ? "px-2 py-3" : "px-4 py-4"}`}>
          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? "Đăng xuất" : undefined}
            className={`w-full flex items-center rounded-xl bg-white/5 border border-white/10
              text-sm font-medium text-blue-200 transition-all
              hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30 group
              ${isSidebarCollapsed ? "justify-center p-3" : "gap-2 px-4 py-2.5"}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {!isSidebarCollapsed && <span>Đăng xuất</span>}
          </button>
          {!isSidebarCollapsed && (
            <p className="text-center text-[10px] text-blue-500/40 mt-3">Leader Portal v1.0</p>
          )}
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${mlClass}`}>

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/leader/dashboard">
              <Image src="/logo.png" alt="AHH Travel" width={100} height={32}
                className="h-8 w-auto" />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600
              flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">
                {leader ? getInitials(leader.fullName) : "L"}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
