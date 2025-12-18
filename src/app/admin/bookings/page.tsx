"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminBookings,
  deleteAdminBooking,
} from "@/lib/admin/adminBookingApi";
import { Toast, useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import BookingsTable from "./BookingsTable";

export default function BookingsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | "p" | "c" | "x"
  >("");
  const queryClient = useQueryClient();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    bookingId: string;
    bookingCode: string;
  }>({ isOpen: false, bookingId: "", bookingCode: "" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminBookings", page, searchTerm, statusFilter],
    queryFn: () =>
      getAdminBookings({
        page,
        limit: 20,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      showSuccess("Xóa đơn đặt tour thành công!");
      setConfirmDelete({ isOpen: false, bookingId: "", bookingCode: "" });
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Không thể xóa đơn đặt tour");
      setConfirmDelete({ isOpen: false, bookingId: "", bookingCode: "" });
    },
  });

  const totalPages = data ? Math.ceil(data.total / (data.limit || 20)) : 0;

  const confirmDeleteAction = () => {
    if (confirmDelete.bookingId) {
      deleteMutation.mutate(confirmDelete.bookingId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Quản Lý Đặt Tour
        </h1>
        <p className="text-slate-600">Quản lý các đơn đặt tour, thanh toán và trạng thái khách hàng</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm theo tên khách, email, code đơn..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "" | "p" | "c" | "x");
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="p">Chờ xác nhận</option>
              <option value="c">Đã xác nhận</option>
              <option value="x">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-slate-600">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          Lỗi: {error instanceof Error ? error.message : "Không thể tải dữ liệu"}
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && data && (
        <>
          {data.data && data.data.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <BookingsTable bookings={data.data} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-slate-600">Không có đơn đặt tour nào.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-lg shadow-md p-4">
              <p className="text-slate-600 mb-4 md:mb-0">
                Tổng cộng: <span className="font-bold text-slate-900">{data.total}</span> đơn đặt
                tour | Trang{" "}
                <span className="font-bold text-orange-600">{page}</span> của{" "}
                <span className="font-bold">{totalPages}</span>
              </p>

              {/* Pagination Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Trước
                </button>

                {/* Page Numbers */}
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-2 rounded-lg transition ${
                      page === i + 1
                        ? "bg-orange-500 text-white"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Xóa đơn đặt tour"
        message={`Bạn có chắc chắn muốn xóa đơn ${confirmDelete.bookingCode}? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ isOpen: false, bookingId: "", bookingCode: "" })}
        type="danger"
      />
    </div>
  );
}
