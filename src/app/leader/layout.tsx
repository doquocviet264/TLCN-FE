"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Map,
  Calendar,
  LogOut,
  Menu,
  X,
  User,
  DollarSign,
  Clock,
  MessageSquare,
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
  { name: "Dashboard", href: "/leader/dashboard", icon: Home },
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
    // Bỏ qua kiểm tra nếu đang ở trang login
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

  // Nếu đang ở trang login, chỉ render children
  if (pathname === "/leader/login") {
    return <>{children}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="font-bold text-lg text-emerald-600">Leader Portal</h1>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800">Leader Portal</h2>
              <p className="text-xs text-slate-500">AHH Travel</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Leader Info */}
        {leader && (
          <div className="p-4 mx-4 mt-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center">
                {leader.avatar ? (
                  <img
                    src={leader.avatar}
                    alt={leader.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">
                  {leader.fullName}
                </p>
                <p className="text-xs text-slate-500 truncate">{leader.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "text-slate-600 hover:bg-slate-100"
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">{children}</main>
    </div>
  );
}
