"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  MapPinIcon,
  ArrowLeft,
  XCircle,
  Receipt,
  Printer,
  History,
} from "lucide-react";
import {
  useBookingDetail,
  useCancelBooking,
} from "#/hooks/bookings-hook/useBooking";

// --- Helpers ---
const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val
  );

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("vi-VN");
};

// --- Component ---
export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const bookingCode = decodeURIComponent(id);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: booking, isLoading, isError } = useBookingDetail(bookingCode);

  const cancelMut = useCancelBooking({
    onSuccess: () => {
      toast.success("Đã hủy đơn hàng thành công");
    },
  });

  // --- Render Loading ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
          <div className="h-40 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // --- Render Error ---
  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 flex justify-center">
        <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-sm text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-bold text-slate-800">
            Không tìm thấy đơn hàng
          </h2>
          <p className="text-slate-500 mt-2">
            Mã đơn hàng:{" "}
            <span className="font-mono font-bold">{bookingCode}</span>
          </p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // --- Logic Status ---
  const isPaidFull = (booking.paidAmount || 0) >= booking.totalPrice;
  const isCancelable = ["p"].includes(booking.bookingStatus); // Chỉ Pending mới huỷ đc

  const renderStatusBadge = () => {
    switch (booking.bookingStatus) {
      case "p":
        return (
          <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-bold border border-amber-200">
            <Clock size={16} /> Chờ xử lý
          </span>
        );
      case "c":
        return (
          <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-bold border border-emerald-200">
            <CheckCircle2 size={16} /> Đã xác nhận
          </span>
        );
      case "x":
        return (
          <span className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-bold border border-red-200">
            <XCircle size={16} /> Đã hủy
          </span>
        );
      case "f":
        return (
          <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-bold border border-blue-200">
            <CheckCircle2 size={16} /> Hoàn thành
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
    <ConfirmDialog
      isOpen={showCancelConfirm}
      title="Hủy đơn hàng"
      message="Bạn chắc chắn muốn huỷ booking này? Hành động này không thể hoàn tác."
      confirmText="Hủy đơn"
      cancelText="Quay lại"
      type="danger"
      onConfirm={() => {
        setShowCancelConfirm(false);
        cancelMut.mutate(bookingCode);
      }}
      onCancel={() => setShowCancelConfirm(false)}
    />
    <div className="min-h-screen bg-[#f8f9fa] py-8 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header Navigation */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-2 flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} /> Quay lại danh sách
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Chi tiết đơn hàng
              </h1>
              <span className="font-mono text-sm text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                #{booking.code}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-all">
              <Printer size={16} /> In vé
            </button>
            {renderStatusBadge()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CỘT TRÁI: TOUR & KHÁCH (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. TOUR INFO */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 overflow-hidden relative">
              <div className="flex flex-col md:flex-row gap-5 relative z-10">
                {/* Ảnh Tour */}
                <div className="w-full md:w-40 h-40 relative rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-slate-100">
                  {booking.tourImage ? (
                    <Image
                      src={booking.tourImage}
                      alt={booking.tourTitle || "Tour"}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                {/* Thông tin Tour */}
                <div className="flex-1 space-y-3">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {booking.tourTitle || "Thông tin tour đang cập nhật"}
                  </h2>

                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin
                        className="mt-0.5 text-blue-500 shrink-0"
                        size={16}
                      />
                      <span className="font-medium">
                        {booking.tourDestination || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-blue-500 shrink-0" size={16} />
                      <span>
                        Khởi hành: <b>{formatDate(booking.startDate)}</b>{" "}
                        {booking.endDate &&
                          `— Về: ${formatDate(booking.endDate)}`}
                      </span>
                    </div>
                    {booking.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="text-blue-500 shrink-0" size={16} />
                        <span>Thời gian: {booking.time}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Decor background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            </div>

            {/* 2. THÔNG TIN KHÁCH */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-5">
                <Users size={20} className="text-blue-600" /> Thông tin liên hệ
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">
                    Họ và tên
                  </label>
                  <p className="font-medium text-slate-900 text-base">
                    {booking.fullName}
                  </p>
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">
                    Số điện thoại
                  </label>
                  <p className="font-medium text-slate-900 text-base flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />{" "}
                    {booking.phoneNumber}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">
                    Email nhận vé
                  </label>
                  <p className="font-medium text-slate-900 text-base flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />{" "}
                    {booking.email}
                  </p>
                </div>
                {booking.address && (
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase font-bold text-slate-400 mb-1 block">
                      Địa chỉ
                    </label>
                    <p className="font-medium text-slate-900 text-base flex items-center gap-2">
                      <MapPinIcon size={14} className="text-slate-400" />{" "}
                      {booking.address}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex gap-6">
                <div className="bg-blue-50 px-4 py-2 rounded-lg text-center min-w-[80px]">
                  <span className="block text-xl font-bold text-blue-700">
                    {booking.numAdults}
                  </span>
                  <span className="text-xs font-medium text-blue-600">
                    Người lớn
                  </span>
                </div>
                <div className="bg-purple-50 px-4 py-2 rounded-lg text-center min-w-[80px]">
                  <span className="block text-xl font-bold text-purple-700">
                    {booking.numChildren}
                  </span>
                  <span className="text-xs font-medium text-purple-600">
                    Trẻ em
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: THANH TOÁN (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-5">
                <CreditCard size={20} className="text-emerald-600" /> Thông tin
                thanh toán
              </h3>

              {/* Chi tiết giá */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Tổng tiền tour</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(booking.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold text-base items-center pt-2 border-t border-dashed border-slate-200">
                  <span>Đã thanh toán</span>
                  <span className="text-lg">
                    {formatCurrency(booking.paidAmount || 0)}
                  </span>
                </div>
                {!isPaidFull && (
                  <div className="flex justify-between text-rose-600 font-bold text-base items-center">
                    <span>Còn lại</span>
                    <span>
                      {formatCurrency(
                        booking.totalPrice - (booking.paidAmount || 0)
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Lịch sử giao dịch */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                  <History size={12} /> Lịch sử giao dịch
                </h4>

                {booking.paymentRefs && booking.paymentRefs.length > 0 ? (
                  <div className="space-y-3">
                    {booking.paymentRefs.map((ref: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-sm"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800 uppercase">
                            {ref.provider || "Thanh toán"}
                          </span>
                          <span className="text-emerald-600 font-bold">
                            +{formatCurrency(ref.amount)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDateTime(ref.at)}
                        </div>
                        {ref.note && (
                          <div className="text-xs text-slate-400 mt-1 italic">
                            {ref.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-sm italic">
                    Chưa có giao dịch nào
                  </div>
                )}
              </div>

              {/* Actions Button */}
              <div className="mt-auto space-y-3">
                {/* Nút thanh toán tiếp (nếu chưa đủ tiền) */}
                {booking.bookingStatus === "p" && !isPaidFull && (
                  <button
                    onClick={() =>
                      router.push(`/user/checkout?bookingCode=${bookingCode}`)
                    }
                    className="w-full py-3.5 bg-[#003580] hover:bg-[#002860] text-white font-bold rounded-xl shadow-lg shadow-blue-900/10 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    Thanh toán ngay (
                    {formatCurrency(
                      booking.totalPrice - (booking.paidAmount || 0)
                    )}
                    )
                  </button>
                )}

                {/* Nút Hủy */}
                {isCancelable && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={cancelMut.isPending}
                    className="w-full py-3.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelMut.isPending ? "Đang xử lý..." : "Hủy Đơn Hàng"}
                  </button>
                )}

                {/* Info Note */}
                <p className="text-xs text-slate-400 text-center px-4">
                  Cần hỗ trợ? Gọi ngay{" "}
                  <a
                    href="tel:19001234"
                    className="text-blue-600 hover:underline"
                  >
                    1900 1234
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
