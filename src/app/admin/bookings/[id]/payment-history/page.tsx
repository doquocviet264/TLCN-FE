"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useBookingPaymentHistory,
  useRefundBookingPayment,
} from "#/hooks/bookings-hook/useAdminBookings";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  RefreshCw,
  Download,
  AlertCircle,
} from "lucide-react";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString("vi-VN") +
    " " +
    date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
};

const getPaymentStatusBadge = (amount: number, totalPrice: number) => {
  if (amount >= totalPrice) {
    return (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
        Đã thanh toán
      </span>
    );
  } else if (amount > 0) {
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
        Bán thành
      </span>
    );
  }
  return (
    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
      Chưa thanh toán
    </span>
  );
};

export default function PaymentHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { data, isLoading } = useBookingPaymentHistory(id);
  const refundMutation = useRefundBookingPayment();

  const [refundDialog, setRefundDialog] = useState<{
    visible: boolean;
    amount?: number;
    reason?: string;
  }>({ visible: false });

  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleRefund = (amount?: number) => {
    setConfirmDialog({
      title: "Xác nhận hoàn tiền",
      message: `Bạn chắc chắn muốn hoàn ${formatCurrency(amount || 0)}?`,
      onConfirm: () => {
        refundMutation.mutate(
          {
            id: id,
            refundAmount: amount,
            reason: refundDialog.reason,
          },
          {
            onSuccess: (result) => {
              showSuccess(result.message);
              setRefundDialog({ visible: false });
            },
            onError: (error: any) => {
              showError(error.response?.data?.message || "Hoàn tiền thất bại");
            },
          }
        );
      },
    });
  };

  const handleExportHistory = () => {
    if (!data) return;

    const csv = [
      ["Booking Code", data.booking.code],
      ["Payment Method", data.booking.paymentMethod],
      ["Total Price", formatCurrency(data.booking.totalPrice)],
      ["Paid Amount", formatCurrency(data.booking.paidAmount)],
      ["Remaining", formatCurrency(data.booking.remaining)],
      [""],
      ["Date", "Provider", "Ref", "Amount", "Note"],
      ...data.paymentHistory.map((p) => [
        formatDate(p.at),
        p.provider,
        p.ref,
        formatCurrency(p.amount),
        p.note || "",
      ]),
    ];

    const csvContent = csv
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-history-${data.booking.code}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <Toast {...toast} onClose={hideToast} />
      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 transition"
        >
          <ArrowLeft size={20} />
          Quay lại
        </button>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Đang tải dữ liệu...</p>
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Lịch sử thanh toán
                </h1>
                <p className="text-gray-400">
                  Booking:{" "}
                  <span className="font-mono text-blue-400">
                    {data.booking.code}
                  </span>
                </p>
              </div>
              <button
                onClick={handleExportHistory}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>

            {/* Booking Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-gray-400 text-sm">Phương thức</p>
                <p className="text-white font-semibold mt-1">
                  {data.booking.paymentMethod}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-gray-400 text-sm">Tổng giá</p>
                <p className="text-emerald-400 font-semibold text-lg mt-1">
                  {formatCurrency(data.booking.totalPrice)}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-gray-400 text-sm">Đã thanh toán</p>
                <p className="text-blue-400 font-semibold text-lg mt-1">
                  {formatCurrency(data.booking.paidAmount)}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-gray-400 text-sm">Còn thiếu</p>
                <p
                  className={`font-semibold text-lg mt-1 ${
                    data.booking.remaining > 0
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {formatCurrency(data.booking.remaining)}
                </p>
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-8 bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm font-medium">
                  Tiến độ thanh toán
                </p>
                <p className="text-white font-semibold">
                  {Math.round(
                    (data.booking.paidAmount / data.booking.totalPrice) * 100
                  )}
                  %
                </p>
              </div>
              <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (data.booking.paidAmount / data.booking.totalPrice) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Payment History Table */}
            <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock size={20} />
                  Lịch sử giao dịch ({data.paymentHistory.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700/50 border-b border-slate-700">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Ngày giờ
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Nhà cung cấp
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Mã tham chiếu
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-300">
                        Số tiền
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.paymentHistory.length > 0 ? (
                      data.paymentHistory.map((payment, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-slate-700 hover:bg-slate-700/50 transition ${
                            payment.amount < 0 ? "bg-red-900/20" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-white text-sm">
                            {formatDate(payment.at)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                payment.provider === "refund"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {payment.provider}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300 font-mono text-sm">
                            {payment.ref}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-semibold ${
                              payment.amount < 0
                                ? "text-red-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {payment.amount < 0 ? "-" : "+"}
                            {formatCurrency(Math.abs(payment.amount))}
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-sm">
                            {payment.note || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-400"
                        >
                          Không có lịch sử giao dịch
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Refund Section */}
            {data.booking.remaining > 0 && (
              <div className="mt-8 bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle
                    className="text-yellow-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <div className="flex-1">
                    <h3 className="text-yellow-200 font-semibold mb-2">
                      Hoàn tiền
                    </h3>
                    <p className="text-yellow-100/80 text-sm mb-4">
                      Booking này vẫn còn thiếu{" "}
                      {formatCurrency(data.booking.remaining)}. Bạn có thể hoàn
                      lại một phần hoặc toàn bộ số tiền đã thanh toán.
                    </p>
                    <button
                      onClick={() => setRefundDialog({ visible: true })}
                      disabled={refundMutation.isPending}
                      className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw size={18} />
                      Hoàn tiền
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Refund Dialog */}
      {refundDialog.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Hoàn tiền</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Số tiền hoàn (nếu không nhập sẽ hoàn toàn bộ)
                </label>
                <input
                  type="number"
                  value={refundDialog.amount || ""}
                  onChange={(e) =>
                    setRefundDialog({
                      ...refundDialog,
                      amount: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="Nhập số tiền"
                  className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Lý do hoàn
                </label>
                <textarea
                  value={refundDialog.reason || ""}
                  onChange={(e) =>
                    setRefundDialog({ ...refundDialog, reason: e.target.value })
                  }
                  placeholder="Nhập lý do hoàn tiền"
                  rows={3}
                  className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRefundDialog({ visible: false })}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={() => handleRefund(refundDialog.amount)}
                disabled={refundMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {refundMutation.isPending ? "Đang xử lý..." : "Xác nhận hoàn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
