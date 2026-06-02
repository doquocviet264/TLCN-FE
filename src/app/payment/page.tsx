"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ChevronRight, Home, Receipt, Calendar, Users, MapPin, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { getBookingByCode, type MyBookingItem } from "@/lib/checkout/checkoutApi";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const code = searchParams.get("code");
  const reason = searchParams.get("reason");

  const isSuccess = status === "success";

  const [booking, setBooking] = useState<MyBookingItem | null>(null);
  const [loading, setLoading] = useState(!!code);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSuccess) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#27ae60', '#f97316', '#307afd']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#27ae60', '#f97316', '#307afd']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isSuccess]);

  useEffect(() => {
    async function fetchBooking() {
      if (!code) return;
      try {
        setLoading(true);
        const data = await getBookingByCode(code);
        setBooking(data);
      } catch (err: any) {
        console.error("Error fetching booking:", err);
        setError("Không thể tải chi tiết đơn hàng.");
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [code]);

  const vnd = (n?: number) =>
    typeof n === "number"
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(n).replace(/\s?₫$/, " đ")
      : "—";

  const dmyTime = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const isFullPayment = booking ? booking.paidAmount >= booking.totalPrice : false;

  return (
    <main className="min-h-screen bg-[var(--brand-primary)] py-12 px-4 flex justify-center relative overflow-hidden">
      {/* Nền background với pattern nhẹ */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#ffffff 2px, transparent 2px)",
          backgroundSize: "30px 30px"
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-[480px] w-full relative z-10"
      >
        {/* Receipt Header (Đầu hóa đơn) */}
        <div className="bg-white rounded-t-3xl overflow-hidden shadow-2xl relative">
          <div className={`p-8 text-center border-b-[3px] border-dashed ${isSuccess ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"}`}>
            <div className="flex justify-center mb-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              >
                {isSuccess ? (
                  <CheckCircle2 size={80} className="text-[var(--success)] drop-shadow-md mx-auto" />
                ) : (
                  <XCircle size={80} className="text-[var(--error)] drop-shadow-md mx-auto" />
                )}
              </motion.div>
            </div>
            
            <h1 className={`text-2xl font-extrabold tracking-tight mb-2 ${isSuccess ? "text-emerald-700" : "text-red-700"}`}>
              {isSuccess ? "Giao Dịch Thành Công" : "Giao Dịch Thất Bại"}
            </h1>
            
            {isSuccess ? (
              <p className="text-sm font-medium text-slate-500">
                Cảm ơn bạn đã lựa chọn AHH Travel.<br/> Biên lai điện tử đã được ghi nhận.
              </p>
            ) : (
              <p className="text-sm font-medium text-red-600/80">
                {reason === "24" ? "Khách hàng hủy giao dịch" :
                 reason === "invalid_signature" ? "Sai chữ ký bảo mật" :
                 reason === "booking_not_found" ? "Không tìm thấy đơn hàng" :
                 reason || "Có lỗi xảy ra trong quá trình thanh toán."}
              </p>
            )}
          </div>

          {/* Receipt Body */}
          <div className="p-8 bg-white relative">
            {/* Lỗ hổng 2 bên viền đứt nét */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[var(--brand-primary)] rounded-full shadow-inner"></div>
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[var(--brand-primary)] rounded-full shadow-inner"></div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 size={32} className="animate-spin text-[var(--accent)] mb-3" />
                <p className="text-sm text-slate-500 font-medium">Đang tải chi tiết đơn hàng...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-[var(--error)] text-sm font-bold">{error}</p>
              </div>
            ) : booking ? (
              <div className="space-y-6">
                {/* Thông tin đơn */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Chi tiết chuyến đi</p>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500">Tên tour</span>
                      <span className="text-[15px] font-bold text-slate-800 leading-snug">{booking.tourTitle || "Chưa xác định"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Hành khách</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {booking.numAdults} người lớn{booking.numChildren > 0 ? `, ${booking.numChildren} trẻ em` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full border-t border-dashed border-slate-200"></div>

                {/* Thông tin thanh toán */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Chi tiết thanh toán</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Mã giao dịch</span>
                      <span className="text-sm font-bold text-slate-800">{code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Thời gian</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {dmyTime(booking.paymentRefs?.[booking.paymentRefs.length - 1]?.at || booking.createdAt)}
                      </span>
                    </div>
                    {isSuccess && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Hình thức thanh toán</span>
                        <span className="text-xs font-bold uppercase px-2 py-1 bg-emerald-100 text-[var(--success)] rounded-md tracking-wider">
                          {isFullPayment ? "Thanh toán toàn bộ" : "Thanh toán đặt cọc"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tổng tiền */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-slate-500">Tổng tiền tour</span>
                    <span className="text-sm font-bold text-slate-700">{vnd(booking.totalPrice)}</span>
                  </div>
                  {isSuccess && (
                    <div className="flex justify-between items-end border-t border-dashed border-slate-200 pt-3 mt-1">
                      <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Số tiền đã trả
                      </span>
                      <span className="text-2xl font-extrabold text-[var(--accent)]">
                        {vnd(booking.paidAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Chú thích riêng cho Đặt cọc */}
                {isSuccess && !isFullPayment && (
                   <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3 mt-4">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0"></div>
                      <p className="text-[13px] text-orange-900 font-medium leading-relaxed">
                        Bạn đã thanh toán cọc. Số tiền còn lại <strong className="font-extrabold text-[var(--accent)]">{vnd(booking.totalPrice - booking.paidAmount)}</strong> vui lòng thanh toán đầy đủ trước ngày khởi hành.
                      </p>
                   </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500 font-medium">Không có dữ liệu đơn hàng.</p>
              </div>
            )}
          </div>
        </div>

        {/* Cạnh dưới răng cưa giả lập hóa đơn */}
        <div className="w-full h-4 bg-white" style={{
            backgroundImage: "radial-gradient(circle at 10px 10px, transparent 0, transparent 10px, #1D3B72 10px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 -10px",
            backgroundRepeat: "repeat-x"
        }}></div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 relative z-10 px-2">
          <Link
            href="/user/history"
            className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-[var(--accent)] hover:brightness-110 text-white rounded-2xl font-bold transition-all shadow-xl shadow-orange-500/20"
          >
            <Receipt size={20} /> Xem lịch sử <ChevronRight size={18} className="opacity-70 ml-1" />
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold transition-all backdrop-blur-sm"
          >
            <Home size={20} /> Về trang chủ
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--brand-primary)] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-white opacity-50" />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}
