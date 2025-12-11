// /app/auth/login/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { FaFacebookF, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
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

  useEffect(() => {
    // Xóa password cũ nếu có (migration từ code cũ - không an toàn)
    localStorage.removeItem("remember_password");

    // Kiểm tra Remember Token để auto-login
    const rememberedEmail = localStorage.getItem("remember_email");
    const rememberedToken = localStorage.getItem("remember_token");

    if (rememberedEmail && rememberedToken) {
      setEmail(rememberedEmail);
      setRememberMe(true);
      // Thử auto-login với remember token
      handleAutoLogin(rememberedEmail, rememberedToken);
    }

    // Check for success message from registration
    const message = searchParams?.get("message");
    if (message) {
      setSuccessMessage(message);
      // Clear the message from URL after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [searchParams]);

  // Auto-login với Remember Token
  const handleAutoLogin = async (email: string, token: string) => {
    try {
      const data = await authApi.loginWithRememberToken(email, token);

      // Lưu tokens mới
      setToken({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setUserToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      // Cập nhật remember token mới (rotation)
      if (data.rememberToken) {
        localStorage.setItem("remember_token", data.rememberToken);
      }

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

      router.replace("/");
    } catch (error) {
      // Token hết hạn hoặc không hợp lệ -> xóa và yêu cầu đăng nhập lại
      localStorage.removeItem("remember_email");
      localStorage.removeItem("remember_token");
      console.log("Auto-login failed, please login manually");
    }
  };
  const { mutate: signinMutate, isPending } = useSignin();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    const input = { identifier: email, password: password, rememberMe: rememberMe };
    signinMutate(input, {
      onSuccess: (data: any) => {
        console.log("Đăng nhập thành công");
        // Save tokens to both Zustand store AND tokenManager
        setToken({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        setUserToken(data.accessToken);
        setRefreshToken(data.refreshToken);

        // Save user info to store
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

        debugTokenAndUser.logAuthStateChange("Login.onSuccess", {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          userId: data.user?.id,
        });
        debugTokenAndUser.logUserInfoDisplay("Login.userInfo", data.user);

        // Lưu Remember Token (an toàn - không phải password)
        if (rememberMe && data.rememberToken) {
          localStorage.setItem("remember_email", email);
          localStorage.setItem("remember_token", data.rememberToken);
        } else {
          localStorage.removeItem("remember_email");
          localStorage.removeItem("remember_token");
        }

        // Redirect to home page for customers
        router.replace("/");
      },
      onError: (error: any) => {
        let errorMsg = "Đăng nhập thất bại";
        if (error.response && error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
        setApiError(errorMsg);
      },
    });
  };

  return (
    <>
      <h2 className="heading-2 font-bold text-[var(--secondary)] mb-1">
        ĐĂNG NHẬP
      </h2>
      <p className="text-sm text-gray-600 mb-5">Đăng nhập tài khoản của bạn</p>

      {successMessage && (
        <p className="text-green-600 text-sm mb-2 bg-green-50 p-3 rounded-lg border border-green-200">
          {successMessage}
        </p>
      )}

      {apiError && (
        <p className="text-[var(--warning)] text-sm mb-2">{apiError}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 pt-5">
        <Input
          // type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            label="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only peer" />
            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]" />
            <span className="ml-2 text-sm text-gray-900">Ghi nhớ mật khẩu</span>
          </label>

          <a
            href="/auth/forgot-password"
            className="text-[var(--primary)] hover:underline whitespace-nowrap"
          >
            Quên mật khẩu?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-4"
          disabled={isPending}
        >
          {isPending ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
        </Button>
      </form>

      <p className="text-sm mt-6 text-gray-600 text-center">
        Bạn chưa có tài khoản?{" "}
        <a
          href="/auth/register"
          className="text-[var(--primary)] hover:underline"
        >
          Đăng ký ngay
        </a>
      </p>

      <div className="flex items-center gap-2 py-2">
        <hr className="flex-1 border-gray-300" />
        <span className="text-gray-500 text-sm">Hoặc đăng nhập bằng</span>
        <hr className="flex-1 border-gray-300" />
      </div>

      <div className="flex justify-center mt-8 space-x-4">
        <Button variant="outline-primary">
          <FaFacebookF className="text-[var(--primary)] text-xl" />
        </Button>
        <Button variant="outline-primary">
          <FcGoogle className="text-xl" />
        </Button>
        <Button variant="outline-primary">
          <FaApple className="text-black text-xl" />
        </Button>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
