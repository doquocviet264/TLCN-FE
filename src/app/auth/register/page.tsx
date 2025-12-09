// src/app/auth/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { FaFacebookF, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRegister } from "#/hooks/auth-hook/useAuth";
// Nếu bạn có cài thư viện toast (vd: react-hot-toast), hãy import vào đây
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    const newErrors: { [key: string]: string } = {};

    // --- Validation Logic (Giữ nguyên) ---
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
      // Đồng bộ với Backend regex VN: +84/0 + đầu số 3/5/7/8/9 + 8 số
      newErrors.phone = "Số điện thoại VN không hợp lệ (VD: 0912345678)";
    }

    if (!password.trim()) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else {
      // Đồng bộ với Backend passwordValidator
      const pwdErrors: string[] = [];
      if (password.length < 8) {
        pwdErrors.push("ít nhất 8 ký tự");
      }
      if (!/[a-z]/.test(password)) {
        pwdErrors.push("1 chữ thường");
      }
      if (!/[A-Z]/.test(password)) {
        pwdErrors.push("1 chữ hoa");
      }
      if (!/[0-9]/.test(password)) {
        pwdErrors.push("1 chữ số");
      }
      if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/]/.test(password)) {
        pwdErrors.push("1 ký tự đặc biệt");
      }
      if (pwdErrors.length > 0) {
        newErrors.password = `Mật khẩu cần có: ${pwdErrors.join(", ")}`;
      }
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
        console.log("Đăng ký thành công", data);
        setApiError("");

        const emailParam = encodeURIComponent(email);

        // Hiển thị toast phù hợp với message từ Backend
        if (data?.message?.includes("chưa kích hoạt")) {
          toast.success("Đã gửi lại mã OTP mới. Vui lòng kiểm tra email!");
        } else {
          toast.success("Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.");
        }

        // Chuyển hướng sang trang nhập OTP
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
    // Đảm bảo đường dẫn này đúng với Backend của bạn
    // Thường là http://localhost:4000/api/auth/google
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    window.location.href = `${API_URL}/auth/${provider}`;
  };

  return (
    <>
      <h2 className="heading-2 font-bold text-[var(--secondary)] mb-1">
        ĐĂNG KÝ
      </h2>
      <p className="text-sm text-gray-600 mb-5">
        Hãy bắt đầu tạo tài khoản cho bản thân
      </p>

      {apiError && (
        <p className="text-[var(--warning)] text-sm mb-3 bg-red-50 p-2 rounded border border-red-200">
          {apiError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 pt-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              type="text"
              label="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={
                errors.fullName ? "border-red-500 focus:ring-red-500" : ""
              }
            />
            {errors.fullName && (
              <p className="text-[var(--warning)] text-xs mt-1">
                {errors.fullName}
              </p>
            )}
          </div>
          <div>
            <Input
              type="text"
              label="User name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className={
                errors.userName ? "border-red-500 focus:ring-red-500" : ""
              }
            />
            {errors.userName && (
              <p className="text-[var(--warning)] text-xs mt-1">
                {errors.userName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={
                errors.email ? "border-red-500 focus:ring-red-500" : ""
              }
            />
            {errors.email && (
              <p className="text-[var(--warning)] text-xs mt-1">
                {errors.email}
              </p>
            )}
          </div>
          <div>
            <Input
              type="text"
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className={
                errors.phone ? "border-red-500 focus:ring-red-500" : ""
              }
            />
            {errors.phone && (
              <p className="text-[var(--warning)] text-xs mt-1">
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            label="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={
              errors.password ? "border-red-500 focus:ring-red-500" : ""
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
          {errors.password && (
            <p className="text-[var(--warning)] text-xs mt-1">
              {errors.password}
            </p>
          )}
        </div>

        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            label="Xác thực mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={
              errors.confirmPassword ? "border-red-500 focus:ring-red-500" : ""
            }
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
          {errors.confirmPassword && (
            <p className="text-[var(--warning)] text-xs mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="terms"
            checked={agree}
            onChange={() => setAgree(!agree)}
            className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
            required
          />
          <label
            htmlFor="terms"
            className="text-sm text-gray-600 select-none cursor-pointer"
          >
            Tôi đã đọc các điều khoản và điều kiện
          </label>
        </div>
        {errors.agree && (
          <p className="text-[var(--warning)] text-xs">{errors.agree}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-4 h-12 text-base font-bold transition-all hover:shadow-lg"
          disabled={isPending}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Đang xử lý...
            </span>
          ) : (
            "ĐĂNG KÝ"
          )}
        </Button>
      </form>

      <p className="text-sm mt-6 text-gray-600 text-center">
        Bạn đã có tài khoản?{" "}
        <a
          href="/auth/login"
          className="text-[var(--primary)] font-bold hover:underline"
        >
          Đăng nhập ngay
        </a>
      </p>

      <div className="flex items-center gap-2 pt-5">
        <hr className="flex-1 border-gray-300" />
        <span className="text-gray-500 text-sm">Hoặc đăng ký bằng</span>
        <hr className="flex-1 border-gray-300" />
      </div>

      <div className="flex justify-center mt-6 space-x-4">
        <Button
          variant="outline-primary"
          type="button"
          onClick={() => startOAuth("facebook")}
          className="w-14 h-14 rounded-full flex items-center justify-center p-0 border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <FaFacebookF className="text-[#1877F2] text-xl" />
        </Button>

        <Button
          variant="outline-primary"
          type="button"
          onClick={() => startOAuth("google")}
          className="w-14 h-14 rounded-full flex items-center justify-center p-0 border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
        >
          <FcGoogle className="text-xl" />
        </Button>

        <Button
          variant="outline-primary"
          type="button"
          onClick={() => startOAuth("apple")}
          className="w-14 h-14 rounded-full flex items-center justify-center p-0 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors"
        >
          <FaApple className="text-black text-xl" />
        </Button>
      </div>
    </>
  );
}
