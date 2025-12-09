"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "#/stores/auth";
import { authApi } from "@/lib/auth/authApi";
import {
  Plus,
  Camera,
  User,
  Lock,
  Mail,
  Phone,
  Save,
  MapPin,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

// URL BE
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

// Types
type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  gender?: string;
  dob?: string;
  city?: string;
  emails?: { email: string; isVerified: boolean; isPrimary: boolean }[];
  phoneNumbers?: { phone: string; isVerified: boolean; isPrimary: boolean }[];
  avatarUrl?: string;
  avatar?: string;
};

// --- Component: Tab Button ---
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
        active
          ? "border-orange-500 text-orange-600 bg-orange-50/50"
          : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// --- 1. Info Tab ---
function InfoTab({ user }: { user: UserProfile }) {
  const [fullName, setFullName] = useState(user.fullName);
  const [gender, setGender] = useState(user.gender || "Male");
  const [city, setCity] = useState(user.city || "");

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (user.dob) {
      const date = new Date(user.dob);
      if (!Number.isNaN(date.getTime())) {
        setDay(String(date.getDate()));
        setMonth(String(date.getMonth() + 1));
        setYear(String(date.getFullYear()));
      }
    }
  }, [user.dob]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dob =
        day && month && year
          ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          : undefined;

      const profileData = { fullName, gender, city, dob };
      void profileData; // Placeholder for API logic
      toast.success("Đã cập nhật thông tin thành công!");
    } catch {
      toast.error("Cập nhật thất bại!");
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
  }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Card: Thông tin cá nhân */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Thông tin cơ bản</h2>
          <p className="text-sm text-slate-500">
            Quản lý tên hiển thị và thông tin cá nhân của bạn.
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Tên đầy đủ */}
              <div className="col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Họ và tên
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
              </div>

              {/* Giới tính */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Giới tính
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all appearance-none"
                >
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              {/* Thành phố */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Thành phố
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="VD: Hồ Chí Minh"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
              </div>

              {/* Ngày sinh */}
              <div className="col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ngày sinh
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                    >
                      <option value="">Ngày</option>
                      {days.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                    >
                      <option value="">Tháng</option>
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                    >
                      <option value="">Năm</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-blue-950 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-900 hover:-translate-y-0.5 transition-all"
              >
                <Save size={18} /> Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Card: Thông tin liên hệ (Email & Phone) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Email */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Mail size={16} />
              </div>
              <h3 className="font-bold text-slate-800">Email</h3>
            </div>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              + Thêm
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-sm font-medium text-slate-700">
                {user.email}
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                Chính
              </span>
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Phone size={16} />
              </div>
              <h3 className="font-bold text-slate-800">Số điện thoại</h3>
            </div>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              + Thêm
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="text-sm font-medium text-slate-700">
                {user.phone}
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                Chính
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 2. Password Tab ---
function PasswordTab() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.changePassword(oldPassword, newPassword);
      toast.success("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      console.error(error);
      toast.error("Đổi mật khẩu thất bại!");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Đổi mật khẩu</h2>
          <p className="text-sm text-slate-500">
            Nên sử dụng mật khẩu mạnh để bảo vệ tài khoản.
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleChangePassword} className="max-w-xl space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-800 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Mật khẩu phải có ít nhất 6 ký tự.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-500 hover:-translate-y-0.5 transition-all"
              >
                <Save size={18} /> Cập nhật mật khẩu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function ProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const accessToken = useAuthStore((s) => s.token.accessToken);
  const setAuthUser = useAuthStore((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // load profile
  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await authApi.getProfile(accessToken);
        setUser(userData as UserProfile);
      } catch (error) {
        console.error("Lỗi tải profile:", error);
        toast.error("Không tải được thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [accessToken]);

  // upload avatar to Cloudinary
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      // POST /api/users/me/avatarcloud (Cloudinary Upload)
      const res = await fetch(`${API_BASE}/users/me/avatarcloud`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Upload failed:", errorData);
        toast.error(errorData.message || "Upload avatar thất bại!");
        return;
      }

      const data = await res.json();
      console.log("Avatar response:", data); // Debug log

      // Cloudinary API trả về avatarUrl
      const newAvatarUrl = data.avatarUrl || data.user?.avatar || data.avatar;

      setUser((prev) =>
        prev
          ? {
              ...prev,
              avatarUrl: newAvatarUrl,
              avatar: newAvatarUrl,
            }
          : prev
      );

      // 🔥 Reload profile data từ API để sync toàn bộ (Header sẽ tự cập nhật từ store)
      const updatedUser = await authApi.getProfile(accessToken);
      setAuthUser(updatedUser as any);

      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      console.error("Avatar upload error:", err);
      const message =
        err instanceof Error ? err.message : "Có lỗi khi upload avatar!";
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500"></div>
      </div>
    );
  }

  if (!accessToken || !user) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Bạn chưa đăng nhập</h2>
        <p className="text-slate-500">Vui lòng đăng nhập để xem trang này.</p>
      </div>
    );
  }

  const avatarSrc = user.avatarUrl || user.avatar || "/default-avatar.png";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        {/* --- Header & Avatar --- */}
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
          <div className="relative group">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <img
                src={avatarSrc}
                alt={user.fullName}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            {/* Nút camera tròn */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white shadow-md ring-4 ring-slate-50 transition-all hover:bg-orange-500"
            >
              {uploadingAvatar ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Camera size={16} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="pt-2">
            <h1 className="text-3xl font-extrabold text-blue-950">
              {user.fullName}
            </h1>
            <p className="text-slate-500 mt-1">{user.email}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Tài khoản đang hoạt động
            </div>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className="flex w-full border-b border-slate-200">
          <TabButton
            active={activeTab === "info"}
            onClick={() => setActiveTab("info")}
            icon={User}
            label="Thông tin cá nhân"
          />
          <TabButton
            active={activeTab === "password"}
            onClick={() => setActiveTab("password")}
            icon={Lock}
            label="Mật khẩu & Bảo mật"
          />
        </div>

        {/* --- Tab Content --- */}
        <div className="min-h-[400px]">
          {activeTab === "info" && <InfoTab user={user} />}
          {activeTab === "password" && <PasswordTab />}
        </div>
      </div>
    </div>
  );
}
