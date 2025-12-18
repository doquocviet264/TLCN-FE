// src/app/auth/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaFacebookF, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, AtSign } from "lucide-react";
import { useRegister } from "#/hooks/auth-hook/useAuth";
import { toast } from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState("");

  const { mutate: registerMutate, isPending } = useRegister();

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ["bg-slate-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-emerald-500"];
  const strengthTexts = ["", "Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ và tên";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Họ và tên phải có ít nhất 2 ký tự";
    }

    if (!userName.trim()) {
      newErrors.userName = "Vui lòng nhập Username";
    } else if (userName.trim().length < 3) {
      newErrors.userName = "Username phải có ít nhất 3 ký tự";
    } else if (!/^[a-zA-Z0-9_]+$/.test(userName.trim())) {
      newErrors.userName = "Username chỉ chứa chữ, số và gạch dưới";
    }

    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/.test(phone.trim().replace(/\s/g, ""))) {
      newErrors.phone = "Số điện thoại VN không hợp lệ";
    }

    if (!password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (passwordStrength < 5) {
      newErrors.password = "Mật khẩu chưa đủ mạnh";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (!agree) newErrors.agree = "Bạn cần đồng ý điều khoản";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setApiError("");

    const input = {
      fullName: fullName.trim(),
      username: userName.trim(),
      email: email.trim(),
      phoneNumber: phone.trim(),
      password: password.trim(),
    };

    registerMutate(input, {
      onSuccess: (data: any) => {
        setApiError("");
        const emailParam = encodeURIComponent(email);

        if (data?.message?.includes("chưa kích hoạt")) {
          toast.success("Đã gửi lại mã OTP mới. Vui lòng kiểm tra email!");
        } else {
          toast.success("Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.");
        }

        router.push(`/auth/otp?email=${emailParam}`);
      },
      onError: (error: any) => {
        let errorMessage = "Đăng ký thất bại";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
          if (errorMessage.includes("email already exists")) {
            errorMessage = "Email đã được sử dụng";
          } else if (errorMessage.includes("username already exists")) {
            errorMessage = "Username đã được sử dụng";
          }
        }
        setApiError(errorMessage);
      },
    });
  };

  const startOAuth = (provider: "facebook" | "google" | "apple") => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 mb-3">
          <UserPlus className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h2>
        <p className="text-slate-500 text-sm mt-1">Bắt đầu hành trình du lịch của bạn</p>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name & Username */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all ${errors.fullName ? "border-red-300" : "border-slate-200"}`}
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AtSign className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="username"
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all ${errors.userName ? "border-red-300" : "border-slate-200"}`}
              />
            </div>
            {errors.userName && <p className="text-red-500 text-xs mt-1">{errors.userName}</p>}
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all ${errors.email ? "border-red-300" : "border-slate-200"}`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all ${errors.phone ? "border-red-300" : "border-slate-200"}`}
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tạo mật khẩu mạnh"
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all ${errors.password ? "border-red-300" : "border-slate-200"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Password Strength */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColors[passwordStrength] : "bg-slate-200"}`}
                  />
                ))}
              </div>
              <p className={`text-xs ${passwordStrength >= 4 ? "text-emerald-600" : passwordStrength >= 3 ? "text-yellow-600" : "text-red-500"}`}>
                {strengthTexts[passwordStrength]}
              </p>
            </div>
          )}
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Xác nhận mật khẩu</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white transition-all ${errors.confirmPassword ? "border-red-300" : "border-slate-200"}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && password === confirmPassword && (
            <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Mật khẩu khớp
            </p>
          )}
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            checked={agree}
            onChange={() => setAgree(!agree)}
            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500/50"
          />
          <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer">
            Tôi đồng ý với{" "}
            <Link href="#" className="text-orange-600 hover:underline">Điều khoản dịch vụ</Link>
            {" "}và{" "}
            <Link href="#" className="text-orange-600 hover:underline">Chính sách bảo mật</Link>
          </label>
        </div>
        {errors.agree && <p className="text-red-500 text-xs">{errors.agree}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang xử lý...
            </span>
          ) : (
            "Đăng ký"
          )}
        </button>
      </form>

      {/* Login Link */}
      <p className="text-center text-sm text-slate-600">
        Đã có tài khoản?{" "}
        <Link href="/auth/login" className="text-orange-600 hover:text-orange-700 font-semibold">
          Đăng nhập
        </Link>
      </p>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-slate-500 text-xs">Hoặc đăng ký với</span>
        </div>
      </div>

      {/* Social */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => startOAuth("facebook")}
          className="w-12 h-12 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <FaFacebookF className="text-[#1877F2]" />
        </button>
        <button
          type="button"
          onClick={() => startOAuth("google")}
          className="w-12 h-12 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <FcGoogle />
        </button>
        <button
          type="button"
          onClick={() => startOAuth("apple")}
          className="w-12 h-12 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <FaApple className="text-slate-900" />
        </button>
      </div>
    </div>
  );
}
