"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { FiEye, FiEyeOff, FiChevronLeft } from "react-icons/fi";
import { authApi } from "@/lib/auth/authApi";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Validate password theo chuẩn Backend
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("ít nhất 8 ký tự");
    if (!/[a-z]/.test(pwd)) errors.push("1 chữ thường");
    if (!/[A-Z]/.test(pwd)) errors.push("1 chữ hoa");
    if (!/[0-9]/.test(pwd)) errors.push("1 chữ số");
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/]/.test(pwd)) errors.push("1 ký tự đặc biệt");
    return errors;
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (step === 1) {
        // Bước 1: Gửi OTP về email
        await authApi.forgotPassword(email);
        setStep(2);
      } else if (step === 2) {
        // Bước 2: Xác thực OTP
        const result = await authApi.verifyResetOtp(email, code);
        setResetToken(result.resetToken);
        setStep(3);
      } else if (step === 3) {
        // Validate password
        const pwdErrors = validatePassword(password);
        if (pwdErrors.length > 0) {
          setPasswordErrors(pwdErrors);
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError("Mật khẩu xác nhận không khớp");
          setLoading(false);
          return;
        }

        // Bước 3: Đặt mật khẩu mới
        await authApi.resetPassword(email, resetToken, password);
        alert("Đặt lại mật khẩu thành công!");
        router.push("/auth/login?message=Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      await authApi.forgotPassword(email);
      alert("Đã gửi lại mã OTP!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Gửi lại OTP thất bại";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <a
        href="/auth/login"
        className="text-sm text-gray-500 hover:underline inline-flex items-center mb-4"
      >
        <FiChevronLeft className="mr-2 text-base" />
        Quay lại trang đăng nhập
      </a>

      {/* Bước 1: Nhập email */}
      {step === 1 && (
        <>
          <h2 className="heading-2 font-bold text-[var(--primary)] mb-1">
            QUÊN MẬT KHẨU
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            Đừng lo lắng, điều này xảy ra với tất cả chúng ta. Nhập email của bạn
            bên dưới để lấy lại mật khẩu.
          </p>
        </>
      )}

      {/* Bước 2: Nhập OTP */}
      {step === 2 && (
        <>
          <h2 className="heading-2 font-bold text-[var(--primary)] mb-1">
            MÃ XÁC THỰC
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            Mã xác thực đã được gửi tới email <strong>{email}</strong>
          </p>
        </>
      )}

      {/* Bước 3: Đặt mật khẩu mới */}
      {step === 3 && (
        <>
          <h2 className="heading-2 font-bold text-[var(--primary)] mb-1">
            ĐẶT MẬT KHẨU MỚI
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            Vui lòng đặt mật khẩu mới cho tài khoản của bạn.
          </p>
        </>
      )}

      {error && (
        <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </p>
      )}

      <form onSubmit={handleNextStep} className="space-y-5 pt-5">
        {step === 1 && (
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}

        {step === 2 && (
          <>
            <Input
              type="text"
              label="Mã xác thực (6 số)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
            <button
              type="button"
              className="text-sm text-[var(--primary)] hover:underline -mt-2"
              onClick={handleResendOtp}
              disabled={loading}
            >
              Gửi lại mã!
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                label="Mật khẩu mới"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordErrors(validatePassword(e.target.value));
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
              {passwordErrors.length > 0 && (
                <p className="text-red-500 text-xs mt-1">
                  Cần có: {passwordErrors.join(", ")}
                </p>
              )}
            </div>

            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                label="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Mật khẩu không khớp</p>
              )}
            </div>
          </>
        )}

        <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Đang xử lý...
            </span>
          ) : (
            <>
              {step === 1 && "GỬI MÃ XÁC THỰC"}
              {step === 2 && "XÁC THỰC"}
              {step === 3 && "ĐẶT MẬT KHẨU MỚI"}
            </>
          )}
        </Button>
      </form>
    </>
  );
}
