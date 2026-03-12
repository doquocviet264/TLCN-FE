// /components/SepayButton.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { toast } from "react-hot-toast";
// Đảm bảo bạn đã import hàm API mới cho Sepay (sẽ tạo ở bước 2)
import { initSepayPayment } from "@/lib/checkout/checkoutApi";

/**
 * Sepay payment button
 * - accessible
 * - shows animated spinner
 * - supports optional `amount` prop (display only)
 * - returns payUrl from backend and redirects
 */
export default function SepayPayButton({
  bookingCode,
  disabled = false,
  className = "",
  label = "Thanh toán qua Sepay",
  amount = null, // optional, number in VND
}: {
  bookingCode: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  amount?: number | null;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;

    if (!bookingCode) {
      toast.error("Không tìm thấy mã đặt chỗ để tạo thanh toán Sepay.");
      return;
    }

    try {
      setLoading(true);

      // Call backend to init payment (SỬ DỤNG HÀM MỚI)
      const data = await initSepayPayment(bookingCode, amount || 10000);
      const redirectUrl =
        data?.payUrl || data?.deeplink || data?.payment?.redirectUrl || null;

      if (redirectUrl) {
        // try open in new tab for better UX and fallback to same-tab
        const opened = window.open(redirectUrl, "_blank");
        if (!opened) window.location.href = redirectUrl;
      } else {
        toast.error("Không tìm thấy link thanh toán Sepay. Vui lòng thử lại sau.");
      }
    } catch (err: any) {
      console.error("Sepay payment error:", err);
      toast.error(
        err?.response?.data?.message ||
          "Không khởi tạo được thanh toán Sepay, vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      className={`group inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      // Đổi màu nền cho Sepay, ví dụ dùng màu tím (purple)
      style={{
        background: "linear-gradient(90deg,#8b5cf6, #5b21b6)",
        color: "white",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span className="sr-only">Thanh toán qua Sepay</span>

      {loading ? (
        <>
          {/* Spinner */}
          <svg
            className="-ml-1 mr-3 h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span>Đang chuyển tới Sepay...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2 opacity-95" />
          <span>{label}</span>
          {typeof amount === "number" && (
            <span className="ml-3 text-xs font-medium bg-white/10 px-2 py-0.5 rounded-full">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
                maximumFractionDigits: 0,
              }).format(amount)}
            </span>
          )}
        </>
      )}
    </motion.button>
  );
}
