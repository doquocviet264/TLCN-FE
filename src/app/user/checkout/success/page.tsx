"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Home, History } from "lucide-react";
import VnpayPayButton from "@/app/user/checkout/VnpayPayButton";
/**
 * Trang xác nhận đặt tour thành công
 * Đọc bookingId & email từ query:
 *   /user/checkout/success?bookingId=BK123&email=a@b.com
 */
function BookingSuccessPageContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("bookingId");
  const email = searchParams.get("email");

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
            {/* Icon Success */}
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
              <CheckCircle className="mx-auto h-20 w-20 text-emerald-500" />
            </motion.div>

            {/* Tiêu đề + mô tả */}
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
              Đặt tour thành công!
            </h1>

            <p className="mt-4 text-lg text-slate-600">
              Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi.
              {email ? (
                <>
                  <br />
                  Thông tin xác nhận đã được gửi đến email{" "}
                  <b className="break-all">{email}</b>.
                </>
              ) : (
                " Vui lòng kiểm tra email để xem thông tin xác nhận."
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
                  <Row
                    label="Trạng thái:"
                    value="Đã tạo đơn, đang chờ xử lý"
                    valueClass="font-semibold text-emerald-600"
                  />
                </div>

                {/* VNPay Button: cho phép user thanh toán online nếu đơn chưa thanh toán */}
                <div className="mt-6">
                  <div className="mt-8 flex flex-col items-center gap-3">
                    <VnpayPayButton bookingCode={bookingId} />

                    <p className="text-xs text-slate-500">
                      Nếu trang không tự chuyển, hãy bấm lại nút ở trên để sang
                      cổng VNPay.
                    </p>
                  </div>
                </div>
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
                Xem lịch sử đặt tour
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
    <Suspense fallback={<div>Loading...</div>}>
      <BookingSuccessPageContent />
    </Suspense>
  );
}

/* ======================================================
 * Helper UI Components
 * ====================================================== */

function Row({
  label,
  value,
  isMono,
  valueClass = "",
}: {
  label: string;
  value: string;
  isMono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <span className="text-slate-600">{label}</span>
      <span
        className={`font-medium text-slate-900 ${
          isMono ? "font-mono" : ""
        } ${valueClass}`}
      >
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
      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
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
      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
    >
      {children}
    </Link>
  );
}
