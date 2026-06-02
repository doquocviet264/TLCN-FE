"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  MapPin,
  Users,
  Star,
  Shield,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { leaderAuthApi } from "@/lib/leader/leaderApi";

const FEATURES = [
  {
    icon: Compass,
    title: "Quản lý tour phụ trách",
    desc: "Theo dõi realtime và cập nhật lịch trình",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: MapPin,
    title: "Cập nhật timeline hành trình",
    desc: "Ghi lại từng điểm dừng, sự kiện nổi bật",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Users,
    title: "Chat nhóm với khách hàng",
    desc: "Liên lạc trực tiếp trong nhóm tour",
    color: "from-emerald-500 to-emerald-600",
  },
];

const STATS = [
  { value: "500+", label: "Tours hoàn thành" },
  { value: "98%", label: "Hài lòng khách" },
  { value: "50+", label: "Leader đang hoạt động" },
];

export default function LeaderLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setIsLoading(true);
      await leaderAuthApi.login({ identifier, password });
      router.replace("/leader/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 overflow-hidden">
      {/* ===== LEFT PANEL — Decorative ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(59,130,246,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(249,115,22,0.15),transparent_60%)]" />

        {/* Animated orbs */}
        <div
          className="absolute top-20 right-20 w-72 h-72 rounded-full
          bg-gradient-to-br from-orange-500/20 to-orange-600/5
          blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-32 left-10 w-56 h-56 rounded-full
          bg-gradient-to-br from-blue-500/20 to-blue-600/5
          blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full
          bg-gradient-to-br from-emerald-500/5 to-transparent
          blur-3xl"
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            <Image
              src="/logo.png"
              alt="AHH Travel"
              width={160}
              height={52}
              className="brightness-0 invert"
            />
          </div>

          {/* Main copy */}
          <div className={`transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/25
              rounded-full px-4 py-1.5 text-xs font-semibold text-orange-300 mb-6 tracking-wide uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Dành riêng cho Tour Leader
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-5">
              Chào mừng<br />
              <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                Tour Leader
              </span>
            </h1>
            <p className="text-blue-200/80 text-lg max-w-sm leading-relaxed">
              Nền tảng quản lý hành trình thông minh — từ lúc khởi hành đến khi về đến nơi.
            </p>

            {/* Features */}
            <div className="mt-10 space-y-5">
              {FEATURES.map((feat, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 transition-all duration-500
                    ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  style={{ transitionDelay: `${200 + i * 100}ms` }}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color}
                    flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <feat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{feat.title}</p>
                    <p className="text-xs text-blue-300/70 mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className={`transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-6 pt-8 border-t border-white/10">
              {STATS.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                  <p className="text-xs text-blue-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Form ===== */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Subtle bg glow */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className={`w-full max-w-md transition-all duration-700 delay-200
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="AHH Travel"
              width={150}
              height={48}
              className="brightness-0 invert"
            />
          </div>

          {/* Form Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10
            shadow-2xl shadow-black/50">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600
                  shadow-xl shadow-orange-500/30" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400/30 to-transparent
                  animate-pulse" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <Compass className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">Đăng nhập</h2>
              <p className="text-slate-400 text-sm mt-1.5">
                Truy cập hệ thống quản lý Leader
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Identifier */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">
                  Email hoặc Username
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-slate-500
                      bg-white/5 border border-white/10
                      focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20
                      transition-all duration-200"
                    placeholder="leader@ahhtravel.com"
                    required
                    autoComplete="username"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 to-orange-500/0
                    group-focus-within:from-orange-500/5 group-focus-within:to-transparent
                    pointer-events-none transition-all duration-300" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl text-white placeholder-slate-500
                      bg-white/5 border border-white/10
                      focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20
                      transition-all duration-200"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2
                      text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 to-orange-500/0
                    group-focus-within:from-orange-500/5 group-focus-within:to-transparent
                    pointer-events-none transition-all duration-300" />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl
                  bg-red-500/10 border border-red-500/25 text-red-400 text-sm
                  animate-in slide-in-from-top-1 duration-200">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-4 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-orange-500 to-orange-600
                  hover:from-orange-600 hover:to-orange-700
                  active:scale-[0.98]
                  shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40
                  disabled:opacity-70 disabled:cursor-not-allowed
                  transition-all duration-200 overflow-hidden group"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                  -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      Đăng nhập
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bảo mật SSL</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Star className="w-3.5 h-3.5 text-orange-500" />
                <span>AHH Travel</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Riêng tư</span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            Quên mật khẩu? Liên hệ quản trị viên để được hỗ trợ.
          </p>
          <p className="text-center text-xs text-slate-700 mt-2">
            © {new Date().getFullYear()} AHH Travel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
