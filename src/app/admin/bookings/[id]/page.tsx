"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminBookingById,
  updateBookingStatus,
  updateBookingPaymentStatus,
  refundBookingPayment,
  type BookingData,
} from "@/lib/admin/adminBookingApi";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast, showSuccess, showError, hideToast } = useToast();
  const queryClient = useQueryClient();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: () => {},
  });

  // Fetch booking data
  useEffect(() => {
    (async () => {
      try {
        const bookingData = await getAdminBookingById(id);
        setBooking(bookingData);
      } catch {
        showError("Không thể tải thông tin đơn đặt tour");
        setTimeout(() => router.push("/admin/bookings"), 2000);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, router, showError]);

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: (status: "confirmed" | "cancelled" | "completed") => updateBookingStatus(id, status),
    onSuccess: (data) => {
      setBooking(data);
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      showSuccess("Cập nhật trạng thái thành công!");
      setActiveAction(null);
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Không thể cập nhật trạng thái");
      setActiveAction(null);
    },
  });

  // Payment status mutation
  const paymentMutation = useMutation({
    mutationFn: () => updateBookingPaymentStatus(id, "mark_paid"),
    onSuccess: (data) => {
      setBooking(data.booking);
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      showSuccess("Đánh dấu đã thanh toán thành công!");
      setActiveAction(null);
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Không thể cập nhật thanh toán");
      setActiveAction(null);
    },
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: () => refundBookingPayment(id),
    onSuccess: (data) => {
      setBooking(data.booking);
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      showSuccess("Hoàn tiền thành công!");
      setActiveAction(null);
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Không thể hoàn tiền");
      setActiveAction(null);
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Đã xác nhận", color: "bg-emerald-100 text-emerald-800" },
      completed: { label: "Hoàn thành", color: "bg-blue-100 text-blue-800" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
    };
    const { label, color } = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
        {label}
      </span>
    );
  };

  const getPaymentStatusBadge = (booking: BookingData) => {
    const paidPercentage = (booking.paidAmount / booking.totalPrice) * 100;
    
    if (paidPercentage >= 100) {
      return <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">Đã thanh toán</span>;
    } else if (paidPercentage > 0) {
      return <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">Thanh toán một phần</span>;
    } else {
      return <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">Chưa thanh toán</span>;
    }
  };

  const handleConfirmAction = (title: string, message: string, action: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      action,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <span className="text-slate-600">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="text-center">
          <p className="text-slate-600">Không tìm thấy đơn đặt tour</p>
          <Link
            href="/admin/bookings"
            className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/admin/bookings"
                className="p-2 hover:bg-slate-200 rounded-lg transition"
              >
                ← Quay lại
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Chi tiết đơn đặt tour
                </h1>
                <p className="text-slate-600">Mã đơn: <span className="font-semibold">{booking.code}</span></p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {getStatusBadge(booking.bookingStatus)}
              {getPaymentStatusBadge(booking)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Thông tin khách hàng</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
                    <p className="text-slate-900 font-semibold">{booking.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <p className="text-slate-700">{booking.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Điện thoại</label>
                    <p className="text-slate-700">{booking.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                    <p className="text-slate-700">{booking.address}</p>
                  </div>
                </div>
              </div>

              {/* Tour Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Thông tin tour</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên tour</label>
                    <p className="text-slate-900 font-semibold">{booking.tourId?.title || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Điểm đến</label>
                    <p className="text-slate-700">{booking.tourId?.destination || "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số người lớn</label>
                      <p className="text-slate-700">{booking.numAdults} người</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số trẻ em</label>
                      <p className="text-slate-700">{booking.numChildren} trẻ</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Lịch sử thanh toán</h2>
                  <Link
                    href={`/admin/bookings/${booking._id}/payment-history`}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    Xem chi tiết →
                  </Link>
                </div>
                <div className="space-y-2">
                  {booking.paymentRefs && booking.paymentRefs.length > 0 ? (
                    booking.paymentRefs.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{payment.provider}</p>
                          <p className="text-sm text-slate-600">Ref: {payment.ref}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-slate-600">{formatDate(payment.at)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-center py-4">Chưa có giao dịch nào</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Tóm tắt thanh toán</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Tổng giá:</span>
                    <span className="font-semibold">{formatCurrency(booking.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Đã thanh toán:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(booking.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-slate-700">Còn lại:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(booking.totalPrice - booking.paidAmount)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Phương thức: <span className="font-medium">{booking.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Thông tin đặt tour</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Ngày đặt:</span>
                    <span className="font-medium">{formatDate(booking.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Cập nhật:</span>
                    <span className="font-medium">{formatDate(booking.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Mã đặt tour:</span>
                    <span className="font-medium">{booking.code}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Hành động</h2>
                <div className="space-y-3">
                  {booking.bookingStatus === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleConfirmAction(
                            "Xác nhận đơn đặt tour",
                            "Bạn có chắc chắn muốn xác nhận đơn đặt tour này?",
                            () => {
                              setActiveAction("confirm");
                              statusMutation.mutate("confirmed");
                            }
                          )
                        }
                        disabled={activeAction === "confirm"}
                        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {activeAction === "confirm" ? "Đang xử lý..." : "Xác nhận đơn"}
                      </button>
                      <button
                        onClick={() =>
                          handleConfirmAction(
                            "Hủy đơn đặt tour",
                            "Bạn có chắc chắn muốn hủy đơn đặt tour này? Slot sẽ được hoàn trả.",
                            () => {
                              setActiveAction("cancel");
                              statusMutation.mutate("cancelled");
                            }
                          )
                        }
                        disabled={activeAction === "cancel"}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {activeAction === "cancel" ? "Đang xử lý..." : "Hủy đơn"}
                      </button>
                    </>
                  )}

                  {/* Nút xác nhận thanh toán - hiện khi còn tiền chưa trả và đơn chưa bị hủy */}
                  {booking.bookingStatus !== "cancelled" && booking.paidAmount < booking.totalPrice && (
                    <button
                      onClick={() =>
                        handleConfirmAction(
                          "Xác nhận thanh toán",
                          `Xác nhận khách hàng đã thanh toán ${formatCurrency(booking.totalPrice - booking.paidAmount)}?`,
                          () => {
                            setActiveAction("payment");
                            paymentMutation.mutate();
                          }
                        )
                      }
                      disabled={activeAction === "payment"}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {activeAction === "payment" ? "Đang xử lý..." : "Xác nhận thanh toán"}
                    </button>
                  )}

                  {/* Nút xác nhận đặt cọc - hiện khi chưa đặt cọc */}
                  {booking.bookingStatus === "pending" && !booking.depositPaid && booking.paidAmount === 0 && (
                    <button
                      onClick={() =>
                        handleConfirmAction(
                          "Xác nhận đặt cọc",
                          `Xác nhận khách hàng đã đặt cọc ${formatCurrency(booking.totalPrice * 0.5)}?`,
                          () => {
                            setActiveAction("deposit");
                            paymentMutation.mutate();
                          }
                        )
                      }
                      disabled={activeAction === "deposit"}
                      className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                    >
                      {activeAction === "deposit" ? "Đang xử lý..." : "Xác nhận đặt cọc"}
                    </button>
                  )}

                  {booking.paidAmount > 0 && (
                    <button
                      onClick={() =>
                        handleConfirmAction(
                          "Hoàn tiền",
                          "Bạn có chắc chắn muốn hoàn tiền cho đơn đặt tour này?",
                          () => {
                            setActiveAction("refund");
                            refundMutation.mutate();
                          }
                        )
                      }
                      disabled={activeAction === "refund"}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                    >
                      {activeAction === "refund" ? "Đang xử lý..." : "Hoàn tiền"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
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
        type="warning"
      />
    </>
  );
}