"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookingData,
  updateBookingStatus,
  deleteAdminBooking,
  updateBookingPaymentStatus
} from "@/lib/admin/adminBookingApi";

const statusLabels: Record<"p" | "c" | "x", string> = {
  p: "Chờ thanh toán",
  c: "Đã xác nhận",
  x: "Đã hủy",
};

const statusBadgeClass: Record<"p" | "c" | "x", string> = {
  p: "bg-yellow-100 text-yellow-800",
  c: "bg-green-100 text-green-800",
  x: "bg-red-100 text-red-800",
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
  return `${day}/${month}/${year}`;
};

interface BookingsTableProps {
  bookings: BookingData[];
}

export default function BookingsTable({ bookings }: BookingsTableProps) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    type?: "danger" | "warning";
  }>({ isOpen: false, title: "", message: "", action: () => {}, type: "warning" });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "c" | "x" }) =>
      updateBookingStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      const message = status === "c" ? "Đơn đặt tour đã được xác nhận!" : "Đơn đặt tour đã bị hủy!";
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

  const toggleSelectAll = () => {
    if (selectedIds.size === bookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bookings.map((b) => b._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  if (bookings.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">Không có đơn đặt tour nào</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                type="checkbox"
                checked={selectedIds.size === bookings.length && bookings.length > 0}
          
                onChange={toggleSelectAll}
                className="rounded"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Mã đơn
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Khách hàng
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Tour
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Số lượng
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Giá
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Cọc
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Ngày tạo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {bookings.map((booking) => (
            <tr key={booking._id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(booking._id)}
                  onChange={() => toggleSelect(booking._id)}
                  className="rounded"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {booking.code}
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="font-medium text-gray-900">{booking.fullName}</div>
                <div className="text-gray-600 text-xs">{booking.email}</div>
                <div className="text-gray-600 text-xs">{booking.phoneNumber}</div>
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="font-medium text-gray-900">{booking.tourId?.title}</div>
                <div className="text-gray-600 text-xs">{booking.tourId?.destination}</div>
                <div className="text-gray-600 text-xs">
                  {booking.tourId?.startDate && formatDate(booking.tourId.startDate)}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <div>{booking.numAdults} người lớn</div>
                <div className="text-gray-600">{booking.numChildren} trẻ em</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="font-medium text-gray-900">
                  {formatVND(booking.totalPrice)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Đã trả: <span className="text-green-600 font-medium">{formatVND(booking.paidAmount || 0)}</span>
                </div>
                {(booking.totalPrice - (booking.paidAmount || 0)) > 0 && (
                  <div className="text-xs text-orange-600 mt-0.5">
                    Còn lại: {formatVND(booking.totalPrice - (booking.paidAmount || 0))}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="font-medium text-gray-900">
                  {formatVND(booking.depositAmount || 0)}
                </div>
                <div className={`text-xs mt-1 ${booking.depositPaid ? "text-green-600" : "text-red-600"}`}>
                  {booking.depositPaid ? "✓ Đã đặt cọc" : "✗ Chưa đặt cọc"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusBadgeClass[booking.bookingStatus]
                  }`}
                >
                  {statusLabels[booking.bookingStatus]}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {formatDate(booking.createdAt, "dd/MM/yyyy HH:mm")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex gap-2">
                  <button
                    title="Xem chi tiết"
                    onClick={() => window.location.href = `/admin/bookings/${booking._id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <i className="ri-eye-line text-lg"></i>
                  </button>

                  {/* Nút xác nhận thanh toán - hiện khi còn tiền chưa trả */}
                  {booking.bookingStatus !== "x" && (booking.totalPrice - (booking.paidAmount || 0)) > 0 && (
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
                      className="text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                    >
                      <i className="ri-money-dollar-circle-line text-lg"></i>
                    </button>
                  )}

                  {/* Nút xác nhận cọc - hiện khi chưa đặt cọc */}
                  {booking.bookingStatus === "p" && !booking.depositPaid && (
                    <button
                      title="Xác nhận đặt cọc"
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          title: "Xác nhận đặt cọc",
                          message: `Xác nhận khách hàng ${booking.fullName} đã đặt cọc ${formatVND(booking.depositAmount || 0)}?`,
                          action: () => paymentMutation.mutate({ id: booking._id, amount: booking.depositAmount }),
                          type: "warning",
                        })
                      }
                      disabled={paymentMutation.isPending}
                      className="text-amber-600 hover:text-amber-800 disabled:opacity-50"
                    >
                      <i className="ri-wallet-3-line text-lg"></i>
                    </button>
                  )}

                  {/* Nút hủy đơn - chỉ hiện khi đang pending */}
                  {booking.bookingStatus === "p" && (
                    <button
                      title="Hủy đơn"
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          title: "Hủy đơn đặt tour",
                          message: `Bạn có chắc chắn muốn hủy đơn ${booking.code}? Slot sẽ được hoàn trả.`,
                          action: () => statusMutation.mutate({ id: booking._id, status: "x" }),
                          type: "danger",
                        })
                      }
                      disabled={statusMutation.isPending}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
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
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
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
