"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminStore } from "#/stores/admin";
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  Users,
  FileText,
  Star,
  Gift,
  UserCog,
  MessageSquare,
  LogOut,
  ChevronRight,
} from "lucide-react";

interface NavLink {
  display: string;
  path: string;
  icon: React.ReactNode;
  category?: string;
}

const navLinks: NavLink[] = [
  // Dashboard
  {
    display: "Dashboard",
    path: "/admin/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    category: "main",
  },

  // Tours Management
  {
    display: "Tours",
    path: "/admin/tours",
    icon: <MapPin className="w-5 h-5" />,
    category: "tours",
  },

  // Bookings
  {
    display: "Đặt tour",
    path: "/admin/bookings",
    icon: <CalendarCheck className="w-5 h-5" />,
    category: "bookings",
  },

  // Users
  {
    display: "Người dùng",
    path: "/admin/users",
    icon: <Users className="w-5 h-5" />,
    category: "users",
  },

  // Content Management
  {
    display: "Blog",
    path: "/admin/blog",
    icon: <FileText className="w-5 h-5" />,
    category: "content",
  },
  {
    display: "Đánh giá",
    path: "/admin/reviews",
    icon: <Star className="w-5 h-5" />,
    category: "content",
  },

  // Vouchers
  {
    display: "Vouchers",
    path: "/admin/vouchers",
    icon: <Gift className="w-5 h-5" />,
    category: "operations",
  },

  // Leaders
  {
    display: "Leader",
    path: "/admin/leaders",
    icon: <UserCog className="w-5 h-5" />,
    category: "operations",
  },
  {
    display: "Chat",
    path: "/admin/chat",
    icon: <MessageSquare className="w-5 h-5" />,
    category: "operations",
  },
];

const SideBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const signOut = useAdminStore((state) => state.signOut);
  const profile = useAdminStore((state) => state.profile);

  const handleLogout = async () => {
    signOut();
    router.push("/admin/login");
  };

  const groupedLinks = navLinks.reduce((acc, link) => {
    const cat = link.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {} as Record<string, NavLink[]>);

  const categoryLabels: Record<string, string> = {
    main: "",
    tours: "QUẢN LÝ TOUR",
    bookings: "ĐẶT TOUR",
    users: "NGƯỜI DÙNG",
    content: "NỘI DUNG",
    catalog: "DANH MỤC",
    operations: "HOẠT ĐỘNG",
  };

  const categoryOrder = [
    "main",
    "tours",
    "bookings",
    "users",
    "content",
    "catalog",
    "operations",
  ];

  const isActive = (path: string) => {
    if (path === "/admin/dashboard") {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-blue-950 to-blue-900">
      {/* Logo Section */}
      <div className="px-6 py-5 border-b border-blue-800/50">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Anh Travel"
            width={140}
            height={45}
            className="brightness-0 invert"
          />
        </Link>
      </div>

      {/* Admin Profile Badge */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg">
            {profile?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {profile?.name || "Admin"}
            </p>
            <p className="text-xs text-blue-300">Quản trị viên</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {categoryOrder.map((category) => {
          const links = groupedLinks[category];
          if (!links) return null;

          return (
            <div key={category} className="mb-4">
              {categoryLabels[category] && (
                <div className="px-4 py-2 text-[10px] font-bold text-blue-400/70 uppercase tracking-wider">
                  {categoryLabels[category]}
                </div>
              )}
              <div className="space-y-0.5">
                {links.map(({ display, path, icon }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      href={path}
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
                        {icon}
                      </span>
                      <span className="flex-1">{display}</span>
                      {active && (
                        <ChevronRight className="w-4 h-4 text-white/70" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-blue-800/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium text-blue-200 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default SideBar;
