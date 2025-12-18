"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAdminLogin } from "@/app/admin/hooks/useAdmin";
import { useAdminStore } from "#/stores/admin";
import { Mail, Lock, Eye, EyeOff, Shield, LayoutDashboard, Users, MapPin } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAdminStore((s) => s.setAuth);
  const { mutateAsync, isPending } = useAdminLogin();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const resp = await mutateAsync({ identifier, password });

      // Lưu token vào store (zustand + localStorage)
      setAuth(resp.accessToken!, {
        id: resp.admin.id,
        name: resp.admin.name || resp.admin.fullName || "Admin"
      });

      // Redirect tới dashboard
      router.replace("/admin/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Đăng nhập thất bại");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="mb-10">
            <Image
              src="/logo.png"
              alt="Anh Travel"
              width={180}
              height={60}
              className="brightness-0 invert"
            />
          </div>

          {/* Title */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4">
            Hệ thống Quản trị
          </h1>
          <p className="text-blue-200 text-lg mb-12 max-w-md">
            Quản lý tours, đặt chỗ, người dùng và tất cả hoạt động kinh doanh của Anh Travel
          </p>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl px-5 py-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Dashboard thông minh</h3>
                <p className="text-blue-300 text-sm">Theo dõi doanh thu, bookings realtime</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl px-5 py-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Quản lý Tours</h3>
                <p className="text-blue-300 text-sm">Tạo, sửa, xoá và theo dõi tours</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl px-5 py-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Quản lý khách hàng</h3>
                <p className="text-blue-300 text-sm">Thông tin người dùng và đặt chỗ</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Image
              src="/logo.png"
              alt="Anh Travel"
              width={150}
              height={50}
              className="mx-auto"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-950 to-blue-900 shadow-lg shadow-blue-950/30 mb-4">
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Đăng nhập Admin</h2>
            <p className="text-slate-500 mt-1">Truy cập hệ thống quản trị</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-xl shadow-slate-200/50">
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Username/Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Username hoặc Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="admin@anhtravel.vn"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isPending}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/25"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang đăng nhập...
                  </span>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Anh Travel. Hệ thống quản trị nội bộ.
          </p>
        </div>
      </div>
    </div>
  );
}
