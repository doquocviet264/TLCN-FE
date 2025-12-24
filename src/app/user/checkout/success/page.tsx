"use client";

import * as React from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Home,
  History,
  Clock,
  Building2,
  CreditCard,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getBookingByCode } from "@/lib/checkout/checkoutApi";
import VnpayPayButton from "@/app/user/checkout/VnpayPayButton";

/**
 * Trang xác nhận đặt tour
 * Đọc bookingId & email & paymentMethod từ query:
 *   /user/checkout/success?bookingId=BK123&email=a@b.com&paymentMethod=office-payment
 */
function BookingSuccessPageContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("bookingId");
  const email = searchParams.get("email");
  const paymentMethod = searchParams.get("paymentMethod");
  const paymentError = searchParams.get("paymentError") === "true";

  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Load booking status
  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const loadBooking = async () => {
      try {
        const booking = await getBookingByCode(bookingId);
        setBookingStatus(booking.bookingStatus);
        setPaidAmount(booking.paidAmount || 0);
        setTotalPrice(booking.totalPrice || 0);
      } catch (err) {
        console.error("Load booking error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId]);

  // Determine display based on payment method and status
  const isOfficePayment = paymentMethod === "office-payment";
  const isOnlinePayment = paymentMethod === "vnpay-payment";
  const isPaid = paidAmount > 0 || bookingStatus === "c"; // c = confirmed
  const isPending = bookingStatus === "p"; // p = pending

  // For office payment: always show success (they will pay later)
  // For online payment: only show success if actually paid
  const showSuccess = isOfficePayment || isPaid;
  const showPendingPayment =
    (isOnlinePayment && !isPaid && isPending) || paymentError;

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-[1200px] px-4 py-20">
        <div className="mx-auto max-w-2xl flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
          <p className="mt-4 text-slate-600">
            Đang kiểm tra trạng thái đơn hàng...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[1200px] px-4 py-20">
      <div className="mx-auto max-w-2xl">
        {/* Card thông báo chính */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_10px_30px_-15px_rgba(2,6,23,0.18)]"
        >
          <div className="text-center">
            {/* Icon based on status */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 300,
                damping: 15,
              }}
            >
              {showSuccess ? (
                <CheckCircle className="mx-auto h-20 w-20 text-emerald-500" />
              ) : showPendingPayment ? (
                <Clock className="mx-auto h-20 w-20 text-amber-500" />
              ) : (
                <AlertCircle className="mx-auto h-20 w-20 text-slate-400" />
              )}
            </motion.div>

            {/* Tiêu đề + mô tả */}
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
              {showSuccess
                ? "Đặt tour thành công!"
                : showPendingPayment
                ? "Đơn hàng đang chờ thanh toán"
                : "Đã tạo đơn hàng"}
            </h1>

            <p className="mt-4 text-lg text-slate-600">
              {showSuccess ? (
                <>
                  Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi.
                  {email && (
                    <>
                      <br />
                      Thông tin xác nhận đã được gửi đến email{" "}
                      <b className="break-all">{email}</b>.
                    </>
                  )}
                </>
              ) : showPendingPayment ? (
                <>
                  Đơn hàng của bạn đã được tạo nhưng chưa thanh toán.
                  <br />
                  Vui lòng hoàn tất thanh toán để xác nhận đặt tour.
                </>
              ) : (
                "Vui lòng kiểm tra lại thông tin đơn hàng."
              )}
            </p>

            {/* Chi tiết đơn đặt nếu có bookingId */}
            {bookingId && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                <h3 className="text-base font-semibold text-slate-800">
                  Chi tiết đặt chỗ
                </h3>

                <div className="mt-4 space-y-2 text-sm">
                  <Row label="Mã đặt chỗ:" value={bookingId} isMono />
                  {email && <Row label="Email:" value={email} />}

                  {/* Payment method */}
                  <Row
                    label="Phương thức:"
                    value={
                      isOfficePayment
                        ? "Thanh toán tại văn phòng"
                        : paymentMethod === "vnpay-payment"
                        ? "Thanh toán VNPay"
                        : paymentMethod || "—"
                    }
                    icon={
                      isOfficePayment ? (
                        <Building2 size={14} className="text-blue-500" />
                      ) : (
                        <CreditCard size={14} className="text-emerald-500" />
                      )
                    }
                  />

                  {/* Status */}
                  <Row
                    label="Trạng thái:"
                    value={
                      showSuccess
                        ? isOfficePayment
                          ? "Đã xác nhận - Thanh toán tại văn phòng"
                          : "Đã thanh toán"
                        : showPendingPayment
                        ? "Chờ thanh toán"
                        : "Đang xử lý"
                    }
                    valueClass={
                      showSuccess
                        ? "font-semibold text-emerald-600"
                        : showPendingPayment
                        ? "font-semibold text-amber-600"
                        : "font-semibold text-slate-600"
                    }
                  />
                </div>

                {/* Show payment button if pending online payment */}
                {showPendingPayment && (
                  <div className="mt-6">
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-medium">
                            Chưa hoàn tất thanh toán
                          </p>
                          <p className="mt-1 text-amber-700">
                            Đơn hàng sẽ được giữ trong 24 giờ. Vui lòng thanh
                            toán để xác nhận đặt tour.
                          </p>
                        </div>
                      </div>
                    </div>

                    <VnpayPayButton bookingCode={bookingId} />

                    <p className="mt-3 text-xs text-center text-slate-500">
                      Bấm nút trên để thanh toán qua VNPay
                    </p>
                  </div>
                )}

                {/* Office payment instructions */}
                {isOfficePayment && showSuccess && (
                  <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Hướng dẫn thanh toán</p>
                        <p className="mt-1 text-blue-700">
                          Vui lòng đến văn phòng của chúng tôi để hoàn tất thanh
                          toán trước ngày khởi hành. Mang theo mã đặt chỗ:{" "}
                          <span className="font-mono font-semibold">
                            {bookingId}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hành động tiếp theo */}
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <ButtonPrimary href="/">
                <Home size={18} className="mr-2" />
                Về trang chủ
              </ButtonPrimary>

              <ButtonSecondary href="/user/history">
                <History size={18} className="mr-2" />
                Xem đơn đặt tour
              </ButtonSecondary>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BookingSuccessPageContent />
    </Suspense>
  );
}

/* ======================================================
 * Helper UI Components
 * ====================================================== */

function LoadingFallback() {
  return (
    <main className="mx-auto min-h-screen max-w-[1200px] px-4 py-20">
      <div className="mx-auto max-w-2xl flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="mt-4 text-slate-600">Đang tải...</p>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  isMono,
  valueClass = "",
  icon,
}: {
  label: string;
  value: string;
  isMono?: boolean;
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <span className="text-slate-600">{label}</span>
      <span
        className={`flex items-center gap-1.5 font-medium text-slate-900 ${
          isMono ? "font-mono" : ""
        } ${valueClass}`}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}

function ButtonPrimary({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
    >
      {children}
    </Link>
  );
}

function ButtonSecondary({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
    >
      {children}
    </Link>
  );
}
