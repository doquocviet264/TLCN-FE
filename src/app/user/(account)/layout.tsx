// src/app/user/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "#/stores/auth";
import { authApi } from "@/lib/auth/authApi"; // Đảm bảo đường dẫn này đúng
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  CreditCard,
  Settings,
  List,
  RefreshCcw,
  Bell,
  Users,
  LogOut,
  Star,
  Wallet,
  Ticket,
  Award,
  Heart,
} from "lucide-react"; // Dùng icon của lucide-react

// Kiểu dữ liệu
type UserProfile = {
  fullName: string;
  avatar: string;
  email: string;
  // Thêm các trường khác nếu cần
};

// Component Sidebar (Menu bên trái)
function UserSidebar({ user }: { user: UserProfile | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const router = useRouter();
  const resetAuth = useAuthStore((s) => s.resetAuth);

  const handleLogout = () => {
    resetAuth();
    // TODO: Gọi API logout
    router.push("/auth/login");
  };

  // Các link trong sidebar
  const navItems = [
    { name: "Đặt chỗ của tôi", href: "/user/history", icon: List },
    { name: "Mã giảm giá", href: "/user/vouchers", icon: Ticket },
    { name: "Đánh giá của tôi", href: "/user/reviews", icon: Star },
    { name: "Tour yêu thích", href: "/user/favorites", icon: Heart },
    { name: "Điểm tích lũy", href: "/user/score", icon: Award },
    { name: "Thông tin hành khách", href: "/user/passengers", icon: Users },
    { name: "Cài đặt thông báo", href: "/user/notifications", icon: Bell },
    { name: "Tài khoản", href: "/user/profile", icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white shadow-sm">
      <div className="p-4 flex items-center gap-3 border-b border-gray-200">
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 flex-shrink-0">
          <Image
            src={user?.avatar || "/Image.svg"}
            alt="Avatar"
            width={44}
            height={44}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">
            {user?.fullName || "User"}
          </h4>
         {/* <span className="text-sm text-gray-500">Facebook</span> */}
        </div>
      </div>

      {/* Thẻ thành viên */}
      <div className="p-4">
        
      </div>

      {/* Menu Navigation */}
      <nav className="flex flex-col p-4 space-y-1">
        {navItems.map((item) => {
          let isActive = false;
          if (item.href.includes("?tab=")) {
            const tabName = item.href.split("?tab=")[1];
            isActive = pathname === "/user/profile" && currentTab === tabName;
          } else if (item.href === "/user/profile") {
            isActive = pathname === "/user/profile" && currentTab !== "favorites";
          } else {
            isActive = pathname === item.href;
          }
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 transition-colors duration-150 ${
                isActive
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              <item.icon
                size={18}
                className={isActive ? "text-blue-700" : "text-gray-500"}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Nút Đăng xuất */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 mt-4"
        >
          <LogOut size={18} className="text-gray-500" />
          <span>Đăng xuất</span>
        </button>
      </nav>
    </aside>
  );
}

// Layout chính
export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); // Chống lỗi hydration
  const accessToken = useAuthStore((s) => s.token.accessToken);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Đợi mounted

    if (!accessToken) {
      router.push("/auth/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const userData = await authApi.getProfile(accessToken);
        setUser(userData);
      } catch (error) {
        console.error("Lỗi tải profile cho layout:", error);
        router.push("/auth/login"); // Token hỏng
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [mounted, accessToken, router]);

  if (!mounted || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UserSidebar user={user} />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
