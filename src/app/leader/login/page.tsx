"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Map, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { leaderAuthApi } from "@/lib/leader/leaderApi";

export default function LeaderLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setIsLoading(true);
      await leaderAuthApi.login({ identifier, password });
      router.replace("/leader/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* LEFT PANEL - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(at_30%_20%,rgba(59,130,246,0.3),transparent)]" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-12">
            <Image
              src="/logo.png"
              alt="AHH Travel"
              width={180}
              height={60}
              className="brightness-0 invert"
            />
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Chào mừng Leader
          </h1>
          <p className="text-blue-200 text-xl max-w-md">
            Quản lý tour • Điều phối hành trình • Theo dõi hiệu suất
          </p>

          <div className="mt-16 space-y-6">
            <div className="flex items-start gap-4 text-blue-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/25">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Quản lý tour đang phụ trách</p>
                <p className="text-sm text-blue-300">
                  Theo dõi realtime và cập nhật tình hình
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-blue-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/25">
                <span className="text-lg">📍</span>
              </div>
              <div>
                <p className="font-semibold text-white">Điều phối hành trình</p>
                <p className="text-sm text-blue-300">
                  Phối hợp với hướng dẫn viên và tài xế
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-blue-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/25">
                <span className="text-lg">💬</span>
              </div>
              <div>
                <p className="font-semibold text-white">Chat với khách hàng</p>
                <p className="text-sm text-blue-300">
                  Liên lạc trực tiếp trong nhóm tour
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="AHH Travel"
              width={160}
              height={50}
              className="brightness-0 invert"
            />
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Map className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mt-6">
                Đăng nhập Leader
              </h2>
              <p className="text-slate-400 mt-2">
                Truy cập hệ thống quản lý tour
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email hoặc Username
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="leader@ahhtravel.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-8">
              Quên mật khẩu? Liên hệ quản trị viên
            </p>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            © 2024 AHH Travel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
