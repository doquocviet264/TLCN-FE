"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Home, FileText } from "lucide-react";

/* ===========================================================
 * Helpers
 * ===========================================================
 */
const vnd = (n?: number | string) => {
  const num = typeof n === "string" ? parseInt(n, 10) : n;
  return typeof num === "number" && !isNaN(num)
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      })
        .format(num)
        .replace(/\s?₫$/, " VNĐ")
    : "—";
};

/* ===========================================================
 * Loading Fallback
 * ===========================================================
 */
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        <p className="mt-4 text-slate-600">Đang xử lý kết quả thanh toán…</p>
      </div>
    </div>
  );
}

/* ===========================================================
 * PAGE WRAPPER (with Suspense for useSearchParams)
 * ===========================================================
 */
export default function VNPaySuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VNPaySuccessContent />
    </Suspense>
  );
}

/* ===========================================================
 * VNPAY SUCCESS CONTENT
 * ===========================================================
 */
function VNPaySuccessContent() {
  const searchParams = useSearchParams();

  // VNPay callback params
  const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
  const vnp_TransactionStatus = searchParams.get("vnp_TransactionStatus");
  const vnp_TxnRef = searchParams.get("vnp_TxnRef");
  const vnp_Amount = searchParams.get("vnp_Amount");
  const vnp_OrderInfo = searchParams.get("vnp_OrderInfo");
  const vnp_PayDate = searchParams.get("vnp_PayDate");
  const vnp_BankCode = searchParams.get("vnp_BankCode");

  // Determine status
  const isSuccess = vnp_ResponseCode === "00" && vnp_TransactionStatus === "00";
  const isPending = vnp_TransactionStatus === "01";
  const isFailed = !isSuccess && !isPending;

  // Format payment date
  const formatPayDate = (dateStr: string | null) => {
    if (!dateStr || dateStr.length < 14) return "—";
    // VNPay format: YYYYMMDDHHmmss
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const min = dateStr.substring(10, 12);
    return `${day}/${month}/${year} ${hour}:${min}`;
  };

  // VNPay amount is in VND * 100
  const amount = vnp_Amount ? parseInt(vnp_Amount, 10) / 100 : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Status Header */}
          <div
            className={`py-8 px-6 text-center ${
              isSuccess
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                : isPending
                ? "bg-gradient-to-r from-amber-500 to-amber-600"
                : "bg-gradient-to-r from-red-500 to-red-600"
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4"
            >
              {isSuccess ? (
                <CheckCircle className="w-12 h-12 text-white" />
              ) : isPending ? (
                <Clock className="w-12 h-12 text-white" />
              ) : (
                <XCircle className="w-12 h-12 text-white" />
              )}
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isSuccess
                ? "Thanh toán thành công!"
                : isPending
                ? "Đang xử lý thanh toán"
                : "Thanh toán thất bại"}
            </h1>
            <p className="text-white/90 text-sm">
              {isSuccess
                ? "Cảm ơn bạn đã đặt tour với chúng tôi"
                : isPending
                ? "Giao dịch của bạn đang được xử lý"
                : "Đã xảy ra lỗi trong quá trình thanh toán"}
            </p>
          </div>

          {/* Transaction Details */}
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
                Chi tiết giao dịch
              </h3>

              <div className="space-y-2 text-sm">
                {vnp_TxnRef && (
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Mã đơn hàng</span>
                    <span className="font-semibold text-slate-800">
                      {vnp_TxnRef}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-500">Số tiền</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    {vnd(amount)}
                  </span>
                </div>

                {vnp_BankCode && (
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Ngân hàng</span>
                    <span className="font-medium text-slate-800">
                      {vnp_BankCode}
                    </span>
                  </div>
                )}

                {vnp_PayDate && (
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Thời gian</span>
                    <span className="font-medium text-slate-800">
                      {formatPayDate(vnp_PayDate)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Trạng thái</span>
                  <span
                    className={`font-semibold ${
                      isSuccess
                        ? "text-emerald-600"
                        : isPending
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {isSuccess
                      ? "Thành công"
                      : isPending
                      ? "Đang xử lý"
                      : "Thất bại"}
                  </span>
                </div>
              </div>
            </div>

            {vnp_OrderInfo && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Nội dung:</span>{" "}
                  {decodeURIComponent(vnp_OrderInfo)}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href="/user/bookings"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
              >
                <FileText size={18} />
                Xem đơn đặt tour
              </Link>
              <Link
                href="/"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                <Home size={18} />
                Về trang chủ
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Help Text */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Nếu bạn cần hỗ trợ, vui lòng liên hệ hotline:{" "}
          <a href="tel:1900xxxx" className="text-emerald-600 font-medium">
            1900 xxxx
          </a>
        </p>
      </div>
    </main>
  );
}
