// /app/auth/login/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaFacebookF, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Mail, Lock, Eye, EyeOff, LogIn, CheckCircle, AlertCircle } from "lucide-react";
import { useSignin } from "#/hooks/auth-hook/useAuth";
import { useAuthStore } from "#/stores/auth";
import { setUserToken, setRefreshToken } from "@/lib/auth/tokenManager";
import { debugTokenAndUser } from "@/lib/auth/tokenDebug";
import { authApi } from "@/lib/auth/authApi";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setToken = useAuthStore((s) => s.setToken);
  const setUserId = useAuthStore((s) => s.setUserId);
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Lần đầu vào trang: đọc email+password đã lưu, điền sẵn vào form
  useEffect(() => {
    const savedEmail = localStorage.getItem("remember_email");
    const savedPassword = localStorage.getItem("remember_password");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }

    const message = searchParams?.get("message");
    if (message) {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [searchParams]);

  const { mutate: signinMutate, isPending } = useSignin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    const input = { identifier: email, password: password, rememberMe: rememberMe };
    signinMutate(input, {
      onSuccess: (data: any) => {
        setToken({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        setUserToken(data.accessToken);
        setRefreshToken(data.refreshToken);

        if (data.user) {
          setUser({
            id: data.user.id,
            fullName: data.user.fullName,
            username: data.user.username,
            email: data.user.email,
            phone: data.user.phone,
            avatar: data.user.avatar,
            points: data.user.points,
            memberStatus: data.user.memberStatus,
          });
          setUserId(data.user.id);
        }

        // Lưu hoặc xóa thông tin đã ghi nhớ
        if (rememberMe) {
          localStorage.setItem("remember_email", email);
          localStorage.setItem("remember_password", password);
        } else {
          localStorage.removeItem("remember_email");
          localStorage.removeItem("remember_password");
        }

        router.replace("/");
      },
      onError: (error: any) => {
        let errorMsg = "Đăng nhập thất bại";
        if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        }
        setApiError(errorMsg);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 mb-4">
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Đăng nhập</h2>
        <p className="text-slate-500 mt-1">Chào mừng bạn quay trở lại!</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {apiError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email hoặc Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email hoặc username"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mật khẩu
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all"
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

        {/* Remember & Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500/50"
            />
            <span className="text-sm text-slate-600">Ghi nhớ đăng nhập</span>
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang đăng nhập...
            </span>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>

      {/* Register Link */}
      <p className="text-center text-slate-600">
        Chưa có tài khoản?{" "}
        <Link href="/auth/register" className="text-orange-600 hover:text-orange-700 font-semibold">
          Đăng ký ngay
        </Link>
      </p>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-slate-500">Hoặc tiếp tục với</span>
        </div>
      </div>

      {/* Social Login */}
      <div className="flex justify-center gap-4">
        <button className="w-14 h-14 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all">
          <FaFacebookF className="text-[#1877F2] text-xl" />
        </button>
        <button className="w-14 h-14 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all">
          <FcGoogle className="text-xl" />
        </button>
        <button className="w-14 h-14 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all">
          <FaApple className="text-slate-900 text-xl" />
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
