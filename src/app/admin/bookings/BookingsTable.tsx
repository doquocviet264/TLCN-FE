"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookingData,
  updateBookingStatus,
  deleteAdminBooking,
  updateBookingPaymentStatus
} from "@/lib/admin/adminBookingApi";

const statusLabels: Record<string, string> = {
  pending:   "Chờ thanh toán",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusBadgeClass: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

// Format VND currency
const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Simple date formatter
const formatDate = (dateStr: string, format: string = "dd/MM/yyyy") => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  if (format === "dd/MM/yyyy HH:mm") {
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  if (format === "HH:mm") {
    return `${hours}:${minutes}`;
  }
  return `${day}/${month}/${year}`;
};

interface BookingsTableProps {
  bookings: BookingData[];
}

export default function BookingsTable({ bookings }: BookingsTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    type?: "danger" | "warning";
  }>({ isOpen: false, title: "", message: "", action: () => {}, type: "warning" });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "confirmed" | "cancelled" }) =>
      updateBookingStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      const message = status === "confirmed" ? "Đơn đặt tour đã được xác nhận!" : "Đơn đặt tour đã bị hủy!";
      showSuccess(message);
      setConfirmDialog((d) => ({ ...d, isOpen: false }));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Không thể cập nhật đơn đặt tour";
      showError(message);
      setConfirmDialog((d) => ({ ...d, isOpen: false }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      showSuccess("Xóa đơn đặt tour thành công!");
      setConfirmDialog((d) => ({ ...d, isOpen: false }));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Không thể xóa đơn đặt tour";
      showError(message);
      setConfirmDialog((d) => ({ ...d, isOpen: false }));
    },
  });

  // Mutation xác nhận thanh toán thủ công
  const paymentMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount?: number }) =>
      updateBookingPaymentStatus(id, "mark_paid", amount, "manual"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      showSuccess("Xác nhận thanh toán thành công!");
      setConfirmDialog((d) => ({ ...d, isOpen: false }));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Không thể xác nhận thanh toán";
      showError(message);
      setConfirmDialog((d) => ({ ...d, isOpen: false }));
    },
  });



  if (bookings.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">Không có đơn đặt tour nào</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[150px]">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[240px]">
                  Tour
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[80px]">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {booking.code}
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="font-medium text-slate-900 max-w-[140px] truncate" title={booking.fullName}>
                    {booking.fullName}
                  </div>
                  <div className="text-slate-500 text-xs max-w-[140px] truncate" title={booking.email}>
                    {booking.email}
                  </div>
                  <div className="text-slate-500 text-xs">{booking.phoneNumber}</div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="font-medium text-slate-900 max-w-[230px] truncate" title={booking.tourId?.title}>
                    {booking.tourId?.title}
                  </div>
                  <div className="text-slate-500 text-xs max-w-[230px] truncate" title={booking.tourId?.destination}>
                    {booking.tourId?.destination}
                  </div>
                  <div className="text-slate-500 text-xs">
                    {booking.tourId?.startDate && formatDate(booking.tourId.startDate)}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  <div className="font-medium">{booking.numAdults} NL</div>
                  <div className="text-slate-500 text-xs">{booking.numChildren} TE</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <div className="font-medium text-slate-900">
                    {formatVND(booking.totalPrice)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Đã trả: <span className="text-emerald-600 font-medium">{formatVND(booking.paidAmount || 0)}</span>
                  </div>
                </td>

                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusBadgeClass[booking.bookingStatus] ?? "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {statusLabels[booking.bookingStatus] ?? booking.bookingStatus}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-[11px] text-slate-500 leading-tight">
                  <div>{formatDate(booking.createdAt, "dd/MM/yyyy")}</div>
                  <div className="text-slate-400">{formatDate(booking.createdAt, "HH:mm")}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-1 justify-center">
                    <button
                      title="Xem chi tiết"
                      onClick={() => router.push(`/admin/bookings/${booking._id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <i className="ri-eye-line text-lg"></i>
                    </button>

                    {/* Nút xác nhận thanh toán */}
                    {booking.bookingStatus !== "cancelled" && (booking.totalPrice - (booking.paidAmount || 0)) > 0 && (
                      <button
                        title="Xác nhận thanh toán"
                        onClick={() => {
                          const remaining = booking.totalPrice - (booking.paidAmount || 0);
                          setConfirmDialog({
                            isOpen: true,
                            title: "Xác nhận thanh toán",
                            message: `Xác nhận khách hàng ${booking.fullName} đã thanh toán ${formatVND(remaining)}? Đơn sẽ được chuyển sang trạng thái "Đã xác nhận".`,
                            action: () => paymentMutation.mutate({ id: booking._id, amount: remaining }),
                            type: "warning",
                          });
                        }}
                        disabled={paymentMutation.isPending}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                      >
                        <i className="ri-money-dollar-circle-line text-lg"></i>
                      </button>
                    )}

                    {/* Nút xác nhận cọc */}
                    {booking.bookingStatus === "pending" && !booking.depositPaid && (
                      <button
                        title="Xác nhận đặt cọc"
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            title: "Xác nhận đặt cọc",
                            message: `Xác nhận khách hàng ${booking.fullName} đã đặt cọc ${formatVND(booking.totalPrice * 0.5)}?`,
                            action: () => paymentMutation.mutate({ id: booking._id, amount: booking.totalPrice * 0.5 }),
                            type: "warning",
                          })
                        }
                        disabled={paymentMutation.isPending}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition disabled:opacity-50"
                      >
                        <i className="ri-secure-payment-line text-lg"></i>
                      </button>
                    )}

                    {/* Nút hủy đơn */}
                    {booking.bookingStatus === "pending" && (
                      <button
                        title="Hủy đơn"
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            title: "Hủy đơn đặt tour",
                            message: `Bạn có chắc chắn muốn hủy đơn ${booking.code}? Slot sẽ được hoàn trả.`,
                            action: () => statusMutation.mutate({ id: booking._id, status: "cancelled" }),
                            type: "danger",
                          })
                        }
                        disabled={statusMutation.isPending}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      >
                        <i className="ri-close-circle-line text-lg"></i>
                      </button>
                    )}

                    {/* Nút xóa */}
                    <button
                      title="Xoá vĩnh viễn"
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          title: "Xóa đơn đặt tour",
                          message: `Xóa đơn ${booking.code}? Hành động này không thể hoàn tác.`,
                          action: () => deleteMutation.mutate(booking._id),
                          type: "danger",
                        })
                      }
                      disabled={deleteMutation.isPending}
                      className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                    >
                      <i className="ri-delete-bin-6-line text-lg"></i>
                    </button>
                  </div>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={() => {
          confirmDialog.action();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type={confirmDialog.type}
      />
    </>
  );
}
