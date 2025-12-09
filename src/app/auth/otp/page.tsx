"use client";

import React, { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { FiChevronLeft } from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/auth/authApi";

export default function RegisterOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Decode email từ URL (vì đã được encodeURIComponent khi redirect)
  const emailParam = searchParams.get("email") || "";
  const email = decodeURIComponent(emailParam);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    if (!email) {
      setError("Không tìm thấy email. Vui lòng đăng ký lại.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("Verifying OTP for email:", email); // Debug
      const res = await authApi.verifyOTP(email, otp);

      console.log("Kết quả API:", res);

      // Kiểm tra các message thành công có thể từ Backend
      const successMessages = [
        "OTP verified successfully",
        "Kích hoạt tài khoản thành công",
        "Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay.",
      ];

      const isSuccess = successMessages.some(msg =>
        res.message?.toLowerCase().includes(msg.toLowerCase())
      );

      if (isSuccess) {
        alert("Xác thực OTP thành công! Chuyển sang trang đăng nhập...");
        setTimeout(() => router.push("/auth/login?message=Xác thực thành công! Vui lòng đăng nhập."), 1500);
      } else {
        alert(res.message || "Mã OTP không đúng hoặc đã hết hạn");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      const errorMsg = error.response?.data?.message || "Xác thực OTP thất bại";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };


  const handleResendOtp = async () => {
    try {
      await authApi.sendEmailOTP(email, "register");
      alert("Đã gửi lại OTP mới!");
    } catch (error) {
      console.error(error);
      alert("Gửi lại OTP thất bại");
    }
  };

  return (
    <>
    <main>
      <a
        href="/auth/register"
        className="text-sm text-gray-500 hover:underline inline-flex items-center mb-4"
      >
        <FiChevronLeft className="mr-2 text-base" />
        Quay lại trang đăng ký
      </a>

      <h2 className="heading-2 font-bold text-[var(--primary)] mb-1">
        MÃ OTP
      </h2>
      <p className="text-sm text-gray-600 mb-5">
        Mã xác thực đã được gửi tới email <strong>{email}</strong>
      </p>

      {error && (
        <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </p>
      )}

      <form onSubmit={handleVerifyOtp} className="space-y-5 pt-5">
        <Input
          type="text"
          label="Mã xác thực"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <button
          type="button"
          className="text-sm text-[var(--primary)] hover:underline -mt-3"
          onClick={handleResendOtp}
        >
          Gửi lại mã!
        </button>

        <Button type="submit" variant="primary" className="w-full mt-4" disabled={loading}>
          {loading ? "Đang xác thực..." : "XÁC THỰC"}
        </Button>
      </form>
    </main>
    </>
  );
}
