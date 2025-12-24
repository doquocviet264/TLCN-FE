// /components/layout/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  User,
  History,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import NotificationBell from "@/components/NotificationBell";
import { useEffect, useRef, useState } from "react";
import { authApi } from "@/lib/auth/authApi";
import { useAuthStore } from "#/stores/auth";
import { getUserToken, clearAllTokens } from "@/lib/auth/tokenManager";
import { debugTokenAndUser } from "@/lib/auth/tokenDebug";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const accessToken =
    useAuthStore((s) => s.token.accessToken) || getUserToken() || "";
  const user = useAuthStore((s) => s.user);
  const resetAuth = useAuthStore((s) => s.resetAuth);
  const setUserId = useAuthStore((s) => s.setUserId);

  const [mounted, setMounted] = useState(false);
  const isLoggedIn = mounted && !!accessToken;

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("/Image.svg");
  const [memberStatus, setMemberStatus] = useState("Thành viên");
  const [userEmail, setUserEmail] = useState("");
  const [points, setPoints] = useState(0);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Debug: Log token on mount
    debugTokenAndUser.logTokenLoad("Header.useEffect[mount]");
  }, []);

  // Fetch profile khi có token (và khi đổi route – để luôn sync)
  const loadProfile = async (token: string) => {
    debugTokenAndUser.logTokenLoad("Header.loadProfile[start]");
    try {
      const u = await authApi.getProfile(token);
      debugTokenAndUser.logUserProfileLoad("Header.loadProfile[success]", u);
      setFullName(u.fullName || "User");
      setAvatarUrl(u.avatar || "/Image.svg");
      setMemberStatus(u.memberStatus || "Thành viên");
      setUserEmail(u.email || "");
      setPoints(u.points || 0);
      setUserId(u.id);
      debugTokenAndUser.logUserInfoDisplay("Header.loadProfile[display]", {
        fullName: u.fullName,
        email: u.email,
        avatar: u.avatar,
        points: u.points,
        memberStatus: u.memberStatus,
      });
    } catch (e: any) {
      const status = e?.response?.status;
      console.warn("getProfile (Header) failed", status, e?.message);
      debugTokenAndUser.logUserProfileLoad("Header.loadProfile[error]", {
        error: e?.message,
        status: status,
        token: token ? `${token.substring(0, 20)}...` : "null",
      });

      // ❗️Chỉ logout khi token thật sự không hợp lệ
      if (status === 401 || status === 403) {
        resetAuth();
        router.push("/auth/login");
      }
      // Các lỗi khác (network/CORS): không xoá token, chỉ ẩn UI user
    }
  };

  useEffect(() => {
    if (!mounted) return;
    debugTokenAndUser.logAuthStateChange("Header.useEffect[accessToken]", {
      accessToken,
      userId: null,
      isLoggedIn,
    });

    // Nếu có user info trong store thì dùng luôn
    if (user && accessToken) {
      setFullName(user.fullName || "User");
      setAvatarUrl(user.avatar || "/Image.svg");
      setMemberStatus(user.memberStatus || "Thành viên");
      setUserEmail(user.email || "");
      setPoints(user.points || 0);
      setUserId(user.id);
      debugTokenAndUser.logUserInfoDisplay("Header.useEffect[fromStore]", user);
    }
    // Nếu không có user info nhưng có token thì fetch từ API
    else if (accessToken && !user) {
      loadProfile(accessToken);
    } else {
      setFullName("");
      setAvatarUrl("/Image.svg");
      setMemberStatus("Thành viên");
      setUserEmail("");
      setPoints(0);
      setUserId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, accessToken, user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setAvatarOpen(false);
      }
    };

    if (avatarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [avatarOpen]);

  const navItems = [
    { label: "Trang chủ", href: "/" },
    // { label: "Tour", href: "/user/tours" },
    { label: "Điểm đến", href: "/user/destination" },
    { label: "Bài viết", href: "/user/blog" },
    { label: "Hành trình", href: "/user/map" },
    { label: "Giới thiệu", href: "/user/about" },
    { label: "Liên hệ", href: "/user/contact" },
  ];

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname === "/user/home"
      : pathname.startsWith(href);

  const dropdownItems = [
    { name: "Hồ sơ cá nhân", href: "/user/profile", icon: User },
    { name: "Lịch sử đặt tour", href: "/user/history", icon: History },
    { name: "Blog của tôi", href: "/user/blog", icon: BookOpen },
    { name: "Vouchers", href: "/user/vouchers", icon: BookOpen },
  ];

  const handleLogout = () => {
    resetAuth(); // Xóa toàn bộ state + persist
    clearAllTokens(); // Clear tokens from tokenManager
    router.push("/auth/login");
  };

  if (!mounted) return null;

  return (
    <header className="bg-white shadow-sm w-full z-50">
      <div className="max-w-screen-2xl mx-auto px-5 lg:px-14 py-4 flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/Logo.png" alt="Logo" width={140} height={140} />
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex flex-1 justify-center space-x-6 text-base">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition ${
                isActive(item.href)
                  ? "text-[var(--primary)] font-bold"
                  : "text-gray-700 font-medium"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3 ml-auto">
          {!isLoggedIn && (
            <Link href="/auth/login">
              <Button variant="outline-primary">Đăng nhập / Đăng ký</Button>
            </Link>
          )}

          {isLoggedIn && (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              <div
              ref={avatarRef}
              className="relative flex items-center gap-2 cursor-pointer"
              onClick={() => setAvatarOpen((v) => !v)}
            >
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
              <span className="text-gray-800 font-medium text-sm truncate max-w-[120px]">
                {fullName}
              </span>
              <ChevronDown size={16} className="text-gray-500" />

              {avatarOpen && (
                <div className="absolute right-0 top-[110%] w-64 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-4 border-b bg-gray-50">
                    <p className="font-bold text-sm">{fullName}</p>
                    <p className="text-xs text-gray-600 mt-1">{userEmail}</p>
                    <p className="text-xs text-yellow-600 mt-2">
                      ⭐ {points} điểm • Thành viên {memberStatus}
                    </p>
                  </div>

                  <nav className="flex flex-col py-2">
                    {dropdownItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        <item.icon size={18} />
                        {item.name}
                      </Link>
                    ))}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-gray-100 border-t"
                    >
                      <LogOut size={18} /> Đăng xuất
                    </button>
                  </nav>
                </div>
              )}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <nav className="flex flex-col px-5 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-lg transition ${
                  isActive(item.href)
                    ? "bg-[var(--primary)] text-white font-bold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {!isLoggedIn && (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-4 mt-2 rounded-lg bg-[var(--primary)] text-white text-center font-semibold"
              >
                Đăng nhập / Đăng ký
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
